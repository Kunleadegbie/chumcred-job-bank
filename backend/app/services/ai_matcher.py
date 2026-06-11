def simple_match_score(resume_text: str, job_title: str, job_description: str):
    resume = (resume_text or "").lower()
    title = (job_title or "").lower()
    description = (job_description or "").lower()

    job_words = set((title + " " + description).split())
    resume_words = set(resume.split())

    if not resume_words or not job_words:
        return 0, "Insufficient resume or job data."

    common_words = resume_words.intersection(job_words)
    score = min(round((len(common_words) / max(len(job_words), 1)) * 100), 100)

    if score >= 75:
        summary = "Strong match based on shared skills and keywords."
    elif score >= 50:
        summary = "Moderate match. Candidate may fit with some improvement."
    else:
        summary = "Low match. Candidate may need stronger alignment."

    strengths = ", ".join(list(common_words)[:15]) if common_words else "No strong keyword overlap found."
    gaps = "Improve resume keywords and add more role-specific experience."

    return score, summary, strengths, gaps