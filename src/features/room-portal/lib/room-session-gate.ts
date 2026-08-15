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

export function clearRoomClientSession(): void {
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
