from __future__ import annotations

import json
import re
from typing import Any, Dict, List, Optional

from app.services import ai_client


EMPLOYER_AI_SYSTEM_PROMPT = """
You are EmployerAI, the employer-side intelligence engine for TalentIQ.

Help employers write better job descriptions, define role requirements,
match candidates to jobs, shortlist applicants fairly, and generate interview packs.

Be practical, structured, fair, and job-relevant.
Do not use protected characteristics such as age, gender, religion, tribe,
disability, marital status, or ethnicity in hiring recommendations.
"""


async def _call_ai(prompt: str, temperature: float = 0.3) -> str:
    if hasattr(ai_client, "ask_ai"):
        return await ai_client.ask_ai(
            system_prompt=EMPLOYER_AI_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=temperature,
        )

    if hasattr(ai_client, "generate_ai_response"):
        return await ai_client.generate_ai_response(
            system_prompt=EMPLOYER_AI_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=temperature,
        )

    if hasattr(ai_client, "generate_response"):
        return await ai_client.generate_response(
            system_prompt=EMPLOYER_AI_SYSTEM_PROMPT,
            user_prompt=prompt,
            temperature=temperature,
        )

    raise RuntimeError("No compatible AI function found in ai_client.py")


def _extract_json(text: str) -> Dict[str, Any]:
    if not text:
        return {"raw_response": ""}

    try:
        return json.loads(text)
    except Exception:
        pass

    match = re.search(r"\{[\s\S]*\}", text)
    if match:
        try:
            return json.loads(match.group(0))
        except Exception:
            pass

    return {"raw_response": text}


async def generate_job_intelligence(
    job_title: str,
    company_name: Optional[str] = None,
    industry: Optional[str] = None,
    location: Optional[str] = None,
    employment_type: Optional[str] = None,
    experience_level: Optional[str] = None,
    job_description: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = f"""
Create employer hiring intelligence for this role.

Job Title: {job_title}
Company: {company_name or "Not provided"}
Industry: {industry or "Not provided"}
Location: {location or "Not provided"}
Employment Type: {employment_type or "Not provided"}
Experience Level: {experience_level or "Not provided"}

Existing Job Description:
{job_description or "Not provided"}

Return ONLY valid JSON:

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
    response = await _call_ai(prompt)
    return _extract_json(response)


async def analyze_candidate_for_job(
    job_title: str,
    job_description: str,
    candidate_name: Optional[str] = None,
    candidate_cv_text: Optional[str] = None,
    candidate_profile: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = f"""
Analyze this candidate against the role.

Job Title:
{job_title}

Job Description:
{job_description}

Candidate Name:
{candidate_name or "Not provided"}

Candidate Profile:
{json.dumps(candidate_profile or {}, ensure_ascii=False, indent=2)}

Candidate CV Text:
{candidate_cv_text or "Not provided"}

Return ONLY valid JSON:

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
    response = await _call_ai(prompt)
    return _extract_json(response)


async def rank_candidates_for_job(
    job_title: str,
    job_description: str,
    candidates: List[Dict[str, Any]],
) -> Dict[str, Any]:
    prompt = f"""
Rank these candidates for the role using only job-relevant evidence.

Job Title:
{job_title}

Job Description:
{job_description}

Candidates:
{json.dumps(candidates, ensure_ascii=False, indent=2)}

Return ONLY valid JSON:

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
    response = await _call_ai(prompt)
    return _extract_json(response)


async def generate_interview_pack(
    job_title: str,
    job_description: str,
    candidate_name: Optional[str] = None,
    candidate_cv_text: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = f"""
Create a practical interview pack.

Job Title:
{job_title}

Job Description:
{job_description}

Candidate Name:
{candidate_name or "Not provided"}

Candidate CV:
{candidate_cv_text or "Not provided"}

Return ONLY valid JSON:

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
    response = await _call_ai(prompt)
    return _extract_json(response)


async def improve_job_description(
    job_title: str,
    draft_description: str,
    industry: Optional[str] = None,
    experience_level: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = f"""
Rewrite and improve this job description.

Job Title: {job_title}
Industry: {industry or "Not provided"}
Experience Level: {experience_level or "Not provided"}

Draft Description:
{draft_description}

Return ONLY valid JSON:

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
    response = await _call_ai(prompt)
    return _extract_json(response)