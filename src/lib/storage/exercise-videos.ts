"use client";

import { createClient } from "@/lib/supabase/client";

export const EXERCISE_VIDEO_BUCKET = "exercise-videos";
export const EXERCISE_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

const ALLOWED_TYPES = new Set([
  "video/mp4",
  "video/quicktime",
  "video/webm",
  "video/x-m4v",
]);

function extensionFor(file: File): string {
  const fromName = file.name.split(".").pop()?.toLowerCase();
  if (fromName === "mp4" || fromName === "mov" || fromName === "webm" || fromName === "m4v") {
    return fromName;
  }
  if (file.type === "video/quicktime") return "mov";
  if (file.type === "video/webm") return "webm";
  if (file.type === "video/x-m4v") return "m4v";
  return "mp4";
}

function contentTypeFor(file: File): string {
  if (file.type && ALLOWED_TYPES.has(file.type)) return file.type;
  const ext = extensionFor(file);
  if (ext === "mov") return "video/quicktime";
  if (ext === "webm") return "video/webm";
  if (ext === "m4v") return "video/x-m4v";
  return "video/mp4";
}

export function validateExerciseVideo(file: File): string | null {
  if (file.size === 0) return "Le fichier vidéo est vide.";
  if (file.size > EXERCISE_VIDEO_MAX_BYTES) {
    return "La vidéo dépasse 50 Mo. Compresse-la ou filme un peu plus court.";
  }
  const name = file.name.toLowerCase();
  const okExt =
    name.endsWith(".mp4") ||
    name.endsWith(".mov") ||
    name.endsWith(".webm") ||
    name.endsWith(".m4v");
  if (!ALLOWED_TYPES.has(file.type) && !okExt) {
    return "Format non pris en charge. Enregistre un fichier MP4.";
  }
  return null;
}

export function storagePathFromPublicUrl(url: string): string | null {
  const marker = `/object/public/${EXERCISE_VIDEO_BUCKET}/`;
  const index = url.indexOf(marker);
  if (index === -1) return null;
  return decodeURIComponent(url.slice(index + marker.length).split("?")[0] ?? "");
}

export async function uploadExerciseVideo(
  file: File,
): Promise<{ url: string } | { error: string }> {
  const invalid = validateExerciseVideo(file);
  if (invalid) return { error: invalid };

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Tu dois être connectée." };

  const path = `${user.id}/${crypto.randomUUID()}.${extensionFor(file)}`;
  const { error } = await supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .upload(path, file, {
      cacheControl: "3600",
      upsert: false,
      contentType: contentTypeFor(file),
    });

  if (error) {
    const message = error.message.toLowerCase();
    if (message.includes("bucket") || message.includes("not found")) {
      return {
        error:
          "Le stockage vidéo n’est pas encore activé. Exécute la migration SQL exercise_videos_storage dans Supabase.",
      };
    }
    return { error: error.message };
  }

  const { data } = supabase.storage
    .from(EXERCISE_VIDEO_BUCKET)
    .getPublicUrl(path);
  return { url: data.publicUrl };
}

export async function removeStoredExerciseVideo(url: string): Promise<void> {
  const path = storagePathFromPublicUrl(url);
  if (!path) return;
  const supabase = createClient();
  await supabase.storage.from(EXERCISE_VIDEO_BUCKET).remove([path]);
}
