"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function TopNav() {
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabaseBrowser.auth.getUser();
      setLoggedIn(Boolean(data.user));
    }

    checkUser();

    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      (_event, session) => {
        setLoggedIn(Boolean(session?.user));
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    setLoggedIn(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-slate-900">
          Chumcred Job Bank
        </Link>

        <nav className="flex items-center gap-5 text-sm font-medium text-slate-700">
          <Link href="/">Home</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/jobs?work_type=remote">Remote Jobs</Link>
          <Link href="/jobs?country=Nigeria">Nigeria Jobs</Link>
          <Link href="/jobs?visa=true">Visa Sponsorship</Link>

          {loggedIn ? (
            <>
              <Link href="/dashboard">Dashboard</Link>
              <Link href="/saved-jobs">Saved Jobs</Link>
              <Link href="/job-match">AI Job Match</Link>
              <button
                onClick={handleLogout}
                className="rounded-xl border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <Link href="/login">Login</Link>
              <Link
                href="/signup"
                className="rounded-xl bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
              >
                Sign Up
              </Link>
            </>
          )}

          <Link href="/admin">Admin</Link>
        </nav>
      </div>
    </header>
  );
}