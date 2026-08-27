import { createClient } from "@/lib/supabase/server";
import { hasEnvVars } from "@/lib/supabase/env";

export type SupabaseStatus = {
  envOk: boolean;
  connected: boolean;
  message: string;
  projectHost: string | null;
};

export async function getSupabaseStatus(): Promise<SupabaseStatus> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";

  if (!hasEnvVars) {
    return {
      envOk: false,
      connected: false,
      message: "NEXT_PUBLIC_SUPABASE_URL ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY manquant dans .env",
      projectHost: null,
    };
  }

  let projectHost: string | null = null;
  try {
    projectHost = new URL(url).host;
  } catch {
    return {
      envOk: false,
      connected: false,
      message: "NEXT_PUBLIC_SUPABASE_URL n’est pas une URL valide.",
      projectHost: null,
    };
  }

  try {
    const supabase = await createClient();
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        envOk: true,
        connected: false,
        message: error.message,
        projectHost,
      };
    }

    return {
      envOk: true,
      connected: true,
      message: "Connexion à Supabase établie.",
      projectHost,
    };
  } catch (error) {
    return {
      envOk: true,
      connected: false,
      message: error instanceof Error ? error.message : "Erreur inconnue",
      projectHost,
    };
  }
}
