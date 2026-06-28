"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EnterpriseAccount = {
  id: string;
  name: string;
};

type ActivityLog = {
  id: string;
  enterprise_id: string;
  user_id: string | null;
  action: string;
  details: any;
  created_at: string;
};

export default function EnterpriseActivityPage() {
  const params = useParams();
  const enterpriseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [account, setAccount] = useState<EnterpriseAccount | null>(null);
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (enterpriseId) loadActivityPage();
  }, [enterpriseId]);

  async function loadActivityPage() {
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
      .select("id,name")
      .eq("id", enterpriseId)
      .maybeSingle();

    if (accountError || !accountData) {
      setMessage("Unable to load enterprise account.");
      setLoading(false);
      return;
    }

    const { data: logsData, error: logsError } = await supabaseBrowser
      .from("enterprise_activity_logs")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (logsError) {
      setMessage("Unable to load activity logs.");
      setLoading(false);
      return;
    }

    setAccount(accountData);
    setLogs(logsData || []);
    setLoading(false);
  }

  function formatAction(action: string) {
    return action
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading enterprise activity...</p>
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
                Enterprise Audit Trail
              </p>
              <h1 className="mt-3 text-4xl font-bold">
                Activity Logs {account?.name ? `— ${account.name}` : ""}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Review enterprise events, member actions, billing changes,
                invitations, and workspace activity.
              </p>
            </div>

            <Link
              href={`/enterprise/${enterpriseId}`}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Back to Workspace
            </Link>
          </div>

          {message && (
            <p className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <StatCard label="Total Logs" value={logs.length} />
          <StatCard
            label="Latest Activity"
            value={
              logs[0]?.created_at
                ? new Date(logs[0].created_at).toLocaleDateString()
                : "None"
            }
          />
          <StatCard label="Workspace" value={account?.name || "Enterprise"} />
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Recent Activity</h2>
              <p className="mt-1 text-sm text-slate-400">
                Showing latest 100 activity records.
              </p>
            </div>

            <button
              onClick={loadActivityPage}
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Refresh
            </button>
          </div>

          <div className="mt-6 space-y-4">
            {logs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
                <h3 className="text-xl font-bold">No activity yet</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Enterprise actions will appear here as members create records,
                  invite users, update billing, and use workspace features.
                </p>
              </div>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                >
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                    <div>
                      <p className="text-lg font-bold text-cyan-300">
                        {formatAction(log.action)}
                      </p>
                      <p className="mt-1 text-xs text-slate-400">
                        {new Date(log.created_at).toLocaleString()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        User: {log.user_id || "System / unknown"}
                      </p>
                    </div>

                    <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-200">
                      {log.action}
                    </span>
                  </div>

                  {log.details && Object.keys(log.details).length > 0 && (
                    <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-4">
                      <p className="mb-2 text-sm font-semibold text-slate-300">
                        Details
                      </p>
                      <pre className="whitespace-pre-wrap break-words text-xs leading-5 text-slate-300">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
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