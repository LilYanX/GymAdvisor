import type { Enums, Tables, TablesInsert, TablesUpdate } from "./database.types";

export type UserRole = Enums<"user_role">;
export type MuscleGroup = Enums<"muscle_group">;
export type WeekStatus = Enums<"week_status">;
export type SessionType = Enums<"session_type">;
export type SessionLogStatus = Enums<"session_log_status">;
export type PaymentStatus = Enums<"payment_status">;
export type ReminderKind = Enums<"reminder_kind">;
export type ReminderChannel = Enums<"reminder_channel">;

/** Compte connecté (Auth). Le rôle coach se définit dans le SQL Editor. */
export type Profile = Tables<"profiles">;

/**
 * Sportif du roster. Existe avant même qu’il ait un compte.
 * `profile_id` se lie automatiquement si l’e-mail Auth correspond.
 */
export type Athlete = Tables<"athletes">;
export type AthleteInsert = TablesInsert<"athletes">;
export type AthleteUpdate = TablesUpdate<"athletes">;

/** Mouvement de la bibliothèque, avec vidéo et consignes réutilisables. */
export type Exercise = Tables<"exercises">;
export type ExerciseInsert = TablesInsert<"exercises">;
export type ExerciseUpdate = TablesUpdate<"exercises">;

/** Une semaine de programme (brouillon puis publiée). */
export type ProgramWeek = Tables<"program_weeks">;
export type ProgramWeekInsert = TablesInsert<"program_weeks">;
export type ProgramWeekUpdate = TablesUpdate<"program_weeks">;

/** Un jour : séance, repos ou optionnel. weekday 1 = lundi. */
export type Session = Tables<"sessions">;
export type SessionInsert = TablesInsert<"sessions">;
export type SessionUpdate = TablesUpdate<"sessions">;

/** Prescription d’un exercice dans une séance (4×6 @ 80%, repos, note). */
export type SessionExercise = Tables<"session_exercises">;
export type SessionExerciseInsert = TablesInsert<"session_exercises">;
export type SessionExerciseUpdate = TablesUpdate<"session_exercises">;

/** Avancement de la séance (fait / en cours / à renseigner). */
export type SessionLog = Tables<"session_logs">;
export type SessionLogInsert = TablesInsert<"session_logs">;
export type SessionLogUpdate = TablesUpdate<"session_logs">;

/** RPE ressenti et commentaire sur un exercice. */
export type SessionExerciseLog = Tables<"session_exercise_logs">;
export type SessionExerciseLogInsert = TablesInsert<"session_exercise_logs">;
export type SessionExerciseLogUpdate = TablesUpdate<"session_exercise_logs">;

/** Une série saisie par le sportif (charge, reps, fait). */
export type SetLog = Tables<"set_logs">;
export type SetLogInsert = TablesInsert<"set_logs">;
export type SetLogUpdate = TablesUpdate<"set_logs">;

/** Check-in hebdo historique : énergie, sommeil, douleurs (1–5). */
export type CheckIn = Tables<"check_ins">;
export type CheckInInsert = TablesInsert<"check_ins">;
export type CheckInUpdate = TablesUpdate<"check_ins">;

/** Ressenti en début de séance (énergie, sommeil, douleurs, motivation). */
export type SessionCheckIn = Tables<"session_check_ins">;
export type SessionCheckInInsert = TablesInsert<"session_check_ins">;

export type AthleteActivity = Tables<"athlete_activities">;
export type AthleteActivityInsert = TablesInsert<"athlete_activities">;
export type AthleteActivityRecurrence = Tables<"athlete_activity_recurrences">;

export type WorkoutTemplateKind = Enums<"workout_template_kind">;
export type WorkoutTemplate = Tables<"workout_templates">;
export type WorkoutTemplateExercise = Tables<"workout_template_exercises">;

/** Statut de paiement du mois, sans encaissement en ligne. */
export type Payment = Tables<"payments">;
export type PaymentInsert = TablesInsert<"payments">;
export type PaymentUpdate = TablesUpdate<"payments">;

/** Relance déjà envoyée, pour ne pas spammer. */
export type ReminderLog = Tables<"reminder_logs">;
export type ReminderLogInsert = TablesInsert<"reminder_logs">;
