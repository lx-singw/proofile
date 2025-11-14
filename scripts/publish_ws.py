"""Publish a test WebSocket event to a user's channel using the app broadcaster.

Run this inside the backend container so it can import the app package and use the same
broadcaster (Redis-backed when configured).

Example:
  docker-compose exec backend python scripts/publish_ws.py --user 42 --event RESUME_PARSED_SUCCESS --resume r-1

"""
import argparse
import asyncio
import json

from app.core import broadcaster


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--user", required=True, help="user id to publish to")
    parser.add_argument("--event", required=True, help="event name e.g. RESUME_PARSED_SUCCESS")
    parser.add_argument("--resume", required=False, help="resume id")
    parser.add_argument("--data", required=False, help="JSON data payload", default="{}")
    args = parser.parse_args()

    data = json.loads(args.data)
    message = {"event": args.event}
    if args.resume:
        message["resume_id"] = args.resume
    if data:
        message["data"] = data

    channel = f"user:{args.user}"
    print(f"Publishing to {channel}: {message}")
    await broadcaster.publish(channel, message)
    print("Published")


if __name__ == "__main__":
    asyncio.run(main())
