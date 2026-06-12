"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Save, Building2 } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function EmployerProfilePage() {
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    company_name: "",
    company_email: "",
    company_phone: "",
    company_website: "",
    industry: "",
    company_size: "",
    country: "",
    city: "",
    description: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data } = await supabaseBrowser
        .from("employers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (data) {
        setForm({
          company_name: data.company_name || "",
          company_email: data.company_email || user.email || "",
          company_phone: data.company_phone || "",
          company_website: data.company_website || "",
          industry: data.industry || "",
          company_size: data.company_size || "",
          country: data.country || "",
          city: data.city || "",
          description: data.description || "",
        });
      } else {
        setForm((prev) => ({
          ...prev,
          company_email: user.email || "",
        }));
      }

      setLoading(false);
    }

    loadProfile();
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage("");

    const { error } = await supabaseBrowser.from("employers").upsert(
      {
        user_id: userId,
        ...form,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Employer profile saved successfully.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p>Loading employer profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/employer/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Employer Dashboard
      </Link>

      <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-50 p-3 text-blue-700">
            <Building2 size={32} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Employer Profile
            </p>
            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Company Information
            </h1>
          </div>
        </div>

        {message && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={saveProfile} className="mt-8 space-y-6">
          <div className="grid gap-5 md:grid-cols-2">
            <Input label="Company Name" value={form.company_name} onChange={(v) => updateField("company_name", v)} required />
            <Input label="Company Email" value={form.company_email} onChange={(v) => updateField("company_email", v)} />
            <Input label="Company Phone" value={form.company_phone} onChange={(v) => updateField("company_phone", v)} />
            <Input label="Website" value={form.company_website} onChange={(v) => updateField("company_website", v)} />
            <Input label="Industry" value={form.industry} onChange={(v) => updateField("industry", v)} />
            <Input label="Company Size" value={form.company_size} onChange={(v) => updateField("company_size", v)} />
            <Input label="Country" value={form.country} onChange={(v) => updateField("country", v)} />
            <Input label="City" value={form.city} onChange={(v) => updateField("city", v)} />
          </div>

          <Textarea label="Company Description" value={form.description} onChange={(v) => updateField("description", v)} />

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Employer Profile"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Input({ label, value, onChange, required = false }: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <input
        value={value}
        required={required}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
      />
    </div>
  );
}

function Textarea({ label, value, onChange }: any) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        rows={5}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
      />
    </div>
  );
}