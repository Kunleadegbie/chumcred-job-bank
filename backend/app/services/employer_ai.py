from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.services.ai_client import generate_json, compact_text


EMPLOYER_AI_SYSTEM_PROMPT = """
You are EmployerAI, the employer-side intelligence engine for TalentIQ.

Help employers write better job descriptions, define role requirements,
match candidates to jobs, shortlist applicants fairly, and generate interview packs.

Be practical, structured, fair, and job-relevant.
Do not use protected characteristics such as age, gender, religion, tribe,
disability, marital status, or ethnicity in hiring recommendations.
"""


def _json_prompt(task_prompt: str) -> str:
    return f"""
{EMPLOYER_AI_SYSTEM_PROMPT}

{task_prompt}

Important:
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside the JSON.
"""


async def generate_job_intelligence(
    job_title: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Create employer hiring intelligence for this role.

Job Title: {job_title}
Company: {company_name or "Not provided"}
Industry: {industry or "Not provided"}
Location: {location or "Not provided"}
Employment Type: {employment_type or "Not provided"}
Experience Level: {experience_level or "Not provided"}

Existing Job Description:
{compact_text(job_description, 5000)}

JSON structure:
{{
  "optimized_job_title": "",
  "job_summary": "",
  "key_responsibilities": [],
  "required_skills": [],
  "preferred_skills": [],
  "required_experience": "",
  "education_or_certification": "",
  "screening_questions": [],
  "interview_questions": {{
    "technical": [],
    "behavioral": [],
    "role_fit": []
  }},
  "candidate_evaluation_criteria": [],
  "red_flags": [],
  "employer_recommendation": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1600,
        fallback={
            "optimized_job_title": job_title,
            "job_summary": "",
            "key_responsibilities": [],
            "required_skills": [],
            "preferred_skills": [],
            "required_experience": "",
            "education_or_certification": "",
            "screening_questions": [],
            "interview_questions": {
                "technical": [],
                "behavioral": [],
                "role_fit": [],
            },
            "candidate_evaluation_criteria": [],
            "red_flags": [],
            "employer_recommendation": "",
        },
    )


async def analyze_candidate_for_job(
    job_title: str,
    job_description: str,
    candidate_name: Optional[str] = None,
    candidate_cv_text: Optional[str] = None,
    candidate_profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Analyze this candidate against the role.

Job Title:
{job_title}

Job Description:
{compact_text(job_description, 5000)}

Candidate Name:
{candidate_name or "Not provided"}

Candidate Profile:
{json.dumps(candidate_profile or {}, ensure_ascii=False, indent=2)}

Candidate CV Text:
{compact_text(candidate_cv_text, 6000)}

JSON structure:
{{
  "candidate_name": "",
  "fit_score": 0,
  "fit_level": "Low | Moderate | Strong | Excellent",
  "summary": "",
  "matching_skills": [],
  "missing_skills": [],
  "relevant_experience": [],
  "concerns": [],
  "recommended_interview_questions": [],
  "hiring_recommendation": "Reject | Hold | Interview | Strong Interview",
  "reasoning": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1600,
        fallback={
            "candidate_name": candidate_name or "",
            "fit_score": 0,
            "fit_level": "Low",
            "summary": "",
            "matching_skills": [],
            "missing_skills": [],
            "relevant_experience": [],
            "concerns": [],
            "recommended_interview_questions": [],
            "hiring_recommendation": "Hold",
            "reasoning": "",
        },
    )


async def rank_candidates_for_job(
    job_title: str,
    job_description: str,
    candidates: List[Dict[str, Any]],
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Rank these candidates for the role using only job-relevant evidence.

Job Title:
{job_title}

Job Description:
{compact_text(job_description, 5000)}

Candidates:
{compact_text(json.dumps(candidates, ensure_ascii=False, indent=2), 10000)}

JSON structure:
{{
  "role": "",
  "total_candidates_reviewed": 0,
  "top_candidates": [
    {{
      "candidate_name": "",
      "rank": 1,
      "fit_score": 0,
      "fit_level": "",
      "key_strengths": [],
      "gaps": [],
      "recommendation": ""
    }}
  ],
  "shortlist_recommendation": [],
  "overall_employer_note": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1800,
        fallback={
            "role": job_title,
            "total_candidates_reviewed": len(candidates or []),
            "top_candidates": [],
            "shortlist_recommendation": [],
            "overall_employer_note": "",
        },
    )


async def generate_interview_pack(
    job_title: str,
    job_description: str,
    candidate_name: Optional[str] = None,
    candidate_cv_text: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Create a practical interview pack.

Job Title:
{job_title}

Job Description:
{compact_text(job_description, 5000)}

Candidate Name:
{candidate_name or "Not provided"}

Candidate CV:
{compact_text(candidate_cv_text, 6000)}

JSON structure:
{{
  "interview_objective": "",
  "opening_questions": [],
  "technical_questions": [],
  "behavioral_questions": [],
  "experience_validation_questions": [],
  "culture_and_role_fit_questions": [],
  "scorecard": [
    {{
      "criterion": "",
      "weight": "",
      "what_to_look_for": ""
    }}
  ],
  "post_interview_decision_guide": []
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1600,
        fallback={
            "interview_objective": "",
            "opening_questions": [],
            "technical_questions": [],
            "behavioral_questions": [],
            "experience_validation_questions": [],
            "culture_and_role_fit_questions": [],
            "scorecard": [],
            "post_interview_decision_guide": [],
        },
    )


async def improve_job_description(
    job_title: str,
    draft_description: str,
    industry: Optional[str] = None,
    experience_level: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Rewrite and improve this job description.

Job Title: {job_title}
Industry: {industry or "Not provided"}
Experience Level: {experience_level or "Not provided"}

Draft Description:
{compact_text(draft_description, 6000)}

JSON structure:
{{
  "improved_job_description": "",
  "job_summary": "",
  "responsibilities": [],
  "requirements": [],
  "skills": [],
  "benefits_or_value_proposition": [],
  "seo_keywords": [],
  "quality_score": 0,
  "improvement_notes": []
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1600,
        fallback={
            "improved_job_description": "",
            "job_summary": "",
            "responsibilities": [],
            "requirements": [],
            "skills": [],
            "benefits_or_value_proposition": [],
            "seo_keywords": [],
            "quality_score": 0,
            "improvement_notes": [],
        },
    )