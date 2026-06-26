import re
from typing import Any


STOPWORDS = {
    "the", "and", "for", "with", "that", "this", "from", "into", "your",
    "you", "are", "will", "our", "their", "have", "has", "was", "were",
    "been", "being", "job", "role", "work", "team", "company", "candidate",
    "experience", "skills", "responsibilities", "requirements", "about",
    "available", "applicant", "applicants", "contract", "must", "should",
    "able", "using", "based", "support", "provide", "including", "within",
}


def normalize_text(value: Any) -> str:
    return str(value or "").lower()


def extract_keywords(text: str) -> set[str]:
    words = re.findall(r"[a-zA-Z][a-zA-Z0-9+#.-]{2,}", normalize_text(text))

    return {
        word.strip(".,;:()[]{}")
        for word in words
        if word not in STOPWORDS and len(word) >= 3
    }


def calculate_cv_intelligence(
    resume_text: str,
    job_context: dict | None = None,
) -> dict:
    job_context = job_context or {}

    resume_keywords = extract_keywords(resume_text)

    job_text = " ".join(
        [
            normalize_text(job_context.get("title")),
            normalize_text(job_context.get("company_name")),
            normalize_text(job_context.get("description")),
            normalize_text(job_context.get("requirements")),
            normalize_text(job_context.get("responsibilities")),
        ]
    )

    job_keywords = extract_keywords(job_text)

    matched_keywords = sorted(list(resume_keywords.intersection(job_keywords)))
    missing_keywords = sorted(list(job_keywords.difference(resume_keywords)))[:25]

    ats_score = round((len(matched_keywords) / max(len(job_keywords), 1)) * 100)
    ats_score = min(95, max(0, ats_score))

    return {
        "ats_score": ats_score,
        "matched_keywords": matched_keywords[:20],
        "missing_keywords": missing_keywords[:20],
        "rewrite_suggestions": build_rewrite_suggestions(missing_keywords, job_context),
        "cv_gaps": build_cv_gaps(ats_score, missing_keywords),
        "tailoring_summary": build_tailoring_summary(ats_score),
        "recommended_cv_actions": build_cv_actions(missing_keywords),
    }


def build_rewrite_suggestions(
    missing_keywords: list[str],
    job_context: dict,
) -> list[str]:
    suggestions = []

    title = job_context.get("title") or "the target role"

    suggestions.append(
        f"Rewrite your professional summary to clearly position you for {title}."
    )

    for keyword in missing_keywords[:6]:
        suggestions.append(
            f"Add a bullet point showing practical experience with {keyword}."
        )

    suggestions.append(
        "Use measurable achievements such as percentages, revenue impact, cost savings, turnaround time or team size."
    )

    suggestions.append(
        "Move the strongest role-relevant achievements to the top third of the CV."
    )

    return suggestions[:10]


def build_cv_gaps(ats_score: int, missing_keywords: list[str]) -> list[dict]:
    gaps = []

    if ats_score < 50:
        gaps.append({
            "area": "ATS Alignment",
            "risk": "High",
            "note": "CV does not strongly match the selected job description.",
        })
    elif ats_score < 70:
        gaps.append({
            "area": "ATS Alignment",
            "risk": "Medium",
            "note": "CV has partial alignment but needs stronger job-specific keywords.",
        })
    else:
        gaps.append({
            "area": "ATS Alignment",
            "risk": "Low",
            "note": "CV has good keyword alignment with the selected job.",
        })

    if missing_keywords:
        gaps.append({
            "area": "Missing Keywords",
            "risk": "Medium" if len(missing_keywords) <= 8 else "High",
            "note": ", ".join(missing_keywords[:10]),
        })

    return gaps


def build_cv_actions(missing_keywords: list[str]) -> list[str]:
    actions = []

    for keyword in missing_keywords[:5]:
        actions.append(
            f"Add one achievement or responsibility that demonstrates {keyword}."
        )

    actions.append(
        "Rewrite your profile summary to mention the target role and strongest relevant experience."
    )

    actions.append(
        "Quantify achievements using numbers, percentages, revenue, cost savings or scale."
    )

    actions.append(
        "Remove generic duties and replace them with outcome-based achievements."
    )

    return actions[:8]


def build_tailoring_summary(ats_score: int) -> str:
    if ats_score >= 80:
        return "Your CV is strongly aligned with this job. Minor keyword and achievement improvements may improve visibility."
    if ats_score >= 60:
        return "Your CV has moderate alignment. Add missing keywords and role-specific achievements before applying."
    return "Your CV needs stronger tailoring for this job. Focus on missing keywords, measurable achievements and a sharper professional summary."