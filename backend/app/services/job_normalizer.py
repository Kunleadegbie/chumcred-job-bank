from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
import re


class JobNormalizer:
    def normalize(self, job: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        provider = job.get("provider")
        raw = job.get("raw", {})

        if provider == "adzuna":
            return self.normalize_adzuna(raw, job.get("country"))

        if provider == "remoteok":
            return self.normalize_remoteok(raw)

        if provider == "jsearch":
            return self.normalize_jsearch(raw)

        return None

    def normalize_adzuna(self, raw: Dict[str, Any], country: str) -> Dict[str, Any]:
        title = raw.get("title")
        company = (raw.get("company") or {}).get("display_name")
        location = (raw.get("location") or {}).get("display_name")

        return self.base_job(
            title=title,
            company_name=company,
            country=country.upper() if country else None,
            city=location,
            location_display=location,
            description=raw.get("description"),
            original_job_url=raw.get("redirect_url"),
            source_name="Adzuna",
            external_job_id=str(raw.get("id")),
            salary_min=raw.get("salary_min"),
            salary_max=raw.get("salary_max"),
            posted_at=raw.get("created"),
            work_type=self.detect_work_type(title, raw.get("description")),
            experience_level=self.detect_experience_level(title, raw.get("description")),
            industry=raw.get("category", {}).get("label"),
        )

    def normalize_remoteok(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        title = raw.get("position")
        company = raw.get("company")
        tags = raw.get("tags") or []

        return self.base_job(
            title=title,
            company_name=company,
            country="Global",
            city=None,
            location_display="Remote / Global",
            description=raw.get("description"),
            original_job_url=raw.get("url") or raw.get("apply_url"),
            source_name="RemoteOK",
            external_job_id=str(raw.get("id")),
            salary_min=raw.get("salary_min"),
            salary_max=raw.get("salary_max"),
            posted_at=self.timestamp_to_datetime(raw.get("date")),
            work_type="remote",
            experience_level=self.detect_experience_level(title, raw.get("description")),
            industry=", ".join(tags[:3]) if tags else "Remote Jobs",
        )

    def normalize_jsearch(self, raw: Dict[str, Any]) -> Dict[str, Any]:
        title = raw.get("job_title")
        company = raw.get("employer_name")
        city = raw.get("job_city")
        country = raw.get("job_country")

        return self.base_job(
            title=title,
            company_name=company,
            country=country,
            city=city,
            location_display=raw.get("job_location"),
            description=raw.get("job_description"),
            original_job_url=raw.get("job_apply_link"),
            source_name="JSearch",
            external_job_id=raw.get("job_id"),
            salary_min=raw.get("job_min_salary"),
            salary_max=raw.get("job_max_salary"),
            posted_at=raw.get("job_posted_at_datetime_utc"),
            work_type=self.detect_work_type(title, raw.get("job_description")),
            experience_level=self.detect_experience_level(title, raw.get("job_description")),
            industry=raw.get("job_publisher"),
        )

    def base_job(
        self,
        title,
        company_name,
        country,
        city,
        location_display,
        description,
        original_job_url,
        source_name,
        external_job_id=None,
        salary_min=None,
        salary_max=None,
        posted_at=None,
        work_type=None,
        experience_level=None,
        industry=None,
    ) -> Dict[str, Any]:

        if not title or not original_job_url:
            return None

        slug = self.slugify(f"{title}-{company_name or 'company'}-{external_job_id or datetime.now().timestamp()}")

        return {
            "title": title,
            "slug": slug,
            "company_name": company_name,
            "industry": industry,
            "country": country,
            "city": city,
            "location_display": location_display,
            "work_type": work_type or "onsite",
            "employment_type": "full_time",
            "experience_level": experience_level or "not_specified",
            "eligibility": experience_level or "not_specified",
            "salary_min": salary_min,
            "salary_max": salary_max,
            "salary_display": self.format_salary(salary_min, salary_max),
            "description": description,
            "source_name": source_name,
            "original_job_url": original_job_url,
            "external_job_id": external_job_id,
            "posted_at": posted_at,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
            "expires_at": (datetime.now(timezone.utc) + timedelta(days=45)).isoformat(),
            "status": "active",
            "is_remote": work_type in ["remote", "wfa"],
            "is_visa_sponsorship": self.detect_visa_sponsorship(description),
        }

    def detect_work_type(self, title: str, description: str) -> str:
        text = f"{title or ''} {description or ''}".lower()

        if "work from anywhere" in text or "wfa" in text:
            return "wfa"
        if "remote" in text:
            return "remote"
        if "hybrid" in text:
            return "hybrid"
        return "onsite"

    def detect_experience_level(self, title: str, description: str) -> str:
        text = f"{title or ''} {description or ''}".lower()

        if any(word in text for word in ["intern", "internship"]):
            return "internship"
        if any(word in text for word in ["graduate trainee", "graduate program"]):
            return "graduate_trainee"
        if any(word in text for word in ["entry level", "junior", "no experience"]):
            return "entry_level"
        if any(word in text for word in ["senior", "lead", "principal"]):
            return "senior"
        if any(word in text for word in ["director", "head of", "chief", "executive"]):
            return "executive"
        return "mid_level"

    def detect_visa_sponsorship(self, description: str) -> bool:
        text = (description or "").lower()
        keywords = [
            "visa sponsorship",
            "sponsorship available",
            "skilled worker visa",
            "h1b",
            "h-1b",
            "work permit",
            "relocation support"
        ]
        return any(keyword in text for keyword in keywords)

    def format_salary(self, salary_min, salary_max):
        if salary_min and salary_max:
            return f"{salary_min} - {salary_max}"
        if salary_min:
            return f"From {salary_min}"
        if salary_max:
            return f"Up to {salary_max}"
        return None

    def slugify(self, text: str) -> str:
        text = text.lower()
        text = re.sub(r"[^a-z0-9]+", "-", text)
        text = text.strip("-")
        return text[:180]

    def timestamp_to_datetime(self, value):
        if not value:
            return None

        try:
            if isinstance(value, int):
                return datetime.fromtimestamp(value, timezone.utc).isoformat()
            return value
        except Exception:
            return None