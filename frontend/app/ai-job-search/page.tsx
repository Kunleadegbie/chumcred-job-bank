"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Search,
  Briefcase,
  Globe,
  MapPin,
  Building2,
  Sparkles,
} from "lucide-react";

type SearchResult = {
  id: string;
  title: string;
  company_name: string;
  country: string;
  city: string;
  location_display: string;
  work_type: string;
  employment_type: string;
  salary_display: string;
  description: string;
  slug?: string;
  source: string;
  match_score: number;
};

export default function AIJobSearchPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [intent, setIntent] = useState<any>(null);
  const [count, setCount] = useState(0);
  const [error, setError] = useState("");

  async function handleSearch() {
    if (!query.trim()) return;

    setLoading(true);
    setError("");
    setResults([]);

    try {
      const response = await fetch("/api/ai-job-search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
        }),
      });

      const data = await response.json();

      if (data.status === "error") {
        setError(data.message || "Search failed");
        setLoading(false);
        return;
      }

      setResults(data.results || []);
      setIntent(data.intent || null);
      setCount(data.count || 0);
    } catch (err) {
      setError("Unable to perform AI job search.");
    }

    setLoading(false);
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      {/* Header */}
      <section className="rounded-3xl bg-slate-950 p-10 text-white">
        <div className="flex items-center gap-3">
          <Sparkles className="h-8 w-8 text-blue-400" />
          <h1 className="text-4xl font-bold">
            AI Global Job Search
          </h1>
        </div>

        <p className="mt-4 max-w-3xl text-slate-300">
          Search jobs naturally using AI.
          Describe what you want and Chumcred Intelligence
          will find matching opportunities.
        </p>

        <div className="mt-8 flex flex-col gap-3 md:flex-row">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Example: Find remote Product Manager jobs in Canada"
            className="flex-1 rounded-xl border border-slate-700 bg-slate-900 px-5 py-4 text-white outline-none"
          />

          <button
            onClick={handleSearch}
            disabled={loading}
            className="rounded-xl bg-blue-600 px-6 py-4 font-semibold text-white hover:bg-blue-700"
          >
            {loading ? "Searching..." : "Search Jobs"}
          </button>
        </div>

        <div className="mt-6 text-sm text-slate-400">
          Examples:
          <ul className="mt-2 space-y-1">
            <li>• Business Analyst jobs in Canada</li>
            <li>• Remote Product Manager jobs</li>
            <li>• Visa sponsorship jobs in Germany</li>
            <li>• Data Analyst jobs in UK</li>
          </ul>
        </div>
      </section>

      {/* AI Intent */}
      {intent && (
        <section className="mt-8 rounded-3xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-slate-900">
            AI Search Understanding
          </h2>

          <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div>
              <p className="text-xs text-slate-500">Role</p>
              <p className="font-semibold">{intent.role || "-"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Country</p>
              <p className="font-semibold">{intent.country || "-"}</p>
            </div>

            <div>
              <p className="text-xs text-slate-500">Remote</p>
              <p className="font-semibold">
                {intent.remote ? "Yes" : "No"}
              </p>
            </div>

            <div>
              <p className="text-xs text-slate-500">
                Visa Sponsorship
              </p>
              <p className="font-semibold">
                {intent.visa_sponsorship ? "Yes" : "No"}
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Errors */}
      {error && (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-red-700">
          {error}
        </div>
      )}

      {/* Results Header */}
      {results.length > 0 && (
        <section className="mt-10">
          <div className="flex items-center justify-between">
            <h2 className="text-3xl font-bold text-slate-900">
              Search Results
            </h2>

            <div className="rounded-full bg-blue-50 px-4 py-2 text-blue-700">
              {count} Jobs Found
            </div>
          </div>
        </section>
      )}

      {/* Results */}
      <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {results.map((job) => (
          <div
            key={`${job.source}-${job.id}`}
            className="rounded-3xl border bg-white p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                Match {job.match_score}%
              </span>

              <span className="text-xs text-slate-500">
                {job.source}
              </span>
            </div>

            <h3 className="mt-4 text-xl font-bold text-slate-900">
              {job.title}
            </h3>

            <div className="mt-3 flex items-center gap-2 text-slate-600">
              <Building2 size={16} />
              {job.company_name}
            </div>

            <div className="mt-2 flex items-center gap-2 text-slate-600">
              <MapPin size={16} />
              {job.location_display}
            </div>

            {job.work_type && (
              <div className="mt-2 flex items-center gap-2 text-slate-600">
                <Globe size={16} />
                {job.work_type}
              </div>
            )}

            {job.salary_display && (
              <p className="mt-3 text-sm font-semibold text-green-700">
                {job.salary_display}
              </p>
            )}

            <p className="mt-4 line-clamp-4 text-sm text-slate-600">
              {job.description}
            </p>

            <div className="mt-6 flex flex-col gap-3">
              {job.slug ? (
                <Link
                  href={`/jobs/${job.slug}`}
                  className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700">
                  View Job
                </Link>
              ) : job.original_job_url ? (
                <a
                  href={job.original_job_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-blue-600 px-4 py-3 text-center font-semibold text-white hover:bg-blue-700">
                  View Job
                </a>
              ) : (
                <button
                  disabled
                  className="rounded-xl bg-slate-300 px-4 py-3 font-semibold text-slate-700">
                  View Job
                </button>
              )}

              <Link
                href={`/interview-iq?role=${encodeURIComponent(
                  job.title
                )}&company=${encodeURIComponent(
                  job.company_name
                )}`}
                className="rounded-xl border px-4 py-3 text-center font-semibold"
              >
                Practice Interview
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {!loading &&
        results.length === 0 &&
        !error &&
        query && (
          <div className="mt-12 rounded-3xl border bg-white p-10 text-center">
            <Briefcase className="mx-auto h-12 w-12 text-slate-400" />

            <h3 className="mt-4 text-xl font-bold">
              No matching jobs found
            </h3>

            <p className="mt-2 text-slate-600">
              Try broadening your search.
            </p>
          </div>
        )}
    </main>
  );
}