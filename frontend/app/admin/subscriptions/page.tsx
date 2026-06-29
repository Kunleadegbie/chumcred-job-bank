"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";
import { requireAdminUser } from "@/lib/admin-auth";

type PaymentRecord = {
  id: string;
  user_id: string;
  subscription_id: string | null;
  plan_id: string | null;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  receipt_url: string | null;
  narration: string | null;
  status: string;
  admin_note: string | null;
  created_at: string;
  user_subscriptions?: {
    id: string;
    plan_code: string | null;
    audience: string | null;
    status: string;
  } | null;
  commercial_plans?: {
    id: string;
    plan_code: string;
    plan_name: string;
    ai_credits: number;
    billing_cycle: string;
  } | null;
};

export default function AdminSubscriptionsPage() {
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [message, setMessage] = useState("");
  const [adminAllowed, setAdminAllowed] = useState(false);
  const [authChecking, setAuthChecking] = useState(true);

  useEffect(() => {
    async function initPage() {
      const { isAdmin } = await requireAdminUser();

      if (!isAdmin) {
        window.location.href = "/dashboard";
        return;
      }

      setAdminAllowed(true);
      setAuthChecking(false);

      await loadCommercialDashboard();
    }

    initPage();
  }, []);

  async function loadPayments() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data, error } = await supabaseBrowser
      .from("commercial_payments")
      .select(
        `
        *,
        user_subscriptions (
          id,
          plan_code,
          audience,
          status
        ),
        commercial_plans (
          id,
          plan_code,
          plan_name,
          ai_credits,
          billing_cycle
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error(error);
      setMessage(error.message || "Unable to load subscription payments.");
      setLoading(false);
      return;
    }

    setPayments((data || []) as PaymentRecord[]);
    setLoading(false);
  }

  async function getOrCreateWallet(userId: string) {
    const { data: existingWallet } = await supabaseBrowser
      .from("ai_credit_wallets")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingWallet) return existingWallet;

    const { data: wallet, error } = await supabaseBrowser
      .from("ai_credit_wallets")
      .insert({
        user_id: userId,
        balance: 0,
        lifetime_credits: 0,
      })
      .select("*")
      .single();

    if (error) throw error;

    return wallet;
  }

  async function approvePayment(payment: PaymentRecord) {
    setProcessingId(payment.id);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      setMessage("Admin user not found.");
      setProcessingId(null);
      return;
    }

    const credits = payment.commercial_plans?.ai_credits || 0;
    const now = new Date();

    let endsAt: Date | null = null;
    const cycle = payment.commercial_plans?.billing_cycle || "monthly";

    if (cycle === "monthly") {
      endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 1);
    } else if (cycle === "quarterly") {
      endsAt = new Date(now);
      endsAt.setMonth(endsAt.getMonth() + 3);
    } else if (cycle === "yearly") {
      endsAt = new Date(now);
      endsAt.setFullYear(endsAt.getFullYear() + 1);
    }

    try {
      await supabaseBrowser
        .from("commercial_payments")
        .update({
          status: "approved",
          approved_by: user.id,
          approved_at: now.toISOString(),
          admin_note: "Approved by admin.",
        })
        .eq("id", payment.id);

      if (payment.subscription_id) {
        await supabaseBrowser
          .from("user_subscriptions")
          .update({
            status: "active",
            starts_at: now.toISOString(),
            ends_at: endsAt ? endsAt.toISOString() : null,
            updated_at: now.toISOString(),
          })
          .eq("id", payment.subscription_id);
      }

      const wallet = await getOrCreateWallet(payment.user_id);
      const newBalance = Number(wallet.balance || 0) + credits;
      const newLifetime = Number(wallet.lifetime_credits || 0) + credits;

      await supabaseBrowser
        .from("ai_credit_wallets")
        .update({
          balance: newBalance,
          lifetime_credits: newLifetime,
          updated_at: now.toISOString(),
        })
        .eq("id", wallet.id);

      await supabaseBrowser.from("ai_credit_transactions").insert({
        wallet_id: wallet.id,
        user_id: payment.user_id,
        transaction_type: "credit",
        amount: credits,
        balance_after: newBalance,
        source: "subscription_approval",
        description: `AI credits added for ${
          payment.commercial_plans?.plan_name || "subscription"
        }`,
        metadata: {
          payment_id: payment.id,
          subscription_id: payment.subscription_id,
          plan_id: payment.plan_id,
        },
      });

      setMessage("Subscription approved and AI credits allocated.");
      await loadPayments();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Unable to approve subscription.");
    } finally {
      setProcessingId(null);
    }
  }

  async function rejectPayment(payment: PaymentRecord) {
    setProcessingId(payment.id);
    setMessage("");

    try {
      await supabaseBrowser
        .from("commercial_payments")
        .update({
          status: "rejected",
          admin_note: "Rejected by admin.",
        })
        .eq("id", payment.id);

      if (payment.subscription_id) {
        await supabaseBrowser
          .from("user_subscriptions")
          .update({
            status: "rejected",
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.subscription_id);
      }

      setMessage("Subscription payment rejected.");
      await loadPayments();
    } catch (error: any) {
      console.error(error);
      setMessage(error?.message || "Unable to reject subscription.");
    } finally {
      setProcessingId(null);
    }
  }

  function formatMoney(amount: number, currency?: string | null) {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading subscription approvals...</p>
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
            Admin Commercial Center
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Subscription Approvals
          </h1>

          <p className="mt-3 max-w-3xl text-slate-300">
            Review pending payments, approve subscriptions, activate plans, and
            allocate AI credits automatically.
          </p>

          {message && (
            <p className="mt-5 rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-blue-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-4">
          <StatCard label="Total Payments" value={payments.length} />
          <StatCard
            label="Pending"
            value={payments.filter((p) => p.status === "pending").length}
          />
          <StatCard
            label="Approved"
            value={payments.filter((p) => p.status === "approved").length}
          />
          <StatCard
            label="Rejected"
            value={payments.filter((p) => p.status === "rejected").length}
          />
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
            <div>
              <h2 className="text-2xl font-bold">Payment Requests</h2>
              <p className="mt-1 text-sm text-slate-400">
                Approve only after confirming receipt of payment.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={loadPayments}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Refresh
              </button>

              <Link
                href="/admin-intelligence"
                className="rounded-xl bg-purple-500 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-400"
              >
                AdminAI
              </Link>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center">
                <h3 className="text-xl font-bold">No payment requests yet</h3>
                <p className="mt-2 text-sm text-slate-400">
                  Subscription payment requests will appear here.
                </p>
              </div>
            ) : (
              payments.map((payment) => (
                <div
                  key={payment.id}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-5"
                >
                  <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-start">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                        {payment.commercial_plans?.plan_name ||
                          payment.user_subscriptions?.plan_code ||
                          "Subscription"}
                      </p>

                      <h3 className="mt-2 text-2xl font-bold">
                        {formatMoney(payment.amount, payment.currency)}
                      </h3>

                      <p className="mt-2 text-sm text-slate-400">
                        User: {payment.user_id}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Reference: {payment.payment_reference || "Not provided"}
                      </p>

                      <p className="mt-1 text-sm text-slate-400">
                        Submitted:{" "}
                        {new Date(payment.created_at).toLocaleString()}
                      </p>

                      {payment.narration && (
                        <p className="mt-3 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                          {payment.narration}
                        </p>
                      )}

                      {payment.receipt_url && (
                        <a
                          href={payment.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-3 inline-block text-sm font-semibold text-blue-300 hover:text-blue-200"
                        >
                          Open Receipt →
                        </a>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        <Badge label={payment.status} />
                        <Badge
                          label={`Credits: ${
                            payment.commercial_plans?.ai_credits || 0
                          }`}
                        />
                        <Badge
                          label={
                            payment.commercial_plans?.billing_cycle ||
                            "billing"
                          }
                        />
                      </div>
                    </div>

                    <div className="flex min-w-52 flex-col gap-3">
                      {payment.status === "pending" ? (
                        <>
                          <button
                            onClick={() => approvePayment(payment)}
                            disabled={processingId === payment.id}
                            className="rounded-xl bg-green-500 px-5 py-3 font-bold text-white hover:bg-green-400 disabled:opacity-50"
                          >
                            {processingId === payment.id
                              ? "Processing..."
                              : "Approve"}
                          </button>

                          <button
                            onClick={() => rejectPayment(payment)}
                            disabled={processingId === payment.id}
                            className="rounded-xl border border-red-400/40 px-5 py-3 font-bold text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <p className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-center text-sm font-semibold text-slate-300">
                          {payment.status}
                        </p>
                      )}
                    </div>
                  </div>
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
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
        {label}
      </p>
      <h2 className="mt-3 text-3xl font-bold">{value}</h2>
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