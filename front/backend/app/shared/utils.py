from __future__ import annotations

import ast
import json
import re
from pathlib import Path
from typing import Any, Optional, Union

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
}
ALLOWED_EXTENSIONS = {".pdf", ".docx", ".txt"}
MAX_UPLOAD_SIZE_MB = 10
MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024
RISK_BAND_RULE = "LOW < 35, MEDIUM 35-65, HIGH > 65"

NUMERIC_DEFAULTS: dict[str, Union[float, int]] = {
    "Age": 36,
    "DailyRate": 800,
    "DistanceFromHome": 9,
    "Education": 3,
    "EnvironmentSatisfaction": 3,
    "HourlyRate": 66,
    "JobInvolvement": 3,
    "JobLevel": 2,
    "JobSatisfaction": 3,
    "MonthlyIncome": 4919,
    "MonthlyRate": 14235,
    "NumCompaniesWorked": 2,
    "PercentSalaryHike": 14,
    "PerformanceRating": 3,
    "RelationshipSatisfaction": 3,
    "StockOptionLevel": 1,
    "TotalWorkingYears": 10,
    "TrainingTimesLastYear": 2,
    "WorkLifeBalance": 3,
    "YearsAtCompany": 5,
    "YearsInCurrentRole": 3,
    "YearsSinceLastPromotion": 1,
    "YearsWithCurrManager": 3,
}

CATEGORICAL_DEFAULTS: dict[str, str] = {
    "BusinessTravel": "Travel_Rarely",
    "Department": "Research & Development",
    "EducationField": "Life Sciences",
    "Gender": "Male",
    "JobRole": "Research Scientist",
    "MaritalStatus": "Married",
    "OverTime": "No",
}

INTEGER_NUMERIC_COLUMNS = {
    "Age",
    "DailyRate",
    "DistanceFromHome",
    "Education",
    "EnvironmentSatisfaction",
    "HourlyRate",
    "JobInvolvement",
    "JobLevel",
    "JobSatisfaction",
    "MonthlyIncome",
    "MonthlyRate",
    "NumCompaniesWorked",
    "PercentSalaryHike",
    "PerformanceRating",
    "RelationshipSatisfaction",
    "StockOptionLevel",
    "TotalWorkingYears",
    "TrainingTimesLastYear",
    "WorkLifeBalance",
    "YearsAtCompany",
    "YearsInCurrentRole",
    "YearsSinceLastPromotion",
    "YearsWithCurrManager",
}


def uploads_dir() -> Path:
    path = Path(__file__).resolve().parents[1] / "uploads"
    path.mkdir(parents=True, exist_ok=True)
    return path


def dedupe_preserve_order(items: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []

    for item in items:
        if item not in seen:
            seen.add(item)
            result.append(item)

    return result


def clean_filename(filename: str) -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]", "_", filename)
    return cleaned or "upload_file"


def extension_from_filename(filename: str) -> str:
    return Path(filename).suffix.lower()


def is_allowed_upload(content_type: Optional[str], filename: str) -> bool:
    ext = extension_from_filename(filename)

    if ext not in ALLOWED_EXTENSIONS:
        return False

    if content_type in ALLOWED_MIME_TYPES:
        return True

    # Some browsers/tools send generic content type.
    return content_type in {None, "", "application/octet-stream"}


def parse_candidate_meta(candidate_meta_raw: Optional[str]) -> dict[str, Any]:
    if not candidate_meta_raw:
        return {}

    text = candidate_meta_raw.strip()
    if not text:
        return {}

    try:
        parsed = json.loads(text)
    except json.JSONDecodeError:
        try:
            parsed = ast.literal_eval(text)
        except Exception:
            # Handle JS-like object text such as:
            # {role_title:'Engineer', department:'Engineering'}
            normalized = re.sub(r"([{,]\s*)([A-Za-z_][A-Za-z0-9_]*)(\s*:)", r'\1"\2"\3', text)
            normalized = normalized.replace("'", '"')
            try:
                parsed = json.loads(normalized)
            except Exception as exc:  # noqa: BLE001
                raise ValueError(
                    "candidate_meta must be a valid JSON object string"
                ) from exc

    if not isinstance(parsed, dict):
        raise ValueError("candidate_meta must be a JSON object")

    return parsed


def normalize_department(value: Any) -> str:
    text = str(value).strip().lower()

    if any(token in text for token in ["human", "hr", "people"]):
        return "Human Resources"
    if any(token in text for token in ["sale", "business development", "account"]):
        return "Sales"

    return "Research & Development"


def normalize_job_role(value: Any) -> str:
    text = str(value).strip().lower()

    patterns = [
        ("research director", "Research Director"),
        ("manufacturing director", "Manufacturing Director"),
        ("sales representative", "Sales Representative"),
        ("sales rep", "Sales Representative"),
        ("sales executive", "Sales Executive"),
        ("account executive", "Sales Executive"),
        ("business development", "Sales Executive"),
        ("human resources", "Human Resources"),
        ("hr", "Human Resources"),
        ("laboratory", "Laboratory Technician"),
        ("lab technician", "Laboratory Technician"),
        ("technician", "Laboratory Technician"),
        ("healthcare", "Healthcare Representative"),
        ("nurse", "Healthcare Representative"),
        ("medical rep", "Healthcare Representative"),
        ("manager", "Manager"),
        ("director", "Manager"),
        ("scientist", "Research Scientist"),
        ("research", "Research Scientist"),
    ]

    for keyword, canonical in patterns:
        if keyword in text:
            return canonical

    return "Research Scientist"


def normalize_education_field(value: Any) -> str:
    text = str(value).strip().lower()

    if any(token in text for token in ["life", "biology", "biotech", "botany", "zoology"]):
        return "Life Sciences"
    if any(token in text for token in ["medical", "medicine", "pharmacy", "nursing"]):
        return "Medical"
    if any(token in text for token in ["market", "sales", "brand"]):
        return "Marketing"
    if any(token in text for token in ["human resource", "hr"]):
        return "Human Resources"
    if any(token in text for token in ["technical", "engineering", "software", "computer", "it", "data"]):
        return "Technical Degree"

    return "Other"


def normalize_business_travel(value: Any) -> str:
    text = str(value).strip().lower()

    if any(token in text for token in ["non", "none", "no", "remote"]):
        return "Non-Travel"
    if any(token in text for token in ["frequent", "extensive", "often"]):
        return "Travel_Frequently"

    return "Travel_Rarely"


def normalize_overtime(value: Any) -> str:
    if isinstance(value, bool):
        return "Yes" if value else "No"

    text = str(value).strip().lower()

    if text in {"yes", "y", "true", "1"}:
        return "Yes"
    if text in {"no", "n", "false", "0"}:
        return "No"

    if "no" in text and "over" in text:
        return "No"
    if "over" in text or "extra hours" in text:
        return "Yes"

    return "No"


def normalize_marital_status(value: Any) -> str:
    text = str(value).strip().lower()
    if "single" in text:
        return "Single"
    if "divorc" in text or "separated" in text:
        return "Divorced"
    return "Married"


def normalize_gender(value: Any) -> str:
    text = str(value).strip().lower()
    if text.startswith("f"):
        return "Female"
    if text.startswith("m"):
        return "Male"
    return "Male"


def get_default_value(column: str) -> Any:
    if column in NUMERIC_DEFAULTS:
        return NUMERIC_DEFAULTS[column]
    if column in CATEGORICAL_DEFAULTS:
        return CATEGORICAL_DEFAULTS[column]
    return None


def coerce_numeric(value: Any) -> float:
    if isinstance(value, (int, float)):
        return float(value)

    text = str(value).strip()
    if not text:
        raise ValueError("empty numeric value")

    normalized = text.replace(",", "")
    normalized = normalized.replace("$", "")
    normalized = normalized.replace("LKR", "")
    normalized = normalized.replace("USD", "")

    match = re.search(r"-?\d+(?:\.\d+)?", normalized)
    if not match:
        raise ValueError(f"could not parse numeric value: {value}")

    return float(match.group(0))


def coerce_feature_value(
    column: str,
    value: Any,
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> Any:
    if value is None:
        raise ValueError("missing value")

    if isinstance(value, str) and not value.strip():
        raise ValueError("empty value")

    if column in numeric_columns:
        number = coerce_numeric(value)
        if column in INTEGER_NUMERIC_COLUMNS:
            return int(round(number))
        return number

    if column in categorical_columns:
        if column == "BusinessTravel":
            return normalize_business_travel(value)
        if column == "Department":
            return normalize_department(value)
        if column == "EducationField":
            return normalize_education_field(value)
        if column == "Gender":
            return normalize_gender(value)
        if column == "JobRole":
            return normalize_job_role(value)
        if column == "MaritalStatus":
            return normalize_marital_status(value)
        if column == "OverTime":
            return normalize_overtime(value)

        return str(value).strip()

    return value


def merge_candidate_meta_overrides(
    features: dict[str, Any],
    candidate_meta: dict[str, Any],
    expected_columns: list[str],
) -> list[str]:
    key_to_column = {
        "role_title": "JobRole",
        "job_title": "JobRole",
        "department": "Department",
        "salary_expectation": "MonthlyIncome",
        "monthly_income": "MonthlyIncome",
        "expected_monthly_income": "MonthlyIncome",
        "total_working_years": "TotalWorkingYears",
        "experience_years": "TotalWorkingYears",
        "distance_from_home": "DistanceFromHome",
        "distance_km": "DistanceFromHome",
        "business_travel": "BusinessTravel",
        "overtime": "OverTime",
        "marital_status": "MaritalStatus",
        "gender": "Gender",
        "education": "Education",
        "education_field": "EducationField",
        "num_companies_worked": "NumCompaniesWorked",
        "age": "Age",
        "years_at_company": "YearsAtCompany",
        "years_in_current_role": "YearsInCurrentRole",
        "years_since_last_promotion": "YearsSinceLastPromotion",
        "years_with_curr_manager": "YearsWithCurrManager",
    }

    expected_set = set(expected_columns)
    applied_fields: list[str] = []

    for raw_key, raw_value in candidate_meta.items():
        if raw_value in {None, ""}:
            continue

        key = str(raw_key).strip()
        lower_key = key.lower()
        column = key_to_column.get(lower_key)

        if column is None and key in expected_set:
            column = key

        if column is None:
            continue

        features[column] = raw_value
        applied_fields.append(column)

    return dedupe_preserve_order(applied_fields)


def compute_risk_band(score_0_100: float) -> str:
    if score_0_100 < 35:
        return "LOW"
    if score_0_100 <= 65:
        return "MEDIUM"
    return "HIGH"


def build_top_factors(
    row: dict[str, Any],
    defaulted_fields: list[str],
) -> list[dict[str, str]]:
    defaulted = set(defaulted_fields)
    factors: list[dict[str, str]] = []

    def note_with_default(base: str, field: str) -> str:
        if field in defaulted:
            return f"{base}; default used"
        return base

    def add_factor(name: str, effect: str, note: str) -> None:
        factors.append({"name": name, "effect": effect, "note": note})

    total_years = int(row.get("TotalWorkingYears", 0) or 0)
    if total_years <= 3:
        add_factor(
            "TotalWorkingYears",
            "higher risk",
            note_with_default("estimated low experience", "TotalWorkingYears"),
        )

    if str(row.get("OverTime", "")).lower() == "yes":
        add_factor(
            "OverTime",
            "higher risk",
            note_with_default("overtime expectation can increase churn", "OverTime"),
        )

    distance = int(row.get("DistanceFromHome", 0) or 0)
    if distance >= 20:
        add_factor(
            "DistanceFromHome",
            "higher risk",
            note_with_default("long commute often correlates with attrition", "DistanceFromHome"),
        )

    satisfaction = int(row.get("JobSatisfaction", 0) or 0)
    if satisfaction <= 2:
        add_factor(
            "JobSatisfaction",
            "higher risk",
            note_with_default("low satisfaction signal", "JobSatisfaction"),
        )

    work_life = int(row.get("WorkLifeBalance", 0) or 0)
    if work_life <= 2:
        add_factor(
            "WorkLifeBalance",
            "higher risk",
            note_with_default("poor work-life balance signal", "WorkLifeBalance"),
        )

    if not factors:
        if total_years >= 10:
            add_factor(
                "TotalWorkingYears",
                "lower risk",
                note_with_default("strong experience history", "TotalWorkingYears"),
            )

        if str(row.get("OverTime", "")).lower() == "no":
            add_factor(
                "OverTime",
                "lower risk",
                note_with_default("overtime not indicated", "OverTime"),
            )

        if work_life >= 3:
            add_factor(
                "WorkLifeBalance",
                "lower risk",
                note_with_default("balanced work profile", "WorkLifeBalance"),
            )

    return factors[:3]


def build_example_payload(
    expected_columns: list[str],
    numeric_columns: list[str],
    categorical_columns: list[str],
) -> dict[str, Any]:
    payload: dict[str, Any] = {}

    for column in expected_columns:
        if column in numeric_columns:
            payload[column] = NUMERIC_DEFAULTS.get(column, 0)
        elif column in categorical_columns:
            payload[column] = CATEGORICAL_DEFAULTS.get(column, "Unknown")
        else:
            payload[column] = get_default_value(column)

    return payload


def safe_remove_file(path: Path) -> None:
    if path.exists():
        path.unlink(missing_ok=True)
