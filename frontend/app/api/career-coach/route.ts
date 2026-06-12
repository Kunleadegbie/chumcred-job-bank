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

  const body = await request.json();

  const response = await fetch(`${backendUrl}/tasks/career-coach`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-cron-secret": cronSecret,
    },
    body: JSON.stringify(body),
  });

  const data = await response.json();

  return Response.json(data, { status: response.status });
}