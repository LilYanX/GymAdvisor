import { signOut } from "@/lib/actions/auth";
import { Logo } from "@/components/icons";

export default function AccesRefusePage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6">
      <div className="max-w-md">
        <Logo />
        <h1 className="mt-8 text-2xl font-semibold">Accès coach requis</h1>
        <p className="mt-3 text-sm text-ga-muted">
          Ce compte n’a pas le rôle coach. Dans le SQL Editor Supabase :
        </p>
        <pre className="mt-4 overflow-x-auto rounded-lg bg-ga-card p-4 text-xs text-ga-lime">
          {`update public.profiles
set role = 'coach'
where email = 'TON_EMAIL';`}
        </pre>
        <form action={signOut} className="mt-6">
          <button
            type="submit"
            className="text-sm text-ga-muted hover:text-ga-fg"
          >
            Se déconnecter
          </button>
        </form>
      </div>
    </main>
  );
}
