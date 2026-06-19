import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MAX_ROUNDS = 5


def build_session_context(
    target_role: str,
    company_name: str | None = None,
    job_context: dict | None = None,
) -> str:
    job_context = job_context or {}

    return f"""
Target Role:
{target_role}

Company:
{company_name or job_context.get("company_name") or "Not specified"}

Job Title:
{job_context.get("title", "")}

Job Description:
{job_context.get("description", "")}

Requirements:
{job_context.get("requirements", "")}

Responsibilities:
{job_context.get("responsibilities", "")}
"""


def clean_json_response(content: str) -> str:
    content = (content or "").strip()

    if content.startswith("```json"):
        content = content.replace("```json", "", 1).strip()

    if content.startswith("```"):
        content = content.replace("```", "", 1).strip()

    if content.endswith("```"):
        content = content[:-3].strip()

    return content


def generate_first_question(
    target_role: str,
    company_name: str | None = None,
    job_context: dict | None = None,
) -> str:
    context = build_session_context(target_role, company_name, job_context)

    prompt = f"""
You are a senior recruiter conducting a realistic job interview.

Start a multi-round interview.

Ask ONLY ONE opening interview question.

The question should be relevant to the role and company.

Interview Context:
{context}

Return only the question.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        temperature=0.7,
        max_tokens=120,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()


def generate_follow_up_question(
    target_role: str,
    previous_question: str,
    candidate_answer: str,
    round_number: int,
    company_name: str | None = None,
    job_context: dict | None = None,
    previous_rounds: list[dict] | None = None,
) -> str:
    previous_rounds = previous_rounds or []
    context = build_session_context(target_role, company_name, job_context)

    prompt = f"""
You are a senior recruiter conducting a realistic adaptive interview.

Generate the next interview question.

This is round {round_number} of {MAX_ROUNDS}.

The next question must be based on:
1. The target role
2. The company/job context
3. The candidate's previous answer
4. Any gaps, strengths, or claims in the previous answer

Do not repeat previous questions.

Interview Context:
{context}

Previous Question:
{previous_question}

Candidate Answer:
{candidate_answer}

Previous Rounds:
{json.dumps(previous_rounds, ensure_ascii=False)}

Return only ONE next interview question.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        temperature=0.75,
        max_tokens=150,
        messages=[{"role": "user", "content": prompt}],
    )

    return response.choices[0].message.content.strip()


def generate_final_assessment(
    target_role: str,
    company_name: str | None = None,
    job_context: dict | None = None,
    rounds: list[dict] | None = None,
) -> dict:
    rounds = rounds or []
    context = build_session_context(target_role, company_name, job_context)

    prompt = f"""
You are a senior recruiter and interview assessor.

Assess this multi-round interview.

Interview Context:
{context}

Interview Rounds:
{json.dumps(rounds, ensure_ascii=False)}

Return ONLY valid JSON.

Do not use markdown.
Do not use code fences.
Do not explain.
Do not wrap the JSON in ```json.

Required JSON format:

{{
  "overall_score": 0,
  "communication_score": 0,
  "technical_score": 0,
  "confidence_score": 0,
  "problem_solving_score": 0,
  "role_fit_score": 0,
  "recommendation": "",
  "strengths": "",
  "improvements": "",
  "final_feedback": ""
}}
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        temperature=0.2,
        max_tokens=700,
        messages=[{"role": "user", "content": prompt}],
    )

    content = response.choices[0].message.content.strip()
    cleaned_content = clean_json_response(content)

    try:
        return json.loads(cleaned_content)
    except Exception:
        return {
            "overall_score": 0,
            "communication_score": 0,
            "technical_score": 0,
            "confidence_score": 0,
            "problem_solving_score": 0,
            "role_fit_score": 0,
            "recommendation": "Assessment could not be parsed.",
            "strengths": "",
            "improvements": "",
            "final_feedback": cleaned_content,
        }