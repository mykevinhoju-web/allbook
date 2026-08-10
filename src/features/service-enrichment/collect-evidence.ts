/**
 * Collect text clues for service extraction: website + Place details blurbs.
 */

import {
  getPlaceDetails,
  type PlacesApiPlace,
} from "@/features/google-import/places-client";

const FETCH_TIMEOUT_MS = 8_000;
const MAX_WEBSITE_CHARS = 12_000;

export async function fetchWebsiteText(
  website: string | null | undefined,
): Promise<string> {
  const url = website?.trim();
  if (!url || !/^https?:\/\//i.test(url)) return "";

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: {
        "User-Agent": "AllBookServiceEnrichment/1.0 (+https://allbook.com.au)",
        Accept: "text/html,application/xhtml+xml",
      },
    });
    if (!response.ok) return "";
    const html = await response.text();
    return htmlToPlainText(html).slice(0, MAX_WEBSITE_CHARS);
  } catch {
    return "";
  } finally {
    clearTimeout(timer);
  }
}

export function htmlToPlainText(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

export function placeTextFromDetails(place: PlacesApiPlace): string {
  const parts: string[] = [];
  if (place.displayName?.text) parts.push(place.displayName.text);
  const editorial = (
    place as PlacesApiPlace & {
      editorialSummary?: { text?: string };
      generativeSummary?: { overview?: { text?: string } };
      reviews?: Array<{ text?: { text?: string } }>;
    }
  ).editorialSummary?.text;
  if (editorial) parts.push(editorial);
  const generative = (
    place as PlacesApiPlace & {
      generativeSummary?: { overview?: { text?: string } };
    }
  ).generativeSummary?.overview?.text;
  if (generative) parts.push(generative);
  const reviews = (
    place as PlacesApiPlace & {
      reviews?: Array<{ text?: { text?: string } }>;
    }
  ).reviews;
  for (const review of reviews ?? []) {
    const t = review.text?.text?.trim();
    if (t) parts.push(t);
  }
  if (place.types?.length) parts.push(place.types.join(" "));
  return parts.join("\n");
}

export async function collectSalonEvidenceText(input: {
  website: string | null;
  googlePlaceId: string | null;
}): Promise<{ text: string; sources: string[] }> {
  const sources: string[] = [];
  const chunks: string[] = [];

  if (input.googlePlaceId) {
    try {
      const place = await getPlaceDetails(input.googlePlaceId);
      const placeText = placeTextFromDetails(place);
      if (placeText) {
        chunks.push(placeText);
        sources.push("google_place");
      }
      if (!input.website && place.websiteUri) {
        const site = await fetchWebsiteText(place.websiteUri);
        if (site) {
          chunks.push(site);
          sources.push("website");
        }
      }
    } catch {
      /* place details optional */
    }
  }

  if (input.website) {
    const site = await fetchWebsiteText(input.website);
    if (site) {
      chunks.push(site);
      sources.push("website");
    }
  }

  return { text: chunks.join("\n\n"), sources: [...new Set(sources)] };
}
