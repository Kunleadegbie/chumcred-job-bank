"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Wallet = {
  id: string;
  user_id: string | null;
  enterprise_id: string | null;
  balance: number;
  lifetime_credits: number;
  updated_at: string;
  created_at: string;
};

type CreditTransaction = {
  id: string;
  wallet_id: string;
  user_id: string | null;
  transaction_type: string;
  amount: number;
  balance_after: number | null;
  source: string | null;
  description: string | null;
  metadata: any;
  created_at: string;
};

type UsageLog = {
  id: string;
  user_id: string | null;
  tool_name: string;
  action: string | null;
  credits_used: number;
  request_summary: string | null;
  response_status: string | null;
  created_at: string;
};

export default function WalletPage() {
  const [loading, setLoading] = useState(true);
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [usageLogs, setUsageLogs] = useState<UsageLog[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadWallet();
  }, []);

  async function loadWallet() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    let { data: walletData, error: walletError } = await supabaseBrowser
      .from("ai_credit_wallets")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (walletError) {
      setMessage(walletError.message || "Unable to load AI wallet.");
      setLoading(false);
      return;
    }

    if (!walletData) {
      const { data: createdWallet, error: createError } = await supabaseBrowser
        .from("ai_credit_wallets")
        .insert({
          user_id: user.id,
          balance: 0,
          lifetime_credits: 0,
        })
        .select("*")
        .single();

      if (createError) {
        setMessage(createError.message || "Unable to create AI wallet.");
        setLoading(false);
        return;
      }

      walletData = createdWallet;
    }

    const { data: transactionData } = await supabaseBrowser
      .from("ai_credit_transactions")
      .select("*")
      .eq("wallet_id", walletData.id)
      .order("created_at", { ascending: false })
      .limit(50);

    const { data: usageData } = await supabaseBrowser
      .from("ai_usage_logs")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    setWallet(walletData);
    setTransactions((transactionData || []) as CreditTransaction[]);
    setUsageLogs((usageData || []) as UsageLog[]);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading AI credit wallet...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-green-300">
                TalentIQ AI Wallet
              </p>

              <h1 className="mt-3 text-4xl font-bold">AI Credit Wallet</h1>

              <p className="mt-3 max-w-3xl text-slate-300">
                Track your AI credit balance, subscription credits, credit
                usage, and AI tool activity.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href="/pricing"
                className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                View Pricing
              </Link>

              <Link
                href="/subscription"
                className="rounded-xl bg-green-500 px-5 py-3 text-sm font-bold text-white hover:bg-green-400"
              >
                Buy Credits / Subscribe
              </Link>
            </div>
          </div>

          {message && (
            <p className="mt-5 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <StatCard
            label="Current Balance"
            value={wallet?.balance ?? 0}
            suffix="credits"
          />
          <StatCard
            label="Lifetime Credits"
            value={wallet?.lifetime_credits ?? 0}
            suffix="credits"
          />
          <StatCard
            label="Recent Usage"
            value={usageLogs.length}
            suffix="logs"
          />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
              <div>
                <h2 className="text-2xl font-bold">Credit Transactions</h2>
                <p className="mt-1 text-sm text-slate-400">
                  Credits added, deducted, or adjusted.
                </p>
              </div>

              <button
                onClick={loadWallet}
                className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10"
              >
                Refresh
              </button>
            </div>

            <div className="mt-5 space-y-4">
              {transactions.length === 0 ? (
                <EmptyState text="No credit transactions yet." />
              ) : (
                transactions.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <p className="font-bold text-slate-100">
                          {formatTitle(item.transaction_type)}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {item.description || item.source || "Credit activity"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          {new Date(item.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div
                        className={
                          item.transaction_type === "debit"
                            ? "rounded-xl bg-red-500/10 px-4 py-2 text-right text-red-300"
                            : "rounded-xl bg-green-500/10 px-4 py-2 text-right text-green-300"
                        }
                      >
                        <p className="text-lg font-bold">
                          {item.transaction_type === "debit" ? "-" : "+"}
                          {item.amount}
                        </p>
                        <p className="text-xs">
                          Balance: {item.balance_after ?? "N/A"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">AI Usage History</h2>
            <p className="mt-1 text-sm text-slate-400">
              Recent AI tools used and credits consumed.
            </p>

            <div className="mt-5 space-y-4">
              {usageLogs.length === 0 ? (
                <EmptyState text="No AI usage logs yet." />
              ) : (
                usageLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                      <div>
                        <p className="font-bold text-green-300">
                          {formatTitle(log.tool_name)}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {log.action || "AI action"}
                        </p>
                        {log.request_summary && (
                          <p className="mt-2 rounded-xl bg-white/5 p-3 text-sm text-slate-300">
                            {log.request_summary}
                          </p>
                        )}
                        <p className="mt-2 text-xs text-slate-500">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>

                      <div className="rounded-xl bg-green-500/10 px-4 py-2 text-right text-green-300">
                        <p className="text-lg font-bold">
                          {log.credits_used || 0}
                        </p>
                        <p className="text-xs">credits used</p>
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
                        {log.response_status || "success"}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>

        <section className="mt-8 rounded-3xl border border-green-400/20 bg-green-500/10 p-8 text-center">
          <h2 className="text-3xl font-bold">Need more AI credits?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Upgrade your plan or submit a new subscription request to receive
            additional credits for CareerIQ, CV Intelligence, InterviewIQ,
            EmployerAI, InstitutionAI, AdminAI, and TalentIQ Copilot.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/pricing"
              className="rounded-xl border border-white/10 px-6 py-3 font-bold text-slate-200 hover:bg-white/10"
            >
              View Plans
            </Link>

            <Link
              href="/subscription"
              className="rounded-xl bg-green-500 px-6 py-3 font-bold text-white hover:bg-green-400"
            >
              Subscribe / Top Up
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function StatCard({
  label,
  value,
  suffix,
}: {
  label: string;
  value: string | number;
  suffix?: string;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <p className="text-sm font-semibold uppercase tracking-wide text-green-300">
        {label}
      </p>
      <h2 className="mt-3 text-4xl font-bold">{value}</h2>
      {suffix && <p className="mt-1 text-sm text-slate-400">{suffix}</p>}
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

function formatTitle(value: string) {
  return value
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}