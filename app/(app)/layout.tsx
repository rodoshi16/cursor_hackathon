import { AppNav } from "@/components/AppNav";

export default function AppShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-zinc-50">
      <AppNav />
      {children}
    </div>
  );
}
