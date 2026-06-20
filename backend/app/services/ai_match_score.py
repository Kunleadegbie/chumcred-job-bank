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


def generate_ai_match_score(
    resume_text: str,
    job_title: str,
    company_name: str,
    job_description: str,
    job_requirements: str = "",
    job_responsibilities: str = "",
) -> dict:
    prompt = f"""
You are an expert recruiter, career coach, and applicant tracking system evaluator.

Compare the candidate resume with the job description and produce a realistic AI match score.

Candidate Resume:
{resume_text}

Job Title:
{job_title}

Company:
{company_name}

Job Description:
{job_description}

Job Requirements:
{job_requirements}

Job Responsibilities:
{job_responsibilities}

Return ONLY valid JSON.
Do not use markdown.
Do not use code fences.
Do not explain.

Required JSON format:

{{
  "match_score": 0,
  "recommendation": "",
  "summary": "",
  "strengths": [],
  "gaps": [],
  "missing_keywords": [],
  "skills_alignment": "",
  "experience_alignment": "",
  "education_alignment": "",
  "improvement_actions": []
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        temperature=0.2,
        max_tokens=900,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    content = response.choices[0].message.content.strip()
    cleaned_content = clean_json_response(content)

    try:
        return json.loads(cleaned_content)
    except Exception:
        return {
            "match_score": 0,
            "recommendation": "Unable to parse AI match assessment.",
            "summary": cleaned_content,
            "strengths": [],
            "gaps": [],
            "missing_keywords": [],
            "skills_alignment": "",
            "experience_alignment": "",
            "education_alignment": "",
            "improvement_actions": [],
        }