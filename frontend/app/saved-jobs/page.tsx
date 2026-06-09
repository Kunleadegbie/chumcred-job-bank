"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import JobCard from "@/components/JobCard";
import type { Job } from "@/types/jobs";

type SavedJobRow = {
  id: string;
  saved_at: string;
  jobs: Job | null;
};

export default function SavedJobsPage() {
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadSavedJobs() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabase
        .from("saved_jobs")
        .select(
          `
          id,
          saved_at,
          jobs (*)
        `
        )
        .eq("user_id", user.id)
        .order("saved_at", { ascending: false });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      const savedRows = (data || []) as unknown as SavedJobRow[];

      const savedJobs = savedRows
        .map((row) => row.jobs)
        .filter((job): job is Job => Boolean(job));

      setJobs(savedJobs);

      setLoading(false);
    }

    loadSavedJobs();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading saved jobs...</p>
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
          Saved Jobs
        </h1>

        <p className="mt-3 text-slate-600">
          Review jobs you saved for later application.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {jobs.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            No saved jobs yet
          </h2>

          <p className="mt-2 text-slate-600">
            Start browsing jobs and click “Save Job” to keep opportunities here.
          </p>

          <Link
            href="/jobs"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse Jobs
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}