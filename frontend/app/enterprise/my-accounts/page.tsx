"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EnterpriseAccount = {
  id: string;
  name: string;
  account_type: string;
  industry: string | null;
  country: string | null;
  status: string;
  plan_name: string | null;
  billing_status: string | null;
  created_at: string;
};

export default function MyEnterpriseAccountsPage() {
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<EnterpriseAccount[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadAccounts();
  }, []);

  async function loadAccounts() {
    setLoading(true);

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: memberships, error } = await supabaseBrowser
      .from("enterprise_members")
      .select("enterprise_id, enterprise_accounts(*)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (error) {
      console.error(error);
      setMessage(error.message);
      setLoading(false);
      return;
    }

    const mapped =
      memberships
        ?.map((item: any) => item.enterprise_accounts)
        .filter(Boolean) || [];

    setAccounts(mapped);
    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <section className="mb-8 flex flex-col justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-8 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
              TalentIQ Enterprise
            </p>
            <h1 className="mt-3 text-4xl font-bold">My Enterprise Accounts</h1>
            <p className="mt-3 text-slate-300">
              Manage enterprise workspaces, members, billing readiness, and
              activity.
            </p>
          </div>

          <Link
            href="/enterprise"
            className="rounded-xl bg-cyan-500 px-5 py-3 font-bold text-white hover:bg-cyan-400"
          >
            Create Account
          </Link>
        </section>

        {message && (
          <p className="mb-6 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
            {message}
          </p>
        )}

        {loading ? (
          <p className="text-slate-300">Loading enterprise accounts...</p>
        ) : accounts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-white/20 bg-white/5 p-10 text-center">
            <h2 className="text-2xl font-bold">No enterprise account yet</h2>
            <p className="mt-2 text-slate-300">
              Create your first enterprise workspace.
            </p>
            <Link
              href="/enterprise"
              className="mt-5 inline-block rounded-xl bg-cyan-500 px-5 py-3 font-bold text-white hover:bg-cyan-400"
            >
              Create Enterprise Account
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Link
                key={account.id}
                href={`/enterprise/${account.id}`}
                className="rounded-3xl border border-white/10 bg-white/5 p-6 transition hover:-translate-y-1 hover:border-cyan-400/60"
              >
                <p className="text-sm font-semibold uppercase tracking-wide text-cyan-300">
                  {account.account_type}
                </p>
                <h2 className="mt-2 text-2xl font-bold">{account.name}</h2>
                <p className="mt-2 text-sm text-slate-300">
                  {account.industry || "Industry not stated"}
                </p>
                <p className="mt-1 text-sm text-slate-400">
                  {account.country || "Country not stated"}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-slate-200">
                    {account.status}
                  </span>
                  <span className="rounded-full bg-cyan-500/20 px-3 py-1 text-xs text-cyan-200">
                    {account.plan_name || "Enterprise"}
                  </span>
                  <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-200">
                    {account.billing_status || "pending"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}