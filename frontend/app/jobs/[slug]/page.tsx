import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import type { Job } from "@/types/jobs";
import ApplyButton from "@/components/ApplyButton";
import SaveJobButton from "@/components/SaveJobButton";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Briefcase,
  GraduationCap,
  Banknote,
  ExternalLink,
  Globe2,
} from "lucide-react";
import JobCard from "@/components/JobCard";

export const dynamic = "force-dynamic";

async function getJob(slug: string): Promise<Job | null> {
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

async function getRelatedJobs(job: Job): Promise<Job[]> {
  let query = supabase
    .from("jobs")
    .select("*")
    .eq("status", "active")
    .neq("id", job.id)
    .limit(6);

  if (job.industry) {
    query = query.ilike("industry", `%${job.industry}%`);
  } else if (job.country) {
    query = query.ilike("country", `%${job.country}%`);
  } else if (job.work_type) {
    query = query.eq("work_type", job.work_type);
  }

  const { data, error } = await query;

  if (error) {
    console.error(error);
    return [];
  }

  return data || [];
}

function cleanText(text?: string | null) {
  if (!text) return "Not specified";
  return text.replace(/_/g, " ");
}

export default async function JobDetailsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-20">
        <h1 className="text-3xl font-bold text-slate-900">Job not found</h1>
        <Link href="/jobs" className="mt-6 inline-block text-blue-700">
          Back to jobs
        </Link>
      </main>
    );
  }

  const relatedJobs = await getRelatedJobs(job);

  return (
    <main className="bg-slate-50">
      <section className="border-b bg-slate-950 px-6 py-12 text-white">
        <div className="mx-auto max-w-7xl">
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-200 hover:text-white"
          >
            <ArrowLeft size={16} />
            Back to jobs
          </Link>

          <div className="mt-8 max-w-4xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              {job.source_name || "External Job"}
            </p>

            <h1 className="mt-3 text-4xl font-bold tracking-tight md:text-5xl">
              {job.title}
            </h1>

            <div className="mt-5 flex flex-wrap gap-4 text-sm text-slate-300">
              <span className="flex items-center gap-2">
                <Building2 size={16} />
                {job.company_name || "Company not stated"}
              </span>

              <span className="flex items-center gap-2">
                <MapPin size={16} />
                {job.location_display || job.country || "Location not stated"}
              </span>

              <span className="flex items-center gap-2">
                <Briefcase size={16} />
                {cleanText(job.work_type)}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-6 py-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="rounded-3xl border bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-bold text-slate-900">
              Job Description
            </h2>

            <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
              {job.description || "No description available."}
            </div>
          </div>

          {job.requirements && (
            <div className="mt-6 rounded-3xl border bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Requirements
              </h2>
              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
                {job.requirements}
              </div>
            </div>
          )}

          {job.responsibilities && (
            <div className="mt-6 rounded-3xl border bg-white p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-slate-900">
                Responsibilities
              </h2>
              <div className="mt-5 whitespace-pre-line text-sm leading-7 text-slate-700">
                {job.responsibilities}
              </div>
            </div>
          )}
        </div>

        <aside className="lg:col-span-1">
          <div className="sticky top-24 rounded-3xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-900">Job Summary</h3>

            <div className="mt-5 space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <Building2 size={18} className="mt-0.5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">Company</p>
                  <p className="text-slate-600">
                    {job.company_name || "Not stated"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Globe2 size={18} className="mt-0.5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">Country</p>
                  <p className="text-slate-600">
                    {job.country || "Not stated"}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase size={18} className="mt-0.5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">Work Type</p>
                  <p className="capitalize text-slate-600">
                    {cleanText(job.work_type)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <GraduationCap size={18} className="mt-0.5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">Experience</p>
                  <p className="capitalize text-slate-600">
                    {cleanText(job.experience_level)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Banknote size={18} className="mt-0.5 text-blue-700" />
                <div>
                  <p className="font-semibold text-slate-900">Salary</p>
                  <p className="text-slate-600">
                    {job.salary_display || "Not stated"}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <SaveJobButton jobId={job.id} />
            </div>
            <ApplyButton jobId={job.id} applyUrl={job.original_job_url} />

            <p className="mt-3 text-xs text-slate-500">
              You will be redirected to the original job source.
            </p>
          </div>
        </aside>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-16">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-slate-900">Related Jobs</h2>
          <p className="mt-2 text-sm text-slate-600">
            Similar opportunities based on industry, country or work type.
          </p>
        </div>

        {relatedJobs.length === 0 ? (
          <div className="rounded-2xl border bg-white p-6 text-slate-600">
            No related jobs found yet.
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relatedJobs.map((relatedJob) => (
              <JobCard key={relatedJob.id} job={relatedJob} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}