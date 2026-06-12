def generate_career_advice(question: str, profile: dict | None = None) -> str:
    profile = profile or {}

    full_name = profile.get("full_name") or "Candidate"
    skills = profile.get("skills") or "not provided"
    current_role = profile.get("current_role") or "not provided"
    career_objective = profile.get("career_objective") or "not provided"

    return f"""
Hello {full_name},

Based on your question: "{question}"

Here is a practical career guidance response:

Your current role: {current_role}
Your listed skills: {skills}
Your career objective: {career_objective}

Recommended actions:
1. Strengthen the skills most relevant to your target role.
2. Update your CV with measurable achievements.
3. Apply to jobs that match at least 60–70% of your profile.
4. Use your Chumcred AI Job Match results to identify gaps.
5. Keep improving your profile and resume regularly.

This is an initial AI career guidance response. A more advanced AI coach can be added later.
""".strip()