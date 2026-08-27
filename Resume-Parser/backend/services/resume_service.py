import pdfplumber
import spacy
import re
from database.mongodb import candidate_collection
from sklearn.tree import DecisionTreeClassifier

nlp = spacy.load("en_core_web_sm")

SKILL_KEYWORDS = [
    "python", "java", "javascript", "typescript", "react", "node.js",
    "node", "express", "mongodb", "mysql", "sql", "html", "css",
    "machine learning", "deep learning", "nlp", "fastapi",
    "flask", "django", "git", "github", "docker", "figma",
    "firebase", "spring boot", "php", "laravel"
]

# ML training data: [skill_frequency, experience_months, project_context]
X_train = [
    [1, 0, 0],
    [2, 0, 1],
    [3, 6, 1],
    [4, 12, 1],
    [5, 24, 1],
    [6, 36, 1],
]

# 0 = Beginner, 1 = Intermediate, 2 = Advanced
y_train = [0, 0, 1, 1, 2, 2]

skill_model = DecisionTreeClassifier(random_state=42)
skill_model.fit(X_train, y_train)


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


def calculate_skill_score(prediction, frequency, total_months, project_context):
    base_scores = {
        0: 35,
        1: 65,
        2: 85
    }

    score = base_scores[int(prediction)]

    score += min(frequency * 2, 10)

    if project_context:
        score += 5

    if total_months >= 12:
        score += 5

    return min(score, 100)


def calculate_skill_proficiency(skills, experience, text):
    skill_profiles = []
    text_lower = text.lower()
    total_months = calculate_total_experience_months(experience)

    label_map = {
        0: "Beginner",
        1: "Intermediate",
        2: "Advanced"
    }

    for skill in skills:
        frequency = text_lower.count(skill.lower())

        project_context = (
            1 if "project" in text_lower and skill.lower() in text_lower else 0
        )

        features = [[frequency, total_months, project_context]]

        prediction = skill_model.predict(features)[0]
        level = label_map[int(prediction)]

        score = calculate_skill_score(
            prediction,
            frequency,
            total_months,
            project_context
        )

        skill_profiles.append({
            "skill": skill,
            "level": level,
            "score": score,
            "features": {
                "frequency": frequency,
                "experience_months": total_months,
                "project_context": bool(project_context)
            },
            "model": "DecisionTreeClassifier"
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