"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  MapPin,
  Target,
  Briefcase,
  Sparkles,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";


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

export default function RecommendationDetailPage() {
  const params = useParams();
  const jobId = params?.id as string;

  const [job, setJob] = useState<RecommendedJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecommendation();
  }, [jobId]);

  async function loadRecommendation() {
    try {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const response = await fetch(
        "/api/job-recommendation-history",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user_id: user.id,
          }),
        }
      );

      const data = await response.json();

      const recommendation =
        (data.recommendations || []).find(
          (r: RecommendedJob) =>
            r.job_id === jobId
        );

      setJob(recommendation || null);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        Loading recommendation...
      </main>
    );
  }

  if (!job) {
    return (
      <main className="max-w-6xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold">
          Recommendation not found
        </h1>

        <Link
          href="/recommended-jobs"
          className="text-blue-600 mt-4 inline-block"
        >
          Back to Recommendations
        </Link>
      </main>
    );
  }

  return (
    <main className="max-w-6xl mx-auto px-6 py-12">

      <Link
        href="/recommended-jobs"
        className="inline-flex items-center gap-2 text-blue-600 font-semibold"
      >
        <ArrowLeft size={18} />
        Back to Recommendations
      </Link>

      <div className="mt-8 rounded-3xl bg-slate-950 text-white p-8">

        <p className="uppercase tracking-widest text-blue-300 text-sm font-semibold">
          Recommendation Detail
        </p>

        <h1 className="text-4xl font-bold mt-3">
          {job.title}
        </h1>

        <div className="mt-4 flex flex-wrap gap-5 text-slate-300">

          <div className="flex items-center gap-2">
            <Building2 size={16} />
            {job.company_name || "Company not stated"}
          </div>

          <div className="flex items-center gap-2">
            <MapPin size={16} />
            {job.location_display || job.country}
          </div>

          <div className="flex items-center gap-2">
            <Briefcase size={16} />
            {job.work_type}
          </div>

        </div>

      </div>

      <div className="mt-8 grid lg:grid-cols-3 gap-6">

        <div className="lg:col-span-2 space-y-6">

          <div className="rounded-3xl border bg-white p-6">

            <h2 className="text-xl font-bold">
              Recommendation Summary
            </h2>

            <p className="mt-4 text-slate-700 leading-8">
              {job.summary}
            </p>

          </div>

          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" />
              <h2 className="font-bold text-xl">
                Matched Keywords
              </h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.matched_keywords?.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>

          </div>

          <div className="rounded-3xl border bg-white p-6">

            <div className="flex items-center gap-2">
              <AlertTriangle className="text-amber-600" />
              <h2 className="font-bold text-xl">
                Missing Keywords
              </h2>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.missing_keywords?.map((keyword) => (
                <span
                  key={keyword}
                  className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-sm"
                >
                  {keyword}
                </span>
              ))}
            </div>

          </div>

        </div>

        <div>

          <div className="rounded-3xl border bg-white p-6 text-center">

            <Target
              size={42}
              className="mx-auto text-blue-600"
            />

            <div className="mt-4 text-6xl font-bold text-blue-600">
              {job.match_score}%
            </div>

            <div className="mt-2 text-slate-600">
              Fit Score
            </div>

          </div>

          <div className="mt-6 space-y-3">

            <Link
              href={`/jobs/${job.job_id}`}
              className="block w-full rounded-xl bg-slate-900 text-white px-5 py-3 text-center font-semibold"
            >
              View Job
            </Link>

            <Link
              href={`/ai-match-score?job_id=${job.job_id}`}
              className="block w-full rounded-xl border px-5 py-3 text-center font-semibold"
            >
              Analyze Match
            </Link>

            <Link
              href={`/interview-iq?role=${encodeURIComponent(job.title)}`}
              className="block w-full rounded-xl border px-5 py-3 text-center font-semibold"
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

      </div>

    </main>
  );
}