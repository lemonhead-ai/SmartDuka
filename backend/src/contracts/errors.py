from pydantic import BaseModel, Field


class ErrorDetail(BaseModel):
    field: str | None = None
    message: str


class ErrorResponse(BaseModel):
    detail: str
    request_id: str | None = None
    errors: list[ErrorDetail] = Field(default_factory=list)
