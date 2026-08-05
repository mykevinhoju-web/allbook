import { createServiceSupabase } from "@/lib/supabase/service";

export type ProfileRole = "admin" | "user";

export type ProfileRow = {
  id: string;
  email: string | null;
  full_name: string | null;
  role: ProfileRole;
};

/** Ensure a profiles row exists (defaults to role=user). Never auto-promotes admin. */
export async function ensureUserProfile(input: {
  userId: string;
  email?: string | null;
  fullName?: string | null;
}): Promise<ProfileRow> {
  const supabase = createServiceSupabase();
  const { data: existing, error: readError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", input.userId)
    .maybeSingle();

  if (readError) {
    throw new Error(readError.message);
  }
  if (existing) {
    return existing as ProfileRow;
  }

  const { data: created, error: insertError } = await supabase
    .from("profiles")
    .insert({
      id: input.userId,
      email: input.email ?? null,
      full_name: input.fullName ?? null,
      role: "user",
    })
    .select("id, email, full_name, role")
    .single();

  if (insertError || !created) {
    throw new Error(insertError?.message ?? "Could not create profile.");
  }

  return created as ProfileRow;
}

export async function getProfileRole(userId: string): Promise<ProfileRole | null> {
  const supabase = createServiceSupabase();
  const { data, error } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!data?.role) return null;
  return data.role as ProfileRole;
}

export async function isPlatformAdminUser(userId: string): Promise<boolean> {
  const role = await getProfileRole(userId);
  return role === "admin";
}
