import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";
import {
  Briefcase,
  CheckCircle2,
  Archive,
  MousePointerClick,
  Star,
  ListChecks,
} from "lucide-react";

export const dynamic = "force-dynamic";

async function getAdminStats() {
  const [totalJobs, activeJobs, archivedJobs, featuredJobs, applyClicks] =
    await Promise.all([
      supabase.from("jobs").select("id", { count: "exact", head: true }),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("status", "archived"),
      supabase
        .from("jobs")
        .select("id", { count: "exact", head: true })
        .eq("is_featured", true),
      supabase
        .from("job_application_clicks")
        .select("id", { count: "exact", head: true }),
    ]);

  return {
    totalJobs: totalJobs.count || 0,
    activeJobs: activeJobs.count || 0,
    archivedJobs: archivedJobs.count || 0,
    featuredJobs: featuredJobs.count || 0,
    applyClicks: applyClicks.count || 0,
  };
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{title}</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">{value}</h2>
        </div>

        <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">{icon}</div>
      </div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const stats = await getAdminStats();

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Admin Dashboard
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Chumcred Job Bank Admin
        </h1>

        <p className="mt-3 text-slate-600">
          Monitor jobs, applications, featured listings and portal activity.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-5">
        <StatCard title="Total Jobs" value={stats.totalJobs} icon={<Briefcase size={24} />} />
        <StatCard title="Active Jobs" value={stats.activeJobs} icon={<CheckCircle2 size={24} />} />
        <StatCard title="Archived Jobs" value={stats.archivedJobs} icon={<Archive size={24} />} />
        <StatCard title="Featured Jobs" value={stats.featuredJobs} icon={<Star size={24} />} />
        <StatCard title="Apply Clicks" value={stats.applyClicks} icon={<MousePointerClick size={24} />} />
      </div>

      <section className="mt-10 grid gap-5 md:grid-cols-4">
        <Link href="/admin/jobs" className="rounded-3xl border bg-white p-6 shadow-sm hover:shadow-md">
          <h2 className="text-xl font-bold text-slate-900">Manage Jobs</h2>
          <p className="mt-2 text-sm text-slate-600">
            Review, hide, archive and feature job listings.
          </p>
        </Link>

        <Link href="/admin/sources" className="rounded-3xl border bg-white p-6 shadow-sm hover:shadow-md">
          <h2 className="text-xl font-bold text-slate-900">Job Sources</h2>
          <p className="mt-2 text-sm text-slate-600">
            Monitor job APIs, sources and fetching performance.
          </p>
        </Link>

        <Link href="/admin/clicks" className="rounded-3xl border bg-white p-6 shadow-sm hover:shadow-md">
          <h2 className="text-xl font-bold text-slate-900">Click Analytics</h2>
          <p className="mt-2 text-sm text-slate-600">
            See which jobs applicants are clicking most.
          </p>
        </Link>

        <Link href="/admin/logs" className="rounded-3xl border bg-white p-6 shadow-sm hover:shadow-md">
          <div className="mb-3 inline-flex rounded-2xl bg-blue-50 p-3 text-blue-700">
            <ListChecks size={22} />
          </div>
          <h2 className="text-xl font-bold text-slate-900">Fetch Logs</h2>
          <p className="mt-2 text-sm text-slate-600">
            View each automated job fetch run, duplicates, errors and status.
          </p>
        </Link>
      </section>
    </main>
  );
}