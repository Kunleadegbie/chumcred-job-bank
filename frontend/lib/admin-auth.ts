import { supabaseBrowser } from "@/lib/supabase-browser";

export async function requireAdminUser() {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) {
    return {
      user: null,
      isAdmin: false,
      error: "not_authenticated",
    };
  }

  const { data: profile, error } = await supabaseBrowser
    .from("profiles")
    .select("id, role")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !profile) {
    return {
      user,
      isAdmin: false,
      error: "profile_not_found",
    };
  }

  return {
    user,
    isAdmin: profile.role === "admin",
    error: null,
  };
}