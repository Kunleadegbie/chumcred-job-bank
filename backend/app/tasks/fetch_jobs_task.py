import os
from datetime import datetime, timezone
from dotenv import load_dotenv
from supabase import create_client, Client

from app.services.job_fetcher import JobFetcher
from app.services.job_normalizer import JobNormalizer
from app.services.duplicate_checker import DuplicateChecker

load_dotenv()


def get_supabase_client() -> Client:
    supabase_url = os.getenv("SUPABASE_URL")
    supabase_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY")

    if not supabase_url or not supabase_key:
        raise ValueError("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY")

    return create_client(supabase_url, supabase_key)


def create_fetch_log(supabase: Client):
    response = (
        supabase.table("job_fetch_logs")
        .insert({
            "source_name": "Chumcred Automated Fetcher",
            "fetch_started_at": datetime.now(timezone.utc).isoformat(),
            "status": "running",
        })
        .execute()
    )

    if response.data:
        return response.data[0]["id"]

    return None


def update_fetch_log(
    supabase: Client,
    log_id,
    stats,
    status="success",
    error_message=None,
):
    if not log_id:
        return

    supabase.table("job_fetch_logs").update({
        "fetch_completed_at": datetime.now(timezone.utc).isoformat(),
        "jobs_found": stats.get("jobs_found", 0),
        "jobs_inserted": stats.get("jobs_inserted", 0),
        "jobs_updated": stats.get("jobs_updated", 0),
        "duplicates_skipped": stats.get("duplicates_skipped", 0),
        "errors_count": len(stats.get("errors", [])),
        "status": status,
        "error_message": error_message,
    }).eq("id", log_id).execute()


def is_duplicate_error(error: Exception) -> bool:
    message = str(error).lower()

    duplicate_signals = [
        "duplicate key value violates unique constraint",
        "23505",
        "jobs_slug_key",
        "jobs_duplicate_hash_key",
        "already exists",
    ]

    return any(signal in message for signal in duplicate_signals)


def run_job_fetch_task():
    supabase = get_supabase_client()
    log_id = create_fetch_log(supabase)

    fetcher = JobFetcher()
    normalizer = JobNormalizer()
    duplicate_checker = DuplicateChecker()

    stats = {
        "jobs_found": 0,
        "jobs_inserted": 0,
        "jobs_updated": 0,
        "duplicates_skipped": 0,
        "invalid_jobs_skipped": 0,
        "errors": []
    }

    try:
        raw_jobs = fetcher.fetch_all_jobs()
        stats["jobs_found"] = len(raw_jobs)

        for raw_job in raw_jobs:
            try:
                normalized_job = normalizer.normalize(raw_job)

                if not normalized_job:
                    stats["invalid_jobs_skipped"] += 1
                    continue

                normalized_job = duplicate_checker.attach_duplicate_hash(normalized_job)

                existing = (
                    supabase.table("jobs")
                    .select("id")
                    .or_(
                        f"duplicate_hash.eq.{normalized_job['duplicate_hash']},slug.eq.{normalized_job['slug']}"
                    )
                    .execute()
                )

                if existing.data:
                    stats["duplicates_skipped"] += 1
                    continue

                try:
                    supabase.table("jobs").insert(normalized_job).execute()
                    stats["jobs_inserted"] += 1

                except Exception as insert_error:
                    if is_duplicate_error(insert_error):
                        stats["duplicates_skipped"] += 1
                    else:
                        stats["errors"].append(str(insert_error))

            except Exception as e:
                if is_duplicate_error(e):
                    stats["duplicates_skipped"] += 1
                else:
                    stats["errors"].append(str(e))

        final_status = "success" if not stats["errors"] else "partial_success"

        update_fetch_log(
            supabase=supabase,
            log_id=log_id,
            stats=stats,
            status=final_status,
            error_message="; ".join(stats["errors"][:5]) if stats["errors"] else None,
        )

        return {
            "status": "completed",
            "summary": stats
        }

    except Exception as e:
        stats["errors"].append(str(e))

        update_fetch_log(
            supabase=supabase,
            log_id=log_id,
            stats=stats,
            status="failed",
            error_message=str(e),
        )

        return {
            "status": "failed",
            "summary": stats
        }