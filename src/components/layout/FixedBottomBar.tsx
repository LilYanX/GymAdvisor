import type { ReactNode } from "react";

type FixedBottomBarProps = {
  children: ReactNode;
  /** Décalage depuis le bas (ex. au-dessus de la nav sportif). */
  offsetClass?: string;
  /** Largeur max centrée (sportif) ou pleine largeur (coach). */
  variant?: "athlete" | "coach";
};

export function FixedBottomBar({
  children,
  offsetClass = "bottom-0",
  variant = "coach",
}: FixedBottomBarProps) {
  return (
    <div
      className={`fixed inset-x-0 z-30 border-t border-ga-border bg-ga-panel/95 backdrop-blur-sm ${offsetClass}`}
    >
      <div
        className={
          variant === "athlete"
            ? "mx-auto w-full max-w-md px-5 py-3"
            : "px-6 py-3"
        }
      >
        {children}
      </div>
    </div>
  );
}
