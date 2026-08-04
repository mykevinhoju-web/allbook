import { hash } from "bcryptjs";
import { randomBytes } from "crypto";

import {
  isPlatformBusinessType,
  type PlatformBusinessType,
} from "@/features/platform-auth/config/business-types";
import { slugifyBusinessName } from "@/features/platform-auth/lib/slugify-business";
import { createServiceSupabase } from "@/lib/supabase/service";

export type PlatformSignupInput = {
  fullName: string;
  phone: string;
  businessName: string;
  businessType: string;
  email: string;
  authUserId?: string;
};

export type ProvisionedTenant = {
  tenantId: string;
  tenantSlug: string;
  adminId: string;
  loginId: string;
  authUserId: string;
};

async function allocateUniqueSlug(base: string): Promise<string> {
  const supabase = createServiceSupabase();
  let candidate = base;
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const { data } = await supabase
      .from("tenants")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data) return candidate;
    candidate = `${base}-${attempt + 2}`;
  }
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export async function provisionPlatformTenant(
  input: PlatformSignupInput,
): Promise<ProvisionedTenant> {
  const fullName = input.fullName.trim();
  const phone = input.phone.trim();
  const businessName = input.businessName.trim();
  const email = input.email.trim().toLowerCase();
  const businessType = input.businessType.trim();

  if (!fullName || !phone || !businessName || !email) {
    throw new Error("Name, contact, business name, and email are required.");
  }
  if (!isPlatformBusinessType(businessType)) {
    throw new Error("Please select a valid business type.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }

  const supabase = createServiceSupabase();
  let authUserId = input.authUserId ?? null;

  if (!authUserId) {
    const tempPassword = randomBytes(24).toString("base64url");
    const { data: created, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: tempPassword,
        email_confirm: true,
        user_metadata: {
          full_name: fullName,
          phone,
        },
      });

    if (createError || !created.user) {
      const message = createError?.message ?? "Could not create account.";
      if (/already|registered|exists/i.test(message)) {
        throw new Error("An account with this email already exists. Please log in.");
      }
      throw new Error(message);
    }
    authUserId = created.user.id;
  }

  const slug = await allocateUniqueSlug(slugifyBusinessName(businessName));
  const typedBusinessType = businessType as PlatformBusinessType;

  const settings = {
    plan: "free_trial",
    businessType: typedBusinessType,
    ownerName: fullName,
    contactPhone: phone,
    ownerEmail: email,
  };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .insert({
      slug,
      name: businessName,
      display_name: businessName,
      tagline: "Book online with AllBook",
      timezone: "Australia/Sydney",
      currency: "AUD",
      locale: "en-AU",
      is_active: true,
      settings,
    })
    .select("id, slug")
    .single();

  if (tenantError || !tenant) {
    throw new Error(tenantError?.message ?? "Could not create business account.");
  }

  const passwordHash = await hash(randomBytes(24).toString("base64url"), 10);
  const { data: admin, error: adminError } = await supabase
    .from("admin_accounts")
    .insert({
      tenant_id: tenant.id,
      login_id: email,
      password_hash: passwordHash,
    })
    .select("id, login_id")
    .single();

  if (adminError || !admin) {
    await supabase.from("tenants").delete().eq("id", tenant.id);
    throw new Error(adminError?.message ?? "Could not create admin login.");
  }

  const { error: profileError } = await supabase
    .from("platform_owner_profiles")
    .upsert(
      {
        auth_user_id: authUserId,
        email,
        full_name: fullName,
        phone,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "auth_user_id" },
    );

  if (profileError) {
    throw new Error(profileError.message);
  }

  const { error: membershipError } = await supabase
    .from("tenant_memberships")
    .insert({
      tenant_id: tenant.id,
      auth_user_id: authUserId,
      role: "owner",
    });

  if (membershipError) {
    throw new Error(membershipError.message);
  }

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    adminId: admin.id,
    loginId: admin.login_id,
    authUserId,
  };
}

export async function findMembershipForAuthUser(authUserId: string) {
  const supabase = createServiceSupabase();
  const { data: membership, error } = await supabase
    .from("tenant_memberships")
    .select("tenant_id, role")
    .eq("auth_user_id", authUserId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }
  if (!membership) return null;

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("id, slug, is_active")
    .eq("id", membership.tenant_id)
    .maybeSingle();

  if (tenantError) {
    throw new Error(tenantError.message);
  }
  if (!tenant?.is_active) return null;

  return {
    tenantId: tenant.id,
    tenantSlug: tenant.slug,
    role: membership.role,
  };
}

export async function findAdminAccountForTenant(
  tenantId: string,
  loginId: string,
) {
  const supabase = createServiceSupabase();
  const { data } = await supabase
    .from("admin_accounts")
    .select("id, login_id")
    .eq("tenant_id", tenantId)
    .eq("login_id", loginId)
    .maybeSingle();
  return data;
}
