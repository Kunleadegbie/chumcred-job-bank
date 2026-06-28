from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.services.ai_client import generate_json, compact_text


INSTITUTION_AI_SYSTEM_PROMPT = """
You are InstitutionAI, the institutional employability intelligence engine for TalentIQ.

Your job is to help universities, polytechnics, colleges, bootcamps, government skills centres,
and training institutions understand graduate employability performance.

Focus on:
- employability score
- graduate readiness
- department performance
- skills gap analysis
- employer demand
- curriculum improvement
- internship and placement readiness
- graduate outcome prediction
- executive-level institutional recommendations

Be practical, strategic, fair, data-driven, and implementation-focused.
Do not use protected characteristics such as age, gender, religion, tribe, ethnicity,
disability, marital status, or political affiliation in recommendations.
"""


def _json_prompt(task_prompt: str) -> str:
    return f"""
{INSTITUTION_AI_SYSTEM_PROMPT}

{task_prompt}

Important:
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside the JSON.
"""


async def generate_institution_dashboard(
    institution_name: str,
    institution_type: Optional[str] = None,
    location: Optional[str] = None,
    total_students: Optional[int] = None,
    total_graduates: Optional[int] = None,
    departments: Optional[List[Dict[str, Any]]] = None,
    graduate_data: Optional[List[Dict[str, Any]]] = None,
    employer_data: Optional[List[Dict[str, Any]]] = None,
    programme_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate an executive Institution Intelligence dashboard.

Institution Name: {institution_name}
Institution Type: {institution_type or "Not provided"}
Location: {location or "Not provided"}
Total Students: {total_students or "Not provided"}
Total Graduates: {total_graduates or "Not provided"}

Departments:
{compact_text(json.dumps(departments or [], ensure_ascii=False, indent=2), 7000)}

Graduate Data:
{compact_text(json.dumps(graduate_data or [], ensure_ascii=False, indent=2), 10000)}

Employer Data:
{compact_text(json.dumps(employer_data or [], ensure_ascii=False, indent=2), 7000)}

Programme Data:
{compact_text(json.dumps(programme_data or [], ensure_ascii=False, indent=2), 7000)}

JSON structure:
{{
  "institution_name": "",
  "executive_summary": "",
  "overall_employability_score": 0,
  "employability_level": "Low | Moderate | Strong | Excellent",
  "graduate_readiness_score": 0,
  "placement_readiness_score": 0,
  "department_performance": [
    {{
      "department": "",
      "employability_score": 0,
      "readiness_level": "",
      "strengths": [],
      "gaps": [],
      "recommended_actions": []
    }}
  ],
  "top_employability_strengths": [],
  "major_skills_gaps": [],
  "employer_demand_insights": {{
    "top_industries": [],
    "top_roles": [],
    "top_employers": [],
    "high_demand_skills": []
  }},
  "curriculum_insights": [],
  "graduate_outcome_prediction": {{
    "expected_employment_rate": "",
    "expected_time_to_first_job": "",
    "expected_salary_band": "",
    "risk_note": ""
  }},
  "institution_benchmark": {{
    "national_position": "",
    "regional_position": "",
    "peer_comparison": "",
    "benchmark_note": ""
  }},
  "ai_action_plan": {{
    "immediate_actions": [],
    "ninety_day_actions": [],
    "one_year_actions": [],
    "three_year_actions": []
  }},
  "executive_recommendation": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=2200,
        fallback={
            "institution_name": institution_name,
            "executive_summary": "",
            "overall_employability_score": 0,
            "employability_level": "Moderate",
            "graduate_readiness_score": 0,
            "placement_readiness_score": 0,
            "department_performance": [],
            "top_employability_strengths": [],
            "major_skills_gaps": [],
            "employer_demand_insights": {
                "top_industries": [],
                "top_roles": [],
                "top_employers": [],
                "high_demand_skills": [],
            },
            "curriculum_insights": [],
            "graduate_outcome_prediction": {
                "expected_employment_rate": "",
                "expected_time_to_first_job": "",
                "expected_salary_band": "",
                "risk_note": "",
            },
            "institution_benchmark": {
                "national_position": "",
                "regional_position": "",
                "peer_comparison": "",
                "benchmark_note": "",
            },
            "ai_action_plan": {
                "immediate_actions": [],
                "ninety_day_actions": [],
                "one_year_actions": [],
                "three_year_actions": [],
            },
            "executive_recommendation": "",
        },
    )


async def analyze_employability(
    institution_name: str,
    graduate_data: Optional[List[Dict[str, Any]]] = None,
    departments: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Analyze graduate employability for this institution.

Institution Name: {institution_name}

Graduate Data:
{compact_text(json.dumps(graduate_data or [], ensure_ascii=False, indent=2), 10000)}

Departments:
{compact_text(json.dumps(departments or [], ensure_ascii=False, indent=2), 7000)}

JSON structure:
{{
  "institution_name": "",
  "overall_employability_score": 0,
  "employability_level": "Low | Moderate | Strong | Excellent",
  "job_ready_percentage": "",
  "internship_ready_percentage": "",
  "at_risk_percentage": "",
  "department_scores": [
    {{
      "department": "",
      "score": 0,
      "level": "",
      "reason": ""
    }}
  ],
  "high_potential_graduate_segments": [],
  "graduates_at_risk": [],
  "key_employability_drivers": [],
  "main_employability_barriers": [],
  "recommendations": []
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1800,
        fallback={
            "institution_name": institution_name,
            "overall_employability_score": 0,
            "employability_level": "Moderate",
            "job_ready_percentage": "",
            "internship_ready_percentage": "",
            "at_risk_percentage": "",
            "department_scores": [],
            "high_potential_graduate_segments": [],
            "graduates_at_risk": [],
            "key_employability_drivers": [],
            "main_employability_barriers": [],
            "recommendations": [],
        },
    )


async def analyze_skills_gap(
    institution_name: str,
    graduate_skills: Optional[List[str]] = None,
    employer_required_skills: Optional[List[str]] = None,
    programme_data: Optional[List[Dict[str, Any]]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Analyze the skills gap between institution graduates and employer demand.

Institution Name: {institution_name}

Graduate Skills:
{compact_text(json.dumps(graduate_skills or [], ensure_ascii=False, indent=2), 7000)}

Employer Required Skills:
{compact_text(json.dumps(employer_required_skills or [], ensure_ascii=False, indent=2), 7000)}

Programme Data:
{compact_text(json.dumps(programme_data or [], ensure_ascii=False, indent=2), 7000)}

JSON structure:
{{
  "institution_name": "",
  "skills_gap_summary": "",
  "critical_missing_skills": [],
  "moderate_missing_skills": [],
  "strong_existing_skills": [],
  "skills_gap_by_department": [
    {{
      "department": "",
      "missing_skills": [],
      "existing_strengths": [],
      "priority_level": "Low | Medium | High"
    }}
  ],
  "employer_demand_alignment_score": 0,
  "training_priorities": [],
  "recommended_short_courses": [],
  "recommended_certifications": [],
  "recommended_lab_or_practical_projects": [],
  "executive_recommendation": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1800,
        fallback={
            "institution_name": institution_name,
            "skills_gap_summary": "",
            "critical_missing_skills": [],
            "moderate_missing_skills": [],
            "strong_existing_skills": [],
            "skills_gap_by_department": [],
            "employer_demand_alignment_score": 0,
            "training_priorities": [],
            "recommended_short_courses": [],
            "recommended_certifications": [],
            "recommended_lab_or_practical_projects": [],
            "executive_recommendation": "",
        },
    )


async def generate_curriculum_intelligence(
    institution_name: str,
    departments: Optional[List[Dict[str, Any]]] = None,
    programme_data: Optional[List[Dict[str, Any]]] = None,
    employer_required_skills: Optional[List[str]] = None,
    labour_market_notes: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate curriculum intelligence for employability improvement.

Institution Name: {institution_name}

Departments:
{compact_text(json.dumps(departments or [], ensure_ascii=False, indent=2), 7000)}

Programme Data:
{compact_text(json.dumps(programme_data or [], ensure_ascii=False, indent=2), 9000)}

Employer Required Skills:
{compact_text(json.dumps(employer_required_skills or [], ensure_ascii=False, indent=2), 7000)}

Labour Market Notes:
{compact_text(labour_market_notes, 5000)}

JSON structure:
{{
  "institution_name": "",
  "curriculum_summary": "",
  "curriculum_alignment_score": 0,
  "programmes_needing_update": [],
  "recommended_new_modules": [],
  "recommended_practical_components": [],
  "industry_partnership_recommendations": [],
  "internship_and_siwes_recommendations": [],
  "soft_skills_recommendations": [],
  "digital_skills_recommendations": [],
  "entrepreneurship_recommendations": [],
  "implementation_roadmap": {{
    "first_30_days": [],
    "first_90_days": [],
    "six_months": [],
    "one_year": []
  }},
  "executive_recommendation": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1900,
        fallback={
            "institution_name": institution_name,
            "curriculum_summary": "",
            "curriculum_alignment_score": 0,
            "programmes_needing_update": [],
            "recommended_new_modules": [],
            "recommended_practical_components": [],
            "industry_partnership_recommendations": [],
            "internship_and_siwes_recommendations": [],
            "soft_skills_recommendations": [],
            "digital_skills_recommendations": [],
            "entrepreneurship_recommendations": [],
            "implementation_roadmap": {
                "first_30_days": [],
                "first_90_days": [],
                "six_months": [],
                "one_year": [],
            },
            "executive_recommendation": "",
        },
    )


async def generate_institution_recommendations(
    institution_name: str,
    dashboard_data: Optional[Dict[str, Any]] = None,
    employability_data: Optional[Dict[str, Any]] = None,
    skills_gap_data: Optional[Dict[str, Any]] = None,
    curriculum_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate executive institutional recommendations based on available intelligence.

Institution Name: {institution_name}

Dashboard Data:
{compact_text(json.dumps(dashboard_data or {}, ensure_ascii=False, indent=2), 8000)}

Employability Data:
{compact_text(json.dumps(employability_data or {}, ensure_ascii=False, indent=2), 8000)}

Skills Gap Data:
{compact_text(json.dumps(skills_gap_data or {}, ensure_ascii=False, indent=2), 8000)}

Curriculum Data:
{compact_text(json.dumps(curriculum_data or {}, ensure_ascii=False, indent=2), 8000)}

JSON structure:
{{
  "institution_name": "",
  "strategic_summary": "",
  "top_10_recommendations": [],
  "quick_wins": [],
  "policy_recommendations": [],
  "department_level_actions": [],
  "employer_partnership_actions": [],
  "student_support_actions": [],
  "data_tracking_actions": [],
  "priority_matrix": [
    {{
      "priority": "",
      "impact": "Low | Medium | High",
      "urgency": "Low | Medium | High",
      "owner": "",
      "timeline": ""
    }}
  ],
  "board_level_note": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=2000,
        fallback={
            "institution_name": institution_name,
            "strategic_summary": "",
            "top_10_recommendations": [],
            "quick_wins": [],
            "policy_recommendations": [],
            "department_level_actions": [],
            "employer_partnership_actions": [],
            "student_support_actions": [],
            "data_tracking_actions": [],
            "priority_matrix": [],
            "board_level_note": "",
        },
    )