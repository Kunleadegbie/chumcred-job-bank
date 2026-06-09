from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import os

from app.tasks.fetch_jobs_task import run_job_fetch_task
from app.tasks.archive_jobs_task import run_archive_jobs_task
from app.tasks.cleanup_jobs_task import run_cleanup_jobs_task

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