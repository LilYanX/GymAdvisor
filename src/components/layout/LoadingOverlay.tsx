import { HeartRateWave } from "@/components/layout/HeartRateWave";

export function LoadingOverlay({ label = "Chargement" }: { label?: string }) {
  return (
    <div
      aria-live="polite"
      aria-busy="true"
      className="fixed inset-0 z-[200] flex items-center justify-center bg-ga-bg/96 backdrop-blur-sm"
    >
      <div className="flex w-full max-w-xl flex-col items-center px-8">
        <HeartRateWave />
        <p className="mt-8 text-lg font-medium tracking-wide text-ga-fg">{label}</p>
      </div>
    </div>
  );
}
