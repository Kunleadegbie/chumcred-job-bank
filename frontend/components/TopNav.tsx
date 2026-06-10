import Link from "next/link";

export default function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-slate-900">
          Chumcred Job Bank
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-slate-700">
          <Link href="/">Home</Link>
          <Link href="/dashboard">Dashboard</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/jobs?work_type=remote">Remote Jobs</Link>
          <Link href="/jobs?country=Nigeria">Nigeria Jobs</Link>
          <Link href="/jobs?visa=true">Visa Sponsorship</Link>
          <Link href="/saved-jobs">Saved Jobs</Link>
          <Link href="/admin">Admin</Link>
          <Link href="/login">Login</Link>
          <Link
            href="/signup"
            className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            Sign Up
          </Link>
        </nav>
      </div>
    </header>
  );
}