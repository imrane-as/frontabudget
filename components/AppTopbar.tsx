"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Plus, Settings, ShieldCheck, UserRound } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import ProfileAvatar from "@/components/ProfileAvatar";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { createClient } from "@/lib/supabase/client";

type Props = {
  email: string;
  fullName: string;
  hasAvatar: boolean;
  profileVersion?: string | null;
};

export default function AppTopbar({
  email,
  fullName,
  hasAvatar,
  profileVersion
}: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const menuRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const periodSuffix = month && year
    ? `?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
    : "";
  const pageLabels: Record<string, string> = {
    "/dashboard": "Vue d’ensemble",
    "/transactions": "Transactions",
    "/payslips": "Fiches de paie",
    "/budgets": "Budgets",
    "/goals": "Objectifs",
    "/commute": "Trajets",
    "/work-calendar": "Télétravail",
    "/settings": "Paramètres",
    "/onboarding": "Bienvenue"
  };
  const currentPage = pageLabels[pathname] || "Mon espace";

  useEffect(() => {
    function closeMenu(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) setOpen(false);
    }

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", closeMenu);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeMenu);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  async function logout() {
    setLoggingOut(true);
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="app-topbar">
      <Link href={`/dashboard${periodSuffix}`} className="topbar-mobile-brand" aria-label="FrontaBudget">
        <BrandLogo compact />
      </Link>

      <div className="topbar-status">
        <span className="sync-orb" aria-hidden="true"><ShieldCheck size={16} /></span>
        <div>
          <span>Mon espace <b>/</b> {currentPage}</span>
          <strong>{currentPage}</strong>
        </div>
      </div>

      <div className="topbar-actions">
        <ThemeSwitcher />
        <Link href={`/transactions${periodSuffix}`} className="btn btn-primary topbar-add">
          <Plus size={17} />
          <span>Nouvelle opération</span>
        </Link>

        <div className="profile-menu" ref={menuRef}>
          <button
            type="button"
            className="profile-menu-trigger"
            aria-label="Ouvrir le menu du profil"
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <ProfileAvatar
              label={fullName || email}
              hasAvatar={hasAvatar}
              version={profileVersion}
            />
            <span className="profile-trigger-copy">
              <strong>{fullName || "Mon profil"}</strong>
              <small>Compte personnel</small>
            </span>
            <ChevronDown size={14} />
          </button>

          {open && (
            <div className="profile-dropdown" role="menu">
              <div className="profile-dropdown-head">
                <ProfileAvatar
                  label={fullName || email}
                  hasAvatar={hasAvatar}
                  version={profileVersion}
                  size="large"
                />
                <div>
                  <strong>{fullName || "Utilisateur"}</strong>
                  <span>{email}</span>
                </div>
              </div>

              <div className="profile-dropdown-section">
                <Link href={`/settings${periodSuffix}`} role="menuitem" onClick={() => setOpen(false)}>
                  <UserRound size={16} /> Compléter mon profil
                </Link>
                <Link href={`/settings${periodSuffix}`} role="menuitem" onClick={() => setOpen(false)}>
                  <Settings size={16} /> Paramètres
                </Link>
                <ThemeSwitcher showLabel />
              </div>

              <button
                type="button"
                className="profile-logout"
                role="menuitem"
                onClick={logout}
                disabled={loggingOut}
              >
                <LogOut size={16} />
                {loggingOut ? "Déconnexion..." : "Se déconnecter"}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
