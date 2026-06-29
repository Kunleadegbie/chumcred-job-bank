from __future__ import annotations

import json
from typing import Any, Dict, Optional

from app.services.ai_client import generate_json, compact_text


OPERATIONS_AI_SYSTEM_PROMPT = """
You are OperationsAI, the internal executive operations intelligence engine for the TalentIQ platform.

Your job is to help the platform founder/admin understand:
- AI usage patterns
- credit consumption
- subscription and revenue performance
- failed AI calls
- rate limit or abuse signals
- enterprise activity
- employer activity
- institution activity
- operational risks
- product performance
- launch readiness

Be practical, concise, executive-level, and action-focused.
"""


def _json_prompt(task_prompt: str) -> str:
    return f"""
{OPERATIONS_AI_SYSTEM_PROMPT}

{task_prompt}

Important:
Return ONLY valid JSON.
Do not include markdown.
Do not include explanations outside the JSON.
"""


async def generate_operations_intelligence(
    platform_name: str = "TalentIQ",
    ai_usage_data: Optional[Dict[str, Any]] = None,
    credit_data: Optional[Dict[str, Any]] = None,
    payment_data: Optional[Dict[str, Any]] = None,
    subscription_data: Optional[Dict[str, Any]] = None,
    enterprise_data: Optional[Dict[str, Any]] = None,
    error_data: Optional[Dict[str, Any]] = None,
    operational_notes: Optional[str] = None,
) -> Dict[str, Any]:
    prompt = _json_prompt(
        f"""
Generate an executive operations intelligence report.

Platform Name:
{platform_name}

AI Usage Data:
{compact_text(json.dumps(ai_usage_data or {}, ensure_ascii=False, indent=2), 8000)}

Credit Data:
{compact_text(json.dumps(credit_data or {}, ensure_ascii=False, indent=2), 8000)}

Payment Data:
{compact_text(json.dumps(payment_data or {}, ensure_ascii=False, indent=2), 8000)}

Subscription Data:
{compact_text(json.dumps(subscription_data or {}, ensure_ascii=False, indent=2), 8000)}

Enterprise Data:
{compact_text(json.dumps(enterprise_data or {}, ensure_ascii=False, indent=2), 8000)}

Error / Failure Data:
{compact_text(json.dumps(error_data or {}, ensure_ascii=False, indent=2), 8000)}

Operational Notes:
{compact_text(operational_notes, 5000)}

JSON structure:
{{
  "platform_name": "",
  "executive_summary": "",
  "operations_health_score": 0,
  "health_level": "Critical | Weak | Stable | Strong | Excellent",
  "ai_usage_insights": {{
    "summary": "",
    "most_used_tools": [],
    "underused_tools": [],
    "usage_risks": [],
    "recommendations": []
  }},
  "credit_consumption_insights": {{
    "summary": "",
    "high_consumption_patterns": [],
    "low_balance_risks": [],
    "recommendations": []
  }},
  "revenue_and_subscription_insights": {{
    "summary": "",
    "positive_signals": [],
    "concerns": [],
    "revenue_opportunities": []
  }},
  "enterprise_activity_insights": {{
    "summary": "",
    "active_accounts": [],
    "inactive_accounts": [],
    "recommendations": []
  }},
  "risk_and_abuse_alerts": [],
  "failed_call_insights": [],
  "launch_readiness_gaps": [],
  "admin_action_plan": {{
    "today": [],
    "this_week": [],
    "this_month": [],
    "before_launch": []
  }},
  "founder_note": ""
}}
"""
    )

    return generate_json(
        prompt,
        temperature=0.25,
        max_tokens=2200,
        fallback={
            "platform_name": platform_name,
            "executive_summary": "",
            "operations_health_score": 0,
            "health_level": "Stable",
            "ai_usage_insights": {
                "summary": "",
                "most_used_tools": [],
                "underused_tools": [],
                "usage_risks": [],
                "recommendations": [],
            },
            "credit_consumption_insights": {
                "summary": "",
                "high_consumption_patterns": [],
                "low_balance_risks": [],
                "recommendations": [],
            },
            "revenue_and_subscription_insights": {
                "summary": "",
                "positive_signals": [],
                "concerns": [],
                "revenue_opportunities": [],
            },
            "enterprise_activity_insights": {
                "summary": "",
                "active_accounts": [],
                "inactive_accounts": [],
                "recommendations": [],
            },
            "risk_and_abuse_alerts": [],
            "failed_call_insights": [],
            "launch_readiness_gaps": [],
            "admin_action_plan": {
                "today": [],
                "this_week": [],
                "this_month": [],
                "before_launch": [],
            },
            "founder_note": "",
        },
    )