import Link from "next/link";
import { Building2, Briefcase, CreditCard } from "lucide-react";

export default function EmployerHomePage() {
  return (
    <main className="mx-auto max-w-7xl px-6 py-16">
      <section className="rounded-3xl bg-slate-950 px-8 py-16 text-white">
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-300">
          Chumcred Employer Portal
        </p>

        <h1 className="mt-4 max-w-3xl text-5xl font-bold">
          Hire smarter through Chumcred Job Bank.
        </h1>

        <p className="mt-5 max-w-2xl text-slate-300">
          Create your employer profile, post jobs, manage vacancies and reach qualified candidates.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/employer/dashboard"
            className="rounded-xl bg-blue-600 px-6 py-3 font-semibold text-white hover:bg-blue-700"
          >
            Go to Employer Dashboard
          </Link>

          <Link
            href="/employer/post-job"
            className="rounded-xl bg-white px-6 py-3 font-semibold text-slate-900 hover:bg-slate-100"
          >
            Post a Job
          </Link>
        </div>
      </section>

      <section className="mt-10 grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <Building2 className="text-blue-700" />
          <h2 className="mt-4 text-xl font-bold">Company Profile</h2>
          <p className="mt-2 text-sm text-slate-600">
            Set up your company information and hiring profile.
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <Briefcase className="text-blue-700" />
          <h2 className="mt-4 text-xl font-bold">Post Jobs</h2>
          <p className="mt-2 text-sm text-slate-600">
            Publish job opportunities for candidates to discover.
          </p>
        </div>

        <div className="rounded-3xl border bg-white p-6 shadow-sm">
          <CreditCard className="text-blue-700" />
          <h2 className="mt-4 text-xl font-bold">Paid Visibility</h2>
          <p className="mt-2 text-sm text-slate-600">
            Featured jobs and paid plans will be added in the next phase.
          </p>
        </div>
      </section>
    </main>
  );
}