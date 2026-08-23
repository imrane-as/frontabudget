import AppNav from "@/components/AppNav";
import AppTopbar from "@/components/AppTopbar";
import { requireUser } from "@/lib/auth";

export default async function PrivateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { supabase, user } = await requireUser();
  const profileResult = await supabase
    .from("profiles")
    .select("full_name,avatar_path,updated_at")
    .eq("id", user.id)
    .maybeSingle();
  let profile = profileResult.data;

  if (profileResult.error) {
    const fallbackProfileResult = await supabase
      .from("profiles")
      .select("full_name,updated_at")
      .eq("id", user.id)
      .maybeSingle();
    profile = fallbackProfileResult.data
      ? { ...fallbackProfileResult.data, avatar_path: null }
      : null;
  }

  return (
    <div className="app-layout">
      <AppNav />
      <div className="app-workspace">
        <AppTopbar
          email={user.email || ""}
          fullName={profile?.full_name || ""}
          hasAvatar={Boolean(profile?.avatar_path)}
          profileVersion={profile?.updated_at || null}
        />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
