import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Job } from "@/types/jobs";
import { Archive, EyeOff, Star } from "lucide-react";

export const dynamic = "force-dynamic";

async function getJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .order("fetched_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export default async function AdminJobsPage() {
  const jobs = await getJobs();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Admin Jobs
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Manage Job Listings
          </h1>

          <p className="mt-3 text-slate-600">
            Showing latest {jobs.length} jobs in the system.
          </p>
        </div>

        <Link
          href="/admin"
          className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          Back to Admin
        </Link>
      </div>

      <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-5 py-4">Job</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Country</th>
                <th className="px-5 py-4">Work Type</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Featured</th>
                <th className="px-5 py-4">Source</th>
                <th className="px-5 py-4">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id} className="hover:bg-slate-50">
                  <td className="max-w-xs px-5 py-4">
                    <Link
                      href={`/jobs/${job.slug}`}
                      className="font-semibold text-slate-900 hover:text-blue-700"
                    >
                      {job.title}
                    </Link>
                    <p className="mt-1 text-xs text-slate-500">
                      {job.industry || "No industry"}
                    </p>
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {job.company_name || "Not stated"}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {job.country || "Not stated"}
                  </td>

                  <td className="px-5 py-4 capitalize text-slate-700">
                    {job.work_type?.replace(/_/g, " ") || "Not stated"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
                      {job.status || "unknown"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {job.is_featured ? (
                      <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                        Yes
                      </span>
                    ) : (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">
                        No
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-4 text-slate-700">
                    {job.source_name || "External"}
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button className="rounded-xl border p-2 text-slate-600 hover:bg-slate-50">
                        <Star size={16} />
                      </button>

                      <button className="rounded-xl border p-2 text-slate-600 hover:bg-slate-50">
                        <EyeOff size={16} />
                      </button>

                      <button className="rounded-xl border p-2 text-slate-600 hover:bg-slate-50">
                        <Archive size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {jobs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-5 py-8 text-center text-slate-500">
                    No jobs found.
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