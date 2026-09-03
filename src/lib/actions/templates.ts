"use server";

import { revalidatePath } from "next/cache";
import { requireCoach } from "@/lib/auth";
import { isLocalId } from "@/lib/editor-draft";
import { createClient } from "@/lib/supabase/server";
import type { WorkoutTemplateKind } from "@/lib/supabase/models";

export type TemplateExercisePayload = {
  exercise_id: string;
  sort_order: number;
  sets_count: number;
  target_reps: number;
  target_weight_kg: number | null;
  target_percent: number | null;
  target_rpe: number | null;
  rest_seconds: number | null;
  coach_note: string;
  superset_group_id: string | null;
};

export type TemplatePayload = {
  name: string;
  kind: WorkoutTemplateKind;
  notes: string;
  exercises: TemplateExercisePayload[];
};

function revalidateTemplates() {
  revalidatePath("/editeur");
}

export async function listWorkoutTemplates() {
  const { profile } = await requireCoach();
  const supabase = await createClient();

  const { data: templates, error } = await supabase
    .from("workout_templates")
    .select("*")
    .eq("coach_id", profile.id)
    .order("updated_at", { ascending: false });

  if (error) return { error: error.message, templates: [] };

  const ids = (templates ?? []).map((item) => item.id);
  const { data: exercises } = ids.length
    ? await supabase
        .from("workout_template_exercises")
        .select("*")
        .in("template_id", ids)
        .order("sort_order")
    : { data: [] };

  const { data: library } = await supabase.from("exercises").select("*");
  const exerciseById = new Map((library ?? []).map((item) => [item.id, item]));

  return {
    error: null,
    templates: (templates ?? []).map((template) => ({
      ...template,
      exercises: (exercises ?? [])
        .filter((item) => item.template_id === template.id)
        .map((item) => ({
          ...item,
          exercise: exerciseById.get(item.exercise_id) ?? null,
        })),
    })),
  };
}

export async function saveWorkoutTemplate(
  templateId: string | null,
  payload: TemplatePayload,
): Promise<{ error: string | null; id: string | null }> {
  const { profile } = await requireCoach();
  const name = payload.name.trim();
  if (!name) return { error: "Le nom du sous-programme est obligatoire.", id: null };

  const supabase = await createClient();
  let id =
    templateId && !isLocalId(templateId) ? templateId : null;

  if (!id) {
    const { data, error } = await supabase
      .from("workout_templates")
      .insert({
        coach_id: profile.id,
        name,
        kind: payload.kind,
        notes: payload.notes,
      })
      .select("id")
      .single();
    if (error || !data) {
      return { error: error?.message ?? "Création impossible.", id: null };
    }
    id = data.id;
  } else {
    const { error } = await supabase
      .from("workout_templates")
      .update({
        name,
        kind: payload.kind,
        notes: payload.notes,
      })
      .eq("id", id)
      .eq("coach_id", profile.id);
    if (error) return { error: error.message, id: null };

    await supabase
      .from("workout_template_exercises")
      .delete()
      .eq("template_id", id);
  }

  if (payload.exercises.length > 0) {
    const groupIdMap = new Map<string, string>();
    const rows = payload.exercises.map((exercise, index) => {
      let groupId = exercise.superset_group_id;
      if (groupId && isLocalId(groupId)) {
        if (!groupIdMap.has(groupId)) {
          groupIdMap.set(groupId, crypto.randomUUID());
        }
        groupId = groupIdMap.get(groupId)!;
      }
      return {
        template_id: id!,
        exercise_id: exercise.exercise_id,
        sort_order: index,
        sets_count: exercise.sets_count,
        target_reps: exercise.target_reps,
        target_weight_kg: exercise.target_weight_kg,
        target_percent: exercise.target_percent,
        target_rpe: exercise.target_rpe,
        rest_seconds: exercise.rest_seconds,
        coach_note: exercise.coach_note,
        superset_group_id: groupId,
      };
    });
    const { error } = await supabase.from("workout_template_exercises").insert(rows);
    if (error) return { error: error.message, id };
  }

  revalidateTemplates();
  return { error: null, id };
}

export async function deleteWorkoutTemplate(
  templateId: string,
): Promise<{ error: string | null }> {
  const { profile } = await requireCoach();
  const supabase = await createClient();
  const { error } = await supabase
    .from("workout_templates")
    .delete()
    .eq("id", templateId)
    .eq("coach_id", profile.id);
  if (error) return { error: error.message };
  revalidateTemplates();
  return { error: null };
}
