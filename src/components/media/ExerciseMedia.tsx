"use client";

import { useEffect, useRef, useState } from "react";
import { IconPlay } from "@/components/icons";

function urlPath(url: string): string {
  try {
    return new URL(url).pathname.toLowerCase();
  } catch {
    return url.toLowerCase();
  }
}

export function isGifUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  return urlPath(url).endsWith(".gif");
}

export function isVideoFileUrl(url: string | null | undefined): boolean {
  if (!url) return false;
  const path = urlPath(url);
  return (
    path.endsWith(".mp4") ||
    path.endsWith(".webm") ||
    path.endsWith(".mov") ||
    path.endsWith(".m4v") ||
    url.includes("/object/public/exercise-videos/")
  );
}

export function youtubeId(url: string): string | null {
  const match = url.match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
  );
  return match?.[1] ?? null;
}

function GifStill({
  url,
  name,
  className,
}: {
  url: string;
  name: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const image = new Image();
    image.onload = () => {
      if (cancelled) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = image.naturalWidth || 1;
      canvas.height = image.naturalHeight || 1;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.drawImage(image, 0, 0);
      setReady(true);
    };
    image.src = url;
    return () => {
      cancelled = true;
    };
  }, [url]);

  return (
    <div className={`relative bg-ga-elevated ${className}`}>
      {!ready ? (
        <span className="absolute inset-0 flex items-center justify-center text-ga-muted">
          <IconPlay className="h-8 w-8" />
        </span>
      ) : null}
      <canvas
        ref={canvasRef}
        aria-label={`Aperçu : ${name}`}
        className={`h-full w-full object-contain ${ready ? "opacity-100" : "opacity-0"}`}
      />
    </div>
  );
}

export function ExerciseMedia({
  url,
  name,
  className = "aspect-video w-full",
  controls = true,
  playing = true,
}: {
  url: string | null | undefined;
  name: string;
  className?: string;
  controls?: boolean;
  playing?: boolean;
}) {
  if (url && isGifUrl(url)) {
    if (!playing) {
      return <GifStill url={url} name={name} className={className} />;
    }
    return (
      // GIFs ExerciseDB : demonstration animée, pas de next/image
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={url}
        alt={`Démonstration : ${name}`}
        className={`${className} bg-ga-elevated object-contain`}
      />
    );
  }

  if (url && isVideoFileUrl(url)) {
    return (
      <video
        src={url}
        title={name}
        controls={playing && controls}
        playsInline
        muted={!playing}
        preload="metadata"
        onLoadedMetadata={(event) => {
          if (!playing) event.currentTarget.currentTime = 0.1;
        }}
        className={`${className} bg-black object-contain`}
      />
    );
  }

  if (url) {
    const yt = youtubeId(url);
    if (yt) {
      return (
        <iframe
          title={name}
          src={`https://www.youtube.com/embed/${yt}`}
          className={className}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      );
    }
    return (
      <a
        href={url}
        target="_blank"
        rel="noreferrer"
        className={`flex items-center justify-center bg-ga-elevated text-ga-lime ${className}`}
      >
        <IconPlay className="h-8 w-8" />
      </a>
    );
  }

  return (
    <div
      className={`flex items-center justify-center bg-ga-elevated text-ga-muted ${className}`}
    >
      <IconPlay className="h-8 w-8" />
    </div>
  );
}
