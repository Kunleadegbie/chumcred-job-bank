import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import JobCard from "@/components/JobCard";
import JobFilters from "@/components/JobFilters";
import type { Job } from "@/types/jobs";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 20;

async function getJobs(searchParams: {
  q?: string;
  work_type?: string;
  country?: string;
  visa?: string;
  experience?: string;
  industry?: string;
  page?: string;
}): Promise<{ jobs: Job[]; total: number; page: number; totalPages: number }> {
  const currentPage = Math.max(Number(searchParams.page || "1"), 1);
  const from = (currentPage - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("jobs")
    .select("*", { count: "exact" })
    .eq("status", "active")
    .order("fetched_at", { ascending: false })
    .range(from, to);

  if (searchParams.q) {
    query = query.or(
      `title.ilike.%${searchParams.q}%,company_name.ilike.%${searchParams.q}%,description.ilike.%${searchParams.q}%`
    );
  }

  if (searchParams.work_type) {
    query = query.eq("work_type", searchParams.work_type);
  }

  if (searchParams.country) {
    const country = searchParams.country.toLowerCase();

    if (country === "nigeria") {
      query = query.or(
        "country.ilike.%Nigeria%,country.ilike.%NG%,location_display.ilike.%Nigeria%,location_display.ilike.%Lagos%,location_display.ilike.%Abuja%"
      );
    } else {
      query = query.or(
        `country.ilike.%${searchParams.country}%,location_display.ilike.%${searchParams.country}%`
      );
    }
  }

  if (searchParams.visa === "true") {
    query = query.eq("is_visa_sponsorship", true);
  }

  if (searchParams.experience) {
    query = query.eq("experience_level", searchParams.experience);
  }

  if (searchParams.industry) {
    query = query.ilike("industry", `%${searchParams.industry}%`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error(error);
    return { jobs: [], total: 0, page: currentPage, totalPages: 1 };
  }

  const total = count || 0;
  const totalPages = Math.max(Math.ceil(total / PAGE_SIZE), 1);

  return {
    jobs: data || [],
    total,
    page: currentPage,
    totalPages,
  };
}

function getPageTitle(searchParams: {
  q?: string;
  work_type?: string;
  country?: string;
  visa?: string;
}) {
  if (searchParams.q) return `Search Results for "${searchParams.q}"`;
  if (searchParams.visa === "true") return "Visa Sponsorship Jobs";
  if (searchParams.country) return `${searchParams.country} Jobs`;
  if (searchParams.work_type === "remote") return "Remote Jobs";
  if (searchParams.work_type === "hybrid") return "Hybrid Jobs";
  if (searchParams.work_type === "onsite") return "Onsite Jobs";
  if (searchParams.work_type === "wfa") return "Work From Anywhere Jobs";
  return "Browse Available Jobs";
}

function buildPageUrl(
  params: {
    q?: string;
    work_type?: string;
    country?: string;
    visa?: string;
    experience?: string;
    industry?: string;
  },
  page: number
) {
  const urlParams = new URLSearchParams();

  if (params.q) urlParams.set("q", params.q);
  if (params.work_type) urlParams.set("work_type", params.work_type);
  if (params.country) urlParams.set("country", params.country);
  if (params.visa) urlParams.set("visa", params.visa);
  if (params.experience) urlParams.set("experience", params.experience);
  if (params.industry) urlParams.set("industry", params.industry);

  urlParams.set("page", String(page));

  return `/jobs?${urlParams.toString()}`;
}

export default async function JobsPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    work_type?: string;
    country?: string;
    visa?: string;
    experience?: string;
    industry?: string;
    page?: string;
  }>;
}) {
  const params = await searchParams;
  const { jobs, total, page, totalPages } = await getJobs(params);
  const title = getPageTitle(params);

  const fromRecord = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const toRecord = Math.min(page * PAGE_SIZE, total);

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Chumcred Jobs
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">{title}</h1>

        <p className="mt-3 text-slate-600">
          Showing {fromRecord}–{toRecord} of {total} matching job opportunities.
        </p>
      </div>

      <JobFilters />

      {jobs.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-slate-600">
          No jobs found for this category yet. Try another category or clear
          filters.
        </div>
      ) : (
        <>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {jobs.map((job) => (
              <JobCard key={job.id} job={job} />
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center justify-between gap-4 rounded-2xl border bg-white p-5 sm:flex-row">
            <p className="text-sm text-slate-600">
              Page {page} of {totalPages}
            </p>

            <div className="flex items-center gap-3">
              {page > 1 ? (
                <Link
                  href={buildPageUrl(params, page - 1)}
                  className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                >
                  ← Previous
                </Link>
              ) : (
                <span className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-300">
                  ← Previous
                </span>
              )}

              {page < totalPages ? (
                <Link
                  href={buildPageUrl(params, page + 1)}
                  className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  Next →
                </Link>
              ) : (
                <span className="rounded-xl bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-400">
                  Next →
                </span>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}