import { supabaseBrowser } from "@/lib/supabase-browser";

export async function requireAdminUser() {
  const {
    data: { user },
  } = await supabaseBrowser.auth.getUser();

  if (!user) return { user: null, isAdmin: false };

  const { data: profile } = await supabaseBrowser
    .from("profiles")
    .select("id, role, is_admin, email")
    .eq("id", user.id)
    .maybeSingle();

  const isAdmin =
    profile?.role === "admin" ||
    profile?.is_admin === true ||
    user.email === "kadegbie@gmail.com" ||
    user.email === "chumcred@gmail.com";

  return { user, isAdmin };
}