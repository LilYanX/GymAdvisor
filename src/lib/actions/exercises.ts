"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { MuscleGroup } from "@/lib/supabase/models";

export type ExerciseFormState = {
  error: string | null;
};

const GROUPS: MuscleGroup[] = [
  "jambes",
  "haut_du_corps",
  "gainage",
  "cardio",
  "full_body",
];

export async function createExercise(
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const muscleGroup = String(formData.get("muscle_group") ?? "") as MuscleGroup;
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;
  const cues = String(formData.get("cues") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const vigilancePoints = String(formData.get("vigilance_points") ?? "").trim();

  if (!name) {
    return { error: "Le nom de l’exercice est obligatoire." };
  }
  if (!GROUPS.includes(muscleGroup)) {
    return { error: "Choisis un groupe musculaire." };
  }

  const { error } = await supabase.from("exercises").insert({
    coach_id: profile.id,
    name,
    muscle_group: muscleGroup,
    video_url: videoUrl,
    cues,
    vigilance_points: vigilancePoints,
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "Un exercice avec ce nom existe déjà dans la bibliothèque." };
    }
    return { error: error.message };
  }

  revalidatePath("/bibliotheque");
  revalidatePath("/editeur");
  redirect("/bibliotheque");
}

export async function updateExerciseVideo(
  exerciseId: string,
  videoUrl: string,
): Promise<{ error: string | null }> {
  await requireCoach();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exercises")
    .update({ video_url: videoUrl })
    .eq("id", exerciseId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/bibliotheque");
  revalidatePath(`/bibliotheque/${exerciseId}`);
  revalidatePath("/editeur");
  return { error: null };
}

export async function updateExercise(
  _prev: ExerciseFormState,
  formData: FormData,
): Promise<ExerciseFormState> {
  await requireCoach();
  const supabase = await createClient();

  const exerciseId = String(formData.get("exercise_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const muscleGroup = String(formData.get("muscle_group") ?? "") as MuscleGroup;
  const videoUrl = String(formData.get("video_url") ?? "").trim() || null;
  const cues = String(formData.get("cues") ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
  const vigilancePoints = String(formData.get("vigilance_points") ?? "").trim();

  if (!exerciseId) return { error: "Exercice introuvable." };
  if (!name) return { error: "Le nom de l’exercice est obligatoire." };
  if (!GROUPS.includes(muscleGroup)) {
    return { error: "Choisis un groupe musculaire." };
  }

  const { error } = await supabase
    .from("exercises")
    .update({
      name,
      muscle_group: muscleGroup,
      video_url: videoUrl,
      cues,
      vigilance_points: vigilancePoints,
    })
    .eq("id", exerciseId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Un exercice avec ce nom existe déjà dans la bibliothèque." };
    }
    return { error: error.message };
  }

  revalidatePath("/bibliotheque");
  revalidatePath(`/bibliotheque/${exerciseId}`);
  revalidatePath("/editeur");
  redirect("/bibliotheque");
}

export async function deleteExercise(
  exerciseId: string,
): Promise<{ error: string | null }> {
  await requireCoach();
  const supabase = await createClient();

  const { error } = await supabase
    .from("exercises")
    .delete()
    .eq("id", exerciseId);

  if (error) {
    if (error.code === "23503") {
      return {
        error:
          "Cet exercice est utilisé dans un programme. Retire-le des séances avant de le supprimer.",
      };
    }
    return { error: error.message };
  }

  revalidatePath("/bibliotheque");
  revalidatePath("/editeur");
  return { error: null };
}
