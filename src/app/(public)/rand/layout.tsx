import { SpaLandingFonts } from "@/features/spa-landing/components/spa-landing-fonts";

export default function EverRandLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <SpaLandingFonts>{children}</SpaLandingFonts>;
}
