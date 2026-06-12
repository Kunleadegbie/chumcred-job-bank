"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Save, UserCircle } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type ProfileForm = {
  full_name: string;
  email: string;
  country: string;
  phone: string;
  location: string;
  linkedin_url: string;
  portfolio_url: string;
  current_role: string;
  years_experience: string;
  industry: string;
  skills: string;
  career_objective: string;
  highest_qualification: string;
  institution: string;
  graduation_year: string;
};

export default function CandidateProfilePage() {
  const router = useRouter();

  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  const [form, setForm] = useState<ProfileForm>({
    full_name: "",
    email: "",
    country: "",
    phone: "",
    location: "",
    linkedin_url: "",
    portfolio_url: "",
    current_role: "",
    years_experience: "",
    industry: "",
    skills: "",
    career_objective: "",
    highest_qualification: "",
    institution: "",
    graduation_year: "",
  });

  useEffect(() => {
    async function loadProfile() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      setForm({
        full_name:
          profile?.full_name || user.user_metadata?.full_name || "",
        email: profile?.email || user.email || "",
        country: profile?.country || user.user_metadata?.country || "",
        phone: profile?.phone || "",
        location: profile?.location || "",
        linkedin_url: profile?.linkedin_url || "",
        portfolio_url: profile?.portfolio_url || "",
        current_role: profile?.current_role || "",
        years_experience:
          profile?.years_experience !== null &&
          profile?.years_experience !== undefined
            ? String(profile.years_experience)
            : "",
        industry: profile?.industry || "",
        skills: profile?.skills || "",
        career_objective: profile?.career_objective || "",
        highest_qualification: profile?.highest_qualification || "",
        institution: profile?.institution || "",
        graduation_year:
          profile?.graduation_year !== null &&
          profile?.graduation_year !== undefined
            ? String(profile.graduation_year)
            : "",
      });

      setLoading(false);
    }

    loadProfile();
  }, [router]);

  function updateField(field: keyof ProfileForm, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();

    if (!userId) return;

    setSaving(true);
    setMessage("");

    const payload = {
      id: userId,
      full_name: form.full_name,
      email: form.email,
      country: form.country,
      phone: form.phone,
      location: form.location,
      linkedin_url: form.linkedin_url,
      portfolio_url: form.portfolio_url,
      current_role: form.current_role,
      years_experience: form.years_experience
        ? Number(form.years_experience)
        : null,
      industry: form.industry,
      skills: form.skills,
      career_objective: form.career_objective,
      highest_qualification: form.highest_qualification,
      institution: form.institution,
      graduation_year: form.graduation_year
        ? Number(form.graduation_year)
        : null,
      role: "applicant",
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabaseBrowser
      .from("profiles")
      .upsert(payload);

    if (error) {
      setMessage(error.message);
      setSaving(false);
      return;
    }

    setMessage("Profile updated successfully.");
    setSaving(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading profile...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-12">
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
          ← Back to Dashboard
        </Link>

        <div className="mt-6 flex items-center gap-4">
          <div className="rounded-3xl bg-blue-50 p-4 text-blue-700">
            <UserCircle size={36} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Candidate Profile
            </p>

            <h1 className="mt-2 text-4xl font-bold text-slate-900">
              Complete Your Profile
            </h1>

            <p className="mt-2 text-slate-600">
              This information improves your job recommendations and matching quality.
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 text-sm font-semibold ${
            message.includes("success")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={saveProfile} className="space-y-8">
        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Personal Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input label="Full Name" value={form.full_name} onChange={(v) => updateField("full_name", v)} />
            <Input label="Email" value={form.email} onChange={(v) => updateField("email", v)} />
            <Input label="Country" value={form.country} onChange={(v) => updateField("country", v)} />
            <Input label="Phone Number" value={form.phone} onChange={(v) => updateField("phone", v)} />
            <Input label="Location" value={form.location} onChange={(v) => updateField("location", v)} />
            <Input label="LinkedIn URL" value={form.linkedin_url} onChange={(v) => updateField("linkedin_url", v)} />
            <Input label="Portfolio URL" value={form.portfolio_url} onChange={(v) => updateField("portfolio_url", v)} />
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Professional Information
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input label="Current Role" value={form.current_role} onChange={(v) => updateField("current_role", v)} />
            <Input label="Years of Experience" type="number" value={form.years_experience} onChange={(v) => updateField("years_experience", v)} />
            <Input label="Industry" value={form.industry} onChange={(v) => updateField("industry", v)} />
          </div>

          <div className="mt-5">
            <Textarea
              label="Skills"
              value={form.skills}
              onChange={(v) => updateField("skills", v)}
              placeholder="Example: Business analysis, project management, Excel, Power BI, stakeholder management"
            />
          </div>

          <div className="mt-5">
            <Textarea
              label="Career Objective"
              value={form.career_objective}
              onChange={(v) => updateField("career_objective", v)}
              placeholder="Briefly describe your career goals and target roles"
            />
          </div>
        </section>

        <section className="rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Education
          </h2>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <Input label="Highest Qualification" value={form.highest_qualification} onChange={(v) => updateField("highest_qualification", v)} />
            <Input label="Institution" value={form.institution} onChange={(v) => updateField("institution", v)} />
            <Input label="Graduation Year" type="number" value={form.graduation_year} onChange={(v) => updateField("graduation_year", v)} />
          </div>
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Save size={18} />
            {saving ? "Saving Profile..." : "Save Profile"}
          </button>
        </div>
      </form>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <input
        type={type}
        value={value}
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
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="mb-2 block text-sm font-semibold text-slate-700">
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        placeholder={placeholder}
        className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
      />
    </div>
  );
}