/** Public site copy for Everwell Massage — aligned with Time Massage Day Spa (Mary St). */

export const EVER_CONTACT = {
  addressLine: "120 Mary Street",
  suburb: "Brisbane City QLD 4000",
  phoneDisplay: "0468 887 626",
  phoneTel: "+61468887626",
  email: "hello@everwellmassage.com.au",
  mapsQuery: "120+Mary+Street,+Brisbane+City+QLD+4000",
  mapsEmbed:
    "https://maps.google.com/maps?q=120+Mary+Street,+Brisbane+City+QLD+4000&t=&z=15&ie=UTF8&iwloc=&output=embed",
  hours: [
    { days: "Monday – Friday", hours: "9:00 AM – Late" },
    { days: "Saturday – Sunday", hours: "9:00 AM – Late" },
  ],
} as const;

export const EVER_NAV = [
  { href: "#home", label: "Home" },
  { href: "#services", label: "Services" },
  { href: "#prices", label: "Prices" },
  { href: "#about", label: "About" },
  { href: "#gallery", label: "Gallery" },
  { href: "#reviews", label: "Reviews" },
  { href: "#contact", label: "Contact" },
] as const;

export const EVER_HERO = {
  eyebrow: "Everwell Massage · Brisbane CBD",
  title: "Your Escape to Total Relaxation",
  description:
    "Your health, peace, and comfort are our highest priority. Whether you need deep relief, glowing skin, or just a quiet escape — we’re here to make your time golden.",
} as const;

export const EVER_ABOUT = {
  eyebrow: "About us",
  title: "Care that helps you slow down",
  paragraphs: [
    "Everwell Massage is your sanctuary of calm in the middle of life’s busyness. We create personalised experiences that go beyond a simple massage, blending therapeutic techniques with restorative spa care to support body, mind, and spirit.",
    "Our mission is to give you more than relaxation — space to pause, breathe, and rediscover your inner balance. With every visit, our team helps you let go of stress, restore your energy, and leave with a renewed sense of well-being.",
  ],
} as const;

/** Services matched to Time Massage Day Spa offerings. */
export const EVER_SERVICES = [
  {
    name: "Deep Tissue Massage",
    description:
      "Firm, focused work on deeper muscle layers to ease stubborn tightness, knots, and chronic tension.",
    image:
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Relaxing Massage",
    description:
      "Gentle, flowing techniques to quiet the mind, melt everyday stress, and leave you deeply restored.",
    image:
      "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Traditional Chinese Massage",
    description:
      "Time-honoured techniques to encourage circulation, balance energy, and support whole-body wellness.",
    image:
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Thai Massage",
    description:
      "Traditional stretches and rhythmic pressure to release tension and restore mobility.",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Hot Stone Massage",
    description:
      "Warm stones and soothing strokes melt deep tension and promote lasting calm throughout the body.",
    image:
      "https://images.unsplash.com/photo-1583416750470-965b2707b355?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Body Scrub",
    description:
      "Exfoliating spa care that refreshes the skin, boosts circulation, and leaves you soft and glowing.",
    image:
      "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Waxing",
    description:
      "Clean, careful waxing services for smooth results in a calm and private treatment setting.",
    image:
      "https://images.unsplash.com/photo-1522337660859-02fbefca4702?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Cupping",
    description:
      "Therapeutic cupping to ease muscle tightness, support recovery, and encourage healthy circulation.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Aromatherapy",
    description:
      "Essential oils paired with soothing massage to calm the senses and deepen your relaxation.",
    image:
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?auto=format&fit=crop&w=900&q=80",
  },
] as const;

/** Transparent pricing matched to Time Massage Day Spa popular services. */
export const EVER_PRICE_MENUS = [
  {
    name: "Full Body Massage",
    note: "Most popular",
    description: "Single-therapist treatments across our core massage styles.",
    tiers: [
      { duration: "20 min", price: "$50" },
      { duration: "30 min", price: "$60" },
      { duration: "45 min", price: "$80" },
      { duration: "60 min", price: "$90" },
      { duration: "90 min", price: "$140" },
    ],
  },
  {
    name: "4 Hands Massage",
    note: "Premium duo",
    description: "Two therapists working together for deeper, more immersive relief.",
    tiers: [
      { duration: "20 min", price: "$90" },
      { duration: "30 min", price: "$110" },
      { duration: "45 min", price: "$160" },
      { duration: "60 min", price: "$180" },
    ],
  },
] as const;

export const EVER_WHY = [
  {
    title: "Personalised Treatments",
    copy: "Every massage is tailored to your body’s unique needs — whether you want to ease tension, restore balance, or simply relax.",
  },
  {
    title: "Skilled Therapists",
    copy: "Our experienced team blends modern techniques with ancient traditions to deliver the perfect healing touch.",
  },
  {
    title: "Peaceful Environment",
    copy: "Step into a calming space designed to soothe your senses with soft lighting and a tranquil atmosphere.",
  },
  {
    title: "Holistic Wellness",
    copy: "From deep tissue and Thai massage to aromatherapy, cupping, and body scrubs — care for body, mind, and spirit.",
  },
] as const;

export const EVER_REVIEWS = [
  {
    name: "Sarah M.",
    text: "The most restorative massage I’ve had in Brisbane. Calm space, skilled hands, and I left feeling completely reset.",
  },
  {
    name: "James T.",
    text: "Professional from the moment I booked. Deep tissue work that actually helped my shoulder — highly recommend.",
  },
  {
    name: "Emily R.",
    text: "Beautiful clinic and thoughtful therapists. Easy booking and a genuinely premium wellness experience.",
  },
] as const;

export const EVER_GALLERY = [
  {
    src: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80",
    alt: "Spa oils and calm wellness atmosphere",
  },
  {
    src: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=1200&q=80",
    alt: "Massage therapist preparing a treatment",
  },
  {
    src: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?auto=format&fit=crop&w=1200&q=80",
    alt: "Premium spa interior detail",
  },
  {
    src: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80",
    alt: "Restorative spa treatment experience",
  },
] as const;

export const EVER_ABOUT_IMAGE =
  "https://images.unsplash.com/photo-1552693673-1bf958298935?auto=format&fit=crop&w=1400&q=80";

export const EVER_GIFT_IMAGE =
  "https://images.unsplash.com/photo-1591343395082-e120087004b4?auto=format&fit=crop&w=1400&q=80";
