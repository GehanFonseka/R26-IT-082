import uvicorn
import os
from pathlib import Path
from config import PORT

if __name__ == "__main__":
    reload = os.getenv("CERTIFICATE_LOCAL_MODEL_RELOAD", "false").lower() == "true"
    uvicorn.run("app:app", host="127.0.0.1", port=PORT, access_log=False,
        reload=reload, reload_dirs=[str(Path(__file__).resolve().parent)] if reload else None)
