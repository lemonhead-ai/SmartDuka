import logging

from fastapi import FastAPI, HTTPException, Request, status
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

from src.contracts.errors import ErrorDetail, ErrorResponse


class ApplicationError(Exception):
    def __init__(self, detail: str, status_code: int = status.HTTP_400_BAD_REQUEST) -> None:
        self.detail = detail
        self.status_code = status_code
        super().__init__(detail)


async def application_error_handler(request: Request, error: ApplicationError) -> JSONResponse:
    response = ErrorResponse(detail=error.detail, request_id=request.state.request_id)
    return JSONResponse(status_code=error.status_code, content=response.model_dump())


async def http_error_handler(request: Request, error: HTTPException) -> JSONResponse:
    detail = error.detail if isinstance(error.detail, str) else "Request failed."
    response = ErrorResponse(detail=detail, request_id=request.state.request_id)
    return JSONResponse(status_code=error.status_code, content=response.model_dump())


async def validation_error_handler(request: Request, error: RequestValidationError) -> JSONResponse:
    errors = [
        ErrorDetail(field=".".join(str(part) for part in issue["loc"]), message=issue["msg"])
        for issue in error.errors()
    ]
    response = ErrorResponse(
        detail="Request validation failed.", request_id=request.state.request_id, errors=errors
    )
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
        content=response.model_dump(),
    )


async def unhandled_error_handler(request: Request, error: Exception) -> JSONResponse:
    logging.getLogger(__name__).exception("Unhandled request error", exc_info=error)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content=ErrorResponse(
            detail="An unexpected server error occurred.", request_id=request.state.request_id
        ).model_dump(),
    )


def register_exception_handlers(app: FastAPI) -> None:
    app.add_exception_handler(ApplicationError, application_error_handler)
    app.add_exception_handler(HTTPException, http_error_handler)
    app.add_exception_handler(RequestValidationError, validation_error_handler)
    app.add_exception_handler(Exception, unhandled_error_handler)
