"use client";

import type { AthleteBodyLog } from "@/lib/supabase/models";
import { formatDayMonth } from "@/lib/dates";

/** Graduations Y : min + max (évite un tick milieu illisible sur mobile). */
function weightTicks(min: number, max: number, compact: boolean): number[] {
  if (max <= min) return [min];
  if (compact || Math.abs(max - min) < 0.15) return [min, max];
  const mid = Math.round(((min + max) / 2) * 10) / 10;
  if (Math.abs(mid - min) < 0.05 || Math.abs(mid - max) < 0.05) {
    return [min, max];
  }
  return [min, mid, max];
}

export function WeightChart({
  logs,
  compact = false,
}: {
  logs: AthleteBodyLog[];
  compact?: boolean;
}) {
  if (logs.length < 2) {
    return (
      <p className="text-sm text-ga-muted">
        Ajoute au moins 2 pesées pour afficher la courbe.
      </p>
    );
  }

  const weights = logs.map((log) => log.weight_kg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const pad = Math.max(0.4, (max - min) * 0.25 || 0.8);
  const yMin = min - pad;
  const yMax = max + pad;
  const range = yMax - yMin || 1;

  // ViewBox adapté : compact = proportion téléphone pour que les labels restent lisibles.
  const width = compact ? 360 : 720;
  const height = compact ? 200 : 280;
  const left = compact ? 44 : 56;
  const right = compact ? 14 : 24;
  const top = compact ? 16 : 20;
  const bottom = compact ? 32 : 40;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const fontAxis = compact ? 12 : 15;
  const strokeW = compact ? 2.5 : 3;
  const dotR = compact ? 4 : 5.5;

  function yFor(weight: number): number {
    return top + plotH - ((weight - yMin) / range) * plotH;
  }

  const points = logs.map((log, index) => {
    const x =
      left +
      (logs.length === 1 ? plotW / 2 : (index / (logs.length - 1)) * plotW);
    return { x, y: yFor(log.weight_kg), log };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${first.x},${top + plotH} ${polyline} ${last.x},${top + plotH}`;
  const ticks = weightTicks(min, max, compact);

  return (
    <div className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Courbe de poids"
      >
        {ticks.map((tick) => {
          const y = yFor(tick);
          return (
            <g key={tick}>
              <line
                x1={left}
                y1={y}
                x2={width - right}
                y2={y}
                stroke="var(--ga-border)"
                strokeWidth="1"
                opacity={0.55}
              />
              <text
                x={left - 8}
                y={y}
                textAnchor="end"
                dominantBaseline="middle"
                fill="var(--ga-muted)"
                fontSize={fontAxis}
              >
                {tick.toLocaleString("fr-FR")}
              </text>
            </g>
          );
        })}
        <polygon points={area} fill="var(--ga-lime)" opacity="0.15" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--ga-lime)"
          strokeWidth={strokeW}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point) => (
          <circle
            key={point.log.id}
            cx={point.x}
            cy={point.y}
            r={dotR}
            fill="var(--ga-lime)"
          />
        ))}
        <text
          x={left}
          y={height - 10}
          fill="var(--ga-muted)"
          fontSize={fontAxis}
        >
          {formatDayMonth(logs[0].recorded_on)}
        </text>
        <text
          x={width - right}
          y={height - 10}
          textAnchor="end"
          fill="var(--ga-muted)"
          fontSize={fontAxis}
        >
          {formatDayMonth(logs[logs.length - 1].recorded_on)}
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-ga-muted">
        Dernier :{" "}
        <span className="font-semibold text-ga-fg">
          {last.log.weight_kg.toLocaleString("fr-FR")} kg
        </span>
      </p>
    </div>
  );
}
