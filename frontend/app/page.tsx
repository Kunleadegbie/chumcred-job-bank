import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import JobCard from "@/components/JobCard";
import type { Job } from "@/types/jobs";
import HomeSearch from "@/components/HomeSearch";

export const dynamic = "force-dynamic";

async function getFeaturedJobs(): Promise<Job[]> {
  const { data: normalJobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .eq("is_featured", true)
    .order("posted_at", { ascending: false })
    .limit(6);

  const { data: employerJobsData } = await supabase
    .from("employer_jobs")
    .select(
      `
      *,
      employers (
        company_name
      )
    `
    )
    .eq("status", "published")
    .eq("is_featured", true)
    .order("posted_at", { ascending: false })
    .limit(6);

  const employerJobs = (employerJobsData || []).map((job: any) => ({
    id: job.id,
    title: job.title,
    slug: job.slug,
    company_name: job.employers?.company_name || "Employer",
    location_display:
      job.location_display || job.city || job.country || "Location not stated",
    country: job.country || "",
    city: job.city || "",
    description: job.description || "",
    work_type: job.work_type || "",
    employment_type: job.employment_type || "",
    experience_level: job.experience_level || "",
    salary_display: job.salary_display || "",
    original_job_url: job.original_job_url || "",
    source: "Employer",
    is_featured: true,
    visa_sponsorship: false,
    posted_at: job.posted_at || job.created_at,
    created_at: job.created_at,
  }));

  return [...employerJobs, ...(normalJobs || [])]
    .sort((a: any, b: any) => {
      return (
        new Date(b.posted_at || b.created_at || 0).getTime() -
        new Date(a.posted_at || a.created_at || 0).getTime()
      );
    })
    .slice(0, 6) as Job[];
}

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
  const featuredJobs = await getFeaturedJobs();
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
            Search Nigerian, remote, hybrid, onsite and work-from-anywhere
            opportunities from trusted job sources.
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

      {featuredJobs.length > 0 && (
        <section className="mx-auto max-w-7xl px-6 py-14">
          <div className="mb-8 flex items-end justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                Featured Opportunities
              </p>

              <h2 className="mt-2 text-2xl font-bold text-slate-900">
                Featured Jobs
              </h2>

              <p className="mt-2 text-slate-600">
                Premium jobs highlighted by employers and Chumcred Job Bank.
              </p>
            </div>

            <Link
              href="/jobs"
              className="text-sm font-semibold text-blue-700"
            >
              View all jobs →
            </Link>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {featuredJobs.map((job) => (
              <JobCard key={`featured-${job.id}`} job={job} />
            ))}
          </div>
        </section>
      )}

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