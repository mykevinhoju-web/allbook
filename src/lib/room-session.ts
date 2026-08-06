import { SignJWT, jwtVerify } from "jose";

import {
  getSessionCookieOptions,
  SESSION_COOKIE_MAX_AGE,
} from "./app-session";

export const ROOM_SESSION_COOKIE = "allbook_room_session";

export type RoomSessionPayload = {
  role: "room";
  tenantSlug: string;
  tenantId: string;
  roomId: string;
  roomName: string;
  deviceId: string;
};

function getSecret() {
  const value =
    process.env.APP_SESSION_SECRET ?? process.env.STAFF_SESSION_SECRET;
  if (!value) {
    throw new Error(
      "APP_SESSION_SECRET (or STAFF_SESSION_SECRET) is not configured.",
    );
  }
  return new TextEncoder().encode(value);
}

export function getRoomSessionCookieName() {
  return ROOM_SESSION_COOKIE;
}

export function getRoomSessionCookieOptions() {
  return getSessionCookieOptions();
}

export { SESSION_COOKIE_MAX_AGE };

export async function signRoomSession(payload: RoomSessionPayload) {
  const secret = getSecret();
  return await new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .sign(secret);
}

export async function verifyRoomSession(
  token: string,
): Promise<RoomSessionPayload | null> {
  try {
    const secret = getSecret();
    const { payload } = await jwtVerify(token, secret, {
      clockTolerance: "1 day",
    });
    const record = payload as unknown as RoomSessionPayload;
    if (
      record.role !== "room" ||
      !record.tenantId ||
      !record.roomId ||
      !record.deviceId
    ) {
      return null;
    }
    return record;
  } catch {
    return null;
  }
}
