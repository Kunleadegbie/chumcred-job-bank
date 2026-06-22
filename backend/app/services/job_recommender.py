import re
from typing import Any


STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your",
    "you", "are", "will", "our", "their", "have", "has", "was", "were",
    "been", "being", "job", "role", "work", "team", "company", "candidate",
    "experience", "skills", "responsibilities", "requirements",
    "about", "available", "applicant", "applicants", "contract",
    "better", "balance", "believe", "centred", "child", "annum",
    "including", "within", "across", "must", "should", "able",
    "using", "based", "support", "provide"
}


def normalize_text(value: Any) -> str:
    return str(value or "").lower()


def extract_keywords(text: str) -> set[str]:
    text = normalize_text(text)

    words = re.findall(
        r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}",
        text,
    )

    return {
        word.strip(".,;:()[]{}")
        for word in words
        if word not in STOPWORDS and len(word) >= 3
    }


def score_field(
    resume_keywords: set[str],
    field_text: str,
) -> tuple[float, list[str]]:

    field_keywords = extract_keywords(field_text)

    if not field_keywords:
        return 0, []

    matched = resume_keywords.intersection(field_keywords)

    if not matched:
        return 0, []

    coverage = len(matched) / max(len(field_keywords), 1)

    score = min(
        100,
        (coverage * 70) + min(len(matched), 15) * 2
    )

    return score, sorted(list(matched))


def score_job_against_resume(
    resume_text: str,
    job: dict,
) -> dict:

    resume_keywords = extract_keywords(resume_text)

    title_text = normalize_text(job.get("title"))
    requirements_text = normalize_text(job.get("requirements"))
    responsibilities_text = normalize_text(job.get("responsibilities"))
    description_text = normalize_text(job.get("description"))

    title_score, title_matches = score_field(
        resume_keywords,
        title_text,
    )

    requirements_score, requirements_matches = score_field(
        resume_keywords,
        requirements_text,
    )

    responsibilities_score, responsibilities_matches = score_field(
        resume_keywords,
        responsibilities_text,
    )

    description_score, description_matches = score_field(
        resume_keywords,
        description_text,
    )

    all_matches = sorted(
        list(
            set(
                title_matches
                + requirements_matches
                + responsibilities_matches
                + description_matches
            )
        )
    )

    keyword_strength = min(
        100,
        len(all_matches) * 5,
    )

    weighted_score = round(
        (title_score * 0.25)
        + (requirements_score * 0.30)
        + (responsibilities_score * 0.15)
        + (description_score * 0.10)
        + (keyword_strength * 0.20)
    )

    weighted_score = min(
        95,
        max(weighted_score, 0),
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

    missing_keywords = sorted(
        list(
            job_keywords.difference(
                resume_keywords
            )
        )
    )[:15]

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
        "matched_keywords": all_matches[:15],
        "missing_keywords": missing_keywords,
        "summary": build_recommendation_summary(
            weighted_score,
            all_matches,
            missing_keywords,
        ),
    }


def build_recommendation_summary(
    match_score: int,
    matched_keywords: list[str],
    missing_keywords: list[str],
) -> str:

    if match_score >= 80:
        opening = "Excellent fit for this role."
    elif match_score >= 70:
        opening = "Strong fit with high potential."
    elif match_score >= 60:
        opening = "Good fit. Minor improvements recommended."
    elif match_score >= 45:
        opening = "Moderate fit. Some gaps should be addressed."
    else:
        opening = "Limited fit based on current profile."

    matched_text = (
        ", ".join(matched_keywords[:5])
        if matched_keywords
        else "limited overlap"
    )

    missing_text = (
        ", ".join(missing_keywords[:5])
        if missing_keywords
        else "no major gaps detected"
    )

    return (
        f"{opening} "
        f"Matched areas: {matched_text}. "
        f"Gaps: {missing_text}."
    )


def recommend_jobs_for_resume(
    resume_text: str,
    jobs: list[dict],
    limit: int = 20,
) -> list[dict]:

    scored_jobs = []

    for job in jobs:
        score = score_job_against_resume(
            resume_text,
            job,
        )

        if score["match_score"] >= 20:
            scored_jobs.append(score)

    scored_jobs.sort(
        key=lambda item: item["match_score"],
        reverse=True,
    )

    return scored_jobs[:limit]