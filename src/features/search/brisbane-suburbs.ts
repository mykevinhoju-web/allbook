/**
 * Greater Brisbane suburbs for marketplace location typeahead + seed data.
 * Approximate centres — good enough for search bias / geocode hints.
 */

export type BrisbaneSuburb = {
  name: string;
  postcode: string;
  latitude: number;
  longitude: number;
};

export const BRISBANE_SUBURBS: readonly BrisbaneSuburb[] = [
  { name: "Brisbane City", postcode: "4000", latitude: -27.4705, longitude: 153.026 },
  { name: "Spring Hill", postcode: "4000", latitude: -27.4614, longitude: 153.024 },
  { name: "Fortitude Valley", postcode: "4006", latitude: -27.457, longitude: 153.035 },
  { name: "New Farm", postcode: "4005", latitude: -27.4676, longitude: 153.0489 },
  { name: "Teneriffe", postcode: "4005", latitude: -27.4558, longitude: 153.047 },
  { name: "Bowen Hills", postcode: "4006", latitude: -27.445, longitude: 153.037 },
  { name: "Herston", postcode: "4006", latitude: -27.447, longitude: 153.026 },
  { name: "Kelvin Grove", postcode: "4059", latitude: -27.45, longitude: 153.012 },
  { name: "Red Hill", postcode: "4059", latitude: -27.454, longitude: 153.004 },
  { name: "Paddington", postcode: "4064", latitude: -27.459, longitude: 152.999 },
  { name: "Milton", postcode: "4064", latitude: -27.47, longitude: 153.004 },
  { name: "Auchenflower", postcode: "4066", latitude: -27.476, longitude: 152.995 },
  { name: "Toowong", postcode: "4066", latitude: -27.485, longitude: 152.992 },
  { name: "Taringa", postcode: "4068", latitude: -27.493, longitude: 152.978 },
  { name: "Indooroopilly", postcode: "4068", latitude: -27.4992, longitude: 152.9726 },
  { name: "St Lucia", postcode: "4067", latitude: -27.5, longitude: 153.013 },
  { name: "Chapel Hill", postcode: "4069", latitude: -27.502, longitude: 152.95 },
  { name: "Kenmore", postcode: "4069", latitude: -27.508, longitude: 152.938 },
  { name: "Fig Tree Pocket", postcode: "4069", latitude: -27.53, longitude: 152.96 },
  { name: "Bardon", postcode: "4065", latitude: -27.461, longitude: 152.98 },
  { name: "Ashgrove", postcode: "4060", latitude: -27.445, longitude: 152.99 },
  { name: "The Gap", postcode: "4061", latitude: -27.444, longitude: 152.94 },
  { name: "Keperra", postcode: "4054", latitude: -27.415, longitude: 152.95 },
  { name: "Mitchelton", postcode: "4053", latitude: -27.416, longitude: 152.976 },
  { name: "Everton Park", postcode: "4053", latitude: -27.4, longitude: 152.99 },
  { name: "Stafford", postcode: "4053", latitude: -27.41, longitude: 153.01 },
  { name: "Grange", postcode: "4051", latitude: -27.423, longitude: 153.015 },
  { name: "Wilston", postcode: "4051", latitude: -27.43, longitude: 153.018 },
  { name: "Newmarket", postcode: "4051", latitude: -27.435, longitude: 153.01 },
  { name: "Alderley", postcode: "4051", latitude: -27.425, longitude: 153.0 },
  { name: "Enoggera", postcode: "4051", latitude: -27.425, longitude: 152.99 },
  { name: "Windsor", postcode: "4030", latitude: -27.437, longitude: 153.03 },
  { name: "Lutwyche", postcode: "4030", latitude: -27.422, longitude: 153.033 },
  { name: "Wooloowin", postcode: "4030", latitude: -27.42, longitude: 153.04 },
  { name: "Gordon Park", postcode: "4031", latitude: -27.415, longitude: 153.03 },
  { name: "Kedron", postcode: "4031", latitude: -27.405, longitude: 153.028 },
  { name: "Chermside", postcode: "4032", latitude: -27.3849, longitude: 153.0312 },
  { name: "Aspley", postcode: "4034", latitude: -27.3632, longitude: 153.0164 },
  { name: "Zillmere", postcode: "4034", latitude: -27.358, longitude: 153.038 },
  { name: "Geebung", postcode: "4034", latitude: -27.37, longitude: 153.048 },
  { name: "Boondall", postcode: "4034", latitude: -27.345, longitude: 153.06 },
  { name: "Bridgeman Downs", postcode: "4035", latitude: -27.355, longitude: 153.0 },
  { name: "Albany Creek", postcode: "4035", latitude: -27.348, longitude: 152.968 },
  { name: "Eatons Hill", postcode: "4037", latitude: -27.335, longitude: 152.96 },
  { name: "Nundah", postcode: "4012", latitude: -27.402, longitude: 153.058 },
  { name: "Toombul", postcode: "4012", latitude: -27.408, longitude: 153.058 },
  { name: "Northgate", postcode: "4013", latitude: -27.395, longitude: 153.07 },
  { name: "Virginia", postcode: "4014", latitude: -27.382, longitude: 153.063 },
  { name: "Clayfield", postcode: "4011", latitude: -27.42, longitude: 153.055 },
  { name: "Albion", postcode: "4010", latitude: -27.43, longitude: 153.042 },
  { name: "Ascot", postcode: "4007", latitude: -27.43, longitude: 153.06 },
  { name: "Hamilton", postcode: "4007", latitude: -27.438, longitude: 153.065 },
  { name: "Hendra", postcode: "4011", latitude: -27.42, longitude: 153.07 },
  { name: "Eagle Farm", postcode: "4009", latitude: -27.425, longitude: 153.085 },
  { name: "Pinkenba", postcode: "4008", latitude: -27.42, longitude: 153.12 },
  { name: "Sandgate", postcode: "4017", latitude: -27.322, longitude: 153.07 },
  { name: "Shorncliffe", postcode: "4017", latitude: -27.328, longitude: 153.082 },
  { name: "Brighton", postcode: "4017", latitude: -27.298, longitude: 153.057 },
  { name: "Bracken Ridge", postcode: "4017", latitude: -27.318, longitude: 153.03 },
  { name: "Redcliffe", postcode: "4020", latitude: -27.23, longitude: 153.11 },
  { name: "Kippa-Ring", postcode: "4021", latitude: -27.225, longitude: 153.09 },
  { name: "North Lakes", postcode: "4509", latitude: -27.24, longitude: 153.016 },
  { name: "Mango Hill", postcode: "4509", latitude: -27.24, longitude: 153.03 },
  { name: "Kallangur", postcode: "4503", latitude: -27.25, longitude: 152.99 },
  { name: "Petrie", postcode: "4502", latitude: -27.27, longitude: 152.98 },
  { name: "Kangaroo Point", postcode: "4169", latitude: -27.475, longitude: 153.035 },
  { name: "East Brisbane", postcode: "4169", latitude: -27.485, longitude: 153.045 },
  { name: "South Brisbane", postcode: "4101", latitude: -27.475, longitude: 153.017 },
  { name: "West End", postcode: "4101", latitude: -27.481, longitude: 153.013 },
  { name: "Highgate Hill", postcode: "4101", latitude: -27.488, longitude: 153.016 },
  { name: "Woolloongabba", postcode: "4102", latitude: -27.488, longitude: 153.036 },
  { name: "Dutton Park", postcode: "4102", latitude: -27.495, longitude: 153.025 },
  { name: "Annerley", postcode: "4103", latitude: -27.51, longitude: 153.03 },
  { name: "Fairfield", postcode: "4103", latitude: -27.508, longitude: 153.02 },
  { name: "Yeronga", postcode: "4104", latitude: -27.517, longitude: 153.018 },
  { name: "Yeerongpilly", postcode: "4105", latitude: -27.53, longitude: 153.015 },
  { name: "Moorooka", postcode: "4105", latitude: -27.535, longitude: 153.025 },
  { name: "Rocklea", postcode: "4106", latitude: -27.54, longitude: 153.0 },
  { name: "Salisbury", postcode: "4107", latitude: -27.55, longitude: 153.03 },
  { name: "Coopers Plains", postcode: "4108", latitude: -27.565, longitude: 153.04 },
  { name: "Sunnybank", postcode: "4109", latitude: -27.5704, longitude: 153.0608 },
  { name: "Sunnybank Hills", postcode: "4109", latitude: -27.59, longitude: 153.055 },
  { name: "Macgregor", postcode: "4109", latitude: -27.565, longitude: 153.07 },
  { name: "Robertson", postcode: "4109", latitude: -27.565, longitude: 153.055 },
  { name: "Runcorn", postcode: "4113", latitude: -27.595, longitude: 153.07 },
  { name: "Eight Mile Plains", postcode: "4113", latitude: -27.58, longitude: 153.09 },
  { name: "Underwood", postcode: "4119", latitude: -27.61, longitude: 153.11 },
  { name: "Springwood", postcode: "4127", latitude: -27.615, longitude: 153.13 },
  { name: "Rochedale", postcode: "4123", latitude: -27.575, longitude: 153.13 },
  { name: "Mount Gravatt", postcode: "4122", latitude: -27.538, longitude: 153.078 },
  { name: "Upper Mount Gravatt", postcode: "4122", latitude: -27.56, longitude: 153.085 },
  { name: "Garden City", postcode: "4122", latitude: -27.562, longitude: 153.082 },
  { name: "Wishart", postcode: "4122", latitude: -27.555, longitude: 153.1 },
  { name: "Mansfield", postcode: "4122", latitude: -27.54, longitude: 153.1 },
  { name: "Holland Park", postcode: "4121", latitude: -27.52, longitude: 153.06 },
  { name: "Holland Park West", postcode: "4121", latitude: -27.525, longitude: 153.05 },
  { name: "Tarragindi", postcode: "4121", latitude: -27.525, longitude: 153.04 },
  { name: "Greenslopes", postcode: "4120", latitude: -27.51, longitude: 153.05 },
  { name: "Coorparoo", postcode: "4151", latitude: -27.495, longitude: 153.06 },
  { name: "Camp Hill", postcode: "4152", latitude: -27.495, longitude: 153.08 },
  { name: "Carina", postcode: "4152", latitude: -27.49, longitude: 153.1 },
  { name: "Carindale", postcode: "4152", latitude: -27.503, longitude: 153.102 },
  { name: "Norman Park", postcode: "4170", latitude: -27.48, longitude: 153.055 },
  { name: "Morningside", postcode: "4170", latitude: -27.465, longitude: 153.07 },
  { name: "Cannon Hill", postcode: "4170", latitude: -27.47, longitude: 153.09 },
  { name: "Seven Hills", postcode: "4170", latitude: -27.48, longitude: 153.08 },
  { name: "Bulimba", postcode: "4171", latitude: -27.45, longitude: 153.06 },
  { name: "Hawthorne", postcode: "4171", latitude: -27.46, longitude: 153.06 },
  { name: "Balmoral", postcode: "4171", latitude: -27.455, longitude: 153.07 },
  { name: "Murarrie", postcode: "4172", latitude: -27.455, longitude: 153.1 },
  { name: "Tingalpa", postcode: "4173", latitude: -27.475, longitude: 153.12 },
  { name: "Wynnum", postcode: "4178", latitude: -27.443, longitude: 153.176 },
  { name: "Wynnum West", postcode: "4178", latitude: -27.45, longitude: 153.15 },
  { name: "Manly", postcode: "4179", latitude: -27.455, longitude: 153.185 },
  { name: "Lota", postcode: "4179", latitude: -27.47, longitude: 153.185 },
  { name: "Capalaba", postcode: "4157", latitude: -27.523, longitude: 153.192 },
  { name: "Alexandra Hills", postcode: "4161", latitude: -27.525, longitude: 153.22 },
  { name: "Birkdale", postcode: "4159", latitude: -27.495, longitude: 153.22 },
  { name: "Wellington Point", postcode: "4160", latitude: -27.49, longitude: 153.24 },
  { name: "Cleveland", postcode: "4163", latitude: -27.525, longitude: 153.265 },
  { name: "Ormiston", postcode: "4160", latitude: -27.515, longitude: 153.255 },
  { name: "Thornlands", postcode: "4164", latitude: -27.56, longitude: 153.27 },
  { name: "Victoria Point", postcode: "4165", latitude: -27.585, longitude: 153.3 },
  { name: "Sheldon", postcode: "4157", latitude: -27.58, longitude: 153.2 },
  { name: "Stretton", postcode: "4116", latitude: -27.62, longitude: 153.06 },
  { name: "Calamvale", postcode: "4116", latitude: -27.62, longitude: 153.04 },
  { name: "Parkinson", postcode: "4115", latitude: -27.64, longitude: 153.03 },
  { name: "Algester", postcode: "4115", latitude: -27.62, longitude: 153.02 },
  { name: "Forest Lake", postcode: "4078", latitude: -27.625, longitude: 152.97 },
  { name: "Inala", postcode: "4077", latitude: -27.57, longitude: 152.975 },
  { name: "Richlands", postcode: "4077", latitude: -27.595, longitude: 152.96 },
  { name: "Oxley", postcode: "4075", latitude: -27.555, longitude: 152.98 },
  { name: "Darra", postcode: "4076", latitude: -27.57, longitude: 152.95 },
  { name: "Corinda", postcode: "4075", latitude: -27.54, longitude: 152.98 },
  { name: "Sherwood", postcode: "4075", latitude: -27.53, longitude: 152.98 },
  { name: "Graceville", postcode: "4075", latitude: -27.52, longitude: 152.98 },
  { name: "Chelmer", postcode: "4068", latitude: -27.515, longitude: 152.975 },
  { name: "Jindalee", postcode: "4074", latitude: -27.535, longitude: 152.94 },
  { name: "Sinnamon Park", postcode: "4073", latitude: -27.54, longitude: 152.95 },
  { name: "Seventeen Mile Rocks", postcode: "4073", latitude: -27.545, longitude: 152.95 },
  { name: "Middle Park", postcode: "4074", latitude: -27.555, longitude: 152.925 },
  { name: "Mount Ommaney", postcode: "4074", latitude: -27.545, longitude: 152.93 },
  { name: "Riverhills", postcode: "4074", latitude: -27.56, longitude: 152.91 },
  { name: "Westlake", postcode: "4074", latitude: -27.55, longitude: 152.91 },
  { name: "Bellbowrie", postcode: "4070", latitude: -27.56, longitude: 152.89 },
  { name: "Moggill", postcode: "4070", latitude: -27.57, longitude: 152.87 },
  { name: "Pullenvale", postcode: "4069", latitude: -27.53, longitude: 152.89 },
  { name: "Brookfield", postcode: "4069", latitude: -27.5, longitude: 152.9 },
  { name: "Nathan", postcode: "4111", latitude: -27.55, longitude: 153.05 },
  { name: "Upper Kedron", postcode: "4055", latitude: -27.42, longitude: 152.93 },
  { name: "Ferny Grove", postcode: "4055", latitude: -27.4, longitude: 152.935 },
  { name: "Ferny Hills", postcode: "4055", latitude: -27.4, longitude: 152.92 },
  { name: "Arana Hills", postcode: "4054", latitude: -27.4, longitude: 152.96 },
  { name: "Bunya", postcode: "4055", latitude: -27.38, longitude: 152.94 },
] as const;

/** Sorted suburb names for typeahead / filter UI. */
export const BRISBANE_SUBURB_NAMES: readonly string[] = [
  ...new Set(BRISBANE_SUBURBS.map((s) => s.name)),
].sort((a, b) => a.localeCompare(b));

/**
 * Resolve a typed location to a known Greater Brisbane suburb centre.
 * Prefer this over live geocoding for catalogue suburbs (Albion, etc.).
 */
export function resolveBrisbaneSuburb(
  location: string,
): BrisbaneSuburb | null {
  const q = location.trim().toLowerCase().replace(/\s+/g, " ");
  if (!q) return null;

  const exact = BRISBANE_SUBURBS.find((s) => s.name.toLowerCase() === q);
  if (exact) return exact;

  // "Albion QLD", "albion, brisbane", etc.
  const stripped = q
    .replace(/,?\s*(qld|queensland|australia|au)\b/g, "")
    .replace(/,?\s*brisbane\b/g, "")
    .trim();
  if (stripped && stripped !== q) {
    const match = BRISBANE_SUBURBS.find((s) => s.name.toLowerCase() === stripped);
    if (match) return match;
  }

  return null;
}
