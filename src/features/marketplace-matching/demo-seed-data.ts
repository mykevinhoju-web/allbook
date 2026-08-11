/**
 * Demo seed definitions + weekday helpers.
 * day uses JS getDay(): 0=Sun … 6=Sat
 */

export const DEMO_PARTNER_EMAIL_DOMAIN = "allbook.demo";

export const ASPLEY_SUBURB_ID = "6b42bb67-8b42-4ce1-a07f-2702eeb58451";
export const CHERMSIDE_SUBURB_ID = "159084d9-9ac3-4fb3-9a43-7fc502d06698";

export type DemoPartnerSeed = {
  key: string;
  email: string;
  displayName: string;
  service: {
    categorySlug: string;
    name: string;
    priceCents: number;
  };
  suburbId: string;
  windows: Array<{ day: number; start: string; end: string }>;
};

/** Fixed demo auth user ids (stable across re-seeds). */
export const DEMO_AUTH_IDS = {
  john: "a1111111-1111-4111-8111-111111111101",
  green: "a1111111-1111-4111-8111-111111111102",
  abc: "a1111111-1111-4111-8111-111111111103",
  sarah: "a1111111-1111-4111-8111-111111111104",
  auto: "a1111111-1111-4111-8111-111111111105",
} as const;

export const DEMO_PARTNERS: DemoPartnerSeed[] = [
  {
    key: "john",
    email: `john.lawn@${DEMO_PARTNER_EMAIL_DOMAIN}`,
    displayName: "John's Lawn Care",
    service: {
      categorySlug: "lawn_care",
      name: "Lawn Mowing",
      priceCents: 7000,
    },
    suburbId: ASPLEY_SUBURB_ID,
    windows: [1, 2, 3, 4, 5].map((day) => ({
      day,
      start: "09:00",
      end: "17:00",
    })),
  },
  {
    key: "green",
    email: `green.grass@${DEMO_PARTNER_EMAIL_DOMAIN}`,
    displayName: "Green Grass AU",
    service: {
      categorySlug: "lawn_care",
      name: "Lawn Mowing",
      priceCents: 5500,
    },
    suburbId: ASPLEY_SUBURB_ID,
    windows: [1, 2, 3, 4, 5].map((day) => ({
      day,
      start: "13:00",
      end: "18:00",
    })),
  },
  {
    key: "abc",
    email: `abc.cleaning@${DEMO_PARTNER_EMAIL_DOMAIN}`,
    displayName: "ABC Cleaning",
    service: {
      categorySlug: "cleaning",
      name: "House Cleaning",
      priceCents: 9000,
    },
    suburbId: ASPLEY_SUBURB_ID,
    windows: [2, 4].map((day) => ({
      day,
      start: "10:00",
      end: "16:00",
    })),
  },
  {
    key: "sarah",
    email: `sarah.beauty@${DEMO_PARTNER_EMAIL_DOMAIN}`,
    displayName: "Sarah Beauty",
    service: {
      categorySlug: "nail",
      name: "Nail Trim",
      priceCents: 2000,
    },
    suburbId: CHERMSIDE_SUBURB_ID,
    windows: [1, 2, 3, 4, 5, 6].map((day) => ({
      day,
      start: "10:00",
      end: "18:00",
    })),
  },
  {
    key: "auto",
    email: `brisbane.auto@${DEMO_PARTNER_EMAIL_DOMAIN}`,
    displayName: "Brisbane Mobile Auto",
    service: {
      categorySlug: "automotive",
      name: "Mobile Car Wash",
      priceCents: 6000,
    },
    suburbId: ASPLEY_SUBURB_ID,
    windows: [0, 6].map((day) => ({
      day,
      start: "09:00",
      end: "17:00",
    })),
  },
];

/** Next calendar date (YYYY-MM-DD) for a target weekday (0=Sun). */
export function nextDateForWeekday(day: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const delta = (day - d.getDay() + 7) % 7 || 7;
  // If today is already the target day, use today for "tomorrow" demos carefully.
  d.setDate(d.getDate() + (d.getDay() === day ? 0 : delta));
  return d.toISOString().slice(0, 10);
}

export function upcomingWeekday(day: number, from = new Date()): string {
  const d = new Date(from);
  d.setHours(12, 0, 0, 0);
  const delta = (day - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + delta);
  return d.toISOString().slice(0, 10);
}
