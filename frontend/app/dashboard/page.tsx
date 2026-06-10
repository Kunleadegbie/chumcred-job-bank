import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-blue-600">
        Candidate Dashboard
      </p>

      <h1 className="mt-3 text-5xl font-bold">
        Welcome Back
      </h1>

      <p className="mt-4 text-slate-600">
        Manage your saved jobs and profile.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold">
            Saved Jobs
          </h3>

          <p className="mt-3 text-4xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold">
            Applications
          </h3>

          <p className="mt-3 text-4xl font-bold">
            0
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <h3 className="font-semibold">
            Profile
          </h3>

          <p className="mt-3 text-sm text-slate-600">
            Complete your profile.
          </p>
        </div>
      </div>

      <div className="mt-10">
        <Link
          href="/saved-jobs"
          className="rounded-xl bg-slate-900 px-6 py-3 text-white"
        >
          View Saved Jobs
        </Link>
      </div>
    </div>
  );
}