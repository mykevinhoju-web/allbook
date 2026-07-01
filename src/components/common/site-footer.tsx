import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-8 text-sm text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} {siteConfig.name}</p>
        <p>Wellness &amp; beauty booking platform</p>
      </div>
    </footer>
  );
}
