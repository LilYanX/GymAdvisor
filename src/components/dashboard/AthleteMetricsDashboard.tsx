"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import type {
  AthleteDashboardBundle,
  AthleteDashboardMetrics,
  DashboardPeriod,
} from "@/lib/dashboard-metrics";
import { formatDayMonth } from "@/lib/dates";
import {
  AcwrGauge,
  FeelingRadar,
  UaRpeChart,
} from "@/components/dashboard/ChartPrimitives";

const FEELING_KEYS = [
  { key: "energy" as const, label: "Énergie" },
  { key: "sleep" as const, label: "Sommeil" },
  { key: "pain" as const, label: "Douleurs" },
  { key: "motivation" as const, label: "Motivation" },
];

const PERIOD_TABS: { id: DashboardPeriod; label: string; title: string }[] = [
  { id: "day", label: "Quotidien", title: "quotidien" },
  { id: "week", label: "Hebdo", title: "hebdo" },
  { id: "month", label: "Mensuel", title: "mensuel" },
];

function formatScore(value: number | null): string {
  return value == null ? "—" : value.toFixed(1);
}

function BarRow({
  label,
  value,
  max,
  suffix = "",
  color = "bg-ga-lime",
}: {
  label: string;
  value: number;
  max: number;
  suffix?: string;
  color?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-baseline justify-between gap-2 text-xs">
        <span className="truncate text-ga-muted">{label}</span>
        <span className="shrink-0 font-medium text-ga-fg">
          {value.toLocaleString("fr-FR")}
          {suffix}
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-ga-elevated">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function FeelingPanel({
  metrics,
  compact,
}: {
  metrics: AthleteDashboardMetrics;
  compact?: boolean;
}) {
  const axes = FEELING_KEYS.map((item) => ({
    key: item.key,
    label: item.label,
    value: metrics.feeling[item.key],
  }));

  return (
    <div className={`flex h-full flex-col ${compact ? "gap-3" : "gap-4"}`}>
      <FeelingRadar axes={axes} size={compact ? 180 : 220} />
      <div className="mt-auto space-y-2">
        <div className="grid grid-cols-2 gap-2">
          {FEELING_KEYS.map((item) => (
            <div
              key={item.key}
              className="rounded-lg bg-ga-elevated px-2.5 py-2 text-center"
            >
              <p className="text-[10px] uppercase tracking-wide text-ga-muted">
                {item.label}
              </p>
              <p className="mt-0.5 text-sm font-semibold">
                {formatScore(metrics.feeling[item.key])}
                <span className="text-[11px] font-normal text-ga-muted">/5</span>
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ZonesPanel({ metrics }: { metrics: AthleteDashboardMetrics }) {
  const max = Math.max(...metrics.zones.map((z) => z.tonnageKg), 1);
  const topZones = metrics.zones.slice(0, 4);

  if (metrics.zones.length === 0) {
    return (
      <p className="text-sm text-ga-muted">Aucune charge relevée sur la période.</p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="space-y-2.5">
        {metrics.zones.map((zone) => (
          <BarRow
            key={zone.zone}
            label={zone.label}
            value={zone.tonnageKg}
            max={max}
            suffix=" kg"
          />
        ))}
      </div>
      <div className="mt-auto grid grid-cols-2 gap-2">
        {topZones.map((zone) => (
          <div
            key={`card-${zone.zone}`}
            className="rounded-lg bg-ga-elevated px-2.5 py-2 text-center"
          >
            <p className="truncate text-[10px] uppercase tracking-wide text-ga-muted">
              {zone.label}
            </p>
            <p className="mt-0.5 text-sm font-semibold">
              {zone.percent.toLocaleString("fr-FR")}
              <span className="text-[11px] font-normal text-ga-muted">%</span>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function UaPanel({ metrics }: { metrics: AthleteDashboardMetrics }) {
  if (
    metrics.uaTotal === 0 &&
    metrics.uaFinalTotal === 0 &&
    metrics.uaSeries.every((p) => p.ua === 0 && p.uaFinal === 0)
  ) {
    return (
      <p className="text-sm text-ga-muted">
        Aucune UA calculable (durée × RPE / 10).
      </p>
    );
  }

  return (
    <div className="flex h-full flex-col gap-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
          <p>
            <span className="text-2xl font-semibold text-ga-fg">
              {metrics.uaTotal.toLocaleString("fr-FR")}
            </span>
            <span className="ml-1 text-ga-muted">UA moy.</span>
          </p>
          <p>
            <span className="text-2xl font-semibold text-ga-fg">
              {metrics.uaFinalTotal.toLocaleString("fr-FR")}
            </span>
            <span className="ml-1 text-ga-muted">UA final</span>
          </p>
        </div>
        <div className="flex items-center gap-3 text-[10px] text-ga-muted">
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-ga-blue" />
            RPE moy.
          </span>
          <span className="inline-flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-sm bg-ga-lime" />
            RPE final
          </span>
        </div>
      </div>
      {metrics.uaSeries.length === 0 ? (
        <p className="text-sm text-ga-muted">Aucune séance sur la période.</p>
      ) : (
        <UaRpeChart points={metrics.uaSeries} />
      )}
      <div className="mt-auto">
        <AcwrGauge
          ratio={metrics.acwr.ratio}
          acute={metrics.acwr.acute}
          chronic={metrics.acwr.chronic}
        />
      </div>
    </div>
  );
}

export function AthleteMetricsDashboard({
  bundle,
  showExport = false,
  exportHrefBase,
  variant = "coach",
}: {
  bundle: AthleteDashboardBundle;
  showExport?: boolean;
  exportHrefBase?: string;
  variant?: "coach" | "athlete";
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [period, setPeriod] = useState<DashboardPeriod>("week");
  const metrics =
    period === "day"
      ? bundle.day
      : period === "week"
        ? bundle.week
        : bundle.month;
  const rangeLabel = useMemo(
    () =>
      metrics.from === metrics.to
        ? formatDayMonth(metrics.from)
        : `${formatDayMonth(metrics.from)} – ${formatDayMonth(metrics.to)}`,
    [metrics.from, metrics.to],
  );
  const compact = variant === "athlete";
  const periodTitle =
    PERIOD_TABS.find((tab) => tab.id === period)?.title ?? "hebdo";

  function setReferenceDate(next: string) {
    router.push(`${pathname}?date=${encodeURIComponent(next)}`);
  }

  return (
    <section
      className={`border border-ga-border bg-ga-card ${
        compact ? "rounded-2xl p-4" : "rounded-xl p-4 md:p-5"
      }`}
    >
      <div
        className={`flex gap-2 ${
          compact
            ? "flex-col"
            : "flex-wrap items-center justify-between"
        }`}
      >
        <div className="flex min-w-0 items-center justify-between gap-2">
          <div className="min-w-0">
            <h2 className={`font-semibold ${compact ? "text-sm" : "text-base"}`}>
              Suivi {periodTitle}
            </h2>
            <p className="text-xs text-ga-muted">{rangeLabel}</p>
          </div>
          {compact ? (
            <input
              type="date"
              value={bundle.referenceDate}
              onChange={(event) => {
                if (event.target.value) setReferenceDate(event.target.value);
              }}
              className="rounded-lg border border-ga-border bg-ga-elevated px-2 py-1 text-xs text-ga-fg outline-none focus:border-ga-lime"
              aria-label="Date de référence"
            />
          ) : null}
        </div>
        <div
          className={`flex items-center gap-2 ${compact ? "w-full" : "flex-wrap"}`}
        >
          {!compact ? (
            <input
              type="date"
              value={bundle.referenceDate}
              onChange={(event) => {
                if (event.target.value) setReferenceDate(event.target.value);
              }}
              className="rounded-lg border border-ga-border bg-ga-elevated px-2 py-1 text-xs text-ga-fg outline-none focus:border-ga-lime"
              aria-label="Date de référence"
            />
          ) : null}
          <div
            className={`flex rounded-lg border border-ga-border bg-ga-elevated p-0.5 ${
              compact ? "w-full" : ""
            }`}
          >
            {PERIOD_TABS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setPeriod(item.id)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  compact ? "flex-1 text-center" : ""
                } ${
                  period === item.id
                    ? "bg-ga-lime text-black"
                    : "text-ga-muted hover:text-ga-fg"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          {showExport && exportHrefBase ? (
            <a
              href={`${exportHrefBase}?period=${period}&date=${bundle.referenceDate}`}
              title="Exporter Excel"
              aria-label="Exporter Excel"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-ga-border text-ga-muted transition hover:border-ga-lime/40 hover:text-ga-fg"
            >
              <svg
                viewBox="0 0 24 24"
                className="h-4 w-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <path d="M12 3v12" />
                <path d="m7 11 5 5 5-5" />
                <path d="M5 19h14" />
              </svg>
            </a>
          ) : null}
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-lg bg-ga-elevated/70 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-ga-muted">
            Séances
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {metrics.kpis.sessionsCompleted}
            <span className="text-sm font-normal text-ga-muted">
              /{metrics.kpis.sessionsPlanned}
            </span>
          </p>
        </div>
        <div className="rounded-lg bg-ga-elevated/70 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-ga-muted">
            Volume
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {metrics.kpis.volumeKg.toLocaleString("fr-FR")}
            <span className="text-xs font-normal text-ga-muted"> kg</span>
          </p>
        </div>
        <div className="rounded-lg bg-ga-elevated/70 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-ga-muted">
            RPE moyen
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatScore(metrics.kpis.avgRpe)}
            {metrics.kpis.avgRpe != null ? (
              <span className="text-xs font-normal text-ga-muted">/10</span>
            ) : null}
          </p>
        </div>
        <div className="rounded-lg bg-ga-elevated/70 px-3 py-2.5">
          <p className="text-[10px] uppercase tracking-wide text-ga-muted">
            Score ressenti
          </p>
          <p className="mt-0.5 text-lg font-semibold tabular-nums">
            {formatScore(metrics.kpis.feelingScore)}
            {metrics.kpis.feelingScore != null ? (
              <span className="text-xs font-normal text-ga-muted">/5</span>
            ) : null}
          </p>
        </div>
      </div>

      <div
        className={
          compact
            ? "mt-4 flex flex-col gap-4"
            : "mt-4 grid items-stretch gap-4 lg:grid-cols-3"
        }
      >
        <div className="flex flex-col rounded-xl border border-ga-border/80 bg-ga-elevated/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ga-muted">
            Ressenti pré-séance
          </h3>
          <div className="mt-2 flex min-h-0 flex-1 flex-col">
            <FeelingPanel metrics={metrics} compact={compact} />
          </div>
        </div>
        <div className="flex flex-col rounded-xl border border-ga-border/80 bg-ga-elevated/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ga-muted">
            Charges par zone
          </h3>
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            <ZonesPanel metrics={metrics} />
          </div>
        </div>
        <div className="flex flex-col rounded-xl border border-ga-border/80 bg-ga-elevated/40 p-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-ga-muted">
            Charges en UA
          </h3>
          <p className="mt-1 text-[11px] text-ga-muted">
            {period === "month" ? "Par semaine" : "Par séance"} · min × RPE / 10
            (moy. exercices vs final)
          </p>
          <div className="mt-3 flex min-h-0 flex-1 flex-col">
            <UaPanel metrics={metrics} />
          </div>
        </div>
      </div>
    </section>
  );
}
