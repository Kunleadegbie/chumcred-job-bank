export async function POST(request: Request) {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
  const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;

  if (!backendUrl) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_BACKEND_API_URL." },
      { status: 500 }
    );
  }

  if (!cronSecret) {
    return Response.json(
      { error: "Missing NEXT_PUBLIC_CRON_SECRET." },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();

    const response = await fetch(`${backendUrl}/tasks/cv-review`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-cron-secret": cronSecret,
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json(
      {
        error: "Unable to reach AI CV Review backend.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}