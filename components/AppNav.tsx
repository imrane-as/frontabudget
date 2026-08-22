"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ArrowLeftRight,
  BarChart3,
  BriefcaseBusiness,
  Car,
  Goal,
  Settings,
  WalletCards
} from "lucide-react";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: WalletCards },
  { href: "/goals", label: "Objectifs", icon: Goal },
  { href: "/commute", label: "Trajets", icon: Car },
  { href: "/work-calendar", label: "Télétravail", icon: BriefcaseBusiness },
  { href: "/settings", label: "Paramètres", icon: Settings }
];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar">
        <Link href="/dashboard" className="logo">
          <span className="logo-mark">F</span>
          <span>Fronta<strong>Budget</strong></span>
        </Link>
        <div className="sidebar-label">Mon espace</div>
        <nav className="nav">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={active ? "active" : ""}>
                <Icon size={18} />
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <span>✨ Coach intelligent</span>
          <small>Analyse locale + IA à la demande</small>
        </div>
      </aside>

      <nav className="mobile-nav">
        {items.slice(0, 5).map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={active ? "active" : ""}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
