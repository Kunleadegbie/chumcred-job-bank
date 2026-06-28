"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type CopilotHistoryItem = {
  id: string;
  user_id?: string;
  user_role: string | null;
  conversation_title: string | null;
  question: string;
  answer: any;
  detected_intent: string | null;
  specialist_used: string | null;
  context: any;
  created_at: string;
};

const roleOptions = [
  { value: "student", label: "Student / Job Seeker" },
  { value: "employer", label: "Employer" },
  { value: "institution", label: "Institution" },
  { value: "admin", label: "Admin" },
  { value: "enterprise", label: "Enterprise" },
  { value: "general", label: "General" },
];

const suggestedPrompts = [
  "Review my employability and give me a 30-day improvement plan.",
  "Help me prepare for an interview for a business analyst role.",
  "Generate hiring intelligence for a customer service manager role.",
  "Analyze graduate employability and identify skills gaps.",
  "Summarize platform growth, revenue opportunities and risks.",
];

export default function CopilotPage() {
  const supabase = supabaseBrowser;
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const [userId, setUserId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState("general");
  const [question, setQuestion] = useState("");
  const [contextText, setContextText] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [history, setHistory] = useState<CopilotHistoryItem[]>([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    loadUserAndHistory();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [history, loading]);

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
      .from("copilot_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(50);

    if (error) {
      console.error("Copilot history load error:", error);
      setMessage("Unable to load Copilot history.");
    } else {
      setHistory(data || []);
    }

    setHistoryLoading(false);
  }

  const parsedContext = useMemo(() => {
    if (!contextText.trim()) return {};

    return {
      notes: contextText.trim(),
    };
  }, [contextText]);

  async function saveHistory(data: any, askedQuestion: string) {
    const localItem: CopilotHistoryItem = {
      id: `local-${Date.now()}`,
      user_role: userRole,
      conversation_title: askedQuestion.slice(0, 80),
      question: askedQuestion,
      answer: data,
      detected_intent: data?.detected_intent || data?.intent || "general",
      specialist_used: data?.specialist_used || "TalentIQ Copilot",
      context: parsedContext,
      created_at: new Date().toISOString(),
    };

    if (!userId) {
      setHistory((prev) => [...prev, localItem].slice(-50));
      return;
    }

    const { data: saved, error } = await supabase
      .from("copilot_history")
      .insert({
        user_id: userId,
        user_role: userRole,
        conversation_title: askedQuestion.slice(0, 80),
        question: askedQuestion,
        answer: data,
        detected_intent: data?.detected_intent || data?.intent || "general",
        specialist_used: data?.specialist_used || "TalentIQ Copilot",
        context: parsedContext,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Copilot history save error:", error);
      setMessage(error.message || "Response generated but could not be saved to history.");
      setHistory((prev) => [...prev, localItem].slice(-50));
      return;
    }

    setHistory((prev) => [...prev, saved].slice(-50));
  }

  async function askCopilot(promptText?: string) {
    const finalQuestion = (promptText || question).trim();

    if (!finalQuestion) {
      setMessage("Please enter a question.");
      return;
    }

    setLoading(true);
    setMessage("");

    const optimisticUserMessage: CopilotHistoryItem = {
      id: `temp-${Date.now()}`,
      user_role: userRole,
      conversation_title: finalQuestion.slice(0, 80),
      question: finalQuestion,
      answer: null,
      detected_intent: null,
      specialist_used: null,
      context: parsedContext,
      created_at: new Date().toISOString(),
    };

    setHistory((prev) => [...prev, optimisticUserMessage]);
    setQuestion("");

    try {
      const res = await fetch("/api/copilot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: finalQuestion,
          user_role: userRole,
          context: parsedContext,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setHistory((prev) =>
          prev.map((item) =>
            item.id === optimisticUserMessage.id
              ? {
                  ...item,
                  answer: { error: data?.error || "Copilot request failed." },
                  detected_intent: "error",
                  specialist_used: "TalentIQ Copilot",
                }
              : item
          )
        );
        return;
      }

      setHistory((prev) =>
        prev.filter((item) => item.id !== optimisticUserMessage.id)
      );

      await saveHistory(data, finalQuestion);
    } catch {
      setHistory((prev) =>
        prev.map((item) =>
          item.id === optimisticUserMessage.id
            ? {
                ...item,
                answer: { error: "Unable to connect to TalentIQ Copilot." },
                detected_intent: "error",
                specialist_used: "TalentIQ Copilot",
              }
            : item
        )
      );
    } finally {
      setLoading(false);
    }
  }

  async function clearHistory() {
    if (!userId) return;

    const { error } = await supabase
      .from("copilot_history")
      .delete()
      .eq("user_id", userId);

    if (error) {
      setMessage("Unable to clear Copilot history.");
      return;
    }

    setHistory([]);
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-8 lg:grid-cols-[320px_1fr]">
        <aside className="rounded-3xl border border-white/10 bg-white/5 p-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-fuchsia-300">
            TalentIQ Copilot
          </p>
          <h1 className="mt-3 text-2xl font-bold">AI Command Center</h1>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Ask one assistant to coordinate CareerIQ, CV Intelligence,
            InterviewIQ, EmployerAI, InstitutionAI, AdminAI and Enterprise
            intelligence.
          </p>

          {!userId && !historyLoading && (
            <p className="mt-4 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm text-yellow-200">
              Please log in to save Copilot conversations after reload.
            </p>
          )}

          {message && (
            <p className="mt-4 rounded-xl border border-red-400/30 bg-red-400/10 p-3 text-sm text-red-200">
              {message}
            </p>
          )}

          <div className="mt-6">
            <label className="text-sm font-semibold text-slate-300">
              User Mode
            </label>
            <select
              value={userRole}
              onChange={(e) => setUserRole(e.target.value)}
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
            >
              {roleOptions.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mt-5">
            <label className="text-sm font-semibold text-slate-300">
              Optional Context
            </label>
            <textarea
              value={contextText}
              onChange={(e) => setContextText(e.target.value)}
              rows={8}
              placeholder="Paste CV notes, role details, institution data, employer notes, admin metrics, or enterprise context here."
              className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm text-white outline-none focus:border-fuchsia-400"
            />
          </div>

          <div className="mt-6 space-y-2">
            <p className="text-sm font-semibold text-slate-300">
              Suggested Prompts
            </p>
            {suggestedPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => askCopilot(prompt)}
                className="block w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-left text-sm text-slate-300 hover:border-fuchsia-400/60 hover:text-white"
              >
                {prompt}
              </button>
            ))}
          </div>

          {history.length > 0 && (
            <button
              onClick={clearHistory}
              className="mt-6 w-full rounded-xl border border-red-400/40 px-4 py-3 text-sm font-semibold text-red-300 hover:bg-red-500/10"
            >
              Clear Chat History
            </button>
          )}
        </aside>

        <section className="flex min-h-[760px] flex-col rounded-3xl border border-white/10 bg-white/5">
          <div className="border-b border-white/10 p-5">
            <h2 className="text-2xl font-bold">Chat with TalentIQ Copilot</h2>
            <p className="mt-1 text-sm text-slate-400">
              Conversations are saved to Supabase and restored after reload.
            </p>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-5">
            {historyLoading ? (
              <p className="text-slate-400">Loading chat history...</p>
            ) : history.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-white/20 p-10 text-center">
                <h3 className="text-2xl font-bold">Start a Copilot session</h3>
                <p className="mx-auto mt-3 max-w-2xl text-slate-400">
                  Ask about CVs, careers, interviews, job matching, employers,
                  institutions, admin intelligence, enterprise accounts, or
                  platform growth.
                </p>
              </div>
            ) : (
              history.map((item) => (
                <ChatTurn key={item.id} item={item} />
              ))
            )}

            {loading && (
              <div className="rounded-2xl border border-fuchsia-400/30 bg-fuchsia-500/10 p-4 text-fuchsia-200">
                TalentIQ Copilot is thinking...
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="border-t border-white/10 p-5">
            <div className="flex flex-col gap-3 md:flex-row">
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    askCopilot();
                  }
                }}
                rows={3}
                placeholder="Ask TalentIQ Copilot..."
                className="flex-1 rounded-2xl border border-white/10 bg-slate-900 p-4 text-white outline-none focus:border-fuchsia-400"
              />

              <button
                onClick={() => askCopilot()}
                disabled={loading}
                className="rounded-2xl bg-fuchsia-500 px-8 py-4 font-bold text-white hover:bg-fuchsia-400 disabled:opacity-50 md:w-40"
              >
                Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ChatTurn({ item }: { item: CopilotHistoryItem }) {
  return (
    <div className="space-y-3">
      <div className="ml-auto max-w-3xl rounded-2xl bg-fuchsia-500 px-5 py-4 text-white">
        <p className="text-sm font-semibold opacity-80">You</p>
        <p className="mt-1 whitespace-pre-wrap leading-7">{item.question}</p>
      </div>

      <div className="max-w-4xl rounded-2xl border border-white/10 bg-slate-900 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {item.detected_intent && (
            <Badge label={`Intent: ${item.detected_intent}`} />
          )}
          {item.specialist_used && <Badge label={item.specialist_used} />}
        </div>

        {item.answer ? (
          <ResultView result={item.answer} />
        ) : (
          <p className="text-slate-400">Waiting for response...</p>
        )}

        <p className="mt-4 text-xs text-slate-500">
          {new Date(item.created_at).toLocaleString()}
        </p>
      </div>
    </div>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-300">
      {label}
    </span>
  );
}

function ResultView({ result }: { result: any }) {
  if (typeof result === "string") {
    return <p className="whitespace-pre-wrap leading-7 text-slate-200">{result}</p>;
  }

  if (result?.error) {
    return (
      <div className="rounded-xl border border-red-400/30 bg-red-400/10 p-4 text-red-200">
        {result.error}
      </div>
    );
  }

  if (result?.answer) {
    return (
      <div className="space-y-5">
        {result.specialist_used && (
          <Badge label={`Specialist: ${result.specialist_used}`} />
        )}
        <ResultView result={result.answer} />
      </div>
    );
  }

  if (Array.isArray(result)) {
    return (
      <ul className="space-y-2">
        {result.map((item, index) => (
          <li
            key={index}
            className="rounded-xl border border-white/10 bg-white/5 p-3"
          >
            <ResultView result={item} />
          </li>
        ))}
      </ul>
    );
  }

  if (typeof result === "object" && result !== null) {
    return (
      <div className="space-y-5">
        {Object.entries(result).map(([key, value]) => (
          <ResultSection key={key} title={formatTitle(key)} value={value} />
        ))}
      </div>
    );
  }

  return <p className="text-slate-200">{String(result || "No response.")}</p>;
}

function ResultSection({ title, value }: { title: string; value: any }) {
  if (Array.isArray(value)) {
    return (
      <div>
        <h3 className="mb-2 text-lg font-bold text-fuchsia-300">{title}</h3>
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
                <ResultView result={item} />
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
        <h3 className="mb-2 text-lg font-bold text-fuchsia-300">{title}</h3>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4">
          <ResultView result={value} />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-2 text-lg font-bold text-fuchsia-300">{title}</h3>
      <p className="rounded-xl border border-white/10 bg-white/5 p-4 leading-7 text-slate-200">
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