import type { ExcludedCandidate, MatchResult } from "./types";

export type NoMatchSummary = {
  headline: string;
  reasons: Array<{ code: string; label: string; count: number }>;
};

/**
 * Collapse exclusion reasons into a short customer-facing summary.
 */
export function summarizeNoMatches(
  result: Pick<MatchResult, "excluded">,
): NoMatchSummary {
  const counts = new Map<string, number>();
  for (const row of result.excluded) {
    const code = classifyExclusion(row);
    counts.set(code, (counts.get(code) ?? 0) + 1);
  }

  const labels: Record<string, string> = {
    area_mismatch: "No providers in this area",
    availability_mismatch: "No availability at this time",
    budget_mismatch: "Price exceeds your budget",
    amenity_mismatch: "Amenity requirements not met",
    service_mismatch: "Service not currently available",
    other: "Other requirement mismatches",
  };

  const reasons = [...counts.entries()]
    .map(([code, count]) => ({
      code,
      label: labels[code] ?? labels.other,
      count,
    }))
    .sort((a, b) => b.count - a.count);

  return {
    headline: "No providers matched all of your requirements.",
    reasons,
  };
}

function classifyExclusion(row: ExcludedCandidate): string {
  const r = row.exclusionReason;
  if (r === "area_mismatch") return "area_mismatch";
  if (r === "availability_mismatch") return "availability_mismatch";
  if (r === "amenity_mismatch") return "amenity_mismatch";
  if (r === "service_mismatch" || r === "service_inactive") {
    return "service_mismatch";
  }
  if (r.startsWith("price_") || r.includes("budget") || r.includes("quote")) {
    return "budget_mismatch";
  }
  return "other";
}

export function matchExplanation(breakdown: {
  service_match?: boolean;
  area_match?: boolean;
  availability_match?: boolean;
  budget_match?: boolean;
  amenity_match?: boolean;
}): string[] {
  const lines: string[] = [];
  if (breakdown.service_match) lines.push("Matches your service");
  if (breakdown.area_match) lines.push("Serves your area");
  if (breakdown.availability_match) {
    lines.push("Available at requested time");
  }
  if (breakdown.budget_match) lines.push("Within your budget");
  if (breakdown.amenity_match) lines.push("Matches your amenity needs");
  return lines;
}
