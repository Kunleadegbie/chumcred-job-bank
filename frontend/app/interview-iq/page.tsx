"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Brain, Send, Sparkles } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type InterviewSession = {
  id: string;
  target_role: string | null;
  question: string | null;
  user_answer: string | null;
  feedback: string | null;
  score: number | null;
  created_at: string | null;
};

export default function InterviewIQPage() {
  const [userId, setUserId] = useState("");
  const [targetRole, setTargetRole] = useState("Business Analyst");
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);
  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadSessions(currentUserId: string) {
    const { data, error } = await supabaseBrowser
      .from("interview_iq_sessions")
      .select("id,target_role,question,user_answer,feedback,score,created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setMessage(error.message);
      return;
    }

    setSessions((data || []) as InterviewSession[]);
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);
      await loadSessions(user.id);
      setLoading(false);
    }

    init();
  }, []);

  async function startInterview() {
    if (!userId || !targetRole.trim()) return;

    setStarting(true);
    setMessage("");
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);

    try {
      const response = await fetch("/api/interview-iq/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate question.");
        setStarting(false);
        return;
      }

      setQuestion(data.question || "");
    } catch {
      setMessage("Unable to reach InterviewIQ question service.");
    }

    setStarting(false);
  }

  async function submitAnswer() {
    if (!userId || !targetRole || !question || !answer.trim()) {
      setMessage("Please enter your answer before submitting.");
      return;
    }

    setReviewing(true);
    setMessage("");
    setFeedback("");
    setScore(null);

    try {
      const response = await fetch("/api/interview-iq/review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          question,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to review answer.");
        setReviewing(false);
        return;
      }

      setFeedback(data.review?.feedback || "");
      setScore(data.review?.score || 0);
      await loadSessions(userId);
    } catch {
      setMessage("Unable to reach InterviewIQ review service.");
    }

    setReviewing(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-slate-600">Loading InterviewIQ...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-600 p-3">
            <Brain size={34} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              InterviewIQ
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Practice Job Interviews with AI
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Prepare for real interviews by answering AI-generated questions
              based on your target role and career profile.
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
        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-1">
          <h2 className="text-xl font-bold text-slate-900">Interview Setup</h2>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Target Role
          </label>

          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            placeholder="Example: Business Analyst"
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          />

          <button
            onClick={startInterview}
            disabled={starting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {starting ? "Generating Question..." : "Start Interview"}
          </button>

          <div className="mt-6 rounded-2xl bg-blue-50 p-4 text-sm text-blue-800">
            Tip: Use a role title close to the job you are applying for, such as
            Product Manager, Data Analyst, Project Manager or Sales Executive.
          </div>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">Current Question</h2>

          {question ? (
            <>
              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">
                  {question}
                </p>
              </div>

              <label className="mt-6 block text-sm font-semibold text-slate-700">
                Your Answer
              </label>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={7}
                placeholder="Type your interview answer here. Try to use Situation, Action and Result."
                className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600"
              />

              <button
                onClick={submitAnswer}
                disabled={reviewing}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Send size={18} />
                {reviewing ? "Reviewing Answer..." : "Submit Answer"}
              </button>
            </>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-slate-600">
              Enter a target role and click “Start Interview” to generate your
              first interview question.
            </div>
          )}
        </div>
      </section>

      {feedback && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            AI Interview Feedback
          </p>

          <div className="mt-5 flex items-center gap-5">
            <div className="rounded-3xl bg-blue-50 px-8 py-6 text-center text-blue-700">
              <p className="text-5xl font-bold">{score || 0}</p>
              <p className="mt-1 text-sm font-semibold">Score</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Feedback Summary
              </h2>
              <p className="mt-2 text-slate-600">
                Review your strengths and improvement areas before your real
                interview.
              </p>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
              {feedback}
            </p>
          </div>
        </section>
      )}

      <section className="mt-10">
        <h2 className="text-2xl font-bold text-slate-900">
          Previous Interview Practice
        </h2>

        {sessions.length === 0 ? (
          <div className="mt-5 rounded-3xl border bg-white p-6 text-slate-600 shadow-sm">
            No interview practice history yet.
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                      {session.target_role || "Interview Practice"}
                    </p>

                    <h3 className="mt-2 text-lg font-bold text-slate-900">
                      {session.question}
                    </h3>

                    <p className="mt-2 text-sm text-slate-500">
                      {session.created_at
                        ? new Date(session.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 px-5 py-3 text-center text-blue-700">
                    <p className="text-2xl font-bold">{session.score || 0}</p>
                    <p className="text-xs font-semibold">Score</p>
                  </div>
                </div>

                {session.feedback && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                      View feedback
                    </summary>

                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
                      {session.feedback}
                    </p>
                  </details>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}