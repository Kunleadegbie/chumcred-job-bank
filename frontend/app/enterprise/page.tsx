"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function EnterprisePage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    name: "",
    account_type: "organization",
    industry: "",
    country: "",
    website: "",
    contact_email: "",
  });

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabaseBrowser.auth.getUser();

      setUserId(user?.id || null);
      setForm((prev) => ({
        ...prev,
        contact_email: user?.email || "",
      }));
    }

    loadUser();
  }, []);

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function createEnterpriseAccount() {
    setLoading(true);
    setMessage("");

    if (!userId) {
      setMessage("Please log in before creating an enterprise account.");
      setLoading(false);
      return;
    }

    if (!form.name.trim()) {
      setMessage("Enterprise name is required.");
      setLoading(false);
      return;
    }

    const { data: account, error } = await supabaseBrowser
      .from("enterprise_accounts")
      .insert({
        name: form.name,
        account_type: form.account_type,
        industry: form.industry,
        country: form.country,
        website: form.website,
        contact_email: form.contact_email,
        created_by: userId,
      })
      .select("*")
      .single();

    if (error || !account) {
      console.error(error);
      setMessage("Unable to create enterprise account.");
      setLoading(false);
      return;
    }

    await supabaseBrowser.from("enterprise_members").insert({
      enterprise_id: account.id,
      user_id: userId,
      role: "owner",
      status: "active",
    });

    await supabaseBrowser.from("enterprise_activity_logs").insert({
      enterprise_id: account.id,
      user_id: userId,
      action: "enterprise_account_created",
      details: {
        name: form.name,
        account_type: form.account_type,
      },
    });

    window.location.href = `/enterprise/${account.id}`;
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-5xl px-6 py-12">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
            TalentIQ Enterprise
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Create Enterprise Account
          </h1>

          <p className="mt-3 max-w-3xl text-slate-300">
            Set up an organization, employer group, institution, government
            programme, or training partner account with multi-user access.
          </p>

          {message && (
            <p className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Enterprise / Organization Name"
              value={form.name}
              onChange={(v) => updateForm("name", v)}
            />

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Account Type
              </span>
              <select
                value={form.account_type}
                onChange={(e) => updateForm("account_type", e.target.value)}
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
              >
                <option value="organization">Organization</option>
                <option value="employer">Employer</option>
                <option value="institution">Institution</option>
                <option value="government">Government Programme</option>
                <option value="training_provider">Training Provider</option>
              </select>
            </label>

            <Input
              label="Industry / Sector"
              value={form.industry}
              onChange={(v) => updateForm("industry", v)}
            />

            <Input
              label="Country"
              value={form.country}
              onChange={(v) => updateForm("country", v)}
            />

            <Input
              label="Website"
              value={form.website}
              onChange={(v) => updateForm("website", v)}
            />

            <Input
              label="Contact Email"
              value={form.contact_email}
              onChange={(v) => updateForm("contact_email", v)}
            />
          </div>

          <button
            onClick={createEnterpriseAccount}
            disabled={loading}
            className="mt-6 w-full rounded-2xl bg-cyan-500 px-6 py-4 font-bold text-white hover:bg-cyan-400 disabled:opacity-50"
          >
            {loading ? "Creating Enterprise Account..." : "Create Enterprise Account"}
          </button>

          <div className="mt-5 text-center">
            <Link
              href="/enterprise/my-accounts"
              className="text-sm font-semibold text-cyan-300 hover:text-cyan-200"
            >
              View my enterprise accounts →
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}