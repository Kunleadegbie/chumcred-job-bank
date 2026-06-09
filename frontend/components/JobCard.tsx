import Link from "next/link";
import { MapPin, Briefcase, Building2, Banknote, Clock } from "lucide-react";
import type { Job } from "@/types/jobs";
import SaveJobButton from "@/components/SaveJobButton";

function cleanText(value?: string | null) {
  if (!value) return "Not specified";
  return value.replace(/_/g, " ");
}

function getInitials(company?: string | null) {
  if (!company) return "C";
  return company
    .split(" ")
    .map((word) => word[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function formatDate(date?: string | null) {
  if (!date) return "Recently posted";

  const posted = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - posted.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) return "Posted today";
  if (diffDays === 1) return "Posted yesterday";
  return `Posted ${diffDays} days ago`;
}

function salaryText(job: Job) {
  if (job.salary_display) return job.salary_display;

  const currency = job.salary_currency || "";
  if (job.salary_min && job.salary_max) {
    return `${currency} ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}`;
  }

  if (job.salary_min) return `${currency} From ${job.salary_min.toLocaleString()}`;
  if (job.salary_max) return `${currency} Up to ${job.salary_max.toLocaleString()}`;

  return "Salary not stated";
}

export default function JobCard({ job }: { job: Job }) {
  const logo = job.company_logo_url || job.company_logo;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-sm font-bold text-white">
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              alt={job.company_name || "Company logo"}
              className="h-12 w-12 rounded-2xl object-cover"
            />
          ) : (
            getInitials(job.company_name)
          )}
        </div>

        <div className="min-w-0 flex-1">
          <Link href={`/jobs/${job.slug}`}>
            <h3 className="line-clamp-2 text-lg font-bold text-slate-900 hover:text-blue-700">
              {job.title}
            </h3>
          </Link>

          <p className="mt-1 flex items-center gap-1 text-sm text-slate-600">
            <Building2 size={14} />
            {job.company_name || "Company not stated"}
          </p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold capitalize text-blue-700">
          {cleanText(job.work_type)}
        </span>

        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold capitalize text-slate-700">
          {cleanText(job.experience_level)}
        </span>

        {job.is_visa_sponsorship && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            Visa Sponsorship
          </span>
        )}

        {job.is_featured && (
          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
            Featured
          </span>
        )}
      </div>

      <div className="mt-4 space-y-2 text-sm text-slate-600">
        <p className="flex items-center gap-2">
          <MapPin size={15} />
          {job.location_display || job.country || "Location not stated"}
        </p>

        <p className="flex items-center gap-2">
          <Briefcase size={15} />
          {job.industry || job.employment_type || "General"}
        </p>

        <p className="flex items-center gap-2">
          <Banknote size={15} />
          {salaryText(job)}
        </p>

        <p className="flex items-center gap-2">
          <Clock size={15} />
          {formatDate(job.posted_at || job.fetched_at)}
        </p>
      </div>

      <p className="mt-4 line-clamp-3 text-sm leading-6 text-slate-600">
        {job.description || "No description available."}
      </p>

      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SaveJobButton jobId={job.id} />

        <Link
          href={`/jobs/${job.slug}`}
          className="rounded-xl bg-slate-900 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-blue-700"
        >
          View Job
        </Link>
      </div>
    </div>
  );
}