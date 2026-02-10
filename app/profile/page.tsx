import ProfileForm from "@/components/ProfileForm";
import { getProfile } from "@/lib/profile";
import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id ?? null;
  const profile = await getProfile(userId);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Profile</p>
        <h1 className="font-display text-3xl text-slate-900">Personal details</h1>
        <p className="text-sm text-slate-500">Used to auto-fill forms and documents.</p>
      </header>

      <ProfileForm profile={profile} />
    </div>
  );
}
