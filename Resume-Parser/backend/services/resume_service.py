import pdfplumber
import spacy
import re
from database.mongodb import candidate_collection

nlp = spacy.load("en_core_web_sm")

SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "react", "node.js",
    "node", "express", "mongodb", "mysql", "sql", "html", "css",
    "machine learning", "deep learning", "nlp", "fastapi",
    "flask", "django", "git", "github", "docker", "figma",
    "firebase", "spring boot", "php", "laravel"
]


def extract_skills(text):
    text_lower = text.lower()
    found_skills = []

    for skill in SKILL_KEYWORDS:
        if skill in text_lower:
            found_skills.append(skill)

    return list(set(found_skills))


def extract_experience(text):
    text_lower = text.lower()
    matches = re.findall(r"(\d+)\s*(years|year|months|month)", text_lower)

    experience = []
    for number, unit in matches:
        experience.append({
            "duration": int(number),
            "unit": unit
        })

    return experience


def extract_education(text):
    education_keywords = [
        "b.sc", "bsc", "bachelor", "degree", "diploma",
        "hnd", "university", "institute", "college",
        "information technology", "computer science"
    ]

    lines = text.split("\n")
    education = []

    for line in lines:
        if any(keyword in line.lower() for keyword in education_keywords):
            education.append(line.strip())

    return education[:5]


def calculate_total_experience_months(experience):
    total_months = 0

    for exp in experience:
        if exp["unit"] in ["year", "years"]:
            total_months += exp["duration"] * 12
        else:
            total_months += exp["duration"]

    return total_months


def calculate_skill_proficiency(skills, experience, text):
    skill_profiles = []
    text_lower = text.lower()
    total_months = calculate_total_experience_months(experience)

    for skill in skills:
        frequency = text_lower.count(skill.lower())
        score = 30

        if frequency >= 2:
            score += 15

        if "project" in text_lower and skill.lower() in text_lower:
            score += 20

        if total_months >= 6:
            score += 15

        if total_months >= 24:
            score += 25

        score = min(score, 100)

        if score < 50:
            level = "Beginner"
        elif score < 75:
            level = "Intermediate"
        else:
            level = "Advanced"

        skill_profiles.append({
            "skill": skill,
            "level": level,
            "score": score,
            "evidence": f"Frequency: {frequency}, Experience: {total_months} months, Project context detected"
        })

    return skill_profiles


async def process_resume(file):
    text = ""

    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            text += page.extract_text() or ""

    doc = nlp(text)

    tokens = [
        token.text for token in doc
        if not token.is_stop and not token.is_punct
    ]

    sentences = [sent.text.strip() for sent in doc.sents]

    skills = extract_skills(text)
    experience = extract_experience(text)
    education = extract_education(text)
    skill_profile = calculate_skill_proficiency(skills, experience, text)

    candidate_data = {
        "file_name": file.filename,
        "skills": skills,
        "experience": experience,
        "education": education,
        "skill_profile": skill_profile,
        "resume_text": text
    }

    insert_result = candidate_collection.insert_one(candidate_data)

    return {
        "candidate_id": str(insert_result.inserted_id),
        "file_name": file.filename,
        "skills": skills,
        "experience": experience,
        "education": education,
        "skill_profile": skill_profile,
        "tokens_sample": tokens[:30],
        "sentences_sample": sentences[:3],
        "text_preview": text[:500]
    }