/**
 * AllBook language policy (Australian market)
 *
 * - Developer docs / agent chat may use Korean.
 * - Application data, search, taxonomy, DB enums, seeds, tests, matching
 *   keywords, AI structured output, and API values MUST use English as the
 *   canonical language (e.g. lawn_mowing, house_cleaning, nail_service).
 * - UI may later show localized labels; never store Korean as canonical IDs.
 */
export const MARKETPLACE_CANONICAL_LOCALE = "en-AU" as const;
