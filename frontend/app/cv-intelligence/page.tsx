"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FileText,
  Search,
  Sparkles,
  Target,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type JobContext = {
  id: string;
  title: string | null;
  company_name: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  location_display?: string | null;
  country?: string | null;
  work_type?: string | null;
  employment_type?: string | null;
};

type CvGap = {
  area: string;
  risk: string;
  note: string;
};

type CvIntelligence = {
  ats_score: number;
  matched_keywords: string[];
  missing_keywords: string[];
  rewrite_suggestions: string[];
  cv_gaps: CvGap[];
  tailoring_summary: string;
  recommended_cv_actions: string[];
};

type CvRewrite = {
  improved_summary: string;
  tailored_headline: string;
  rewritten_experience_bullets: string[];
  keywords_to_add: string[];
  sections_to_improve: {
    section: string;
    issue: string;
    suggested_fix: string;
  }[];
  application_positioning: string;
  final_cv_improvement_note: string;
};

export default function CvIntelligencePage() {
  const [userId, setUserId] = useState("");
  const [jobs, setJobs] = useState<JobContext[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobContext | null>(null);
  const [jobSearch, setJobSearch] = useState("");
  const [result, setResult] = useState<CvIntelligence | null>(null);
  const [rewrite, setRewrite] = useState<CvRewrite | null>(null);
  const [rewriting, setRewriting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");

  const filteredJobs = useMemo(() => {
    const search = jobSearch.toLowerCase().trim();

    if (!search) return jobs;

    return jobs.filter((job) =>
      job.title?.toLowerCase().includes(search) ||
      job.company_name?.toLowerCase().includes(search) ||
      job.location_display?.toLowerCase().includes(search) ||
      job.country?.toLowerCase().includes(search)
    );
  }, [jobs, jobSearch]);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);
      await loadJobs();
      setLoading(false);
    }

    init();
  }, []);

  async function loadJobs() {
    const { data, error } = await supabaseBrowser
      .from("jobs")
      .select(
        "id,title,company_name,description,requirements,responsibilities,location_display,country,work_type,employment_type"
      )
      .is("deleted_at", null)
      .order("posted_at", { ascending: false })
      .limit(250);

    if (error) {
      setMessage("Unable to load jobs.");
      return;
    }

    setJobs((data || []) as JobContext[]);
  }

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId);
    const job = jobs.find((item) => item.id === jobId) || null;
    setSelectedJob(job);
    setResult(null);
  }

  async function runCvIntelligence() {
    if (!userId) return;

    setAnalyzing(true);
    setMessage("");
    setResult(null);

    try {
      const response = await fetch("/api/cv-intelligence", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          user_id: userId,
          job_context: selectedJob || {},
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate CV Intelligence.");
        return;
      }

      setResult(data.intelligence || null);
    } catch {
      setMessage("Unable to generate CV Intelligence.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function rewriteCv() {
    if (!userId || !result) return;

    setRewriting(true);
    setMessage("");

    try {
      const response = await fetch("/api/cv-rewrite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          job_context: selectedJob || {},
          cv_intelligence: result,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to rewrite CV.");
        return;
      }

      setRewrite(data.rewrite);
    } catch {
      setMessage("Unable to rewrite CV.");
    } finally {
      setRewriting(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading CV Intelligence Pro...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-600 p-3">
            <FileText size={34} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              CV Intelligence Pro
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Tailor Your CV to a Real Job
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Compare your CV against live job descriptions and get ATS score,
              missing keywords and practical rewrite actions.
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {message}
        </div>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">CV Target Setup</h2>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Search Live Job
          </label>

          <div className="mt-2 flex items-center gap-2 rounded-xl border px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search job title, company or location"
              className="w-full outline-none"
            />
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Target Job
          </label>

          <select
            value={selectedJobId}
            onChange={(e) => handleSelectJob(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="">Analyze against general CV quality</option>
            {filteredJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title || "Untitled Job"} —{" "}
                {job.company_name || "Company not stated"}
              </option>
            ))}
          </select>

          {selectedJob && (
            <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
              <p className="font-bold text-slate-900">{selectedJob.title}</p>
              <p>{selectedJob.company_name || "Company not stated"}</p>
              <p className="mt-1 text-slate-500">
                {selectedJob.location_display || selectedJob.country || "Location not stated"}
                {selectedJob.work_type ? ` • ${selectedJob.work_type}` : ""}
                {selectedJob.employment_type ? ` • ${selectedJob.employment_type}` : ""}
              </p>
            </div>
          )}

          <button
            onClick={runCvIntelligence}
            disabled={analyzing}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {analyzing ? "Analyzing..." : "Run CV Intelligence"}
          </button>

          <Link
            href="/profile/resume"
            className="mt-3 inline-flex w-full items-center justify-center rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Upload / Update CV
          </Link>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          {!result ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Target className="mx-auto h-12 w-12 text-slate-400" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                No CV Intelligence yet
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-slate-600">
                Select a live job or run a general CV check to see your ATS score,
                missing keywords and improvement actions.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                CV Intelligence Result
              </p>

              <h2 className="mt-2 text-4xl font-bold text-slate-900">
                ATS Score: {result.ats_score}%
              </h2>

              <p className="mt-3 text-slate-700">
                {result.tailoring_summary}
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <KeywordPanel
                  title="Matched Keywords"
                  items={result.matched_keywords}
                  type="positive"
                />
                <KeywordPanel
                  title="Missing Keywords"
                  items={result.missing_keywords}
                  type="warning"
                />
              </div>

              <div className="mt-6 rounded-2xl bg-slate-50 p-5">
                <h3 className="font-bold text-slate-900">CV Gaps</h3>

                <div className="mt-4 space-y-3">
                  {result.cv_gaps.map((gap) => (
                    <div key={gap.area} className="rounded-xl bg-white p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-slate-900">
                          {gap.area}
                        </p>
                        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                          {gap.risk}
                        </span>
                      </div>
                      <p className="mt-2 text-sm text-slate-600">
                        {gap.note}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <ActionPanel
                title="Rewrite Suggestions"
                items={result.rewrite_suggestions}
              />

              <ActionPanel
                title="Recommended CV Actions"
                items={result.recommended_cv_actions}
              />
              <div className="mt-8">
                <button
                  onClick={rewriteCv}
                  disabled={rewriting}
                  className="rounded-xl bg-slate-900 px-6 py-4 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
                >
                  {rewriting ? "Rewriting CV..." : "Rewrite CV for this Job"}
                </button>
              </div>   
              {rewrite && (
  <div className="mt-8 space-y-6">

    <div className="rounded-2xl bg-green-50 p-6">
      <h3 className="text-xl font-bold">
        Tailored Headline
      </h3>

      <p className="mt-3">
        {rewrite.tailored_headline}
      </p>
    </div>

    <div className="rounded-2xl bg-white border p-6">
      <h3 className="text-xl font-bold">
        Improved Professional Summary
      </h3>

      <p className="mt-3 whitespace-pre-line">
        {rewrite.improved_summary}
      </p>
    </div>

    <div className="rounded-2xl bg-white border p-6">
      <h3 className="text-xl font-bold">
        Rewritten Experience Bullets
      </h3>

      <ul className="mt-4 list-disc pl-6 space-y-2">
        {rewrite.rewritten_experience_bullets.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </div>

    <ActionPanel
      title="Keywords to Add"
      items={rewrite.keywords_to_add}
    />

    <div className="rounded-2xl bg-white border p-6">
      <h3 className="text-xl font-bold">
        Sections to Improve
      </h3>

      <div className="mt-5 space-y-4">
        {rewrite.sections_to_improve.map((section) => (
          <div
            key={section.section}
            className="rounded-xl bg-slate-50 p-4"
          >
            <p className="font-bold">
              {section.section}
            </p>

            <p className="mt-2">
              <strong>Issue:</strong> {section.issue}
            </p>

            <p className="mt-2">
              <strong>Suggested Fix:</strong>{" "}
              {section.suggested_fix}
            </p>
          </div>
        ))}
      </div>
    </div>

    <div className="rounded-2xl bg-blue-50 p-6">
      <h3 className="text-xl font-bold">
        Application Positioning
      </h3>

      <p className="mt-3">
        {rewrite.application_positioning}
      </p>
    </div>

    <div className="rounded-2xl bg-amber-50 p-6">
      <h3 className="text-xl font-bold">
        Final CV Improvement Note
      </h3>

      <p className="mt-3">
        {rewrite.final_cv_improvement_note}
      </p>
    </div>

  </div>
)}

            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function KeywordPanel({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: "positive" | "warning";
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>

      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className={
                type === "positive"
                  ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                  : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">None detected.</p>
        )}
      </div>
    </div>
  );
}

function ActionPanel({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="mt-6 rounded-2xl bg-blue-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>

      <ul className="mt-4 space-y-2">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-sm text-slate-700">
            <CheckCircle size={16} className="mt-0.5 text-blue-700" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}