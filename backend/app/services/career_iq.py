import json
from typing import Any

from app.services.ai_client import generate_json, compact_text


def safe_list(value: Any) -> list:
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def generate_career_iq_report(
    profile: dict | None = None,
    resume_text: str = "",
    career_goal: str = "",
    cv_intelligence: dict | None = None,
    interview_history: list[dict] | None = None,
    recommendations: list[dict] | None = None,
    ai_match_history: list[dict] | None = None,
) -> dict:
    profile = profile or {}
    cv_intelligence = cv_intelligence or {}
    interview_history = interview_history or []
    recommendations = recommendations or []
    ai_match_history = ai_match_history or []

    prompt = f"""
You are CareerIQ, an expert AI career strategist.

Create a practical career intelligence report for the candidate.

Candidate Profile:
{json.dumps(profile, ensure_ascii=False)}

Career Goal:
{career_goal or "Not specified"}

Resume:
{compact_text(resume_text, 5000)}

Latest CV Intelligence:
{json.dumps(cv_intelligence, ensure_ascii=False)}

Interview History:
{json.dumps(interview_history[:5], ensure_ascii=False)}

Job Recommendations:
{json.dumps(recommendations[:10], ensure_ascii=False)}

AI Match History:
{json.dumps(ai_match_history[:10], ensure_ascii=False)}

Return ONLY valid JSON.

Required JSON format:
{{
  "career_health_score": 0,
  "employability_score": 0,
  "career_gap_score": 0,
  "promotion_readiness_score": 0,
  "career_risk": "Low | Medium | High",
  "career_stage": "",
  "best_fit_roles": [""],
  "career_strengths": [""],
  "career_weaknesses": [""],
  "skills_gap": {{
    "technical_skills": [""],
    "soft_skills": [""],
    "tools": [""],
    "certifications": [""]
  }},
  "recommended_certifications": [""],
  "recommended_projects": [""],
  "learning_recommendations": [""],
  "career_roadmap": {{
    "next_30_days": [""],
    "next_90_days": [""],
    "next_6_months": [""],
    "next_12_months": [""]
  }},
  "promotion_advice": "",
  "salary_growth_advice": "",
  "executive_summary": "",
  "next_best_actions": [""]
}}

Scoring guidance:
- career_health_score measures overall career preparedness.
- employability_score measures how attractive the candidate is to employers today.
- career_gap_score measures how much work remains to reach the stated career goal.
- promotion_readiness_score measures readiness for the next career level.
- Use realistic scores between 0 and 100.
- Do not invent qualifications or experience.
- Be practical, direct and helpful.
"""

    fallback = {
        "career_health_score": 0,
        "employability_score": 0,
        "career_gap_score": 0,
        "promotion_readiness_score": 0,
        "career_risk": "Medium",
        "career_stage": "Not enough data",
        "best_fit_roles": [],
        "career_strengths": [],
        "career_weaknesses": [],
        "skills_gap": {
            "technical_skills": [],
            "soft_skills": [],
            "tools": [],
            "certifications": [],
        },
        "recommended_certifications": [],
        "recommended_projects": [],
        "learning_recommendations": [],
        "career_roadmap": {
            "next_30_days": [],
            "next_90_days": [],
            "next_6_months": [],
            "next_12_months": [],
        },
        "promotion_advice": "",
        "salary_growth_advice": "",
        "executive_summary": "",
        "next_best_actions": [],
    }

    result = generate_json(
        prompt=prompt,
        temperature=0.25,
        max_tokens=1800,
        fallback=fallback,
    )

    return normalize_career_iq_result(result)


def normalize_career_iq_result(result: dict) -> dict:
    def score(value: Any) -> int:
        try:
            return max(0, min(100, int(value or 0)))
        except Exception:
            return 0

    skills_gap = result.get("skills_gap") or {}
    roadmap = result.get("career_roadmap") or {}

    return {
        "career_health_score": score(result.get("career_health_score")),
        "employability_score": score(result.get("employability_score")),
        "career_gap_score": score(result.get("career_gap_score")),
        "promotion_readiness_score": score(result.get("promotion_readiness_score")),
        "career_risk": result.get("career_risk") or "Medium",
        "career_stage": result.get("career_stage") or "",
        "best_fit_roles": safe_list(result.get("best_fit_roles")),
        "career_strengths": safe_list(result.get("career_strengths")),
        "career_weaknesses": safe_list(result.get("career_weaknesses")),
        "skills_gap": {
            "technical_skills": safe_list(skills_gap.get("technical_skills")),
            "soft_skills": safe_list(skills_gap.get("soft_skills")),
            "tools": safe_list(skills_gap.get("tools")),
            "certifications": safe_list(skills_gap.get("certifications")),
        },
        "recommended_certifications": safe_list(result.get("recommended_certifications")),
        "recommended_projects": safe_list(result.get("recommended_projects")),
        "learning_recommendations": safe_list(result.get("learning_recommendations")),
        "career_roadmap": {
            "next_30_days": safe_list(roadmap.get("next_30_days")),
            "next_90_days": safe_list(roadmap.get("next_90_days")),
            "next_6_months": safe_list(roadmap.get("next_6_months")),
            "next_12_months": safe_list(roadmap.get("next_12_months")),
        },
        "promotion_advice": result.get("promotion_advice") or "",
        "salary_growth_advice": result.get("salary_growth_advice") or "",
        "executive_summary": result.get("executive_summary") or "",
        "next_best_actions": safe_list(result.get("next_best_actions")),
    }