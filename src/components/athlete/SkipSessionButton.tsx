"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { skipSession } from "@/lib/actions/session";

type Props = {
  sessionId: string;
  className?: string;
};

export function SkipSessionButton({ sessionId, className }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSkip() {
    if (pending) return;
    const ok = window.confirm(
      "Marquer cette séance comme non faite ? Elle sortira de « À faire ».",
    );
    if (!ok) return;
    setError(null);
    startTransition(async () => {
      const result = await skipSession(sessionId);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <div className={className}>
      <button
        type="button"
        onClick={handleSkip}
        disabled={pending}
        className="w-full rounded-xl border border-ga-border bg-transparent py-3 text-sm font-medium text-ga-muted hover:border-ga-fg/40 hover:text-ga-fg disabled:opacity-60"
      >
        {pending ? "Enregistrement…" : "Séance non faite"}
      </button>
      {error ? <p className="mt-1.5 text-xs text-red-400">{error}</p> : null}
    </div>
  );
}
