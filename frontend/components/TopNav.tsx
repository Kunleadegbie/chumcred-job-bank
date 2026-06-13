"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

export default function TopNav() {
  const router = useRouter();

  const [loggedIn, setLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    async function checkUser() {
      const { data } = await supabaseBrowser.auth.getUser();
      const user = data.user;

      setLoggedIn(Boolean(user));

      if (user) {
        const { data: profile } = await supabaseBrowser
          .from("profiles")
          .select("is_admin,email")
          .eq("id", user.id)
          .maybeSingle();

        setIsAdmin(
          Boolean(profile?.is_admin) ||
            profile?.email === "chumcred@gmail.com" ||
            user.email === "chumcred@gmail.com"
        );
      } else {
        setIsAdmin(false);
      }
    }

    checkUser();

    const { data: listener } = supabaseBrowser.auth.onAuthStateChange(
      async (_event, session) => {
        const user = session?.user || null;

        setLoggedIn(Boolean(user));

        if (user) {
          const { data: profile } = await supabaseBrowser
            .from("profiles")
            .select("is_admin,email")
            .eq("id", user.id)
            .maybeSingle();

          setIsAdmin(
            Boolean(profile?.is_admin) ||
              profile?.email === "chumcred@gmail.com" ||
              user.email === "chumcred@gmail.com"
          );
        } else {
          setIsAdmin(false);
        }
      }
    );

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleLogout() {
    await supabaseBrowser.auth.signOut();
    setLoggedIn(false);
    setIsAdmin(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-50 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo.jpeg"
            alt="Chumcred Intelligence Logo"
            className="h-12 w-auto"
          />
          <span className="hidden text-lg font-bold text-slate-900 md:inline">
            Job Bank
          </span>
        </Link>

        <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/">Home</Link>
          <Link href="/jobs">Jobs</Link>
          <Link href="/employer">Employers</Link>

          {loggedIn ? (
            <>
              <Dropdown title="Candidate">
                <DropdownLink href="/dashboard">Dashboard</DropdownLink>
                <DropdownLink href="/profile">Profile</DropdownLink>
                <DropdownLink href="/saved-jobs">Saved Jobs</DropdownLink>
                <DropdownLink href="/my-applications">
                  My Applications
                </DropdownLink>
              </Dropdown>

              <Dropdown title="AI Tools">
                <DropdownLink href="/job-match">AI Job Match</DropdownLink>
                <DropdownLink href="/ai-career-coach">
                  AI Career Coach
                </DropdownLink>
                <DropdownLink href="/ai-cv-review">AI CV Review</DropdownLink>
                <DropdownLink href="/interview-iq">InterviewIQ</DropdownLink>
                <DropdownLink href="/interview-iq/video">Video InterviewIQ</DropdownLink>
              </Dropdown>

              <Dropdown title="Employer">
                <DropdownLink href="/employer/dashboard">
                  Employer Dashboard
                </DropdownLink>
                <DropdownLink href="/employer/profile">
                  Company Profile
                </DropdownLink>
                <DropdownLink href="/employer/post-job">Post Job</DropdownLink>
                <DropdownLink href="/employer/jobs">Manage Jobs</DropdownLink>
                <DropdownLink href="/employer/plans">
                  Posting Plans
                </DropdownLink>
              </Dropdown>

              {isAdmin && (
                <Dropdown title="Admin">
                  <DropdownLink href="/admin">Admin Dashboard</DropdownLink>
                  <DropdownLink href="/admin/jobs">Manage Jobs</DropdownLink>
                  <DropdownLink href="/admin/sources">Job Sources</DropdownLink>
                  <DropdownLink href="/admin/clicks">
                    Click Analytics
                  </DropdownLink>
                  <DropdownLink href="/admin/logs">Fetch Logs</DropdownLink>
                  <DropdownLink href="/admin/employer-payments">
                    Employer Payments
                  </DropdownLink>
                </Dropdown>
              )}

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
        </nav>
      </div>
    </header>
  );
}

function Dropdown({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 rounded-xl px-3 py-2 hover:bg-slate-100"
      >
        {title}
        <ChevronDown size={14} />
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 min-w-56 rounded-2xl border bg-white p-2 shadow-lg">
          {children}
        </div>
      )}
    </div>
  );
}

function DropdownLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl px-4 py-2 text-sm text-slate-700 hover:bg-slate-100"
    >
      {children}
    </Link>
  );
}