import hashlib
from typing import Dict, Any


class DuplicateChecker:
    def generate_hash(self, job: Dict[str, Any]) -> str:
        title = (job.get("title") or "").strip().lower()
        company = (job.get("company_name") or "").strip().lower()
        country = (job.get("country") or "").strip().lower()
        url = (job.get("original_job_url") or "").strip().lower()

        raw_string = f"{title}|{company}|{country}|{url}"

        return hashlib.sha256(raw_string.encode("utf-8")).hexdigest()

    def attach_duplicate_hash(self, job: Dict[str, Any]) -> Dict[str, Any]:
        job["duplicate_hash"] = self.generate_hash(job)
        return job