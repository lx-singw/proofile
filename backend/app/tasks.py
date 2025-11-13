from app.celery_app import celery_app
import time
from app.models.resume import Resume
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.database import AsyncSessionLocal
import asyncio

@celery_app.task
def parse_resume_task(resume_id: str):
    # Placeholder: worker would download file from storage and parse via LLM.
    # For now we simulate a parse and write a stub to DB.
    async def _do():
        async with AsyncSessionLocal() as session:
            # NOTE: in real worker use sync DB or dedicated worker DB connection
            print("Parsing resume", resume_id)
            await asyncio.sleep(1)
            # Real implementation updates resume.data
    # Run async portion
    asyncio.run(_do())

@celery_app.task
def generate_pdf_task(resume_id: str, template_id: str):
    # Placeholder: generate PDF from HTML
    print("Generating PDF for", resume_id, template_id)
    time.sleep(1)
    return {"status": "done"}
