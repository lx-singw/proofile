def parse_resume_task(resume_id: str):
def generate_pdf_task(resume_id: str, template_id: str):
from app.celery_app import celery_app
import time
from app.models.resume import Resume
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
from app.core import broadcaster
from sqlalchemy import select
import asyncio


@celery_app.task
def parse_resume_task(resume_id: str):
    """Simulate parsing a resume, update DB, and publish RESUME_PARSED_SUCCESS."""
    async def _do():
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

    asyncio.run(_do())


@celery_app.task
def generate_pdf_task(resume_id: str, template_id: str):
    """Simulate PDF generation and publish PDF_READY with a temporary URL."""
    print("Generating PDF for", resume_id, template_id)
    # Simulate heavy work
    time.sleep(1)
    # In a real implementation we'd upload to S3 and generate a signed URL
    download_url = f"https://storage.example.com/resumes/{resume_id}/output.pdf?token=stub"
    # Try to get user_id from DB and publish
    async def _publish():
        async with AsyncSessionLocal() as session:
            result = await session.execute(select(Resume).where(Resume.id == resume_id))
            resume = result.scalar_one_or_none()
            if not resume:
                print("generate_pdf_task: resume not found", resume_id)
                return
            user_id = str(resume.user_id)
            message = {"event": "PDF_READY", "resume_id": str(resume.id), "download_url": download_url}
            try:
                await broadcaster.publish(f"user:{user_id}", message)
            except Exception:
                print("Failed to publish PDF_READY for user", user_id)

    try:
        asyncio.run(_publish())
    except Exception:
        pass
    return {"status": "done", "download_url": download_url}
