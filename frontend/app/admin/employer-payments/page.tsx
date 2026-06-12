"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle, XCircle, CreditCard } from "lucide-react";
import { supabaseBrowser } from "@/lib/supabase-browser";

type PaymentRow = {
  id: string;
  amount: number;
  currency: string | null;
  payment_method: string | null;
  payment_reference: string | null;
  status: string | null;
  created_at: string | null;
  approved_at: string | null;
  employers: {
    company_name: string | null;
    company_email: string | null;
  } | null;
  employer_posting_plans: {
    name: string | null;
    code: string | null;
    is_featured: boolean | null;
    max_jobs: number | null;
  } | null;
};

export default function AdminEmployerPaymentsPage() {
  const [loading, setLoading] = useState(true);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [message, setMessage] = useState("");

  async function loadPayments() {
    const { data, error } = await supabaseBrowser
      .from("employer_payments")
      .select(
        `
        id,
        amount,
        currency,
        payment_method,
        payment_reference,
        status,
        created_at,
        approved_at,
        employers (
          company_name,
          company_email
        ),
        employer_posting_plans (
          name,
          code,
          is_featured,
          max_jobs
        )
      `
      )
      .order("created_at", { ascending: false });

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setPayments((data || []) as unknown as PaymentRow[]);
    setLoading(false);
  }

  useEffect(() => {
    loadPayments();
  }, []);

  async function updatePaymentStatus(paymentId: string, status: "approved" | "rejected") {
    setMessage("");

    const { error } = await supabaseBrowser
      .from("employer_payments")
      .update({
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      })
      .eq("id", paymentId);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Payment ${status} successfully.`);
    await loadPayments();
  }

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-6 py-16">
        <p className="text-slate-600">Loading employer payments...</p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-6 py-12">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-700">
            Admin Dashboard
          </p>

          <h1 className="mt-3 text-4xl font-bold text-slate-900">
            Employer Payment Approvals
          </h1>

          <p className="mt-3 text-slate-600">
            Review employer posting plan payments and approve access to job posting.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-flex items-center justify-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
        >
          ← Back to Admin
        </Link>
      </div>

      {message && (
        <div
          className={`mb-6 rounded-xl p-4 text-sm font-semibold ${
            message.includes("successfully")
              ? "bg-emerald-50 text-emerald-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {message}
        </div>
      )}

      {payments.length === 0 ? (
        <div className="rounded-3xl border bg-white p-8 shadow-sm">
          <CreditCard className="text-blue-700" size={32} />

          <h2 className="mt-4 text-xl font-bold text-slate-900">
            No employer payments yet
          </h2>

          <p className="mt-2 text-slate-600">
            Employer payment records will appear here after employers select posting plans.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-3xl border bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <th className="px-5 py-4">Employer</th>
                  <th className="px-5 py-4">Plan</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Reference</th>
                  <th className="px-5 py-4">Status</th>
                  <th className="px-5 py-4">Created</th>
                  <th className="px-5 py-4">Actions</th>
                </tr>
              </thead>

              <tbody className="divide-y">
                {payments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-900">
                        {payment.employers?.company_name || "Company not stated"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.employers?.company_email || "No email"}
                      </p>
                    </td>

                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">
                        {payment.employer_posting_plans?.name || "Plan not stated"}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {payment.employer_posting_plans?.is_featured
                          ? "Featured"
                          : "Standard"}{" "}
                        • {payment.employer_posting_plans?.max_jobs || 1} job(s)
                      </p>
                    </td>

                    <td className="px-5 py-4 font-semibold text-slate-800">
                      {payment.currency || "NGN"}{" "}
                      {Number(payment.amount || 0).toLocaleString()}
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {payment.payment_reference || "No reference"}
                    </td>

                    <td className="px-5 py-4">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold capitalize ${
                          payment.status === "approved"
                            ? "bg-emerald-50 text-emerald-700"
                            : payment.status === "rejected"
                            ? "bg-red-50 text-red-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {payment.status || "pending"}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-slate-600">
                      {payment.created_at
                        ? new Date(payment.created_at).toLocaleDateString()
                        : "Not available"}
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => updatePaymentStatus(payment.id, "approved")}
                          className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                        >
                          <CheckCircle size={14} />
                          Approve
                        </button>

                        <button
                          onClick={() => updatePaymentStatus(payment.id, "rejected")}
                          className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700"
                        >
                          <XCircle size={14} />
                          Reject
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </main>
  );
}