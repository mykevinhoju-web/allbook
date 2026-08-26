import {
  Cormorant_Garamond,
  Outfit,
  Fraunces,
  Manrope,
  Libre_Baskerville,
  DM_Sans,
} from "next/font/google";

const nocturneDisplay = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-spa-nocturne-display",
  display: "swap",
});

const nocturneBody = Outfit({
  subsets: ["latin"],
  variable: "--font-spa-nocturne-body",
  display: "swap",
});

const stillDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-spa-still-display",
  display: "swap",
});

const stillBody = Manrope({
  subsets: ["latin"],
  variable: "--font-spa-still-body",
  display: "swap",
});

const verdantDisplay = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-spa-verdant-display",
  display: "swap",
});

const verdantBody = DM_Sans({
  subsets: ["latin"],
  variable: "--font-spa-verdant-body",
  display: "swap",
});

export default function SpaSamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${nocturneDisplay.variable} ${nocturneBody.variable} ${stillDisplay.variable} ${stillBody.variable} ${verdantDisplay.variable} ${verdantBody.variable}`}
    >
      {children}
    </div>
  );
}
