"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Briefcase,
  Heart,
  FileText,
  UserCircle,
  LogOut,
  Target,
  Sparkles,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type UserProfile = {
  full_name?: string;
  email?: string;
  country?: string;
  role?: string;
};

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

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [recommendationsLoading, setRecommendationsLoading] = useState(true);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedJob[]>([]);
  const [recommendationMessage, setRecommendationMessage] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profileData } = await supabaseBrowser
        .from("profiles")
        .select("full_name,email,country,role")
        .eq("id", user.id)
        .maybeSingle();

      setProfile({
        full_name:
          profileData?.full_name ||
          user.user_metadata?.full_name ||
          "Candidate",
        email: profileData?.email || user.email || "",
        country:
          profileData?.country || user.user_metadata?.country || "Not stated",
        role: profileData?.role || "applicant",
      });

      const { count } = await supabaseBrowser
        .from("saved_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setSavedJobsCount(count || 0);

      try {
        const response = await fetch("/api/job-recommendation-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            user_id: user.id,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status === "error") {
          setRecommendationMessage(
            data.message || data.error || "Unable to load saved recommendations."
          );
        } else {
          const savedRecommendations = (data.recommendations || []) as RecommendedJob[];
          setRecommendations(savedRecommendations.slice(0, 5));
        }
      } catch {
        setRecommendationMessage("Unable to load saved recommendations.");
      } finally {
        setRecommendationsLoading(false);
      }

      setLoading(false);
    }

    loadDashboard();
  }, [router]);

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    router.push("/");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Candidate Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Welcome, {profile?.full_name}
          </h1>

          <p className="mt-3 text-slate-600">
            Manage your saved jobs, applications, resume and AI career tools.
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Saved Jobs"
          value={savedJobsCount}
          icon={<Heart size={24} />}
          iconClass="bg-red-50 text-red-700"
          link="/saved-jobs"
          linkText="View saved jobs →"
        />

        <DashboardCard
          title="Applications"
          value="0"
          icon={<Briefcase size={24} />}
          iconClass="bg-blue-50 text-blue-700"
          note="Application tracking will appear here soon."
        />

        <DashboardCard
          title="Resume Status"
          value="Check Resume"
          icon={<FileText size={24} />}
          iconClass="bg-amber-50 text-amber-700"
          link="/profile/resume"
          linkText="Upload resume →"
          smallValue
        />

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Profile</p>
              <h2 className="mt-2 text-lg font-bold capitalize text-slate-900">
                {profile?.role || "Applicant"}
              </h2>
            </div>
            <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
              <UserCircle size={24} />
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-600">{profile?.email}</p>
          <p className="mt-1 text-sm text-slate-500">{profile?.country}</p>
        </div>
      </div>

      <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Smart Job Recommendations
            </p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">
              Top 5 Best Fit Jobs
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Saved recommendations ranked against your CV.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/recommended-jobs"
              className="rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white hover:bg-blue-700"
            >
              View All Recommendations
            </Link>

            <Link
              href="/recommended-jobs?refresh=1"
              className="rounded-xl border px-5 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              Refresh
            </Link>
          </div>
        </div>

        {recommendationsLoading ? (
          <p className="mt-6 text-slate-600">Loading best fit jobs...</p>
        ) : recommendationMessage ? (
          <div className="mt-6 rounded-2xl bg-amber-50 p-5 text-amber-800">
            <p className="font-semibold">{recommendationMessage}</p>
            <Link
              href="/profile/resume"
              className="mt-3 inline-block text-sm font-bold text-amber-900"
            >
              Upload or extract resume →
            </Link>
          </div>
        ) : recommendations.length === 0 ? (
          <div className="mt-6 rounded-2xl border border-dashed p-8 text-center">
            <Target className="mx-auto h-10 w-10 text-slate-400" />
            <h3 className="mt-3 text-xl font-bold text-slate-900">
              No recommendations yet
            </h3>
            <p className="mt-2 text-slate-600">
              Upload your CV and generate recommendations to see your best-fit jobs.
            </p>
            <div className="mt-4 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/profile/resume"
                className="rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Upload CV
              </Link>
              <Link
                href="/recommended-jobs?refresh=1"
                className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
              >
                Generate Recommendations
              </Link>
            </div>
          </div>
        ) : (
          <div className="mt-6 grid gap-5">
            {recommendations.map((job) => (
              <div
                key={job.job_id}
                className="rounded-2xl border bg-slate-50 p-5"
              >
                <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-blue-700">
                      <Sparkles size={16} />
                      <p className="text-xs font-semibold uppercase tracking-widest">
                        Recommended job
                      </p>
                    </div>

                    <h3 className="mt-2 text-xl font-bold text-slate-900">
                      {job.title}
                    </h3>

                    <p className="mt-1 text-sm text-slate-600">
                      {job.company_name || "Company not stated"}
                    </p>

                    <p className="mt-1 text-sm text-slate-500">
                      {job.location_display || job.country || "Location not stated"}
                      {job.work_type ? ` • ${job.work_type}` : ""}
                      {job.employment_type ? ` • ${job.employment_type}` : ""}
                    </p>

                    <p className="mt-3 text-sm leading-6 text-slate-700">
                      {job.summary}
                    </p>
                  </div>

                  <div className="rounded-2xl bg-blue-50 px-5 py-4 text-center text-blue-700">
                    <p className="text-3xl font-bold">{job.match_score}%</p>
                    <p className="text-xs font-semibold">Fit Score</p>
                  </div>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {job.matched_keywords?.slice(0, 6).map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-600"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>

                <div className="mt-5 flex flex-wrap gap-3">
                  <Link
                    href={`/recommended-jobs/${job.job_id}`}
                    className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                  >
                    View Recommendation
                  </Link>

                  <Link
                    href={`/jobs/${job.job_id}`}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                  >
                    View Job
                  </Link>

                  <Link
                    href={`/ai-match-score?job_id=${job.job_id}`}
                    className="rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                  >
                    Analyze Match
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
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>

        <div className="mt-6 flex flex-wrap gap-3">
          <QuickLink href="/jobs" label="Browse Jobs" primary />
          <QuickLink href="/saved-jobs" label="Saved Jobs" />
          <QuickLink href="/my-applications" label="My Applications" />
          <QuickLink href="/profile/resume" label="Upload Resume" />
          <QuickLink href="/recommended-jobs" label="Recommended Jobs" />
          <QuickLink href="/ai-career-coach" label="AI Career Coach" />
          <QuickLink href="/ai-cv-review" label="AI CV Review" />
          <QuickLink href="/cv-intelligence" label="CV Intelligence Pro" />
          <QuickLink href="/interview-iq" label="InterviewIQ" />
          <QuickLink href="/ai-job-search" label="AI Global Job Search" />
          <QuickLink href="/ai-match-score" label="AI Match Score" />
          <QuickLink href="/ai-match-history" label="AI Match History" />
        </div>
      </section>
    </main>
  );
}

function DashboardCard({
  title,
  value,
  icon,
  iconClass,
  link,
  linkText,
  note,
  smallValue = false,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  iconClass: string;
  link?: string;
  linkText?: string;
  note?: string;
  smallValue?: boolean;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2
            className={
              smallValue
                ? "mt-2 text-lg font-bold text-slate-900"
                : "mt-2 text-4xl font-bold text-slate-900"
            }
          >
            {value}
          </h2>
        </div>
        <div className={`rounded-2xl p-3 ${iconClass}`}>{icon}</div>
      </div>

      {link && linkText ? (
        <Link
          href={link}
          className="mt-5 inline-block text-sm font-semibold text-blue-700"
        >
          {linkText}
        </Link>
      ) : (
        <p className="mt-5 text-sm text-slate-500">{note}</p>
      )}
    </div>
  );
}

function QuickLink({
  href,
  label,
  primary = false,
}: {
  href: string;
  label: string;
  primary?: boolean;
}) {
  return (
    <Link
      href={href}
      className={
        primary
          ? "rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          : "rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
      }
    >
      {label}
    </Link>
  );
}