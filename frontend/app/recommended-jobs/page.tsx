"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

import {
  AlertCircle,
  Briefcase,
  Sparkles,
  Target,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

type RecommendedJob = {
  job_id: string;
  title: string;
  company_name: string | null;
  location_display: string | null;
  country: string | null;
  work_type: string | null;
  employment_type: string | null;
  match_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  summary: string;
};

export default function RecommendedJobsPage() {
  const [jobs, setJobs] = useState<RecommendedJob[]>([]);
  const [filteredJobs, setFilteredJobs] = useState<RecommendedJob[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [message, setMessage] = useState("");
  const [userId, setUserId] = useState("");

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const params = new URLSearchParams(window.location.search);
      const shouldRefresh = params.get("refresh") === "1";

      if (shouldRefresh) {
        await refreshRecommendationsForUser(user.id);
      } else {
        await loadSavedRecommendations(user.id);
      }

      setLoading(false);
    }

    init();
  }, []);

  async function loadSavedRecommendations(currentUserId: string) {
    try {
      const response = await fetch("/api/job-recommendation-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({ user_id: currentUserId }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to load saved recommendations.");
        return;
      }

      const recommendations = (data.recommendations || []) as RecommendedJob[];

      setJobs(recommendations);
      setFilteredJobs(recommendations);
      setMessage("");
    } catch {
      setMessage("Unable to load saved recommendations.");
    }
  }

  async function refreshRecommendationsForUser(currentUserId: string) {
    setRefreshing(true);
    setMessage("");

    try {
      const response = await fetch("/api/job-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          user_id: currentUserId,
          limit: 50,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate recommended jobs.");
        return;
      }

      const recommendations = (data.recommendations || []) as RecommendedJob[];

      setJobs(recommendations);
      setFilteredJobs(recommendations);
      setActiveFilter("all");

      if (recommendations.length === 0) {
        setMessage(
          "No recommendations were generated. Please confirm your CV was uploaded, then try again."
        );
      } else {
        setMessage("");
        window.history.replaceState(null, "", "/recommended-jobs");
      }
    } catch {
      setMessage("Unable to generate recommended jobs.");
    } finally {
      setRefreshing(false);
    }
  }

  async function refreshRecommendations() {
    if (!userId) return;
    await refreshRecommendationsForUser(userId);
  }

  function applyFilter(filter: string) {
    setActiveFilter(filter);

    switch (filter) {
      case "best-fit":
        setFilteredJobs([...jobs].sort((a, b) => b.match_score - a.match_score));
        break;

      case "high-match":
        setFilteredJobs(jobs.filter((job) => job.match_score >= 70));
        break;

      case "remote":
        setFilteredJobs(
          jobs.filter((job) => job.work_type?.toLowerCase().includes("remote"))
        );
        break;

      case "nigeria":
        setFilteredJobs(
          jobs.filter(
            (job) =>
              job.country?.toLowerCase().includes("nigeria") ||
              job.location_display?.toLowerCase().includes("nigeria")
          )
        );
        break;

      case "low-gap":
        setFilteredJobs(
          jobs.filter((job) => (job.missing_keywords?.length || 0) <= 5)
        );
        break;

      default:
        setFilteredJobs(jobs);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading recommended jobs...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl bg-slate-950 p-8 text-white">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="rounded-2xl bg-blue-600 p-3">
              <Sparkles size={34} />
            </div>

            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
                Smart Job Recommendations
              </p>

              <h1 className="mt-2 text-4xl font-bold">Best Fit Jobs</h1>

              <p className="mt-3 max-w-3xl text-slate-300">
                Jobs ranked against your CV using AI keyword and role-fit signals.
              </p>
            </div>
          </div>

          <button
            onClick={refreshRecommendations}
            disabled={refreshing}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw size={16} />
            {refreshing ? "Generating..." : "Refresh Recommendations"}
          </button>
        </div>
      </section>

      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-amber-800">
          <AlertCircle size={20} />
          <div>
            <p className="text-sm font-semibold">{message}</p>
            <Link
              href="/profile/resume"
              className="mt-2 inline-block text-sm font-bold text-amber-900"
            >
              Upload or update CV →
            </Link>
          </div>
        </div>
      )}

      {jobs.length === 0 ? (
        <section className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
          <Target className="mx-auto h-12 w-12 text-slate-400" />

          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            No recommended jobs yet
          </h2>

          <p className="mx-auto mt-2 max-w-2xl text-slate-600">
            Upload your CV, then generate best-fit job recommendations based on
            your skills, experience and target role alignment.
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/profile/resume"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700"
            >
              <UploadCloud size={18} />
              Upload CV
            </Link>

            <button
              onClick={refreshRecommendations}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <RefreshCw size={18} />
              {refreshing ? "Generating..." : "Generate Recommendations"}
            </button>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            After uploading your CV, return here or click Generate Recommended Jobs on the CV page.
          </p>
        </section>
      ) : (
        <>
          <div className="mt-8 flex flex-wrap gap-3">
            <FilterButton
              label="All"
              active={activeFilter === "all"}
              onClick={() => applyFilter("all")}
            />

            <FilterButton
              label="Best Fit"
              active={activeFilter === "best-fit"}
              onClick={() => applyFilter("best-fit")}
            />

            <FilterButton
              label="High Match"
              active={activeFilter === "high-match"}
              onClick={() => applyFilter("high-match")}
            />

            <FilterButton
              label="Remote"
              active={activeFilter === "remote"}
              onClick={() => applyFilter("remote")}
            />

            <FilterButton
              label="Nigeria"
              active={activeFilter === "nigeria"}
              onClick={() => applyFilter("nigeria")}
            />

            <FilterButton
              label="Low Gap"
              active={activeFilter === "low-gap"}
              onClick={() => applyFilter("low-gap")}
            />
          </div>

          {filteredJobs.length === 0 ? (
            <section className="mt-8 rounded-3xl border bg-white p-10 text-center shadow-sm">
              <Target className="mx-auto h-12 w-12 text-slate-400" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                No jobs match this filter
              </h2>
              <p className="mt-2 text-slate-600">
                Try another filter or refresh your recommendations.
              </p>
            </section>
          ) : (
            <section className="mt-8 grid gap-5">
              {filteredJobs.map((job) => (
                <div
                  key={job.job_id}
                  className="rounded-3xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex items-center gap-2 text-blue-700">
                        <Briefcase size={18} />
                        <p className="text-sm font-semibold uppercase tracking-widest">
                          Recommended job
                        </p>
                      </div>

                      <h2 className="mt-3 text-2xl font-bold text-slate-900">
                        {job.title}
                      </h2>

                      <p className="mt-2 text-slate-600">
                        {job.company_name || "Company not stated"}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {job.location_display || job.country || "Location not stated"}
                        {job.work_type ? ` • ${job.work_type}` : ""}
                        {job.employment_type ? ` • ${job.employment_type}` : ""}
                      </p>

                      <p className="mt-4 max-w-4xl leading-7 text-slate-700">
                        {job.summary}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-blue-50 px-7 py-5 text-center text-blue-700">
                      <p className="text-4xl font-bold">{job.match_score}%</p>
                      <p className="mt-1 text-xs font-semibold">Fit Score</p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-5 md:grid-cols-2">
                    <KeywordBox
                      title="Matched Keywords"
                      items={job.matched_keywords}
                      emptyText="No strong matched keywords detected."
                    />

                    <KeywordBox
                      title="Missing Keywords"
                      items={job.missing_keywords}
                      emptyText="No major missing keywords detected."
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link
                      href={`/recommended-jobs/${job.job_id}`}
                      className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      View Recommendation
                    </Link>

                    <Link
                      href={`/ai-match-score?job_id=${job.job_id}`}
                      className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Analyze Match
                    </Link>

                    <Link
                      href={`/interview-iq?role=${encodeURIComponent(
                        job.title
                      )}&company=${encodeURIComponent(job.company_name || "")}`}
                      className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Practice Interview
                    </Link>
                    <Link
                      href={`/interview-iq?role=${encodeURIComponent(
                        job.title
                      )}&company=${encodeURIComponent(
                        job.company_name || ""
                      )}&job_id=${job.job_id}&source=recommended`}
                      className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Practice Interview
                    </Link>
                  </div>
                </div>
              ))}
            </section>
          )}
        </>
      )}
    </main>
  );
}

function KeywordBox({
  title,
  items,
  emptyText,
}: {
  title: string;
  items?: string[];
  emptyText: string;
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>

      {items && items.length > 0 ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {items.slice(0, 12).map((item) => (
            <span
              key={item}
              className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
            >
              {item}
            </span>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-500">{emptyText}</p>
      )}
    </div>
  );
}

function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={
        active
          ? "rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white"
          : "rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
      }
    >
      {label}
    </button>
  );
}