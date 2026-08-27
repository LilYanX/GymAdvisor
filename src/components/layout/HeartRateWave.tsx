"use client";

import { useEffect, useRef } from "react";

const BASELINE = 0.5;
const SPEED = 2.2;

function ecgSample(phase: number): number {
  const b = BASELINE;
  if (phase < 0.08) return b;
  if (phase < 0.11) return b - 0.055;
  if (phase < 0.15) return b;
  if (phase < 0.17) return b + 0.035;
  if (phase < 0.19) return b - 0.44;
  if (phase < 0.22) return b + 0.2;
  if (phase < 0.27) return b;
  if (phase < 0.4) return b - 0.11;
  return b;
}

export function HeartRateWave({ className = "" }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bufferRef = useRef<number[]>([]);
  const phaseRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = 0;
    let height = 0;
    let dpr = 1;
    let animId = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      width = Math.max(1, Math.floor(rect.width));
      height = Math.max(1, Math.floor(rect.height));
      dpr = window.devicePixelRatio || 1;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      bufferRef.current = Array.from({ length: width }, () => BASELINE);
      phaseRef.current = 0;
    };

    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const strokeColor =
      getComputedStyle(document.documentElement).getPropertyValue("--ga-lime").trim() ||
      "#c8f135";

    const draw = () => {
      phaseRef.current += SPEED / 130;
      if (phaseRef.current >= 1) phaseRef.current -= 1;

      const sample = ecgSample(phaseRef.current);
      bufferRef.current.shift();
      bufferRef.current.push(sample);

      ctx.clearRect(0, 0, width, height);

      ctx.strokeStyle = strokeColor;
      ctx.lineWidth = 2.5;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.shadowColor = strokeColor;
      ctx.shadowBlur = 10;

      ctx.beginPath();
      bufferRef.current.forEach((value, index) => {
        const x = index;
        const y = value * height;
        if (index === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.stroke();

      const dotY = bufferRef.current[bufferRef.current.length - 1] * height;
      ctx.shadowBlur = 14;
      ctx.fillStyle = strokeColor;
      ctx.beginPath();
      ctx.arc(width - 2, dotY, 3.5, 0, Math.PI * 2);
      ctx.fill();

      animId = requestAnimationFrame(draw);
    };

    animId = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(animId);
      observer.disconnect();
    };
  }, []);

  return (
    <div className={`ga-ecg-viewport w-full max-w-xl ${className}`} aria-hidden="true">
      <canvas ref={canvasRef} className="ga-ecg-canvas" />
    </div>
  );
}
