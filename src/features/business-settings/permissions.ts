import type {
  GroupPermission,
  SettingsGroupKey,
  SettingsRole,
} from "./types";
import { DEFAULT_GROUP_PERMISSIONS } from "./registry";

const memoryPermissions = DEFAULT_GROUP_PERMISSIONS;

export function getGroupPermission(
  role: SettingsRole,
  group: SettingsGroupKey,
  overrides?: GroupPermission[],
): GroupPermission {
  const list = overrides?.length ? overrides : memoryPermissions;
  const hit = list.find((p) => p.role === role && p.group === group);
  if (hit) return hit;
  return {
    role,
    group,
    canRead: role === "owner" || role === "admin" || role === "platform_admin",
    canWrite: role === "owner" || role === "admin" || role === "platform_admin",
  };
}

export function assertCanRead(
  role: SettingsRole,
  group: SettingsGroupKey,
): void {
  const perm = getGroupPermission(role, group);
  if (!perm.canRead) {
    throw new Error(`Role "${role}" cannot read settings group "${group}".`);
  }
}

export function assertCanWrite(
  role: SettingsRole,
  group: SettingsGroupKey,
): void {
  const perm = getGroupPermission(role, group);
  if (!perm.canWrite) {
    throw new Error(`Role "${role}" cannot write settings group "${group}".`);
  }
}

export function listPermissionsForRole(
  role: SettingsRole,
): GroupPermission[] {
  return memoryPermissions.filter((p) => p.role === role);
}
