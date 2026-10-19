import json
from uuid import uuid4
from config import MAX_BYTES

class BodyTooLarge(Exception):
    pass

class BodyLimit:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        if scope["type"] != "http":
            return await self.app(scope, receive, send)
        total = 0
        async def bounded_receive():
            nonlocal total
            message = await receive()
            total += len(message.get("body", b""))
            if total > MAX_BYTES * 1.4:
                raise BodyTooLarge()
            return message
        try:
            await self.app(scope, bounded_receive, send)
        except BodyTooLarge:
            headers = dict(scope.get("headers", []))
            body = json.dumps({"success": False, "message": "Certificate content is too large.",
                "requestId": headers.get(b"x-request-id", str(uuid4()).encode()).decode("utf-8", errors="replace")}).encode()
            await send({"type": "http.response.start", "status": 413, "headers": [(b"content-type", b"application/json")]})
            await send({"type": "http.response.body", "body": body})
