import pytest
from pydantic import ValidationError

from app.schemas.token import Token, TokenData


def test_token_defaults_token_type_bearer():
    """Tests that the token_type defaults to 'bearer' if not provided."""
    tok = Token(access_token="abc123")
    assert tok.access_token == "abc123"
    assert tok.token_type == "bearer"


def test_token_allows_overriding_token_type():
    """Tests that the token_type can be overridden."""
    tok = Token(access_token="abc123", token_type="custom")
    assert tok.access_token == "abc123"
    assert tok.token_type == "custom"


def test_token_missing_access_token_raises_validation_error():
    """Tests that a ValidationError is raised if access_token is missing."""
    with pytest.raises(ValidationError) as exc:
        Token()  # type: ignore[call-arg]
    msg = str(exc.value)
    assert "access_token" in msg
    assert "Field required" in msg


def test_tokendata_accepts_none_subject():
    """Tests that TokenData can be instantiated with a None subject (sub)."""
    data = TokenData(sub=None)
    assert data.username is None


def test_token_and_tokendata_serialize_correctly():
    """Tests that model_dump() produces the correct dictionary output."""
    tok = Token(access_token="xyz789")
    data = TokenData(sub="user@example.com", iss="proofile", aud="proofile_app")
    tok_dict = tok.model_dump()
    data_dict = data.model_dump(by_alias=True)
    assert tok_dict == {"access_token": "xyz789", "token_type": "bearer"}
    assert data_dict == {"sub": "user@example.com", "iss": "proofile", "aud": "proofile_app"}