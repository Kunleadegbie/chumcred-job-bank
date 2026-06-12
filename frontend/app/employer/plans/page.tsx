"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, CreditCard } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Plan = {
  id: string;
  name: string;
  code: string;
  price: number;
  currency: string;
  duration_days: number;
  max_jobs: number;
  is_featured: boolean;
  description: string | null;
};

export default function EmployerPlansPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [employerId, setEmployerId] = useState("");
  const [message, setMessage] = useState("");
  const [selecting, setSelecting] = useState("");

  useEffect(() => {
    async function loadPlans() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: employer } = await supabaseBrowser
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!employer) {
        window.location.href = "/employer/profile";
        return;
      }

      setEmployerId(employer.id);

      const { data, error } = await supabaseBrowser
        .from("employer_posting_plans")
        .select("*")
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      setPlans((data || []) as Plan[]);
      setLoading(false);
    }

    loadPlans();
  }, []);

  async function selectPlan(plan: Plan) {
    setSelecting(plan.id);
    setMessage("");

    const { error } = await supabaseBrowser.from("employer_payments").insert({
      employer_id: employerId,
      plan_id: plan.id,
      amount: plan.price,
      currency: plan.currency || "NGN",
      payment_method: "manual_transfer",
      payment_reference: `MANUAL-${Date.now()}`,
      status: "pending",
    });

    if (error) {
      setMessage(error.message);
      setSelecting("");
      return;
    }

    setMessage(
      "Plan selected successfully. Please make payment and contact admin for approval."
    );
    setSelecting("");
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading employer plans...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-10">
        <Link
          href="/employer/dashboard"
          className="text-sm font-semibold text-blue-700"
        >
          ← Back to Employer Dashboard
        </Link>

        <p className="mt-8 text-sm font-semibold uppercase tracking-widest text-blue-700">
          Paid Job Posting
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Choose a Job Posting Plan
        </h1>

        <p className="mt-3 max-w-2xl text-slate-600">
          Select a plan to post or feature your job opportunities on Chumcred Job
          Bank.
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 text-sm font-semibold ${
            message.includes("successfully")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.id}
            className={`rounded-3xl border bg-white p-8 shadow-sm ${
              plan.is_featured ? "border-blue-600" : ""
            }`}
          >
            {plan.is_featured && (
              <div className="mb-4 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                Featured
              </div>
            )}

            <h2 className="text-2xl font-bold text-slate-900">
              {plan.name}
            </h2>

            <p className="mt-3 text-sm text-slate-600">
              {plan.description || "Job posting plan"}
            </p>

            <div className="mt-6">
              <span className="text-4xl font-bold text-slate-900">
                ₦{Number(plan.price).toLocaleString()}
              </span>
              <span className="text-sm text-slate-500">
                {" "}
                / {plan.duration_days} days
              </span>
            </div>

            <ul className="mt-6 space-y-3 text-sm text-slate-700">
              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                {plan.max_jobs} job posting(s)
              </li>

              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                {plan.duration_days} days visibility
              </li>

              <li className="flex items-center gap-2">
                <CheckCircle size={16} className="text-emerald-600" />
                {plan.is_featured ? "Featured visibility" : "Standard visibility"}
              </li>
            </ul>

            <button
              onClick={() => selectPlan(plan)}
              disabled={selecting === plan.id}
              className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
            >
              <CreditCard size={18} />
              {selecting === plan.id ? "Selecting..." : "Select Plan"}
            </button>
          </div>
        ))}
      </div>

      <section className="mt-10 rounded-3xl border bg-slate-50 p-6">
        <h2 className="text-xl font-bold text-slate-900">
          Manual Payment Instruction
        </h2>

        <p className="mt-2 text-sm text-slate-600">
          After selecting a plan, make payment to the Chumcred account and
          contact admin for approval. Paystack/Flutterwave integration will be
          added in the next stage.
        </p>
      </section>
    </main>
  );
}