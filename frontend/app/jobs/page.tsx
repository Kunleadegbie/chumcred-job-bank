import JobCard from "@/components/JobCard";
import { supabase } from "@/lib/supabaseClient";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<{
    q?: string;
    country?: string;
    work_type?: string;
    visa?: string;
  }>;
};

function matchesNigeria(job: any) {
  const text = `${job.country || ""} ${job.location_display || ""} ${
    job.city || ""
  } ${job.state_region || ""}`.toLowerCase();

  return (
    text.includes("nigeria") ||
    text.includes("lagos") ||
    text.includes("abuja") ||
    text.includes("port harcourt") ||
    text.includes("ibadan")
  );
}

function matchesVisa(job: any) {
  const text = `${job.title || ""} ${job.company_name || ""} ${
    job.description || ""
  } ${job.requirements || ""} ${job.benefits || ""}`.toLowerCase();

  return (
    job.visa_sponsorship === true ||
    text.includes("visa sponsorship") ||
    text.includes("visa sponsor") ||
    text.includes("sponsorship") ||
    text.includes("relocation") ||
    text.includes("work permit")
  );
}

export default async function JobsPage({ searchParams }: PageProps) {
  const params = (await searchParams) || {};

  const q = params.q || "";
  const country = params.country || "";
  const workType = params.work_type || "";
  const visa = params.visa || "";

  const { data: normalJobs } = await supabase
    .from("jobs")
    .select("*")
    .order("is_featured", { ascending: false })
    .order("posted_at", { ascending: false })
    .limit(300);

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
    .order("is_featured", { ascending: false })
    .order("posted_at", { ascending: false })
    .limit(300);

  const employerJobs = (employerJobsData || []).map((job: any) => ({
    id: job.id,
    title: job.title,
    slug: job.slug,
    company_name: job.employers?.company_name || "Employer",
    location_display:
      job.location_display || job.city || job.country || "Location not stated",
    country: job.country || "",
    city: job.city || "",
    state_region: job.state_region || "",
    description: job.description || "",
    requirements: job.requirements || "",
    responsibilities: job.responsibilities || "",
    benefits: job.benefits || "",
    work_type: job.work_type || "",
    employment_type: job.employment_type || "",
    experience_level: job.experience_level || "",
    salary_display: job.salary_display || "",
    salary_currency: job.salary_currency || "",
    original_job_url: job.original_job_url || "",
    source: "Employer",
    is_featured: job.is_featured || false,
    visa_sponsorship: false,
    posted_at: job.posted_at || job.created_at,
    created_at: job.created_at,
  }));

  const combinedJobs = [...employerJobs, ...(normalJobs || [])]
    .filter((job: any) => {
      const searchText = `${job.title || ""} ${job.company_name || ""} ${
        job.description || ""
      } ${job.requirements || ""}`.toLowerCase();

      if (q && !searchText.includes(q.toLowerCase())) return false;

      if (country.toLowerCase() === "nigeria" && !matchesNigeria(job)) {
        return false;
      }

      if (
        country &&
        country.toLowerCase() !== "nigeria" &&
        !`${job.country || ""} ${job.location_display || ""}`
          .toLowerCase()
          .includes(country.toLowerCase())
      ) {
        return false;
      }

      if (
        workType &&
        !`${job.work_type || ""}`.toLowerCase().includes(workType.toLowerCase())
      ) {
        return false;
      }

      if (visa === "true" && !matchesVisa(job)) return false;

      return true;
    })
    .sort((a: any, b: any) => {
      if (a.is_featured && !b.is_featured) return -1;
      if (!a.is_featured && b.is_featured) return 1;

      return (
        new Date(b.posted_at || b.created_at || 0).getTime() -
        new Date(a.posted_at || a.created_at || 0).getTime()
      );
    })
    .slice(0, 100);

  const pageTitle = country
    ? `${country} Jobs`
    : workType === "remote"
    ? "Remote Jobs"
    : visa === "true"
    ? "Visa Sponsorship Jobs"
    : "Browse Available Jobs";

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Chumcred Jobs
        </p>

        <h1 className="mt-3 text-5xl font-bold text-slate-900">
          {pageTitle}
        </h1>

        <p className="mt-4 text-slate-600">
          Showing {combinedJobs.length} matching job opportunities.
        </p>

        <form method="GET" className="mt-8 flex flex-col gap-3 md:flex-row">
          <input
            type="text"
            name="q"
            placeholder="Search jobs, companies, skills..."
            defaultValue={q}
            className="flex-1 rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          />

          <button
            type="submit"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Search
          </button>
        </form>
      </div>

      {combinedJobs.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-slate-600">
            No jobs found for this category yet. Try another category.
          </p>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {combinedJobs.map((job: any) => (
            <JobCard key={`${job.source || "job"}-${job.id}`} job={job} />
          ))}
        </div>
      )}
    </main>
  );
}