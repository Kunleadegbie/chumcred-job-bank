from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client

from app.tasks.fetch_jobs_task import run_job_fetch_task
from app.tasks.archive_jobs_task import run_archive_jobs_task
from app.tasks.cleanup_jobs_task import run_cleanup_jobs_task
from app.services.ai_matcher import simple_match_score

app = FastAPI(
    title="Chumcred Global Job Bank API",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "app": "Chumcred Global Job Bank API",
        "status": "running"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.post("/tasks/fetch-jobs")
def fetch_jobs(x_cron_secret: str = Header(default=None)):
    cron_secret = os.getenv("CRON_SECRET")

    if cron_secret and x_cron_secret != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized cron request")

    return run_job_fetch_task()


@app.post("/tasks/archive-jobs")
def archive_jobs(x_cron_secret: str = Header(default=None)):
    cron_secret = os.getenv("CRON_SECRET")

    if cron_secret and x_cron_secret != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized cron request")

    return run_archive_jobs_task()


@app.post("/tasks/cleanup-jobs")
def cleanup_jobs(x_cron_secret: str = Header(default=None)):
    cron_secret = os.getenv("CRON_SECRET")

    if cron_secret and x_cron_secret != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized cron request")

    return run_cleanup_jobs_task()

@app.post("/tasks/generate-job-matches")
def generate_job_matches(x_cron_secret: str = Header(None)):
    if x_cron_secret != os.getenv("CRON_SECRET"):
        raise HTTPException(status_code=401, detail="Unauthorized")

    supabase = create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )

    profiles = (
        supabase.table("profiles")
        .select("id, resume_text, resume_name")
        .not_.is_("resume_text", "null")
        .execute()
    )

    jobs = (
        supabase.table("jobs")
        .select("id,title,description,company_name,location_display")
        .is_("deleted_at", "null")
        .limit(300)
        .execute()
    )

    inserted = 0
    skipped = 0

    for profile in profiles.data or []:
        resume_text = profile.get("resume_text") or ""

        if not resume_text.strip():
            skipped += 1
            continue

        for job in jobs.data or []:
            score, summary, strengths, gaps = simple_match_score(
                resume_text,
                job.get("title", ""),
                job.get("description", "")
            )

            # Temporary lower threshold until we add real CV text extraction
            if score < 1:
                skipped += 1
                continue

            supabase.table("job_matches").upsert(
                {
                    "user_id": profile["id"],
                    "job_id": job["id"],
                    "match_score": max(score, 35),
                    "match_summary": summary,
                    "strengths": strengths,
                    "gaps": gaps,
                },
                on_conflict="user_id,job_id"
            ).execute()

            inserted += 1

    return {
        "status": "completed",
        "profiles_checked": len(profiles.data or []),
        "jobs_checked": len(jobs.data or []),
        "matches_generated": inserted,
        "matches_skipped": skipped
    }