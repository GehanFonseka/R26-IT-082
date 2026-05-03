from fastapi import FastAPI
from routes.resume_routes import router as resume_router

app = FastAPI(title="Resume Parser API")

app.include_router(resume_router, prefix="/api")

@app.get("/")
def home():
    return {"message": "Resume Parser Backend Running"}