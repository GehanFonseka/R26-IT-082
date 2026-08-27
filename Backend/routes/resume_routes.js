from fastapi import APIRouter, UploadFile, File, HTTPException
from bson import ObjectId

from services.resume_service import process_resume
from database.mongodb import candidate_collection

router = APIRouter()


# Upload resume
@router.post("/upload")
async def upload_resume(file: UploadFile = File(...)):
    result = await process_resume(file)
    return result


# Get all candidates
@router.get("/candidates")
def get_candidates():
    candidates = list(candidate_collection.find())

    for candidate in candidates:
        candidate["_id"] = str(candidate["_id"])

    return candidates


# Get one candidate
@router.get("/candidates/{candidate_id}")
def get_candidate(candidate_id: str):

    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate ID"
        )

    candidate = candidate_collection.find_one(
        {"_id": ObjectId(candidate_id)}
    )

    if not candidate:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    candidate["_id"] = str(candidate["_id"])

    return candidate


# Delete candidate
@router.delete("/candidates/{candidate_id}")
def delete_candidate(candidate_id: str):

    if not ObjectId.is_valid(candidate_id):
        raise HTTPException(
            status_code=400,
            detail="Invalid candidate ID"
        )

    result = candidate_collection.delete_one(
        {"_id": ObjectId(candidate_id)}
    )

    if result.deleted_count == 0:
        raise HTTPException(
            status_code=404,
            detail="Candidate not found"
        )

    return {
        "message": "Candidate deleted successfully",
        "candidate_id": candidate_id
    }