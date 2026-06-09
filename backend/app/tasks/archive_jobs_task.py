import os
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client


def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    return create_client(supabase_url, supabase_key)


def run_archive_jobs_task():
    supabase = get_supabase_client()

    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
    now = datetime.now(timezone.utc).isoformat()
    delete_after = (datetime.now(timezone.utc) + timedelta(days=45)).isoformat()

    response = (
        supabase.table("jobs")
        .select("id,title,company_name,country,work_type,original_job_url,fetched_at,status")
        .eq("status", "active")
        .lt("fetched_at", cutoff_date)
        .execute()
    )

    jobs_to_archive = response.data or []

    archived_count = 0
    errors = []

    for job in jobs_to_archive:
        try:
            supabase.table("archived_jobs").insert({
                "job_id": job.get("id"),
                "title": job.get("title"),
                "company_name": job.get("company_name"),
                "country": job.get("country"),
                "work_type": job.get("work_type"),
                "original_job_url": job.get("original_job_url"),
                "archived_at": now,
                "delete_after": delete_after
            }).execute()

            supabase.table("jobs").update({
                "status": "archived",
                "archived_at": now
            }).eq("id", job.get("id")).execute()

            archived_count += 1

        except Exception as e:
            errors.append({
                "job_id": job.get("id"),
                "error": str(e)
            })

    return {
        "status": "completed",
        "jobs_checked": len(jobs_to_archive),
        "jobs_archived": archived_count,
        "errors": errors
    }