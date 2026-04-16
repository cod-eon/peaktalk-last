import asyncio
import json
import logging
import uuid
from typing import Dict, Set

import redis.asyncio as aioredis
from fastapi import WebSocket

from app.config import settings

logger = logging.getLogger("peaktalk.ws")

class WebSocketManager:
    def __init__(self):
        self.active_connections: Dict[uuid.UUID, Set[WebSocket]] = {}
        self.redis: aioredis.Redis | None = None
        self.pubsub = None
        self._listener_task: asyncio.Task | None = None

    async def connect(self, websocket: WebSocket, user_id: uuid.UUID):
        if self._listener_task is None:
            await self._init_redis()
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = set()
        self.active_connections[user_id].add(websocket)
        logger.debug(f"WS client connected for user {user_id}. Total for user: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: uuid.UUID):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.debug(f"WS client disconnected for user {user_id}")

    async def send_personal_message(self, message: dict, user_id: uuid.UUID):
        """Send message to a specific user's connected WebSockets on this worker."""
        if user_id in self.active_connections:
            websockets = list(self.active_connections[user_id])
            for ws in websockets:
                try:
                    await ws.send_json(message)
                except Exception as e:
                    logger.warning(f"Failed to send WS message to {user_id}: {e}")
                    self.disconnect(ws, user_id)

    async def broadcast_to_user_across_workers(self, user_id: uuid.UUID, message: dict):
        """Publish a message to Redis so all workers can push it to the user's WebSockets."""
        if not self.redis:
            await self._init_redis()
        
        payload = json.dumps({
            "user_id": str(user_id),
            "message": message
        })
        await self.redis.publish("peaktalk:notifications", payload)

    async def _init_redis(self):
        if self.redis is not None and self.pubsub is not None and self._listener_task is not None:
            return
        try:
            self.redis = aioredis.from_url(settings.redis_url, decode_responses=True)
            self.pubsub = self.redis.pubsub()
            await self.pubsub.subscribe("peaktalk:notifications")
            self._listener_task = asyncio.create_task(self._listen_redis())
            logger.info("WS Manager successfully connected to Redis Pub/Sub")
        except Exception as e:
            logger.error(f"Failed to initialize WS Redis connection: {e}")

    async def _listen_redis(self):
        try:
            async for message_raw in self.pubsub.listen():
                if message_raw["type"] == "message":
                    data = json.loads(message_raw["data"])
                    target_user_id = uuid.UUID(data["user_id"])
                    await self.send_personal_message(data["message"], target_user_id)
        except Exception as e:
            logger.error(f"Redis Pub/Sub listener error: {e}")
            # Automatically try to restart later or just handle gracefully
            pass

manager = WebSocketManager()
