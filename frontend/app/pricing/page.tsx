"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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

const audienceOrder = ["student", "employer", "institution", "enterprise"];

export default function PricingPage() {
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [activeAudience, setActiveAudience] = useState("student");
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadPlans();
  }, []);

  async function loadPlans() {
    setLoading(true);

    const { data, error } = await supabaseBrowser
      .from("commercial_plans")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });

    if (error) {
      console.error(error);
      setMessage("Unable to load pricing plans.");
      setLoading(false);
      return;
    }

    setPlans((data || []) as Plan[]);
    setLoading(false);
  }

  const groupedPlans = audienceOrder.map((audience) => ({
    audience,
    plans: plans.filter((plan) => plan.audience === audience),
  }));

  const visiblePlans = plans.filter((plan) => plan.audience === activeAudience);

  function formatMoney(amount: number, currency: string) {
    if (amount === 0) return "Custom";

    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: currency || "NGN",
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatAudience(value: string) {
    return value
      .replace(/_/g, " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="border-b border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950">
        <div className="mx-auto max-w-7xl px-6 py-16 text-center">
          <p className="text-sm font-semibold uppercase tracking-[0.35em] text-blue-300">
            TalentIQ Commercialization
          </p>

          <h1 className="mt-4 text-4xl font-bold md:text-6xl">
            Pricing for Every Talent Ecosystem
          </h1>

          <p className="mx-auto mt-5 max-w-3xl text-lg leading-8 text-slate-300">
            Flexible plans for students, employers, institutions, and enterprise
            organizations using TalentIQ AI tools, analytics, and employability
            intelligence.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {audienceOrder.map((audience) => (
              <button
                key={audience}
                onClick={() => setActiveAudience(audience)}
                className={
                  activeAudience === audience
                    ? "rounded-full bg-blue-500 px-5 py-3 text-sm font-bold text-white"
                    : "rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-semibold text-slate-300 hover:bg-white/10"
                }
              >
                {formatAudience(audience)}
              </button>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-6 py-12">
        {message && (
          <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-slate-300">Loading pricing plans...</p>
        ) : visiblePlans.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
            <h2 className="text-2xl font-bold">No plans available</h2>
            <p className="mt-2 text-slate-400">
              No active plans are currently available for this category.
            </p>
          </div>
        ) : (
          <section className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {visiblePlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                price={formatMoney(plan.price, plan.currency)}
              />
            ))}
          </section>
        )}

        <section className="mt-16 rounded-3xl border border-white/10 bg-white/5 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
            Plan Categories
          </p>
          <h2 className="mt-3 text-3xl font-bold">What each plan supports</h2>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {groupedPlans.map((group) => (
              <div
                key={group.audience}
                className="rounded-3xl border border-white/10 bg-slate-900 p-6"
              >
                <h3 className="text-xl font-bold">
                  {formatAudience(group.audience)}
                </h3>
                <p className="mt-2 text-sm text-slate-400">
                  {group.plans.length} active plan
                  {group.plans.length === 1 ? "" : "s"}
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {group.plans.slice(0, 4).map((plan) => (
                    <li key={plan.id}>• {plan.plan_name}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-12 rounded-3xl border border-blue-400/20 bg-blue-500/10 p-8 text-center">
          <h2 className="text-3xl font-bold">Need a custom enterprise plan?</h2>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            TalentIQ supports employers, universities, government programmes,
            training providers, and enterprise teams with custom licensing and
            AI credit packages.
          </p>

          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link
              href="/enterprise"
              className="rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-400"
            >
              Create Enterprise Account
            </Link>

            <Link
              href="/subscription"
              className="rounded-xl border border-white/10 px-6 py-3 font-bold text-slate-200 hover:bg-white/10"
            >
              Subscribe Now
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function PlanCard({ plan, price }: { plan: Plan; price: string }) {
  const features = Array.isArray(plan.features) ? plan.features : [];

  return (
    <div className="flex flex-col rounded-3xl border border-white/10 bg-white/5 p-6 shadow-xl transition hover:-translate-y-1 hover:border-blue-400/60">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-300">
        {plan.audience}
      </p>

      <h2 className="mt-3 text-2xl font-bold">{plan.plan_name}</h2>

      <p className="mt-3 min-h-12 text-sm leading-6 text-slate-300">
        {plan.description || "TalentIQ commercial plan."}
      </p>

      <div className="mt-6">
        <span className="text-4xl font-bold">{price}</span>
        {plan.price > 0 && (
          <span className="ml-2 text-sm text-slate-400">
            / {plan.billing_cycle}
          </span>
        )}
      </div>

      <div className="mt-6 grid gap-3 text-sm">
        <Metric label="AI Credits" value={plan.ai_credits} />
        <Metric
          label="Job Posts"
          value={plan.job_post_limit && plan.job_post_limit > 0 ? plan.job_post_limit : "N/A"}
        />
        <Metric label="Users" value={plan.user_limit || 1} />
      </div>

      <ul className="mt-6 flex-1 space-y-3 text-sm text-slate-300">
        {features.length === 0 ? (
          <li>• Core TalentIQ access</li>
        ) : (
          features.map((feature) => <li key={feature}>• {feature}</li>)
        )}
      </ul>

      <Link
        href={`/subscription?plan=${plan.plan_code}`}
        className="mt-8 rounded-2xl bg-blue-500 px-5 py-3 text-center font-bold text-white hover:bg-blue-400"
      >
        Choose Plan
      </Link>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-900 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}