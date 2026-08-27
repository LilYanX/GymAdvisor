import type { ReactNode } from "react";
import { requireCoach } from "@/lib/auth";
import { Sidebar } from "@/components/coach/Sidebar";

export default async function CoachLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireCoach();

  return (
    <div className="flex h-screen overflow-hidden bg-ga-bg">
      <Sidebar />
      <div className="ml-60 flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
        {children}
      </div>
    </div>
  );
}
