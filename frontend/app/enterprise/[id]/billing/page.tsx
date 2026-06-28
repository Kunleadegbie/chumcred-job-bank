"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EnterpriseAccount = {
  id: string;
  name: string;
  plan_name: string | null;
  billing_status: string | null;
};

type BillingRecord = {
  id: string;
  enterprise_id: string;
  plan_name: string;
  amount: number | null;
  currency: string | null;
  billing_cycle: string | null;
  payment_status: string | null;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
};

export default function EnterpriseBillingPage() {
  const params = useParams();
  const enterpriseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [account, setAccount] = useState<EnterpriseAccount | null>(null);
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    plan_name: "Enterprise",
    amount: "",
    currency: "NGN",
    billing_cycle: "monthly",
    payment_status: "pending",
    starts_at: "",
    ends_at: "",
  });

  useEffect(() => {
    if (enterpriseId) loadBillingPage();
  }, [enterpriseId]);

  async function loadBillingPage() {
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
      .select("id,name,plan_name,billing_status")
      .eq("id", enterpriseId)
      .maybeSingle();

    if (accountError || !accountData) {
      setMessage("Unable to load enterprise account.");
      setLoading(false);
      return;
    }

    const { data: billingData, error: billingError } = await supabaseBrowser
      .from("enterprise_billing")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .order("created_at", { ascending: false });

    if (billingError) {
      setMessage("Unable to load billing records.");
      setLoading(false);
      return;
    }

    setAccount(accountData);
    setBillingRecords(billingData || []);
    setForm((prev) => ({
      ...prev,
      plan_name: accountData.plan_name || "Enterprise",
      payment_status: accountData.billing_status || "pending",
    }));

    setLoading(false);
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createBillingRecord() {
    setSaving(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      setMessage("Please log in before updating billing.");
      setSaving(false);
      return;
    }

    const amountValue = form.amount ? Number(form.amount) : null;

    const { error: billingError } = await supabaseBrowser
      .from("enterprise_billing")
      .insert({
        enterprise_id: enterpriseId,
        plan_name: form.plan_name,
        amount: amountValue,
        currency: form.currency,
        billing_cycle: form.billing_cycle,
        payment_status: form.payment_status,
        starts_at: form.starts_at || null,
        ends_at: form.ends_at || null,
      });

    if (billingError) {
      console.error(billingError);
      setMessage("Unable to create billing record. Check your enterprise role.");
      setSaving(false);
      return;
    }

    await supabaseBrowser
      .from("enterprise_accounts")
      .update({
        plan_name: form.plan_name,
        billing_status: form.payment_status,
      })
      .eq("id", enterpriseId);

    await supabaseBrowser.from("enterprise_activity_logs").insert({
      enterprise_id: enterpriseId,
      user_id: user.id,
      action: "enterprise_billing_record_created",
      details: {
        plan_name: form.plan_name,
        amount: amountValue,
        currency: form.currency,
        billing_cycle: form.billing_cycle,
        payment_status: form.payment_status,
      },
    });

    setForm((prev) => ({
      ...prev,
      amount: "",
      starts_at: "",
      ends_at: "",
    }));

    await loadBillingPage();
    setSaving(false);
    setMessage("Billing record created successfully.");
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading enterprise billing...</p>
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
                Enterprise Billing
              </p>
              <h1 className="mt-3 text-4xl font-bold">
                Billing {account?.name ? `— ${account.name}` : ""}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Manage enterprise plans, billing cycle, payment status, and
                subscription readiness.
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
            <p className="mt-5 rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-4 text-cyan-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 grid gap-5 md:grid-cols-3">
          <StatCard label="Current Plan" value={account?.plan_name || "Enterprise"} />
          <StatCard
            label="Billing Status"
            value={account?.billing_status || "pending"}
          />
          <StatCard label="Billing Records" value={billingRecords.length} />
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Create Billing Record</h2>

            <div className="mt-5 grid gap-4">
              <Input
                label="Plan Name"
                value={form.plan_name}
                onChange={(v) => updateForm("plan_name", v)}
              />

              <Input
                label="Amount"
                value={form.amount}
                onChange={(v) => updateForm("amount", v)}
                placeholder="250000"
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Select
                  label="Currency"
                  value={form.currency}
                  onChange={(v) => updateForm("currency", v)}
                  options={["NGN", "USD", "GBP", "CAD"]}
                />

                <Select
                  label="Billing Cycle"
                  value={form.billing_cycle}
                  onChange={(v) => updateForm("billing_cycle", v)}
                  options={["monthly", "quarterly", "yearly", "one_time"]}
                />
              </div>

              <Select
                label="Payment Status"
                value={form.payment_status}
                onChange={(v) => updateForm("payment_status", v)}
                options={["pending", "paid", "overdue", "cancelled"]}
              />

              <div className="grid gap-4 md:grid-cols-2">
                <Input
                  label="Start Date"
                  value={form.starts_at}
                  onChange={(v) => updateForm("starts_at", v)}
                  placeholder="2026-07-01"
                />

                <Input
                  label="End Date"
                  value={form.ends_at}
                  onChange={(v) => updateForm("ends_at", v)}
                  placeholder="2026-12-31"
                />
              </div>
            </div>

            <button
              onClick={createBillingRecord}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-cyan-500 px-6 py-4 font-bold text-white hover:bg-cyan-400 disabled:opacity-50"
            >
              {saving ? "Saving Billing Record..." : "Save Billing Record"}
            </button>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Billing History</h2>

            <div className="mt-5 space-y-4">
              {billingRecords.length === 0 ? (
                <p className="text-sm text-slate-400">
                  No billing records yet.
                </p>
              ) : (
                billingRecords.map((record) => (
                  <div
                    key={record.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
                      <div>
                        <p className="text-lg font-bold text-slate-100">
                          {record.plan_name}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          {record.currency || "NGN"}{" "}
                          {record.amount?.toLocaleString() || "0"} •{" "}
                          {record.billing_cycle || "monthly"}
                        </p>
                        <p className="mt-1 text-xs text-slate-500">
                          Created:{" "}
                          {new Date(record.created_at).toLocaleString()}
                        </p>
                      </div>

                      <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs font-semibold text-cyan-200">
                        {record.payment_status || "pending"}
                      </span>
                    </div>

                    {(record.starts_at || record.ends_at) && (
                      <p className="mt-3 text-xs text-slate-400">
                        {record.starts_at
                          ? `Starts: ${new Date(
                              record.starts_at
                            ).toLocaleDateString()}`
                          : ""}
                        {record.ends_at
                          ? ` • Ends: ${new Date(
                              record.ends_at
                            ).toLocaleDateString()}`
                          : ""}
                      </p>
                    )}
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

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
      >
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </label>
  );
}