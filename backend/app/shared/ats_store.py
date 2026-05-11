from __future__ import annotations

import hashlib
import json
from copy import deepcopy
from datetime import datetime, timedelta, timezone
from pathlib import Path
from threading import Lock
from typing import Any, Optional
from uuid import uuid4


ROLE_CANDIDATE = "candidate"
ROLE_RECRUITER = "recruiter"
ROLE_ADMIN = "admin"

ALLOWED_ROLES = {ROLE_CANDIDATE, ROLE_RECRUITER, ROLE_ADMIN}

DEFAULT_APPLICATION_STATUSES = {
    "Applied",
    "Under Review",
    "Shortlisted",
    "Interview Scheduled",
    "Interviewed",
    "Final Review",
    "Selected",
    "Rejected",
    "Talent Pool",
    "Withdrawn",
}

TOKEN_TTL_HOURS = 12

JOB_IMAGE_URLS = {
    "Software Engineer": "https://images.pexels.com/photos/1181675/pexels-photo-1181675.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Backend Developer": "https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Frontend Developer": "https://images.pexels.com/photos/574071/pexels-photo-574071.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Full Stack Developer": "https://images.pexels.com/photos/6803533/pexels-photo-6803533.jpeg?auto=compress&cs=tinysrgb&w=900",
    "DevOps Engineer": "https://images.pexels.com/photos/1181316/pexels-photo-1181316.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Data Analyst": "https://images.pexels.com/photos/590020/pexels-photo-590020.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Machine Learning Engineer": "https://images.pexels.com/photos/3862599/pexels-photo-3862599.jpeg?auto=compress&cs=tinysrgb&w=900",
    "QA Automation Engineer": "https://images.pexels.com/photos/6805152/pexels-photo-6805152.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Cloud Engineer": "https://images.pexels.com/photos/1181354/pexels-photo-1181354.jpeg?auto=compress&cs=tinysrgb&w=900",
    "Cybersecurity Analyst": "https://images.pexels.com/photos/5380642/pexels-photo-5380642.jpeg?auto=compress&cs=tinysrgb&w=900",
}

DEMO_IT_JOBS: list[dict[str, Any]] = [
    {
        "title": "Software Engineer",
        "department": "Engineering",
        "required_skills": ["Python", "FastAPI", "SQL"],
        "experience_level": "2+ years",
        "responsibilities": "Build backend services, write reliable APIs, tune database queries, and collaborate with product teams on production-ready features.",
        "work_type": "hybrid",
        "location": "Colombo",
        "salary_min": 180000,
        "salary_max": 320000,
        "image_url": JOB_IMAGE_URLS["Software Engineer"],
    },
    {
        "title": "Backend Developer",
        "department": "Engineering",
        "required_skills": ["Java", "Spring Boot", "MySQL"],
        "experience_level": "2+ years",
        "responsibilities": "Develop Spring Boot APIs, integrate internal systems, maintain MySQL schemas, and improve service performance.",
        "work_type": "onsite",
        "location": "Colombo",
        "salary_min": 200000,
        "salary_max": 350000,
        "image_url": JOB_IMAGE_URLS["Backend Developer"],
    },
    {
        "title": "Frontend Developer",
        "department": "Engineering",
        "required_skills": ["React", "TypeScript", "CSS"],
        "experience_level": "1+ years",
        "responsibilities": "Build responsive React interfaces, convert product designs into reusable components, and improve accessibility and performance.",
        "work_type": "remote",
        "location": "Sri Lanka",
        "salary_min": 160000,
        "salary_max": 280000,
        "image_url": JOB_IMAGE_URLS["Frontend Developer"],
    },
    {
        "title": "Full Stack Developer",
        "department": "Engineering",
        "required_skills": ["Node.js", "React", "PostgreSQL"],
        "experience_level": "3+ years",
        "responsibilities": "Deliver end-to-end web features across Node.js services, React screens, PostgreSQL data models, and deployment handoffs.",
        "work_type": "hybrid",
        "location": "Colombo",
        "salary_min": 250000,
        "salary_max": 450000,
        "image_url": JOB_IMAGE_URLS["Full Stack Developer"],
    },
    {
        "title": "DevOps Engineer",
        "department": "Platform",
        "required_skills": ["Docker", "Kubernetes", "AWS"],
        "experience_level": "3+ years",
        "responsibilities": "Maintain CI/CD pipelines, Kubernetes workloads, AWS environments, release automation, and cloud monitoring.",
        "work_type": "hybrid",
        "location": "Colombo",
        "salary_min": 260000,
        "salary_max": 480000,
        "image_url": JOB_IMAGE_URLS["DevOps Engineer"],
    },
    {
        "title": "Data Analyst",
        "department": "Data",
        "required_skills": ["SQL", "Power BI", "Python"],
        "experience_level": "1+ years",
        "responsibilities": "Analyze hiring data, build Power BI dashboards, clean SQL datasets, and present actionable recruiting insights.",
        "work_type": "onsite",
        "location": "Colombo",
        "salary_min": 140000,
        "salary_max": 260000,
        "image_url": JOB_IMAGE_URLS["Data Analyst"],
    },
    {
        "title": "Machine Learning Engineer",
        "department": "AI",
        "required_skills": ["Python", "TensorFlow", "NLP"],
        "experience_level": "2+ years",
        "responsibilities": "Build model training pipelines, evaluate NLP features, deploy TensorFlow experiments, and monitor model quality.",
        "work_type": "hybrid",
        "location": "Colombo",
        "salary_min": 280000,
        "salary_max": 520000,
        "image_url": JOB_IMAGE_URLS["Machine Learning Engineer"],
    },
    {
        "title": "QA Automation Engineer",
        "department": "Quality",
        "required_skills": ["Selenium", "Python", "API Testing"],
        "experience_level": "2+ years",
        "responsibilities": "Automate regression tests, validate APIs, maintain test suites, and report release-quality risks clearly.",
        "work_type": "onsite",
        "location": "Colombo",
        "salary_min": 150000,
        "salary_max": 280000,
        "image_url": JOB_IMAGE_URLS["QA Automation Engineer"],
    },
    {
        "title": "Cloud Engineer",
        "department": "Platform",
        "required_skills": ["AWS", "Terraform", "Linux"],
        "experience_level": "2+ years",
        "responsibilities": "Manage AWS environments, provision infrastructure with Terraform, harden Linux systems, and improve reliability.",
        "work_type": "remote",
        "location": "Sri Lanka",
        "salary_min": 240000,
        "salary_max": 430000,
        "image_url": JOB_IMAGE_URLS["Cloud Engineer"],
    },
    {
        "title": "Cybersecurity Analyst",
        "department": "Security",
        "required_skills": ["SIEM", "Network Security", "Incident Response"],
        "experience_level": "2+ years",
        "responsibilities": "Monitor SIEM alerts, investigate incidents, improve network security controls, and document response playbooks.",
        "work_type": "onsite",
        "location": "Colombo",
        "salary_min": 220000,
        "salary_max": 420000,
        "image_url": JOB_IMAGE_URLS["Cybersecurity Analyst"],
    },
]


class ATSStore:
    def __init__(self, store_path: Path):
        self.store_path = store_path
        self.store_path.parent.mkdir(parents=True, exist_ok=True)
        self._lock = Lock()
        self._initialized = False

    def init(self) -> None:
        with self._lock:
            state = self._read_state_unlocked()
            self._ensure_seed_data_unlocked(state)
            self._write_state_unlocked(state)
            self._initialized = True

    def _default_state(self) -> dict[str, Any]:
        return {
            "meta": {
                "version": 1,
                "created_at": self._now_iso(),
                "updated_at": self._now_iso(),
            },
            "counters": {
                "company": 0,
                "user": 0,
                "vacancy": 0,
                "application": 0,
                "interview": 0,
                "audit": 0,
            },
            "companies": [],
            "users": [],
            "sessions": {},
            "vacancies": [],
            "applications": [],
            "interviews": [],
            "audit_logs": [],
        }

    def _read_state_unlocked(self) -> dict[str, Any]:
        if not self.store_path.exists():
            return self._default_state()

        try:
            payload = json.loads(self.store_path.read_text(encoding="utf-8"))
        except Exception:
            return self._default_state()

        state = self._default_state()
        state.update(payload if isinstance(payload, dict) else {})

        for key in ["companies", "users", "vacancies", "applications", "interviews", "audit_logs"]:
            if not isinstance(state.get(key), list):
                state[key] = []

        if not isinstance(state.get("sessions"), dict):
            state["sessions"] = {}

        counters = state.get("counters")
        if not isinstance(counters, dict):
            state["counters"] = self._default_state()["counters"]
        else:
            for counter_key in self._default_state()["counters"].keys():
                counters[counter_key] = int(counters.get(counter_key, 0) or 0)

        return state

    def _write_state_unlocked(self, state: dict[str, Any]) -> None:
        state["meta"]["updated_at"] = self._now_iso()
        self.store_path.write_text(json.dumps(state, indent=2), encoding="utf-8")

    def _ensure_seed_data_unlocked(self, state: dict[str, Any]) -> None:
        if not state["users"]:
            company_id = self._next_id_unlocked(state, "company", "CMP")
            state["companies"].append(
                {
                    "company_id": company_id,
                    "name": "Default Research Labs",
                    "industry": "Technology",
                    "location": "Colombo",
                    "created_at": self._now_iso(),
                    "created_by": "system",
                }
            )

            def _seed_user(name: str, email: str, role: str, password: str) -> None:
                user_id = self._next_id_unlocked(state, "user", "USR")
                state["users"].append(
                    {
                        "user_id": user_id,
                        "name": name,
                        "email": email.lower().strip(),
                        "role": role,
                        "company_id": company_id if role != ROLE_CANDIDATE else None,
                        "password_hash": self._hash_password(password),
                        "active": True,
                        "created_at": self._now_iso(),
                    }
                )

            _seed_user("System Admin", "admin@talentai.local", ROLE_ADMIN, "Admin123!")
            _seed_user("Lead Recruiter", "hr@talentai.local", ROLE_RECRUITER, "Recruiter123!")
            _seed_user("Default Candidate", "candidate@talentai.local", ROLE_CANDIDATE, "Candidate123!")

        self._ensure_demo_vacancies_unlocked(state)

    def _ensure_demo_vacancies_unlocked(self, state: dict[str, Any]) -> None:
        recruiter_user = next((u for u in state["users"] if u.get("role") == ROLE_RECRUITER), None)
        if recruiter_user is None:
            recruiter_user = next((u for u in state["users"] if u.get("role") == ROLE_ADMIN), None)
        if recruiter_user is None:
            return

        recruiter_id = str(recruiter_user.get("user_id", "system"))
        company_id = recruiter_user.get("company_id")
        templates_by_title = {
            str(item.get("title", "")).strip().lower(): item
            for item in DEMO_IT_JOBS
            if str(item.get("title", "")).strip()
        }
        existing_titles = {str(item.get("title", "")).strip().lower() for item in state["vacancies"]}

        for vacancy in state["vacancies"]:
            template = templates_by_title.get(str(vacancy.get("title", "")).strip().lower())
            if not template:
                continue
            changed = False
            for key in [
                "experience_level",
                "responsibilities",
                "work_type",
                "location",
                "salary_min",
                "salary_max",
                "image_url",
            ]:
                if not vacancy.get(key) and template.get(key):
                    vacancy[key] = template.get(key)
                    changed = True
            if changed:
                vacancy["updated_at"] = self._now_iso()

        for template in DEMO_IT_JOBS:
            title = str(template.get("title", "")).strip()
            title_key = title.lower()
            if not title or title_key in existing_titles:
                continue

            now = self._now_iso()
            required_skills = template.get("required_skills") or []
            vacancy_id = self._next_id_unlocked(state, "vacancy", "VAC")
            vacancy = {
                "vacancy_id": vacancy_id,
                "title": title,
                "department": template.get("department", "Engineering"),
                "salary_min": template.get("salary_min"),
                "salary_max": template.get("salary_max"),
                "required_skills": [str(skill).strip() for skill in required_skills if str(skill).strip()],
                "experience_level": template.get("experience_level", "Not specified"),
                "responsibilities": template.get("responsibilities", ""),
                "deadline": None,
                "work_type": template.get("work_type", "onsite"),
                "location": template.get("location", ""),
                "image_url": template.get("image_url", ""),
                "status": "open",
                "company_id": company_id,
                "recruiter_id": recruiter_id,
                "created_at": now,
                "updated_at": now,
            }
            state["vacancies"].append(vacancy)
            existing_titles.add(title_key)

    def _next_id_unlocked(self, state: dict[str, Any], key: str, prefix: str) -> str:
        state["counters"][key] = int(state["counters"].get(key, 0) or 0) + 1
        return f"{prefix}-{state['counters'][key]:05d}"

    def _now_iso(self) -> str:
        return datetime.now(timezone.utc).isoformat()

    def _hash_password(self, password: str) -> str:
        return hashlib.sha256(password.encode("utf-8")).hexdigest()

    def _sanitize_user(self, user: dict[str, Any]) -> dict[str, Any]:
        safe = dict(user)
        safe.pop("password_hash", None)
        return safe

    def _get_user_by_id_unlocked(self, state: dict[str, Any], user_id: str) -> Optional[dict[str, Any]]:
        return next((item for item in state["users"] if item.get("user_id") == user_id), None)

    def _get_vacancy_by_id_unlocked(self, state: dict[str, Any], vacancy_id: str) -> Optional[dict[str, Any]]:
        return next((item for item in state["vacancies"] if item.get("vacancy_id") == vacancy_id), None)

    def _get_application_by_id_unlocked(self, state: dict[str, Any], application_id: str) -> Optional[dict[str, Any]]:
        return next((item for item in state["applications"] if item.get("application_id") == application_id), None)

    def _audit_unlocked(
        self,
        state: dict[str, Any],
        *,
        actor_user_id: str,
        action: str,
        target_type: str,
        target_id: str,
        details: Optional[dict[str, Any]] = None,
    ) -> None:
        audit_id = self._next_id_unlocked(state, "audit", "ADT")
        state["audit_logs"].append(
            {
                "audit_id": audit_id,
                "actor_user_id": actor_user_id,
                "action": action,
                "target_type": target_type,
                "target_id": target_id,
                "details": details or {},
                "created_at": self._now_iso(),
            }
        )

    def register_user(
        self,
        *,
        name: str,
        email: str,
        password: str,
        role: str,
        company_id: Optional[str],
        created_by: str,
    ) -> dict[str, Any]:
        role_normalized = str(role).strip().lower()
        if role_normalized not in ALLOWED_ROLES:
            raise ValueError("role must be one of: candidate, recruiter, admin")

        normalized_email = str(email).strip().lower()
        if not normalized_email:
            raise ValueError("email is required")

        if len(password) < 6:
            raise ValueError("password must have at least 6 characters")

        with self._lock:
            state = self._read_state_unlocked()
            self._ensure_seed_data_unlocked(state)

            if any(item.get("email") == normalized_email for item in state["users"]):
                raise ValueError("email already registered")

            resolved_company_id = company_id
            if role_normalized in {ROLE_RECRUITER, ROLE_ADMIN}:
                if not resolved_company_id and state["companies"]:
                    resolved_company_id = state["companies"][0]["company_id"]
                if resolved_company_id and not any(c.get("company_id") == resolved_company_id for c in state["companies"]):
                    raise ValueError("company_id not found")

            user_id = self._next_id_unlocked(state, "user", "USR")
            user = {
                "user_id": user_id,
                "name": str(name).strip() or "Unnamed User",
                "email": normalized_email,
                "role": role_normalized,
                "company_id": resolved_company_id if role_normalized != ROLE_CANDIDATE else None,
                "password_hash": self._hash_password(password),
                "active": True,
                "created_at": self._now_iso(),
            }
            state["users"].append(user)
            self._audit_unlocked(
                state,
                actor_user_id=created_by,
                action="user_registered",
                target_type="user",
                target_id=user_id,
                details={"role": role_normalized},
            )
            self._write_state_unlocked(state)
            return self._sanitize_user(user)

    def authenticate(self, *, email: str, password: str) -> dict[str, Any]:
        normalized_email = str(email).strip().lower()
        with self._lock:
            state = self._read_state_unlocked()
            self._ensure_seed_data_unlocked(state)
            user = next((u for u in state["users"] if u.get("email") == normalized_email), None)
            if not user or user.get("password_hash") != self._hash_password(password):
                raise ValueError("invalid email or password")
            if not user.get("active", True):
                raise ValueError("user account is disabled")

            token = uuid4().hex
            expires_at = (datetime.now(timezone.utc) + timedelta(hours=TOKEN_TTL_HOURS)).isoformat()
            state["sessions"][token] = {
                "user_id": user.get("user_id"),
                "expires_at": expires_at,
            }
            self._audit_unlocked(
                state,
                actor_user_id=user.get("user_id", "unknown"),
                action="login",
                target_type="session",
                target_id=token[:8],
            )
            self._write_state_unlocked(state)

            return {
                "token": token,
                "expires_at": expires_at,
                "user": self._sanitize_user(user),
            }

    def get_user_by_token(self, token: str) -> Optional[dict[str, Any]]:
        if not token:
            return None

        with self._lock:
            state = self._read_state_unlocked()
            session = state["sessions"].get(token)
            if not session:
                return None

            expires_at = session.get("expires_at")
            try:
                expires_dt = datetime.fromisoformat(expires_at)
            except Exception:
                state["sessions"].pop(token, None)
                self._write_state_unlocked(state)
                return None

            if expires_dt <= datetime.now(timezone.utc):
                state["sessions"].pop(token, None)
                self._write_state_unlocked(state)
                return None

            user = self._get_user_by_id_unlocked(state, session.get("user_id", ""))
            if not user:
                return None
            return self._sanitize_user(user)

    def create_company(self, *, name: str, industry: str, location: str, actor_user_id: str) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            company_id = self._next_id_unlocked(state, "company", "CMP")
            company = {
                "company_id": company_id,
                "name": str(name).strip() or "Unnamed Company",
                "industry": str(industry).strip() or "Unknown",
                "location": str(location).strip() or "Unknown",
                "created_at": self._now_iso(),
                "created_by": actor_user_id,
            }
            state["companies"].append(company)
            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="company_created",
                target_type="company",
                target_id=company_id,
            )
            self._write_state_unlocked(state)
            return deepcopy(company)

    def list_companies(self) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            return deepcopy(state["companies"])

    def list_users(self) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            return [self._sanitize_user(item) for item in state["users"]]

    def get_user(self, user_id: str) -> Optional[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            user = self._get_user_by_id_unlocked(state, user_id)
            return self._sanitize_user(user) if user else None

    def set_user_active(
        self,
        *,
        user_id: str,
        active: bool,
        actor_user_id: str,
        reason: str = "",
    ) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            user = self._get_user_by_id_unlocked(state, user_id)
            if not user:
                raise ValueError("user not found")

            if actor_user_id == user_id and not active:
                raise ValueError("admin cannot deactivate their own account")

            previous_active = bool(user.get("active", True))
            user["active"] = bool(active)

            if not active:
                # Revoke all active sessions when account is disabled.
                tokens_to_remove = [
                    token
                    for token, session in state.get("sessions", {}).items()
                    if session.get("user_id") == user_id
                ]
                for token in tokens_to_remove:
                    state["sessions"].pop(token, None)

            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="user_access_updated",
                target_type="user",
                target_id=user_id,
                details={
                    "active": bool(active),
                    "previous_active": previous_active,
                    "reason": str(reason).strip(),
                },
            )
            self._write_state_unlocked(state)
            return self._sanitize_user(user)

    def create_vacancy(self, payload: dict[str, Any], *, actor_user_id: str) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            actor = self._get_user_by_id_unlocked(state, actor_user_id)
            if not actor:
                raise ValueError("actor not found")

            vacancy_id = self._next_id_unlocked(state, "vacancy", "VAC")
            required_skills = payload.get("required_skills") or []
            if not isinstance(required_skills, list):
                required_skills = []

            vacancy = {
                "vacancy_id": vacancy_id,
                "title": payload.get("title", "Untitled Role"),
                "department": payload.get("department", "General"),
                "salary_min": payload.get("salary_min"),
                "salary_max": payload.get("salary_max"),
                "required_skills": [str(skill).strip() for skill in required_skills if str(skill).strip()],
                "experience_level": payload.get("experience_level", "Not specified"),
                "responsibilities": payload.get("responsibilities", ""),
                "deadline": payload.get("deadline"),
                "work_type": payload.get("work_type", "onsite"),
                "location": payload.get("location", ""),
                "image_url": payload.get("image_url", ""),
                "status": "open",
                "company_id": payload.get("company_id") or actor.get("company_id"),
                "recruiter_id": actor_user_id,
                "created_at": self._now_iso(),
                "updated_at": self._now_iso(),
            }

            state["vacancies"].append(vacancy)
            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="vacancy_created",
                target_type="vacancy",
                target_id=vacancy_id,
            )
            self._write_state_unlocked(state)
            return deepcopy(vacancy)

    def update_vacancy(
        self,
        vacancy_id: str,
        updates: dict[str, Any],
        *,
        actor_user_id: str,
    ) -> dict[str, Any]:
        editable_fields = {
            "title",
            "department",
            "salary_min",
            "salary_max",
            "required_skills",
            "experience_level",
            "responsibilities",
            "deadline",
            "work_type",
            "location",
            "image_url",
            "status",
        }

        with self._lock:
            state = self._read_state_unlocked()
            vacancy = self._get_vacancy_by_id_unlocked(state, vacancy_id)
            if not vacancy:
                raise ValueError("vacancy not found")

            for key, value in updates.items():
                if key not in editable_fields:
                    continue
                if key == "required_skills":
                    if isinstance(value, list):
                        vacancy[key] = [str(skill).strip() for skill in value if str(skill).strip()]
                    continue
                vacancy[key] = value

            vacancy["updated_at"] = self._now_iso()
            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="vacancy_updated",
                target_type="vacancy",
                target_id=vacancy_id,
            )
            self._write_state_unlocked(state)
            return deepcopy(vacancy)

    def list_vacancies(self, *, include_closed: bool = False) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            vacancies = state["vacancies"]
            if not include_closed:
                vacancies = [item for item in vacancies if str(item.get("status", "open")).lower() == "open"]
            return deepcopy(vacancies)

    def get_vacancy(self, vacancy_id: str) -> Optional[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            vacancy = self._get_vacancy_by_id_unlocked(state, vacancy_id)
            return deepcopy(vacancy) if vacancy else None

    def list_recruiter_vacancies(self, recruiter_id: str) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            data = [item for item in state["vacancies"] if item.get("recruiter_id") == recruiter_id]
            return deepcopy(data)

    def create_application(self, payload: dict[str, Any], *, actor_user_id: str) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            vacancy = self._get_vacancy_by_id_unlocked(state, payload.get("vacancy_id", ""))
            if not vacancy:
                raise ValueError("vacancy not found")

            existing = next(
                (
                    app
                    for app in state["applications"]
                    if app.get("vacancy_id") == payload.get("vacancy_id")
                    and app.get("candidate_id") == actor_user_id
                ),
                None,
            )
            if existing:
                raise ValueError("candidate already applied to this vacancy")

            application_id = self._next_id_unlocked(state, "application", "APP")
            status = payload.get("status") or "Applied"
            if status not in DEFAULT_APPLICATION_STATUSES:
                status = "Applied"

            application = {
                "application_id": application_id,
                "vacancy_id": payload.get("vacancy_id"),
                "candidate_id": actor_user_id,
                "candidate_name": payload.get("candidate_name"),
                "candidate_email": payload.get("candidate_email"),
                "resume": payload.get("resume") or {},
                "ai_scores": payload.get("ai_scores") or {},
                "status": status,
                "status_history": [
                    {
                        "status": status,
                        "timestamp": self._now_iso(),
                        "note": "Application submitted",
                        "actor_user_id": actor_user_id,
                    }
                ],
                "final_decision": None,
                "created_at": self._now_iso(),
                "updated_at": self._now_iso(),
            }
            state["applications"].append(application)
            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="application_created",
                target_type="application",
                target_id=application_id,
                details={"vacancy_id": payload.get("vacancy_id")},
            )
            self._write_state_unlocked(state)
            return deepcopy(application)

    def list_candidate_applications(self, candidate_id: str) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            apps = [item for item in state["applications"] if item.get("candidate_id") == candidate_id]
            return deepcopy(apps)

    def list_recruiter_applications(self, recruiter_id: str, vacancy_id: Optional[str] = None) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            recruiter_vacancy_ids = {
                item.get("vacancy_id") for item in state["vacancies"] if item.get("recruiter_id") == recruiter_id
            }
            data = [item for item in state["applications"] if item.get("vacancy_id") in recruiter_vacancy_ids]
            if vacancy_id:
                data = [item for item in data if item.get("vacancy_id") == vacancy_id]
            return deepcopy(data)

    def get_application(self, application_id: str) -> Optional[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            app = self._get_application_by_id_unlocked(state, application_id)
            return deepcopy(app) if app else None

    def update_application_status(
        self,
        application_id: str,
        *,
        status: str,
        note: str,
        actor_user_id: str,
    ) -> dict[str, Any]:
        if status not in DEFAULT_APPLICATION_STATUSES:
            raise ValueError("invalid application status")

        with self._lock:
            state = self._read_state_unlocked()
            app = self._get_application_by_id_unlocked(state, application_id)
            if not app:
                raise ValueError("application not found")

            app["status"] = status
            app["updated_at"] = self._now_iso()
            history = app.setdefault("status_history", [])
            history.append(
                {
                    "status": status,
                    "timestamp": self._now_iso(),
                    "note": note,
                    "actor_user_id": actor_user_id,
                }
            )

            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="application_status_updated",
                target_type="application",
                target_id=application_id,
                details={"status": status},
            )
            self._write_state_unlocked(state)
            return deepcopy(app)

    def update_application_ai_scores(
        self,
        application_id: str,
        *,
        ai_scores: dict[str, Any],
        resume: Optional[dict[str, Any]] = None,
        actor_user_id: str,
        note: str = "AI scores re-evaluated",
    ) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            app = self._get_application_by_id_unlocked(state, application_id)
            if not app:
                raise ValueError("application not found")

            app["ai_scores"] = deepcopy(ai_scores)
            if resume is not None:
                existing_resume = app.get("resume") or {}
                merged_resume = deepcopy(existing_resume)
                merged_resume.update(deepcopy(resume))
                app["resume"] = merged_resume
            app["updated_at"] = self._now_iso()
            app.setdefault("status_history", []).append(
                {
                    "status": app.get("status", "Under Review"),
                    "timestamp": self._now_iso(),
                    "note": note,
                    "actor_user_id": actor_user_id,
                }
            )

            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="application_ai_scores_updated",
                target_type="application",
                target_id=application_id,
                details={"note": note},
            )
            self._write_state_unlocked(state)
            return deepcopy(app)

    def create_interview(
        self,
        *,
        application_id: str,
        interview_type: str,
        scheduled_at: str,
        question_text: Optional[str],
        actor_user_id: str,
    ) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            app = self._get_application_by_id_unlocked(state, application_id)
            if not app:
                raise ValueError("application not found")

            interview_id = self._next_id_unlocked(state, "interview", "INT")
            interview = {
                "interview_id": interview_id,
                "application_id": application_id,
                "interview_type": interview_type,
                "scheduled_at": scheduled_at,
                "question_text": question_text,
                "status": "scheduled",
                "evaluation": None,
                "answer_text": None,
                "created_at": self._now_iso(),
                "updated_at": self._now_iso(),
            }

            state["interviews"].append(interview)

            app["status"] = "Interview Scheduled"
            app.setdefault("status_history", []).append(
                {
                    "status": "Interview Scheduled",
                    "timestamp": self._now_iso(),
                    "note": f"Interview {interview_id} scheduled",
                    "actor_user_id": actor_user_id,
                }
            )
            app["updated_at"] = self._now_iso()

            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="interview_scheduled",
                target_type="interview",
                target_id=interview_id,
                details={"application_id": application_id},
            )
            self._write_state_unlocked(state)
            return deepcopy(interview)

    def list_application_interviews(self, application_id: str) -> list[dict[str, Any]]:
        with self._lock:
            state = self._read_state_unlocked()
            data = [item for item in state["interviews"] if item.get("application_id") == application_id]
            return deepcopy(data)

    def complete_interview(
        self,
        interview_id: str,
        *,
        answer_text: str,
        evaluation: dict[str, Any],
        actor_user_id: str,
    ) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            interview = next((i for i in state["interviews"] if i.get("interview_id") == interview_id), None)
            if not interview:
                raise ValueError("interview not found")

            interview["status"] = "completed"
            interview["answer_text"] = answer_text
            interview["evaluation"] = evaluation
            interview["updated_at"] = self._now_iso()

            app = self._get_application_by_id_unlocked(state, interview.get("application_id", ""))
            if app:
                app_ai = app.setdefault("ai_scores", {})
                app_ai["interview"] = evaluation
                app["status"] = "Interviewed"
                app.setdefault("status_history", []).append(
                    {
                        "status": "Interviewed",
                        "timestamp": self._now_iso(),
                        "note": f"Interview {interview_id} evaluated",
                        "actor_user_id": actor_user_id,
                    }
                )
                app["updated_at"] = self._now_iso()

            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="interview_completed",
                target_type="interview",
                target_id=interview_id,
            )
            self._write_state_unlocked(state)
            return deepcopy(interview)

    def set_application_decision(
        self,
        application_id: str,
        *,
        decision: str,
        note: str,
        final_score: float,
        actor_user_id: str,
    ) -> dict[str, Any]:
        decision_map = {
            "selected": "Selected",
            "rejected": "Rejected",
            "talent_pool": "Talent Pool",
            "review": "Final Review",
        }
        next_status = decision_map.get(decision)
        if not next_status:
            raise ValueError("decision must be one of: selected, rejected, talent_pool, review")

        with self._lock:
            state = self._read_state_unlocked()
            app = self._get_application_by_id_unlocked(state, application_id)
            if not app:
                raise ValueError("application not found")

            app["final_decision"] = {
                "decision": decision,
                "status": next_status,
                "note": note,
                "final_score": round(float(final_score), 2),
                "decided_by": actor_user_id,
                "decided_at": self._now_iso(),
            }
            app["status"] = next_status
            app.setdefault("status_history", []).append(
                {
                    "status": next_status,
                    "timestamp": self._now_iso(),
                    "note": note,
                    "actor_user_id": actor_user_id,
                }
            )
            app["updated_at"] = self._now_iso()

            self._audit_unlocked(
                state,
                actor_user_id=actor_user_id,
                action="application_final_decision",
                target_type="application",
                target_id=application_id,
                details={"decision": decision, "final_score": round(float(final_score), 2)},
            )
            self._write_state_unlocked(state)
            return deepcopy(app)

    def recruiter_dashboard(self, recruiter_id: str, vacancy_id: Optional[str] = None) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            recruiter_vacancy_ids = {
                item.get("vacancy_id") for item in state["vacancies"] if item.get("recruiter_id") == recruiter_id
            }
            if vacancy_id:
                recruiter_vacancy_ids = {vacancy_id} if vacancy_id in recruiter_vacancy_ids else set()

            apps = [item for item in state["applications"] if item.get("vacancy_id") in recruiter_vacancy_ids]

            funnel = {
                "Applied": 0,
                "Under Review": 0,
                "Shortlisted": 0,
                "Interview Scheduled": 0,
                "Interviewed": 0,
                "Final Review": 0,
                "Selected": 0,
                "Rejected": 0,
                "Talent Pool": 0,
            }
            risk_bands = {"LOW": 0, "MEDIUM": 0, "HIGH": 0}
            skill_heatmap: dict[str, int] = {}
            candidate_rows: list[dict[str, Any]] = []

            for app in apps:
                status = str(app.get("status", "Applied"))
                if status in funnel:
                    funnel[status] += 1

                ai_scores = app.get("ai_scores") or {}
                matching = ai_scores.get("matching") or {}
                risk = ai_scores.get("risk") or {}
                interview = ai_scores.get("interview") or {}
                final_decision = app.get("final_decision") or {}

                risk_band = str(risk.get("risk_band", "")).upper()
                if risk_band in risk_bands:
                    risk_bands[risk_band] += 1

                candidate_skills = app.get("resume", {}).get("skills", [])
                if isinstance(candidate_skills, list):
                    for raw_skill in candidate_skills:
                        skill = str(raw_skill).strip().lower()
                        if not skill:
                            continue
                        skill_heatmap[skill] = int(skill_heatmap.get(skill, 0)) + 1

                candidate_rows.append(
                    {
                        "application_id": app.get("application_id"),
                        "candidate_name": app.get("candidate_name"),
                        "vacancy_id": app.get("vacancy_id"),
                        "status": status,
                        "match_score": matching.get("score_0_100"),
                        "interview_score": interview.get("overall_score_0_100"),
                        "risk_band": risk.get("risk_band"),
                        "risk_score": risk.get("attrition_risk_score_0_100"),
                        "final_decision": final_decision.get("decision"),
                    }
                )

            total = len(apps)
            selected = funnel.get("Selected", 0)
            interview_stage = (
                funnel.get("Interview Scheduled", 0)
                + funnel.get("Interviewed", 0)
                + funnel.get("Final Review", 0)
            )

            top_skills = sorted(
                [{"skill": skill, "count": count} for skill, count in skill_heatmap.items()],
                key=lambda item: item["count"],
                reverse=True,
            )[:15]

            return {
                "total_vacancies": len(recruiter_vacancy_ids),
                "total_applications": total,
                "funnel": funnel,
                "risk_distribution": risk_bands,
                "top_skills": top_skills,
                "candidates": candidate_rows,
                "conversion": {
                    "applied_to_interview_pct": round((interview_stage / total) * 100, 2) if total else 0.0,
                    "applied_to_selected_pct": round((selected / total) * 100, 2) if total else 0.0,
                },
            }

    def admin_report(self) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            users = state["users"]
            vacancies = state["vacancies"]
            applications = state["applications"]

            role_counts = {ROLE_ADMIN: 0, ROLE_RECRUITER: 0, ROLE_CANDIDATE: 0}
            for user in users:
                role = str(user.get("role", "")).lower()
                if role in role_counts:
                    role_counts[role] += 1

            return {
                "counts": {
                    "users": len(users),
                    "companies": len(state["companies"]),
                    "vacancies": len(vacancies),
                    "applications": len(applications),
                    "interviews": len(state["interviews"]),
                },
                "users_by_role": role_counts,
                "open_vacancies": len([v for v in vacancies if str(v.get("status", "")).lower() == "open"]),
                "recent_audit_logs": deepcopy(state["audit_logs"][-50:]),
            }

    def admin_ai_module_stats(self) -> dict[str, Any]:
        with self._lock:
            state = self._read_state_unlocked()
            applications = state["applications"]
            interviews = state["interviews"]

            matching_count = 0
            risk_count = 0
            interview_count = 0
            resume_count = 0
            shortlisted_count = 0

            for app in applications:
                ai_scores = app.get("ai_scores") or {}
                if app.get("resume"):
                    resume_count += 1
                if ai_scores.get("matching"):
                    matching_count += 1
                if ai_scores.get("risk"):
                    risk_count += 1
                if ai_scores.get("interview"):
                    interview_count += 1
                if str(app.get("status", "")).strip().lower() == "shortlisted":
                    shortlisted_count += 1

            completed_interviews = len(
                [item for item in interviews if str(item.get("status", "")).strip().lower() == "completed"]
            )

            return {
                "usage_counts": {
                    "resume_parsing": resume_count,
                    "job_matching": matching_count,
                    "risk_prediction": risk_count,
                    "interview_evaluation": interview_count,
                    "applications_total": len(applications),
                    "interviews_completed": completed_interviews,
                    "shortlisted_candidates": shortlisted_count,
                },
                "last_audit_event_at": state.get("meta", {}).get("updated_at"),
            }


_STORE: Optional[ATSStore] = None


def init_ats_store(base_dir: Path) -> ATSStore:
    global _STORE
    data_dir = base_dir / "data"
    store = ATSStore(data_dir / "ats_store.json")
    store.init()
    _STORE = store
    return store


def get_ats_store() -> ATSStore:
    if _STORE is None:
        raise RuntimeError("ATS store is not initialized")
    return _STORE
