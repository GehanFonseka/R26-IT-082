def candidate_schema(data):
    return {
        "name": data.get("name"),
        "resume_text": data.get("resume_text"),
        "skills": data.get("skills", []),
        "education": data.get("education", []),
        "experience": data.get("experience", []),
        "projects": data.get("projects", []),
        "skill_profile": data.get("skill_profile", []),
    }