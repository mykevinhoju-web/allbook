import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppToaster } from "@/components/common";
import { platformConfig } from "@/config/site";
import { TenantProvider } from "@/features/tenants";
import { getTenant } from "@/features/tenants/server";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenant();

  return {
    title: {
      default: tenant.branding.displayName,
      template: `%s | ${tenant.branding.displayName}`,
    },
    description: tenant.branding.tagline,
    applicationName: platformConfig.name,
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const tenant = await getTenant();

  return (
    <html
      lang={tenant.settings.locale}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TenantProvider tenant={tenant}>{children}</TenantProvider>
        <AppToaster />
      </body>
    </html>
  );
}
