import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "";

const ALLOWED_ACTIONS: Record<string, string> = {
  dashboard: "/institution-ai/dashboard",
  employability: "/institution-ai/employability",
  skills_gap: "/institution-ai/skills-gap",
  curriculum: "/institution-ai/curriculum",
  recommendations: "/institution-ai/recommendations",
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
          error: "Invalid InstitutionAI action.",
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
            `InstitutionAI backend failed with status ${backendResponse.status}.`,
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("InstitutionAI API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "InstitutionAI request failed. Check backend deployment and NEXT_PUBLIC_BACKEND_URL.",
      },
      { status: 500 }
    );
  }
}