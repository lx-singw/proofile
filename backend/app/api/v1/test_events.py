from typing import Optional

from fastapi import APIRouter
from pydantic import BaseModel

from app.core import broadcaster

router = APIRouter()


class PublishRequest(BaseModel):
    user: str
    event: str
    resume_id: Optional[str] = None
    data: Optional[dict] = None


@router.post('/publish')
async def publish_event(req: PublishRequest):
    channel = f"user:{req.user}"
    message = {"event": req.event}
    if req.resume_id:
        message["resume_id"] = req.resume_id
    if req.data:
        message["data"] = req.data

    await broadcaster.publish(channel, message)
    return {"published": True}
