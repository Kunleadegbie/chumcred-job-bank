from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os
from datetime import datetime, timezone
from supabase import create_client
from app.services.career_coach import generate_career_advice
from fastapi import UploadFile, File, Form
from app.services.transcription_service import transcribe_audio_file
from app.services.interview_iq_analyzer import analyze_interview
from app.services.ai_match_score import generate_ai_match_score
from app.services.job_recommender import recommend_jobs_for_resume
from app.services.interview_readiness import calculate_interview_readiness
from app.services.cv_intelligence import calculate_cv_intelligence
from app.services.cv_rewrite import rewrite_cv_for_job


from app.tasks.fetch_jobs_task import run_job_fetch_task
from app.tasks.archive_jobs_task import run_archive_jobs_task
from app.tasks.cleanup_jobs_task import run_cleanup_jobs_task
from app.services.ai_matcher import simple_match_score
from app.services.resume_extractor import extract_resume_text
from app.services.cv_reviewer import review_cv
from app.services.interview_iq import generate_interview_question, review_interview_answer

from app.services.ai_job_search import (
    parse_ai_job_search_query,
    job_matches_search,
    normalize_search_result,
    search_jsearch_jobs,
    search_adzuna_jobs,
)

from app.services.interview_session import (
    MAX_ROUNDS,
    generate_first_question,
    generate_follow_up_question,
    generate_final_assessment,
)


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
        job_context = payload.get("job_context") or None

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
        question = generate_interview_question(target_role, profile, job_context)

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
        job_context = payload.get("job_context") or None

        if not user_id or not question or not answer:
            raise HTTPException(
                status_code=400,
                detail="user_id, question and answer are required"
            )

        result = review_interview_answer(question, answer, target_role, None, job_context)

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

@app.post("/tasks/interview-iq/transcribe")
async def interview_iq_transcribe(
    user_id: str = Form(...),
    question: str = Form(...),
    target_role: str = Form(default="General"),
    file: UploadFile = File(...),
    x_cron_secret: str = Header(default=None),
):
    try:
        verify_cron_secret(x_cron_secret)

        file_bytes = await file.read()
        transcript = transcribe_audio_file(file_bytes, file.filename or "interview.webm")

        return {
            "status": "completed",
            "user_id": user_id,
            "target_role": target_role,
            "question": question,
            "transcript": transcript,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }

@app.post("/tasks/interview-iq/analyze")
async def interview_iq_analyze(payload: dict):

    try:
        result = analyze_interview(
            question=payload["question"],
            transcript=payload["transcript"],
            target_role=payload["target_role"]
        )

        return {
            "status": "completed",
            "analysis": result
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/tasks/interview-iq/start-session")
def interview_iq_start_session(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        target_role = payload.get("target_role") or "General"
        company_name = payload.get("company_name")
        job_context = payload.get("job_context") or None

        question = generate_first_question(
            target_role=target_role,
            company_name=company_name,
            job_context=job_context,
        )

        rounds = [
            {
                "round": 1,
                "question": question,
                "answer": "",
            }
        ]

        if user_id:
            supabase = get_supabase()
            supabase.table("interview_iq_drafts").upsert({
                "user_id": user_id,
                "target_role": target_role,
                "company_name": company_name,
                "job_context": job_context,
                "rounds": rounds,
                "current_round": 1,
                "status": "draft",
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }, on_conflict="user_id").execute()

        return {
            "status": "completed",
            "round": 1,
            "max_rounds": MAX_ROUNDS,
            "target_role": target_role,
            "company_name": company_name,
            "job_context": job_context,
            "question": question,
            "rounds": rounds,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/tasks/interview-iq/save-draft")
def interview_iq_save_draft(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        target_role = payload.get("target_role")
        company_name = payload.get("company_name")
        job_context = payload.get("job_context")
        rounds = payload.get("rounds") or []
        current_round = payload.get("current_round", 1)

        if not user_id:
            return {"status": "error", "message": "user_id is required"}

        supabase = get_supabase()

        existing = (
            supabase.table("interview_iq_drafts")
            .select("id")
            .eq("user_id", user_id)
            .eq("status", "draft")
            .limit(1)
            .execute()
        )

        if existing.data:
            draft_id = existing.data[0]["id"]

            supabase.table("interview_iq_drafts").update({
                "target_role": target_role,
                "company_name": company_name,
                "job_context": job_context,
                "rounds": rounds,
                "current_round": current_round,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", draft_id).execute()
        else:
            inserted = (
                supabase.table("interview_iq_drafts")
                .insert({
                    "user_id": user_id,
                    "target_role": target_role,
                    "company_name": company_name,
                    "job_context": job_context,
                    "rounds": rounds,
                    "current_round": current_round,
                    "status": "draft",
                    "updated_at": datetime.now(timezone.utc).isoformat(),
                })
                .execute()
            )

            draft_id = inserted.data[0]["id"]

        return {"status": "completed", "draft_id": draft_id}

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/tasks/interview-iq/load-draft")
def interview_iq_load_draft(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")

        if not user_id:
            return {"status": "error", "message": "user_id is required"}

        supabase = get_supabase()

        draft = (
            supabase.table("interview_iq_drafts")
            .select("*")
            .eq("user_id", user_id)
            .eq("status", "draft")
            .order("updated_at", desc=True)
            .limit(1)
            .execute()
        )

        return {
            "status": "completed",
            "draft": draft.data[0] if draft.data else None,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}


@app.post("/tasks/interview-iq/next-question")
def interview_iq_next_question(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        target_role = payload.get("target_role") or "General"
        company_name = payload.get("company_name")
        job_context = payload.get("job_context") or None
        rounds = payload.get("rounds") or []
        answer = payload.get("answer") or ""

        if not rounds:
            return {"status": "error", "message": "Previous rounds are required."}

        current_round = len(rounds)

        if current_round >= MAX_ROUNDS:
            return {
                "status": "completed",
                "finished": True,
                "message": "Maximum interview rounds reached.",
                "rounds": rounds,
            }

        last_round = rounds[-1]
        last_round["answer"] = answer

        next_round_number = current_round + 1

        next_question = generate_follow_up_question(
            target_role=target_role,
            previous_question=last_round.get("question", ""),
            candidate_answer=answer,
            round_number=next_round_number,
            company_name=company_name,
            job_context=job_context,
            previous_rounds=rounds,
        )

        rounds.append({
            "round": next_round_number,
            "question": next_question,
            "answer": "",
        })

        if user_id:
            supabase = get_supabase()
            supabase.table("interview_iq_drafts").update({
                "target_role": target_role,
                "company_name": company_name,
                "job_context": job_context,
                "rounds": rounds,
                "current_round": next_round_number,
                "updated_at": datetime.now(timezone.utc).isoformat(),
            }).eq("user_id", user_id).eq("status", "draft").execute()

        return {
            "status": "completed",
            "finished": False,
            "round": next_round_number,
            "max_rounds": MAX_ROUNDS,
            "question": next_question,
            "rounds": rounds,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/tasks/interview-iq/end-session")
def interview_iq_end_session(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        target_role = payload.get("target_role") or "General"
        company_name = payload.get("company_name")
        job_context = payload.get("job_context") or None
        rounds = payload.get("rounds") or []

        if not user_id:
            return {"status": "error", "message": "user_id is required"}

        if not rounds:
            return {"status": "error", "message": "Interview rounds are required"}

        assessment = generate_final_assessment(
            target_role=target_role,
            company_name=company_name,
            job_context=job_context,
            rounds=rounds,
        )

        overall_score = int(assessment.get("overall_score") or 0)
        recommendation = assessment.get("recommendation") or ""

        supabase = get_supabase()

        insert_payload = {
            "user_id": user_id,
            "target_role": target_role,
            "company_name": company_name,
            "job_context": job_context,
            "rounds": rounds,
            "assessment": assessment,
            "overall_score": overall_score,
            "recommendation": recommendation,
            "status": "completed",
        }

        insert_response = (
            supabase.table("multi_round_interview_sessions")
            .insert(insert_payload)
            .execute()
        )

        if not insert_response.data:
            return {
                "status": "error",
                "message": "Interview completed but could not be saved to history.",
                "assessment": assessment,
                "rounds": rounds,
                "saved": False,
            }

        saved_session = insert_response.data[0]

        supabase.table("interview_iq_drafts").update({
            "status": "completed",
            "updated_at": datetime.now(timezone.utc).isoformat(),
        }).eq("user_id", user_id).eq("status", "draft").execute()

        return {
            "status": "completed",
            "target_role": target_role,
            "company_name": company_name,
            "rounds": rounds,
            "assessment": assessment,
            "saved": True,
            "session": saved_session,
            "session_id": saved_session.get("id"),
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "saved": False,
        }

@app.post("/tasks/ai-job-search")
async def ai_job_search(
    payload: dict,
    x_cron_secret: str = Header(default=None)
):
    try:
        verify_cron_secret(x_cron_secret)

        query = payload.get("query", "").strip()

        if not query:
            return {
                "status": "error",
                "message": "Query is required"
            }

        supabase = get_supabase()

        intent = parse_ai_job_search_query(query)

        jobs_results = []

        # ==================================
        # Search Jobs Table
        # ==================================

        jobs_response = (
            supabase.table("jobs")
            .select("*")
            .limit(500)
            .execute()
        )

        jobs = jobs_response.data or []

        for job in jobs:
            if job_matches_search(job, intent):
                jobs_results.append(
                    normalize_search_result(
                        job,
                        intent,
                        "Chumcred Jobs"
                    )
                )

        # ==================================
        # Search Employer Jobs
        # ==================================

        employer_response = (
            supabase.table("employer_jobs")
            .select("*")
            .limit(500)
            .execute()
        )

        employer_jobs = employer_response.data or []

        for job in employer_jobs:
            if job_matches_search(job, intent):
                jobs_results.append(
                    normalize_search_result(
                        job,
                        intent,
                        "Employer Jobs"
                    )
                )

        external_results = []

        external_results.extend(search_jsearch_jobs(intent, 20))
        external_results.extend(search_adzuna_jobs(intent, 20))

        jobs_results.extend(external_results)

        jobs_results = sorted(
            jobs_results,
            key=lambda x: x.get("match_score", 0),
            reverse=True
        )

        return {
            "status": "completed",
            "query": query,
            "intent": intent,
            "count": len(jobs_results),
            "results": jobs_results[:50]
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/tasks/ai-match-score")
def ai_match_score(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id") or ""
        job_id = payload.get("job_id") or None
        resume_text = payload.get("resume_text") or ""
        job_title = payload.get("job_title") or ""
        company_name = payload.get("company_name") or ""
        job_description = payload.get("job_description") or ""
        job_requirements = payload.get("job_requirements") or ""
        job_responsibilities = payload.get("job_responsibilities") or ""

        if not resume_text.strip():
            return {"status": "error", "message": "resume_text is required"}

        result = generate_ai_match_score(
            resume_text=resume_text,
            job_title=job_title,
            company_name=company_name,
            job_description=job_description,
            job_requirements=job_requirements,
            job_responsibilities=job_responsibilities,
        )

        saved = False
        match_result_id = None

        if user_id:
            supabase = get_supabase()

            insert_response = supabase.table("ai_match_results").insert({
                "user_id": user_id,
                "job_id": job_id,
                "job_title": job_title,
                "company_name": company_name,
                "match_score": result.get("match_score", 0),
                "result": result,
            }).execute()

            saved = bool(insert_response.data)
            match_result_id = insert_response.data[0]["id"] if insert_response.data else None

        return {
            "status": "completed",
            "match": result,
            "saved": saved,
            "match_result_id": match_result_id,
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/tasks/ai-match-history")
def ai_match_history(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        job_id = payload.get("job_id")
        match_id = payload.get("match_id")

        if not user_id:
            return {"status": "error", "message": "user_id is required"}

        supabase = get_supabase()

        query = (
            supabase.table("ai_match_results")
            .select("*")
            .eq("user_id", user_id)
        )

        if match_id:
            query = query.eq("id", match_id)
        elif job_id:
            query = query.eq("job_id", job_id)

        response = query.order("created_at", desc=True).limit(50).execute()

        return {
            "status": "completed",
            "history": response.data or []
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/tasks/job-recommendations")
def job_recommendations(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        limit = payload.get("limit") or 20

        if not user_id:
            return {"status": "error", "message": "user_id is required"}

        supabase = get_supabase()

        profile_response = (
            supabase.table("profiles")
            .select("id,resume_text,resume_path,resume_name")
            .eq("id", user_id)
            .maybe_single()
            .execute()
        )

        profile = profile_response.data or {}
        resume_text = profile.get("resume_text") or ""
        resume_path = profile.get("resume_path")
        resume_name = profile.get("resume_name") or resume_path or ""

        placeholder_signals = [
            "resume uploaded:",
            "candidate uploaded a cv",
            "candidate uploaded a resume",
            "file type:",
            "ai job recommendations",
        ]

        resume_text_is_placeholder = any(
            signal in resume_text.lower() for signal in placeholder_signals
        )

        if (not resume_text.strip() or resume_text_is_placeholder) and resume_path:
            try:
                file_response = (
                    supabase.storage
                    .from_("resumes")
                    .download(resume_path)
                )

                extracted_text = extract_resume_text(file_response, resume_name)

                if extracted_text and extracted_text.strip():
                    resume_text = extracted_text

                    supabase.table("profiles").update({
                        "resume_text": extracted_text,
                        "resume_parsed_at": datetime.now(timezone.utc).isoformat(),
                    }).eq("id", user_id).execute()

            except Exception as extract_error:
                return {
                    "status": "error",
                    "message": f"CV uploaded, but text extraction failed: {str(extract_error)}"
                }

        if not resume_text.strip() or resume_text_is_placeholder:
            return {
                "status": "error",
                "message": "No usable CV text found. Please upload a readable PDF, DOC, or DOCX CV."
            }

        jobs_response = (
            supabase.table("jobs")
            .select("*")
            .is_("deleted_at", "null")
            .limit(500)
            .execute()
        )

        jobs = jobs_response.data or []

        recommendations = recommend_jobs_for_resume(
            resume_text=resume_text,
            jobs=jobs,
            limit=limit,
        )

        save_response = supabase.table("job_recommendation_history").insert({
            "user_id": user_id,
            "recommendations": recommendations,
        }).execute()

        return {
            "status": "completed",
            "count": len(recommendations),
            "recommendations": recommendations,
            "saved": bool(save_response.data),
        }

    except Exception as e:
        return {"status": "error", "message": str(e)}

@app.post("/tasks/job-recommendation-history")
def job_recommendation_history(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")

        if not user_id:
            return {
                "status": "error",
                "message": "user_id is required"
            }

        supabase = get_supabase()

        response = (
            supabase.table("job_recommendation_history")
            .select("*")
            .eq("user_id", user_id)
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )

        latest = response.data[0] if response.data else None

        return {
            "status": "completed",
            "recommendations": latest.get("recommendations") if latest else [],
            "history_id": latest.get("id") if latest else None,
            "created_at": latest.get("created_at") if latest else None,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e)
        }

@app.post("/tasks/interview-iq/readiness")
def interview_iq_readiness(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        job_context = payload.get("job_context") or {}
        ai_match_result = payload.get("ai_match_result") or {}

        if not user_id:
            return {
                "status": "error",
                "message": "user_id is required",
            }

        supabase = get_supabase()

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
                "message": "No resume text found. Please upload and extract your CV first.",
            }

        readiness = calculate_interview_readiness(
            resume_text=resume_text,
            job_context=job_context,
            ai_match_result=ai_match_result,
        )

        return {
            "status": "completed",
            "readiness": readiness,
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }

@app.post("/tasks/cv-intelligence")
def cv_intelligence(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        job_context = payload.get("job_context") or {}

        if not user_id:
            return {
                "status": "error",
                "message": "user_id is required",
            }

        supabase = get_supabase()

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
                "message": "No resume text found. Please upload and extract your CV first.",
            }

        result = calculate_cv_intelligence(
            resume_text=resume_text,
            job_context=job_context,
        )

        save_response = supabase.table("cv_intelligence_history").insert({
            "user_id": user_id,
            "job_context": job_context,
            "ats_score": result.get("ats_score", 0),
            "result": result,
        }).execute()

        return {
            "status": "completed",
            "intelligence": result,
            "saved": bool(save_response.data),
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }

@app.post("/tasks/cv-rewrite")
def cv_rewrite(payload: dict, x_cron_secret: str = Header(default=None)):
    try:
        verify_cron_secret(x_cron_secret)

        user_id = payload.get("user_id")
        job_context = payload.get("job_context") or {}
        cv_intelligence = payload.get("cv_intelligence") or {}

        if not user_id:
            return {
                "status": "error",
                "message": "user_id is required",
            }

        supabase = get_supabase()

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
                "message": "No resume text found. Please upload and extract your CV first.",
            }

        rewrite = rewrite_cv_for_job(
            resume_text=resume_text,
            job_context=job_context,
            cv_intelligence=cv_intelligence,
        )

        save_response = supabase.table("cv_rewrite_history").insert({
            "user_id": user_id,
            "job_context": job_context,
            "cv_intelligence": cv_intelligence,
            "rewrite": rewrite,
        }).execute()

        return {
            "status": "completed",
            "rewrite": rewrite,
            "saved": bool(save_response.data),
        }

    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
        }
