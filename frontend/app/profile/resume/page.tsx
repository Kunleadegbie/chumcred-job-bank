"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Upload, FileText, Sparkles } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ResumeUploadPage() {
  const router = useRouter();

  const [userId, setUserId] = useState<string | null>(null);
  const [resumeUrl, setResumeUrl] = useState<string | null>(null);
  const [resumeName, setResumeName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function loadUser() {
      const { data } = await supabaseBrowser.auth.getUser();
      const user = data.user;

      if (!user) {
        router.push("/login");
        return;
      }

      setUserId(user.id);

      const { data: profile } = await supabaseBrowser
        .from("profiles")
        .select("resume_url,resume_name")
        .eq("id", user.id)
        .maybeSingle();

      setResumeUrl(profile?.resume_url || null);
      setResumeName(profile?.resume_name || null);
    }

    loadUser();
  }, [router]);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];

    if (!file || !userId) return;

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(file.type)) {
      setMessage("Please upload a PDF, DOC, or DOCX file.");
      return;
    }

    setUploading(true);
    setMessage("");

    const fileExt = file.name.split(".").pop();
    const filePath = `${userId}/resume-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabaseBrowser.storage
      .from("resumes")
      .upload(filePath, file, {
        upsert: true,
      });

    if (uploadError) {
      setMessage(uploadError.message);
      setUploading(false);
      return;
    }

    const { data: signedUrlData } = await supabaseBrowser.storage
      .from("resumes")
      .createSignedUrl(filePath, 60 * 60 * 24 * 7);

    const resumeText = `
      Resume file uploaded: ${file.name}.
      Candidate has uploaded a resume for AI matching.
      File type: ${file.type}.
    `;

    const { error: profileError } = await supabaseBrowser
      .from("profiles")
      .update({
        resume_path: filePath,
        resume_url: signedUrlData?.signedUrl || null,
        resume_name: file.name,
        resume_text: resumeText,
        resume_uploaded_at: new Date().toISOString(),
        resume_parsed_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (profileError) {
      setMessage(profileError.message);
      setUploading(false);
      return;
    }

    setResumeUrl(signedUrlData?.signedUrl || null);
    setResumeName(file.name);
    setMessage("Resume uploaded successfully. AI matching can now use this resume.");
    setUploading(false);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-12">
      <Link href="/dashboard" className="text-sm font-semibold text-blue-700">
        ← Back to Dashboard
      </Link>

      <div className="mt-8 rounded-3xl border bg-white p-8 shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
          Candidate Profile
        </p>

        <h1 className="mt-3 text-4xl font-bold text-slate-900">
          Upload Resume
        </h1>

        <p className="mt-3 text-slate-600">
          Upload your latest CV or resume. This will be used for AI job
          matching.
        </p>

        <div className="mt-8 rounded-2xl border border-dashed p-8 text-center">
          <Upload className="mx-auto text-blue-700" size={36} />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            Select Resume File
          </h2>

          <p className="mt-2 text-sm text-slate-600">
            Accepted formats: PDF, DOC, DOCX
          </p>

          <label
            htmlFor="resume-upload"
            className="mt-6 inline-flex cursor-pointer items-center rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Select Resume
          </label>

          <input
            id="resume-upload"
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleUpload}
            className="hidden"
          />

          {uploading && (
            <p className="mt-4 text-sm text-blue-700">Uploading resume...</p>
          )}

          {message && (
            <p className="mt-4 text-sm font-semibold text-slate-700">
              {message}
            </p>
          )}
        </div>

        {resumeName && (
          <div className="mt-8 rounded-2xl border bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <FileText className="text-blue-700" />
              <div>
                <p className="font-semibold text-slate-900">{resumeName}</p>
                <p className="text-sm text-slate-600">
                  Current uploaded resume
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {resumeUrl && (
                <a
                  href={resumeUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-xl border px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-white"
                >
                  View Resume
                </a>
              )}

              <Link
                href="/job-match"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                <Sparkles size={16} />
                View AI Job Match
              </Link>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}