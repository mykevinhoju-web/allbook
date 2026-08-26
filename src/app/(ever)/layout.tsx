import { EverLandingFonts } from "@/features/ever";

/** Ever site shell — no AllBook platform chrome. */
export default function EverLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EverLandingFonts>{children}</EverLandingFonts>;
}
