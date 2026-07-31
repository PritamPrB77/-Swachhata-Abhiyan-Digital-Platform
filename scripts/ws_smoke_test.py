import asyncio
import json
import sys
import urllib.request

import websockets

TOKEN = sys.argv[1]
HOST = sys.argv[2] if len(sys.argv) > 2 else "nginx"


async def main():
    uri = f"ws://{HOST}/ws/fleet?token={TOKEN}"
    async with websockets.connect(uri) as ws:
        msg = await asyncio.wait_for(ws.recv(), timeout=5)
        print("NGINX_WS_OK", msg[:200])


if __name__ == "__main__":
    asyncio.run(main())
