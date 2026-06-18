import random

QUESTION_BANK = {
    "general": [
        "Tell me about yourself and your professional background.",
        "Why are you interested in this role?",
        "What are your strongest skills for this position?",
        "Describe a challenge you faced and how you handled it.",
        "Where do you see yourself in the next few years?",
    ],
    "business analyst": [
        "How do you gather and document business requirements?",
        "Describe a time you used data to solve a business problem.",
        "How do you manage conflicting stakeholder expectations?",
        "What tools do you use for reporting and analysis?",
        "How would you improve a poorly performing business process?",
    ],
    "data analyst": [
        "How do you clean and validate data before analysis?",
        "Explain a dashboard or report you have built.",
        "How do you communicate insights to non-technical stakeholders?",
        "What is your experience with Excel, SQL, Power BI or Python?",
        "Describe a time your analysis influenced a business decision.",
    ],
    "product manager": [
        "How do you prioritize product features?",
        "How do you gather customer feedback?",
        "Describe how you would launch a new product.",
        "How do you work with engineering, design and business teams?",
        "What metrics would you track for product success?",
    ],
    "sales": [
        "How do you identify and approach new customers?",
        "Describe how you handle rejection in sales.",
        "How do you manage customer relationships?",
        "Tell me about a time you exceeded a sales target.",
        "How do you convert prospects into paying customers?",
    ],
}


from openai import OpenAI
import os
import random

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# ADD THE NEW FUNCTION HERE
def generate_ai_job_question(target_role: str, job_context: dict):
    prompt = f"""
You are a senior recruiter.

Generate ONE realistic interview question.

Role:
{target_role}

Company:
{job_context.get("company_name","")}

Job Title:
{job_context.get("title","")}

Job Description:
{job_context.get("description","")}

Requirements:
{job_context.get("requirements","")}

Responsibilities:
{job_context.get("responsibilities","")}

Return only the interview question.
"""

    response = client.chat.completions.create(
        model="gpt-4.1-mini",
        messages=[
            {
                "role": "user",
                "content": prompt,
            }
        ],
        temperature=0.8,
        max_tokens=120,
    )

    return response.choices[0].message.content.strip()    

def normalize_role(role: str) -> str:
    role = (role or "").lower()

    if "business analyst" in role:
        return "business analyst"
    if "data analyst" in role:
        return "data analyst"
    if "product" in role:
        return "product manager"
    if "sales" in role or "marketing" in role:
        return "sales"

    return "general"


def generate_job_aware_question(target_role: str, job_context: dict | None = None) -> str:
    job_context = job_context or {}

    title = job_context.get("title") or target_role or "this role"
    company = job_context.get("company_name") or "the company"

    description = (job_context.get("description") or "").lower()
    requirements = (job_context.get("requirements") or "").lower()
    responsibilities = (job_context.get("responsibilities") or "").lower()

    combined = f"{description} {requirements} {responsibilities}"

    company_lower = company.lower()

    job_specific_questions = []

    # =====================================================
    # COMPANY-SPECIFIC QUESTIONS
    # =====================================================

    # Banking & Financial Services
    if any(x in company_lower for x in [
        "access", "gtbank", "guaranty", "zenith",
        "uba", "first bank", "fidelity", "stanbic",
        "ecobank", "wema", "sterling"
    ]):
        job_specific_questions.extend([
            f"{company} operates in a highly regulated banking environment. Describe how you would balance customer satisfaction, revenue growth and regulatory compliance.",
            f"Tell me about a time you identified a business risk or control weakness and how you addressed it.",
            f"How would you handle pressure from management to achieve targets while maintaining compliance standards?"
        ])

    # Consulting Firms
    if any(x in company_lower for x in [
        "pwc", "kpmg", "deloitte", "ey",
        "ernst", "accenture", "mckinsey",
        "bcg", "bain"
    ]):
        job_specific_questions.extend([
            f"Consulting firms such as {company} work with multiple clients and stakeholders. Describe a situation where you solved a complex business problem.",
            f"How would you approach a client engagement where requirements are unclear?",
            f"Describe how you present technical findings to senior executives."
        ])

    # Telecoms
    if any(x in company_lower for x in [
        "glo", "globacom", "mtn", "airtel", "9mobile"
    ]):
        job_specific_questions.extend([
            f"{company} serves millions of customers. Describe how you would use data to improve customer experience.",
            f"Tell me about a time you improved operational efficiency or sales performance.",
            f"How would you identify and reduce revenue leakage in a telecom environment?"
        ])

    # Technology Companies
    if any(x in company_lower for x in [
        "google", "microsoft", "amazon",
        "meta", "apple", "oracle",
        "salesforce", "openai"
    ]):
        job_specific_questions.extend([
            f"In a technology-driven company like {company}, innovation is critical. Tell me about a time you introduced a new idea that improved results.",
            f"Describe how you manage competing priorities when multiple stakeholders require urgent delivery.",
            f"How would you use data and experimentation to improve a product or process?"
        ])

    # Oil & Gas / Energy
    if any(x in company_lower for x in [
        "nnpc", "shell", "chevron",
        "total", "seplat", "mobil",
        "exxon", "energy"
    ]):
        job_specific_questions.extend([
            f"{company} operates in a high-risk environment. Describe how you would manage operational and compliance risks.",
            f"Tell me about a time you improved efficiency, reduced waste or optimized resources.",
            f"How would you handle conflicting priorities between safety, cost and operational targets?"
        ])

    # =====================================================
    # JOB-SPECIFIC QUESTIONS
    # =====================================================

    if any(word in combined for word in [
        "stakeholder", "requirements",
        "business requirement", "brd", "user story"
    ]):
        job_specific_questions.append(
            f"This {title} role at {company} requires stakeholder and requirements management. Describe how you would gather, validate and document requirements."
        )

    if any(word in combined for word in [
        "data", "dashboard", "report",
        "analytics", "power bi", "sql", "excel"
    ]):
        job_specific_questions.append(
            f"This role appears to involve analytics and reporting. Tell me about a time you used data to support a business decision."
        )

    if any(word in combined for word in [
        "customer", "client", "relationship",
        "sales", "revenue"
    ]):
        job_specific_questions.append(
            f"This role appears to involve customer engagement. How would you manage customer expectations while achieving business targets?"
        )

    if any(word in combined for word in [
        "project", "implementation",
        "delivery", "timeline", "deadline"
    ]):
        job_specific_questions.append(
            f"This position involves project delivery. Describe how you manage timelines, risks and stakeholders."
        )

    if any(word in combined for word in [
        "risk", "compliance",
        "audit", "control", "regulatory"
    ]):
        job_specific_questions.append(
            f"This role involves risk and compliance responsibilities. Describe how you would identify and address a control weakness."
        )

    if any(word in combined for word in [
        "team", "lead", "supervise",
        "manager", "management"
    ]):
        job_specific_questions.append(
            f"This role requires leadership. Tell me about a time you led a team and delivered measurable results."
        )

    # =====================================================
    # RETURN BEST QUESTION
    # =====================================================

    if job_specific_questions:
        return random.choice(job_specific_questions)

    role_key = normalize_role(target_role)

    return random.choice(
        QUESTION_BANK.get(
            role_key,
            QUESTION_BANK["general"]
        )
    )

def generate_interview_question(
    target_role: str,
    profile: dict | None = None,
    job_context: dict | None = None,
) -> str:
    if job_context:
        try:
            return generate_ai_job_question(
                target_role,
                job_context
            )
        except Exception as e:
            print(f"InterviewIQ AI fallback: {e}")

            return generate_job_aware_question(
                target_role,
                job_context
            )

    role_key = normalize_role(target_role)
    questions = QUESTION_BANK.get(role_key, QUESTION_BANK["general"])
    return random.choice(questions)


def review_interview_answer(
    question: str,
    answer: str,
    target_role: str,
    profile: dict | None = None,
    job_context: dict | None = None,
) -> dict:
    answer_text = (answer or "").strip()
    lower_answer = answer_text.lower()

    score = 50
    strengths = []
    improvements = []

    if len(answer_text) > 300:
        score += 15
        strengths.append("The answer provides useful detail and context.")
    else:
        improvements.append("Provide more detail using a clear situation, action and result structure.")

    if any(word in lower_answer for word in ["result", "improved", "increased", "reduced", "delivered", "achieved"]):
        score += 15
        strengths.append("The answer includes result-oriented language.")
    else:
        improvements.append("Add measurable results or outcomes to make the answer stronger.")

    if any(char.isdigit() for char in answer_text):
        score += 10
        strengths.append("The answer includes measurable evidence.")
    else:
        improvements.append("Add numbers, percentages, targets, timelines or performance impact where possible.")

    if any(word in lower_answer for word in ["team", "stakeholder", "customer", "client", "manager"]):
        score += 10
        strengths.append("The answer shows awareness of people, stakeholders or customers.")
    else:
        improvements.append("Mention how you worked with stakeholders, customers, team members or managers.")

    score = min(score, 100)

    if score >= 80:
        summary = "Strong interview answer."
    elif score >= 60:
        summary = "Good answer, but it can be improved with more evidence and structure."
    else:
        summary = "The answer needs more structure, examples and measurable impact."

    role_context = target_role
    if job_context and job_context.get("title"):
        role_context = f"{job_context.get('title')} role"

    sample_answer = (
        f"A stronger answer should directly answer the question, give a specific example, "
        f"explain the action you took, and end with a measurable result relevant to {role_context}."
    )

    return {
        "score": score,
        "feedback": (
            f"{summary}\n\n"
            f"Strengths:\n"
            f"{chr(10).join('• ' + item for item in strengths) if strengths else '• The answer makes an attempt to address the question.'}\n\n"
            f"Improvements:\n"
            f"{chr(10).join('• ' + item for item in improvements) if improvements else '• Continue adding clear examples and measurable achievements.'}\n\n"
            f"Suggested better approach:\n"
            f"{sample_answer}"
        ),
    }