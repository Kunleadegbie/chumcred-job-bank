"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles, Briefcase } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type JobMatch = {
  id: string;
  match_score: number | null;
  match_summary: string | null;
  strengths: string | null;
  gaps: string | null;
  jobs: {
    title: string;
    company_name: string | null;
    slug: string;
    location_display: string | null;
  } | null;
};

export default function JobMatchPage() {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState<JobMatch[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadMatches() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("job_matches")
        .select(
          `
          id,
          match_score,
          match_summary,
          strengths,
          gaps,
          jobs (
            title,
            company_name,
            slug,
            location_display
          )
        `
        )
        .eq("user_id", user.id)
        .order("match_score", { ascending: false })
        .limit(50);

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setMatches((data || []) as unknown as JobMatch[]);
      setLoading(false);
    }

    loadMatches();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading AI job matches...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          AI Job Match
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Recommended Jobs for You
        </h1>

        <p className="mt-3 text-slate-600">
          Jobs ranked based on your uploaded resume.
        </p>
      </div>

      {message && (
        <div className="mb-6 rounded-xl bg-red-50 p-4 text-sm text-red-700">
          {message}
        </div>
      )}

      {matches.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <Sparkles className="text-blue-700" size={32} />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No AI matches yet
          </h2>

          <p className="mt-2 text-slate-600">
            Upload your resume first, then run the job matching task from the
            backend.
          </p>

          <Link
            href="/profile/resume"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Upload Resume
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {matches.map((match) => (
            <div
              key={match.id}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-slate-500">
                    {match.jobs?.company_name || "Company not stated"}
                  </p>

                  <h2 className="mt-1 text-xl font-bold text-slate-900">
                    {match.jobs?.title || "Job"}
                  </h2>

                  <p className="mt-1 text-sm text-slate-600">
                    {match.jobs?.location_display || "Location not stated"}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 px-4 py-3 text-center text-blue-700">
                  <p className="text-2xl font-bold">
                    {Math.round(match.match_score || 0)}%
                  </p>
                  <p className="text-xs font-semibold">Match</p>
                </div>
              </div>

              <p className="mt-4 text-sm text-slate-700">
                {match.match_summary}
              </p>

              <div className="mt-4 rounded-2xl bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">
                  Strengths
                </p>
                <p className="mt-1 text-sm text-slate-700">{match.strengths}</p>
              </div>

              <div className="mt-3 rounded-2xl bg-amber-50 p-4">
                <p className="text-xs font-semibold uppercase text-amber-700">
                  Gaps
                </p>
                <p className="mt-1 text-sm text-slate-700">{match.gaps}</p>
              </div>

              {match.jobs?.slug && (
                <Link
                  href={`/jobs/${match.jobs.slug}`}
                  className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  <Briefcase size={16} />
                  View Job
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </main>
  );
}