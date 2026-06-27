"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type HistoryItem = {
  id: string;
  user_id?: string;
  action: string;
  title: string | null;
  input: any;
  result: any;
  created_at: string;
};

const actions = [
  { key: "job_intelligence", label: "Job Intelligence" },
  { key: "improve_job_description", label: "Improve Job Description" },
  { key: "interview_pack", label: "Interview Pack" },
  { key: "analyze_candidate", label: "Analyze Candidate" },
  { key: "rank_candidates", label: "Rank Candidates" },
];

export default function EmployerAIPage() {
  const supabase = supabaseBrowser;

  const [userId, setUserId] = useState<string | null>(null);
  const [action, setAction] = useState("job_intelligence");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    job_title: "",
    company_name: "",
    industry: "",
    location: "",
    employment_type: "",
    experience_level: "",
    job_description: "",
    draft_description: "",
    candidate_name: "",
    candidate_cv_text: "",
    candidates_json: "",
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
      .from("employer_ai_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      console.error("EmployerAI history load error:", error);
      setMessage("Unable to load EmployerAI history.");
    } else {
      setHistory(data || []);
      if (data?.[0]?.result) setResult(data[0].result);
    }

    setHistoryLoading(false);
  }

  async function saveHistory(item: {
    action: string;
    title: string;
    input: any;
    result: any;
  }) {
    if (!userId) return;

    const { data, error } = await supabase
      .from("employer_ai_history")
      .insert({
        user_id: userId,
        action: item.action,
        title: item.title,
        input: item.input,
        result: item.result,
      })
      .select("*")
      .single();

    if (error) {
      console.error("EmployerAI history save error:", error);
      setMessage("AI result was generated but could not be saved to history.");
      return;
    }

    setHistory((prev) => [data, ...prev].slice(0, 30));
  }

  async function clearHistory() {
    if (!userId) return;

    const { error } = await supabase
      .from("employer_ai_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      console.error("EmployerAI history delete error:", error);
      setMessage("Unable to clear EmployerAI history.");
      return;
    }

    setHistory([]);
    setResult(null);
  }

  const updateForm = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const payload = useMemo(() => {
    let candidates: any[] = [];

    if (form.candidates_json.trim()) {
      try {
        candidates = JSON.parse(form.candidates_json);
      } catch {
        candidates = [];
      }
    }

    return {
      action,
      job_title: form.job_title,
      company_name: form.company_name,
      industry: form.industry,
      location: form.location,
      employment_type: form.employment_type,
      experience_level: form.experience_level,
      job_description: form.job_description,
      draft_description: form.draft_description,
      candidate_name: form.candidate_name,
      candidate_cv_text: form.candidate_cv_text,
      candidates,
    };
  }, [action, form]);

  async function runEmployerAI() {
    setLoading(true);
    setResult(null);
    setMessage("");

    try {
      const res = await fetch("/api/employer-ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data?.error || "EmployerAI request failed." });
        return;
      }

      setResult(data);

      await saveHistory({
        action,
        title: form.job_title || "EmployerAI Analysis",
        input: payload,
        result: data,
      });
    } catch {
      setResult({ error: "Unable to connect to EmployerAI." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-blue-300">
            TalentIQ EmployerAI
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Employer Hiring Intelligence Center
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Generate job intelligence, improve job descriptions, analyze
            candidates, rank applicants, and create structured interview packs.
          </p>

          {!userId && !historyLoading && (
            <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-200">
              Please log in to save EmployerAI history across reloads and
              devices.
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-sm text-red-200">
              {message}
            </p>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <label className="text-sm font-semibold text-slate-300">
              EmployerAI Action
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
              <Input label="Job Title" value={form.job_title} onChange={(v) => updateForm("job_title", v)} />
              <Input label="Company Name" value={form.company_name} onChange={(v) => updateForm("company_name", v)} />
              <Input label="Industry" value={form.industry} onChange={(v) => updateForm("industry", v)} />
              <Input label="Location" value={form.location} onChange={(v) => updateForm("location", v)} />
              <Input label="Employment Type" value={form.employment_type} onChange={(v) => updateForm("employment_type", v)} />
              <Input label="Experience Level" value={form.experience_level} onChange={(v) => updateForm("experience_level", v)} />
            </div>

            <Textarea label="Job Description" value={form.job_description} onChange={(v) => updateForm("job_description", v)} />

            {action === "improve_job_description" && (
              <Textarea label="Draft Job Description" value={form.draft_description} onChange={(v) => updateForm("draft_description", v)} />
            )}

            {(action === "analyze_candidate" || action === "interview_pack") && (
              <>
                <Input label="Candidate Name" value={form.candidate_name} onChange={(v) => updateForm("candidate_name", v)} />
                <Textarea label="Candidate CV / Profile Text" value={form.candidate_cv_text} onChange={(v) => updateForm("candidate_cv_text", v)} />
              </>
            )}

            {action === "rank_candidates" && (
              <Textarea
                label="Candidates JSON"
                value={form.candidates_json}
                onChange={(v) => updateForm("candidates_json", v)}
                placeholder='Example: [{"candidate_name":"Ada","skills":["Excel","SQL"],"experience":"2 years"}]'
              />
            )}

            <button
              onClick={runEmployerAI}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-blue-500 px-6 py-4 font-bold text-white hover:bg-blue-400 disabled:opacity-50"
            >
              {loading ? "Generating EmployerAI Intelligence..." : "Run EmployerAI"}
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">AI Result</h2>

            <div className="mt-4 max-h-[620px] overflow-auto rounded-2xl bg-slate-900 p-5 text-sm text-slate-100">
              {result ? (
                <pre className="whitespace-pre-wrap">{JSON.stringify(result, null, 2)}</pre>
              ) : (
                <p className="text-slate-400">
                  Your EmployerAI result will appear here and save to Supabase
                  history automatically.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Saved EmployerAI History</h2>

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
              <p className="text-slate-400">No saved EmployerAI history yet.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setResult(item.result)}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left hover:border-blue-400/60"
                >
                  <p className="text-sm text-blue-300">
                    {actions.find((a) => a.key === item.action)?.label || item.action}
                  </p>
                  <h3 className="mt-1 font-bold">{item.title}</h3>
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
    <label className="mt-4 block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={6}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-blue-400"
      />
    </label>
  );
}