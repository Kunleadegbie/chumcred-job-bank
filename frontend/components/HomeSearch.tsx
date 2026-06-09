"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function HomeSearch() {
  const router = useRouter();
  const [keyword, setKeyword] = useState("");

  function handleSearch() {
    const q = keyword.trim();

    if (!q) {
      router.push("/jobs");
      return;
    }

    router.push(`/jobs?q=${encodeURIComponent(q)}`);
  }

  return (
    <div className="mt-8 max-w-3xl rounded-2xl bg-white p-2 shadow-lg">
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3">
          <Search size={20} className="text-slate-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSearch();
            }}
            placeholder="Search job title, company, skill or keyword..."
            className="w-full text-slate-900 outline-none"
          />
        </div>

        <button
          onClick={handleSearch}
          className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
        >
          Search Jobs
        </button>
      </div>
    </div>
  );
}