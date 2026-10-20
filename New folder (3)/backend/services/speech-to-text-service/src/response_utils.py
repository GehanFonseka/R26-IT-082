from fastapi.responses import JSONResponse


def error_response(message: str, status_code: int, request_id: str | None = None, error: str | None = None):
    body = {"success": False, "message": message}
    if error:
        body["error"] = error
    if request_id:
        body["requestId"] = request_id
    return JSONResponse(status_code=status_code, content=body)


def normalize_language(_language: str | None) -> str:
    return "en"
