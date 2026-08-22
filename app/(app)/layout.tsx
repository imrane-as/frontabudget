import AppNav from "@/components/AppNav";
import AppTopbar from "@/components/AppTopbar";
import { requireUser } from "@/lib/auth";

export default async function PrivateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const { user } = await requireUser();

  return (
    <div className="app-layout">
      <AppNav />
      <div className="app-workspace">
        <AppTopbar email={user.email || ""} />
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}
