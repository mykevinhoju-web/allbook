import { cookies } from "next/headers";

import { readCookieFromRequest } from "@/lib/cookies/read-request-cookie";
import {
  getRoomSessionCookieName,
  verifyRoomSession,
  type RoomSessionPayload,
} from "@/lib/room-session";

export class RoomAuthError extends Error {
  status: number;
  code: string;

  constructor(message: string, status = 401, code = "ROOM_LOGIN_REQUIRED") {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export async function requireRoomSession(
  tenantId: string,
  request?: Request,
): Promise<RoomSessionPayload> {
  const cookieName = getRoomSessionCookieName();
  const token = request
    ? readCookieFromRequest(request, cookieName)
    : (await cookies()).get(cookieName)?.value;

  if (!token) {
    throw new RoomAuthError(
      "Room login required first. Select this tablet’s room before staff PIN sign-in.",
      403,
      "ROOM_LOGIN_REQUIRED",
    );
  }

  const session = await verifyRoomSession(token);
  if (!session || session.tenantId !== tenantId) {
    throw new RoomAuthError(
      "Room login required first. Select this tablet’s room before staff PIN sign-in.",
      403,
      "ROOM_LOGIN_REQUIRED",
    );
  }

  return session;
}

export async function getOptionalRoomSession(
  tenantId: string,
  request?: Request,
): Promise<RoomSessionPayload | null> {
  try {
    return await requireRoomSession(tenantId, request);
  } catch (error) {
    if (error instanceof RoomAuthError) return null;
    throw error;
  }
}
