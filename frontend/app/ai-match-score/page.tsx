"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Target, Briefcase, AlertCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Job = {
  id: string;
  title: string;
  company_name: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
  location_display: string | null;
};

type MatchResult = {
  match_score: number;
  recommendation: string;
  summary: string;
  strengths: string[];
  gaps: string[];
  missing_keywords: string[];
  skills_alignment: string;
  experience_alignment: string;
  education_alignment: string;
  improvement_actions: string[];
};

export default function AIMatchScorePage() {
  const [resumeText, setResumeText] = useState("");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [message, setMessage] = useState("");
  const [match, setMatch] = useState<MatchResult | null>(null);

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const params = new URLSearchParams(window.location.search);
      const jobIdFromUrl = params.get("job_id") || "";

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("resume_text")
        .eq("id", user.id)
        .maybeSingle();

      setResumeText(profile?.resume_text || "");

      const { data: jobData } = await supabaseBrowser
        .from("jobs")
        .select("id,title,company_name,description,requirements,responsibilities,location_display")
        .is("deleted_at", null)
        .order("posted_at", { ascending: false })
        .limit(100);

      const loadedJobs = (jobData || []) as Job[];
      setJobs(loadedJobs);

      if (jobIdFromUrl) {
        const jobFromList = loadedJobs.find((job) => job.id === jobIdFromUrl);

        if (jobFromList) {
          setSelectedJobId(jobFromList.id);
          setSelectedJob(jobFromList);
        } else {
          const { data: singleJob } = await supabaseBrowser
            .from("jobs")
            .select("id,title,company_name,description,requirements,responsibilities,location_display")
            .eq("id", jobIdFromUrl)
            .maybeSingle();

          if (singleJob) {
            const job = singleJob as Job;
            setSelectedJobId(job.id);
            setSelectedJob(job);
            setJobs((prev) => [job, ...prev]);
          }
        }
      }

      setLoading(false);
    }

    init();
  }, []);

  function handleJobSelect(jobId: string) {
    setSelectedJobId(jobId);
    const job = jobs.find((item) => item.id === jobId) || null;
    setSelectedJob(job);
    setMatch(null);
    setMessage("");
  }

  async function analyzeMatch() {
    if (!resumeText.trim()) {
      setMessage("No resume text found. Please upload and extract your resume first.");
      return;
    }

    if (!selectedJob) {
      setMessage("Please select a job first.");
      return;
    }

    setAnalyzing(true);
    setMessage("");
    setMatch(null);

    const response = await fetch("/api/ai-match-score", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        resume_text: resumeText,
        job_title: selectedJob.title,
        company_name: selectedJob.company_name || "",
        job_description: selectedJob.description || "",
        job_requirements: selectedJob.requirements || "",
        job_responsibilities: selectedJob.responsibilities || "",
      }),
    });

    const data = await response.json();

    if (!response.ok || data.status === "error") {
      setMessage(data.message || data.error || "Unable to analyze match.");
      setAnalyzing(false);
      return;
    }

    setMatch(data.match || null);
    setAnalyzing(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-slate-600">Loading AI Match Score...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl bg-slate-950 p-8 text-white">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-600 p-3">
            <Target size={34} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              AI Match Score
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Know Your Chances Before You Apply
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Compare your CV against a job description and get your match score,
              strengths, gaps, missing keywords and improvement actions.
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-6 flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700">
          <AlertCircle size={20} />
          <p className="text-sm font-semibold">{message}</p>
        </div>
      )}

      {!resumeText && (
        <section className="mt-8 rounded-3xl border bg-amber-50 p-6">
          <h2 className="text-xl font-bold text-amber-900">
            Resume text not found
          </h2>
          <p className="mt-2 text-amber-800">
            Upload and extract your resume first before using AI Match Score.
          </p>
          <Link
            href="/profile/resume"
            className="mt-4 inline-block rounded-xl bg-amber-600 px-5 py-3 font-semibold text-white hover:bg-amber-700"
          >
            Upload Resume
          </Link>
        </section>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Select Job</h2>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Available Jobs
          </label>

          <select
            value={selectedJobId}
            onChange={(e) => handleJobSelect(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="">Choose a job...</option>
            {jobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title} {job.company_name ? `- ${job.company_name}` : ""}
              </option>
            ))}
          </select>

          {selectedJob && (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <div className="flex items-center gap-2 text-blue-700">
                <Briefcase size={18} />
                <p className="font-semibold">{selectedJob.title}</p>
              </div>

              <p className="mt-2 text-sm text-slate-600">
                {selectedJob.company_name || "Company not stated"}
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {selectedJob.location_display || "Location not stated"}
              </p>
            </div>
          )}

          <button
            onClick={analyzeMatch}
            disabled={analyzing || !resumeText || !selectedJob}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {analyzing ? "Analyzing..." : "Analyze Match"}
          </button>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          {!match ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Target className="mx-auto h-12 w-12 text-slate-400" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                Your AI Match Score will appear here
              </h2>
              <p className="mt-2 text-slate-600">
                Select a job and click Analyze Match.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                Match Result
              </p>

              <h2 className="mt-3 text-5xl font-bold text-slate-900">
                {match.match_score || 0}%
              </h2>

              <p className="mt-3 text-xl font-semibold text-slate-700">
                {match.recommendation || "No recommendation available"}
              </p>

              <p className="mt-4 leading-7 text-slate-600">
                {match.summary}
              </p>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <ResultBox title="Strengths" items={match.strengths} />
                <ResultBox title="Gaps" items={match.gaps} />
                <ResultBox title="Missing Keywords" items={match.missing_keywords} />
                <ResultBox title="Improvement Actions" items={match.improvement_actions} />
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-3">
                <TextBox title="Skills Alignment" content={match.skills_alignment} />
                <TextBox title="Experience Alignment" content={match.experience_alignment} />
                <TextBox title="Education Alignment" content={match.education_alignment} />
              </div>

              {selectedJob && (
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/interview-iq?role=${encodeURIComponent(
                      selectedJob.title
                    )}&company=${encodeURIComponent(
                      selectedJob.company_name || ""
                    )}`}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Practice Interview
                  </Link>

                  <Link
                    href="/ai-cv-review"
                    className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    Improve CV
                  </Link>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function ResultBox({
  title,
  items,
}: {
  title: string;
  items?: string[];
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>

      {items && items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm text-slate-700">
          {items.map((item, index) => (
            <li key={index}>• {item}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-slate-500">Not available.</p>
      )}
    </div>
  );
}

function TextBox({ title, content }: { title: string; content?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
        {content || "Not available."}
      </p>
    </div>
  );
}