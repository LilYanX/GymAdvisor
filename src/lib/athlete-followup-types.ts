import type {
  Athlete,
  CheckIn,
  Payment,
} from "@/lib/supabase/models";
import type { PaymentDisplayStatus } from "@/lib/payments";

export type FeedbackItem = {
  sessionId: string;
  sessionTitle: string;
  sessionDate: string | null;
  exerciseName: string;
  rpe: number | null;
  comment: string;
};

export type TonnageExercise = {
  exerciseId: string;
  exerciseName: string;
  tonnageKg: number;
  setsCompleted: number;
};

export type TonnageSession = {
  sessionId: string;
  title: string;
  date: string | null;
  tonnageKg: number;
  loadUnits: number;
  exercises: TonnageExercise[];
};

export type AthleteFollowUp = {
  athlete: Athlete;
  payment: Payment | null;
  paymentBlocked: boolean;
  paymentDisplayStatus: PaymentDisplayStatus;
  overdueMonthLabels: string[];
  paymentDueDate: string;
  paymentGraceEnd: string;
  checkIns: CheckIn[];
  feedbacks: FeedbackItem[];
  sessions: TonnageSession[];
  totals: {
    tonnageKg: number;
    loadUnits: number;
  };
};
