def review_cv(resume_text: str) -> dict:
    text = (resume_text or "").lower()

    score = 50
    strengths = []
    weaknesses = []
    recommendations = []

    if len(text) > 1500:
        score += 10
        strengths.append("The CV contains enough detail for meaningful review.")
    else:
        weaknesses.append("The CV appears too short or lacks detailed content.")
        recommendations.append("Add more detail about work experience, projects, achievements and responsibilities.")

    if any(word in text for word in ["managed", "led", "coordinated", "supervised", "developed"]):
        score += 10
        strengths.append("The CV shows leadership or responsibility-based experience.")
    else:
        weaknesses.append("The CV does not clearly show leadership or ownership.")
        recommendations.append("Add action verbs such as led, managed, coordinated, developed, improved or delivered.")

    if any(char.isdigit() for char in text):
        score += 10
        strengths.append("The CV includes some measurable information.")
    else:
        weaknesses.append("The CV does not include measurable achievements.")
        recommendations.append("Add numbers, percentages, revenue impact, cost savings, team size, project value or performance results.")

    if any(word in text for word in ["excel", "power bi", "sql", "python", "tableau", "analytics", "dashboard"]):
        score += 10
        strengths.append("The CV includes relevant technical or analytical skills.")
    else:
        weaknesses.append("The CV does not clearly show technical or analytical tools.")
        recommendations.append("Add tools such as Excel, Power BI, SQL, Python, Tableau or other role-relevant systems.")

    if any(word in text for word in ["achievement", "improved", "increased", "reduced", "delivered", "optimized"]):
        score += 10
        strengths.append("The CV includes achievement-oriented language.")
    else:
        weaknesses.append("The CV may be too responsibility-focused instead of achievement-focused.")
        recommendations.append("Rewrite some bullet points to show results, impact and outcomes.")

    score = min(score, 100)

    return {
        "score": score,
        "strengths": "\n".join(f"• {item}" for item in strengths) or "• Some relevant experience is present.",
        "weaknesses": "\n".join(f"• {item}" for item in weaknesses) or "• No major weaknesses detected from available text.",
        "recommendations": "\n".join(f"• {item}" for item in recommendations) or "• Continue improving the CV with measurable achievements."
    }