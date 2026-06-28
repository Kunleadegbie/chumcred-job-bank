"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase-browser";

type EnterpriseAccount = {
  id: string;
  name: string;
};

type EnterpriseMember = {
  id: string;
  enterprise_id: string;
  user_id: string | null;
  role: string;
  status: string;
  invited_email: string | null;
  invited_by: string | null;
  joined_at: string | null;
  created_at: string;
};

type EnterpriseInvitation = {
  id: string;
  enterprise_id: string;
  email: string;
  role: string;
  token: string;
  status: string;
  expires_at: string | null;
  created_at: string;
};

export default function EnterpriseMembersPage() {
  const params = useParams();
  const enterpriseId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [account, setAccount] = useState<EnterpriseAccount | null>(null);
  const [members, setMembers] = useState<EnterpriseMember[]>([]);
  const [invitations, setInvitations] = useState<EnterpriseInvitation[]>([]);
  const [message, setMessage] = useState("");

  const [inviteForm, setInviteForm] = useState({
    email: "",
    role: "member",
  });

  useEffect(() => {
    if (enterpriseId) loadMembersPage();
  }, [enterpriseId]);

  async function loadMembersPage() {
    setLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      window.location.href = "/login";
      return;
    }

    const { data: accountData, error: accountError } = await supabaseBrowser
      .from("enterprise_accounts")
      .select("id,name")
      .eq("id", enterpriseId)
      .maybeSingle();

    if (accountError || !accountData) {
      setMessage("Unable to load enterprise account.");
      setLoading(false);
      return;
    }

    const { data: membersData, error: membersError } = await supabaseBrowser
      .from("enterprise_members")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .order("created_at", { ascending: false });

    if (membersError) {
      setMessage("Unable to load members.");
      setLoading(false);
      return;
    }

    const { data: invitationsData } = await supabaseBrowser
      .from("enterprise_invitations")
      .select("*")
      .eq("enterprise_id", enterpriseId)
      .order("created_at", { ascending: false });

    setAccount(accountData);
    setMembers(membersData || []);
    setInvitations(invitationsData || []);
    setLoading(false);
  }

  async function inviteMember() {
    setInviteLoading(true);
    setMessage("");

    const {
      data: { user },
    } = await supabaseBrowser.auth.getUser();

    if (!user) {
      setMessage("Please log in before inviting members.");
      setInviteLoading(false);
      return;
    }

    if (!inviteForm.email.trim()) {
      setMessage("Email address is required.");
      setInviteLoading(false);
      return;
    }

    const { error } = await supabaseBrowser.from("enterprise_invitations").insert({
      enterprise_id: enterpriseId,
      email: inviteForm.email.trim().toLowerCase(),
      role: inviteForm.role,
      invited_by: user.id,
      status: "pending",
    });

    if (error) {
      console.error(error);
      setMessage("Unable to create invitation. Check your enterprise role.");
      setInviteLoading(false);
      return;
    }

    await supabaseBrowser.from("enterprise_activity_logs").insert({
      enterprise_id: enterpriseId,
      user_id: user.id,
      action: "enterprise_member_invited",
      details: {
        email: inviteForm.email.trim().toLowerCase(),
        role: inviteForm.role,
      },
    });

    setInviteForm({
      email: "",
      role: "member",
    });

    await loadMembersPage();
    setInviteLoading(false);
  }

  async function updateMemberRole(memberId: string, role: string) {
    const { error } = await supabaseBrowser
      .from("enterprise_members")
      .update({ role })
      .eq("id", memberId)
      .eq("enterprise_id", enterpriseId);

    if (error) {
      setMessage("Unable to update member role.");
      return;
    }

    await loadMembersPage();
  }

  async function deactivateMember(memberId: string) {
    const { error } = await supabaseBrowser
      .from("enterprise_members")
      .update({ status: "inactive" })
      .eq("id", memberId)
      .eq("enterprise_id", enterpriseId);

    if (error) {
      setMessage("Unable to deactivate member.");
      return;
    }

    await loadMembersPage();
  }

  async function cancelInvitation(invitationId: string) {
    const { error } = await supabaseBrowser
      .from("enterprise_invitations")
      .update({ status: "cancelled" })
      .eq("id", invitationId)
      .eq("enterprise_id", enterpriseId);

    if (error) {
      setMessage("Unable to cancel invitation.");
      return;
    }

    await loadMembersPage();
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-6 py-12 text-white">
        <p className="text-slate-300">Loading enterprise members...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Enterprise Team Access
              </p>
              <h1 className="mt-3 text-4xl font-bold">
                Members {account?.name ? `— ${account.name}` : ""}
              </h1>
              <p className="mt-3 max-w-3xl text-slate-300">
                Invite users, assign enterprise roles, and manage access for
                your TalentIQ workspace.
              </p>
            </div>

            <Link
              href={`/enterprise/${enterpriseId}`}
              className="rounded-xl border border-white/10 px-5 py-3 text-sm font-semibold text-slate-200 hover:bg-white/10"
            >
              Back to Workspace
            </Link>
          </div>

          {message && (
            <p className="mt-5 rounded-xl border border-yellow-400/30 bg-yellow-400/10 p-4 text-yellow-200">
              {message}
            </p>
          )}
        </section>

        <section className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6">
          <h2 className="text-2xl font-bold">Invite Team Member</h2>

          <div className="mt-5 grid gap-4 md:grid-cols-[1fr_220px]">
            <Input
              label="Email Address"
              value={inviteForm.email}
              onChange={(v) =>
                setInviteForm((prev) => ({ ...prev, email: v }))
              }
              placeholder="name@example.com"
            />

            <label className="block">
              <span className="text-sm font-semibold text-slate-300">
                Role
              </span>
              <select
                value={inviteForm.role}
                onChange={(e) =>
                  setInviteForm((prev) => ({
                    ...prev,
                    role: e.target.value,
                  }))
                }
                className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white"
              >
                <option value="member">Member</option>
                <option value="analyst">Analyst</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
            </label>
          </div>

          <button
            onClick={inviteMember}
            disabled={inviteLoading}
            className="mt-5 rounded-2xl bg-cyan-500 px-6 py-3 font-bold text-white hover:bg-cyan-400 disabled:opacity-50"
          >
            {inviteLoading ? "Creating Invitation..." : "Invite Member"}
          </button>
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Active Members</h2>

            <div className="mt-5 space-y-4">
              {members.length === 0 ? (
                <p className="text-sm text-slate-400">No members yet.</p>
              ) : (
                members.map((member) => (
                  <div
                    key={member.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {member.invited_email || member.user_id || "Member"}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Joined:{" "}
                          {member.joined_at
                            ? new Date(member.joined_at).toLocaleString()
                            : "Not stated"}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge label={member.role} />
                          <Badge label={member.status} />
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <select
                          value={member.role}
                          onChange={(e) =>
                            updateMemberRole(member.id, e.target.value)
                          }
                          className="rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white"
                        >
                          <option value="member">Member</option>
                          <option value="analyst">Analyst</option>
                          <option value="admin">Admin</option>
                          <option value="owner">Owner</option>
                        </select>

                        {member.status === "active" && (
                          <button
                            onClick={() => deactivateMember(member.id)}
                            className="rounded-xl border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                          >
                            Deactivate
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-bold">Pending Invitations</h2>

            <div className="mt-5 space-y-4">
              {invitations.length === 0 ? (
                <p className="text-sm text-slate-400">No invitations yet.</p>
              ) : (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="rounded-2xl border border-white/10 bg-slate-900 p-4"
                  >
                    <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                      <div>
                        <p className="font-semibold text-slate-100">
                          {invitation.email}
                        </p>
                        <p className="mt-1 text-xs text-slate-400">
                          Created:{" "}
                          {new Date(invitation.created_at).toLocaleString()}
                        </p>
                        <div className="mt-2 flex gap-2">
                          <Badge label={invitation.role} />
                          <Badge label={invitation.status} />
                        </div>
                      </div>

                      {invitation.status === "pending" && (
                        <button
                          onClick={() => cancelInvitation(invitation.id)}
                          className="rounded-xl border border-red-400/40 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function Input({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-300">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-white outline-none focus:border-cyan-400"
      />
    </label>
  );
}

function Badge({ label }: { label: string }) {
  return (
    <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-slate-200">
      {label}
    </span>
  );
}