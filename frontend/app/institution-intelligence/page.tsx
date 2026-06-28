"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type HistoryItem = {
  id: string;
  user_id?: string;
  action: string;
  title: string | null;
  institution_name: string | null;
  input: any;
  result: any;
  created_at: string;
};

const actions = [
  { key: "dashboard", label: "Executive Dashboard" },
  { key: "employability", label: "Employability Analysis" },
  { key: "skills_gap", label: "Skills Gap Analysis" },
  { key: "curriculum", label: "Curriculum Intelligence" },
  { key: "recommendations", label: "AI Recommendations" },
];

export default function InstitutionIntelligencePage() {
  const supabase = supabaseBrowser;

  const [userId, setUserId] = useState<string | null>(null);
  const [action, setAction] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    institution_name: "",
    institution_type: "",
    location: "",
    total_students: "",
    total_graduates: "",
    departments_json: "",
    graduate_data_json: "",
    employer_data_json: "",
    programme_data_json: "",
    graduate_skills: "",
    employer_required_skills: "",
    labour_market_notes: "",
  });

  useEffect(() => {
    loadUserAndHistory();
  }, []);

  async function loadUserAndHistory() {
    setHistoryLoading(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setUserId(null);
      setHistory([]);
      setHistoryLoading(false);
      return;
    }

    setUserId(user.id);

    const { data, error } = await supabase
      .from("institution_ai_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("InstitutionAI history load error:", error);
      setMessage("Unable to load InstitutionAI history.");
    } else {
      setHistory(data || []);
      if (data?.[0]?.result) setResult(data[0].result);
    }

    setHistoryLoading(false);
  }

  function parseJson(value: string, fallback: any) {
    if (!value.trim()) return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }

  function parseList(value: string) {
    return value
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }

  const payload = useMemo(() => {
    return {
      action,
      institution_name: form.institution_name,
      institution_type: form.institution_type,
      location: form.location,
      total_students: form.total_students ? Number(form.total_students) : null,
      total_graduates: form.total_graduates ? Number(form.total_graduates) : null,
      departments: parseJson(form.departments_json, []),
      graduate_data: parseJson(form.graduate_data_json, []),
      employer_data: parseJson(form.employer_data_json, []),
      programme_data: parseJson(form.programme_data_json, []),
      graduate_skills: parseList(form.graduate_skills),
      employer_required_skills: parseList(form.employer_required_skills),
      labour_market_notes: form.labour_market_notes,
    };
  }, [action, form]);

  async function saveHistory(data: any) {
    if (!userId) return;

    const { data: saved, error } = await supabase
      .from("institution_ai_history")
      .insert({
        user_id: userId,
        action,
        title:
          actions.find((item) => item.key === action)?.label ||
          "InstitutionAI Analysis",
        institution_name: form.institution_name,
        input: payload,
        result: data,
      })
      .select("*")
      .single();

    if (error) {
      console.error("InstitutionAI history save error:", error);
      setMessage("AI result was generated but could not be saved to history.");
      return;
    }

    setHistory((prev) => [saved, ...prev].slice(0, 30));
  }

  async function runInstitutionAI() {
    setLoading(true);
    setResult(null);
    setMessage("");

    try {
      const res = await fetch("/api/institution-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data?.error || "InstitutionAI request failed." });
        return;
      }

      setResult(data);
      await saveHistory(data);
    } catch {
      setResult({ error: "Unable to connect to InstitutionAI." });
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!userId) return;

    const { error } = await supabase
      .from("institution_ai_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      setMessage("Unable to clear InstitutionAI history.");
      return;
    }

    setHistory([]);
    setResult(null);
  }

  function updateForm(key: string, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300">
            TalentIQ InstitutionAI
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Institution Intelligence Dashboard
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Analyze graduate employability, skills gaps, curriculum alignment,
            employer demand, and institutional readiness.
          </p>

          {!userId && !historyLoading && (
            <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-200">
              Please log in to save InstitutionAI history across reloads and
              devices.
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {message}
            </p>
          )}
        </section>

        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <label className="text-sm font-semibold text-slate-300">
              InstitutionAI Action
            </label>

            <select
              value={action}
              onChange={(e) => setAction(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            >
              {actions.map((item) => (
                <option key={item.key} value={item.key}>
                  {item.label}
                </option>
              ))}
            </select>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <Input
                label="Institution Name"
                value={form.institution_name}
                onChange={(v) => updateForm("institution_name", v)}
              />
              <Input
                label="Institution Type"
                value={form.institution_type}
                onChange={(v) => updateForm("institution_type", v)}
              />
              <Input
                label="Location"
                value={form.location}
                onChange={(v) => updateForm("location", v)}
              />
              <Input
                label="Total Students"
                value={form.total_students}
                onChange={(v) => updateForm("total_students", v)}
              />
              <Input
                label="Total Graduates"
                value={form.total_graduates}
                onChange={(v) => updateForm("total_graduates", v)}
              />
            </div>

            <Textarea
              label="Departments JSON"
              value={form.departments_json}
              onChange={(v) => updateForm("departments_json", v)}
              placeholder='Example: [{"department":"Computer Science","graduates":120},{"department":"Accounting","graduates":80}]'
            />

            <Textarea
              label="Graduate Data JSON"
              value={form.graduate_data_json}
              onChange={(v) => updateForm("graduate_data_json", v)}
              placeholder='Example: [{"department":"Computer Science","skills":["SQL","Python"],"job_ready":true}]'
            />

            {(action === "dashboard" || action === "curriculum") && (
              <Textarea
                label="Programme Data JSON"
                value={form.programme_data_json}
                onChange={(v) => updateForm("programme_data_json", v)}
                placeholder='Example: [{"programme":"BSc Computer Science","courses":["Database","Programming"]}]'
              />
            )}

            {action === "dashboard" && (
              <Textarea
                label="Employer Data JSON"
                value={form.employer_data_json}
                onChange={(v) => updateForm("employer_data_json", v)}
                placeholder='Example: [{"employer":"Access Bank","roles":["Analyst"],"required_skills":["Excel","SQL"]}]'
              />
            )}

            {(action === "skills_gap" || action === "curriculum") && (
              <>
                <Textarea
                  label="Graduate Skills"
                  value={form.graduate_skills}
                  onChange={(v) => updateForm("graduate_skills", v)}
                  placeholder="Excel, Communication, Accounting, Python"
                />
                <Textarea
                  label="Employer Required Skills"
                  value={form.employer_required_skills}
                  onChange={(v) => updateForm("employer_required_skills", v)}
                  placeholder="Power BI, SQL, Data Analysis, Presentation"
                />
              </>
            )}

            {action === "curriculum" && (
              <Textarea
                label="Labour Market Notes"
                value={form.labour_market_notes}
                onChange={(v) => updateForm("labour_market_notes", v)}
              />
            )}

            <button
              onClick={runInstitutionAI}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-emerald-500 px-6 py-4 font-bold text-white hover:bg-emerald-400 disabled:opacity-50"
            >
              {loading
                ? "Generating Institution Intelligence..."
                : "Run InstitutionAI"}
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">InstitutionAI Result</h2>

            <div className="mt-4 max-h-[760px] overflow-auto rounded-2xl bg-slate-900 p-5 text-sm text-slate-100">
              {result ? (
                <ResultView result={result} />
              ) : (
                <p className="text-slate-400">
                  InstitutionAI results will appear here and save to Supabase
                  history automatically.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Saved InstitutionAI History</h2>

            {history.length > 0 && (
              <button
                onClick={clearHistory}
                className="rounded-xl border border-red-400/40 px-4 py-2 text-sm text-red-300 hover:bg-red-500/10"
              >
                Clear History
              </button>
            )}
          </div>

          <div className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {historyLoading ? (
              <p className="text-slate-400">Loading history...</p>
            ) : history.length === 0 ? (
              <p className="text-slate-400">
                No saved InstitutionAI history yet.
              </p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setResult(item.result)}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left hover:border-emerald-400/60"
                >
                  <p className="text-sm text-emerald-300">
                    {actions.find((a) => a.key === item.action)?.label ||
                      item.action}
                  </p>
                  <h3 className="mt-1 font-bold">
                    {item.institution_name || item.title}
                  </h3>
                  <p className="mt-2 text-xs text-slate-400">
                    {new Date(item.created_at).toLocaleString()}
                  </p>
                </button>
              ))
            )}
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-emerald-400"
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
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={5}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-emerald-400"
      />
    </label>
  );
}

function ResultView({ result }: { result: any }) {
  if (result?.error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
        {result.error}
      </div>
    );
  }

  return (
    <div className="space-y-5 text-slate-100">
      {Object.entries(result).map(([key, value]) => (
        <ResultSection key={key} title={formatTitle(key)} value={value} />
      ))}
    </div>
  );
}

function ResultSection({ title, value }: { title: string; value: any }) {
  if (Array.isArray(value)) {
    return (
      <div>
        <h3 className="mb-2 text-lg font-bold text-emerald-300">{title}</h3>
        <ul className="space-y-2">
          {value.length === 0 ? (
            <li className="rounded-xl border border-white/10 bg-white/5 p-3 text-slate-400">
              No data provided.
            </li>
          ) : (
            value.map((item, index) => (
              <li
                key={index}
                className="rounded-xl border border-white/10 bg-white/5 p-3"
              >
                {typeof item === "object" && item !== null ? (
                  <ResultView result={item} />
                ) : (
                  <span>{String(item)}</span>
                )}
              </li>
            ))
          )}
        </ul>
      </div>
    );
  }

  if (typeof value === "object" && value !== null) {
    return (
      <div>
        <h3 className="mb-2 text-lg font-bold text-emerald-300">{title}</h3>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ResultView result={value} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-lg font-bold text-emerald-300">{title}</h3>
      <p className="rounded-xl border border-white/10 bg-white/5 p-4 leading-relaxed text-slate-200">
        {String(value || "Not provided")}
      </p>
    </div>
  );
}

function formatTitle(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}