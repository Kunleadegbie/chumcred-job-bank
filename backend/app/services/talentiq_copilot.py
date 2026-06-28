from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.services.ai_client import generate_json, generate_text, compact_text

from app.services.career_iq import generate_career_coach_response
from app.services.employer_ai import (
    generate_job_intelligence,
    analyze_candidate_for_job,
    generate_interview_pack,
)
from app.services.institution_ai import (
    generate_institution_dashboard,
    analyze_skills_gap,
    generate_curriculum_intelligence,
)
from app.services.admin_ai import (
    generate_admin_dashboard_intelligence,
    analyze_platform_growth,
    analyze_revenue_opportunities,
    analyze_admin_risks,
)


COPILOT_SYSTEM_PROMPT = """
You are TalentIQ Copilot, the unified AI assistant for the TalentIQ AI Employability Platform.

You help:
- students and job seekers with careers, CVs, interviews, jobs, and employability
- employers with job descriptions, hiring intelligence, candidate analysis, and interview packs
- institutions with graduate employability, curriculum alignment, and skills gaps
- admins with platform health, growth, revenue, and risk intelligence
- enterprise users with organization-wide summaries and recommendations

Be practical, clear, structured, and action-oriented.
Do not discriminate or make recommendations based on protected characteristics.
Focus on skills, experience, readiness, evidence, business needs, and measurable actions.
"""


def _json_prompt(task_prompt: str) -> str:
    return f"""
{COPILOT_SYSTEM_PROMPT}

{task_prompt}

Important:
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside the JSON.
"""


def _text_prompt(task_prompt: str) -> str:
    return f"""
{COPILOT_SYSTEM_PROMPT}

{task_prompt}
"""


async def classify_copilot_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Classify the user's request for TalentIQ Copilot.

User Role:
{user_role or "Not provided"}

Question:
{compact_text(question, 4000)}

Context:
{compact_text(json.dumps(context or {}, ensure_ascii=False, indent=2), 5000)}

Valid intents:
- career
- cv
- interview
- job_match
- employer
- institution
- admin
- enterprise
- general

JSON structure:
{{
  "intent": "",
  "confidence": 0,
  "reason": "",
  "suggested_specialist": "",
  "requires_follow_up": false,
  "follow_up_question": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.2,
        max_tokens=800,
        fallback={
          "intent": "general",
          "confidence": 0,
          "reason": "",
          "suggested_specialist": "general",
          "requires_follow_up": False,
          "follow_up_question": "",
        },
    )


async def generate_general_copilot_response(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _text_prompt(
        f"""
Answer this TalentIQ user request.

User Role:
{user_role or "Not provided"}

Question:
{compact_text(question, 5000)}

Context:
{compact_text(json.dumps(context or {}, ensure_ascii=False, indent=2), 6000)}

Return a practical answer with:
- direct answer
- key insights
- recommended next actions
- any relevant TalentIQ tools the user should use
"""
    )

    answer = generate_text(
        prompt,
        temperature=0.4,
        max_tokens=1400,
    )

    return {
        "intent": "general",
        "answer": answer,
        "specialist_used": "TalentIQ Copilot",
        "recommended_next_actions": [],
    }


async def handle_career_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    career_profile = context or {}

    try:
        result = await generate_career_coach_response(
            user_message=question,
            career_profile=career_profile,
        )

        return {
            "intent": "career",
            "answer": result,
            "specialist_used": "CareerIQ",
        }
    except Exception as error:
        return {
            "intent": "career",
            "answer": f"CareerIQ could not complete this request: {str(error)}",
            "specialist_used": "CareerIQ",
            "error": str(error),
        }


async def handle_cv_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Provide CV and ATS improvement guidance.

Question:
{compact_text(question, 5000)}

Context:
{compact_text(json.dumps(context or {}, ensure_ascii=False, indent=2), 8000)}

JSON structure:
{{
  "intent": "cv",
  "summary": "",
  "ats_score_estimate": 0,
  "strengths": [],
  "weaknesses": [],
  "missing_keywords": [],
  "rewrite_recommendations": [],
  "suggested_profile_summary": "",
  "next_actions": []
}}
"""
    )

    result = generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1600,
        fallback={
            "intent": "cv",
            "summary": "",
            "ats_score_estimate": 0,
            "strengths": [],
            "weaknesses": [],
            "missing_keywords": [],
            "rewrite_recommendations": [],
            "suggested_profile_summary": "",
            "next_actions": [],
        },
    )

    return {
        "intent": "cv",
        "answer": result,
        "specialist_used": "CV Intelligence Pro",
    }


async def handle_interview_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    role_title = (
        (context or {}).get("role_title")
        or (context or {}).get("job_title")
        or "Target Role"
    )

    job_description = (
        (context or {}).get("job_description")
        or question
    )

    candidate_cv_text = (context or {}).get("candidate_cv_text") or ""

    try:
        result = await generate_interview_pack(
            job_title=role_title,
            job_description=job_description,
            candidate_cv_text=candidate_cv_text,
        )

        return {
            "intent": "interview",
            "answer": result,
            "specialist_used": "InterviewIQ / EmployerAI Interview Pack",
        }
    except Exception as error:
        return {
            "intent": "interview",
            "answer": f"Interview intelligence could not complete this request: {str(error)}",
            "specialist_used": "InterviewIQ",
            "error": str(error),
        }


async def handle_employer_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    context = context or {}

    job_title = context.get("job_title") or "Role"
    job_description = context.get("job_description") or question
    candidate_cv_text = context.get("candidate_cv_text")
    candidate_name = context.get("candidate_name")

    try:
        if candidate_cv_text:
            result = await analyze_candidate_for_job(
                job_title=job_title,
                job_description=job_description,
                candidate_name=candidate_name,
                candidate_cv_text=candidate_cv_text,
            )

            return {
                "intent": "employer",
                "answer": result,
                "specialist_used": "EmployerAI Candidate Analysis",
            }

        result = await generate_job_intelligence(
            job_title=job_title,
            company_name=context.get("company_name"),
            industry=context.get("industry"),
            location=context.get("location"),
            employment_type=context.get("employment_type"),
            experience_level=context.get("experience_level"),
            job_description=job_description,
        )

        return {
            "intent": "employer",
            "answer": result,
            "specialist_used": "EmployerAI Job Intelligence",
        }
    except Exception as error:
        return {
            "intent": "employer",
            "answer": f"EmployerAI could not complete this request: {str(error)}",
            "specialist_used": "EmployerAI",
            "error": str(error),
        }


async def handle_institution_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    context = context or {}

    institution_name = context.get("institution_name") or "Institution"

    try:
        if "skills" in question.lower() or "gap" in question.lower():
            result = await analyze_skills_gap(
                institution_name=institution_name,
                graduate_skills=context.get("graduate_skills", []),
                employer_required_skills=context.get("employer_required_skills", []),
                programme_data=context.get("programme_data", []),
            )
            specialist = "InstitutionAI Skills Gap"

        elif "curriculum" in question.lower() or "course" in question.lower():
            result = await generate_curriculum_intelligence(
                institution_name=institution_name,
                departments=context.get("departments", []),
                programme_data=context.get("programme_data", []),
                employer_required_skills=context.get("employer_required_skills", []),
                labour_market_notes=context.get("labour_market_notes"),
            )
            specialist = "InstitutionAI Curriculum Intelligence"

        else:
            result = await generate_institution_dashboard(
                institution_name=institution_name,
                institution_type=context.get("institution_type"),
                location=context.get("location"),
                total_students=context.get("total_students"),
                total_graduates=context.get("total_graduates"),
                departments=context.get("departments", []),
                graduate_data=context.get("graduate_data", []),
                employer_data=context.get("employer_data", []),
                programme_data=context.get("programme_data", []),
            )
            specialist = "InstitutionAI Dashboard"

        return {
            "intent": "institution",
            "answer": result,
            "specialist_used": specialist,
        }
    except Exception as error:
        return {
            "intent": "institution",
            "answer": f"InstitutionAI could not complete this request: {str(error)}",
            "specialist_used": "InstitutionAI",
            "error": str(error),
        }


async def handle_admin_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    context = context or {}

    platform_name = context.get("platform_name") or "TalentIQ"
    lower_question = question.lower()

    try:
        if "revenue" in lower_question or "payment" in lower_question:
            result = await analyze_revenue_opportunities(
                platform_name=platform_name,
                subscription_data=context.get("subscription_data", {}),
                payment_data=context.get("payment_data", {}),
                employer_data=context.get("employer_data", {}),
                institution_data=context.get("institution_data", {}),
                pricing_notes=context.get("pricing_notes"),
            )
            specialist = "AdminAI Revenue Intelligence"

        elif "risk" in lower_question or "security" in lower_question:
            result = await analyze_admin_risks(
                platform_name=platform_name,
                technical_metrics=context.get("technical_metrics", {}),
                user_activity_data=context.get("user_activity_data", {}),
                payment_activity_data=context.get("payment_activity_data", {}),
                moderation_notes=context.get("moderation_notes"),
            )
            specialist = "AdminAI Risk Intelligence"

        elif "growth" in lower_question or "traffic" in lower_question:
            result = await analyze_platform_growth(
                platform_name=platform_name,
                user_growth_data=context.get("user_growth_data", {}),
                traffic_data=context.get("traffic_data", {}),
                conversion_data=context.get("conversion_data", {}),
                engagement_data=context.get("engagement_data", {}),
            )
            specialist = "AdminAI Growth Intelligence"

        else:
            result = await generate_admin_dashboard_intelligence(
                platform_name=platform_name,
                student_metrics=context.get("student_metrics", {}),
                employer_metrics=context.get("employer_metrics", {}),
                institution_metrics=context.get("institution_metrics", {}),
                ai_usage_metrics=context.get("ai_usage_metrics", {}),
                revenue_metrics=context.get("revenue_metrics", {}),
                operational_metrics=context.get("operational_metrics", {}),
            )
            specialist = "AdminAI Dashboard Intelligence"

        return {
            "intent": "admin",
            "answer": result,
            "specialist_used": specialist,
        }
    except Exception as error:
        return {
            "intent": "admin",
            "answer": f"AdminAI could not complete this request: {str(error)}",
            "specialist_used": "AdminAI",
            "error": str(error),
        }


async def handle_enterprise_intent(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate enterprise-level TalentIQ guidance.

User Role:
{user_role or "Not provided"}

Question:
{compact_text(question, 5000)}

Enterprise Context:
{compact_text(json.dumps(context or {}, ensure_ascii=False, indent=2), 8000)}

JSON structure:
{{
  "intent": "enterprise",
  "enterprise_summary": "",
  "key_insights": [],
  "workspace_recommendations": [],
  "team_recommendations": [],
  "billing_or_commercial_notes": [],
  "risk_notes": [],
  "next_actions": []
}}
"""
    )

    result = generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1600,
        fallback={
            "intent": "enterprise",
            "enterprise_summary": "",
            "key_insights": [],
            "workspace_recommendations": [],
            "team_recommendations": [],
            "billing_or_commercial_notes": [],
            "risk_notes": [],
            "next_actions": [],
        },
    )

    return {
        "intent": "enterprise",
        "answer": result,
        "specialist_used": "TalentIQ Enterprise Copilot",
    }


async def run_talentiq_copilot(
    question: str,
    user_role: Optional[str] = None,
    context: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    intent_data = await classify_copilot_intent(
        question=question,
        user_role=user_role,
        context=context,
    )

    intent = (intent_data.get("intent") or "general").lower()

    if intent_data.get("requires_follow_up"):
        return {
            "intent": intent,
            "answer": intent_data.get("follow_up_question")
            or "Please provide more details so I can help you properly.",
            "specialist_used": "TalentIQ Copilot Intent Classifier",
            "intent_data": intent_data,
        }

    if intent == "career":
        response = await handle_career_intent(question, user_role, context)
    elif intent == "cv":
        response = await handle_cv_intent(question, user_role, context)
    elif intent == "interview":
        response = await handle_interview_intent(question, user_role, context)
    elif intent == "job_match":
        response = await generate_general_copilot_response(
            question,
            user_role,
            {
                **(context or {}),
                "note": "User is asking for job matching or recommended jobs.",
            },
        )
    elif intent == "employer":
        response = await handle_employer_intent(question, user_role, context)
    elif intent == "institution":
        response = await handle_institution_intent(question, user_role, context)
    elif intent == "admin":
        response = await handle_admin_intent(question, user_role, context)
    elif intent == "enterprise":
        response = await handle_enterprise_intent(question, user_role, context)
    else:
        response = await generate_general_copilot_response(
            question,
            user_role,
            context,
        )

    return {
        "question": question,
        "user_role": user_role,
        "detected_intent": intent,
        "intent_data": intent_data,
        **response,
    }