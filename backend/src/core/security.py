from uuid import uuid4


def create_request_id() -> str:
    """Create an opaque correlation identifier without introducing authentication."""

    return str(uuid4())
