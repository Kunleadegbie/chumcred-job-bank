from __future__ import annotations

import json
from typing import Any, Dict, List, Optional

from app.services.ai_client import generate_json, compact_text


ADMIN_AI_SYSTEM_PROMPT = """
You are AdminAI, the executive intelligence engine for the TalentIQ AI Employability Platform.

Your job is to help platform administrators understand:
- platform performance
- student and candidate activity
- employer activity
- institution activity
- AI tool usage
- revenue opportunities
- operational risks
- product growth opportunities
- fraud, abuse, or unusual behaviour signals
- launch readiness and production issues

Be strategic, practical, concise, and executive-level.
Focus on actions the admin can take.
Do not expose private user data unnecessarily.
Do not make recommendations based on protected characteristics such as age, gender,
religion, tribe, ethnicity, disability, marital status, or political affiliation.
"""


def _json_prompt(task_prompt: str) -> str:
    return f"""
{ADMIN_AI_SYSTEM_PROMPT}

{task_prompt}

Important:
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside the JSON.
"""


async def generate_admin_dashboard_intelligence(
    platform_name: str = "TalentIQ",
    student_metrics: Optional[Dict[str, Any]] = None,
    employer_metrics: Optional[Dict[str, Any]] = None,
    institution_metrics: Optional[Dict[str, Any]] = None,
    ai_usage_metrics: Optional[Dict[str, Any]] = None,
    revenue_metrics: Optional[Dict[str, Any]] = None,
    operational_metrics: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate executive admin dashboard intelligence for the platform.

Platform Name: {platform_name}

Student Metrics:
{compact_text(json.dumps(student_metrics or {}, ensure_ascii=False, indent=2), 7000)}

Employer Metrics:
{compact_text(json.dumps(employer_metrics or {}, ensure_ascii=False, indent=2), 7000)}

Institution Metrics:
{compact_text(json.dumps(institution_metrics or {}, ensure_ascii=False, indent=2), 7000)}

AI Usage Metrics:
{compact_text(json.dumps(ai_usage_metrics or {}, ensure_ascii=False, indent=2), 7000)}

Revenue Metrics:
{compact_text(json.dumps(revenue_metrics or {}, ensure_ascii=False, indent=2), 7000)}

Operational Metrics:
{compact_text(json.dumps(operational_metrics or {}, ensure_ascii=False, indent=2), 7000)}

JSON structure:
{{
  "platform_name": "",
  "executive_summary": "",
  "platform_health_score": 0,
  "health_level": "Critical | Weak | Stable | Strong | Excellent",
  "key_platform_strengths": [],
  "key_platform_risks": [],
  "student_activity_insights": {{
    "summary": "",
    "positive_signals": [],
    "concerns": [],
    "recommended_actions": []
  }},
  "employer_activity_insights": {{
    "summary": "",
    "positive_signals": [],
    "concerns": [],
    "recommended_actions": []
  }},
  "institution_activity_insights": {{
    "summary": "",
    "positive_signals": [],
    "concerns": [],
    "recommended_actions": []
  }},
  "ai_usage_insights": {{
    "summary": "",
    "most_valuable_tools": [],
    "underused_tools": [],
    "recommended_actions": []
  }},
  "revenue_opportunity_insights": {{
    "summary": "",
    "quick_revenue_opportunities": [],
    "enterprise_opportunities": [],
    "pricing_recommendations": []
  }},
  "operational_risk_alerts": [],
  "admin_action_plan": {{
    "immediate_actions": [],
    "seven_day_actions": [],
    "thirty_day_actions": [],
    "ninety_day_actions": []
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
            "platform_name": platform_name,
            "executive_summary": "",
            "platform_health_score": 0,
            "health_level": "Stable",
            "key_platform_strengths": [],
            "key_platform_risks": [],
            "student_activity_insights": {
                "summary": "",
                "positive_signals": [],
                "concerns": [],
                "recommended_actions": [],
            },
            "employer_activity_insights": {
                "summary": "",
                "positive_signals": [],
                "concerns": [],
                "recommended_actions": [],
            },
            "institution_activity_insights": {
                "summary": "",
                "positive_signals": [],
                "concerns": [],
                "recommended_actions": [],
            },
            "ai_usage_insights": {
                "summary": "",
                "most_valuable_tools": [],
                "underused_tools": [],
                "recommended_actions": [],
            },
            "revenue_opportunity_insights": {
                "summary": "",
                "quick_revenue_opportunities": [],
                "enterprise_opportunities": [],
                "pricing_recommendations": [],
            },
            "operational_risk_alerts": [],
            "admin_action_plan": {
                "immediate_actions": [],
                "seven_day_actions": [],
                "thirty_day_actions": [],
                "ninety_day_actions": [],
            },
            "executive_recommendation": "",
        },
    )


async def analyze_platform_growth(
    platform_name: str = "TalentIQ",
    user_growth_data: Optional[Dict[str, Any]] = None,
    traffic_data: Optional[Dict[str, Any]] = None,
    conversion_data: Optional[Dict[str, Any]] = None,
    engagement_data: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Analyze platform growth and adoption.

Platform Name: {platform_name}

User Growth Data:
{compact_text(json.dumps(user_growth_data or {}, ensure_ascii=False, indent=2), 7000)}

Traffic Data:
{compact_text(json.dumps(traffic_data or {}, ensure_ascii=False, indent=2), 7000)}

Conversion Data:
{compact_text(json.dumps(conversion_data or {}, ensure_ascii=False, indent=2), 7000)}

Engagement Data:
{compact_text(json.dumps(engagement_data or {}, ensure_ascii=False, indent=2), 7000)}

JSON structure:
{{
  "platform_name": "",
  "growth_summary": "",
  "growth_score": 0,
  "growth_level": "Low | Moderate | Strong | Excellent",
  "best_growth_channels": [],
  "weak_growth_channels": [],
  "conversion_bottlenecks": [],
  "retention_insights": [],
  "engagement_insights": [],
  "recommended_growth_experiments": [],
  "partnership_opportunities": [],
  "admin_recommendation": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1800,
        fallback={
            "platform_name": platform_name,
            "growth_summary": "",
            "growth_score": 0,
            "growth_level": "Moderate",
            "best_growth_channels": [],
            "weak_growth_channels": [],
            "conversion_bottlenecks": [],
            "retention_insights": [],
            "engagement_insights": [],
            "recommended_growth_experiments": [],
            "partnership_opportunities": [],
            "admin_recommendation": "",
        },
    )


async def analyze_revenue_opportunities(
    platform_name: str = "TalentIQ",
    subscription_data: Optional[Dict[str, Any]] = None,
    payment_data: Optional[Dict[str, Any]] = None,
    employer_data: Optional[Dict[str, Any]] = None,
    institution_data: Optional[Dict[str, Any]] = None,
    pricing_notes: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Analyze platform revenue opportunities.

Platform Name: {platform_name}

Subscription Data:
{compact_text(json.dumps(subscription_data or {}, ensure_ascii=False, indent=2), 7000)}

Payment Data:
{compact_text(json.dumps(payment_data or {}, ensure_ascii=False, indent=2), 7000)}

Employer Data:
{compact_text(json.dumps(employer_data or {}, ensure_ascii=False, indent=2), 7000)}

Institution Data:
{compact_text(json.dumps(institution_data or {}, ensure_ascii=False, indent=2), 7000)}

Pricing Notes:
{compact_text(pricing_notes, 5000)}

JSON structure:
{{
  "platform_name": "",
  "revenue_summary": "",
  "revenue_readiness_score": 0,
  "quick_revenue_opportunities": [],
  "student_subscription_opportunities": [],
  "employer_subscription_opportunities": [],
  "institution_license_opportunities": [],
  "enterprise_sales_opportunities": [],
  "pricing_optimization_recommendations": [],
  "upsell_and_cross_sell_opportunities": [],
  "payment_risk_or_leakage_alerts": [],
  "recommended_revenue_action_plan": {{
    "immediate": [],
    "thirty_days": [],
    "ninety_days": [],
    "six_months": []
  }}
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1900,
        fallback={
            "platform_name": platform_name,
            "revenue_summary": "",
            "revenue_readiness_score": 0,
            "quick_revenue_opportunities": [],
            "student_subscription_opportunities": [],
            "employer_subscription_opportunities": [],
            "institution_license_opportunities": [],
            "enterprise_sales_opportunities": [],
            "pricing_optimization_recommendations": [],
            "upsell_and_cross_sell_opportunities": [],
            "payment_risk_or_leakage_alerts": [],
            "recommended_revenue_action_plan": {
                "immediate": [],
                "thirty_days": [],
                "ninety_days": [],
                "six_months": [],
            },
        },
    )


async def analyze_admin_risks(
    platform_name: str = "TalentIQ",
    technical_metrics: Optional[Dict[str, Any]] = None,
    user_activity_data: Optional[Dict[str, Any]] = None,
    payment_activity_data: Optional[Dict[str, Any]] = None,
    moderation_notes: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Analyze admin, operational, technical, and abuse risks for the platform.

Platform Name: {platform_name}

Technical Metrics:
{compact_text(json.dumps(technical_metrics or {}, ensure_ascii=False, indent=2), 7000)}

User Activity Data:
{compact_text(json.dumps(user_activity_data or {}, ensure_ascii=False, indent=2), 7000)}

Payment Activity Data:
{compact_text(json.dumps(payment_activity_data or {}, ensure_ascii=False, indent=2), 7000)}

Moderation Notes:
{compact_text(moderation_notes, 5000)}

JSON structure:
{{
  "platform_name": "",
  "risk_summary": "",
  "overall_risk_score": 0,
  "risk_level": "Low | Moderate | High | Critical",
  "technical_risks": [],
  "security_or_abuse_risks": [],
  "payment_or_revenue_risks": [],
  "data_quality_risks": [],
  "user_experience_risks": [],
  "priority_alerts": [],
  "recommended_controls": [],
  "admin_action_plan": {{
    "urgent": [],
    "this_week": [],
    "this_month": [],
    "ongoing": []
  }}
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=1800,
        fallback={
            "platform_name": platform_name,
            "risk_summary": "",
            "overall_risk_score": 0,
            "risk_level": "Moderate",
            "technical_risks": [],
            "security_or_abuse_risks": [],
            "payment_or_revenue_risks": [],
            "data_quality_risks": [],
            "user_experience_risks": [],
            "priority_alerts": [],
            "recommended_controls": [],
            "admin_action_plan": {
                "urgent": [],
                "this_week": [],
                "this_month": [],
                "ongoing": [],
            },
        },
    )


async def generate_admin_recommendations(
    platform_name: str = "TalentIQ",
    dashboard_intelligence: Optional[Dict[str, Any]] = None,
    growth_intelligence: Optional[Dict[str, Any]] = None,
    revenue_intelligence: Optional[Dict[str, Any]] = None,
    risk_intelligence: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate consolidated executive recommendations for the platform admin.

Platform Name: {platform_name}

Dashboard Intelligence:
{compact_text(json.dumps(dashboard_intelligence or {}, ensure_ascii=False, indent=2), 8000)}

Growth Intelligence:
{compact_text(json.dumps(growth_intelligence or {}, ensure_ascii=False, indent=2), 8000)}

Revenue Intelligence:
{compact_text(json.dumps(revenue_intelligence or {}, ensure_ascii=False, indent=2), 8000)}

Risk Intelligence:
{compact_text(json.dumps(risk_intelligence or {}, ensure_ascii=False, indent=2), 8000)}

JSON structure:
{{
  "platform_name": "",
  "strategic_summary": "",
  "top_10_admin_priorities": [],
  "quick_wins": [],
  "growth_priorities": [],
  "revenue_priorities": [],
  "risk_controls": [],
  "product_improvement_priorities": [],
  "enterprise_readiness_priorities": [],
  "priority_matrix": [
    {{
      "priority": "",
      "impact": "Low | Medium | High",
      "urgency": "Low | Medium | High",
      "owner": "",
      "timeline": ""
    }}
  ],
  "founder_level_note": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.3,
        max_tokens=2000,
        fallback={
            "platform_name": platform_name,
            "strategic_summary": "",
            "top_10_admin_priorities": [],
            "quick_wins": [],
            "growth_priorities": [],
            "revenue_priorities": [],
            "risk_controls": [],
            "product_improvement_priorities": [],
            "enterprise_readiness_priorities": [],
            "priority_matrix": [],
            "founder_level_note": "",
        },
    )