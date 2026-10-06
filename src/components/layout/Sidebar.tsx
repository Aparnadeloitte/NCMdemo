"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/dashboard", label: "Dashboard", icon: "/images/Grid_dashboard.svg" },
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

export function Sidebar({ open, onClose, role }: { open: boolean; onClose: () => void; role?: string }) {
  const pathname = usePathname();
  const nav = role === "Agency user"
    ? [
        items[0],
        items[1],
        { href: "/state-projects", label: "State Projects", icon: "/images/document_sidemenu.svg" },
        ...items.slice(2),
      ]
    : items;
  return (
    <>
      <button className={`sidebar-backdrop${open ? " show" : ""}`} type="button" aria-label="Close menu" onClick={onClose} />
      <aside className={`sidebar${open ? " open" : ""}`}>
        <nav aria-label="Primary">
          {nav.map((item) => {
            const active = item.href === "/dashboard" ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
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
