import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def parse_ai_job_search_query(query: str) -> dict:
    prompt = f"""
You are an AI job search assistant.

Extract structured job search intent from this user query:

User query:
{query}

Return ONLY valid JSON in this format:

{{
  "role": "",
  "country": "",
  "city": "",
  "remote": false,
  "visa_sponsorship": false,
  "keywords": []
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.2,
            max_tokens=200,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        content = response.choices[0].message.content.strip()
        return json.loads(content)

    except Exception as e:
        print(f"AI job search parsing fallback: {e}")

        return {
            "role": query,
            "country": "",
            "city": "",
            "remote": "remote" in query.lower(),
            "visa_sponsorship": any(
                word in query.lower()
                for word in ["visa", "sponsorship", "sponsor", "work permit"]
            ),
            "keywords": query.lower().split(),
        }


def job_matches_search(job: dict, intent: dict) -> bool:
    role = (intent.get("role") or "").lower()
    country = (intent.get("country") or "").lower()
    city = (intent.get("city") or "").lower()
    remote = bool(intent.get("remote"))
    visa_sponsorship = bool(intent.get("visa_sponsorship"))
    keywords = intent.get("keywords") or []

    searchable_text = f"""
    {job.get("title") or ""}
    {job.get("company_name") or ""}
    {job.get("description") or ""}
    {job.get("requirements") or ""}
    {job.get("responsibilities") or ""}
    {job.get("benefits") or ""}
    {job.get("country") or ""}
    {job.get("city") or ""}
    {job.get("location_display") or ""}
    {job.get("work_type") or ""}
    """.lower()

    if role:
        role_words = [word for word in role.split() if len(word) > 2]
        if role_words and not any(word in searchable_text for word in role_words):
            return False

    if country and country not in searchable_text:
        return False

    if city and city not in searchable_text:
        return False

    if remote and "remote" not in searchable_text:
        return False

    if visa_sponsorship:
        visa_terms = [
            "visa",
            "sponsorship",
            "sponsor",
            "work permit",
            "relocation",
        ]

        if not any(term in searchable_text for term in visa_terms):
            return False

    useful_keywords = [
        word.lower()
        for word in keywords
        if isinstance(word, str) and len(word) > 2
    ]

    if useful_keywords and not any(word in searchable_text for word in useful_keywords):
        return False

    return True


def rank_job(job: dict, intent: dict) -> int:
    score = 0

    searchable_text = f"""
    {job.get("title") or ""}
    {job.get("company_name") or ""}
    {job.get("description") or ""}
    {job.get("requirements") or ""}
    {job.get("responsibilities") or ""}
    {job.get("country") or ""}
    {job.get("city") or ""}
    {job.get("location_display") or ""}
    {job.get("work_type") or ""}
    """.lower()

    role = (intent.get("role") or "").lower()
    country = (intent.get("country") or "").lower()
    city = (intent.get("city") or "").lower()

    if role and role in searchable_text:
        score += 30

    if country and country in searchable_text:
        score += 20

    if city and city in searchable_text:
        score += 10

    if intent.get("remote") and "remote" in searchable_text:
        score += 20

    if intent.get("visa_sponsorship") and any(
        term in searchable_text
        for term in ["visa", "sponsorship", "sponsor", "work permit", "relocation"]
    ):
        score += 20

    for keyword in intent.get("keywords") or []:
        if isinstance(keyword, str) and keyword.lower() in searchable_text:
            score += 3

    return min(score, 100)


def normalize_search_result(job: dict, intent: dict, source: str = "Chumcred Jobs") -> dict:
    return {
        "id": job.get("id"),
        "title": job.get("title"),
        "company_name": job.get("company_name") or "Company not stated",
        "country": job.get("country") or "",
        "city": job.get("city") or "",
        "location_display": job.get("location_display")
        or job.get("city")
        or job.get("country")
        or "Location not stated",
        "work_type": job.get("work_type") or "",
        "employment_type": job.get("employment_type") or "",
        "description": job.get("description") or "",
        "requirements": job.get("requirements") or "",
        "salary_display": job.get("salary_display") or "",
        "original_job_url": job.get("original_job_url") or "",
        "slug": job.get("slug"),
        "source": source,
        "match_score": rank_job(job, intent),
    }