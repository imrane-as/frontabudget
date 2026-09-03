"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import {
  ArrowLeftRight,
  BarChart3,
  BriefcaseBusiness,
  Car,
  FileKey2,
  Goal,
  Settings,
  WalletCards
} from "lucide-react";

const primaryItems = [
  { href: "/dashboard", label: "Dashboard", icon: BarChart3 },
  { href: "/transactions", label: "Transactions", icon: ArrowLeftRight },
  { href: "/payslips", label: "Fiches de paie", icon: FileKey2 },
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

const mobileItems = primaryItems.map((item) =>
  item.href === "/payslips" ? { ...item, label: "Paies" } : item
);

export default function AppNav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const month = searchParams.get("month");
  const year = searchParams.get("year");
  const periodSuffix = month && year
    ? `?month=${encodeURIComponent(month)}&year=${encodeURIComponent(year)}`
    : "";
  const withPeriod = (href: string) => `${href}${periodSuffix}`;

  return (
    <>
      <aside className="sidebar">
        <Link href={withPeriod("/dashboard")} className="logo">
          <BrandLogo />
        </Link>
        <div className="sidebar-label">Piloter</div>
        <nav className="nav">
          {primaryItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(`${href}/`);
            return (
              <Link key={href} href={withPeriod(href)} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
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
              <Link key={href} href={withPeriod(href)} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
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
              <Link key={href} href={withPeriod(href)} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
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
            <Link key={href} href={withPeriod(href)} className={active ? "active" : ""} aria-current={active ? "page" : undefined}>
              <Icon size={18} />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
