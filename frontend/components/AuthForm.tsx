"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabaseClient";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [country, setCountry] = useState("Nigeria");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            country,
            role: "applicant",
          },
        },
      });

      if (error) {
        setMessage(error.message);
        setLoading(false);
        return;
      }

      if (data.user) {
        await supabase.from("profiles").upsert({
          id: data.user.id,
          full_name: fullName,
          email,
          country,
          role: "applicant",
        });
      }

      setMessage("Account created successfully. Please check your email if confirmation is required.");
      setLoading(false);
      router.push("/jobs");
      return;
    }

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    router.push("/jobs");
  }

  return (
    <div className="mx-auto max-w-md rounded-3xl border bg-white p-8 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">
        {mode === "login" ? "Login" : "Create Account"}
      </h1>

      <p className="mt-2 text-sm text-slate-600">
        {mode === "login"
          ? "Login to save jobs and manage your opportunities."
          : "Create a free candidate account to save jobs and track opportunities."}
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === "signup" && (
          <>
            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Full Name
              </label>
              <input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                required
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Country
              </label>
              <input
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                required
                className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
                placeholder="Nigeria"
              />
            </div>
          </>
        )}

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-semibold text-slate-700">
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            className="w-full rounded-xl border px-4 py-3 outline-none focus:border-blue-600"
            placeholder="Minimum 6 characters"
          />
        </div>

        {message && (
          <div className="rounded-xl bg-slate-100 p-3 text-sm text-slate-700">
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {loading
            ? "Please wait..."
            : mode === "login"
            ? "Login"
            : "Create Account"}
        </button>
      </form>

      <div className="mt-6 text-sm text-slate-600">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="font-semibold text-blue-700">
              Create one
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link href="/login" className="font-semibold text-blue-700">
              Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}