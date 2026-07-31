import json
from typing import Any

import redis

from app.config import settings

CHANNEL = "fleet:live"
LATEST_KEY = "fleet:latest"


def get_redis() -> redis.Redis:
    return redis.Redis.from_url(settings.redis_url, decode_responses=True)


def publish_location(payload: dict[str, Any]) -> None:
    r = get_redis()
    vehicle_id = str(payload["vehicle_id"])
    r.hset(LATEST_KEY, vehicle_id, json.dumps(payload))
    r.publish(CHANNEL, json.dumps(payload))


def get_all_latest() -> list[dict[str, Any]]:
    r = get_redis()
    data = r.hgetall(LATEST_KEY)
    return [json.loads(v) for v in data.values()]
