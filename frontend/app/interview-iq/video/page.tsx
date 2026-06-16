"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Camera,
  Lock,
  Play,
  Square,
  Sparkles,
  FileText,
  BarChart3,
  Download,
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type Analysis = {
  communication_score?: number;
  confidence_score?: number;
  technical_score?: number;
  structure_score?: number;
  professionalism_score?: number;
  overall_score?: number;
  strengths?: string;
  improvements?: string;
  suggested_answer?: string;
};

export default function VideoInterviewIQPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [userId, setUserId] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const [targetRole, setTargetRole] = useState("Business Analyst");
  const [question, setQuestion] = useState("");
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [transcript, setTranscript] = useState("");

  const [transcribing, setTranscribing] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);

  function downloadInterviewReport() {
    window.print();
  }

  useEffect(() => {
    async function init() {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      if (!user) {
        window.location.href = "/login";
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("is_premium,email")
        .eq("id", user.id)
        .maybeSingle();

      setIsPremium(
        Boolean(profile?.is_premium) || user.email === "chumcred@gmail.com"
      );

      setLoading(false);
    }

    init();

    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function generateQuestion() {
    if (!userId || !targetRole.trim()) return;

    setStarting(true);
    setMessage("");
    setQuestion("");
    setTranscript("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/interview-iq/question", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: userId, target_role: targetRole }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to generate question.");
        setStarting(false);
        return;
      }

      setQuestion(data.question || "");
    } catch {
      setMessage("Unable to reach InterviewIQ question service.");
    }

    setStarting(false);
  }

  async function startCamera() {
    setMessage("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setMessage("Camera or microphone permission was denied.");
    }
  }

  function getSupportedMimeType() {
    const types = [
      "video/webm;codecs=vp9,opus",
      "video/webm;codecs=vp8,opus",
      "video/webm",
    ];

    return types.find((type) => MediaRecorder.isTypeSupported(type)) || "";
  }

  function startRecording() {
    setMessage("");
    setTranscript("");
    setAnalysis(null);
    setRecordedBlob(null);

    if (videoUrl) {
      URL.revokeObjectURL(videoUrl);
      setVideoUrl("");
    }

    const stream = streamRef.current;

    if (!stream) {
      setMessage("Please start your camera before recording.");
      return;
    }

    const chunks: BlobPart[] = [];
    const mimeType = getSupportedMimeType();

    const recorder = mimeType
      ? new MediaRecorder(stream, { mimeType })
      : new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: mimeType || "video/webm" });

      if (!blob.size) {
        setMessage("Recording failed. Please try again.");
        return;
      }

      const url = URL.createObjectURL(blob);

      setRecordedBlob(blob);
      setVideoUrl(url);
      setMessage(
        "Recording completed. You can now play it back or generate transcript."
      );
    };

    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  async function transcribeRecording() {
    if (!recordedBlob) {
      setMessage("Please record your answer before transcribing.");
      return;
    }

    if (!question) {
      setMessage("Please generate an interview question first.");
      return;
    }

    setTranscribing(true);
    setMessage("");
    setTranscript("");
    setAnalysis(null);

    try {
      const formData = new FormData();

      formData.append("user_id", userId);
      formData.append("target_role", targetRole);
      formData.append("question", question);
      formData.append("file", recordedBlob, "interview-answer.webm");

      const backendUrl = process.env.NEXT_PUBLIC_BACKEND_API_URL;
      const cronSecret = process.env.NEXT_PUBLIC_CRON_SECRET;

      const response = await fetch(`${backendUrl}/tasks/interview-iq/transcribe`, {
        method: "POST",
        headers: { "x-cron-secret": cronSecret || "" },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(
          data.message ||
            data.error ||
            data.details ||
            "Unable to transcribe video."
        );
        setTranscribing(false);
        return;
      }

      setTranscript(data.transcript || "");
      setMessage("Transcript generated successfully.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Unable to reach transcription service."
      );
    }

    setTranscribing(false);
  }

  async function analyzeInterview() {
    if (!transcript.trim()) {
      setMessage("Please generate transcript before analyzing interview.");
      return;
    }

    setAnalyzing(true);
    setMessage("");
    setAnalysis(null);

    try {
      const response = await fetch("/api/interview-iq/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
          question,
          transcript,
        }),
      });

      const data = await response.json();

      if (!response.ok || data.status === "error") {
        setMessage(data.message || data.error || "Unable to analyze interview.");
        setAnalyzing(false);
        return;
      }

      setAnalysis(data.analysis || null);
      setMessage("Interview analysis completed successfully.");
    } catch {
      setMessage("Unable to reach InterviewIQ analysis service.");
    }

    setAnalyzing(false);
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-16">
        <p className="text-slate-600">Loading Video InterviewIQ...</p>
      </main>
    );
  }

  if (!isPremium) {
    return (
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/interview-iq" className="text-sm font-semibold text-blue-700">
          ← Back to InterviewIQ
        </Link>

        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <div className="rounded-2xl bg-amber-50 p-4 text-amber-700">
            <Lock size={34} />
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Premium Video InterviewIQ
          </h1>

          <p className="mt-3 text-slate-600">
            Video interview practice is available to premium users only.
          </p>
        </section>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <Link href="/interview-iq" className="text-sm font-semibold text-blue-700">
        ← Back to InterviewIQ
      </Link>

      <section className="mt-8 rounded-3xl bg-slate-950 p-8 text-white shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
          Premium InterviewIQ
        </p>

        <h1 className="mt-3 text-4xl font-bold">Video Interview Practice</h1>

        <p className="mt-3 max-w-3xl text-slate-300">
          Record your answer, generate transcript, and analyze your interview performance.
        </p>
      </section>

      {message && (
        <div className="mt-6 rounded-xl bg-blue-50 p-4 text-sm font-semibold text-blue-700">
          {message}
        </div>
      )}

      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">Setup</h2>

          <label className="mt-5 block text-sm font-semibold text-slate-700">
            Target Role
          </label>

          <input
            value={targetRole}
            onChange={(e) => setTargetRole(e.target.value)}
            className="mt-2 w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
          />

          <button
            onClick={generateQuestion}
            disabled={starting}
            className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <Sparkles size={18} />
            {starting ? "Generating..." : "Generate Question"}
          </button>

          <button
            onClick={startCamera}
            className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border px-5 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Camera size={18} />
            Start Camera
          </button>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm lg:col-span-2">
          <h2 className="text-xl font-bold text-slate-900">Interview Question</h2>

          <div className="mt-4 rounded-2xl bg-slate-50 p-5 text-slate-800">
            {question || "Generate a question to begin your video interview practice."}
          </div>

          <div className="mt-6 overflow-hidden rounded-2xl bg-black">
            <video ref={videoRef} autoPlay muted playsInline className="h-80 w-full object-cover" />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!recording ? (
              <button onClick={startRecording} className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700">
                <Play size={18} />
                Start Recording
              </button>
            ) : (
              <button onClick={stopRecording} className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800">
                <Square size={18} />
                Stop Recording
              </button>
            )}

            {recordedBlob && (
              <button onClick={transcribeRecording} disabled={transcribing} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60">
                <FileText size={18} />
                {transcribing ? "Transcribing..." : "Generate Transcript"}
              </button>
            )}
          </div>
        </div>
      </section>

      {videoUrl && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">Playback Your Answer</h2>

          <div className="mt-6 overflow-hidden rounded-2xl bg-black">
            <video src={videoUrl} controls playsInline className="h-80 w-full object-cover" />
          </div>
        </section>
      )}

      {transcript && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Transcript
          </p>

          <h2 className="mt-2 text-2xl font-bold text-slate-900">
            Your Transcribed Answer
          </h2>

          <p className="mt-4 whitespace-pre-line rounded-2xl bg-slate-50 p-5 text-sm leading-7 text-slate-700">
            {transcript}
          </p>

          <button
            onClick={analyzeInterview}
            disabled={analyzing}
            className="mt-6 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <BarChart3 size={18} />
            {analyzing ? "Analyzing Interview..." : "Analyze Interview"}
          </button>
        </section>
      )}

      {analysis && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            AI Interview Analysis
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            Overall Score: {analysis.overall_score || 0}%
          </h2>

          <button
            onClick={downloadInterviewReport}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            <Download size={18} />
            Download Interview Report
          </button>

          <div className="mt-6 grid gap-4 md:grid-cols-5">
            <ScoreCard title="Communication" value={analysis.communication_score} />
            <ScoreCard title="Confidence" value={analysis.confidence_score} />
            <ScoreCard title="Technical" value={analysis.technical_score} />
            <ScoreCard title="Structure" value={analysis.structure_score} />
            <ScoreCard title="Professionalism" value={analysis.professionalism_score} />
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <TextBox title="Strengths" content={analysis.strengths} />
            <TextBox title="Improvements" content={analysis.improvements} />
            <TextBox title="Suggested Better Answer" content={analysis.suggested_answer} />
          </div>
        </section>
      )}
    </main>
  );
}

function ScoreCard({ title, value }: { title: string; value?: number }) {
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