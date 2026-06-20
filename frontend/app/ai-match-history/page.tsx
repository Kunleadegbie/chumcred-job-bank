"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Target, Briefcase, CalendarDays } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type MatchResult = {
  match_score?: number;
  recommendation?: string;
  summary?: string;
  strengths?: string[];
  gaps?: string[];
  missing_keywords?: string[];
  improvement_actions?: string[];
};

type MatchHistory = {
  id: string;
  job_id: string | null;
  job_title: string | null;
  company_name: string | null;
  match_score: number | null;
  result: MatchResult | null;
  created_at: string;
};

export default function AIMatchHistoryPage() {
  const [history, setHistory] = useState<MatchHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const { data: userData } = await supabaseBrowser.auth.getUser();
        const user = userData.user;

        if (!user) {
          window.location.href = "/login";
          return;
        }

        const response = await fetch("/api/ai-match-history", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status === "error") {
          setMessage(data.message || data.error || "Unable to load AI match history.");
        } else {
          setHistory((data.history || []) as MatchHistory[]);
        }
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load AI match history.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  const totalMatches = history.length;

  const scores = history
    .map((item) => item.match_score || item.result?.match_score || 0)
    .filter((score) => score > 0);

  const averageScore =
    scores.length > 0
      ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length)
      : 0;

  const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

  const above80 = scores.filter((score) => score >= 80).length;

  const below50 = scores.filter((score) => score < 50).length;

  const trendData = [...history]
    .reverse()
    .map((item) => {
      const score = item.match_score || item.result?.match_score || 0;

      return {
        id: item.id,
        label: new Date(item.created_at).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
        score,
        jobTitle: item.job_title || "Untitled Job",
      };
    })
    .filter((item) => item.score > 0);

  const maxTrendScore =
    trendData.length > 0
      ? Math.max(...trendData.map((item) => item.score))
      : 100;
  
  const latestScore = scores.length > 0 ? scores[0] : 0;

  const readinessScore =
    scores.length > 0
      ? Math.round((averageScore * 0.5) + (highestScore * 0.3) + (latestScore * 0.2))
      : 0;

  const readinessLabel =
    readinessScore >= 80
      ? "Ready to Apply"
      : readinessScore >= 60
        ? "Almost Ready"
        : "Needs Improvement";

  const readinessMessage =
    readinessScore >= 80
      ? "Your profile is showing strong alignment with recent job opportunities."
      : readinessScore >= 60
        ? "You are close, but should improve keywords, role fit and gap areas before applying."
        : "Your CV needs stronger alignment with target job requirements before applying.";
  
  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-slate-600">Loading AI Match History...</p>
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
              AI Match History
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Your Previous Job Match Results
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Review jobs you analyzed, your match scores, strengths, gaps and improvement actions.
            </p>
          </div>
        </div>
      </section>
      
      <section className="mt-8 grid gap-5 md:grid-cols-5">
        <DashboardCard title="Total Matches" value={totalMatches} />
        <DashboardCard title="Average Score" value={`${averageScore}%`} />
        <DashboardCard title="Highest Score" value={`${highestScore}%`} />
        <DashboardCard title="Above 80%" value={above80} />
        <DashboardCard title="Below 50%" value={below50} />
      </section>
      
      {trendData.length > 0 && (
        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Match Score Trend
        </p>
        <h2 className="mt-2 text-2xl font-bold text-slate-900">
          Your AI Match Progress Over Time
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          See how your match scores are changing across analyzed jobs.
        </p>
      </div>
    </div>

    <div className="mt-8 flex h-72 items-end gap-4 overflow-x-auto border-b border-slate-200 pb-4">
      {trendData.map((item) => {
        const height = Math.max(
          12,
          Math.round((item.score / maxTrendScore) * 220)
        );

        return (
          <div
            key={item.id}
            className="flex min-w-[80px] flex-col items-center justify-end"
            title={`${item.jobTitle}: ${item.score}%`}
          >
            <p className="mb-2 text-sm font-bold text-blue-700">
              {item.score}%
            </p>

            <div
              className="w-10 rounded-t-xl bg-blue-600"
              style={{ height: `${height}px` }}
            />

            <p className="mt-3 text-xs font-semibold text-slate-600">
              {item.label}
            </p>
          </div>
        );
      })}
    </div>
  </section>
)}

      <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Application Readiness Score
        </p>

        <div className="mt-4 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-bold text-slate-900">
        {readinessLabel}
           </h2>

      <p className="mt-3 max-w-2xl text-slate-600">
        {readinessMessage}
      </p>
    </div>

    <div className="rounded-3xl bg-blue-50 px-8 py-6 text-center text-blue-700">
      <p className="text-5xl font-bold">{readinessScore}%</p>
      <p className="mt-1 text-sm font-semibold">Readiness Score</p>
    </div>
  </div>

  <div className="mt-6 h-4 overflow-hidden rounded-full bg-slate-100">
    <div
      className="h-full rounded-full bg-blue-600"
      style={{ width: `${readinessScore}%` }}
    />
  </div>
</section>

      {message && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {message}
        </div>
      )}

      {history.length === 0 ? (
        <section className="mt-8 rounded-3xl border bg-white p-8 text-center shadow-sm">
          <Target className="mx-auto h-12 w-12 text-slate-400" />
          <h2 className="mt-4 text-2xl font-bold text-slate-900">
            No AI Match results yet
          </h2>
          <p className="mt-2 text-slate-600">
            Analyze a job match first to see your history here.
          </p>
          <Link
            href="/ai-match-score"
            className="mt-5 inline-block rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Analyze Match
          </Link>
        </section>
      ) : (
        <section className="mt-8 space-y-5">
          {history.map((item) => (
            <div
              key={item.id}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                    AI Match Result
                  </p>

                  <h2 className="mt-2 text-2xl font-bold text-slate-900">
                    {item.job_title || "Untitled Job"}
                  </h2>

                  <div className="mt-3 flex flex-wrap gap-4 text-sm text-slate-600">
                    <span className="flex items-center gap-2">
                      <Briefcase size={16} />
                      {item.company_name || "Company not stated"}
                    </span>

                    <span className="flex items-center gap-2">
                      <CalendarDays size={16} />
                      {new Date(item.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="rounded-2xl bg-blue-50 px-6 py-4 text-center text-blue-700">
                  <p className="text-4xl font-bold">
                    {item.match_score || item.result?.match_score || 0}%
                  </p>
                  <p className="mt-1 text-xs font-semibold">Match Score</p>
                </div>
              </div>

              <p className="mt-5 text-lg font-semibold text-slate-700">
                {item.result?.recommendation || "No recommendation available"}
              </p>

              <p className="mt-3 leading-7 text-slate-600">
                {item.result?.summary || "No summary available."}
              </p>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <ResultBox title="Strengths" items={item.result?.strengths} />
                <ResultBox title="Gaps" items={item.result?.gaps} />
                <ResultBox title="Missing Keywords" items={item.result?.missing_keywords} />
                <ResultBox title="Improvement Actions" items={item.result?.improvement_actions} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {item.job_id && (
                  <Link
                    href={`/ai-match-score?job_id=${item.job_id}`}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Re-analyze / View
                  </Link>
                )}

                <Link
                  href="/ai-match-score"
                  className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                >
                  Analyze Another Job
                </Link>
              </div>
            </div>
          ))}
        </section>
      )}
    </main>
  );
}

function ResultBox({ title, items }: { title: string; items?: string[] }) {
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

function DashboardCard({
  title,
  value,
}: {
  title: string;
  value: string | number;
}) {
  return (
    <div className="rounded-2xl border bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-slate-500">{title}</p>
      <p className="mt-3 text-3xl font-bold text-blue-700">{value}</p>
    </div>
  );
}