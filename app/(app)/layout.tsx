import AppNav from "@/components/AppNav";
import { requireUser } from "@/lib/auth";

export default async function PrivateLayout({
  children
}: {
  children: React.ReactNode;
}) {
  await requireUser();

  return (
    <div className="app-layout">
      <AppNav />
      <main className="app-main">{children}</main>
    </div>
  );
}
