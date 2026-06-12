"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export default function EmployerPostJobPage() {
  const [employerId, setEmployerId] = useState("");
  const [loading, setLoading] = useState(true);
  const [posting, setPosting] = useState(false);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    title: "",
    description: "",
    requirements: "",
    responsibilities: "",
    benefits: "",
    industry: "",
    job_function: "",
    experience_level: "",
    country: "",
    city: "",
    location_display: "",
    work_type: "onsite",
    employment_type: "full_time",
    salary_currency: "NGN",
    salary_display: "",
  });

  useEffect(() => {
    async function loadEmployer() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data } = await supabaseBrowser
        .from("employers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!data) {
        window.location.href = "/employer/profile";
        return;
      }

      setEmployerId(data.id);
      setLoading(false);
    }

    loadEmployer();
  }, []);

  function updateField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function postJob(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPosting(true);
    setMessage("");

    const slug = `${slugify(form.title)}-${Date.now()}`;

    const { error } = await supabaseBrowser.from("employer_jobs").insert({
      employer_id: employerId,
      ...form,
      slug,
      status: "published",
      posted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    if (error) {
      setMessage(error.message);
      setPosting(false);
      return;
    }

    setMessage("Job posted successfully.");
    setPosting(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-16">
        <p>Loading employer account...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <Link href="/employer/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Employer Dashboard
      </Link>

      <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Employer Portal
        </p>

        <h1 className="mt-3 text-4xl font-bold">Post a Job</h1>

        {message && (
          <div className="mt-6 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700">
            {message}
          </div>
        )}

        <form onSubmit={postJob} className="mt-8 space-y-6">
          <Input
            label="Job Title"
            value={form.title}
            onChange={(v) => updateField("title", v)}
            required
          />

          <Textarea
            label="Job Description"
            value={form.description}
            onChange={(v) => updateField("description", v)}
          />

          <Textarea
            label="Requirements"
            value={form.requirements}
            onChange={(v) => updateField("requirements", v)}
          />

          <Textarea
            label="Responsibilities"
            value={form.responsibilities}
            onChange={(v) => updateField("responsibilities", v)}
          />

          <Textarea
            label="Benefits"
            value={form.benefits}
            onChange={(v) => updateField("benefits", v)}
          />

          <div className="grid gap-5 md:grid-cols-2">
            <Input
              label="Industry"
              value={form.industry}
              onChange={(v) => updateField("industry", v)}
            />

            <Input
              label="Job Function"
              value={form.job_function}
              onChange={(v) => updateField("job_function", v)}
            />

            <Input
              label="Experience Level"
              value={form.experience_level}
              onChange={(v) => updateField("experience_level", v)}
            />

            <Input
              label="Country"
              value={form.country}
              onChange={(v) => updateField("country", v)}
            />

            <Input
              label="City"
              value={form.city}
              onChange={(v) => updateField("city", v)}
            />

            <Input
              label="Location Display"
              value={form.location_display}
              onChange={(v) => updateField("location_display", v)}
            />

            <Input
              label="Work Type"
              value={form.work_type}
              onChange={(v) => updateField("work_type", v)}
            />

            <Input
              label="Employment Type"
              value={form.employment_type}
              onChange={(v) => updateField("employment_type", v)}
            />

            <Input
              label="Salary Currency"
              value={form.salary_currency}
              onChange={(v) => updateField("salary_currency", v)}
            />

            <Input
              label="Salary Display"
              value={form.salary_display}
              onChange={(v) => updateField("salary_display", v)}
            />
          </div>

          <button
            type="submit"
            disabled={posting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Send size={18} />
            {posting ? "Posting..." : "Publish Job"}
          </button>
        </form>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  required = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
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

function Textarea({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold">{label}</label>
      <textarea
        value={value}
        rows={4}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
      />
    </div>
  );
}