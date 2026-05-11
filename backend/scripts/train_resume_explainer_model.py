from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any

import joblib
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.multiclass import OneVsRestClassifier
from sklearn.preprocessing import MultiLabelBinarizer


TRAINING_EXAMPLES: list[tuple[str, list[str]]] = [
    ("Python developer with Django FastAPI PostgreSQL REST APIs and Docker deployments", ["technical_skills", "backend_engineering"]),
    ("React TypeScript frontend engineer building responsive UI components and design systems", ["technical_skills", "frontend_engineering"]),
    ("Machine learning engineer using pandas numpy scikit-learn tensorflow model training and NLP", ["technical_skills", "machine_learning"]),
    ("Data analyst with SQL Power BI Tableau dashboards stakeholder reporting and data visualization", ["technical_skills", "data_analytics"]),
    ("AWS cloud engineer with EC2 S3 Lambda Kubernetes Docker CI CD monitoring", ["technical_skills", "cloud_devops"]),
    ("Cybersecurity analyst with SIEM incident response network security CISSP and vulnerability management", ["technical_skills", "security"]),
    ("Project manager leading agile scrum sprint planning stakeholder communication and delivery", ["leadership_management", "project_management"]),
    ("Product manager defining roadmap user research prioritization customer needs and product strategy", ["leadership_management", "product_management"]),
    ("Team lead mentoring engineers reviewing code coordinating releases and owning delivery quality", ["leadership_management", "experience_depth"]),
    ("Senior software engineer 7 years experience leading backend services and mentoring junior developers", ["experience_depth", "backend_engineering"]),
    ("Work Experience 2020 to present Software Engineer built APIs improved performance deployed services", ["experience_depth", "backend_engineering"]),
    ("Professional Experience data pipelines ETL analytics dashboards SQL Python automation", ["experience_depth", "data_analytics"]),
    ("Education Bachelor of Computer Science University degree software engineering coursework", ["education_credentials"]),
    ("Master of Business Administration MBA university management strategy leadership finance", ["education_credentials", "leadership_management"]),
    ("BSc Information Technology diploma computer science data structures databases networks", ["education_credentials", "technical_skills"]),
    ("Certifications AWS Certified Solutions Architect Azure Fundamentals Google Cloud Kubernetes", ["education_credentials", "cloud_devops"]),
    ("PMP Certified Scrum Master project management professional agile delivery certification", ["education_credentials", "project_management"]),
    ("TensorFlow certificate Coursera machine learning deep learning NLP model evaluation", ["education_credentials", "machine_learning"]),
    ("Skills Java Spring Boot microservices MySQL Redis Docker Kubernetes cloud deployment", ["technical_skills", "backend_engineering"]),
    ("Skills HTML CSS JavaScript React Redux Next.js accessibility browser performance", ["technical_skills", "frontend_engineering"]),
    ("Built dashboards with Power BI Tableau Excel SQL presenting insights to executives", ["data_analytics", "communication"]),
    ("Collaborated with product managers designers QA and stakeholders documenting progress clearly", ["communication", "project_management"]),
    ("Presented technical architecture to non technical users wrote documentation and trained team members", ["communication", "leadership_management"]),
    ("No professional experience looking for internship willing to learn basic computer skills", ["entry_level"]),
    ("Fresh graduate completed university coursework and academic projects seeking junior developer role", ["entry_level", "education_credentials"]),
    ("Internship project built simple web application using React Node and MySQL", ["entry_level", "technical_skills"]),
    ("Healthcare representative medical sales clinical pharmacy nursing patient care", ["healthcare_domain"]),
    ("Marketing sales brand campaign digital marketing customer acquisition CRM", ["marketing_sales"]),
    ("Human resources recruiter talent acquisition payroll employee relations HR management", ["human_resources"]),
]


WEAK_LABEL_RULES: list[tuple[str, list[str]]] = [
    ("technical_skills", ["python", "java", "javascript", "react", "node", "sql", "docker", "kubernetes", "tensorflow", "scikit", "selenium", "programming", "software", "developer"]),
    ("backend_engineering", ["backend", "back end", "api", "rest", "django", "fastapi", "spring", "microservices", "postgresql", "mysql", "server"]),
    ("frontend_engineering", ["frontend", "front end", "react", "angular", "vue", "html", "css", "typescript", "javascript", "ui", "responsive"]),
    ("machine_learning", ["machine learning", "deep learning", "data scientist", "nlp", "natural language processing", "computer vision", "tensorflow", "pytorch", "scikit", "model training"]),
    ("data_analytics", ["data analyst", "data analysis", "power bi", "tableau", "dashboard", "analytics", "excel", "reporting", "etl"]),
    ("cloud_devops", ["aws", "azure", "gcp", "cloud", "devops", "docker", "kubernetes", "terraform", "ci/cd", "linux"]),
    ("security", ["cybersecurity", "security", "siem", "vulnerability", "incident response", "network security", "cissp"]),
    ("leadership_management", ["manager", "team lead", "supervisor", "leadership", "managed", "mentoring", "branch manager", "project lead"]),
    ("project_management", ["project management", "scrum", "agile", "pmp", "sprint", "delivery", "stakeholder", "coordinator"]),
    ("product_management", ["product manager", "roadmap", "user research", "product strategy", "prioritization"]),
    ("experience_depth", ["work experience", "professional experience", "employment", "present", "current position", "years experience", "experience"]),
    ("education_credentials", ["education", "b.tech", "bachelor", "master", "m.tech", "mba", "phd", "diploma", "university", "college", "certification"]),
    ("communication", ["communication", "presentation", "documentation", "training", "stakeholder", "interpersonal", "written and verbal"]),
    ("entry_level", ["fresher", "fresh graduate", "intern", "internship", "trainee", "seeking junior", "no professional experience"]),
    ("healthcare_domain", ["medical", "nursing", "pharmacy", "clinical", "healthcare", "patient"]),
    ("marketing_sales", ["marketing", "sales", "brand", "campaign", "customer acquisition", "crm", "business development"]),
    ("human_resources", ["human resources", "hr", "recruiter", "talent acquisition", "payroll", "employee relations"]),
]


def _weak_labels_for_resume(text: str) -> list[str]:
    lowered = text.lower()
    labels: list[str] = []

    for label, keywords in WEAK_LABEL_RULES:
        if any(keyword in lowered for keyword in keywords):
            labels.append(label)

    if re.search(r"\b(19\d{2}|20\d{2})\s*(?:-|to|–)\s*(?:present|current|19\d{2}|20\d{2})\b", lowered):
        if "experience_depth" not in labels:
            labels.append("experience_depth")

    return labels


def _load_resume_dataset_examples(dataset_path: Path, max_records: int) -> list[tuple[str, list[str]]]:
    payload = json.loads(dataset_path.read_text(encoding="utf-8"))
    if not isinstance(payload, list):
        raise ValueError("Resume dataset JSON must be a list of records")

    examples: list[tuple[str, list[str]]] = []
    for record in payload:
        if len(examples) >= max_records:
            break
        if not isinstance(record, dict):
            continue

        text = str(record.get("text") or "").strip()
        if len(text) < 80:
            continue

        labels = _weak_labels_for_resume(text)
        if labels:
            examples.append((text, labels))

    return examples


def train_model(dataset_examples: list[tuple[str, list[str]]] | None = None, dataset_name: str | None = None) -> dict[str, Any]:
    all_examples = TRAINING_EXAMPLES + (dataset_examples or [])
    texts = [item[0] for item in all_examples]
    labels = [item[1] for item in all_examples]

    label_binarizer = MultiLabelBinarizer()
    y = label_binarizer.fit_transform(labels)

    vectorizer = TfidfVectorizer(
        lowercase=True,
        ngram_range=(1, 2),
        min_df=1,
        sublinear_tf=True,
        max_features=40000,
    )
    x = vectorizer.fit_transform(texts)

    classifier = OneVsRestClassifier(
        LogisticRegression(
            max_iter=1000,
            class_weight="balanced",
            solver="liblinear",
        )
    )
    classifier.fit(x, y)

    train_probabilities = classifier.predict_proba(x)
    train_predictions = (train_probabilities >= 0.45).astype(int)
    exact_match_rate = float(np.mean(np.all(train_predictions == y, axis=1)))

    return {
        "model_name": "tfidf_logistic_resume_explainer_v1",
        "model_source": (
            f"local_synthetic_resume_section_training+weak_labeled_dataset:{dataset_name}"
            if dataset_name
            else "local_synthetic_resume_section_training"
        ),
        "vectorizer": vectorizer,
        "classifier": classifier,
        "label_binarizer": label_binarizer,
        "metrics": {
            "train_examples": len(texts),
            "synthetic_examples": len(TRAINING_EXAMPLES),
            "dataset_examples": len(dataset_examples or []),
            "label_count": len(label_binarizer.classes_),
            "training_exact_match_rate": round(exact_match_rate, 4),
        },
    }


def main() -> None:
    parser = argparse.ArgumentParser(description="Train local resume explainability model.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("backend/app/member_2_resume_parser/model_artifacts"),
    )
    parser.add_argument("--dataset-json", type=Path, default=None, help="Optional JSON resume dataset with text records.")
    parser.add_argument("--max-dataset-records", type=int, default=5000)
    args = parser.parse_args()

    args.output_dir.mkdir(parents=True, exist_ok=True)
    dataset_examples: list[tuple[str, list[str]]] = []
    dataset_name: str | None = None
    if args.dataset_json:
        dataset_examples = _load_resume_dataset_examples(args.dataset_json, args.max_dataset_records)
        dataset_name = args.dataset_json.name

    artifact = train_model(dataset_examples=dataset_examples, dataset_name=dataset_name)
    model_path = args.output_dir / "resume_explainer.joblib"
    config_path = args.output_dir / "resume_explainer_config.json"

    joblib.dump(
        {
            "model_name": artifact["model_name"],
            "model_source": artifact["model_source"],
            "vectorizer": artifact["vectorizer"],
            "classifier": artifact["classifier"],
            "label_binarizer": artifact["label_binarizer"],
        },
        model_path,
    )
    config_path.write_text(
        json.dumps(
            {
                "model_name": artifact["model_name"],
                "model_source": artifact["model_source"],
                "metrics": artifact["metrics"],
            },
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Saved resume explainer model to {model_path}")
    print(json.dumps(artifact["metrics"], indent=2))


if __name__ == "__main__":
    main()
