"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { requireAdminUser } from "@/lib/admin-auth";

type Payment = {
  id: string;
  user_id: string | null;
  amount: number;
  currency: string | null;
  status: string;
  created_at: string;
};

type Subscription = {
  id: string;
  user_id: string | null;
  plan_code: string | null;
  audience: string | null;
  status: string;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

type UsageLog = {
  id: string;
  user_id: string | null;
  tool_name: string;
  credits_used: number;
  response_status: string | null;
  created_at: string;
};

type Plan = {
  id: string;
  plan_code: string;
  plan_name: string;
  audience: string;
  price: number;
  currency: string;
  billing_cycle: string;
  ai_credits: number;
  is_active: boolean;
};

export default function AdminCommercialPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [message, setMessage] = useState("");
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  async function checkAdminAccess() {
    const { isAdmin } = await requireAdminUser();

    if (!isAdmin) {
      window.location.href = "/dashboard";
      return;
    }

    setAdminAllowed(true);
    setAuthChecking(false);
  }
    loadCommercialDashboard();
  }, []);

  async function loadCommercialDashboard() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const [paymentsResult, subscriptionsResult, usageResult, plansResult] =
      await Promise.all([
        supabaseBrowser
          .from("commercial_payments")
          .select("id,user_id,amount,currency,status,created_at")
          .order("created_at", { ascending: false }),

        supabaseBrowser
          .from("user_subscriptions")
          .select("id,user_id,plan_code,audience,status,starts_at,ends_at,created_at")
          .order("created_at", { ascending: false }),

        supabaseBrowser
          .from("ai_usage_logs")
          .select("id,user_id,tool_name,credits_used,response_status,created_at")
          .order("created_at", { ascending: false })
          .limit(100),

        supabaseBrowser
          .from("commercial_plans")
          .select("*")
          .order("audience", { ascending: true }),
      ]);

    if (paymentsResult.error) {
      setMessage(paymentsResult.error.message);
    }

    setPayments((paymentsResult.data || []) as Payment[]);
    setSubscriptions((subscriptionsResult.data || []) as Subscription[]);
    setUsageLogs((usageResult.data || []) as UsageLog[]);
    setPlans((plansResult.data || []) as Plan[]);

    setLoading(false);
  }

  const approvedRevenue = useMemo(() => {
    return payments
      .filter((item) => item.status === "approved")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [payments]);

  const pendingRevenue = useMemo(() => {
    return payments
      .filter((item) => item.status === "pending")
      .reduce((sum, item) => sum + Number(item.amount || 0), 0);
  }, [payments]);

  const activeSubscriptions = subscriptions.filter(
    (item) => item.status === "active"
  );

  const pendingPayments = payments.filter((item) => item.status === "pending");

  const totalCreditsUsed = usageLogs.reduce(
    (sum, item) => sum + Number(item.credits_used || 0),
    0
  );

  const topTools = useMemo(() => {
    const map: Record<string, number> = {};

    usageLogs.forEach((log) => {
      map[log.tool_name] = (map[log.tool_name] || 0) + Number(log.credits_used || 0);
    });

    return Object.entries(map)
      .map(([tool, credits]) => ({ tool, credits }))
      .sort((a, b) => b.credits - a.credits)
      .slice(0, 6);
  }, [usageLogs]);

  function formatMoney(amount: number, currency = "NGN") {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading commercial dashboard...</p>
      </main>
    );
  }

  if (authChecking) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Checking admin access...</p>
      </main>
    );
  }

  if (!adminAllowed) return null;
  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
                TalentIQ Commercial Dashboard
              </p>

              <h1 className="mt-3 text-4xl font-bold">
                Admin Commercial Center
              </h1>

              <p className="mt-3 max-w-3xl text-slate-300">
                Monitor subscriptions, payments, AI credit usage, active plans,
                pending approvals, and commercial performance.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/admin/subscriptions"
                className="rounded-xl bg-blue-500 px-5 py-3 text-sm font-bold text-white hover:bg-blue-400"
              >
                Approvals
              </Link>

              <Link
                href="/admin-intelligence"
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                AdminAI
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
          <StatCard
            label="Approved Revenue"
            value={formatMoney(approvedRevenue)}
          />
          <StatCard label="Pending Revenue" value={formatMoney(pendingRevenue)} />
          <StatCard
            label="Active Subscriptions"
            value={activeSubscriptions.length}
          />
          <StatCard label="AI Credits Used" value={totalCreditsUsed} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-2xl font-bold">Pending Payments</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Payments awaiting admin review.
                </p>
              </div>

              <Link
                href="/admin/subscriptions"
                className="rounded-xl bg-blue-500 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-400"
              >
                Review
              </Link>
            </div>

            <div className="mt-5 space-y-4">
              {pendingPayments.length === 0 ? (
                <EmptyState text="No pending payments." />
              ) : (
                pendingPayments.slice(0, 6).map((payment) => (
                  <div
                    key={payment.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="font-bold">
                          {formatMoney(payment.amount, payment.currency || "NGN")}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          {new Date(payment.created_at).toLocaleString()}
                        </p>
                      </div>

                      <Badge label={payment.status} />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">AI Tool Usage</h2>
            <p className="mt-1 text-sm text-slate-400">
              Top tools by credit consumption.
            </p>

            <div className="mt-5 space-y-4">
              {topTools.length === 0 ? (
                <EmptyState text="No AI usage logs yet." />
              ) : (
                topTools.map((item) => (
                  <div
                    key={item.tool}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <p className="font-bold text-blue-300">
                        {formatTitle(item.tool)}
                      </p>
                      <span className="rounded-xl bg-blue-500/10 px-4 py-2 font-bold text-blue-300">
                        {item.credits} credits
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Commercial Plans</h2>
              <p className="mt-1 text-sm text-slate-400">
                Active and inactive plans configured in Supabase.
              </p>
            </div>

            <Link
              href="/pricing"
              className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              View Pricing Page
            </Link>
          </div>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-white/10 text-slate-400">
                <tr>
                  <th className="py-3">Plan</th>
                  <th className="py-3">Audience</th>
                  <th className="py-3">Price</th>
                  <th className="py-3">Cycle</th>
                  <th className="py-3">Credits</th>
                  <th className="py-3">Status</th>
                </tr>
              </thead>

              <tbody>
                {plans.map((plan) => (
                  <tr key={plan.id} className="border-b border-white/5">
                    <td className="py-4 font-semibold text-slate-100">
                      {plan.plan_name}
                    </td>
                    <td className="py-4 text-slate-300">{plan.audience}</td>
                    <td className="py-4 text-slate-300">
                      {formatMoney(plan.price, plan.currency)}
                    </td>
                    <td className="py-4 text-slate-300">
                      {plan.billing_cycle}
                    </td>
                    <td className="py-4 text-slate-300">{plan.ai_credits}</td>
                    <td className="py-4">
                      <Badge label={plan.is_active ? "active" : "inactive"} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-8 text-center">
          <h2 className="text-3xl font-bold">Commercial Intelligence</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Use AdminAI to interpret subscription trends, identify revenue
            opportunities, and recommend pricing actions.
          </p>

          <Link
            href="/admin-intelligence"
            className="mt-6 inline-block rounded-xl bg-purple-500 px-6 py-3 font-bold text-white hover:bg-purple-400"
          >
            Open AdminAI
          </Link>
        </section>
      </div>
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-bold">{value}</h2>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
      <p className="text-sm text-slate-400">{text}</p>
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

function formatTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}