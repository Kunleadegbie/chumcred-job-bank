"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { requireAdminUser } from "@/lib/admin-auth";

export default function AdminOperationsPage() {
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);
  const [message, setMessage] = useState("");

  const [aiUsageLogs, setAiUsageLogs] = useState<any[]>([]);
  const [payments, setPayments] = useState<any[]>([]);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [wallets, setWallets] = useState<any[]>([]);
  const [enterprises, setEnterprises] = useState<any[]>([]);
  const [activityLogs, setActivityLogs] = useState<any[]>([]);

  const [operationalNotes, setOperationalNotes] = useState("");

  useEffect(() => {
    initPage();
  }, []);

  async function initPage() {
    setLoading(true);
    setMessage("");

    const { user, isAdmin } = await requireAdminUser();

    if (!isAdmin || !user) {
      window.location.href = "/dashboard";
      return;
    }

    setUserId(user.id);
    await loadOperationsData();
    setLoading(false);
  }

  async function loadOperationsData() {
    const [
      usageResult,
      paymentResult,
      subscriptionResult,
      walletResult,
      enterpriseResult,
      activityResult,
    ] = await Promise.all([
      supabaseBrowser
        .from("ai_usage_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),

      supabaseBrowser
        .from("commercial_payments")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),

      supabaseBrowser
        .from("user_subscriptions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),

      supabaseBrowser
        .from("ai_credit_wallets")
        .select("*")
        .order("updated_at", { ascending: false })
        .limit(200),

      supabaseBrowser
        .from("enterprise_accounts")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),

      supabaseBrowser
        .from("enterprise_activity_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200),
    ]);

    if (usageResult.error) setMessage(usageResult.error.message);

    setAiUsageLogs(usageResult.data || []);
    setPayments(paymentResult.data || []);
    setSubscriptions(subscriptionResult.data || []);
    setWallets(walletResult.data || []);
    setEnterprises(enterpriseResult.data || []);
    setActivityLogs(activityResult.data || []);
  }

  const metrics = useMemo(() => {
    const successfulCalls = aiUsageLogs.filter(
      (log) => log.response_status === "success"
    );

    const failedCalls = aiUsageLogs.filter(
      (log) => log.response_status === "failed"
    );

    const totalCreditsUsed = aiUsageLogs.reduce(
      (sum, log) => sum + Number(log.credits_used || 0),
      0
    );

    const approvedRevenue = payments
      .filter((payment) => payment.status === "approved")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const pendingRevenue = payments
      .filter((payment) => payment.status === "pending")
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);

    const activeSubscriptions = subscriptions.filter(
      (sub) => sub.status === "active"
    );

    const pendingSubscriptions = subscriptions.filter(
      (sub) => sub.status === "pending"
    );

    const activeEnterprises = enterprises.filter(
      (enterprise) => enterprise.status === "active"
    );

    return {
      totalAiCalls: aiUsageLogs.length,
      successfulCalls: successfulCalls.length,
      failedCalls: failedCalls.length,
      totalCreditsUsed,
      approvedRevenue,
      pendingRevenue,
      activeSubscriptions: activeSubscriptions.length,
      pendingSubscriptions: pendingSubscriptions.length,
      enterpriseAccounts: enterprises.length,
      activeEnterprises: activeEnterprises.length,
      wallets: wallets.length,
      activityLogs: activityLogs.length,
    };
  }, [aiUsageLogs, payments, subscriptions, wallets, enterprises, activityLogs]);

  const topTools = useMemo(() => {
    const map: Record<string, number> = {};

    aiUsageLogs.forEach((log) => {
      const tool = log.tool_name || "unknown";
      map[tool] = (map[tool] || 0) + Number(log.credits_used || 0);
    });

    return Object.entries(map)
      .map(([tool, credits]) => ({ tool, credits }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 8);
  }, [aiUsageLogs]);

  async function generateOperationsAI() {
    if (!userId) return;

    setGenerating(true);
    setResult(null);
    setMessage("");

    const payload = {
      user_id: userId,
      platform_name: "TalentIQ",
      ai_usage_data: {
        total_ai_calls: metrics.totalAiCalls,
        successful_calls: metrics.successfulCalls,
        failed_calls: metrics.failedCalls,
        top_tools: topTools,
        recent_logs: aiUsageLogs.slice(0, 30),
      },
      credit_data: {
        total_credits_used: metrics.totalCreditsUsed,
        wallets_count: metrics.wallets,
        recent_wallets: wallets.slice(0, 30),
      },
      payment_data: {
        approved_revenue: metrics.approvedRevenue,
        pending_revenue: metrics.pendingRevenue,
        recent_payments: payments.slice(0, 30),
      },
      subscription_data: {
        active_subscriptions: metrics.activeSubscriptions,
        pending_subscriptions: metrics.pendingSubscriptions,
        recent_subscriptions: subscriptions.slice(0, 30),
      },
      enterprise_data: {
        enterprise_accounts: metrics.enterpriseAccounts,
        active_enterprises: metrics.activeEnterprises,
        recent_enterprises: enterprises.slice(0, 30),
        recent_activity: activityLogs.slice(0, 30),
      },
      error_data: {
        failed_ai_calls: aiUsageLogs
          .filter((log) => log.response_status === "failed")
          .slice(0, 30),
      },
      operational_notes: operationalNotes,
    };

    try {
      const res = await fetch("/api/operations-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data?.error || "OperationsAI request failed." });
        return;
      }

      setResult(data);
    } catch {
      setResult({ error: "Unable to connect to OperationsAI." });
    } finally {
      setGenerating(false);
    }
  }

  function formatMoney(amount: number) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading operations center...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-orange-300">
                TalentIQ OperationsAI
              </p>

              <h1 className="mt-3 text-4xl font-bold">
                AI Operations Center
              </h1>

              <p className="mt-3 max-w-3xl text-slate-300">
                Monitor AI usage, credit consumption, revenue, subscriptions,
                enterprise activity, failures, and launch readiness from one
                admin control room.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={loadOperationsData}
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Refresh Data
              </button>

              <Link
                href="/admin/commercial"
                className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
              >
                Commercial Center
              </Link>
            </div>
          </div>

          {message && (
            <p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          <StatCard label="AI Calls" value={metrics.totalAiCalls} />
          <StatCard label="Credits Used" value={metrics.totalCreditsUsed} />
          <StatCard
            label="Approved Revenue"
            value={formatMoney(metrics.approvedRevenue)}
          />
          <StatCard
            label="Pending Revenue"
            value={formatMoney(metrics.pendingRevenue)}
          />
          <StatCard
            label="Active Subscriptions"
            value={metrics.activeSubscriptions}
          />
          <StatCard
            label="Pending Subscriptions"
            value={metrics.pendingSubscriptions}
          />
          <StatCard
            label="Enterprise Accounts"
            value={metrics.enterpriseAccounts}
          />
          <StatCard label="Failed AI Calls" value={metrics.failedCalls} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">OperationsAI Commentary</h2>
            <p className="mt-2 text-sm text-slate-400">
              Generate executive-level interpretation of platform operations and
              recommended founder actions.
            </p>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-300">
                Operational Notes
              </span>
              <textarea
                value={operationalNotes}
                onChange={(e) => setOperationalNotes(e.target.value)}
                rows={7}
                placeholder="Add any notes about current launch issues, payment concerns, user complaints, or operational priorities."
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-orange-400"
              />
            </label>

            <button
              onClick={generateOperationsAI}
              disabled={generating}
              className="mt-6 w-full rounded-2xl bg-orange-500 px-6 py-4 font-bold text-white hover:bg-orange-400 disabled:opacity-50"
            >
              {generating
                ? "Generating Operations Intelligence..."
                : "Generate OperationsAI Report"}
            </button>

            <div className="mt-6">
              {result ? (
                <ResultView result={result} />
              ) : (
                <p className="rounded-2xl border border-dashed border-white/20 p-6 text-sm text-slate-400">
                  OperationsAI report will appear here.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <Panel title="Top AI Tools by Credit Use">
              {topTools.length === 0 ? (
                <EmptyState text="No AI usage data yet." />
              ) : (
                topTools.map((item) => (
                  <div
                    key={item.tool}
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <span className="font-bold text-orange-300">
                      {formatTitle(item.tool)}
                    </span>
                    <span className="rounded-xl bg-orange-500/10 px-4 py-2 text-sm font-bold text-orange-300">
                      {item.credits} credits
                    </span>
                  </div>
                ))
              )}
            </Panel>

            <Panel title="Recent AI Usage">
              {aiUsageLogs.length === 0 ? (
                <EmptyState text="No AI usage logs yet." />
              ) : (
                aiUsageLogs.slice(0, 8).map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-bold text-slate-100">
                        {formatTitle(log.tool_name || "AI Tool")}
                      </p>
                      <Badge label={log.response_status || "success"} />
                    </div>

                    <p className="mt-2 text-sm text-slate-400">
                      {log.action || "AI action"} •{" "}
                      {log.credits_used || 0} credits
                    </p>

                    <p className="mt-2 text-xs text-slate-500">
                      {new Date(log.created_at).toLocaleString()}
                    </p>
                  </div>
                ))
              )}
            </Panel>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-orange-300">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-bold">{value}</h2>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h2 className="text-2xl font-bold">{title}</h2>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 p-6 text-center text-sm text-slate-400">
      {text}
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
      {label}
    </span>
  );
}

function ResultView({ result }: { result: any }) {
  if (result?.error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
        {result.error}
      </div>
    );
  }

  if (typeof result === "string") {
    return <p className="whitespace-pre-wrap text-slate-200">{result}</p>;
  }

  if (Array.isArray(result)) {
    return (
      <ul className="space-y-2">
        {result.map((item, index) => (
          <li
            key={index}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <ResultView result={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof result === "object" && result !== null) {
    return (
      <div className="space-y-5 rounded-2xl border border-white/10 bg-slate-900 p-5">
        {Object.entries(result).map(([key, value]) => (
          <div key={key}>
            <h3 className="mb-2 text-lg font-bold text-orange-300">
              {formatTitle(key)}
            </h3>
            <ResultView result={value} />
          </div>
        ))}
      </div>
    );
  }

  return <p className="text-slate-300">{String(result || "No data.")}</p>;
}

function formatTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}