export const ROOM_PIN_GATE_KEY = "allbook_room_pin_ok";
export const ROOM_DEVICE_STORAGE_KEY = "allbook_room_device_id";
const ROOM_RETURN_KEY = "allbook_room_return";

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

export function persistRoomDeviceId(deviceId: string): void {
  try {
    localStorage.setItem(ROOM_DEVICE_STORAGE_KEY, deviceId);
  } catch {
    // ignore
  }
}

export function readRoomDeviceId(): string | null {
  try {
    return localStorage.getItem(ROOM_DEVICE_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function rememberRoomReturn(room: {
  roomId: string;
  roomName: string;
  deviceId?: string;
}): void {
  try {
    sessionStorage.setItem(
      ROOM_RETURN_KEY,
      JSON.stringify({ roomId: room.roomId, roomName: room.roomName }),
    );
  } catch {
    // ignore
  }
  if (room.deviceId) persistRoomDeviceId(room.deviceId);
}

export function readRoomReturn(): { roomId: string; roomName: string } | null {
  try {
    const raw = sessionStorage.getItem(ROOM_RETURN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { roomId?: string; roomName?: string };
    if (!parsed.roomId) return null;
    return { roomId: parsed.roomId, roomName: parsed.roomName ?? "" };
  } catch {
    return null;
  }
}

export function clearRoomClientSession(): void {
  clearRoomPinGate();
  try {
    sessionStorage.removeItem(ROOM_PIN_GATE_KEY);
    sessionStorage.removeItem(ROOM_RETURN_KEY);
  } catch {
    // ignore
  }
  try {
    localStorage.removeItem(ROOM_DEVICE_STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** Drop the staff PIN cookie, then open staff login. Room claim stays. */
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

/** After staff portal Sign out, return to this tablet's claimed room PIN. */
export async function redirectAfterStaffPortalLogout() {
  try {
    await fetch("/api/staff/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } catch {
    // Continue to the next screen.
  }

  const remembered = readRoomReturn();
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
    // Fall through.
  }

  if (remembered) {
    window.location.assign("/room");
    return;
  }

  window.location.assign("/staff/login?fresh=1");
}
