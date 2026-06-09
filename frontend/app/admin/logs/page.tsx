import Link from "next/link";
import { supabaseServer } from "@/lib/supabaseServer";

export const dynamic = "force-dynamic";

type FetchLog = {
  id: string;
  source_name: string | null;
  fetch_started_at: string | null;
  fetch_completed_at: string | null;
  jobs_found: number | null;
  jobs_inserted: number | null;
  jobs_updated: number | null;
  duplicates_skipped: number | null;
  errors_count: number | null;
  status: string | null;
  error_message: string | null;
};

async function getFetchLogs(): Promise<FetchLog[]> {
  const { data, error } = await supabaseServer
    .from("job_fetch_logs")
    .select("*")
    .order("fetch_started_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

function formatDate(value: string | null) {
  if (!value) return "Not available";

  return new Date(value).toLocaleString("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function statusClass(status: string | null) {
  if (status === "success") {
    return "bg-emerald-50 text-emerald-700";
  }

  if (status === "partial_success") {
    return "bg-amber-50 text-amber-700";
  }

  if (status === "failed") {
    return "bg-red-50 text-red-700";
  }

  return "bg-slate-100 text-slate-700";
}

export default async function AdminLogsPage() {
  const logs = await getFetchLogs();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Admin Logs
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Job Fetch Logs
          </h1>

          <p className="mt-3 text-slate-600">
            Track each automated job fetch run, inserted jobs, duplicates,
            errors and completion status.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          ← Back to Admin
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Started</th>
                <th className="px-5 py-4">Completed</th>
                <th className="px-5 py-4">Found</th>
                <th className="px-5 py-4">Inserted</th>
                <th className="px-5 py-4">Duplicates</th>
                <th className="px-5 py-4">Errors</th>
                <th className="px-5 py-4">Status</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4 font-semibold text-slate-900">
                    {log.source_name || "Automated Fetcher"}
                    {(log.errors_count || 0) > 0 && (
                      <p className="mt-1 text-xs text-amber-600">
                        {log.errors_count || 0} issue(s) recorded during processing
                      </p>
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {formatDate(log.fetch_started_at)}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {formatDate(log.fetch_completed_at)}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {log.jobs_found || 0}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {log.jobs_inserted || 0}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {log.duplicates_skipped || 0}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {log.errors_count || 0}
                  </td>

                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClass(
                        log.status
                      )}`}
                    >
                      {log.status?.replace(/_/g, " ") || "unknown"}
                    </span>
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-5 py-8 text-center text-slate-500"
                  >
                    No fetch logs recorded yet. Logs will appear here after the
                    backend job fetch task runs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}