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


def calculate_interview_readiness(
    resume_text: str,
    job_context: dict | None = None,
    ai_match_result: dict | None = None,
) -> dict:
    job_context = job_context or {}
    ai_match_result = ai_match_result or {}

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
    missing_keywords = sorted(list(job_keywords.difference(resume_keywords)))[:20]

    keyword_coverage = (
        len(matched_keywords) / max(len(job_keywords), 1)
    )

    ai_match_score = int(ai_match_result.get("match_score") or 0)

    if ai_match_score > 0:
        readiness_score = round((ai_match_score * 0.55) + (keyword_coverage * 100 * 0.45))
    else:
        readiness_score = round(keyword_coverage * 100)

    readiness_score = min(95, max(0, readiness_score))

    weakness_heatmap = build_weakness_heatmap(
        readiness_score=readiness_score,
        missing_keywords=missing_keywords,
        ai_match_result=ai_match_result,
    )

    learning_actions = build_learning_actions(
        missing_keywords=missing_keywords,
        weakness_heatmap=weakness_heatmap,
    )

    success_probability = build_success_probability(readiness_score)

    return {
        "readiness_score": readiness_score,
        "success_probability": success_probability,
        "matched_keywords": matched_keywords[:15],
        "missing_keywords": missing_keywords[:15],
        "weakness_heatmap": weakness_heatmap,
        "recommended_learning_actions": learning_actions,
        "summary": build_summary(readiness_score, success_probability),
    }


def build_weakness_heatmap(
    readiness_score: int,
    missing_keywords: list[str],
    ai_match_result: dict,
) -> list[dict]:
    gaps = ai_match_result.get("gaps") or []

    heatmap = []

    if readiness_score < 60:
        heatmap.append({
            "area": "Overall Role Fit",
            "risk": "High",
            "note": "The candidate may need more targeted preparation before interview.",
        })
    elif readiness_score < 75:
        heatmap.append({
            "area": "Overall Role Fit",
            "risk": "Medium",
            "note": "The candidate has partial alignment but should prepare around gaps.",
        })
    else:
        heatmap.append({
            "area": "Overall Role Fit",
            "risk": "Low",
            "note": "The candidate appears reasonably prepared for the role.",
        })

    if missing_keywords:
        heatmap.append({
            "area": "Missing Keywords",
            "risk": "Medium" if len(missing_keywords) <= 8 else "High",
            "note": ", ".join(missing_keywords[:8]),
        })

    if gaps:
        heatmap.append({
            "area": "AI Match Gaps",
            "risk": "Medium",
            "note": "; ".join(gaps[:3]) if isinstance(gaps, list) else str(gaps),
        })

    return heatmap


def build_learning_actions(
    missing_keywords: list[str],
    weakness_heatmap: list[dict],
) -> list[str]:
    actions = []

    for keyword in missing_keywords[:5]:
        actions.append(
            f"Prepare one practical example showing your experience with {keyword}."
        )

    if any(item.get("risk") == "High" for item in weakness_heatmap):
        actions.append(
            "Review the job description carefully and prepare STAR examples for the most important requirements."
        )

    actions.append(
        "Prepare a concise 60-second opening pitch connecting your experience to this role."
    )

    actions.append(
        "Prepare questions to ask the interviewer about expectations, success metrics and team priorities."
    )

    return actions[:8]


def build_success_probability(readiness_score: int) -> int:
    if readiness_score >= 85:
        return 82
    if readiness_score >= 75:
        return 70
    if readiness_score >= 60:
        return 55
    if readiness_score >= 45:
        return 40
    return 25


def build_summary(readiness_score: int, success_probability: int) -> str:
    if readiness_score >= 80:
        return (
            f"Strong interview readiness. Estimated interview success probability is "
            f"{success_probability}% if the candidate communicates examples clearly."
        )

    if readiness_score >= 60:
        return (
            f"Moderate interview readiness. Estimated interview success probability is "
            f"{success_probability}%. Candidate should prepare around the identified gaps."
        )

    return (
        f"Low-to-moderate readiness. Estimated interview success probability is "
        f"{success_probability}%. Candidate should strengthen role-specific examples before interview."
    )