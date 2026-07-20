import base64
import hashlib
import hmac
import secrets
from uuid import uuid4


def create_request_id() -> str:
    """Create an opaque correlation identifier without introducing authentication."""

    return str(uuid4())


def hash_password(password: str) -> str:
    """Hash a password with a per-password salt using stdlib scrypt."""

    salt = secrets.token_bytes(16)
    derived_key = hashlib.scrypt(password.encode("utf-8"), salt=salt, n=2**14, r=8, p=1)
    return "scrypt$16384$8$1${}${}".format(
        base64.urlsafe_b64encode(salt).decode("ascii"),
        base64.urlsafe_b64encode(derived_key).decode("ascii"),
    )


def verify_password(password: str, password_hash: str) -> bool:
    """Verify a scrypt password hash without exposing comparison timing."""

    try:
        algorithm, n, r, p, salt, expected = password_hash.split("$")
        if algorithm != "scrypt":
            return False
        derived_key = hashlib.scrypt(
            password.encode("utf-8"),
            salt=base64.urlsafe_b64decode(salt.encode("ascii")),
            n=int(n),
            r=int(r),
            p=int(p),
        )
        return hmac.compare_digest(derived_key, base64.urlsafe_b64decode(expected.encode("ascii")))
    except (ValueError, TypeError):
        return False


def create_opaque_token() -> str:
    return secrets.token_urlsafe(32)


def fingerprint_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
