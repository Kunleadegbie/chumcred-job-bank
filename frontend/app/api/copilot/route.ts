import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  process.env.BACKEND_URL ||
  "";

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

    if (!body?.question || !String(body.question).trim()) {
      return NextResponse.json(
        {
          error: "Question is required.",
        },
        { status: 400 }
      );
    }

    const endpoint = `${BACKEND_URL}/copilot/chat`;

    const backendResponse = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        question: body.question,
        user_role: body.user_role || "general",
        context: body.context || {},
      }),
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
            `Copilot backend failed with status ${backendResponse.status}.`,
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("TalentIQ Copilot API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "TalentIQ Copilot request failed. Check backend deployment and NEXT_PUBLIC_BACKEND_URL.",
      },
      { status: 500 }
    );
  }
}