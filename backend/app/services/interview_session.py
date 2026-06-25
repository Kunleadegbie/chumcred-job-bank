import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

MAX_ROUNDS = 5


def build_session_context(
    target_role: str,
    company_name: str | None = None,
    job_context: dict | None = None,
    match_context: dict | None = None,
) -> str:
    job_context = job_context or {}
    match_context = match_context or {}

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

AI Match Score:
{match_context.get("match_score", "")}

Matched Keywords:
{json.dumps(match_context.get("matched_keywords", []), ensure_ascii=False)}

Missing Keywords:
{json.dumps(match_context.get("missing_keywords", []), ensure_ascii=False)}

Strengths:
{json.dumps(match_context.get("strengths", []), ensure_ascii=False)}

Gaps:
{json.dumps(match_context.get("gaps", []), ensure_ascii=False)}

Improvement Actions:
{json.dumps(match_context.get("improvement_actions", []), ensure_ascii=False)}
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
    match_context: dict | None = None,
) -> str:
    context = build_session_context(
        target_role=target_role,
        company_name=company_name,
        job_context=job_context,
        match_context=match_context,
    )

    prompt = f"""
You are a world-class recruiter conducting a realistic job interview.

Generate the FIRST interview question.

Use:
1. Job title
2. Company
3. Job description
4. Requirements
5. Responsibilities
6. Missing skills
7. Candidate gaps
8. AI match score signals, if available

Priority:
- If major gaps exist, test those gaps.
- If match score is high, test practical experience.
- Make the question realistic and role-specific.
- Avoid generic questions like "Tell me about yourself."
- Ask only one question.

Interview Context:
{context}

Return ONLY ONE interview question.
"""

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.7,
            max_tokens=160,
            messages=[{"role": "user", "content": prompt}],
        )

        question = response.choices[0].message.content.strip()

        if not question:
            return f"What relevant experience do you have for the {target_role} role?"

        return question

    except Exception:
        return f"What relevant experience do you have for the {target_role} role?"

def generate_follow_up_question(
    target_role: str,
    previous_question: str,
    candidate_answer: str,
    round_number: int,
    company_name: str | None = None,
    job_context: dict | None = None,
    match_context: dict | None = None,
    previous_rounds: list[dict] | None = None,
) -> str:
    """
    Generates the next adaptive interview question.

    The next question is based on:
    - Job description
    - Candidate's previous answer
    - Previous interview rounds
    - Missing skills
    - AI Match Score gaps
    """

    previous_rounds = previous_rounds or []

    context = build_session_context(
        target_role=target_role,
        company_name=company_name,
        job_context=job_context,
        match_context=match_context,
    )

    prompt = f"""
You are an experienced Executive Recruiter conducting a structured interview.

This is interview round {round_number} of {MAX_ROUNDS}.

Your job is NOT to ask random interview questions.

Instead:

1. Carefully analyse the candidate's previous answer.
2. Identify strengths.
3. Identify weaknesses.
4. Probe deeper into missing skills.
5. Verify claims made by the candidate.
6. Ask behavioural questions where appropriate.
7. Ask technical questions where appropriate.
8. Ask scenario-based questions whenever possible.
9. Do NOT repeat previous questions.
10. Ask ONLY ONE question.

Interview Context
-----------------
{context}

Previous Question
-----------------
{previous_question}

Candidate Answer
-----------------
{candidate_answer}

Previous Interview History
--------------------------
{json.dumps(previous_rounds, ensure_ascii=False, indent=2)}

Examples of good follow-up behaviour:

• Candidate claims leadership experience
→ Ask for measurable achievements.

• Candidate lacks SQL
→ Ask how they would solve a reporting problem without SQL.

• Candidate lacks stakeholder management
→ Ask about handling conflicting stakeholders.

• Candidate claims project management
→ Ask about deadlines, risks and lessons learned.

Return ONLY ONE interview question.
"""

    try:

        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.75,
            max_tokens=180,
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
        )

        question = response.choices[0].message.content.strip()

        if not question:

            return (
                f"What has been your biggest challenge working as a "
                f"{target_role}, and how did you overcome it?"
            )

        return question

    except Exception:

        return (
            f"What has been your biggest challenge working as a "
            f"{target_role}, and how did you overcome it?"
        )

def generate_final_assessment(
    target_role: str,
    company_name: str | None = None,
    job_context: dict | None = None,
    match_context: dict | None = None,
    rounds: list[dict] | None = None,
) -> dict:
    rounds = rounds or []

    context = build_session_context(
        target_role=target_role,
        company_name=company_name,
        job_context=job_context,
        match_context=match_context,
    )

    prompt = f"""
You are an executive recruiter and interview assessor.

Assess this completed multi-round interview.

Evaluate the candidate against:
1. Communication
2. Technical competence
3. Confidence
4. Problem solving
5. Role fit
6. Job requirements
7. Responsibilities
8. Missing keywords
9. AI match gaps

Be realistic, evidence-based, and fair.

Interview Context:
{context}

Interview Rounds:
{json.dumps(rounds, ensure_ascii=False, indent=2)}

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

    try:
        response = client.chat.completions.create(
            model="gpt-4.1-mini",
            temperature=0.2,
            max_tokens=900,
            messages=[{"role": "user", "content": prompt}],
        )

        content = response.choices[0].message.content.strip()
        cleaned_content = clean_json_response(content)

        return json.loads(cleaned_content)

    except Exception as error:
        return {
            "overall_score": 0,
            "communication_score": 0,
            "technical_score": 0,
            "confidence_score": 0,
            "problem_solving_score": 0,
            "role_fit_score": 0,
            "recommendation": "Assessment could not be completed.",
            "strengths": "",
            "improvements": "",
            "final_feedback": str(error),
        }