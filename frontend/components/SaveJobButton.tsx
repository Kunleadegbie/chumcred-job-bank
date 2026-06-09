"use client";

import { useEffect, useState } from "react";
import { Heart } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";

export default function SaveJobButton({ jobId }: { jobId: string }) {
  const [userId, setUserId] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadSavedStatus() {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;

      if (!user) return;

      setUserId(user.id);

      const { data } = await supabase
        .from("saved_jobs")
        .select("id")
        .eq("user_id", user.id)
        .eq("job_id", jobId)
        .maybeSingle();

      setSaved(Boolean(data));
    }

    loadSavedStatus();
  }, [jobId]);

  async function toggleSave() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      window.location.href = "/login";
      return;
    }

    setLoading(true);

    if (saved) {
      await supabase
        .from("saved_jobs")
        .delete()
        .eq("user_id", user.id)
        .eq("job_id", jobId);

      setSaved(false);
    } else {
      await supabase.from("saved_jobs").insert({
        user_id: user.id,
        job_id: jobId,
      });

      setSaved(true);
    }

    setLoading(false);
  }

  return (
    <button
      onClick={toggleSave}
      disabled={loading}
      className={`inline-flex items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
        saved
          ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
          : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      }`}
    >
      <Heart size={16} className={saved ? "fill-current" : ""} />
      {loading ? "Saving..." : saved ? "Saved" : "Save Job"}
    </button>
  );
}