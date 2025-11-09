"""
Unit tests for file upload utility functions.
"""
import pytest
from unittest.mock import MagicMock
from fastapi import HTTPException

from app.core.file_upload import validate_file_size, validate_file_extension


def test_validate_file_size_valid():
    """
    Test that validate_file_size allows files under the size limit.
    """
    # Mock an UploadFile with a size of 1MB
    mock_file = MagicMock()
    mock_file.size = 1 * 1024 * 1024  # 1MB

    # This should not raise an exception
    try:
        validate_file_size(mock_file, max_size_mb=5)
    except HTTPException:
        pytest.fail("validate_file_size raised HTTPException unexpectedly for a valid file size.")


def test_validate_file_size_invalid():
    """
    Test that validate_file_size raises an HTTPException for oversized files.
    """
    # Mock an UploadFile with a size of 10MB
    mock_file = MagicMock()
    mock_file.size = 10 * 1024 * 1024  # 10MB

    with pytest.raises(HTTPException) as exc_info:
        validate_file_size(mock_file, max_size_mb=5)

    assert exc_info.value.status_code == 413
    assert "File size exceeds maximum allowed size" in exc_info.value.detail


@pytest.mark.parametrize("filename, allowed, should_pass", [
    ("avatar.jpg", {"jpg", "png"}, True),
    ("image.PNG", {"jpg", "png"}, True),
    ("document.pdf", {"jpg", "png"}, False),
    ("archive.zip", {"zip", "rar"}, True),
    ("photo.jpeg", {"jpg", "png"}, False),
])
def test_validate_file_extension(filename, allowed, should_pass):
    """Test file extension validation with various cases."""
    if should_pass:
        validate_file_extension(filename, allowed_extensions=allowed)
    else:
        with pytest.raises(HTTPException) as exc_info:
            validate_file_extension(filename, allowed_extensions=allowed)
        assert exc_info.value.status_code == 415
        assert "File extension" in exc_info.value.detail