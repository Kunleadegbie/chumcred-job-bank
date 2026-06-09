import os
from datetime import datetime, timezone, timedelta
from supabase import create_client, Client


def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    return create_client(supabase_url, supabase_key)


def run_cleanup_jobs_task():
    supabase = get_supabase_client()

    cutoff_date = (datetime.now(timezone.utc) - timedelta(days=45)).isoformat()
    now = datetime.now(timezone.utc).isoformat()

    archived_response = (
        supabase.table("jobs")
        .select("id,title,archived_at,status")
        .eq("status", "archived")
        .lt("archived_at", cutoff_date)
        .execute()
    )

    jobs_to_delete = archived_response.data or []

    deleted_count = 0
    errors = []

    for job in jobs_to_delete:
        try:
            supabase.table("jobs").update({
                "status": "deleted",
                "deleted_at": now
            }).eq("id", job.get("id")).execute()

            deleted_count += 1

        except Exception as e:
            errors.append({
                "job_id": job.get("id"),
                "error": str(e)
            })

    archived_cleanup_response = (
        supabase.table("archived_jobs")
        .select("id,job_id,delete_after")
        .lt("delete_after", now)
        .execute()
    )

    archive_rows = archived_cleanup_response.data or []

    archived_rows_deleted = 0

    for row in archive_rows:
        try:
            supabase.table("archived_jobs").delete().eq("id", row.get("id")).execute()
            archived_rows_deleted += 1

        except Exception as e:
            errors.append({
                "archive_id": row.get("id"),
                "error": str(e)
            })

    return {
        "status": "completed",
        "jobs_marked_deleted": deleted_count,
        "archive_rows_deleted": archived_rows_deleted,
        "errors": errors
    }