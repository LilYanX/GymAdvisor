import type { ReactNode } from "react";
import { requireCoach } from "@/lib/auth";
import { CoachChrome } from "@/components/coach/CoachChrome";

export default async function CoachLayout({
  children,
}: {
  children: ReactNode;
}) {
  await requireCoach();

  return <CoachChrome>{children}</CoachChrome>;
}
