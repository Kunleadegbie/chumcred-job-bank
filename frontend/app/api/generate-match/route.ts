export async function POST() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;

  if (!backendUrl) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_BACKEND_API_URL in Vercel environment variables." },
      { status: 500 }
    );
  }

  if (!cronSecret) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_CRON_SECRET in Vercel environment variables." },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(`${backendUrl}/tasks/generate-job-matches`, {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
      },
    });

    const text = await response.text();

    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: text || "Backend returned a non-JSON response." };
    }

    if (!response.ok) {
      return Response.json(data, { status: response.status });
    }

    return Response.json(data);
  } catch (error) {
    return Response.json(
      {
        error: "Unable to reach backend.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}