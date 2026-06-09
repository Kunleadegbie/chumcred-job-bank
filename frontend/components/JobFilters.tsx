"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { useState } from "react";

export default function JobFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [keyword, setKeyword] = useState(searchParams.get("q") || "");
  const [country, setCountry] = useState(searchParams.get("country") || "");
  const [workType, setWorkType] = useState(searchParams.get("work_type") || "");
  const [experience, setExperience] = useState(searchParams.get("experience") || "");
  const [industry, setIndustry] = useState(searchParams.get("industry") || "");

  function applyFilters() {
    const params = new URLSearchParams();

    if (keyword) params.set("q", keyword);
    if (country) params.set("country", country);
    if (workType) params.set("work_type", workType);
    if (experience) params.set("experience", experience);
    if (industry) params.set("industry", industry);

    router.push(`/jobs?${params.toString()}`);
  }

  function clearFilters() {
    setKeyword("");
    setCountry("");
    setWorkType("");
    setExperience("");
    setIndustry("");
    router.push("/jobs");
  }

  return (
    <div className="mb-10 rounded-3xl border bg-white p-5 shadow-sm">
      <div className="grid gap-4 md:grid-cols-5">
        <div className="md:col-span-2">
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Keyword
          </label>
          <div className="flex items-center gap-2 rounded-xl border px-3 py-2">
            <Search size={16} className="text-slate-400" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="Job title, company, skill..."
              className="w-full outline-none"
            />
          </div>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">All Countries</option>
            <option value="Nigeria">Nigeria</option>
            <option value="United States">United States</option>
            <option value="United Kingdom">United Kingdom</option>
            <option value="Canada">Canada</option>
            <option value="Global">Global</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Work Type
          </label>
          <select
            value={workType}
            onChange={(e) => setWorkType(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">All Work Types</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">Onsite</option>
            <option value="wfa">Work From Anywhere</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Experience
          </label>
          <select
            value={experience}
            onChange={(e) => setExperience(e.target.value)}
            className="w-full rounded-xl border px-3 py-2"
          >
            <option value="">All Levels</option>
            <option value="internship">Internship</option>
            <option value="graduate_trainee">Graduate Trainee</option>
            <option value="entry_level">Entry Level</option>
            <option value="mid_level">Mid Level</option>
            <option value="senior">Senior</option>
            <option value="executive">Executive</option>
          </select>
        </div>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-5">
        <div className="md:col-span-3">
          <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
            Industry
          </label>
          <input
            value={industry}
            onChange={(e) => setIndustry(e.target.value)}
            placeholder="Technology, banking, finance, sales..."
            className="w-full rounded-xl border px-3 py-2 outline-none"
          />
        </div>

        <button
          onClick={applyFilters}
          className="mt-6 rounded-xl bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
        >
          Apply Filters
        </button>

        <button
          onClick={clearFilters}
          className="mt-6 rounded-xl border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
        >
          Clear
        </button>
      </div>
    </div>
  );
}