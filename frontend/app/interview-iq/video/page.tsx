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
} from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

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

  const [message, setMessage] = useState("");
  const [starting, setStarting] = useState(false);

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

      if (videoUrl) {
        URL.revokeObjectURL(videoUrl);
      }
    };
  }, []);

  async function generateQuestion() {
    if (!userId || !targetRole.trim()) return;

    setStarting(true);
    setMessage("");
    setQuestion("");

    try {
      const response = await fetch("/api/interview-iq/question", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user_id: userId,
          target_role: targetRole,
        }),
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
      const blob = new Blob(chunks, {
        type: mimeType || "video/webm",
      });

      if (!blob.size) {
        setMessage("Recording failed. Please try again.");
        return;
      }

      const url = URL.createObjectURL(blob);

      setRecordedBlob(blob);
      setVideoUrl(url);
      setMessage("Recording completed. You can now play it back or generate transcript.");
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

    try {
      const formData = new FormData();

      formData.append("user_id", userId);
      formData.append("target_role", targetRole);
      formData.append("question", question);
      formData.append("file", recordedBlob, "interview-answer.webm");

      const response = await fetch("/api/interview-iq/transcribe", {
        method: "POST",
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
          Record your answer, play it back, and generate a transcript for AI review.
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
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="h-80 w-full object-cover"
            />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {!recording ? (
              <button
                onClick={startRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white hover:bg-red-700"
              >
                <Play size={18} />
                Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 font-semibold text-white hover:bg-slate-800"
              >
                <Square size={18} />
                Stop Recording
              </button>
            )}

            {recordedBlob && (
              <button
                onClick={transcribeRecording}
                disabled={transcribing}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
              >
                <FileText size={18} />
                {transcribing ? "Transcribing..." : "Generate Transcript"}
              </button>
            )}
          </div>
        </div>
      </section>

      {videoUrl && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Playback Your Answer
          </h2>

          <div className="mt-6 overflow-hidden rounded-2xl bg-black">
            <video
              src={videoUrl}
              controls
              playsInline
              className="h-80 w-full object-cover"
            />
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
        </section>
      )}
    </main>
  );
}