import {
  ASPLEY_SUBURB_ID,
  BRIDGEMAN_DOWNS_SUBURB_ID,
  CHERMSIDE_SUBURB_ID,
  upcomingWeekday,
} from "../demo-seed-data";
import type { StructuredServiceRequest } from "../types";

import type { ParseResult, RequestParser } from "./types";

/**
 * Canonical service kinds (English / AU market).
 * Never use localized strings as taxonomy or DB values.
 */
type ServiceKind =
  | "lawn_mowing"
  | "house_cleaning"
  | "nail_trim"
  | "mobile_car_wash"
  | "dog_grooming"
  | "electrical"
  | "hair_cut";

type DayHint = "tomorrow" | "today" | "saturday" | "sunday" | "weekend" | null;

function detectService(text: string): ServiceKind | null {
  if (
    /hair\s*cut|haircut|hair\s*salon|barber|hair_cut|hair\s*dress/.test(text)
  ) {
    return "hair_cut";
  }
  if (
    /lawn\s*mow|mow\s*(my\s*)?lawn|lawn_care|lawn_mowing|lawn\s*care/.test(
      text,
    )
  ) {
    return "lawn_mowing";
  }
  if (/house\s*clean|home\s*clean|cleaning|house_cleaning/.test(text)) {
    return "house_cleaning";
  }
  if (/nail\s*trim|nail\s*service|manicure|nails?\b|nail_trim/.test(text)) {
    return "nail_trim";
  }
  if (
    /car\s*wash|mobile\s*auto|mobile_car_wash|vehicle\s*wash/.test(text)
  ) {
    return "mobile_car_wash";
  }
  if (/dog\s*groom|pet\s*groom|dog_grooming/.test(text)) {
    return "dog_grooming";
  }
  if (/electrician|electrical|electric\s*work/.test(text)) {
    return "electrical";
  }
  return null;
}

function detectLocation(
  text: string,
): { label: string; suburbId: string } | null {
  if (/\baspley\b/i.test(text)) {
    return { label: "Aspley", suburbId: ASPLEY_SUBURB_ID };
  }
  if (/\bchermside\b/i.test(text)) {
    return { label: "Chermside", suburbId: CHERMSIDE_SUBURB_ID };
  }
  if (/\bbridgeman\s*downs\b/i.test(text)) {
    return { label: "Bridgeman Downs", suburbId: BRIDGEMAN_DOWNS_SUBURB_ID };
  }
  return null;
}

function detectRequiredAmenities(text: string): string[] {
  const flags: string[] = [];
  if (
    /disability|wheelchair|accessible|accessib|disabled\s*access/.test(text)
  ) {
    flags.push("disability_accessible");
  }
  if (/kids?\s*care|child\s*care|children|kids?\s*friendly|family/.test(text)) {
    flags.push("kids_care");
  }
  if (/\bparking\b|\bpark\b/.test(text)) {
    flags.push("parking");
  }
  return flags;
}

function detectBudgetCents(text: string): number | null {
  const underDollar = text.match(
    /(?:under|below|max(?:imum)?|up\s*to|less\s*than)\s*\$?\s*(\d{1,4})/i,
  );
  if (underDollar) return Number(underDollar[1]) * 100;

  const dollar = text.match(/\$\s*(\d{1,4})/);
  if (dollar) return Number(dollar[1]) * 100;

  return null;
}

function detectTime(text: string): string | null {
  if (/\b2\s*pm\b|\b14:00\b|\b2:00\s*pm\b/i.test(text)) return "14:00";
  if (/\b3\s*pm\b|\b15:00\b/i.test(text)) return "15:00";
  if (/\b10\s*am\b|\b10:00\b/i.test(text)) return "10:00";
  if (/\b8\s*pm\b|\b20:00\b/i.test(text)) return "20:00";
  const hm = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  if (hm) return `${hm[1].padStart(2, "0")}:${hm[2]}`;
  return null;
}

function detectDayHint(text: string): DayHint {
  if (/\btomorrow\b/i.test(text)) return "tomorrow";
  if (/\btoday\b/i.test(text)) return "today";
  if (/\bsaturday\b/i.test(text)) return "saturday";
  if (/\bsunday\b/i.test(text)) return "sunday";
  if (/\bweekend\b/i.test(text)) return "weekend";
  return null;
}

function serviceMeta(kind: ServiceKind): {
  serviceCategory: string;
  serviceSlug: string;
  defaultDay: number;
  defaultTime: string;
} {
  switch (kind) {
    case "lawn_mowing":
      return {
        serviceCategory: "lawn_care",
        serviceSlug: "lawn_mowing",
        defaultDay: 1,
        defaultTime: "14:00",
      };
    case "hair_cut":
      return {
        serviceCategory: "hair",
        serviceSlug: "hair_cut",
        defaultDay: 3,
        defaultTime: "14:00",
      };
    case "house_cleaning":
      return {
        serviceCategory: "cleaning",
        serviceSlug: "house_cleaning",
        // Demo ABC Cleaning: Tue/Thu — Tuesday so budget filter is testable
        defaultDay: 2,
        defaultTime: "14:00",
      };
    case "nail_trim":
      return {
        serviceCategory: "nail",
        serviceSlug: "nail_trim",
        defaultDay: 3,
        defaultTime: "14:00",
      };
    case "mobile_car_wash":
      return {
        serviceCategory: "automotive",
        serviceSlug: "mobile_car_wash",
        defaultDay: 6,
        defaultTime: "14:00",
      };
    case "dog_grooming":
      return {
        serviceCategory: "pet",
        serviceSlug: "dog_grooming",
        defaultDay: 1,
        defaultTime: "14:00",
      };
    case "electrical":
      return {
        serviceCategory: "electrical",
        serviceSlug: "electrical",
        defaultDay: 1,
        defaultTime: "14:00",
      };
  }
}

function addDays(base: Date, days: number): Date {
  const d = new Date(base);
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() + days);
  return d;
}

function toIsoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Phase 1 Demo Parser — English (AU) pattern rules only (no LLM).
 *
 * Canonical taxonomy / structured output is always English
 * (e.g. lawn_mowing, house_cleaning). Localized UI copy may come later;
 * this parser must not emit Korean (or other) canonical values.
 *
 * Swap later for AiRequestParser implementing the same RequestParser interface.
 */
export class DemoRequestParser implements RequestParser {
  readonly id = "demo-parser-v1";

  parse(rawQuery: string, now = new Date()): ParseResult {
    const text = rawQuery.trim();
    if (!text) {
      return {
        ok: false,
        error: "Please describe what you need help with.",
        hints: [
          "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
        ],
      };
    }

    const normalized = text.toLowerCase();
    const service = detectService(normalized);
    const location = detectLocation(text);
    const budgetCentsMax = detectBudgetCents(text);
    const preferredTime = detectTime(normalized);
    const dayHint = detectDayHint(normalized);
    const requiredAmenities = detectRequiredAmenities(normalized);
    const urgency = /\b(asap|urgent|urgently)\b/.test(normalized)
      ? "high"
      : "normal";

    if (!service) {
      return {
        ok: false,
        error:
          "Could not detect a supported service yet (demo parser). Try haircut, lawn mowing, cleaning, nail service, or car wash.",
        hints: [
          "I need a haircut in Bridgeman Downs tomorrow at 2pm.",
          "I need someone tomorrow at 2pm in Aspley to mow my lawn for under $80.",
          "Looking for a nail service in Chermside for under $30.",
        ],
      };
    }

    const meta = serviceMeta(service);
    const notes: string[] = [];
    let preferredDay = meta.defaultDay;
    let preferredDate = upcomingWeekday(preferredDay, now);

    if (dayHint === "today") {
      preferredDay = now.getDay();
      preferredDate = toIsoDate(addDays(now, 0));
      notes.push("Interpreted as today.");
    } else if (dayHint === "tomorrow") {
      const tom = addDays(now, 1);
      preferredDay = tom.getDay();
      preferredDate = toIsoDate(tom);
      // Lawn partners are Mon–Fri; if tomorrow is weekend, roll to next Monday for demo reliability.
      if (
        service === "lawn_mowing" &&
        (preferredDay === 0 || preferredDay === 6)
      ) {
        preferredDay = 1;
        preferredDate = upcomingWeekday(1, now);
        notes.push(
          "Tomorrow is a weekend; demo parser used next Monday for lawn availability.",
        );
      } else {
        notes.push("Interpreted as tomorrow.");
      }
    } else if (dayHint === "saturday") {
      preferredDay = 6;
      preferredDate = upcomingWeekday(6, now);
      notes.push("Interpreted as Saturday.");
    } else if (dayHint === "sunday") {
      preferredDay = 0;
      preferredDate = upcomingWeekday(0, now);
      notes.push("Interpreted as Sunday.");
    } else if (dayHint === "weekend") {
      preferredDay = 6;
      preferredDate = upcomingWeekday(6, now);
      notes.push("Interpreted weekend as Saturday.");
    } else {
      notes.push(`No day mentioned; demo default weekday=${preferredDay}.`);
    }

    const time = preferredTime ?? meta.defaultTime;
    if (!preferredTime) {
      notes.push(`No time mentioned; demo default ${time}.`);
    }

    const locationLabel = location?.label ?? (service === "hair_cut" ? "Bridgeman Downs" : "Aspley");
    const suburbId =
      location?.suburbId ??
      (service === "hair_cut" ? BRIDGEMAN_DOWNS_SUBURB_ID : ASPLEY_SUBURB_ID);
    if (!location) {
      notes.push(
        service === "hair_cut"
          ? "No suburb detected; demo default Bridgeman Downs."
          : "No suburb detected; demo default Aspley.",
      );
    }
    if (requiredAmenities.length) {
      notes.push(`Required amenities: ${requiredAmenities.join(", ")}`);
    }

    const request: StructuredServiceRequest = {
      rawQuery: text,
      serviceCategory: meta.serviceCategory,
      serviceSlug: meta.serviceSlug,
      locationLabel,
      suburbId,
      preferredDay,
      preferredDate,
      preferredTime: time,
      budgetCentsMax,
      urgency,
      requiredAmenities,
    };

    return {
      ok: true,
      request,
      confidence:
        location && preferredTime && budgetCentsMax != null ? 0.9 : 0.7,
      matchedPattern: `${service}+${locationLabel}+${dayHint ?? "default_day"}`,
      notes,
    };
  }
}

/** Default Phase 1 parser instance — swap export later for AI. */
export const demoRequestParser: RequestParser = new DemoRequestParser();

/** Active parser used by Marketplace search APIs. */
export function getActiveRequestParser(): RequestParser {
  // Future: if (process.env.MARKETPLACE_AI_PARSER === 'true') return aiRequestParser
  return demoRequestParser;
}
