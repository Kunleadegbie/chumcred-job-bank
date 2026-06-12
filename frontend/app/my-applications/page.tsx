"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Briefcase, ExternalLink } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ApplicationRow = {
  id: string;
  status: string | null;
  applied_at: string | null;
  jobs: {
    title: string;
    company_name: string | null;
    slug: string;
    location_display: string | null;
    original_job_url: string | null;
  } | null;
};

export default function MyApplicationsPage() {
  const [loading, setLoading] = useState(true);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadApplications() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("applications")
        .select(
          `
          id,
          status,
          applied_at,
          jobs (
            title,
            company_name,
            slug,
            location_display,
            original_job_url
          )
        `
        )
        .eq("user_id", user.id)
        .order("applied_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setApplications((data || []) as unknown as ApplicationRow[]);
      setLoading(false);
    }

    loadApplications();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading applications...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Candidate Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          My Applications
        </h1>

        <p className="mt-3 text-slate-600">
          Jobs you have applied to through Chumcred Job Bank.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {applications.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <Briefcase className="text-blue-700" size={32} />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No applications yet
          </h2>

          <p className="mt-2 text-slate-600">
            When you click “Apply on Original Website” while logged in, the job
            will appear here.
          </p>

          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-5 py-4">Job</th>
                <th className="px-5 py-4">Company</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Applied At</th>
                <th className="px-5 py-4">Action</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {applications.map((application) => (
                <tr key={application.id} className="hover:bg-slate-50">
                  <td className="px-5 py-4">
                    {application.jobs?.slug ? (
                      <Link
                        href={`/jobs/${application.jobs.slug}`}
                        className="font-semibold text-blue-700"
                      >
                        {application.jobs.title}
                      </Link>
                    ) : (
                      "Unknown job"
                    )}
                  </td>

                  <td className="px-5 py-4">
                    {application.jobs?.company_name || "Not stated"}
                  </td>

                  <td className="px-5 py-4">
                    {application.jobs?.location_display || "Not stated"}
                  </td>

                  <td className="px-5 py-4">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
                      {application.status || "applied"}
                    </span>
                  </td>

                  <td className="px-5 py-4">
                    {application.applied_at
                      ? new Date(application.applied_at).toLocaleString()
                      : "Not available"}
                  </td>

                  <td className="px-5 py-4">
                    {application.jobs?.original_job_url && (
                      <a
                        href={application.jobs.original_job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700"
                      >
                        Open
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}