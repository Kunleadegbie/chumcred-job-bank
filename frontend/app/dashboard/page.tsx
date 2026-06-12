"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Briefcase, Heart, FileText, UserCircle, LogOut } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type UserProfile = {
  full_name?: string;
  email?: string;
  country?: string;
  role?: string;
};

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [savedJobsCount, setSavedJobsCount] = useState(0);
  const [profile, setProfile] = useState<UserProfile | null>(null);

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
        country: profileData?.country || user.user_metadata?.country || "Not stated",
        role: profileData?.role || "applicant",
      });

      const { count } = await supabaseBrowser
        .from("saved_jobs")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      setSavedJobsCount(count || 0);
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
            Manage your saved jobs, applications, resume and profile.
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
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Saved Jobs</p>
              <h2 className="mt-2 text-4xl font-bold text-slate-900">
                {savedJobsCount}
              </h2>
            </div>
            <div className="rounded-2xl bg-red-50 p-3 text-red-700">
              <Heart size={24} />
            </div>
          </div>

          <Link
            href="/saved-jobs"
            className="mt-5 inline-block text-sm font-semibold text-blue-700"
          >
            View saved jobs →
          </Link>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Applications</p>
              <h2 className="mt-2 text-4xl font-bold text-slate-900">0</h2>
            </div>
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
              <Briefcase size={24} />
            </div>
          </div>

          <p className="mt-5 text-sm text-slate-500">
            Application tracking will appear here soon.
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Resume Status</p>
              <h2 className="mt-2 text-lg font-bold text-slate-900">
                Not Uploaded
              </h2>
            </div>
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-700">
              <FileText size={24} />
            </div>
          </div>

          <Link
            href="/profile/resume"
            className="mt-5 inline-block text-sm font-semibold text-blue-700"
          >
            Upload resume →
          </Link>
        </div>

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

          <p className="mt-5 text-sm text-slate-600">
            {profile?.email}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {profile?.country}
          </p>
        </div>
      </div>

      <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold text-slate-900">Quick Actions</h2>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/jobs"
            className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Browse Jobs
          </Link>

          <Link
            href="/saved-jobs"
            className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Saved Jobs
          </Link>

          <Link
            href="/my-applications"
            className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            My Applications
          </Link>

          <Link
            href="/profile/resume"
            className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Upload Resume
          </Link>
          <Link
            href="/ai-career-coach"
            className="rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50">
            AI Career Coach
          </Link>
        </div>
      </section>
    </main>
  );
}