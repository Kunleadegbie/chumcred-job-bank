"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Plan = {
  id: string;
  plan_code: string;
  plan_name: string;
  audience: string;
  description: string | null;
  price: number;
  currency: string;
  billing_cycle: string;
  ai_credits: number;
  job_post_limit: number | null;
  user_limit: number | null;
  features: string[];
};

export default function SubscriptionPage() {
  return (
    <Suspense fallback={<SubscriptionLoading />}>
      <SubscriptionContent />
    </Suspense>
  );
}

function SubscriptionLoading() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
      <p className="text-slate-300">Loading subscription page...</p>
    </main>
  );
}

function SubscriptionContent() {  
  const searchParams = useSearchParams();
  const selectedPlanCode = searchParams.get("plan");

  const [userId, setUserId] = useState<string | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planCode, setPlanCode] = useState(selectedPlanCode || "");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    payment_reference: "",
    receipt_url: "",
    narration: "",
  });

  useEffect(() => {
    loadSubscriptionPage();
  }, []);

  async function loadSubscriptionPage() {
    setLoading(true);

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabaseBrowser
      .from("commercial_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      setMessage("Unable to load subscription plans.");
      setLoading(false);
      return;
    }

    const loadedPlans = (data || []) as Plan[];
    setPlans(loadedPlans);

    if (!selectedPlanCode && loadedPlans.length > 0) {
      setPlanCode(loadedPlans[0].plan_code);
    }

    setLoading(false);
  }

  const selectedPlan = useMemo(() => {
    return plans.find((plan) => plan.plan_code === planCode) || null;
  }, [plans, planCode]);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function formatMoney(amount: number, currency: string) {
    if (amount === 0) return "Custom";

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  async function submitSubscriptionRequest() {
    setSubmitting(true);
    setMessage("");

    if (!userId) {
      setMessage("Please log in before subscribing.");
      setSubmitting(false);
      return;
    }

    if (!selectedPlan) {
      setMessage("Please select a valid subscription plan.");
      setSubmitting(false);
      return;
    }

    const { data: subscription, error: subscriptionError } =
      await supabaseBrowser
        .from("user_subscriptions")
        .insert({
          user_id: userId,
          plan_id: selectedPlan.id,
          plan_code: selectedPlan.plan_code,
          audience: selectedPlan.audience,
          status: "pending",
        })
        .select("*")
        .single();

    if (subscriptionError || !subscription) {
      console.error(subscriptionError);
      setMessage("Unable to create subscription request.");
      setSubmitting(false);
      return;
    }

    const { error: paymentError } = await supabaseBrowser
      .from("commercial_payments")
      .insert({
        user_id: userId,
        subscription_id: subscription.id,
        plan_id: selectedPlan.id,
        amount: selectedPlan.price,
        currency: selectedPlan.currency,
        payment_method: "bank_transfer",
        payment_reference: form.payment_reference,
        receipt_url: form.receipt_url,
        narration: form.narration,
        status: "pending",
      });

    if (paymentError) {
      console.error(paymentError);
      setMessage(
        "Subscription request was created, but payment submission failed."
      );
      setSubmitting(false);
      return;
    }

    setMessage(
      "Subscription request submitted successfully. Admin will review and approve your payment."
    );

    setForm({
      payment_reference: "",
      receipt_url: "",
      narration: "",
    });

    setSubmitting(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading subscription plans...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
            TalentIQ Subscription
          </p>

          <h1 className="mt-3 text-4xl font-bold">Subscribe to a Plan</h1>

          <p className="mt-3 max-w-3xl text-slate-300">
            Choose a plan, submit your payment details, and wait for admin
            approval. Once approved, your subscription and AI credits will be
            activated.
          </p>

          {message && (
            <p className="mt-5 rounded-xl border border-blue-400/30 bg-blue-400/10 p-4 text-blue-200">
              {message}
            </p>
          )}
        </section>

        <div className="mt-8 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Select Plan</h2>

            <label className="mt-5 block">
              <span className="text-sm font-semibold text-slate-300">
                Subscription Plan
              </span>
              <select
                value={planCode}
                onChange={(e) => setPlanCode(e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
              >
                {plans.map((plan) => (
                  <option key={plan.id} value={plan.plan_code}>
                    {plan.plan_name} —{" "}
                    {formatMoney(plan.price, plan.currency)}
                  </option>
                ))}
              </select>
            </label>

            {selectedPlan && (
              <div className="mt-6 rounded-3xl border border-white/10 bg-slate-900 p-6">
                <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
                  {selectedPlan.audience}
                </p>

                <h3 className="mt-2 text-2xl font-bold">
                  {selectedPlan.plan_name}
                </h3>

                <p className="mt-3 text-sm leading-6 text-slate-300">
                  {selectedPlan.description || "TalentIQ subscription plan."}
                </p>

                <div className="mt-5">
                  <span className="text-4xl font-bold">
                    {formatMoney(selectedPlan.price, selectedPlan.currency)}
                  </span>
                  {selectedPlan.price > 0 && (
                    <span className="ml-2 text-sm text-slate-400">
                      / {selectedPlan.billing_cycle}
                    </span>
                  )}
                </div>

                <div className="mt-5 grid gap-3 text-sm">
                  <Metric label="AI Credits" value={selectedPlan.ai_credits} />
                  <Metric
                    label="Job Posts"
                    value={
                      selectedPlan.job_post_limit &&
                      selectedPlan.job_post_limit > 0
                        ? selectedPlan.job_post_limit
                        : "N/A"
                    }
                  />
                  <Metric label="Users" value={selectedPlan.user_limit || 1} />
                </div>

                <ul className="mt-5 space-y-2 text-sm text-slate-300">
                  {(selectedPlan.features || []).map((feature) => (
                    <li key={feature}>• {feature}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="mt-5">
              <Link
                href="/pricing"
                className="text-sm font-semibold text-blue-300 hover:text-blue-200"
              >
                View all pricing plans →
              </Link>
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Payment Submission</h2>

            <div className="mt-5 rounded-2xl border border-yellow-400/30 bg-yellow-400/10 p-5 text-sm text-yellow-100">
              <p className="font-bold">Manual Payment Instructions</p>
              <p className="mt-2">
                Transfer the subscription amount to the official Chumcred /
                TalentIQ account and submit your payment reference or receipt
                link here. Admin approval will activate your subscription.
              </p>
            </div>

            <div className="mt-5 grid gap-4">
              <Input
                label="Payment Reference"
                value={form.payment_reference}
                onChange={(v) => updateForm("payment_reference", v)}
                placeholder="Bank transfer reference / transaction ID"
              />

              <Input
                label="Receipt URL"
                value={form.receipt_url}
                onChange={(v) => updateForm("receipt_url", v)}
                placeholder="Paste receipt link if uploaded elsewhere"
              />

              <Textarea
                label="Payment Narration / Note"
                value={form.narration}
                onChange={(v) => updateForm("narration", v)}
                placeholder="Example: Payment for Student Monthly Plan by Adekunle"
              />
            </div>

            <button
              onClick={submitSubscriptionRequest}
              disabled={submitting}
              className="mt-6 w-full rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {submitting
                ? "Submitting Subscription..."
                : "Submit Subscription Request"}
            </button>
          </section>
        </div>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-blue-400"
      />
    </label>
  );
}

function Textarea({
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
      <textarea
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-blue-400"
      />
    </label>
  );
}