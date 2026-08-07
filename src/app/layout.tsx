import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppToaster } from "@/components/common";
import { platformConfig } from "@/config/site";
import {
  PLATFORM_SITE_URL,
  platformSeo,
} from "@/features/platform-landing/lib/platform-seo";
import { isPrivatePreviewEnabled } from "@/features/private-preview";
import { TenantProvider } from "@/features/tenants";
import { getTenantOptional } from "@/features/tenants/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const previewRobots = {
  index: false,
  follow: false,
  googleBot: {
    index: false,
    follow: false,
  },
} as const;

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantOptional();
  const preview = isPrivatePreviewEnabled();

  if (!tenant) {
    return {
      title: {
        default: preview ? "AllBook — Private Preview" : platformSeo.title,
        template: platformSeo.titleTemplate,
      },
      description: preview
        ? "AllBook Private Preview — Launching Soon"
        : platformSeo.description,
      applicationName: platformConfig.name,
      metadataBase: new URL(PLATFORM_SITE_URL),
      robots: preview ? previewRobots : undefined,
      icons: {
        icon: [
          { url: "/favicon.png", sizes: "32x32", type: "image/png" },
          { url: "/icon.png", sizes: "32x32", type: "image/png" },
          { url: "/brand/allbook-mark.png", sizes: "512x512", type: "image/png" },
        ],
        shortcut: "/favicon.png",
        apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
      },
    };
  }

  return {
    title: {
      default: tenant.branding.displayName,
      template: `%s | ${tenant.branding.displayName}`,
    },
    description: tenant.branding.tagline,
    applicationName: platformConfig.name,
    robots: preview ? previewRobots : undefined,
    icons: {
      icon: [
        { url: "/favicon.png", sizes: "32x32", type: "image/png" },
        { url: "/icon.png", sizes: "32x32", type: "image/png" },
        { url: "/brand/allbook-mark.png", sizes: "512x512", type: "image/png" },
      ],
      shortcut: "/favicon.png",
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenantOptional();

  return (
    <html
      lang="en-AU"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TenantProvider tenant={tenant}>{children}</TenantProvider>
        <AppToaster />
      </body>
    </html>
  );
}
