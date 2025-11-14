from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.core import broadcaster
import asyncio

router = APIRouter()

@router.websocket("/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    channel = f"user:{user_id}"
    try:
        async for message in broadcaster.subscribe(channel):
            try:
                await websocket.send_json(message)
            except Exception:
                # if send fails, break to close connection
                break
    except WebSocketDisconnect:
        return
    except Exception:
        # keep connection alive on unexpected errors, small delay
        await asyncio.sleep(0.1)
    finally:
        try:
            await websocket.close()
        except Exception:
            pass
