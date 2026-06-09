import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

async function getSources() {
  const { data, error } = await supabaseServer
    .from("job_sources")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export default async function AdminSourcesPage() {
  const sources = await getSources();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Admin Sources
          </p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Job Sources
          </h1>
          <p className="mt-3 text-slate-600">
            Monitor job APIs and source configuration.
          </p>
        </div>

        <div className="flex justify-end">
        <Link
          href="/admin"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold hover:bg-slate-50"
        >
        Back to Admin
        </Link>

        </div>
      </div>

      <div className="rounded-3xl border bg-white p-6 shadow-sm">
        {sources.length === 0 ? (
          <p className="text-slate-600">
            No sources found yet. This is okay for now because jobs are fetched directly through the backend fetcher.
          </p>
        ) : (
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Country Focus</th>
                <th className="px-4 py-3">Active</th>
                <th className="px-4 py-3">Last Fetched</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {sources.map((source: any) => (
                <tr key={source.id}>
                  <td className="px-4 py-3 font-semibold">{source.source_name}</td>
                  <td className="px-4 py-3">{source.source_type}</td>
                  <td className="px-4 py-3">{source.country_focus || "Global"}</td>
                  <td className="px-4 py-3">{source.is_active ? "Yes" : "No"}</td>
                  <td className="px-4 py-3">{source.last_fetched_at || "Not yet"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </main>
  );
}