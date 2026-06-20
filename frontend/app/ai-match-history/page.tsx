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
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data, error } = await supabaseBrowser
        .from("ai_match_results")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        setMessage(error.message || "Unable to load AI match history.");
      } else {
        setHistory((data || []) as MatchHistory[]);
      }

      setLoading(false);
    }

    init();
  }, []);

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
                <ResultBox
                  title="Missing Keywords"
                  items={item.result?.missing_keywords}
                />
                <ResultBox
                  title="Improvement Actions"
                  items={item.result?.improvement_actions}
                />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                {item.job_id && (
                  <Link
                    href={`/ai-match-score?job_id=${item.job_id}`}
                    className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    Re-analyze
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