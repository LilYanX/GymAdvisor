import { requireCoach } from "@/lib/auth";
import { CoachProfileForm } from "@/components/coach/CoachProfileForm";

export default async function ProfilPage() {
  const { profile } = await requireCoach();

  return (
    <div className="min-h-0 flex-1 overflow-y-auto">
      <div className="flex flex-col gap-6 p-8">
        <div>
          <h1 className="text-2xl font-semibold">Mon profil</h1>
          <p className="mt-1 text-sm text-ga-muted">
            Informations de ton compte coach.
          </p>
        </div>
        <CoachProfileForm profile={profile} />
      </div>
    </div>
  );
}
