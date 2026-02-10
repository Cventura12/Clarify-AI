import OnboardingForm from "@/components/OnboardingForm";
import { getProfile } from "@/lib/profile";
import { getPreferences } from "@/lib/preferences";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function OnboardingPage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const profile = await getProfile(userId);
  const preferences = await getPreferences(userId);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Onboarding</p>
        <h1 className="font-display text-3xl text-slate-900">Personal context intake</h1>
        <p className="text-sm text-slate-500">
          Capture key details Clarify will reuse for auto-fill and suggestions.
        </p>
      </header>

      <OnboardingForm profile={profile} preferences={preferences} />
    </div>
  );
}
