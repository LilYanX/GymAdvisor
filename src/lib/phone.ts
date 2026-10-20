/** Digits only, for wa.me. French local `0…` → `33…`. */
export function normalizePhoneForWhatsApp(
  phone: string | null | undefined,
): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  if (!trimmed) return null;

  let digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;

  if (digits.startsWith("0") && digits.length >= 10) {
    digits = `33${digits.slice(1)}`;
  }

  return digits;
}

export function whatsappUrl(
  phone: string | null | undefined,
  text: string,
): string | null {
  const digits = normalizePhoneForWhatsApp(phone);
  if (!digits) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
}

export function sessionReminderMessage(
  athleteFirstName: string,
  coachFirstName: string,
): string {
  const signature = coachFirstName.trim() || "Ton coach";
  return `Salut ${athleteFirstName},\n\nPense à renseigner ta séance, j'en ai besoin pour la suite.\n\n${signature}`;
}

export const SESSION_REMINDER_SUBJECT = "Petit rappel - ta séance";
