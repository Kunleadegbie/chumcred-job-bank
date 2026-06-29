import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "";

const ALLOWED_ACTIONS: Record<string, string> = {
  job_intelligence: "/employer-ai/job-intelligence",
  analyze_candidate: "/employer-ai/analyze-candidate",
  rank_candidates: "/employer-ai/rank-candidates",
  interview_pack: "/employer-ai/interview-pack",
  improve_job_description: "/employer-ai/improve-job-description",
};

export async function POST(req: NextRequest) {
  try {
    if (!BACKEND_URL) {
      return NextResponse.json(
        {
          error:
            "Backend URL is not configured. Add NEXT_PUBLIC_BACKEND_URL in Vercel.",
        },
        { status: 500 }
      );
    }

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

    const text = await backendResponse.text();

    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text };
    }

    if (!backendResponse.ok) {
      return NextResponse.json(
        {
          error:
            data?.detail ||
            data?.error ||
            `EmployerAI backend failed with status ${backendResponse.status}.`,
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data?.result ? data.result : data);
  } catch (error: any) {
    console.error("EmployerAI API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "EmployerAI request failed. Check backend deployment and NEXT_PUBLIC_BACKEND_URL.",
      },
      { status: 500 }
    );
  }
}