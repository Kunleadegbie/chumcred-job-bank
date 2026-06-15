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
    const formData = await request.formData();

    const response = await fetch(`${backendUrl}/tasks/interview-iq/transcribe`, {
      method: "POST",
      headers: {
        "x-cron-secret": cronSecret,
      },
      body: formData,
    });

    const data = await response.json();

    return Response.json(data, { status: response.status });
  } catch (error) {
    return Response.json(
      {
        error: "Unable to reach InterviewIQ transcription backend.",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}