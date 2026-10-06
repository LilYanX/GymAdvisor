"use client";

import type { TonnageSession } from "@/lib/athlete-followup-types";
import { formatDayMonth } from "@/lib/dates";

type Point = {
  id: string;
  date: string;
  cumulativeKg: number;
};

function loadTicks(min: number, max: number): number[] {
  if (max <= min) return [min];
  if (Math.abs(max - min) < 1) return [min, max];
  const mid = Math.round((min + max) / 2);
  if (Math.abs(mid - min) < 1 || Math.abs(mid - max) < 1) return [min, max];
  return [min, mid, max];
}

function buildCumulativePoints(sessions: TonnageSession[]): Point[] {
  const ordered = [...sessions]
    .filter((session) => session.date && session.tonnageKg > 0)
    .sort((a, b) => (a.date ?? "").localeCompare(b.date ?? ""));

  let running = 0;
  return ordered.map((session) => {
    running += session.tonnageKg;
    return {
      id: session.sessionId,
      date: session.date as string,
      cumulativeKg: running,
    };
  });
}

export function CumulativeLoadChart({
  sessions,
}: {
  sessions: TonnageSession[];
}) {
  const pointsData = buildCumulativePoints(sessions);

  if (pointsData.length < 2) {
    return (
      <p className="text-sm text-ga-muted">
        Au moins 2 séances avec charge sont nécessaires pour la courbe.
      </p>
    );
  }

  const values = pointsData.map((point) => point.cumulativeKg);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = Math.max(5, (max - min) * 0.12 || 10);
  const yMin = Math.max(0, min - pad);
  const yMax = max + pad;
  const range = yMax - yMin || 1;

  const width = 720;
  const height = 280;
  const left = 64;
  const right = 24;
  const top = 20;
  const bottom = 40;
  const plotW = width - left - right;
  const plotH = height - top - bottom;
  const fontAxis = 15;

  function yFor(value: number): number {
    return top + plotH - ((value - yMin) / range) * plotH;
  }

  const points = pointsData.map((point, index) => {
    const x =
      left +
      (pointsData.length === 1
        ? plotW / 2
        : (index / (pointsData.length - 1)) * plotW);
    return { x, y: yFor(point.cumulativeKg), point };
  });

  const polyline = points.map((p) => `${p.x},${p.y}`).join(" ");
  const first = points[0];
  const last = points[points.length - 1];
  const area = `${first.x},${top + plotH} ${polyline} ${last.x},${top + plotH}`;
  const ticks = loadTicks(Math.round(yMin), Math.round(yMax));

  return (
    <div className="w-full min-w-0">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full"
        role="img"
        aria-label="Charges cumulées"
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
        <polygon points={area} fill="var(--ga-blue)" opacity="0.12" />
        <polyline
          points={polyline}
          fill="none"
          stroke="var(--ga-blue)"
          strokeWidth={3}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point) => (
          <circle
            key={point.point.id}
            cx={point.x}
            cy={point.y}
            r={5.5}
            fill="var(--ga-blue)"
          />
        ))}
        <text
          x={left}
          y={height - 10}
          fill="var(--ga-muted)"
          fontSize={fontAxis}
        >
          {formatDayMonth(pointsData[0].date)}
        </text>
        <text
          x={width - right}
          y={height - 10}
          textAnchor="end"
          fill="var(--ga-muted)"
          fontSize={fontAxis}
        >
          {formatDayMonth(pointsData[pointsData.length - 1].date)}
        </text>
      </svg>
      <p className="mt-2 text-center text-sm text-ga-muted">
        Cumul :{" "}
        <span className="font-semibold text-ga-fg">
          {last.point.cumulativeKg.toLocaleString("fr-FR")} kg
        </span>
      </p>
    </div>
  );
}
