import random


QUESTION_BANK = {
    "general": [
        "Tell me about yourself and your professional background.",
        "Why are you interested in this role?",
        "What are your strongest skills for this position?",
        "Describe a challenge you faced and how you handled it.",
        "Where do you see yourself in the next few years?"
    ],
    "business analyst": [
        "How do you gather and document business requirements?",
        "Describe a time you used data to solve a business problem.",
        "How do you manage conflicting stakeholder expectations?",
        "What tools do you use for reporting and analysis?",
        "How would you improve a poorly performing business process?"
    ],
    "data analyst": [
        "How do you clean and validate data before analysis?",
        "Explain a dashboard or report you have built.",
        "How do you communicate insights to non-technical stakeholders?",
        "What is your experience with Excel, SQL, Power BI or Python?",
        "Describe a time your analysis influenced a business decision."
    ],
    "product manager": [
        "How do you prioritize product features?",
        "How do you gather customer feedback?",
        "Describe how you would launch a new product.",
        "How do you work with engineering, design and business teams?",
        "What metrics would you track for product success?"
    ],
    "sales": [
        "How do you identify and approach new customers?",
        "Describe how you handle rejection in sales.",
        "How do you manage customer relationships?",
        "Tell me about a time you exceeded a sales target.",
        "How do you convert prospects into paying customers?"
    ],
}


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


def generate_interview_question(target_role: str, profile: dict | None = None) -> str:
    role_key = normalize_role(target_role)
    questions = QUESTION_BANK.get(role_key, QUESTION_BANK["general"])
    return random.choice(questions)


def review_interview_answer(question: str, answer: str, target_role: str, profile: dict | None = None) -> dict:
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

    sample_answer = (
        f"A stronger answer should directly answer the question, give a specific example, "
        f"explain the action you took, and end with a measurable result relevant to {target_role}."
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
        )
    }