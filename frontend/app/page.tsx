import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import JobCard from "@/components/JobCard";
import type { Job } from "@/types/jobs";
import HomeSearch from "@/components/HomeSearch";

export const dynamic = "force-dynamic";

async function getLatestJobs(): Promise<Job[]> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .order("fetched_at", { ascending: false })
    .limit(6);

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

export default async function HomePage() {
  const jobs = await getLatestJobs();

  return (
    <main>
      <section className="bg-slate-950 px-6 py-24 text-white">
        <div className="mx-auto max-w-7xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-blue-300">
            Chumcred Global Job Bank
          </p>

          <h1 className="max-w-4xl text-4xl font-bold tracking-tight md:text-6xl">
            Find local and international jobs faster.
          </h1>

          <p className="mt-6 max-w-2xl text-lg text-slate-300">
            Search Nigerian, remote, hybrid, onsite and work-from-anywhere opportunities from trusted job sources.
          </p>

          <HomeSearch />

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/jobs"
              className="rounded-xl bg-blue-600 px-6 py-3 text-center font-semibold text-white hover:bg-blue-700"
            >
              Browse Jobs
            </Link>

            <Link
              href="/jobs?work_type=remote"
              className="rounded-xl bg-white px-6 py-3 text-center font-semibold text-slate-900 hover:bg-slate-100"
            >
              View Remote Jobs
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-14">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Latest Jobs</h2>
            <p className="mt-2 text-slate-600">
              Recently fetched jobs from the Chumcred Job Bank.
            </p>
          </div>

          <Link href="/jobs" className="text-sm font-semibold text-blue-700">
            View all jobs →
          </Link>
        </div>

        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      </section>
    </main>
  );
}