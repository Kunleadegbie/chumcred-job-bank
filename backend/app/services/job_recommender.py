import re
from typing import Any


STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your",
    "you", "are", "will", "our", "their", "have", "has", "was", "were",
    "been", "being", "job", "role", "work", "team", "company", "candidate",
    "experience", "skills", "responsibilities", "requirements"
}


def normalize_text(value: Any) -> str:
    return str(value or "").lower()


def extract_keywords(text: str) -> set[str]:
    text = normalize_text(text)
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", text)

    return {
        word.strip(".,;:()[]{}")
        for word in words
        if word not in STOPWORDS and len(word) >= 3
    }


def score_job_against_resume(resume_text: str, job: dict) -> dict:
    resume_keywords = extract_keywords(resume_text)

    job_text = " ".join(
        [
            normalize_text(job.get("title")),
            normalize_text(job.get("company_name")),
            normalize_text(job.get("description")),
            normalize_text(job.get("requirements")),
            normalize_text(job.get("responsibilities")),
            normalize_text(job.get("industry")),
            normalize_text(job.get("job_function")),
            normalize_text(job.get("location_display")),
            normalize_text(job.get("country")),
            normalize_text(job.get("work_type")),
        ]
    )

    job_keywords = extract_keywords(job_text)

    if not resume_keywords or not job_keywords:
        match_score = 0
        matched_keywords = []
        missing_keywords = list(job_keywords)[:10]
    else:
        matched = resume_keywords.intersection(job_keywords)
        missing = job_keywords.difference(resume_keywords)

        coverage = len(matched) / max(len(job_keywords), 1)
        match_score = round(min(95, max(20, coverage * 100)))

        matched_keywords = sorted(list(matched))[:15]
        missing_keywords = sorted(list(missing))[:15]

    return {
        "job_id": job.get("id"),
        "title": job.get("title"),
        "company_name": job.get("company_name"),
        "location_display": job.get("location_display"),
        "country": job.get("country"),
        "work_type": job.get("work_type"),
        "employment_type": job.get("employment_type"),
        "original_job_url": job.get("original_job_url"),
        "match_score": match_score,
        "matched_keywords": matched_keywords,
        "missing_keywords": missing_keywords,
        "summary": build_recommendation_summary(match_score, matched_keywords, missing_keywords),
    }


def build_recommendation_summary(
    match_score: int,
    matched_keywords: list[str],
    missing_keywords: list[str],
) -> str:
    if match_score >= 80:
        opening = "Strong fit based on your CV keywords and the job requirements."
    elif match_score >= 60:
        opening = "Good potential fit, but your CV may need some targeting."
    elif match_score >= 40:
        opening = "Moderate fit. Review the gaps before applying."
    else:
        opening = "Low fit based on current CV alignment."

    matched_text = ", ".join(matched_keywords[:5]) if matched_keywords else "limited keyword overlap"
    missing_text = ", ".join(missing_keywords[:5]) if missing_keywords else "no major missing keywords detected"

    return f"{opening} Matched areas: {matched_text}. Gaps: {missing_text}."


def recommend_jobs_for_resume(
    resume_text: str,
    jobs: list[dict],
    limit: int = 10,
) -> list[dict]:
    scored_jobs = []

    for job in jobs:
      score = score_job_against_resume(resume_text, job)

      if score["match_score"] > 0:
          scored_jobs.append(score)

    scored_jobs.sort(key=lambda item: item["match_score"], reverse=True)

    return scored_jobs[:limit]