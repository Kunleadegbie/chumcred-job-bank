"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Brain,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type CareerRoadmap = {
  next_30_days: string[];
  next_90_days: string[];
  next_6_months: string[];
  next_12_months: string[];
};

type SkillsGap = {
  technical_skills: string[];
  soft_skills: string[];
  tools: string[];
  certifications: string[];
};

type CareerIQReport = {
  career_health_score: number;
  employability_score: number;
  career_gap_score: number;
  promotion_readiness_score: number;
  career_risk: string;
  career_stage: string;
  best_fit_roles: string[];
  career_strengths: string[];
  career_weaknesses: string[];
  skills_gap: SkillsGap;
  recommended_certifications: string[];
  recommended_projects: string[];
  learning_recommendations: string[];
  career_roadmap: CareerRoadmap;
  promotion_advice: string;
  salary_growth_advice: string;
  executive_summary: string;
  next_best_actions: string[];
};

type CareerIQHistoryRow = {
  id: string;
  career_goal: string | null;
  analysis: CareerIQReport;
  career_health_score: number;
  employability_score: number;
  created_at: string;
};

export default function CareerIQPage() {
  const [userId, setUserId] = useState("");
  const [careerGoal, setCareerGoal] = useState("");
  const [report, setReport] = useState<CareerIQReport | null>(null);
  const [history, setHistory] = useState<CareerIQHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);
      await loadCareerIQHistory(user.id);
      setLoading(false);
    }

    init();
  }, []);

  async function loadCareerIQHistory(currentUserId: string) {
    const { data, error } = await supabaseBrowser
      .from("career_iq_history")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setMessage("Unable to load CareerIQ history.");
      return;
    }

    const rows = (data || []) as CareerIQHistoryRow[];
    setHistory(rows);

    if (rows.length > 0) {
      setReport(rows[0].analysis);
      setCareerGoal(rows[0].career_goal || "");
    }
  }

  async function generateCareerIQ() {
    if (!userId) return;

    setGenerating(true);
    setMessage("");

    try {
      const response = await fetch("/api/career-iq", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        cache: "no-store",
        body: JSON.stringify({
          user_id: userId,
          career_goal: careerGoal,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate CareerIQ report.");
        return;
      }

      setReport(data.career_iq || null);
      await loadCareerIQHistory(userId);
    } catch {
      setMessage("Unable to generate CareerIQ report.");
    } finally {
      setGenerating(false);
    }
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading CareerIQ...</p>
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
            <Brain size={34} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              CareerIQ
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              AI Career Intelligence Coach
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Diagnose your career readiness, identify gaps, and generate a practical roadmap for your next career move.
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
          <h2 className="text-xl font-bold text-slate-900">Career Goal</h2>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Target career goal
          </label>

          <textarea
            value={careerGoal}
            onChange={(e) => setCareerGoal(e.target.value)}
            rows={5}
            placeholder="Example: I want to become a Senior Business Analyst in the fintech sector within 12 months."
            className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600"
          />

          <button
            onClick={generateCareerIQ}
            disabled={generating}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {generating ? "Generating..." : "Generate CareerIQ Report"}
          </button>

          <div className="mt-5 rounded-2xl bg-blue-50 p-4 text-sm text-slate-700">
            CareerIQ uses your CV, CV Intelligence, InterviewIQ, AI Match Score, and job recommendations to produce one unified career report.
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          {!report ? (
            <div className="rounded-2xl border border-dashed p-10 text-center">
              <Target className="mx-auto h-12 w-12 text-slate-400" />
              <h2 className="mt-4 text-2xl font-bold text-slate-900">
                No CareerIQ report yet
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-slate-600">
                Enter your career goal and generate your personalized career intelligence report.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                Career Intelligence Report
              </p>

              <h2 className="mt-2 text-3xl font-bold text-slate-900">
                {report.career_stage || "Career Readiness Review"}
              </h2>

              <p className="mt-4 leading-7 text-slate-700">
                {report.executive_summary}
              </p>

              <div className="mt-6 grid gap-4 md:grid-cols-4">
                <ScoreCard title="Career Health" value={report.career_health_score} />
                <ScoreCard title="Employability" value={report.employability_score} />
                <ScoreCard title="Career Gap" value={report.career_gap_score} />
                <ScoreCard title="Promotion Readiness" value={report.promotion_readiness_score} />
              </div>

              <div className="mt-6 rounded-2xl bg-amber-50 p-5">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertTriangle size={18} />
                  <h3 className="font-bold">Career Risk: {report.career_risk}</h3>
                </div>
              </div>

              <div className="mt-6 grid gap-5 md:grid-cols-2">
                <ListPanel title="Best Fit Roles" items={report.best_fit_roles} />
                <ListPanel title="Career Strengths" items={report.career_strengths} />
                <ListPanel title="Career Weaknesses" items={report.career_weaknesses} warning />
                <ListPanel title="Next Best Actions" items={report.next_best_actions} />
              </div>

              <section className="mt-8 rounded-2xl bg-slate-50 p-6">
                <h3 className="text-xl font-bold text-slate-900">Skills Gap</h3>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <ListPanel title="Technical Skills" items={report.skills_gap.technical_skills} />
                  <ListPanel title="Soft Skills" items={report.skills_gap.soft_skills} />
                  <ListPanel title="Tools" items={report.skills_gap.tools} />
                  <ListPanel title="Certifications" items={report.skills_gap.certifications} />
                </div>
              </section>

              <section className="mt-8 rounded-2xl bg-blue-50 p-6">
                <h3 className="text-xl font-bold text-slate-900">Career Roadmap</h3>

                <div className="mt-5 grid gap-5 md:grid-cols-2">
                  <RoadmapPanel title="Next 30 Days" items={report.career_roadmap.next_30_days} />
                  <RoadmapPanel title="Next 90 Days" items={report.career_roadmap.next_90_days} />
                  <RoadmapPanel title="Next 6 Months" items={report.career_roadmap.next_6_months} />
                  <RoadmapPanel title="Next 12 Months" items={report.career_roadmap.next_12_months} />
                </div>
              </section>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <ListPanel title="Recommended Certifications" items={report.recommended_certifications} />
                <ListPanel title="Recommended Projects" items={report.recommended_projects} />
                <ListPanel title="Learning Recommendations" items={report.learning_recommendations} />
                <TextPanel title="Promotion Advice" content={report.promotion_advice} />
                <TextPanel title="Salary Growth Advice" content={report.salary_growth_advice} />
              </div>
            </div>
          )}
        </div>
      </section>

      {history.length > 0 && (
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">CareerIQ History</h2>

          <div className="mt-5 space-y-4">
            {history.map((row) => (
              <button
                key={row.id}
                onClick={() => {
                  setReport(row.analysis);
                  setCareerGoal(row.career_goal || "");
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className="w-full rounded-2xl border bg-slate-50 p-5 text-left hover:bg-blue-50"
              >
                <p className="font-bold text-slate-900">
                  {row.career_goal || "CareerIQ Report"}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Career Health: {row.career_health_score}% • Employability:{" "}
                  {row.employability_score}%
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  {new Date(row.created_at).toLocaleString()}
                </p>
              </button>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ScoreCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-2xl bg-blue-50 p-5 text-center text-blue-700">
      <p className="text-3xl font-bold">{value || 0}%</p>
      <p className="mt-1 text-xs font-semibold">{title}</p>
    </div>
  );
}

function ListPanel({
  title,
  items,
  warning = false,
}: {
  title: string;
  items: string[];
  warning?: boolean;
}) {
  return (
    <div className={warning ? "rounded-2xl bg-amber-50 p-5" : "rounded-2xl bg-slate-50 p-5"}>
      <h3 className="font-bold text-slate-900">{title}</h3>

      <ul className="mt-4 space-y-2">
        {items?.length ? (
          items.map((item) => (
            <li key={item} className="flex gap-2 text-sm text-slate-700">
              <CheckCircle size={16} className="mt-0.5 text-blue-700" />
              <span>{item}</span>
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">No data available.</li>
        )}
      </ul>
    </div>
  );
}

function RoadmapPanel({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-white p-5">
      <h4 className="font-bold text-slate-900">{title}</h4>

      <ol className="mt-4 list-decimal space-y-2 pl-5">
        {items?.length ? (
          items.map((item) => (
            <li key={item} className="text-sm text-slate-700">
              {item}
            </li>
          ))
        ) : (
          <li className="text-sm text-slate-500">No roadmap available.</li>
        )}
      </ol>
    </div>
  );
}

function TextPanel({ title, content }: { title: string; content: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
        {content || "No data available."}
      </p>
    </div>
  );
}