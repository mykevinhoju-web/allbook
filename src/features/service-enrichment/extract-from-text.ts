import {
  taxonomyForPrimaryService,
  type ServiceTemplate,
} from "./category-taxonomies";

export type ExtractedServiceDraft = {
  category: string;
  name: string;
  durationMinutes: number;
  priceFrom: number;
  matchedKeywords: string[];
};

/**
 * Rule-based extraction: scan free text for taxonomy keywords.
 */
export function extractServicesFromText(
  text: string,
  primaryService?: string | null,
): ExtractedServiceDraft[] {
  const hay = text.toLowerCase();
  if (!hay.trim()) return [];

  const taxonomy = taxonomyForPrimaryService(primaryService);
  const found: ExtractedServiceDraft[] = [];
  for (const template of taxonomy) {
    const matched = template.keywords.filter((kw) => hay.includes(kw));
    if (matched.length === 0) continue;
    found.push({
      category: template.category,
      name: template.name,
      durationMinutes: template.durationMinutes,
      priceFrom: template.priceFrom,
      matchedKeywords: matched,
    });
  }
  return found;
}

export function mergeServiceDrafts(
  ...groups: ExtractedServiceDraft[][]
): ExtractedServiceDraft[] {
  const byName = new Map<string, ExtractedServiceDraft>();
  for (const group of groups) {
    for (const draft of group) {
      const key = draft.name.toLowerCase();
      const existing = byName.get(key);
      if (!existing) {
        byName.set(key, { ...draft });
        continue;
      }
      existing.matchedKeywords = [
        ...new Set([...existing.matchedKeywords, ...draft.matchedKeywords]),
      ];
    }
  }
  return [...byName.values()];
}

export function templatesForNames(
  names: string[],
  primaryService?: string | null,
): ServiceTemplate[] {
  const set = new Set(names.map((n) => n.toLowerCase()));
  return taxonomyForPrimaryService(primaryService).filter((t) =>
    set.has(t.name.toLowerCase()),
  );
}
