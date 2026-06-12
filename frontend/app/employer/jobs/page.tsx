"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PlusCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EmployerJob = {
  id: string;
  title: string;
  country: string | null;
  city: string | null;
  work_type: string | null;
  status: string | null;
  posted_at: string | null;
};

export default function EmployerJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<EmployerJob[]>([]);

  useEffect(() => {
    async function loadJobs() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employer } = await supabaseBrowser
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!employer) {
        window.location.href = "/employer/profile";
        return;
      }

      const { data } = await supabaseBrowser
        .from("employer_jobs")
        .select("id,title,country,city,work_type,status,posted_at")
        .eq("employer_id", employer.id)
        .order("created_at", { ascending: false });

      setJobs((data || []) as EmployerJob[]);
      setLoading(false);
    }

    loadJobs();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p>Loading posted jobs...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Employer Portal
          </p>
          <h1 className="mt-3 text-4xl font-bold">Manage Jobs</h1>
          <p className="mt-3 text-slate-600">View jobs posted by your company.</p>
        </div>

        <Link
          href="/employer/post-job"
          className="inline-flex h-12 items-center gap-2 rounded-xl bg-blue-600 px-5 font-semibold text-white hover:bg-blue-700"
        >
          <PlusCircle size={18} />
          Post Job
        </Link>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold">No jobs posted yet</h2>
          <p className="mt-2 text-slate-600">Create your first job posting.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-100 text-xs uppercase text-slate-600">
              <tr>
                <th className="px-5 py-4">Job</th>
                <th className="px-5 py-4">Location</th>
                <th className="px-5 py-4">Work Type</th>
                <th className="px-5 py-4">Status</th>
                <th className="px-5 py-4">Posted</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {jobs.map((job) => (
                <tr key={job.id}>
                  <td className="px-5 py-4 font-semibold">{job.title}</td>
                  <td className="px-5 py-4">{job.city || job.country || "Not stated"}</td>
                  <td className="px-5 py-4 capitalize">{job.work_type || "Not stated"}</td>
                  <td className="px-5 py-4 capitalize">{job.status || "draft"}</td>
                  <td className="px-5 py-4">
                    {job.posted_at ? new Date(job.posted_at).toLocaleDateString() : "Not posted"}
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