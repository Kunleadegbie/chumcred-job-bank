import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "http://127.0.0.1:8000";

const ALLOWED_ACTIONS: Record<string, string> = {
  job_intelligence: "/employer-ai/job-intelligence",
  analyze_candidate: "/employer-ai/analyze-candidate",
  rank_candidates: "/employer-ai/rank-candidates",
  interview_pack: "/employer-ai/interview-pack",
  improve_job_description: "/employer-ai/improve-job-description",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const action = body?.action;

    if (!action || !ALLOWED_ACTIONS[action]) {
      return NextResponse.json(
        {
          error: "Invalid EmployerAI action.",
          allowed_actions: Object.keys(ALLOWED_ACTIONS),
        },
        { status: 400 }
      );
    }

    const endpoint = `${BACKEND_URL}${ALLOWED_ACTIONS[action]}`;

    const backendResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    });

    const data = await backendResponse.json();

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error: data?.detail || data?.error || "EmployerAI backend request failed.",
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("EmployerAI API error:", error);

    return NextResponse.json(
      {
        error: "EmployerAI request failed. Please try again.",
      },
      { status: 500 }
    );
  }
}