"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type HistoryItem = {
  id: string;
  user_id?: string;
  action: string;
  title: string | null;
  platform_name: string | null;
  input: any;
  result: any;
  created_at: string;
};

const actions = [
  { key: "dashboard", label: "Admin Dashboard Intelligence" },
  { key: "growth", label: "Growth Intelligence" },
  { key: "revenue", label: "Revenue Intelligence" },
  { key: "risks", label: "Risk Intelligence" },
  { key: "recommendations", label: "Executive Recommendations" },
];

export default function AdminIntelligencePage() {
  const supabase = supabaseBrowser;

  const [userId, setUserId] = useState<string | null>(null);
  const [action, setAction] = useState("dashboard");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [result, setResult] = useState<any>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [message, setMessage] = useState("");

  const [form, setForm] = useState({
    platform_name: "TalentIQ",
    student_activity: "",
    employer_activity: "",
    institution_activity: "",
    ai_usage: "",
    revenue_notes: "",
    operational_notes: "",
    growth_notes: "",
    traffic_notes: "",
    conversion_notes: "",
    engagement_notes: "",
    subscription_notes: "",
    payment_notes: "",
    pricing_notes: "",
    technical_notes: "",
    user_activity_notes: "",
    moderation_notes: "",
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
      .from("admin_ai_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    if (error) {
      setMessage("Unable to load AdminAI history.");
    } else {
      setHistory(data || []);
      if (data?.[0]?.result) setResult(data[0].result);
    }

    setHistoryLoading(false);
  }

  function textMetric(title: string, value: string) {
    return value.trim()
      ? { title, notes: value }
      : {};
  }

  const payload = useMemo(() => {
    return {
      action,
      platform_name: form.platform_name || "TalentIQ",

      student_metrics: textMetric("Student Activity", form.student_activity),
      employer_metrics: textMetric("Employer Activity", form.employer_activity),
      institution_metrics: textMetric(
        "Institution Activity",
        form.institution_activity
      ),
      ai_usage_metrics: textMetric("AI Usage", form.ai_usage),
      revenue_metrics: textMetric("Revenue", form.revenue_notes),
      operational_metrics: textMetric("Operations", form.operational_notes),

      user_growth_data: textMetric("User Growth", form.growth_notes),
      traffic_data: textMetric("Traffic", form.traffic_notes),
      conversion_data: textMetric("Conversion", form.conversion_notes),
      engagement_data: textMetric("Engagement", form.engagement_notes),

      subscription_data: textMetric("Subscriptions", form.subscription_notes),
      payment_data: textMetric("Payments", form.payment_notes),
      employer_data: textMetric("Employer Revenue", form.employer_activity),
      institution_data: textMetric("Institution Revenue", form.institution_activity),
      pricing_notes: form.pricing_notes,

      technical_metrics: textMetric("Technical Metrics", form.technical_notes),
      user_activity_data: textMetric("User Activity", form.user_activity_notes),
      payment_activity_data: textMetric("Payment Activity", form.payment_notes),
      moderation_notes: form.moderation_notes,

      dashboard_intelligence: {},
      growth_intelligence: {},
      revenue_intelligence: {},
      risk_intelligence: {},
    };
  }, [action, form]);

  async function saveHistory(data: any) {
    if (!userId) return;

    const { data: saved, error } = await supabase
      .from("admin_ai_history")
      .insert({
        user_id: userId,
        action,
        title:
          actions.find((item) => item.key === action)?.label ||
          "AdminAI Analysis",
        platform_name: form.platform_name || "TalentIQ",
        input: payload,
        result: data,
      })
      .select("*")
      .single();

    if (error) {
      setMessage("AI result was generated but could not be saved to history.");
      return;
    }

    setHistory((prev) => [saved, ...prev].slice(0, 30));
  }

  async function runAdminAI() {
    setLoading(true);
    setResult(null);
    setMessage("");

    try {
      const res = await fetch("/api/admin-ai", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setResult({ error: data?.error || "AdminAI request failed." });
        return;
      }

      setResult(data);
      await saveHistory(data);
    } catch {
      setResult({ error: "Unable to connect to AdminAI." });
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!userId) return;

    const { error } = await supabase
      .from("admin_ai_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      setMessage("Unable to clear AdminAI history.");
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
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-purple-300">
            TalentIQ AdminAI
          </p>
          <h1 className="mt-3 text-4xl font-bold">
            Admin Intelligence Center
          </h1>
          <p className="mt-3 max-w-3xl text-slate-300">
            Generate executive intelligence on platform health, growth, revenue,
            risks, AI usage, and admin priorities.
          </p>

          {!userId && !historyLoading && (
            <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm text-yellow-200">
              Please log in to save AdminAI history across reloads and devices.
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
              AdminAI Action
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

            <div className="mt-6">
              <Input
                label="Platform Name"
                value={form.platform_name}
                onChange={(v) => updateForm("platform_name", v)}
              />
            </div>

            {(action === "dashboard" || action === "recommendations") && (
              <>
                <Textarea
                  label="Student Activity Summary"
                  value={form.student_activity}
                  onChange={(v) => updateForm("student_activity", v)}
                  placeholder="Example: 1,200 registered students, 340 active this week, 180 CV reviews, 95 interview sessions."
                />
                <Textarea
                  label="Employer Activity Summary"
                  value={form.employer_activity}
                  onChange={(v) => updateForm("employer_activity", v)}
                  placeholder="Example: 45 employers registered, 120 jobs posted, 18 active subscriptions."
                />
                <Textarea
                  label="Institution Activity Summary"
                  value={form.institution_activity}
                  onChange={(v) => updateForm("institution_activity", v)}
                  placeholder="Example: 6 institutions onboarded, 2 pilot discussions ongoing."
                />
                <Textarea
                  label="AI Usage Summary"
                  value={form.ai_usage}
                  onChange={(v) => updateForm("ai_usage", v)}
                  placeholder="Example: CV Intelligence and InterviewIQ are the most used tools; EmployerAI is growing."
                />
                <Textarea
                  label="Revenue Notes"
                  value={form.revenue_notes}
                  onChange={(v) => updateForm("revenue_notes", v)}
                />
                <Textarea
                  label="Operational Notes"
                  value={form.operational_notes}
                  onChange={(v) => updateForm("operational_notes", v)}
                />
              </>
            )}

            {(action === "growth" || action === "recommendations") && (
              <>
                <Textarea
                  label="User Growth Notes"
                  value={form.growth_notes}
                  onChange={(v) => updateForm("growth_notes", v)}
                />
                <Textarea
                  label="Traffic Notes"
                  value={form.traffic_notes}
                  onChange={(v) => updateForm("traffic_notes", v)}
                />
                <Textarea
                  label="Conversion Notes"
                  value={form.conversion_notes}
                  onChange={(v) => updateForm("conversion_notes", v)}
                />
                <Textarea
                  label="Engagement Notes"
                  value={form.engagement_notes}
                  onChange={(v) => updateForm("engagement_notes", v)}
                />
              </>
            )}

            {(action === "revenue" || action === "recommendations") && (
              <>
                <Textarea
                  label="Subscription Notes"
                  value={form.subscription_notes}
                  onChange={(v) => updateForm("subscription_notes", v)}
                />
                <Textarea
                  label="Payment Notes"
                  value={form.payment_notes}
                  onChange={(v) => updateForm("payment_notes", v)}
                />
                <Textarea
                  label="Pricing Notes"
                  value={form.pricing_notes}
                  onChange={(v) => updateForm("pricing_notes", v)}
                />
              </>
            )}

            {(action === "risks" || action === "recommendations") && (
              <>
                <Textarea
                  label="Technical / System Notes"
                  value={form.technical_notes}
                  onChange={(v) => updateForm("technical_notes", v)}
                />
                <Textarea
                  label="User Activity Risk Notes"
                  value={form.user_activity_notes}
                  onChange={(v) => updateForm("user_activity_notes", v)}
                />
                <Textarea
                  label="Moderation / Abuse Notes"
                  value={form.moderation_notes}
                  onChange={(v) => updateForm("moderation_notes", v)}
                />
              </>
            )}

            <button
              onClick={runAdminAI}
              disabled={loading}
              className="mt-6 w-full rounded-2xl bg-purple-500 px-6 py-4 font-bold text-white hover:bg-purple-400 disabled:opacity-50"
            >
              {loading ? "Generating Admin Intelligence..." : "Run AdminAI"}
            </button>
          </section>

          <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-xl font-bold">AdminAI Result</h2>

            <div className="mt-4 max-h-[760px] overflow-auto rounded-2xl bg-slate-900 p-5 text-sm text-slate-100">
              {result ? (
                <ResultView result={result} />
              ) : (
                <p className="text-slate-400">
                  AdminAI results will appear here and save to Supabase history
                  automatically.
                </p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <div className="flex items-center justify-between gap-4">
            <h2 className="text-xl font-bold">Saved AdminAI History</h2>

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
              <p className="text-slate-400">No saved AdminAI history yet.</p>
            ) : (
              history.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setResult(item.result)}
                  className="rounded-2xl border border-white/10 bg-slate-900 p-4 text-left hover:border-purple-400/60"
                >
                  <p className="text-sm text-purple-300">
                    {actions.find((a) => a.key === item.action)?.label ||
                      item.action}
                  </p>
                  <h3 className="mt-1 font-bold">
                    {item.platform_name || item.title}
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-purple-400"
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
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-purple-400"
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
        <h3 className="mb-2 text-lg font-bold text-purple-300">{title}</h3>
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
        <h3 className="mb-2 text-lg font-bold text-purple-300">{title}</h3>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ResultView result={value} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-lg font-bold text-purple-300">{title}</h3>
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