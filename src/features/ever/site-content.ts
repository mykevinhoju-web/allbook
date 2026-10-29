/** Public site copy for Everwell Wellness Massage (Brendale). */

export const EVER_CONTACT = {
  businessName: "Everwell Wellness Massage",
  addressLine: "Shop 8/640 S Pine Rd",
  suburb: "Brendale QLD 4500",
  phoneDisplay: "0468 365 859",
  phoneTel: "+61468365859",
  email: "Everwellwellness3@gmail.com",
  mapsQuery: "Shop+8/640+South+Pine+Road,+Brendale+QLD+4500",
  mapsEmbed:
    "https://maps.google.com/maps?q=Shop+8/640+South+Pine+Road,+Brendale+QLD+4500&t=&z=15&ie=UTF8&iwloc=&output=embed",
  hours: [
    { days: "Sunday – Wednesday", hours: "9:00 AM – 6:00 PM" },
    { days: "Thursday – Saturday", hours: "9:00 AM – 9:00 PM" },
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
  eyebrow: "Everwell Wellness Massage · Brendale",
  title: "Your Escape to Total Relaxation",
  description:
    "Your health, peace, and comfort are our highest priority. Whether you need deep relief, glowing skin, or just a quiet escape — we’re here to make your time golden.",
} as const;

export const EVER_ABOUT = {
  eyebrow: "About us",
  title: "Care that helps you slow down",
  paragraphs: [
    "Everwell Wellness Massage is your sanctuary of calm in the middle of life’s busyness. We create personalised experiences that go beyond a simple massage, blending therapeutic techniques with restorative spa care to support body, mind, and spirit.",
    "Our mission is to give you more than relaxation — space to pause, breathe, and rediscover your inner balance. With every visit, our team helps you let go of stress, restore your energy, and leave with a renewed sense of well-being.",
  ],
} as const;

/** Services matched to Time Massage Day Spa offerings. */
export const EVER_SERVICES = [
  {
    name: "Deep Tissue Massage",
    description:
      "Firm, focused work on deeper muscle layers to ease stubborn tightness, knots, and chronic tension.",
    image: "/ever/services/deep-tissue.jpg",
  },
  {
    name: "Relaxing Massage",
    description:
      "Gentle, flowing techniques to quiet the mind, melt everyday stress, and leave you deeply restored.",
    image: "/ever/services/relaxing.jpg",
  },
  {
    name: "Traditional Chinese Massage",
    description:
      "Time-honoured techniques to encourage circulation, balance energy, and support whole-body wellness.",
    image: "/ever/services/chinese.jpg",
  },
  {
    name: "Thai Massage",
    description:
      "Traditional stretches and rhythmic pressure to release tension and restore mobility.",
    image: "/ever/services/thai.jpg",
  },
  {
    name: "Hot Stone Massage",
    description:
      "Warm stones and soothing strokes melt deep tension and promote lasting calm throughout the body.",
    image: "/ever/services/hot-stone.jpg",
  },
  {
    name: "Body Scrub",
    description:
      "Exfoliating spa care that refreshes the skin, boosts circulation, and leaves you soft and glowing.",
    image: "/ever/services/body-scrub.jpg",
  },
  {
    name: "Waxing",
    description:
      "Clean, careful waxing services for smooth results in a calm and private treatment setting.",
    image: "/ever/services/waxing.jpg",
  },
  {
    name: "Cupping",
    description:
      "Therapeutic cupping to ease muscle tightness, support recovery, and encourage healthy circulation.",
    image: "/ever/services/cupping-therapy.jpg",
  },
  {
    name: "Aromatherapy",
    description:
      "Essential oils paired with soothing massage to calm the senses and deepen your relaxation.",
    image: "/ever/services/aromatherapy-v2.jpg",
  },
] as const;

/** Current Everwell Massage & Wellness menu pricing. */
export const EVER_PRICE_MENUS = [
  {
    name: "Relaxation Massage",
    note: "No health fund rebate · Chair massage",
    description: "Gentle relaxation focused on neck, shoulders, back, and whole body care.",
    tiers: [
      { name: "Neck & Shoulders", duration: "20 / 30 mins", price: "$40 / $50" },
      { name: "Neck, Shoulders & Head", duration: "30 mins", price: "$50" },
      { name: "Neck, Shoulders, Arms & Hands", duration: "45 mins", price: "$75" },
      { name: "Neck, Shoulders & Back", duration: "45 mins", price: "$80" },
      { name: "Whole Body", duration: "60 / 75 mins", price: "$95 / $120" },
      { name: "Whole Body", duration: "90 / 120 mins", price: "$145 / $185" },
    ],
  },
  {
    name: "Deep Tissue & Remedial",
    note: "Therapeutic care",
    description: "Firm remedial work, cupping, dry needling, and sports-focused treatments.",
    tiers: [
      { name: "Deep Tissue / Remedial Massage", duration: "30 / 45 mins", price: "$60 / $85" },
      { name: "Deep Tissue / Remedial Massage", duration: "60 / 75 mins", price: "$105 / $135" },
      { name: "Deep Tissue / Remedial Massage", duration: "90 / 120 mins", price: "$165 / $200" },
      { name: "Remedial Massage + Cupping", duration: "60 mins", price: "$115" },
      { name: "Remedial Massage + Moving Cupping", duration: "75 mins", price: "$135" },
      { name: "Remedial Massage + Dry Needling", duration: "60 / 90 mins", price: "$120 / $180" },
      { name: "Remedial Massage + Chinese Herbal Oil", duration: "60 mins", price: "$125" },
      { name: "Remedial Thai & Sports Massage", duration: "60 / 90 mins", price: "$130 / $170" },
    ],
  },
  {
    name: "Additional Signature Services",
    note: "Extras & specialty",
    description: "Lymphatic care, pregnancy massage, cupping, and massage add-ons.",
    tiers: [
      { name: "Lymphatic Drainage Massage", duration: "60 / 90 mins", price: "$130 / $180" },
      { name: "Abdominal Massage", duration: "45 mins", price: "$85" },
      { name: "Pregnancy Massage", duration: "60 / 90 mins", price: "$120 / $160" },
      { name: "Cupping", duration: "15 mins", price: "$35" },
      { name: "Herbal Hot Compress", duration: "15 mins", price: "$30" },
      { name: "Single Dry Needling Session", duration: "30 mins", price: "$70" },
      { name: "Hot Stone Massage – Add-on", duration: "Add-on", price: "+$15" },
      { name: "Waxing (Add on to Massage)", duration: "Add-on", price: "+$30" },
      { name: "Body Scrub (Add on to Massage)", duration: "15 mins", price: "$50" },
    ],
  },
  {
    name: "Reflexology & Packages",
    note: "No health fund rebate · Includes 5-min foot bath",
    description: "Reflexology and facial relaxation packages for deeper restoration.",
    tiers: [
      { name: "Reflexology", duration: "45 / 60 mins", price: "$80 / $95" },
      { name: "Reflexology + Neck & Shoulders", duration: "60 mins", price: "$95" },
      { name: "Reflexology + Neck, Shoulders, Head & Arms", duration: "75 mins", price: "$120" },
      { name: "Reflexology + Whole Body Massage", duration: "90 / 120 mins", price: "$145 / $190" },
      { name: "Facial Relaxation Massage", duration: "30 / 45 mins", price: "$90 / $110" },
      {
        name: "Facial Relaxation Massage + Neck & Shoulders",
        duration: "60 / 90 mins",
        price: "$130 / $170",
      },
      {
        name: "Facial Relaxation Massage + Luxury Whole Body Massage",
        duration: "120 mins",
        price: "$200",
      },
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
    text: "The most restorative massage I’ve had in Brendale. Calm space, skilled hands, and I left feeling completely reset.",
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
