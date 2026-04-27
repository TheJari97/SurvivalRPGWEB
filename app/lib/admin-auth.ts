import { createClient } from "@supabase/supabase-js";
import { appConfig } from "./config";
import { getSteamUserSession, SteamUserSession } from "./steam-auth";

export const STAFF_ROLES = ["owner", "admin", "moderator", "support"] as const;

const ROLE_PRIORITY: Record<StaffRole, number> = {
  owner: 4,
  admin: 3,
  moderator: 2,
  support: 1,
};

export type StaffRole = typeof STAFF_ROLES[number];

export type AdminSession = {
  steamId: string;
  displayName: string | null;
  avatarUrl: string | null;
  role: StaffRole;
  roles: StaffRole[];
  permissions: string[];
};

type StaffRoleRow = {
  id: string;
  role: string;
  active?: boolean | null;
};

export function getSupabaseAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

  if (!appConfig.supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase admin environment is not configured");
  }

  return createClient(appConfig.supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

export async function getAdminSession(): Promise<AdminSession | null> {
  const steamSession = await getSteamUserSession();
  if (!steamSession) return null;
  return getAdminSessionForSteamUser(steamSession);
}

export async function getAdminSessionForSteamUser(steamSession: SteamUserSession): Promise<AdminSession | null> {
  const supabase = getSupabaseAdminClient();
  let roles = await getActiveStaffRoles(supabase, steamSession.steamId);

  if (roles.length === 0 && isEnvOwnerSteamId(steamSession.steamId)) {
    await ensureEnvOwnerRole(supabase, steamSession);
    roles = await getActiveStaffRoles(supabase, steamSession.steamId);
  }

  if (roles.length === 0) return null;

  const uniqueRoles = sortStaffRoles([...new Set(roles)]);
  const { data: permissionRows } = await supabase
    .from("admin_role_permissions")
    .select("permission")
    .in("role", uniqueRoles);

  const permissions = new Set<string>();
  for (const row of permissionRows ?? []) {
    if (row.permission) permissions.add(String(row.permission));
  }
  if (uniqueRoles.includes("owner")) permissions.add("admin.full_access");

  return {
    steamId: steamSession.steamId,
    displayName: steamSession.displayName,
    avatarUrl: steamSession.avatarUrl,
    role: uniqueRoles[0],
    roles: uniqueRoles,
    permissions: [...permissions].sort(),
  };
}

export function adminHasPermission(session: AdminSession, permission: string) {
  return session.permissions.includes("admin.full_access") || session.permissions.includes(permission);
}

export async function writeAdminAuditLog(input: {
  actorSteamId?: string | null;
  actorRole?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  beforeValue?: Record<string, unknown> | null;
  afterValue?: Record<string, unknown> | null;
}) {
  try {
    const supabase = getSupabaseAdminClient();
    await supabase.from("audit_logs").insert({
      actor_steam_id: input.actorSteamId ?? null,
      actor_role: input.actorRole ?? "admin",
      action: input.action,
      target_type: input.targetType ?? null,
      target_id: input.targetId ?? null,
      ip_address: input.ipAddress ?? null,
      user_agent: input.userAgent ?? null,
      before_value: input.beforeValue ?? null,
      after_value: input.afterValue ?? null,
    });
  } catch {
    // Audit failures must not block player login or admin access checks.
  }
}

async function getActiveStaffRoles(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  steamId: string,
): Promise<StaffRole[]> {
  const { data, error } = await supabase
    .from("player_roles")
    .select("id, role, active")
    .eq("steam_id", steamId)
    .eq("active", true)
    .in("role", STAFF_ROLES);

  if (error) return [];

  return (data as StaffRoleRow[] | null ?? [])
    .map((row) => row.role)
    .filter(isStaffRole);
}

async function ensureEnvOwnerRole(
  supabase: ReturnType<typeof getSupabaseAdminClient>,
  steamSession: SteamUserSession,
) {
  const now = new Date().toISOString();
  await supabase
    .from("players")
    .upsert({
      steam_id: steamSession.steamId,
      display_name: steamSession.displayName,
      avatar_url: steamSession.avatarUrl,
      updated_at: now,
    }, { onConflict: "steam_id" });

  for (const role of ["owner", "admin"] as StaffRole[]) {
    await supabase
      .from("player_roles")
      .upsert({
        steam_id: steamSession.steamId,
        role,
        active: true,
        notes: "bootstrap_from_ADMIN_STEAM_IDS",
        updated_at: now,
      }, { onConflict: "steam_id,role" });
  }
}

function sortStaffRoles(roles: StaffRole[]) {
  return roles.sort((a, b) => ROLE_PRIORITY[b] - ROLE_PRIORITY[a]);
}

function isStaffRole(role: string): role is StaffRole {
  return STAFF_ROLES.includes(role as StaffRole);
}

function isEnvOwnerSteamId(steamId: string) {
  const ids = (process.env.ADMIN_STEAM_IDS ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return ids.includes(steamId);
}
