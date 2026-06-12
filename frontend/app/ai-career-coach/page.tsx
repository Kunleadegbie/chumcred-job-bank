"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send, Sparkles } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type CoachMessage = {
  id: string;
  question: string;
  answer: string | null;
  created_at: string | null;
};

export default function AICareerCoachPage() {
  const [userId, setUserId] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<CoachMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [asking, setAsking] = useState(false);
  const [message, setMessage] = useState("");

  async function loadMessages(currentUserId: string) {
    const { data, error } = await supabaseBrowser
      .from("career_coach_messages")
      .select("id,question,answer,created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessages((data || []) as CoachMessage[]);
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
      await loadMessages(user.id);
      setLoading(false);
    }

    init();
  }, []);

  async function askCoach(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!question.trim() || !userId) return;

    setAsking(true);
    setMessage("");

    try {
      const response = await fetch("/api/career-coach", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          question,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to get career advice.");
        setAsking(false);
        return;
      }

      setQuestion("");
      await loadMessages(userId);
    } catch {
      setMessage("Unable to reach AI Career Coach.");
    }

    setAsking(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-slate-600">Loading AI Career Coach...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Sparkles size={32} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              AI Career Coach
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Ask Career Questions
            </h1>

            <p className="mt-2 text-slate-600">
              Get practical guidance based on your profile, skills and career goals.
            </p>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
            {message}
          </div>
        )}

        <form onSubmit={askCoach} className="mt-8 space-y-4">
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={4}
            placeholder="Example: What jobs fit my profile and what skills should I improve?"
            className="w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600"
          />

          <button
            type="submit"
            disabled={asking}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Send size={18} />
            {asking ? "Thinking..." : "Ask AI Career Coach"}
          </button>
        </form>
      </section>

      <section className="mt-10 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">Recent Guidance</h2>

        {messages.length === 0 ? (
          <div className="rounded-3xl border bg-white p-6 text-slate-600 shadow-sm">
            No career coach messages yet.
          </div>
        ) : (
          messages.map((item) => (
            <div key={item.id} className="rounded-3xl border bg-white p-6 shadow-sm">
              <p className="text-sm font-semibold text-blue-700">Question</p>
              <p className="mt-2 text-slate-800">{item.question}</p>

              <p className="mt-5 text-sm font-semibold text-emerald-700">
                AI Career Coach
              </p>

              <p className="mt-2 whitespace-pre-line text-slate-700">
                {item.answer}
              </p>

              <p className="mt-4 text-xs text-slate-400">
                {item.created_at
                  ? new Date(item.created_at).toLocaleString()
                  : ""}
              </p>
            </div>
          ))
        )}
      </section>
    </main>
  );
}