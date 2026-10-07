"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/projects", label: "Projects", icon: "/images/project_sidemenu.svg" },
  { href: "/interventions", label: "Interventions", icon: "/images/Interventions_sidemenu.svg" },
  { href: "/mrv", label: "MRV Data", icon: "/images/MRV Data_sidemenu.svg" },
  { href: "/reports", label: "Reports", icon: "/images/Reports_sidemenu.svg" },
  { href: "/map", label: "Maps & GIS", icon: "/images/Map pin_sidemenu.svg" },
  { href: "/documents", label: "Documents", icon: "/images/document_sidemenu.svg" },
  { href: "/approvals", label: "Approvals", icon: "/images/approvals_sidemenu.svg" },
  { href: "/grievances", label: "Grievances", icon: "/images/Grievances_sidemenu.svg" },
  { href: "/users", label: "Users", icon: "/images/User_sidemenu.svg" },
  { href: "/database", label: "Master Data", icon: "/images/Database_sidemenu.svg" },
];

const roleItem: Record<string, { href: string; label: string; icon: string }[]> = {
  "Admin user": [
    { href: "/central-review", label: "Project Review", icon: "/images/approvals_sidemenu.svg" },
    { href: "/kpi-review", label: "KPI Review", icon: "/images/MRV Data_sidemenu.svg" },
  ],
  "State user": [{ href: "/central-projects", label: "My Projects", icon: "/images/document_sidemenu.svg" }],
  "Agency user": [{ href: "/my-projects", label: "My Projects", icon: "/images/project_sidemenu.svg" }],
};

export function Sidebar({ open, onClose, role }: { open: boolean; onClose: () => void; role?: string }) {
  const pathname = usePathname();
  const extra = role ? roleItem[role] ?? [] : [];
  const kpiItem = { href: "/kpi-dashboard", label: "Dashboard", icon: "/images/Grid_dashboard.svg" };
  const showKpi = role === "State user" || role === "Central user";
  const primary = showKpi ? [kpiItem, ...items.slice(0, 3)] : items.slice(0, 3);
  const nav = [...primary.filter((item) => role !== "State user" || item.href !== "/projects"), ...extra, ...items.slice(3)];
  return (
    <>
      <button className={`sidebar-backdrop${open ? " show" : ""}`} type="button" aria-label="Close menu" onClick={onClose} />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <nav aria-label="Primary">
          {nav.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link key={item.href} href={item.href} className={`nav-link${active ? " active" : ""}`} aria-current={active ? "page" : undefined} onClick={onClose}>
                <span className="nav-ico" style={{ ["--ico" as string]: `url("${encodeURI(item.icon)}")` }} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
    </>
  );
}
