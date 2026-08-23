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

const primaryItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/budgets", label: "Budgets", icon: WalletCards },
  { href: "/goals", label: "Objectifs", icon: Goal }
];

const dailyItems = [
  { href: "/commute", label: "Trajets", icon: Car },
  { href: "/work-calendar", label: "Télétravail", icon: BriefcaseBusiness }
];

const settingsItem = [
  { href: "/settings", label: "Paramètres", icon: Settings }
];

const mobileItems = [...primaryItems, dailyItems[0]];

export default function AppNav() {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar">
        <Link href="/dashboard" className="logo">
          <span className="logo-mark">F</span>
          <span className="logo-copy">
            <span>Fronta<strong>Budget</strong></span>
            <small>Ton copilote financier</small>
          </span>
        </Link>
        <div className="sidebar-label">Piloter</div>
        <nav className="nav">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-label sidebar-label-spaced">Au quotidien</div>
        <nav className="nav">
          {dailyItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
        <div className="sidebar-foot">
          <span className="sidebar-foot-icon" aria-hidden="true">✨</span>
          <div>
            <strong>Conseils personnalisés</strong>
            <small>Analyse de tes dépenses</small>
          </div>
        </div>
        <nav className="nav nav-settings">
          {settingsItem.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
                <span className="nav-icon"><Icon size={18} /></span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <nav className="mobile-nav">
        {mobileItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
