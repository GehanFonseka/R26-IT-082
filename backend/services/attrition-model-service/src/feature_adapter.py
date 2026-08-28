from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd


def _value(source: dict[str, Any], *keys: str) -> Any:
    for key in keys:
        value = source.get(key)
        if value not in (None, ""):
            return value
    return None


def _score(value: Any) -> Any:
    if value in (None, ""):
        return None
    number = float(value)
    return number * 100 if 0 <= number <= 1 else number


class FeatureAdapter:
    """Recreates the notebook preprocessing and maps CV/scenario input to it."""

    def __init__(self, dataset_path: Path, raw_features: list[str], model_features: list[str], categorical: list[str], numerical: list[str]):
        self.raw_features = raw_features
        self.model_features = model_features
        self.categorical = set(categorical)
        self.numerical = set(numerical)
        self.medians: dict[str, float] = {}
        if dataset_path.exists():
            data = pd.read_csv(dataset_path)
            for name in raw_features:
                if name in data and name in self.numerical:
                    self.medians[name] = float(pd.to_numeric(data[name], errors="coerce").median())

    def build(self, candidate: dict[str, Any], simulation: dict[str, Any]) -> tuple[pd.DataFrame, dict[str, Any]]:
        row: dict[str, Any] = {}
        explicit: set[str] = set()
        nested = {**(candidate.get("engagement") or {}), **(candidate.get("historySummary") or {})}
        for name in self.raw_features:
            value = _value(candidate, name, name[0].lower() + name[1:])
            if value is not None:
                row[name], _ = value, explicit.add(name)

        mappings = {
            "JobRole": _value(candidate, "candidateRole", "role"),
            "TotalWorkingYears": _value(candidate, "yearsExperience", "totalWorkingYears"),
            "MatchScore": _score(_value(candidate, "matchScore", "matchProbability")),
            "JobSimilarityScore": _score(_value(candidate, "jobSimilarityScore", "similarityScore")),
            "InterviewScore": _value(candidate, "interviewScore"),
            "TechnicalScore": _value(candidate, "technicalScore"),
            "CommunicationScore": _value(candidate, "communicationScore"),
            "BehaviourScore": _value(candidate, "behaviourScore", "behaviorScore"),
            "ConfidenceScore": _value(candidate, "confidenceScore"),
            "PreferredWorkLocation": _value(candidate, "preferredWorkLocation", "location"),
            "WorkType": _value(candidate, "workType", "currentWorkModel"),
            "NoticePeriodDays": _value(candidate, "noticePeriodDays"),
            "NumCompaniesWorked": _value(candidate, "numCompaniesWorked"),
            "YearsAtCompany": _value(candidate, "yearsAtCompany"),
            "YearsInCurrentRole": _value(candidate, "yearsInCurrentRole"),
            "YearsSinceLastPromotion": _value(candidate, "yearsSinceLastPromotion"),
            "YearsWithCurrManager": _value(candidate, "yearsWithCurrManager"),
            "TrainingProgramme": _value(candidate, "trainingProgramme"),
            "MentorshipProgramme": _value(candidate, "mentorshipProgramme"),
            "CareerDevelopmentPlan": _value(candidate, "careerDevelopmentPlan"),
            "CertificationOpportunity": _value(candidate, "certificationOpportunity"),
            "OverTime": _value(candidate, "overTime"),
        }
        mappings["WorkType"] = mappings["WorkType"] or nested.get("currentWorkModel")
        for name, value in mappings.items():
            if value is not None and name in self.raw_features and name not in explicit:
                row[name], _ = value, explicit.add(name)

        self._apply_simulation(row, explicit, candidate, simulation)
        for name in self.raw_features:
            if name not in row or row[name] in (None, ""):
                row[name] = self.medians.get(name, "Missing" if name not in self.numerical else 0)

        frame = pd.DataFrame([row], columns=self.raw_features)
        self._engineer(frame)
        for name in self.categorical:
            if name in frame:
                frame[name] = frame[name].fillna("Missing").astype(str)
        for name in self.numerical:
            if name in frame:
                frame[name] = pd.to_numeric(frame[name], errors="coerce").fillna(0)
        metadata = {
            "inputSource": "candidate-adapter",
            "inputCoverage": round(len(explicit) / max(len(self.raw_features), 1), 3),
            "imputedFeatures": [name for name in self.raw_features if name not in explicit],
        }
        return frame[self.model_features], metadata

    def _apply_simulation(self, row: dict[str, Any], explicit: set[str], candidate: dict[str, Any], simulation: dict[str, Any]) -> None:
        salary = float(simulation.get("salaryAdjustment") or 0)
        if "PercentSalaryHike" in self.raw_features:
            base_hike = float(row.get("PercentSalaryHike") or 0)
            row["PercentSalaryHike"], _ = base_hike + salary, explicit.add("PercentSalaryHike")
        if simulation.get("remoteWork") and "WorkType" in self.raw_features:
            row["WorkType"], _ = "Remote", explicit.add("WorkType")
        if simulation.get("roleChange") and "CareerDevelopmentPlan" in self.raw_features:
            row["CareerDevelopmentPlan"], _ = "Yes", explicit.add("CareerDevelopmentPlan")
        if simulation.get("managerChange") and "MentorshipProgramme" in self.raw_features:
            row["MentorshipProgramme"], _ = "Yes", explicit.add("MentorshipProgramme")
        compensation = candidate.get("compensation") or {}
        expected = _value(candidate, "ExpectedSalaryLKR", "expectedSalaryLKR")
        offered = _value(candidate, "OfferedSalaryLKR", "offeredSalaryLKR")
        expected = expected if expected is not None else compensation.get("expected", compensation.get("expectedLKR", compensation.get("market")))
        offered = offered if offered is not None else compensation.get("current", compensation.get("offeredLKR"))
        if offered is not None and "MonthlyIncomeLKR" in self.raw_features:
            row["MonthlyIncomeLKR"], _ = float(offered), explicit.add("MonthlyIncomeLKR")
        if offered is not None:
            offered = float(offered) * (1 + salary / 100)
            row["OfferedSalaryLKR"], _ = offered, explicit.add("OfferedSalaryLKR")
            if "MonthlyIncomeLKR" in self.raw_features:
                row["MonthlyIncomeLKR"], _ = offered, explicit.add("MonthlyIncomeLKR")
        if expected is not None and "ExpectedSalaryLKR" in self.raw_features:
            row["ExpectedSalaryLKR"], _ = float(expected), explicit.add("ExpectedSalaryLKR")
        if expected and offered is not None:
            row["SalaryGapLKR"], _ = float(expected) - offered, explicit.add("SalaryGapLKR")
            row["SalaryGapPercentage"], _ = abs(float(expected) - offered) / float(expected) * 100, explicit.add("SalaryGapPercentage")

    @staticmethod
    def _engineer(frame: pd.DataFrame) -> None:
        def number(name: str) -> pd.Series:
            return pd.to_numeric(frame.get(name, pd.Series([0])), errors="coerce").fillna(0)

        expected, offered = number("ExpectedSalaryLKR"), number("OfferedSalaryLKR")
        frame["OfferExpectedRatio"] = np.where(expected != 0, offered / expected, 0)
        frame["AverageSatisfaction"] = frame[["EnvironmentSatisfaction", "JobSatisfaction", "RelationshipSatisfaction", "WorkLifeBalance"]].apply(pd.to_numeric, errors="coerce").mean(axis=1)
        frame["InterviewComponentAverage"] = frame[["TechnicalScore", "CommunicationScore", "BehaviourScore", "ConfidenceScore"]].apply(pd.to_numeric, errors="coerce").mean(axis=1)
        frame["MatchInterviewAverage"] = (number("MatchScore") + number("InterviewScore")) / 2
        years = number("YearsAtCompany") + 1
        frame["RoleTenureRatio"] = number("YearsInCurrentRole") / years
        frame["ManagerTenureRatio"] = number("YearsWithCurrManager") / years
        frame["PromotionDelayRatio"] = number("YearsSinceLastPromotion") / years
