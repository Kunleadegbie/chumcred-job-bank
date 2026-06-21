import re
from typing import Any


STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your",
    "you", "are", "will", "our", "their", "have", "has", "was", "were",
    "been", "being", "job", "role", "work", "team", "company", "candidate",
    "experience", "skills", "responsibilities", "requirements", "about",
    "available", "applicant", "applicants", "contract", "better", "balance",
    "believe", "centred", "child", "annum", "including", "within", "across",
    "must", "should", "able", "using", "based", "support", "provide"
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


def overlap_score(resume_keywords: set[str], field_text: str) -> tuple[int, list[str]]:
    field_keywords = extract_keywords(field_text)

    if not resume_keywords or not field_keywords:
        return 0, []

    matched = resume_keywords.intersection(field_keywords)

    if not matched:
        return 0, []

    coverage = len(matched) / max(len(field_keywords), 1)

    score = round(min(100, coverage * 100))

    return score, sorted(list(matched))


def score_job_against_resume(resume_text: str, job: dict) -> dict:
    resume_keywords = extract_keywords(resume_text)

    title_text = normalize_text(job.get("title"))
    requirements_text = normalize_text(job.get("requirements"))
    responsibilities_text = normalize_text(job.get("responsibilities"))
    description_text = normalize_text(job.get("description"))

    title_score, title_matches = overlap_score(resume_keywords, title_text)
    requirements_score, requirements_matches = overlap_score(resume_keywords, requirements_text)
    responsibilities_score, responsibilities_matches = overlap_score(resume_keywords, responsibilities_text)
    description_score, description_matches = overlap_score(resume_keywords, description_text)

    weighted_score = round(
        (title_score * 0.30)
        + (requirements_score * 0.35)
        + (responsibilities_score * 0.20)
        + (description_score * 0.15)
    )

    all_matched_keywords = sorted(
        list(
            set(
                title_matches
                + requirements_matches
                + responsibilities_matches
                + description_matches
            )
        )
    )

    job_keywords = extract_keywords(
        " ".join(
            [
                title_text,
                requirements_text,
                responsibilities_text,
                description_text,
                normalize_text(job.get("industry")),
                normalize_text(job.get("job_function")),
                normalize_text(job.get("location_display")),
                normalize_text(job.get("country")),
                normalize_text(job.get("work_type")),
            ]
        )
    )

    missing_keywords = sorted(list(job_keywords.difference(resume_keywords)))[:15]

    return {
        "job_id": job.get("id"),
        "title": job.get("title"),
        "company_name": job.get("company_name"),
        "location_display": job.get("location_display"),
        "country": job.get("country"),
        "work_type": job.get("work_type"),
        "employment_type": job.get("employment_type"),
        "original_job_url": job.get("original_job_url"),
        "match_score": weighted_score,
        "matched_keywords": all_matched_keywords[:15],
        "missing_keywords": missing_keywords,
        "summary": build_recommendation_summary(
            weighted_score,
            all_matched_keywords,
            missing_keywords,
        ),
    }


def build_recommendation_summary(
    match_score: int,
    matched_keywords: list[str],
    missing_keywords: list[str],
) -> str:
    if match_score >= 80:
        opening = "Strong fit based on your CV and the job requirements."
    elif match_score >= 60:
        opening = "Good potential fit, but your CV may need some targeting."
    elif match_score >= 40:
        opening = "Moderate fit. Review the gaps before applying."
    elif match_score >= 25:
        opening = "Low-to-moderate fit. Apply only if the role is strategically important."
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

        # Only show realistic recommendations.
        if score["match_score"] >= 25:
            scored_jobs.append(score)

    scored_jobs.sort(key=lambda item: item["match_score"], reverse=True)

    return scored_jobs[:limit]