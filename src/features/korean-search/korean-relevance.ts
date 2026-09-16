/**
 * Strict pass/fail Korean relevance for kor search + import tagging.
 * Ambiguous businesses fail closed (hidden from kor results).
 */

export type KoreanRelevanceInput = {
  name: string;
  suburb?: string | null;
  city?: string | null;
  state?: string | null;
  /** Marketplace primary_service e.g. Restaurant, Hair */
  service?: string | null;
  searchKeywords?: string[] | null;
  googleCategories?: string[] | null;
};

const HANGUL_RE = /[\uAC00-\uD7A3]/;

/** Strong Korean name cues (Latin + common brand tokens). */
const POSITIVE_NAME_RE =
  /\bkorean\b|\bk-?bbq\b|\bk-?beauty\b|\bk-?food\b|\bk-?chicken\b|\bk-?mart\b|\bhanaro|\bhoju\b|\bk\s*-?\s*fresh\b|\bkfresh\b|\bseoul\b|\bbusan\b|\bdaegu\b|\bincheon\b|\bkimchi\b|\bjokbal\b|\bmandu\b|\bbibimbap\b|\bbulgogi\b|\bgalbi\b|\bsamgyeops?al\b|\bgopchang\b|\bsoondae\b|\bsundubu\b|\btteok\b|\btopokki\b|\bjjigae\b|\bpocha\b|\bchimaek\b|\bsoju\b|\bmakgeolli\b|\bkorilla\b|\bbornga\b|\bgamdang\b|\bhanjan\b|\bjokchelin\b|\bnangam\b|\bmanjok\b|\bhanwoori\b|\bzizigo\b|\bseoul\s*garden\b|\bseoul\s*bistro\b|\bkcs\s*chicken\b|\bbapboi\b|\bmokkoji\b|\bhwaro\b|\bnoonane\b|\bomupapa\b|\bsunnypocha\b|\bgwangjang\b|\bsul\.?zip\b|\byido\b|\bhanseong\b|\bholy\s*hock\b|\bqueens\s*gimbap\b|\bpark\s*bong\s*sook\b|\bbori\s*korean\b|\bmanok\s*park\b|\blucky\s*mart\b|\bsmile\s*mart\b|\buni\s*mart\b|\bwestie\s*market\b|\bk\s*basket\b|\bkbasket\b|\bmanna\s*rice\b|\bhappy\s*market\b|\bmoa\s*mart\b|\bmoamart\b|\bgood\s*morning\s*(asian\s*)?(grocery|mart|market)?\b|\basiamart\b|한국|한식|한인|한식당|족발|만두|비빔|불고기|김치|포차|치킨|분식|해장|곱창|순대|한라|하나로|마트|굿모닝|럭키|모아/i;

/** Directory / verified seed provenance tags. */
const VERIFIED_KEYWORD_RE =
  /^(sundayweekly|qldvision|korean_verified|hanaromart|kfresh)$/i;

/**
 * Non-Korean cuisine / venue cues.
 * Applied strongly for Restaurant + Mart; milder for Hair.
 */
const NEGATIVE_RESTAURANT_RE =
  /\bjapanese\b|\byakiniku\b|\bizakaya\b|\bramen\b|\bうどん\b|\bsushi\b|\btempura\b|\btonkatsu\b|\bfuji\s*mart\b|\bgenki\b|\bwoolworths\b|\bcoles\b|\baldi\b|\bcostco\b|\biga\b|\bベトナム\b|\bvietnamese\b|\bviet\s*ha\b|\bviet\b|\bthai\b|\bindian\b|\bmalaysian\b|\bindonesian\b|\bkrishna\b|\bshiv\s*shakti\b|\btan\s*phat\b|\bvan\s*long\b|\bvu\s*hai\b|\bkim\s*loan\b|\btennis\s*club\b|\bgolf\s*club\b|\bりょうり\b|\b日本\b|\byori\b|\bgoukai\b|\bren\s*yakiniku\b|\bthat\s*viet\b|\bhu\s*shang\b|\bmilki\s*desserts\b/i;

const NEGATIVE_HAIR_RE =
  /\bjapanese\b|\btokyo\b|\b日本\b|\bjapan\b\s*hair|\baria\s*japanese\b/i;

/** Gold Coast / non–Greater Brisbane localities that leaked into kor results. */
const OUTSIDE_BRISBANE_RE =
  /southport|surfers\s*paradise|broadbeach|robina|burleigh|varsity|parkwood|coolum|noosa|mudgeeraba|helensvale|oxenford|coomera|mermaid|palm\s*beach|nerang|labrador|ashmore|toowoomba/i;

function haystack(input: KoreanRelevanceInput): string {
  return [
    input.name,
    input.suburb ?? "",
    input.city ?? "",
    input.state ?? "",
    ...(input.searchKeywords ?? []),
    ...(input.googleCategories ?? []),
  ]
    .join(" ")
    .toLowerCase();
}

export function isBrisbaneMetro(input: KoreanRelevanceInput): boolean {
  const place = `${input.suburb ?? ""} ${input.city ?? ""} ${input.state ?? ""}`;
  if (OUTSIDE_BRISBANE_RE.test(place)) return false;
  // Explicit Gold Coast state/city labels
  if (/gold\s*coast/i.test(place)) return false;
  return true;
}

function hasVerifiedKeyword(input: KoreanRelevanceInput): boolean {
  return (input.searchKeywords ?? []).some((k) => VERIFIED_KEYWORD_RE.test(k));
}

function hasKoreanKeyword(input: KoreanRelevanceInput): boolean {
  return (input.searchKeywords ?? []).some((k) => /^korean$/i.test(k.trim()));
}

function hasPositiveSignal(
  input: KoreanRelevanceInput,
  service: string,
): boolean {
  const name = input.name ?? "";
  if (HANGUL_RE.test(name)) return true;
  if (POSITIVE_NAME_RE.test(name)) return true;
  if (hasVerifiedKeyword(input)) return true;
  // Google type / category text sometimes includes "korean_restaurant"
  if ((input.googleCategories ?? []).some((c) => /korean/i.test(c))) {
    return true;
  }
  // Hair/beauty: Places "Korean salon" hits rarely put "Korean" in the trade name.
  // Trust the korean keyword when cuisine-style negatives don't apply.
  // Mart stays name/verified only — soft keyword pulled Woolworths / random Asian shops.
  if (
    (service === "Hair" ||
      service === "Barber" ||
      service === "Nails" ||
      service === "Spa") &&
    hasKoreanKeyword(input)
  ) {
    return true;
  }
  return false;
}

function hitsNegative(
  input: KoreanRelevanceInput,
  service: string,
): boolean {
  const text = haystack(input);
  const name = input.name ?? "";

  if (service === "Restaurant" || service === "Mart") {
    if (NEGATIVE_RESTAURANT_RE.test(name) || NEGATIVE_RESTAURANT_RE.test(text)) {
      // Allow if name also has explicit Korean cue (e.g. "Korean sushi" rare edge)
      if (POSITIVE_NAME_RE.test(name) || HANGUL_RE.test(name)) {
        // Still block clear Japanese/Vietnamese primaries
        if (
          /\bjapanese\b|\byakiniku\b|\bvietnamese\b|\bthat\s*viet\b|\bgoukai\b|\bりょうり\b/i.test(
            name,
          )
        ) {
          return true;
        }
        return false;
      }
      return true;
    }
  }

  if (service === "Hair" || service === "Barber" || service === "Nails") {
    if (NEGATIVE_HAIR_RE.test(name)) return true;
  }

  return false;
}

/**
 * Pass/fail Korean relevance for kor catalogue search.
 */
export function isKoreanRelevant(
  input: KoreanRelevanceInput,
  serviceHint?: string | null,
): boolean {
  if (!input.name?.trim()) return false;
  if (!isBrisbaneMetro(input)) return false;

  const service = (serviceHint || input.service || "").trim();

  if (hitsNegative(input, service)) return false;
  if (!hasPositiveSignal(input, service)) return false;

  return true;
}

/**
 * Whether an imported Google snapshot should receive the `korean` search keyword.
 * Failures get `korean_candidate` (or no tag) so they stay out of kor keyword search.
 */
export function shouldTagKoreanKeyword(input: KoreanRelevanceInput): boolean {
  return isKoreanRelevant(input, input.service);
}
