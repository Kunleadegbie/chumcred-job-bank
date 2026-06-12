"use client";

import { ExternalLink } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function ApplyButton({
  jobId,
  applyUrl,
}: {
  jobId: string;
  applyUrl: string;
}) {
  async function handleApplyClick() {
    try {
      const { data: userData } = await supabaseBrowser.auth.getUser();
      const user = userData.user;

      await fetch("/api/track-apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ job_id: jobId }),
      });

      if (user) {
        await supabaseBrowser.from("applications").upsert(
          {
            user_id: user.id,
            job_id: jobId,
            status: "applied",
            applied_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "user_id,job_id",
          }
        );
      }
    } catch (error) {
      console.error("Apply tracking failed:", error);
    }

    window.open(applyUrl, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      onClick={handleApplyClick}
      className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-5 py-3 text-center font-semibold text-white hover:bg-blue-700"
    >
      Apply on Original Website
      <ExternalLink size={16} />
    </button>
  );
}