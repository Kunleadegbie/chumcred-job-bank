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

    if (!body?.user_id) {
      return NextResponse.json(
        { error: "user_id is required." },
        { status: 401 }
      );
    }

    const backendResponse = await fetch(`${BACKEND_URL}/operations-ai/dashboard`, {
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
            `OperationsAI backend failed with status ${backendResponse.status}.`,
        },
        { status: backendResponse.status }
      );
    }

    return NextResponse.json(data?.result ? data.result : data);
  } catch (error: any) {
    console.error("OperationsAI API error:", error);

    return NextResponse.json(
      {
        error:
          error?.message ||
          "OperationsAI request failed. Check backend deployment and NEXT_PUBLIC_BACKEND_URL.",
      },
      { status: 500 }
    );
  }
}