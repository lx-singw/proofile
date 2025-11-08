"""File handling utilities for secure file uploads."""
import magic
import os
from pathlib import Path
from typing import Set
from fastapi import UploadFile, HTTPException
from starlette import status

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

def validate_file_size(file: UploadFile) -> None:
    """Check if the file size is within allowed limits."""
    file.file.seek(0, os.SEEK_END)
    size = file.file.tell()
    file.file.seek(0)
    
    if size > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File size exceeds maximum allowed size of {MAX_FILE_SIZE/1024/1024}MB"
        )

def validate_file_extension(filename: str) -> None:
    """Validate file extension."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"File extension {ext} not allowed. Allowed extensions: {', '.join(ALLOWED_EXTENSIONS)}"
        )

async def validate_file_content(file: UploadFile) -> None:
    """
    Validate file content using python-magic to detect actual file type,
    regardless of extension.
    """
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
        # Create directory if it doesn't exist
        destination.parent.mkdir(parents=True, exist_ok=True)
        
        # Save the file
        with open(destination, "wb") as buffer:
            while content := await file.read(8192):  # Read in chunks
                buffer.write(content)
                
        return destination
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file: {str(e)}"
        )