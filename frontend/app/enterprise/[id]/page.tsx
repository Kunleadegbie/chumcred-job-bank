"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EnterpriseAccount = {
  id: string;
  name: string;
  account_type: string;
  industry: string | null;
  country: string | null;
  website: string | null;
  contact_email: string | null;
  status: string;
  plan_name: string | null;
  billing_status: string | null;
  created_by: string | null;
  created_at: string;
};

type EnterpriseMember = {
  id: string;
  enterprise_id: string;
  user_id: string | null;
  role: string;
  status: string;
  invited_email: string | null;
  joined_at: string | null;
};

type ActivityLog = {
  id: string;
  action: string;
  details: any;
  created_at: string;
};

export default function EnterpriseDashboardPage() {
  const params = useParams();
  const enterpriseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<EnterpriseAccount | null>(null);
  const [members, setMembers] = useState<EnterpriseMember[]>([]);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (enterpriseId) loadEnterpriseDashboard();
  }, [enterpriseId]);

  async function loadEnterpriseDashboard() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: accountData, error: accountError } = await supabaseBrowser
      .from("enterprise_accounts")
      .select("*")
      .eq("id", enterpriseId)
      .maybeSingle();

    if (accountError || !accountData) {
      console.error(accountError);
      setMessage("Unable to load enterprise account.");
      setLoading(false);
      return;
    }

    const { data: membersData } = await supabaseBrowser
      .from("enterprise_members")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .order("created_at", { ascending: false });

    const { data: logsData } = await supabaseBrowser
      .from("enterprise_activity_logs")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .order("created_at", { ascending: false })
      .limit(10);

    setAccount(accountData);
    setMembers(membersData || []);
    setLogs(logsData || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading enterprise dashboard...</p>
      </main>
    );
  }

  if (!account) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-red-300">
          {message || "Enterprise account not found."}
        </p>
        <Link
          href="/enterprise/my-accounts"
          className="mt-5 inline-block text-cyan-300"
        >
          Back to enterprise accounts
        </Link>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Enterprise Workspace
              </p>
              <h1 className="mt-3 text-4xl font-bold">{account.name}</h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Manage enterprise members, billing readiness, activity, and
                TalentIQ intelligence tools for this workspace.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Badge label={account.account_type} />
                <Badge label={account.status} />
                <Badge label={account.plan_name || "Enterprise"} />
                <Badge label={account.billing_status || "pending"} />
              </div>
            </div>

            <Link
              href="/enterprise/my-accounts"
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              My Accounts
            </Link>
          </div>
        </section>

        {message && (
          <p className="mt-6 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200">
            {message}
          </p>
        )}

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Members" value={members.length} />
          <StatCard label="Account Type" value={account.account_type} />
          <StatCard label="Billing" value={account.billing_status || "pending"} />
          <StatCard label="Plan" value={account.plan_name || "Enterprise"} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <Link
            href={`/enterprise/${enterpriseId}/members`}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/60"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Team Access
            </p>
            <h2 className="mt-2 text-2xl font-bold">Members</h2>
            <p className="mt-2 text-sm text-slate-300">
              Invite team members, assign roles, and manage enterprise access.
            </p>
          </Link>

          <Link
            href={`/enterprise/${enterpriseId}/billing`}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/60"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Enterprise Plan
            </p>
            <h2 className="mt-2 text-2xl font-bold">Billing</h2>
            <p className="mt-2 text-sm text-slate-300">
              Review billing status, enterprise plans, and subscription
              readiness.
            </p>
          </Link>

          <Link
            href={`/enterprise/${enterpriseId}/activity`}
            className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/60"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
              Audit Trail
            </p>
            <h2 className="mt-2 text-2xl font-bold">Activity Logs</h2>
            <p className="mt-2 text-sm text-slate-300">
              Track account actions, system events, and enterprise activity.
            </p>
          </Link>

          <Link
            href="/institution-intelligence"
            className="rounded-3xl border border-emerald-400/30 bg-emerald-500/10 p-6 transition hover:-translate-y-1 hover:border-emerald-300"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-emerald-300">
              InstitutionAI
            </p>
            <h2 className="mt-2 text-2xl font-bold">
              Institution Intelligence
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Analyze graduate employability, skills gaps, curriculum readiness,
              and employer demand.
            </p>
          </Link>

          <Link
            href="/employer-ai"
            className="rounded-3xl border border-blue-400/30 bg-blue-500/10 p-6 transition hover:-translate-y-1 hover:border-blue-300"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
              EmployerAI
            </p>
            <h2 className="mt-2 text-2xl font-bold">Employer Intelligence</h2>
            <p className="mt-2 text-sm text-slate-300">
              Generate job intelligence, candidate analysis, and interview
              packs.
            </p>
          </Link>

          <Link
            href="/admin-intelligence"
            className="rounded-3xl border border-purple-400/30 bg-purple-500/10 p-6 transition hover:-translate-y-1 hover:border-purple-300"
          >
            <p className="text-sm font-semibold uppercase tracking-wide text-purple-300">
              AdminAI
            </p>
            <h2 className="mt-2 text-2xl font-bold">Admin Intelligence</h2>
            <p className="mt-2 text-sm text-slate-300">
              Review growth, revenue, risks, AI usage, and platform health.
            </p>
          </Link>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Enterprise Details</h2>

            <div className="mt-5 space-y-3 text-sm text-slate-300">
              <Detail label="Industry" value={account.industry || "Not stated"} />
              <Detail label="Country" value={account.country || "Not stated"} />
              <Detail label="Website" value={account.website || "Not stated"} />
              <Detail
                label="Contact Email"
                value={account.contact_email || "Not stated"}
              />
              <Detail
                label="Created"
                value={new Date(account.created_at).toLocaleString()}
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Recent Activity</h2>

            <div className="mt-5 space-y-3">
              {logs.length === 0 ? (
                <p className="text-sm text-slate-400">No activity yet.</p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <p className="font-semibold text-cyan-300">{log.action}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
      {label}
    </span>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
        {label}
      </p>
      <h2 className="mt-3 text-2xl font-bold">{value}</h2>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-white/10 pb-2">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-semibold text-slate-100">{value}</span>
    </div>
  );
}