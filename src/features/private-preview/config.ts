/**
 * Private Preview Mode — AllBook Marketplace is not publicly launched.
 * Toggle with PRIVATE_PREVIEW_MODE=false when ready for public launch.
 */
export function isPrivatePreviewEnabled(): boolean {
  const raw = process.env.PRIVATE_PREVIEW_MODE?.trim().toLowerCase();
  if (raw === "false" || raw === "0" || raw === "off") return false;
  // Default ON — platform is not ready for public launch.
  return true;
}

export const PRIVATE_PREVIEW_DOCS_HREF = "/docs";

export {
  PRIVATE_PREVIEW_ACCESS_COOKIE,
  PRIVATE_PREVIEW_UNLOCK_PATH,
} from "./preview-access-cookie";
