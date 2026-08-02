import {
  Fraunces,
  Figtree,
  Syne,
  Source_Sans_3,
  Plus_Jakarta_Sans,
} from "next/font/google";

const inkDisplay = Fraunces({
  subsets: ["latin"],
  variable: "--font-landing-ink-display",
  display: "swap",
});

const inkBody = Figtree({
  subsets: ["latin"],
  variable: "--font-landing-ink-body",
  display: "swap",
});

const groveDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-landing-grove-display",
  display: "swap",
});

const groveBody = Source_Sans_3({
  subsets: ["latin"],
  variable: "--font-landing-grove-body",
  display: "swap",
});

const pulse = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-landing-pulse",
  display: "swap",
});

export default function LandingSamplesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className={`${inkDisplay.variable} ${inkBody.variable} ${groveDisplay.variable} ${groveBody.variable} ${pulse.variable}`}
    >
      {children}
    </div>
  );
}
