import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AppToaster } from "@/components/common";
import { platformConfig } from "@/config/site";
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

export async function generateMetadata(): Promise<Metadata> {
  const tenant = await getTenantOptional();

  if (!tenant) {
    return {
      title: {
        default: platformConfig.name,
        template: `%s | ${platformConfig.name}`,
      },
      description: platformConfig.description,
      applicationName: platformConfig.name,
    };
  }

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
  const tenant = await getTenantOptional();

  return (
    <html
      lang={tenant?.settings.locale ?? "en-AU"}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <TenantProvider tenant={tenant}>{children}</TenantProvider>
        <AppToaster />
      </body>
    </html>
  );
}
