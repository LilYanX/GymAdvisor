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
  uaFinal: number;
  avgRpe: number | null;
  finalRpe: number | null;
};

/** Barres jumelles : UA (RPE moy.) + UA (RPE final). */
export function UaRpeChart({ points }: { points: UaRpePoint[] }) {
  const maxUa = Math.max(
    ...points.flatMap((p) => [p.ua, p.uaFinal]),
    1,
  );
  const width = 320;
  const height = 148;
  const padL = 28;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const n = Math.max(points.length, 1);
  const gap = Math.min(12, chartW / (n * 3));
  const groupW = Math.max(14, (chartW - gap * (n - 1)) / n);
  const innerGap = 2;
  const barW = Math.max(5, (groupW - innerGap) / 2);

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-40 w-full"
      role="img"
      aria-label="Charges UA RPE moyen et RPE final"
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
        const x0 = padL + index * (groupW + gap);
        const hAvg = Math.max(point.ua > 0 ? 3 : 2, (point.ua / maxUa) * chartH);
        const hFinal = Math.max(
          point.uaFinal > 0 ? 3 : 2,
          (point.uaFinal / maxUa) * chartH,
        );
        const label =
          point.label.length > 8
            ? `${point.label.slice(0, 7)}…`
            : point.label;
        return (
          <g key={point.key}>
            <rect
              x={x0}
              y={padT + chartH - hAvg}
              width={barW}
              height={hAvg}
              rx="2"
              fill="var(--ga-blue)"
              opacity={point.ua > 0 ? 0.9 : 0.2}
            />
            <rect
              x={x0 + barW + innerGap}
              y={padT + chartH - hFinal}
              width={barW}
              height={hFinal}
              rx="2"
              fill="var(--ga-lime)"
              opacity={point.uaFinal > 0 ? 0.85 : 0.2}
            />
            <text
              x={x0 + groupW / 2}
              y={height - 8}
              textAnchor="middle"
              fill="var(--ga-muted)"
              fontSize="8"
            >
              {label}
            </text>
          </g>
        );
      })}

      <text
        x={padL - 4}
        y={padT + 4}
        textAnchor="end"
        fill="var(--ga-muted)"
        fontSize="8"
      >
        UA
      </text>
    </svg>
  );
}

/** Jauge ratio aigu / chronique (échelle 0 → 2). */
export function AcwrGauge({
  ratio,
  acute,
  chronic,
  sufficientData = true,
}: {
  ratio: number | null;
  acute: number;
  chronic: number;
  sufficientData?: boolean;
}) {
  const width = 280;
  const height = 56;
  const trackY = 22;
  const trackH = 10;
  const trackX = 12;
  const trackW = width - 24;
  const maxRatio = 2;
  const showNeedle = sufficientData && ratio != null;
  const clamped =
    !showNeedle || ratio == null ? null : Math.max(0, Math.min(maxRatio, ratio));
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
  if (sufficientData && ratio != null) {
    if (ratio < 0.8) status = "Sous-charge";
    else if (ratio <= 1.3) status = "Zone optimale";
    else if (ratio <= 1.5) status = "Vigilance";
    else status = "Risque élevé";
  }

  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-[10px] uppercase tracking-wide text-ga-muted">
          Ratio aigu / chronique
        </p>
        <p className="text-sm font-semibold text-ga-fg">
          {!sufficientData || ratio == null ? "—" : ratio.toFixed(1)}
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
      {!sufficientData ? (
        <p className="text-[11px] text-ga-muted"></p>
      ) : (
        <p className="text-[11px] text-ga-muted">
          Aigu {acute.toLocaleString("fr-FR")} · Chronique{" "}
          {chronic.toLocaleString("fr-FR")} / sem
        </p>
      )}
    </div>
  );
}

/** Courbe quotidienne du score McLean (5–25) avec bande de zone normale. */
export function FeelingWellnessChart({
  points,
  baselineMean,
  baselineSd,
  alertThreshold,
}: {
  points: Array<{ key: string; label: string; totalScore: number | null }>;
  baselineMean: number | null;
  baselineSd: number | null;
  alertThreshold: number | null;
}) {
  const width = 320;
  const height = 160;
  const padL = 28;
  const padR = 12;
  const padT = 14;
  const padB = 28;
  const chartW = width - padL - padR;
  const chartH = height - padT - padB;
  const yMin = 5;
  const yMax = 25;

  function yFor(score: number): number {
    return padT + chartH - ((score - yMin) / (yMax - yMin)) * chartH;
  }

  const scored = points
    .map((point, index) => {
      if (point.totalScore == null) return null;
      const x =
        points.length <= 1
          ? padL + chartW / 2
          : padL + (index / (points.length - 1)) * chartW;
      return { x, y: yFor(point.totalScore), score: point.totalScore, label: point.label };
    })
    .filter((p): p is { x: number; y: number; score: number; label: string } => p != null);

  const linePath =
    scored.length > 1
      ? scored.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ")
      : "";

  const bandTop =
    baselineMean != null && baselineSd != null
      ? Math.min(25, baselineMean + baselineSd)
      : null;
  const bandBottom =
    alertThreshold != null
      ? alertThreshold
      : baselineMean != null && baselineSd != null
        ? Math.max(5, baselineMean - baselineSd)
        : null;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className="h-44 w-full"
      role="img"
      aria-label="Score McLean quotidien"
    >
      {bandTop != null && bandBottom != null ? (
        <rect
          x={padL}
          y={yFor(bandTop)}
          width={chartW}
          height={Math.max(2, yFor(bandBottom) - yFor(bandTop))}
          fill="var(--ga-lime)"
          opacity={0.12}
        />
      ) : null}
      {alertThreshold != null ? (
        <line
          x1={padL}
          y1={yFor(alertThreshold)}
          x2={width - padR}
          y2={yFor(alertThreshold)}
          stroke="var(--ga-red)"
          strokeWidth="1"
          strokeDasharray="4 3"
          opacity={0.7}
        />
      ) : null}
      {[5, 15, 25].map((tick) => (
        <g key={tick}>
          <line
            x1={padL}
            y1={yFor(tick)}
            x2={width - padR}
            y2={yFor(tick)}
            stroke="var(--ga-border)"
            strokeWidth="1"
            opacity={0.45}
          />
          <text
            x={padL - 4}
            y={yFor(tick)}
            textAnchor="end"
            dominantBaseline="middle"
            fill="var(--ga-muted)"
            fontSize="8"
          >
            {tick}
          </text>
        </g>
      ))}
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
      {scored.map((point) => (
        <circle
          key={`${point.x}-${point.score}`}
          cx={point.x}
          cy={point.y}
          r="3.5"
          fill="var(--ga-lime)"
        />
      ))}
      {points.length > 0 ? (
        <>
          <text
            x={padL}
            y={height - 8}
            fill="var(--ga-muted)"
            fontSize="8"
          >
            {points[0].label}
          </text>
          <text
            x={width - padR}
            y={height - 8}
            textAnchor="end"
            fill="var(--ga-muted)"
            fontSize="8"
          >
            {points[points.length - 1].label}
          </text>
        </>
      ) : null}
    </svg>
  );
}
