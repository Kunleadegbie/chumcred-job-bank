"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { FileText, Sparkles } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type CVReview = {
  id: string;
  score: number | null;
  strengths: string | null;
  weaknesses: string | null;
  recommendations: string | null;
  created_at: string | null;
};

export default function AICVReviewPage() {
  const [userId, setUserId] = useState("");
  const [reviews, setReviews] = useState<CVReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");

  async function loadReviews(currentUserId: string) {
    const { data, error } = await supabaseBrowser
      .from("cv_reviews")
      .select("id,score,strengths,weaknesses,recommendations,created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (error) {
      setMessage(error.message);
      return;
    }

    setReviews((data || []) as CVReview[]);
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
      await loadReviews(user.id);
      setLoading(false);
    }

    init();
  }, []);

  async function runReview() {
    if (!userId) return;

    setReviewing(true);
    setMessage("");

    try {
      const response = await fetch("/api/cv-review", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to review CV.");
        setReviewing(false);
        return;
      }

      await loadReviews(userId);
      setMessage("CV review completed successfully.");
    } catch {
      setMessage("Unable to reach AI CV Review.");
    }

    setReviewing(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p className="text-slate-600">Loading AI CV Review...</p>
      </main>
    );
  }

  const latestReview = reviews[0];

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <FileText size={32} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              AI CV Review
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Review Your CV
            </h1>

            <p className="mt-2 text-slate-600">
              Get a CV score, strengths, weaknesses and practical improvement
              recommendations based on your uploaded resume.
            </p>
          </div>
        </div>

        {message && (
          <div
            className={`mt-6 rounded-xl p-4 text-sm font-semibold ${
              message.includes("successfully")
                ? "bg-emerald-50 text-emerald-700"
                : "bg-red-50 text-red-700"
            }`}
          >
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-wrap gap-3">
          <button
            onClick={runReview}
            disabled={reviewing}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {reviewing ? "Reviewing CV..." : "Run AI CV Review"}
          </button>

          <Link
            href="/profile/resume"
            className="rounded-xl border px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Upload / Replace Resume
          </Link>
        </div>
      </section>

      {latestReview && (
        <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Latest Review
          </p>

          <div className="mt-5 flex items-center gap-5">
            <div className="rounded-3xl bg-blue-50 px-8 py-6 text-center text-blue-700">
              <p className="text-5xl font-bold">{latestReview.score || 0}</p>
              <p className="mt-1 text-sm font-semibold">CV Score</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                AI Review Summary
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                {latestReview.created_at
                  ? new Date(latestReview.created_at).toLocaleString()
                  : ""}
              </p>
            </div>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <ReviewBox
              title="Strengths"
              content={latestReview.strengths}
              color="emerald"
            />

            <ReviewBox
              title="Weaknesses"
              content={latestReview.weaknesses}
              color="amber"
            />

            <ReviewBox
              title="Recommendations"
              content={latestReview.recommendations}
              color="blue"
            />
          </div>
        </section>
      )}

      <section className="mt-10 space-y-5">
        <h2 className="text-2xl font-bold text-slate-900">Previous Reviews</h2>

        {reviews.length === 0 ? (
          <div className="rounded-3xl border bg-white p-6 text-slate-600 shadow-sm">
            No CV reviews yet. Click “Run AI CV Review” to generate your first
            review.
          </div>
        ) : (
          reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-3xl border bg-white p-6 shadow-sm"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-lg font-bold text-slate-900">
                    CV Score: {review.score || 0}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {review.created_at
                      ? new Date(review.created_at).toLocaleString()
                      : ""}
                  </p>
                </div>

                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                  AI Review
                </span>
              </div>
            </div>
          ))
        )}
      </section>
    </main>
  );
}

function ReviewBox({
  title,
  content,
  color,
}: {
  title: string;
  content: string | null;
  color: "emerald" | "amber" | "blue";
}) {
  const colorClass =
    color === "emerald"
      ? "bg-emerald-50 text-emerald-700"
      : color === "amber"
      ? "bg-amber-50 text-amber-700"
      : "bg-blue-50 text-blue-700";

  return (
    <div className={`rounded-2xl p-5 ${colorClass}`}>
      <h3 className="font-bold">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-6">{content}</p>
    </div>
  );
}