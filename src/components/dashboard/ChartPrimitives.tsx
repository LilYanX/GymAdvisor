"use client";

import { useId, useMemo } from "react";

type RadarAxis = {
  key: string;
  label: string;
  value: number | null;
};

export function FeelingRadar({
  axes,
  size = 220,
  max = 5,
}: {
  axes: RadarAxis[];
  size?: number;
  max?: number;
}) {
  const gradId = useId().replace(/:/g, "");
  const pad = 36;
  const total = size + pad * 2;
  const cx = total / 2;
  const cy = total / 2;
  const radius = size * 0.34;

  const points = useMemo(() => {
    return axes.map((axis, index) => {
      const angle = -Math.PI / 2 + (index * 2 * Math.PI) / axes.length;
      const ratio = Math.max(0, Math.min(1, (axis.value ?? 0) / max));
      const cos = Math.cos(angle);
      const sin = Math.sin(angle);
      const labelDistance = radius + 26;
      let textAnchor: "start" | "middle" | "end" = "middle";
      if (cos > 0.35) textAnchor = "start";
      else if (cos < -0.35) textAnchor = "end";
      return {
        ...axis,
        angle,
        cos,
        sin,
        textAnchor,
        x: cx + cos * radius * ratio,
        y: cy + sin * radius * ratio,
        labelX: cx + cos * labelDistance,
        labelY: cy + sin * labelDistance,
        tipX: cx + cos * radius,
        tipY: cy + sin * radius,
      };
    });
  }, [axes, cx, cy, max, radius]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");
  const hasData = axes.some((axis) => axis.value != null);

  return (
    <div className="relative mx-auto w-full max-w-[320px]">
      <svg
        viewBox={`0 0 ${total} ${total}`}
        className="mx-auto h-auto w-full overflow-visible"
        role="img"
        aria-label="Radar des ressentis pré-séance"
      >
        <defs>
          <linearGradient id={`radar-fill-${gradId}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--ga-lime)" stopOpacity="0.45" />
            <stop offset="100%" stopColor="var(--ga-blue)" stopOpacity="0.2" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75, 1].map((ring) => (
          <polygon
            key={ring}
            points={points
              .map((p) => {
                const x = cx + Math.cos(p.angle) * radius * ring;
                const y = cy + Math.sin(p.angle) * radius * ring;
                return `${x},${y}`;
              })
              .join(" ")}
            fill="none"
            stroke="var(--ga-border)"
            strokeWidth="1"
          />
        ))}

        {points.map((p) => (
          <line
            key={`axis-${p.key}`}
            x1={cx}
            y1={cy}
            x2={p.tipX}
            y2={p.tipY}
            stroke="var(--ga-border)"
            strokeWidth="1"
          />
        ))}

        {hasData ? (
          <>
            <polygon
              points={polygon}
              fill={`url(#radar-fill-${gradId})`}
              stroke="var(--ga-lime)"
              strokeWidth="2"
              strokeLinejoin="round"
            />
            {points.map((p) => (
              <circle
                key={`dot-${p.key}`}
                cx={p.x}
                cy={p.y}
                r="3.5"
                fill="var(--ga-lime)"
              />
            ))}
          </>
        ) : null}

        {points.map((p) => (
          <text
            key={`label-${p.key}`}
            x={p.labelX}
            y={p.labelY}
            textAnchor={p.textAnchor}
            dominantBaseline="middle"
            className="fill-[var(--ga-muted)]"
            fontSize="11"
          >
            {p.label}
          </text>
        ))}
      </svg>
    </div>
  );
}

type UaRpePoint = {
  key: string;
  label: string;
  ua: number;
  avgRpe: number | null;
};

/** Barres UA + ligne RPE moyen (échelle 0–10). */
export function UaRpeChart({ points }: { points: UaRpePoint[] }) {
  const maxUa = Math.max(...points.map((p) => p.ua), 1);
  const width = 320;
  const height = 140;
  const padL = 28;
  const padR = 28;
  const padT = 12;
  const padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const n = Math.max(points.length, 1);
  const gap = Math.min(10, chartW / (n * 4));
  const barW = Math.max(8, (chartW - gap * (n - 1)) / n);

  const rpePoints = points
    .map((point, index) => {
      if (point.avgRpe == null) return null;
      const x = padL + index * (barW + gap) + barW / 2;
      const y = padT + chartH - (point.avgRpe / 10) * chartH;
      return { x, y, rpe: point.avgRpe };
    })
    .filter((p): p is { x: number; y: number; rpe: number } => p != null);

  const linePath =
    rpePoints.length > 1
      ? rpePoints.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-40 w-full"
      role="img"
      aria-label="Charges UA et RPE moyen"
    >
      {[0.25, 0.5, 0.75, 1].map((tick) => {
        const y = padT + chartH * (1 - tick);
        return (
          <line
            key={tick}
            x1={padL}
            y1={y}
            x2={width - padR}
            y2={y}
            stroke="var(--ga-border)"
            strokeWidth="1"
            opacity={0.6}
          />
        );
      })}

      {points.map((point, index) => {
        const h = Math.max(point.ua > 0 ? 3 : 2, (point.ua / maxUa) * chartH);
        const x = padL + index * (barW + gap);
        const y = padT + chartH - h;
        const label =
          point.label.length > 8
            ? `${point.label.slice(0, 7)}…`
            : point.label;
        return (
          <g key={point.key}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={h}
              rx="3"
              fill="var(--ga-blue)"
              opacity={point.ua > 0 ? 0.88 : 0.2}
            />
            <text
              x={x + barW / 2}
              y={height - 8}
              textAnchor="middle"
              className="fill-[var(--ga-muted)]"
              fontSize="8"
            >
              {label}
            </text>
          </g>
        );
      })}

      {linePath ? (
        <path
          d={linePath}
          fill="none"
          stroke="var(--ga-lime)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      ) : null}

      {rpePoints.map((point, index) => (
        <circle
          key={`rpe-${index}`}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill="var(--ga-lime)"
          stroke="var(--ga-card)"
          strokeWidth="1.5"
        />
      ))}

      <text
        x={padL - 4}
        y={padT + 4}
        textAnchor="end"
        className="fill-[var(--ga-muted)]"
        fontSize="8"
      >
        UA
      </text>
      <text
        x={width - padR + 4}
        y={padT + 4}
        textAnchor="start"
        className="fill-[var(--ga-muted)]"
        fontSize="8"
      >
        RPE
      </text>
    </svg>
  );
}

/** Jauge ratio aigu / chronique (échelle 0 → 2). */
export function AcwrGauge({
  ratio,
  acute,
  chronic,
}: {
  ratio: number | null;
  acute: number;
  chronic: number;
}) {
  const width = 280;
  const height = 56;
  const trackY = 22;
  const trackH = 10;
  const trackX = 12;
  const trackW = width - 24;
  const maxRatio = 2;
  const clamped = ratio == null ? null : Math.max(0, Math.min(maxRatio, ratio));
  const needleX =
    clamped == null ? null : trackX + (clamped / maxRatio) * trackW;

  // Zones: <0.8 under, 0.8–1.3 ok, 1.3–1.5 caution, >1.5 high
  const zones = [
    { from: 0, to: 0.8, color: "var(--ga-muted)", opacity: 0.35 },
    { from: 0.8, to: 1.3, color: "var(--ga-lime)", opacity: 0.55 },
    { from: 1.3, to: 1.5, color: "#e8b86d", opacity: 0.7 },
    { from: 1.5, to: 2, color: "var(--ga-red)", opacity: 0.55 },
  ];

  let status = "Données insuffisantes";
  if (ratio != null) {
    if (ratio < 0.8) status = "Sous-charge";
    else if (ratio <= 1.3) status = "Zone optimale";
    else if (ratio <= 1.5) status = "Charge élevée";
    else status = "Risque élevé";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-ga-muted">
          Ratio aigu / chronique
        </p>
        <p className="text-sm font-semibold text-ga-fg">
          {ratio == null ? "—" : ratio.toFixed(1)}
          <span className="ml-1 text-[11px] font-normal text-ga-muted">
            {status}
          </span>
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-14 w-full"
        role="img"
        aria-label="Jauge ratio aigu chronique"
      >
        {zones.map((zone) => {
          const x = trackX + (zone.from / maxRatio) * trackW;
          const w = ((zone.to - zone.from) / maxRatio) * trackW;
          return (
            <rect
              key={`${zone.from}-${zone.to}`}
              x={x}
              y={trackY}
              width={w}
              height={trackH}
              fill={zone.color}
              opacity={zone.opacity}
              rx={zone.from === 0 ? 4 : 0}
            />
          );
        })}
        <rect
          x={trackX}
          y={trackY}
          width={trackW}
          height={trackH}
          fill="none"
          stroke="var(--ga-border)"
          strokeWidth="1"
          rx="4"
        />
        {[0, 0.8, 1.3, 1.5, 2].map((tick) => {
          const x = trackX + (tick / maxRatio) * trackW;
          return (
            <text
              key={tick}
              x={x}
              y={trackY + trackH + 12}
              textAnchor="middle"
              className="fill-[var(--ga-muted)]"
              fontSize="8"
            >
              {tick}
            </text>
          );
        })}
        {needleX != null ? (
          <g>
            <line
              x1={needleX}
              y1={trackY - 6}
              x2={needleX}
              y2={trackY + trackH + 2}
              stroke="var(--ga-fg)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <circle cx={needleX} cy={trackY - 6} r="3.5" fill="var(--ga-fg)" />
          </g>
        ) : null}
      </svg>
    </div>
  );
}
