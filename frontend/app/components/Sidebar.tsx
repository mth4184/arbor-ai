"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Customers" },
  { href: "/estimates", label: "Estimates" },
  { href: "/jobs", label: "Jobs" },
  { href: "/calendar", label: "Calendar" },
  { href: "/scheduling", label: "Scheduling" },
  { href: "/invoices", label: "Invoices" },
  { href: "/finances", label: "Finances" },
  { href: "/equipment", label: "Equipment" },
  { href: "/plant-inventory", label: "Plant Inventory" },
  { href: "/reports", label: "Reports" },
  { href: "/settings", label: "Settings" },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 3C8.2 4.3 5.2 8 5.2 12.1c0 4.3 3 8.2 6.8 8.9 3.8-.7 6.8-4.6 6.8-8.9C18.8 8 15.8 4.3 12 3Z"
              fill="currentColor"
              opacity="0.9"
            />
            <path d="M12 5.6v12.8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path
              d="M12 12.2c-2.6 0-4.7-1.5-5.7-3.2"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
            />
          </svg>
        </div>
        <div>
          <div className="brand-title">ArborSoftAI</div>
          <div className="brand-subtitle">Tree service CRM</div>
        </div>
      </div>
      <nav className="sidebar-nav">
        {NAV_ITEMS.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
