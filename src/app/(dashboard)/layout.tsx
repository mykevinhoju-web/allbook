export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="mx-auto flex min-h-full max-w-6xl flex-col gap-8 px-4 py-10">
      {children}
    </div>
  );
}
