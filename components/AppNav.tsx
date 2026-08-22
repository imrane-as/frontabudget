import Link from "next/link";

const items = [
  ["/dashboard", "Dashboard"],
  ["/transactions", "Transactions"],
  ["/budgets", "Budgets"],
  ["/goals", "Objectifs"],
  ["/commute", "Trajets"],
  ["/work-calendar", "Télétravail"],
  ["/settings", "Paramètres"]
];

export default function AppNav() {
  return (
    <>
      <aside className="sidebar">
        <div className="logo">Fronta<span>Budget</span></div>
        <nav className="nav">
          {items.map(([href, label]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      <nav className="mobile-nav">
        {items.slice(0, 5).map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </nav>
    </>
  );
}
