from __future__ import annotations

import os
from typing import Any, Dict, Optional

from supabase import create_client, Client


SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

supabase: Optional[Client] = None

if SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)


AI_CREDIT_COSTS: Dict[str, int] = {
    "career_iq": 5,
    "cv_intelligence": 5,
    "interview_iq": 5,
    "employer_ai": 10,
    "institution_ai": 20,
    "admin_ai": 15,
    "copilot": 5,
}


class CreditError(Exception):
    pass


def get_credit_cost(tool_name: str) -> int:
    return AI_CREDIT_COSTS.get(tool_name, 1)


def ensure_supabase() -> Client:
    if not supabase:
        raise CreditError(
            "Supabase service client is not configured. Check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
        )

    return supabase


def get_or_create_wallet(user_id: str) -> Dict[str, Any]:
    client = ensure_supabase()

    existing = (
        client.table("ai_credit_wallets")
        .select("*")
        .eq("user_id", user_id)
        .maybe_single()
        .execute()
    )

    if existing.data:
        return existing.data

    created = (
        client.table("ai_credit_wallets")
        .insert(
            {
                "user_id": user_id,
                "balance": 0,
                "lifetime_credits": 0,
            }
        )
        .execute()
    )

    if not created.data:
        raise CreditError("Unable to create AI credit wallet.")

    return created.data[0]


def check_ai_credits(user_id: str, tool_name: str) -> Dict[str, Any]:
    wallet = get_or_create_wallet(user_id)
    cost = get_credit_cost(tool_name)
    balance = int(wallet.get("balance") or 0)

    if balance < cost:
        return {
            "allowed": False,
            "cost": cost,
            "balance": balance,
            "wallet": wallet,
            "message": f"Insufficient AI credits. This action requires {cost} credits. Your current balance is {balance}.",
        }

    return {
        "allowed": True,
        "cost": cost,
        "balance": balance,
        "wallet": wallet,
        "message": "",
    }


def deduct_ai_credits(
    user_id: str,
    tool_name: str,
    action: Optional[str] = None,
    request_summary: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> Dict[str, Any]:
    client = ensure_supabase()

    check = check_ai_credits(user_id, tool_name)

    if not check["allowed"]:
        raise CreditError(check["message"])

    wallet = check["wallet"]
    cost = check["cost"]
    current_balance = int(wallet.get("balance") or 0)
    new_balance = current_balance - cost

    wallet_update = (
        client.table("ai_credit_wallets")
        .update(
            {
                "balance": new_balance,
            }
        )
        .eq("id", wallet["id"])
        .execute()
    )

    if wallet_update.data is None:
        raise CreditError("Unable to update AI credit wallet.")

    client.table("ai_credit_transactions").insert(
        {
            "wallet_id": wallet["id"],
            "user_id": user_id,
            "transaction_type": "debit",
            "amount": cost,
            "balance_after": new_balance,
            "source": tool_name,
            "description": f"{cost} credits used for {tool_name}",
            "metadata": metadata or {},
        }
    ).execute()

    client.table("ai_usage_logs").insert(
        {
            "user_id": user_id,
            "tool_name": tool_name,
            "action": action,
            "credits_used": cost,
            "request_summary": request_summary,
            "response_status": "success",
            "metadata": metadata or {},
        }
    ).execute()

    return {
        "success": True,
        "cost": cost,
        "balance_before": current_balance,
        "balance_after": new_balance,
    }


def log_ai_failure(
    user_id: Optional[str],
    tool_name: str,
    action: Optional[str] = None,
    request_summary: Optional[str] = None,
    error_message: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
) -> None:
    try:
      client = ensure_supabase()

      client.table("ai_usage_logs").insert(
          {
              "user_id": user_id,
              "tool_name": tool_name,
              "action": action,
              "credits_used": 0,
              "request_summary": request_summary,
              "response_status": "failed",
              "metadata": {
                  **(metadata or {}),
                  "error": error_message,
              },
          }
      ).execute()
    except Exception:
      pass