"use client";

import { useEffect, useMemo, useState } from "react";
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
  Search,
  Target,
  AlertTriangle,
  CheckCircle,
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
  location_display?: string | null;
  country?: string | null;
  work_type?: string | null;
  employment_type?: string | null;
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

type WeaknessItem = {
  area: string;
  risk: string;
  note: string;
};

type InterviewReadiness = {
  readiness_score: number;
  success_probability: number;
  matched_keywords: string[];
  missing_keywords: string[];
  weakness_heatmap: WeaknessItem[];
  recommended_learning_actions: string[];
  summary: string;
};

export default function InterviewIQPage() {
  const [userId, setUserId] = useState("");
  const [targetRole, setTargetRole] = useState("Business Analyst");
  const [companyName, setCompanyName] = useState("");
  const [jobContext, setJobContext] = useState<JobContext | null>(null);
  const [selectedJobId, setSelectedJobId] = useState("");
  const [availableJobs, setAvailableJobs] = useState<JobContext[]>([]);
  const [jobSearch, setJobSearch] = useState("");
  const [mode, setMode] = useState<"single" | "multi">("single");

  const [readiness, setReadiness] = useState<InterviewReadiness | null>(null);
  const [readinessLoading, setReadinessLoading] = useState(false);

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
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");

  const filteredJobs = useMemo(() => {
    const search = jobSearch.toLowerCase().trim();

    if (!search) return availableJobs;

    return availableJobs.filter((job) =>
      job.title?.toLowerCase().includes(search) ||
      job.company_name?.toLowerCase().includes(search) ||
      job.location_display?.toLowerCase().includes(search) ||
      job.country?.toLowerCase().includes(search)
    );
  }, [availableJobs, jobSearch]);

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

        await loadAvailableJobs();

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
          await loadJobContext(jobId, user.id);
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

  async function loadAvailableJobs() {
    const { data, error } = await supabaseBrowser
      .from("jobs")
      .select(
        "id,title,company_name,description,requirements,responsibilities,location_display,country,work_type,employment_type"
      )
      .is("deleted_at", null)
      .order("posted_at", { ascending: false })
      .limit(200);

    if (error) {
      console.error("Job load error:", error);
      return;
    }

    setAvailableJobs((data || []) as JobContext[]);
  }

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

  async function loadJobContext(jobId: string, currentUserId?: string) {
    const { data } = await supabaseBrowser
      .from("jobs")
      .select(
        "id,title,company_name,description,requirements,responsibilities,location_display,country,work_type,employment_type"
      )
      .eq("id", jobId)
      .maybeSingle();

    if (data) {
      const job = data as JobContext;
      setSelectedJobId(job.id);
      setJobContext(job);
      setTargetRole(job.title || "Job Interview");
      setCompanyName(job.company_name || "");

      if (currentUserId) {
        await calculateReadiness(job, currentUserId);
      }
    }
  }

  async function getLatestAiMatchResult(currentUserId: string, jobId?: string) {
    if (!jobId) return {};

    try {
      const response = await fetch("/api/ai-match-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          user_id: currentUserId,
          job_id: jobId,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") return {};

      return data.history?.[0]?.result || {};
    } catch {
      return {};
    }
  }

  async function calculateReadiness(
    selectedJob: JobContext | null = jobContext,
    currentUserId: string = userId
  ) {
    if (!currentUserId) return;

    setReadinessLoading(true);
    setMessage("");

    try {
      const aiMatchResult = await getLatestAiMatchResult(
        currentUserId,
        selectedJob?.id
      );

      const response = await fetch("/api/interview-iq/readiness", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
        body: JSON.stringify({
          user_id: currentUserId,
          job_context: selectedJob || {
            title: targetRole,
            company_name: companyName,
          },
          ai_match_result: aiMatchResult,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to calculate interview readiness.");
        return;
      }

      setReadiness(data.readiness || null);
    } catch {
      setMessage("Unable to calculate interview readiness.");
    } finally {
      setReadinessLoading(false);
    }
  }

  function handleSelectJob(jobId: string) {
    setSelectedJobId(jobId);

    const selected = availableJobs.find((job) => job.id === jobId);

    if (!selected) return;

    setJobContext(selected);
    setTargetRole(selected.title || "Job Interview");
    setCompanyName(selected.company_name || "");
    resetInterview();
    calculateReadiness(selected, userId);
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

  function retakeInterview(session: MultiRoundSession) {
    setMode("multi");
    setTargetRole(session.target_role || "Job Interview");
    setCompanyName(session.company_name || "");
    setJobContext(session.job_context || null);
    setSelectedJobId(session.job_context?.id || "");
    setQuestion("");
    setAnswer("");
    setFeedback("");
    setScore(null);
    setRounds([]);
    setCurrentRound(0);
    setFinalAssessment(null);
    setMessage("Interview setup restored. Click Start Multi-Round Interview to retake.");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

        if (data.session) {
          setMultiSessions((prev) => [data.session, ...prev]);
          setExpandedSessionId(data.session.id);
          setMessage("Interview saved successfully. Your saved interview card is now available below.");
        } else {
          await loadMultiRoundSessions(userId);
          setMessage("Interview completed. If the saved card does not appear, refresh the page.");
        }
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
    setExpandedSessionId(null);
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
              Select a live advertised job, check your readiness, and practice realistic interview questions.
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
          <p className="mt-2 text-sm text-slate-600">
            {jobContext.location_display || jobContext.country || "Location not stated"}
            {jobContext.work_type ? ` • ${jobContext.work_type}` : ""}
            {jobContext.employment_type ? ` • ${jobContext.employment_type}` : ""}
          </p>
        </section>
      )}

      {readiness && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="flex items-center gap-3">
            <Target className="text-blue-700" />
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                Interview Readiness Intelligence
              </p>
              <h2 className="mt-1 text-2xl font-bold text-slate-900">
                Readiness Score: {readiness.readiness_score}%
              </h2>
            </div>
          </div>

          <p className="mt-4 text-slate-700">{readiness.summary}</p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <ScoreCard title="Interview Success Probability" value={`${readiness.success_probability}%`} />
            <ScoreCard title="Missing Keywords" value={`${readiness.missing_keywords.length}`} />
          </div>

          <div className="mt-6 grid gap-5 md:grid-cols-2">
            <KeywordPanel title="Matched Keywords" items={readiness.matched_keywords} type="positive" />
            <KeywordPanel title="Missing Keywords" items={readiness.missing_keywords} type="warning" />
          </div>

          <div className="mt-6 rounded-2xl bg-slate-50 p-5">
            <h3 className="font-bold text-slate-900">Weakness Heatmap</h3>
            <div className="mt-4 space-y-3">
              {readiness.weakness_heatmap.map((item) => (
                <div key={item.area} className="rounded-xl bg-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-slate-900">{item.area}</p>
                    <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-bold text-amber-700">
                      {item.risk}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{item.note}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-blue-50 p-5">
            <h3 className="font-bold text-slate-900">Recommended Learning Actions</h3>
            <ul className="mt-4 space-y-2">
              {readiness.recommended_learning_actions.map((action) => (
                <li key={action} className="flex gap-2 text-sm text-slate-700">
                  <CheckCircle size={16} className="mt-0.5 text-blue-700" />
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>
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
            Search Live Job
          </label>

          <div className="mt-2 flex items-center gap-2 rounded-xl border px-4 py-3">
            <Search size={18} className="text-slate-400" />
            <input
              value={jobSearch}
              onChange={(e) => setJobSearch(e.target.value)}
              placeholder="Search job title, company or location"
              className="w-full outline-none"
            />
          </div>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Target Job
          </label>

          <select
            value={selectedJobId}
            onChange={(e) => handleSelectJob(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          >
            <option value="">Select a live advertised job...</option>
            {filteredJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.title || "Untitled Job"} — {job.company_name || "Company not stated"}
              </option>
            ))}
          </select>

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
            onClick={() => calculateReadiness()}
            disabled={readinessLoading}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            <AlertTriangle size={18} />
            {readinessLoading ? "Checking..." : "Check Interview Readiness"}
          </button>

          <button
            onClick={mode === "single" ? startSingleInterview : startMultiRoundInterview}
            disabled={starting}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
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
                onClick={mode === "single" ? submitSingleAnswer : submitMultiRoundAnswer}
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
              Select a live job or enter a role, then start an interview.
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
            Saved Interview Cards
          </h2>

          <div className="mt-5 space-y-5">
            {multiSessions.map((session) => {
              const isOpen = expandedSessionId === session.id;
              const assessment = session.assessment || {};
              const overallScore = assessment.overall_score || 0;

              return (
                <div
                  key={session.id}
                  className="rounded-3xl border bg-white p-6 shadow-sm"
                >
                  <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
                        Completed Interview
                      </p>

                      <h3 className="mt-2 text-2xl font-bold text-slate-900">
                        {session.target_role || "Multi-Round Interview"}
                      </h3>

                      <p className="mt-1 text-slate-600">
                        {session.company_name || "General Interview"}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {session.created_at
                          ? new Date(session.created_at).toLocaleString()
                          : "Date not available"}
                      </p>

                      <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-700">
                        <span className="font-semibold">Recommendation: </span>
                        {assessment.recommendation || "Not available"}
                      </p>
                    </div>

                    <div className="rounded-3xl bg-blue-50 px-6 py-5 text-center text-blue-700">
                      <p className="text-4xl font-bold">{overallScore}%</p>
                      <p className="text-xs font-semibold">Overall Score</p>
                    </div>
                  </div>

                  <div className="mt-5 grid gap-4 md:grid-cols-5">
                    <ScoreBox title="Communication" value={assessment.communication_score} />
                    <ScoreBox title="Technical" value={assessment.technical_score} />
                    <ScoreBox title="Confidence" value={assessment.confidence_score} />
                    <ScoreBox title="Problem Solving" value={assessment.problem_solving_score} />
                    <ScoreBox title="Role Fit" value={assessment.role_fit_score} />
                  </div>

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button
                      onClick={() =>
                        setExpandedSessionId(isOpen ? null : session.id)
                      }
                      className="rounded-xl bg-slate-900 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      {isOpen ? "Hide Report" : "View Report"}
                    </button>

                    <button
                      onClick={() => downloadSavedMultiRoundReport(session)}
                      className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700"
                    >
                      <Download size={16} />
                      Download PDF
                    </button>

                    <button
                      onClick={() => retakeInterview(session)}
                      className="rounded-xl border px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      Retake Interview
                    </button>

                    <button
                      onClick={() => deleteMultiRoundSession(session.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-4 py-3 font-semibold text-red-700 hover:bg-red-50"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>

                  {isOpen && (
                    <div className="mt-6 space-y-6 border-t pt-6">
                      <div className="grid gap-5 md:grid-cols-3">
                        <TextBox title="Strengths" content={assessment.strengths} />
                        <TextBox title="Improvements" content={assessment.improvements} />
                        <TextBox title="Final Feedback" content={assessment.final_feedback} />
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <h4 className="text-lg font-bold text-slate-900">
                          Questions and Answers
                        </h4>

                        <div className="mt-4 space-y-4">
                          {(session.rounds || []).map((round) => (
                            <div
                              key={round.round}
                              className="rounded-2xl bg-white p-5"
                            >
                              <p className="text-sm font-semibold text-blue-700">
                                Round {round.round}
                              </p>

                              <p className="mt-2 font-bold text-slate-900">
                                Question
                              </p>
                              <p className="mt-1 text-sm leading-6 text-slate-700">
                                {round.question || "Question not available."}
                              </p>

                              <p className="mt-4 font-bold text-slate-900">
                                Candidate Answer
                              </p>
                              <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">
                                {round.answer || "No answer recorded."}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
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

function ScoreCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl bg-blue-50 p-5 text-blue-700">
      <p className="text-sm font-semibold">{title}</p>
      <p className="mt-2 text-3xl font-bold">{value}</p>
    </div>
  );
}

function KeywordPanel({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: "positive" | "warning";
}) {
  return (
    <div className="rounded-2xl bg-slate-50 p-5">
      <h3 className="font-bold text-slate-900">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((item) => (
            <span
              key={item}
              className={
                type === "positive"
                  ? "rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700"
                  : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
              }
            >
              {item}
            </span>
          ))
        ) : (
          <p className="text-sm text-slate-500">None detected.</p>
        )}
      </div>
    </div>
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