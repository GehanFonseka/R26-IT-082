from fastapi import APIRouter, UploadFile, File
from bson import ObjectId

from services.resume_service import process_resume
from database.mongodb import candidate_collection

router = APIRouter()


@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    result = await process_resume(file)
    return result


@router.get("/candidates")
def get_all_candidates():
    candidates = []

    for candidate in candidate_collection.find():
        candidate["_id"] = str(candidate["_id"])
        candidate.pop("resume_text", None)
        candidates.append(candidate)

    return candidates


@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str):
    candidate = candidate_collection.find_one({"_id": ObjectId(candidate_id)})

    if not candidate:
        return {"message": "Candidate not found"}

    candidate["_id"] = str(candidate["_id"])
    return candidate