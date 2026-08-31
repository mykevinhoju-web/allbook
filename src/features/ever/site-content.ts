/** Public site copy for Everwell Massage — easy to update without touching layout. */

export const EVER_CONTACT = {
  addressLine: "1/120 Mary Street",
  suburb: "Brisbane QLD 4000",
  phoneDisplay: "(07) 3000 0000",
  phoneTel: "+61730000000",
  email: "hello@everwellmassage.com.au",
  mapsQuery: "120+Mary+Street,+Brisbane+QLD+4000",
  mapsEmbed:
    "https://maps.google.com/maps?q=120+Mary+Street,+Brisbane+QLD+4000&t=&z=15&ie=UTF8&iwloc=&output=embed",
  hours: [
    { days: "Monday – Friday", hours: "9:00 AM – 8:00 PM" },
    { days: "Saturday – Sunday", hours: "9:00 AM – 7:00 PM" },
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

export const EVER_SERVICES = [
  {
    name: "Thai Massage",
    description:
      "Traditional stretches and rhythmic pressure to release tension and restore mobility.",
    image:
      "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Remedial Massage",
    description:
      "Targeted therapy for injury recovery, chronic pain, and postural imbalance.",
    image:
      "https://images.unsplash.com/photo-1519824145371-296947a0b381?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Deep Tissue Massage",
    description:
      "Firm, focused work on deeper muscle layers to ease stubborn tightness.",
    image:
      "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Relaxation Massage",
    description:
      "Gentle, flowing techniques to quiet the mind and melt everyday stress.",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Sports Massage",
    description:
      "Performance-focused care for athletes — warm-up, recovery, and injury support.",
    image:
      "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=900&q=80",
  },
  {
    name: "Pregnancy Massage",
    description:
      "Safe, supportive treatments tailored for expecting mothers at every stage.",
    image:
      "https://images.unsplash.com/photo-1515377905703-c4788e51af15?auto=format&fit=crop&w=900&q=80",
  },
] as const;

export const EVER_PRICES = [
  { duration: "60 min", price: "$90", note: "Most popular" },
  { duration: "90 min", price: "$130", note: "Deep unwind" },
  { duration: "120 min", price: "$170", note: "Full reset" },
] as const;

export const EVER_WHY = [
  {
    title: "Experienced Therapists",
    copy: "Skilled practitioners who listen first, then tailor every session to your body.",
  },
  {
    title: "Premium Environment",
    copy: "Quiet rooms, soft lighting, and a calm Brisbane space built for rest.",
  },
  {
    title: "Personalised Treatments",
    copy: "No one-size-fits-all — pressure, focus areas, and pace adjusted to you.",
  },
  {
    title: "Easy Online Booking",
    copy: "Reserve your preferred time online in minutes — simple and secure.",
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
    src: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80",
    alt: "Calm treatment room with soft lighting",
  },
  {
    src: "https://images.unsplash.com/photo-1600334129128-685c5582fd35?auto=format&fit=crop&w=1200&q=80",
    alt: "Massage therapist during a treatment",
  },
  {
    src: "https://images.unsplash.com/photo-1596178065887-1198b6148b2b?auto=format&fit=crop&w=1200&q=80",
    alt: "Spa interior and wellness space",
  },
  {
    src: "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80",
    alt: "Massage oils and wellness atmosphere",
  },
] as const;
