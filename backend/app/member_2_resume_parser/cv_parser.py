from __future__ import annotations

import datetime as dt
import re
from pathlib import Path
from typing import Any, Optional

from ..shared.utils import (
    normalize_business_travel,
    normalize_department,
    normalize_job_role,
    normalize_overtime,
)


def extract_text_from_pdf(file_path: Path) -> str:
    fitz_error: Optional[Exception] = None

    try:
        import fitz  # PyMuPDF

        text_parts: list[str] = []
        with fitz.open(file_path) as document:
            for page in document:
                text_parts.append(page.get_text("text"))

        text = "\n".join(text_parts).strip()
        if text:
            return text
    except Exception as exc:  # noqa: BLE001
        fitz_error = exc

    try:
        import pdfplumber

        text_parts = []
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text_parts.append(page.extract_text() or "")

        text = "\n".join(text_parts).strip()
        if text:
            return text
    except Exception as exc:  # noqa: BLE001
        if fitz_error:
            raise ValueError("Unable to parse PDF content with available parsers") from exc
        raise ValueError("Unable to parse PDF content") from exc

    raise ValueError("No readable text found in PDF")


def extract_text_from_docx(file_path: Path) -> str:
    try:
        from docx import Document

        document = Document(file_path)
        text = "\n".join(paragraph.text for paragraph in document.paragraphs).strip()
        if not text:
            raise ValueError("No readable text found in DOCX")

        return text
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Unable to parse DOCX content") from exc


def extract_text_from_txt(file_path: Path) -> str:
    try:
        text = file_path.read_text(encoding="utf-8", errors="ignore").strip()
        if not text:
            raise ValueError("No readable text found in TXT")

        return text
    except Exception as exc:  # noqa: BLE001
        raise ValueError("Unable to parse TXT content") from exc


def extract_text_from_file(file_path: Path) -> str:
    suffix = file_path.suffix.lower()

    if suffix == ".pdf":
        return extract_text_from_pdf(file_path)
    if suffix == ".docx":
        return extract_text_from_docx(file_path)
    if suffix == ".txt":
        return extract_text_from_txt(file_path)

    raise ValueError(f"Unsupported file extension: {suffix}")


def _infer_education(text: str) -> tuple[dict[str, Any], list[str], list[str]]:
    lowered = text.lower()
    features: dict[str, Any] = {}
    inferred_fields: list[str] = []
    assumptions: list[str] = []

    education_rules = [
        (["phd", "doctorate", "doctoral"], 5, "postgraduate studies"),
        (["master", "msc", "m.sc", "mba", "mtech"], 4, "master level studies"),
        (["bachelor", "bsc", "b.sc", "beng", "b.e", "btech", "ba "], 3, "bachelor level studies"),
        (["diploma", "hnd", "associate degree"], 2, "diploma level studies"),
        (["a/l", "advanced level", "high school", "secondary school"], 1, "school level studies"),
    ]

    for keywords, level, description in education_rules:
        if any(keyword in lowered for keyword in keywords):
            features["Education"] = level
            inferred_fields.append("Education")
            assumptions.append(f"Education inferred from CV text ({description}).")
            break

    if any(token in lowered for token in ["medical", "nursing", "pharmacy", "clinical"]):
        features["EducationField"] = "Medical"
        inferred_fields.append("EducationField")
        assumptions.append("EducationField inferred as Medical from CV keywords.")
    elif any(token in lowered for token in ["biology", "life science", "biotech"]):
        features["EducationField"] = "Life Sciences"
        inferred_fields.append("EducationField")
        assumptions.append("EducationField inferred as Life Sciences from CV keywords.")
    elif any(token in lowered for token in ["marketing", "sales", "brand"]):
        features["EducationField"] = "Marketing"
        inferred_fields.append("EducationField")
        assumptions.append("EducationField inferred as Marketing from CV keywords.")
    elif any(token in lowered for token in ["human resource", "hr"]):
        features["EducationField"] = "Human Resources"
        inferred_fields.append("EducationField")
        assumptions.append("EducationField inferred as Human Resources from CV keywords.")
    elif any(token in lowered for token in ["software", "computer", "engineering", "it", "data"]):
        features["EducationField"] = "Technical Degree"
        inferred_fields.append("EducationField")
        assumptions.append("EducationField inferred as Technical Degree from CV keywords.")

    return features, inferred_fields, assumptions


def _estimate_total_work_years(text: str) -> Optional[int]:
    lowered = text.lower()
    current_year = dt.datetime.now().year

    values: list[int] = []

    for match in re.finditer(r"(\d{1,2})(?:\s*\+)?\s+years?(?:\s+of)?\s+(?:experience|exp)", lowered):
        years = int(match.group(1))
        if 0 <= years <= 45:
            values.append(years)

    years = [int(year) for year in re.findall(r"\b(19\d{2}|20\d{2})\b", lowered)]
    years = [year for year in years if 1980 <= year <= current_year]

    if len(years) >= 2:
        values.append(max(0, current_year - min(years)))

    if not values:
        return None

    return max(values)


def _infer_job_role_and_department(text: str) -> tuple[dict[str, Any], list[str], list[str]]:
    lowered = text.lower()
    features: dict[str, Any] = {}
    inferred_fields: list[str] = []
    assumptions: list[str] = []

    possible_role: Optional[str] = None
    role_rules = [
        ("full stack", "Research Scientist"),
        ("frontend", "Research Scientist"),
        ("front end", "Research Scientist"),
        ("backend", "Research Scientist"),
        ("back end", "Research Scientist"),
        ("software engineer", "Research Scientist"),
        ("software developer", "Research Scientist"),
        ("developer", "Research Scientist"),
        ("devops", "Research Scientist"),
        ("cloud engineer", "Research Scientist"),
        ("data engineer", "Research Scientist"),
        ("data analyst", "Research Scientist"),
        ("research director", "Research Director"),
        ("manufacturing director", "Manufacturing Director"),
        ("sales representative", "Sales Representative"),
        ("sales rep", "Sales Representative"),
        ("sales executive", "Sales Executive"),
        ("business development", "Sales Executive"),
        ("account executive", "Sales Executive"),
        ("human resources", "Human Resources"),
        ("hr specialist", "Human Resources"),
        ("laboratory technician", "Laboratory Technician"),
        ("lab technician", "Laboratory Technician"),
        ("healthcare representative", "Healthcare Representative"),
        ("medical representative", "Healthcare Representative"),
        ("manager", "Manager"),
        ("research scientist", "Research Scientist"),
        ("data scientist", "Research Scientist"),
        ("machine learning engineer", "Research Scientist"),
        ("ml engineer", "Research Scientist"),
        ("qa automation", "Laboratory Technician"),
        ("quality assurance", "Laboratory Technician"),
        ("test automation", "Laboratory Technician"),
        ("scientist", "Research Scientist"),
    ]

    for keyword, canonical in role_rules:
        if keyword in lowered:
            possible_role = canonical
            break

    if possible_role:
        features["JobRole"] = normalize_job_role(possible_role)
        inferred_fields.append("JobRole")
        assumptions.append("JobRole inferred from CV title/keyword matches.")

        features["Department"] = normalize_department(features["JobRole"])
        inferred_fields.append("Department")
        assumptions.append("Department inferred from detected job role.")

    return features, inferred_fields, assumptions


def _infer_work_conditions(text: str) -> tuple[dict[str, Any], list[str], list[str]]:
    lowered = text.lower()
    features: dict[str, Any] = {}
    inferred_fields: list[str] = []
    assumptions: list[str] = []

    if any(token in lowered for token in ["frequent travel", "extensive travel", "travel often"]):
        features["BusinessTravel"] = normalize_business_travel("frequent")
        inferred_fields.append("BusinessTravel")
        assumptions.append("BusinessTravel inferred as frequent based on CV wording.")
    elif any(token in lowered for token in ["occasional travel", "travel as needed"]):
        features["BusinessTravel"] = normalize_business_travel("rarely")
        inferred_fields.append("BusinessTravel")
        assumptions.append("BusinessTravel inferred as occasional based on CV wording.")
    elif any(token in lowered for token in ["remote only", "no travel", "non travel"]):
        features["BusinessTravel"] = normalize_business_travel("none")
        inferred_fields.append("BusinessTravel")
        assumptions.append("BusinessTravel inferred as non-travel from CV wording.")

    if any(token in lowered for token in ["overtime", "extra hours", "night shift"]):
        if "no overtime" in lowered or "without overtime" in lowered:
            features["OverTime"] = normalize_overtime("no")
            assumptions.append("OverTime inferred as No from explicit no-overtime mention.")
        else:
            features["OverTime"] = normalize_overtime("yes")
            assumptions.append("OverTime inferred as Yes from overtime/night-shift mention.")

        inferred_fields.append("OverTime")

    return features, inferred_fields, assumptions


def _infer_income(text: str) -> tuple[dict[str, Any], list[str], list[str]]:
    lowered = text.lower()
    features: dict[str, Any] = {}
    inferred_fields: list[str] = []
    assumptions: list[str] = []

    salary_match = re.search(
        r"(?:salary|ctc|monthly income|expected salary)[^\d]{0,20}(\d[\d,]{2,})",
        lowered,
    )

    if not salary_match:
        return features, inferred_fields, assumptions

    raw_value = salary_match.group(1).replace(",", "")
    monthly_income = int(raw_value)

    if any(token in lowered for token in ["per year", "yearly", "annum", "annual"]):
        monthly_income = max(1, int(monthly_income / 12))
        assumptions.append("MonthlyIncome inferred by converting annual salary mention to monthly.")
    else:
        assumptions.append("MonthlyIncome inferred from CV salary mention.")

    if 300 <= monthly_income <= 300000:
        features["MonthlyIncome"] = monthly_income
        inferred_fields.append("MonthlyIncome")

    return features, inferred_fields, assumptions


def extract_features_from_cv_text(raw_text: str) -> tuple[dict[str, Any], list[str], list[str]]:
    text = (raw_text or "").strip()
    if not text:
        return {}, [], []

    features: dict[str, Any] = {}
    inferred_fields: list[str] = []
    assumptions: list[str] = []

    edu_features, edu_fields, edu_assumptions = _infer_education(text)
    features.update(edu_features)
    inferred_fields.extend(edu_fields)
    assumptions.extend(edu_assumptions)

    role_features, role_fields, role_assumptions = _infer_job_role_and_department(text)
    features.update(role_features)
    inferred_fields.extend(role_fields)
    assumptions.extend(role_assumptions)

    work_features, work_fields, work_assumptions = _infer_work_conditions(text)
    features.update(work_features)
    inferred_fields.extend(work_fields)
    assumptions.extend(work_assumptions)

    income_features, income_fields, income_assumptions = _infer_income(text)
    features.update(income_features)
    inferred_fields.extend(income_fields)
    assumptions.extend(income_assumptions)

    total_years = _estimate_total_work_years(text)
    if total_years is not None:
        features["TotalWorkingYears"] = total_years
        inferred_fields.append("TotalWorkingYears")
        assumptions.append("TotalWorkingYears estimated from CV years/tenure phrases.")

        estimated_age = max(22, min(60, 22 + total_years))
        features["Age"] = estimated_age
        inferred_fields.append("Age")
        assumptions.append("Age estimated from inferred total working years.")

        features["YearsAtCompany"] = min(total_years, 5)
        features["YearsInCurrentRole"] = min(total_years, 3)
        features["YearsWithCurrManager"] = min(total_years, 3)
        features["YearsSinceLastPromotion"] = min(max(total_years - 2, 0), 5)
        inferred_fields.extend(
            [
                "YearsAtCompany",
                "YearsInCurrentRole",
                "YearsWithCurrManager",
                "YearsSinceLastPromotion",
            ]
        )
        assumptions.append("Role-tenure fields approximated from inferred total working years.")

    # Approximate number of employers from date ranges in the CV.
    date_range_count = len(
        re.findall(r"\b(19\d{2}|20\d{2})\s*(?:-|to|–)\s*(?:present|current|19\d{2}|20\d{2})\b", text.lower())
    )
    if date_range_count > 1:
        features["NumCompaniesWorked"] = min(date_range_count, 10)
        inferred_fields.append("NumCompaniesWorked")
        assumptions.append("NumCompaniesWorked approximated from CV employment date ranges.")

    return features, inferred_fields, assumptions
