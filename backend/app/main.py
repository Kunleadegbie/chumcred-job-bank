from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timezone
from supabase import create_client
from app.services.career_coach import generate_career_advice

from app.tasks.fetch_jobs_task import run_job_fetch_task
from app.tasks.archive_jobs_task import run_archive_jobs_task
from app.tasks.cleanup_jobs_task import run_cleanup_jobs_task
from app.services.ai_matcher import simple_match_score
from app.services.resume_extractor import extract_resume_text
from app.services.cv_reviewer import review_cv
from app.services.interview_iq import generate_interview_question, review_interview_answer

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


def get_supabase():
    return create_client(
        os.getenv("SUPABASE_URL"),
        os.getenv("SUPABASE_SERVICE_ROLE_KEY")
    )


def verify_cron_secret(x_cron_secret: str | None):
    cron_secret = os.getenv("CRON_SECRET")

    if cron_secret and x_cron_secret != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized cron request")


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
    verify_cron_secret(x_cron_secret)
    return run_job_fetch_task()


@app.post("/tasks/archive-jobs")
def archive_jobs(x_cron_secret: str = Header(default=None)):
    verify_cron_secret(x_cron_secret)
    return run_archive_jobs_task()


@app.post("/tasks/cleanup-jobs")
def cleanup_jobs(x_cron_secret: str = Header(default=None)):
    verify_cron_secret(x_cron_secret)
    return run_cleanup_jobs_task()


@app.post("/tasks/extract-resume-text")
def extract_resume_text_task(x_cron_secret: str = Header(default=None)):
    verify_cron_secret(x_cron_secret)

    supabase = get_supabase()

    profiles = (
        supabase.table("profiles")
        .select("id,resume_path,resume_name")
        .not_.is_("resume_path", "null")
        .execute()
    )

    processed = 0
    failed = 0
    errors = []

    for profile in profiles.data or []:
        user_id = profile.get("id")
        resume_path = profile.get("resume_path")
        resume_name = profile.get("resume_name") or resume_path or ""

        if not resume_path:
            continue

        try:
            file_response = (
                supabase.storage
                .from_("resumes")
                .download(resume_path)
            )

            if not file_response:
                failed += 1
                errors.append(f"No file returned for profile {user_id}")
                continue

            extracted_text = extract_resume_text(file_response, resume_name)

            if not extracted_text:
                failed += 1
                errors.append(f"No text extracted for profile {user_id}")
                continue

            supabase.table("profiles").update({
                "resume_text": extracted_text,
                "resume_parsed_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", user_id).execute()

            processed += 1

        except Exception as e:
            failed += 1
            errors.append(str(e))

    return {
        "status": "completed",
        "profiles_found": len(profiles.data or []),
        "processed": processed,
        "failed": failed,
        "errors": errors[:5]
    }


@app.post("/tasks/generate-job-matches")
def generate_job_matches(x_cron_secret: str = Header(None)):
    verify_cron_secret(x_cron_secret)

    supabase = get_supabase()

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

@app.post("/tasks/career-coach")
def career_coach(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        supabase = get_supabase()

        user_id = payload.get("user_id")
        question = payload.get("question")

        if not user_id or not question:
            raise HTTPException(
                status_code=400,
                detail="user_id and question are required"
            )

        profile_response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        profile = profile_response.data or {}

        answer = generate_career_advice(question, profile)

        insert_response = supabase.table("career_coach_messages").insert({
            "user_id": user_id,
            "question": question,
            "answer": answer,
        }).execute()

        return {
            "status": "completed",
            "answer": answer,
            "saved": bool(insert_response.data)
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/tasks/cv-review")
def cv_review(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        supabase = get_supabase()

        user_id = payload.get("user_id")

        if not user_id:
            raise HTTPException(
                status_code=400,
                detail="user_id is required"
            )

        profile_response = (
            supabase.table("profiles")
            .select("id,resume_text")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        profile = profile_response.data or {}
        resume_text = profile.get("resume_text") or ""

        if not resume_text.strip():
            return {
                "status": "error",
                "message": "No resume text found. Please upload and extract resume first."
            }

        result = review_cv(resume_text)

        insert_response = supabase.table("cv_reviews").insert({
            "user_id": user_id,
            "score": result["score"],
            "strengths": result["strengths"],
            "weaknesses": result["weaknesses"],
            "recommendations": result["recommendations"],
        }).execute()

        return {
            "status": "completed",
            "review": result,
            "saved": bool(insert_response.data)
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/tasks/interview-iq/question")
def interview_iq_question(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)
        supabase = get_supabase()

        user_id = payload.get("user_id")
        target_role = payload.get("target_role") or "General"

        if not user_id:
            raise HTTPException(status_code=400, detail="user_id is required")

        profile_response = (
            supabase.table("profiles")
            .select("*")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        profile = profile_response.data or {}
        question = generate_interview_question(target_role, profile)

        return {
            "status": "completed",
            "target_role": target_role,
            "question": question
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }


@app.post("/tasks/interview-iq/review")
def interview_iq_review(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)
        supabase = get_supabase()

        user_id = payload.get("user_id")
        target_role = payload.get("target_role") or "General"
        question = payload.get("question")
        answer = payload.get("answer")

        if not user_id or not question or not answer:
            raise HTTPException(
                status_code=400,
                detail="user_id, question and answer are required"
            )

        result = review_interview_answer(question, answer, target_role)

        insert_response = supabase.table("interview_iq_sessions").insert({
            "user_id": user_id,
            "target_role": target_role,
            "question": question,
            "user_answer": answer,
            "feedback": result["feedback"],
            "score": result["score"],
        }).execute()

        return {
            "status": "completed",
            "review": result,
            "saved": bool(insert_response.data)
        }

    except HTTPException:
        raise

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }