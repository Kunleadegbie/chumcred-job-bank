import os
import json
from openai import OpenAI

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def analyze_interview(
    question: str,
    transcript: str,
    target_role: str,
):
    prompt = f"""
You are a senior interview coach.

Role:
{target_role}

Interview Question:
{question}

Candidate Answer:
{transcript}

Return ONLY valid JSON:

{{
  "communication_score": 0,
  "confidence_score": 0,
  "technical_score": 0,
  "structure_score": 0,
  "professionalism_score": 0,
  "overall_score": 0,
  "strengths": "",
  "improvements": "",
  "suggested_answer": ""
}}
"""

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        temperature=0.3,
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
    )

    content = response.choices[0].message.content

    return json.loads(content)