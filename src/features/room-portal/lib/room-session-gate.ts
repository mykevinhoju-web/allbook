export const ROOM_PIN_GATE_KEY = "allbook_room_pin_ok";
export const ROOM_DEVICE_STORAGE_KEY = "allbook_room_device_id";

export function hasRoomPinGate(): boolean {
  try {
    return sessionStorage.getItem(ROOM_PIN_GATE_KEY) === "1";
  } catch {
    return false;
  }
}

export function setRoomPinGate(): void {
  try {
    sessionStorage.setItem(ROOM_PIN_GATE_KEY, "1");
  } catch {
    // ignore
  }
}

export function clearRoomPinGate(): void {
  try {
    sessionStorage.removeItem(ROOM_PIN_GATE_KEY);
  } catch {
    // ignore
  }
}

export function clearRoomClientSession(): void {
  clearRoomPinGate();
  try {
    sessionStorage.removeItem(ROOM_PIN_GATE_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(ROOM_DEVICE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Drop the room PIN staff cookie, then open staff login so PIN is required again. */
export async function openStaffLoginWithoutRoomSession() {
  try {
    await fetch("/api/room/staff/logout", {
      method: "POST",
      credentials: "include",
    });
    await fetch("/api/staff/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Still open the login form.
  }
  window.location.assign("/staff/login?fresh=1");
}

/** After staff portal Sign out, return to this tablet's room PIN if a room is still claimed. */
export async function redirectAfterStaffPortalLogout() {
  try {
    await fetch("/api/staff/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Continue to the next screen.
  }

  try {
    const response = await fetch("/api/room/me", { credentials: "include" });
    const data = (await response.json()) as {
      user?: { roomId?: string } | null;
    };
    if (response.ok && data.user?.roomId) {
      window.location.assign("/room");
      return;
    }
  } catch {
    // Fall through to staff login.
  }

  window.location.assign("/staff/login?fresh=1");
}
