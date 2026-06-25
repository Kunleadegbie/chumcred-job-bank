"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import jsPDF from "jspdf";
import {
  Brain,
  Send,
  Sparkles,
  RotateCcw,
  Trophy,
  Download,
  Trash2,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type InterviewSession = {
  id: string;
  target_role: string | null;
  question: string | null;
  user_answer: string | null;
  feedback: string | null;
  score: number | null;
  created_at: string | null;
};

type JobContext = {
  id: string;
  title: string | null;
  company_name: string | null;
  description: string | null;
  requirements: string | null;
  responsibilities: string | null;
};

type InterviewRound = {
  round: number;
  question: string;
  answer: string;
};

type FinalAssessment = {
  overall_score?: number;
  communication_score?: number;
  technical_score?: number;
  confidence_score?: number;
  problem_solving_score?: number;
  role_fit_score?: number;
  recommendation?: string;
  strengths?: string;
  improvements?: string;
  final_feedback?: string;
};

type MultiRoundSession = {
  id: string;
  target_role: string;
  company_name: string | null;
  job_context: JobContext | null;
  rounds: InterviewRound[];
  assessment: FinalAssessment;
  created_at: string;
};

export default function InterviewIQPage() {
  const [userId, setUserId] = useState("");
  const [targetRole, setTargetRole] = useState("Business Analyst");
  const [companyName, setCompanyName] = useState("");
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [mode, setMode] = useState<"single" | "multi">("single");

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [feedback, setFeedback] = useState("");
  const [score, setScore] = useState<number | null>(null);

  const [rounds, setRounds] = useState<InterviewRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [maxRounds, setMaxRounds] = useState(5);
  const [finalAssessment, setFinalAssessment] =
    useState<FinalAssessment | null>(null);

  const [sessions, setSessions] = useState<InterviewSession[]>([]);
  const [multiSessions, setMultiSessions] = useState<MultiRoundSession[]>([]);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function init() {
      try {
        const { data: userData } = await supabaseBrowser.auth.getUser();
        const user = userData.user;

        if (!user) {
          window.location.href = "/login";
          return;
        }

        setUserId(user.id);

        const params = new URLSearchParams(window.location.search);
        const jobId = params.get("job_id");
        const roleFromUrl = params.get("role");
        const companyFromUrl = params.get("company");
        const modeFromUrl = params.get("mode");
        const sourceFromUrl = params.get("source");

        if (modeFromUrl === "multi" || sourceFromUrl === "recommended") {
          setMode("multi");
        }

        if (jobId) {
          await loadJobContext(jobId);
        } else if (roleFromUrl) {
          setTargetRole(roleFromUrl);
          setCompanyName(companyFromUrl || "");
        }

        await loadSessions(user.id);
        await loadMultiRoundSessions(user.id);
      } catch (error) {
        console.error(error);
        setMessage("InterviewIQ loaded with limited history. You can continue.");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, []);

  async function loadSessions(currentUserId: string) {
    const { data } = await supabaseBrowser
      .from("interview_iq_sessions")
      .select("id,target_role,question,user_answer,feedback,score,created_at")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(10);

    setSessions((data || []) as InterviewSession[]);
  }

  async function loadMultiRoundSessions(currentUserId: string) {
    const { data } = await supabaseBrowser
      .from("multi_round_interview_sessions")
      .select("*")
      .eq("user_id", currentUserId)
      .order("created_at", { ascending: false })
      .limit(20);

    setMultiSessions((data || []) as MultiRoundSession[]);
  }

  async function loadJobContext(jobId: string) {
    const { data } = await supabaseBrowser
      .from("jobs")
      .select("id,title,company_name,description,requirements,responsibilities")
      .eq("id", jobId)
      .maybeSingle();

    if (data) {
      const job = data as JobContext;
      setJobContext(job);
      setTargetRole(job.title || "Job Interview");
      setCompanyName(job.company_name || "");
    }
  }

  function resetInterview() {
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);
    setRounds([]);
    setCurrentRound(0);
    setFinalAssessment(null);
    setMessage("");
  }

  async function startSingleInterview() {
    if (!userId || !targetRole.trim()) return;

    setStarting(true);
    setMessage("");
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);

    try {
      const response = await fetch("/api/interview-iq/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          company_name: companyName,
          job_context: jobContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate question.");
        return;
      }

      setQuestion(data.question || "");
    } catch {
      setMessage("Unable to generate question.");
    } finally {
      setStarting(false);
    }
  }

  async function submitSingleAnswer() {
    if (!userId || !targetRole || !question || !answer.trim()) {
      setMessage("Please enter your answer before submitting.");
      return;
    }

    setReviewing(true);
    setMessage("");

    try {
      const response = await fetch("/api/interview-iq/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          question,
          answer,
          job_context: jobContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to review answer.");
        return;
      }

      setFeedback(data.review?.feedback || "");
      setScore(data.review?.score || 0);
      await loadSessions(userId);
    } catch {
      setMessage("Unable to review answer.");
    } finally {
      setReviewing(false);
    }
  }

  async function startMultiRoundInterview() {
    if (!userId || !targetRole.trim()) return;

    setStarting(true);
    setMessage("");
    setQuestion("");
    setAnswer("");
    setRounds([]);
    setCurrentRound(0);
    setFinalAssessment(null);

    try {
      const response = await fetch("/api/interview-iq/start-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          company_name: companyName,
          job_context: jobContext,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to start interview.");
        return;
      }

      setQuestion(data.question || "");
      setRounds((data.rounds || []) as InterviewRound[]);
      setCurrentRound(data.round || 1);
      setMaxRounds(data.max_rounds || 5);
    } catch {
      setMessage("Unable to start interview.");
    } finally {
      setStarting(false);
    }
  }

  async function submitMultiRoundAnswer() {
    if (!answer.trim()) {
      setMessage("Please enter your answer before moving to the next round.");
      return;
    }

    setReviewing(true);
    setMessage("");

    try {
      if (currentRound >= maxRounds) {
        const completedRounds = [...rounds];

        completedRounds[completedRounds.length - 1] = {
          ...completedRounds[completedRounds.length - 1],
          answer,
        };

        const response = await fetch("/api/interview-iq/end-session", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            user_id: userId,
            target_role: targetRole,
            company_name: companyName,
            job_context: jobContext,
            rounds: completedRounds,
          }),
        });

        const data = await response.json();

        if (!response.ok || data.status === "error") {
          setMessage(data.message || data.error || "Unable to end interview.");
          return;
        }

        setRounds(completedRounds);
        setFinalAssessment(data.assessment || null);
        setQuestion("");
        setAnswer("");
        await loadMultiRoundSessions(userId);
        return;
      }

      const response = await fetch("/api/interview-iq/next-question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          company_name: companyName,
          job_context: jobContext,
          rounds,
          answer,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate next question.");
        return;
      }

      setRounds((data.rounds || []) as InterviewRound[]);
      setCurrentRound(data.round || currentRound + 1);
      setQuestion(data.question || "");
      setAnswer("");
    } catch {
      setMessage("Unable to continue interview.");
    } finally {
      setReviewing(false);
    }
  }

  async function deleteMultiRoundSession(sessionId: string) {
    if (!userId) return;

    const confirmed = window.confirm(
      "Delete this saved multi-round interview permanently?"
    );

    if (!confirmed) return;

    const { error } = await supabaseBrowser
      .from("multi_round_interview_sessions")
      .delete()
      .eq("id", sessionId)
      .eq("user_id", userId);

    if (error) {
      setMessage(error.message || "Unable to delete saved interview.");
      return;
    }

    await loadMultiRoundSessions(userId);
    setMessage("Saved multi-round interview deleted.");
  }

  function createMultiRoundPdf(
    assessment: FinalAssessment,
    reportRounds: InterviewRound[],
    role: string,
    company: string | null
  ) {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.getWidth();
    const maxWidth = pageWidth - margin * 2;
    let y = 18;

    function addText(title: string, content: string) {
      if (y > 260) {
        doc.addPage();
        y = 18;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.text(title, margin, y);

      y += 7;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);

      const lines = doc.splitTextToSize(content || "Not available.", maxWidth);
      doc.text(lines, margin, y);

      y += lines.length * 5 + 8;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Chumcred Multi-Round InterviewIQ Report", margin, y);

    y += 8;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Generated by Chumcred Global Job Bank", margin, y);

    y += 10;
    doc.line(margin, y, pageWidth - margin, y);

    y += 12;
    addText("Target Role", role);
    addText("Company", company || "Not specified");

    addText(
      "Overall Assessment",
      `Overall Score: ${assessment.overall_score || 0}%
Communication: ${assessment.communication_score || 0}%
Technical: ${assessment.technical_score || 0}%
Confidence: ${assessment.confidence_score || 0}%
Problem Solving: ${assessment.problem_solving_score || 0}%
Role Fit: ${assessment.role_fit_score || 0}%
Recommendation: ${assessment.recommendation || "Not available"}`
    );

    reportRounds.forEach((round) => {
      addText(
        `Round ${round.round}`,
        `Question:
${round.question}

Candidate Answer:
${round.answer || "Not answered."}`
      );
    });

    addText("Strengths", assessment.strengths || "");
    addText("Improvements", assessment.improvements || "");
    addText("Final Feedback", assessment.final_feedback || "");

    doc.save(`Multi_Round_InterviewIQ_Report_${Date.now()}.pdf`);
  }

  function downloadMultiRoundReport() {
    if (!finalAssessment) {
      setMessage("Please complete the multi-round interview first.");
      return;
    }

    createMultiRoundPdf(finalAssessment, rounds, targetRole, companyName);
  }

  function downloadSavedMultiRoundReport(session: MultiRoundSession) {
    createMultiRoundPdf(
      session.assessment,
      session.rounds,
      session.target_role,
      session.company_name
    );
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-slate-600">Loading InterviewIQ...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <section className="mt-8 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-blue-600 p-3">
            <Brain size={34} />
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
              InterviewIQ
            </p>

            <h1 className="mt-2 text-4xl font-bold">
              Practice Job Interviews with AI
            </h1>

            <p className="mt-3 max-w-3xl text-slate-300">
              Practice realistic job interviews based on your role, company and job context.
            </p>
          </div>
        </div>
      </section>

      {message && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
          {message}
        </div>
      )}

      {jobContext && (
        <section className="mt-8 rounded-3xl border bg-blue-50 p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Job-Aware Interview Mode
          </p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            {jobContext.title}
          </h2>
          <p className="mt-1 text-slate-700">
            {jobContext.company_name || "Company not stated"}
          </p>
        </section>
      )}

      <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-bold text-slate-900">Interview Mode</h2>

        <div className="mt-5 flex flex-wrap gap-3">
          <button
            onClick={() => {
              resetInterview();
              setMode("single");
            }}
            className={`rounded-xl px-5 py-3 font-semibold ${
              mode === "single"
                ? "bg-blue-600 text-white"
                : "border text-slate-700 hover:bg-slate-50"
            }`}
          >
            Single InterviewIQ
          </button>

          <button
            onClick={() => {
              resetInterview();
              setMode("multi");
            }}
            className={`rounded-xl px-5 py-3 font-semibold ${
              mode === "multi"
                ? "bg-slate-900 text-white"
                : "border text-slate-700 hover:bg-slate-50"
            }`}
          >
            Multi-Round InterviewIQ
          </button>
        </div>
      </section>

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Interview Setup</h2>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Target Role
          </label>

          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          />

          {mode === "multi" && (
            <>
              <label className="mt-5 block text-sm font-semibold text-slate-700">
                Company Name
              </label>

              <input
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Example: Access Bank"
                className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
              />
            </>
          )}

          <button
            onClick={mode === "single" ? startSingleInterview : startMultiRoundInterview}
            disabled={starting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {starting
              ? "Starting..."
              : mode === "single"
              ? "Start Interview"
              : "Start Multi-Round Interview"}
          </button>

          <button
            onClick={resetInterview}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RotateCcw size={18} />
            Reset
          </button>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">
            {mode === "multi"
              ? `Question ${currentRound || 1} of ${maxRounds}`
              : "Current Question"}
          </h2>

          {question ? (
            <>
              <div className="mt-5 rounded-2xl bg-slate-50 p-5">
                <p className="text-lg font-semibold text-slate-900">
                  {question}
                </p>
              </div>

              <label className="mt-6 block text-sm font-semibold text-slate-700">
                Your Answer
              </label>

              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                rows={7}
                placeholder="Type your interview answer here."
                className="mt-2 w-full rounded-2xl border px-4 py-3 outline-none focus:border-blue-600"
              />

              <button
                onClick={
                  mode === "single" ? submitSingleAnswer : submitMultiRoundAnswer
                }
                disabled={reviewing}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <Send size={18} />
                {reviewing
                  ? "Processing..."
                  : mode === "single"
                  ? "Submit Answer"
                  : currentRound >= maxRounds
                  ? "Finish Interview"
                  : "Submit & Continue"}
              </button>
            </>
          ) : finalAssessment ? (
            <div className="mt-5 rounded-2xl bg-green-50 p-6 text-green-800">
              Interview completed. See final assessment below.
            </div>
          ) : (
            <div className="mt-5 rounded-2xl border border-dashed p-8 text-center text-slate-600">
              Start an interview to generate your first question.
            </div>
          )}
        </div>
      </section>

      {feedback && mode === "single" && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            AI Interview Feedback
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Score: {score || 0}
          </h2>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <p className="whitespace-pre-line text-sm leading-7 text-slate-700">
              {feedback}
            </p>
          </div>
        </section>
      )}

      {rounds.length > 0 && mode === "multi" && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Interview Rounds
          </h2>

          <div className="mt-5 space-y-4">
            {rounds.map((round) => (
              <div key={round.round} className="rounded-2xl bg-slate-50 p-5">
                <p className="text-sm font-semibold text-blue-700">
                  Round {round.round}
                </p>
                <p className="mt-2 font-semibold text-slate-900">
                  {round.question}
                </p>
                {round.answer && (
                  <p className="mt-3 text-sm text-slate-600">
                    {round.answer}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {finalAssessment && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <Trophy className="text-amber-600" />
            <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
              Final Interview Assessment
            </p>
          </div>

          <h2 className="mt-3 text-4xl font-bold text-slate-900">
            Overall Score: {finalAssessment.overall_score || 0}%
          </h2>

          <button
            onClick={downloadMultiRoundReport}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Download size={18} />
            Download Multi-Round Interview Report
          </button>

          <p className="mt-3 text-lg font-semibold text-slate-700">
            Recommendation: {finalAssessment.recommendation || "Not available"}
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <ScoreBox title="Communication" value={finalAssessment.communication_score} />
            <ScoreBox title="Technical" value={finalAssessment.technical_score} />
            <ScoreBox title="Confidence" value={finalAssessment.confidence_score} />
            <ScoreBox title="Problem Solving" value={finalAssessment.problem_solving_score} />
            <ScoreBox title="Role Fit" value={finalAssessment.role_fit_score} />
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <TextBox title="Strengths" content={finalAssessment.strengths} />
            <TextBox title="Improvements" content={finalAssessment.improvements} />
            <TextBox title="Final Feedback" content={finalAssessment.final_feedback} />
          </div>
        </section>
      )}

      {multiSessions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">
            Previous Multi-Round Interviews
          </h2>

          <div className="mt-5 space-y-4">
            {multiSessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                  {session.target_role || "Multi-Round Interview"}
                </p>

                <h3 className="mt-2 text-xl font-bold text-slate-900">
                  Overall Score: {session.assessment?.overall_score || 0}%
                </h3>

                <p className="mt-2 text-slate-600">
                  {session.company_name || "General Interview"}
                </p>

                <p className="mt-2 text-sm text-slate-500">
                  {session.created_at
                    ? new Date(session.created_at).toLocaleString()
                    : ""}
                </p>

                <div className="mt-5 flex flex-wrap gap-3">
                  <button
                    onClick={() => downloadSavedMultiRoundReport(session)}
                    className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                  >
                    <Download size={16} />
                    Download Report
                  </button>

                  <button
                    onClick={() => deleteMultiRoundSession(session.id)}
                    className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 hover:bg-red-50"
                  >
                    <Trash2 size={16} />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {sessions.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold text-slate-900">
            Previous Single Interview Practice
          </h2>

          <div className="mt-5 space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border bg-white p-6 shadow-sm"
              >
                <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                  {session.target_role || "Interview Practice"}
                </p>

                <h3 className="mt-2 text-lg font-bold text-slate-900">
                  {session.question}
                </h3>

                <p className="mt-2 text-sm text-slate-500">
                  Score: {session.score || 0}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}

function ScoreBox({ title, value }: { title: string; value?: number }) {
  return (
    <div className="rounded-2xl bg-blue-50 p-4 text-center text-blue-700">
      <p className="text-2xl font-bold">{value || 0}</p>
      <p className="mt-1 text-xs font-semibold">{title}</p>
    </div>
  );
}

function TextBox({ title, content }: { title: string; content?: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <p className="mt-3 whitespace-pre-line text-sm leading-7 text-slate-700">
        {content || "Not available."}
      </p>
    </div>
  );
}