import re
from collections import Counter


STOP_WORDS = {
    "the", "and", "or", "a", "an", "to", "of", "in", "for", "with", "on",
    "by", "as", "at", "from", "is", "are", "be", "this", "that", "will",
    "you", "your", "we", "our", "their", "they", "it", "job", "role",
    "candidate", "company", "team", "work", "working", "experience"
}


IMPORTANT_SKILLS = {
    "business analyst", "data analyst", "project management", "product management",
    "product manager", "sql", "python", "excel", "power bi", "tableau",
    "financial analysis", "credit risk", "risk management", "customer service",
    "sales", "marketing", "accounting", "finance", "banking", "telecom",
    "strategy", "operations", "stakeholder management", "reporting",
    "dashboard", "analytics", "machine learning", "artificial intelligence",
    "software engineering", "frontend", "backend", "react", "next.js",
    "fastapi", "supabase", "leadership", "communication", "problem solving"
}


def normalize_text(text: str) -> str:
    text = (text or "").lower()
    text = re.sub(r"[^a-z0-9+#.\s-]", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def tokenize(text: str):
    text = normalize_text(text)
    words = text.split()
    return [word for word in words if word not in STOP_WORDS and len(word) > 2]


def extract_skill_phrases(text: str):
    normalized = normalize_text(text)
    found = []

    for skill in IMPORTANT_SKILLS:
        if skill in normalized:
            found.append(skill)

    return found


def keyword_overlap_score(resume_text: str, job_text: str) -> tuple[int, list[str]]:
    resume_words = set(tokenize(resume_text))
    job_words = set(tokenize(job_text))

    if not resume_words or not job_words:
        return 0, []

    common = resume_words.intersection(job_words)
    score = round((len(common) / max(len(job_words), 1)) * 100)

    return min(score, 100), sorted(list(common))[:20]


def skill_score(resume_text: str, job_text: str) -> tuple[int, list[str]]:
    resume_skills = set(extract_skill_phrases(resume_text))
    job_skills = set(extract_skill_phrases(job_text))

    if not job_skills:
        return 10, []

    matched = resume_skills.intersection(job_skills)
    score = round((len(matched) / max(len(job_skills), 1)) * 100)

    return min(score, 100), sorted(list(matched))


def title_relevance_score(resume_text: str, job_title: str) -> int:
    resume = normalize_text(resume_text)
    title = normalize_text(job_title)

    if not title:
        return 0

    title_words = [word for word in title.split() if word not in STOP_WORDS]

    if not title_words:
        return 0

    matched = [word for word in title_words if word in resume]

    return min(round((len(matched) / len(title_words)) * 100), 100)


def seniority_score(resume_text: str, job_text: str) -> int:
    resume = normalize_text(resume_text)
    job = normalize_text(job_text)

    senior_terms = ["senior", "lead", "manager", "head", "director", "principal"]
    entry_terms = ["graduate", "trainee", "entry", "junior", "intern"]

    resume_has_senior = any(term in resume for term in senior_terms)
    job_has_senior = any(term in job for term in senior_terms)

    resume_has_entry = any(term in resume for term in entry_terms)
    job_has_entry = any(term in job for term in entry_terms)

    if job_has_senior and resume_has_senior:
        return 90

    if job_has_entry and resume_has_entry:
        return 90

    if job_has_senior and not resume_has_senior:
        return 45

    return 65


def generate_summary(score: int) -> str:
    if score >= 85:
        return "Excellent match. The resume strongly aligns with the job requirements."
    if score >= 70:
        return "Strong match. The candidate appears well aligned with this role."
    if score >= 55:
        return "Moderate match. The candidate has relevant experience but may need some improvements."
    if score >= 40:
        return "Fair match. The resume has some relevant keywords but needs stronger alignment."
    return "Low match. The resume does not strongly align with this job yet."


def generate_gaps(matched_skills: list[str], job_text: str) -> str:
    job_skills = set(extract_skill_phrases(job_text))
    missing = sorted(list(job_skills.difference(set(matched_skills))))

    if missing:
        return ", ".join(missing[:10])

    return "No major skill gaps detected from available job description."


def simple_match_score(resume_text: str, job_title: str, job_description: str):
    job_text = f"{job_title or ''} {job_description or ''}"

    keyword_score, common_keywords = keyword_overlap_score(resume_text, job_text)
    skills_score, matched_skills = skill_score(resume_text, job_text)
    title_score = title_relevance_score(resume_text, job_title)
    seniority = seniority_score(resume_text, job_text)

    final_score = round(
        (keyword_score * 0.35)
        + (skills_score * 0.35)
        + (title_score * 0.20)
        + (seniority * 0.10)
    )

    final_score = max(min(final_score, 100), 1)

    summary = generate_summary(final_score)

    strengths_list = matched_skills or common_keywords
    strengths = (
        ", ".join(strengths_list[:15])
        if strengths_list
        else "Some general experience appears relevant, but clear skill overlap is limited."
    )

    gaps = generate_gaps(matched_skills, job_text)

    return final_score, summary, strengths, gaps