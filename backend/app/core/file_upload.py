"""File handling utilities for secure file uploads."""
import os
from pathlib import Path
from typing import Set
from fastapi import UploadFile, HTTPException
from starlette import status

try:
    import magic  # type: ignore
except ImportError:  # pragma: no cover - optional dependency in test env
    magic = None

# Maximum file size (10MB)
MAX_FILE_SIZE = 10 * 1024 * 1024

# Allowed MIME types for images
ALLOWED_IMAGE_TYPES = {
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp'
}

# Allowed file extensions
ALLOWED_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}

def validate_file_size(file: UploadFile, max_size_mb: int | None = None) -> None:
    """Check if the file size is within allowed limits."""
    limit_bytes = MAX_FILE_SIZE if max_size_mb is None else max_size_mb * 1024 * 1024
    try:
        size_attr = getattr(file, "size", None)
        if size_attr is not None:
            size = int(size_attr)
        elif hasattr(file, "file") and file.file is not None:
            file.file.seek(0, os.SEEK_END)
            size = file.file.tell()
            file.file.seek(0)
        else:
            size = 0
    except (OSError, IOError) as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unable to read file for size validation"
        ) from e
    
    if size > limit_bytes:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail="File size exceeds maximum allowed size"
        )

def validate_file_extension(filename: str, allowed_extensions: Set[str] | None = None) -> None:
    """Validate file extension."""
    allowed = ALLOWED_EXTENSIONS if allowed_extensions is None else {f".{ext.lower().lstrip('.')}" for ext in allowed_extensions}
    ext = Path(filename).suffix.lower()
    if ext not in allowed:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File extension {ext} not allowed"
        )

async def validate_file_content(file: UploadFile) -> None:
    """
    Validate file content using python-magic to detect actual file type,
    regardless of extension.
    """
    if magic is None:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="File content validation is unavailable"
        )
    # Read a sample of the file
    sample = await file.read(2048)
    file.file.seek(0)  # Reset file pointer
    
    # Detect mime type
    mime = magic.from_buffer(sample, mime=True)
    
    if mime not in ALLOWED_IMAGE_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File type {mime} not allowed. Allowed types: {', '.join(ALLOWED_IMAGE_TYPES)}"
        )

    # Additional security checks for SVG files (if we decide to allow them)
    if mime == 'image/svg+xml':
        content = sample.decode('utf-8', errors='ignore')
        if any(pattern in content.lower() for pattern in ['<script', 'javascript:', 'onclick']):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="SVG contains potentially malicious content"
            )

async def save_upload_file(file: UploadFile, destination: Path) -> Path:
    """
    Securely save an uploaded file.
    
    Args:
        file: The uploaded file
        destination: Path where the file should be saved
        
    Returns:
        Path to the saved file
    """
    try:
        # Resolve the destination path to prevent path traversal attacks
        resolved_destination = destination.resolve()
        
        # Ensure the resolved path is within the expected directory
        # This prevents path traversal attacks like "../../../etc/passwd"
        if not str(resolved_destination).startswith(str(Path.cwd().resolve())):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid file path"
            )
        
        # Create directory if it doesn't exist
        resolved_destination.parent.mkdir(parents=True, exist_ok=True)
        
        # Save the file
        with open(resolved_destination, "wb") as buffer:
            while content := await file.read(8192):  # Read in chunks
                buffer.write(content)
                
        return resolved_destination
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )