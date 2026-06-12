"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Building2, Briefcase, PlusCircle, ListChecks } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function EmployerDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [companyName, setCompanyName] = useState("Employer");
  const [employerId, setEmployerId] = useState<string | null>(null);
  const [jobsCount, setJobsCount] = useState(0);

  useEffect(() => {
    async function loadDashboard() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employer } = await supabaseBrowser
        .from("employers")
        .select("id,company_name")
        .eq("user_id", user.id)
        .maybeSingle();

      if (employer) {
        setEmployerId(employer.id);
        setCompanyName(employer.company_name || "Employer");

        const { count } = await supabaseBrowser
          .from("employer_jobs")
          .select("id", { count: "exact", head: true })
          .eq("employer_id", employer.id);

        setJobsCount(count || 0);
      }

      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading employer dashboard...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Employer Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Welcome, {companyName}
        </h1>

        <p className="mt-3 text-slate-600">
          Manage your company profile and job postings.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <Building2 className="text-blue-700" />
          <p className="mt-4 text-sm text-slate-500">Company Profile</p>
          <h2 className="mt-2 text-xl font-bold">
            {employerId ? "Created" : "Not Created"}
          </h2>
          <Link href="/employer/profile" className="mt-4 inline-block text-sm font-semibold text-blue-700">
            Manage profile →
          </Link>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <Briefcase className="text-blue-700" />
          <p className="mt-4 text-sm text-slate-500">Posted Jobs</p>
          <h2 className="mt-2 text-4xl font-bold">{jobsCount}</h2>
          <Link href="/employer/jobs" className="mt-4 inline-block text-sm font-semibold text-blue-700">
            View jobs →
          </Link>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <ListChecks className="text-blue-700" />
          <p className="mt-4 text-sm text-slate-500">Plan</p>
          <h2 className="mt-2 text-xl font-bold">Free</h2>
          <p className="mt-2 text-sm text-slate-600">Paid posting comes next.</p>
        </div>
      </div>

      <section className="mt-10 rounded-3xl border bg-white p-8 shadow-sm">
        <h2 className="text-2xl font-bold">Quick Actions</h2>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/employer/profile" className="rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50">
            Company Profile
          </Link>

          <Link href="/employer/post-job" className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700">
            <PlusCircle size={18} />
            Post Job
          </Link>

          <Link href="/employer/jobs" className="rounded-xl border px-5 py-3 font-semibold hover:bg-slate-50">
            Manage Jobs
          </Link>
        </div>
      </section>
    </main>
  );
}