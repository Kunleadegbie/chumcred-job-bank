export async function POST() {
  const response = await fetch(
    `${process.env.NEXT_PUBLIC_BACKEND_API_URL}/tasks/generate-job-matches`,
    {
      method: "POST",
      headers: {
        "x-cron-secret":
          process.env.NEXT_PUBLIC_CRON_SECRET || "",
      },
    }
  );

  const data = await response.json();

  return Response.json(data);
}