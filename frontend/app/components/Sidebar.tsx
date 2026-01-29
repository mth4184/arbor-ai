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

type SidebarProps = {
  collapsed?: boolean;
  onToggle?: () => void;
};

function shortLabel(label: string) {
  const words = label.split(" ").filter(Boolean);
  if (words.length > 1) {
    return words.map((word) => word[0]).join("").toUpperCase();
  }
  return label.slice(0, 3).toUpperCase();
}

export default function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
      {onToggle && (
        <button
          className="sidebar-toggle-button"
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d={collapsed ? "M9 18L15 12L9 6" : "M15 18L9 12L15 6"}
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}
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
          const short = shortLabel(item.label);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link ${active ? "active" : ""}`}
            >
              <span className="nav-label">{item.label}</span>
              <span className="nav-short" aria-hidden="true">
                {short}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
