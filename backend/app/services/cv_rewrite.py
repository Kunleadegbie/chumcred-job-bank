import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def clean_json_response(content: str) -> str:
    content = (content or "").strip()

    if content.startswith("```json"):
        content = content.replace("```json", "", 1).strip()

    if content.startswith("```"):
        content = content.replace("```", "", 1).strip()

    if content.endswith("```"):
        content = content[:-3].strip()

    return content


def rewrite_cv_for_job(
    resume_text: str,
    job_context: dict | None = None,
    cv_intelligence: dict | None = None,
) -> dict:
    job_context = job_context or {}
    cv_intelligence = cv_intelligence or {}

    prompt = f"""
You are an expert CV writer and ATS optimization specialist.

Rewrite and tailor the candidate's CV for the selected job.

Important rules:
- Do not invent qualifications, employers, degrees, certifications, dates, job titles, or achievements.
- Improve wording using only information already present in the CV.
- Add missing keywords only where the CV evidence supports them.
- Make the CV stronger, clearer, more achievement-focused, and more ATS-friendly.
- Use concise professional language.
- Keep the output practical and copy-ready.

Candidate CV:
{resume_text}

Target Job:
Title: {job_context.get("title", "")}
Company: {job_context.get("company_name", "")}

Job Description:
{job_context.get("description", "")}

Requirements:
{job_context.get("requirements", "")}

Responsibilities:
{job_context.get("responsibilities", "")}

CV Intelligence:
ATS Score: {cv_intelligence.get("ats_score", "")}
Matched Keywords: {json.dumps(cv_intelligence.get("matched_keywords", []), ensure_ascii=False)}
Missing Keywords: {json.dumps(cv_intelligence.get("missing_keywords", []), ensure_ascii=False)}
Rewrite Suggestions: {json.dumps(cv_intelligence.get("rewrite_suggestions", []), ensure_ascii=False)}
Recommended Actions: {json.dumps(cv_intelligence.get("recommended_cv_actions", []), ensure_ascii=False)}

Return ONLY valid JSON.

Required JSON format:
{{
  "improved_summary": "",
  "tailored_headline": "",
  "rewritten_experience_bullets": [
    ""
  ],
  "keywords_to_add": [
    ""
  ],
  "sections_to_improve": [
    {{
      "section": "",
      "issue": "",
      "suggested_fix": ""
    }}
  ],
  "application_positioning": "",
  "final_cv_improvement_note": ""
}}
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.35,
            max_tokens=1400,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response.choices[0].message.content or ""
        cleaned = clean_json_response(content)

        return json.loads(cleaned)

    except Exception as error:
        return {
            "improved_summary": "",
            "tailored_headline": "",
            "rewritten_experience_bullets": [],
            "keywords_to_add": [],
            "sections_to_improve": [],
            "application_positioning": "",
            "final_cv_improvement_note": f"CV rewrite could not be completed: {str(error)}",
        }