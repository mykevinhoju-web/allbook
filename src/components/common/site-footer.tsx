import Link from "next/link";

import { platformConfig } from "@/config/site";
import { PRIVATE_PREVIEW_DOCS_HREF } from "@/features/private-preview/config";

type Props = {
  displayName?: string;
  tagline?: string;
  /** Platform admins only — Documentation link. */
  showDocumentation?: boolean;
};

export function SiteFooter({
  displayName,
  tagline,
  showDocumentation = false,
}: Props) {
  const name = displayName ?? platformConfig.name;
  const description = tagline ?? platformConfig.description;
  const isTenant = Boolean(displayName);

  return (
    <footer className={isTenant ? "border-t" : "border-t border-border/60"}>
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <p>
          &copy; {new Date().getFullYear()} {name}
        </p>
        <div className="flex flex-wrap items-center gap-4">
          <p>
            {isTenant
              ? `${description} · Powered by ${platformConfig.name}`
              : description}
          </p>
          {showDocumentation ? (
            <Link
              href={PRIVATE_PREVIEW_DOCS_HREF}
              className="font-medium text-foreground underline underline-offset-4"
            >
              Documentation
            </Link>
          ) : null}
        </div>
      </div>
    </footer>
  );
}
