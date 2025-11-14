from app.celery_app import celery_app
import time
from app.models.resume import Resume
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core import broadcaster
from sqlalchemy import select
import asyncio
import os
from typing import Optional
try:
    import boto3
    from botocore.exceptions import BotoCoreError, ClientError
except Exception:
    boto3 = None


@celery_app.task
def parse_resume_task(resume_id: str):
    """Celery wrapper for synchronous worker executors."""
    # Run the async implementation in a new loop
    asyncio.run(parse_resume_task_async(resume_id))


async def parse_resume_task_async(resume_id: str):
    """Async implementation of parsing a resume. Tests can import and await this directly."""
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Resume).where(Resume.id == resume_id))
        resume = result.scalar_one_or_none()
        if not resume:
            print("parse_resume_task: resume not found", resume_id)
            return
        print("Parsing resume", resume_id)
        # Simulate parse result
        parsed_data = {"contact": {"name": "Parsed Name", "email": "parsed@example.com"}, "parsed": True}
        resume.data = parsed_data
        await session.commit()
        # publish event to the user's channel
        user_id = str(resume.user_id)
        message = {"event": "RESUME_PARSED_SUCCESS", "resume_id": str(resume.id), "data": resume.data}
        try:
            await broadcaster.publish(f"user:{user_id}", message)
        except Exception:
            # best-effort - don't crash worker on publish errors
            print("Failed to publish resume parsed event for user", user_id)


@celery_app.task
def generate_pdf_task(resume_id: str, template_id: str):
    """Celery wrapper: run async implementation in a fresh event loop."""
    asyncio.run(generate_pdf_task_async(resume_id, template_id))


async def generate_pdf_task_async(resume_id: str, template_id: str):
    """Async implementation for PDF generation and publish PDF_READY with a temporary URL."""
    print("Generating PDF for", resume_id, template_id)
    # Simulate heavy work (use asyncio.sleep in async impl)
    await asyncio.sleep(0)
    # In a real implementation we'd upload to S3 and generate a signed URL
    # Attempt to upload to S3 if boto3 is available and S3_BUCKET is configured.
    download_url = f"https://storage.example.com/resumes/{resume_id}/output.pdf?token=stub"
    bucket = os.getenv("S3_BUCKET")
    if boto3 and bucket:
        try:
            pdf_bytes = b"PDF-BYTES-STUB"
            s3 = boto3.client("s3")
            key = f"resumes/{resume_id}/output.pdf"
            s3.put_object(Bucket=bucket, Key=key, Body=pdf_bytes, ContentType="application/pdf")
            # generate presigned URL
            try:
                url = s3.generate_presigned_url("get_object", Params={"Bucket": bucket, "Key": key}, ExpiresIn=3600)
                download_url = url
            except Exception:
                # fallback to constructed URL
                download_url = f"https://{bucket}.s3.amazonaws.com/{key}"
        except (BotoCoreError, ClientError, Exception):
            # ignore S3 upload errors and fallback to stub URL
            pass
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(Resume).where(Resume.id == resume_id))
        resume = result.scalar_one_or_none()
        if not resume:
            print("generate_pdf_task: resume not found", resume_id)
            return {"status": "not_found"}
        user_id = str(resume.user_id)
        message = {"event": "PDF_READY", "resume_id": str(resume.id), "download_url": download_url}
        try:
            await broadcaster.publish(f"user:{user_id}", message)
        except Exception:
            print("Failed to publish PDF_READY for user", user_id)
    return {"status": "done", "download_url": download_url}
