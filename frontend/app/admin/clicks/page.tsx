import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

async function getClicks() {
  const { data, error } = await supabase
    .from("job_application_clicks")
    .select(`
      id,
      clicked_at,
      ip_address,
      user_agent,
      jobs (
        title,
        company_name,
        slug
      )
    `)
    .order("clicked_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export default async function AdminClicksPage() {
  const clicks = await getClicks();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Admin Analytics
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Apply Click Analytics
          </h1>
          <p className="mt-3 text-slate-600">
            See which jobs applicants are clicking.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold hover:bg-slate-50"
        >
        Back to Admin
        </Link>
     
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-100 text-xs uppercase text-slate-600">
            <tr>
              <th className="px-5 py-4">Job</th>
              <th className="px-5 py-4">Company</th>
              <th className="px-5 py-4">Clicked At</th>
              <th className="px-5 py-4">IP</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {clicks.map((click: any) => (
              <tr key={click.id}>
                <td className="px-5 py-4">
                  {click.jobs?.slug ? (
                    <Link href={`/jobs/${click.jobs.slug}`} className="font-semibold text-blue-700">
                      {click.jobs.title}
                    </Link>
                  ) : (
                    "Unknown job"
                  )}
                </td>
                <td className="px-5 py-4">
                  {click.jobs?.company_name || "Not stated"}
                </td>
                <td className="px-5 py-4">
                  {click.clicked_at || "Not available"}
                </td>
                <td className="px-5 py-4">
                  {click.ip_address || "Unknown"}
                </td>
              </tr>
            ))}

            {clicks.length === 0 && (
              <tr>
                <td colSpan={4} className="px-5 py-8 text-center text-slate-500">
                  No apply clicks recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}