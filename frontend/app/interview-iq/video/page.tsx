"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Camera, Lock, Play, Square, Sparkles } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function VideoInterviewIQPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const playbackRef = useRef<HTMLVideoElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  const [userId, setUserId] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  const [targetRole, setTargetRole] = useState("Business Analyst");
  const [question, setQuestion] = useState("");
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");
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

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setMessage("Camera or microphone permission was denied.");
    }
  }

  function startRecording() {
    setMessage("");

    const stream = videoRef.current?.srcObject as MediaStream | null;

    if (!stream) {
      setMessage("Please start your camera before recording.");
      return;
    }

    const chunks: BlobPart[] = [];
    const recorder = new MediaRecorder(stream);

    mediaRecorderRef.current = recorder;

    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunks.push(event.data);
      }
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      setVideoUrl(url);

      if (playbackRef.current) {
        playbackRef.current.src = url;
      }
    };

    recorder.start();
    setRecording(true);
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
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

          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Back to Dashboard
          </Link>
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

        <h1 className="mt-3 text-4xl font-bold">
          Video Interview Practice
        </h1>

        <p className="mt-3 max-w-3xl text-slate-300">
          Practice answering interview questions on camera. This helps you improve
          confidence, structure and delivery before the real interview.
        </p>
      </section>

      {message && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm font-semibold text-red-700">
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
          </div>
        </div>
      </section>

      {videoUrl && (
        <section className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900">
            Playback Your Answer
          </h2>

          <p className="mt-2 text-slate-600">
            Watch your recorded answer and assess your confidence, clarity and
            structure.
          </p>

          <div className="mt-6 overflow-hidden rounded-2xl bg-black">
            <video ref={playbackRef} controls className="h-80 w-full object-cover" />
          </div>
        </section>
      )}
    </main>
  );
}