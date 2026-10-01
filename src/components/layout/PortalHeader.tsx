"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearSession } from "@/lib/session";
import type { AuthSession } from "@/types/auth";

const languages = [
  { label: "English", value: "En" },
  { label: "Hindi", value: "Hi" },
];

export function PortalHeader({ onMenu, user }: { onMenu?: () => void; user?: AuthSession | null }) {
  const router = useRouter();
  const [language, setLanguage] = useState("En");
  const [noticesOpen, setNoticesOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      setNoticesOpen(false);
      setMenuOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="portal-header">
      <img className="portal-header-bg" src="/images/header_bg.svg" alt="" />
      <div className="portal-header-inner">
        <div className="brand-lockup">
          {onMenu ? (
            <button className="icon-btn menu-toggle" type="button" onClick={onMenu} aria-label="Open menu"><MenuIcon /></button>
          ) : null}
          <img className="brand-emblem" src="/images/ministry%20of%20env.svg" alt="Ministry of Environment, Forest and Climate Change" />
          {/* <div>
            <p className="brand-ministry">Ministry of Environment,<br />Forest and Climate Change</p>
            <p className="brand-gov">Government of India</p>
          </div> */}
          <span className="brand-rule" aria-hidden="true" />
          <div className="brand-copy">
            <p className="brand-mission">National Coastal Mission (NCM 2.0)</p>
            <p className="brand-portal">MIS-MRV Portal</p>
          </div>
        </div>
        <div className="header-tools">
          <div className="tool-pop">
            <button className="icon-btn" type="button" aria-label="Notifications" aria-expanded={noticesOpen} onClick={() => { setNoticesOpen((open) => !open); setMenuOpen(false); }}><BellIcon /></button>
            {noticesOpen ? (
              <div className="popover" role="region" aria-label="Notifications">
                <p>3 MRV plots from Odisha are waiting for review.</p>
                <p>Dune stabilisation — Puri coast was submitted yesterday.</p>
              </div>
            ) : null}
          </div>
          <label className="lang-pill">
            <GlobeIcon />
            <span className="sr-only">Language</span>
            <select value={language} aria-label="Language" onChange={(event) => setLanguage(event.target.value)}>
              {languages.map((item) => <option key={item.value} value={item.value}>{item.value}</option>)}
            </select>
          </label>
          <div className="tool-pop">
            <button className="icon-btn" type="button" aria-label="Account menu" aria-expanded={menuOpen} onClick={() => { setMenuOpen((open) => !open); setNoticesOpen(false); }}><img src="/images/settings.svg" alt="" /></button>
            {menuOpen ? (
              <div className="popover menu-pop" role="menu">
                {user ? <p className="who">{user.name}</p> : null}
                <button type="button" role="menuitem" onClick={() => { clearSession(); router.push("/"); }}>Sign out</button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}

function MenuIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>;
}
function BellIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 1 1 12 0c0 7 2 7 2 7H4s2 0 2-7Z" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M10 18a2 2 0 0 0 4 0" fill="none" stroke="currentColor" strokeWidth="1.8" /></svg>;
}
function GlobeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.8" /><path d="M4 12h16M12 4c2.4 2.6 2.4 13.4 0 16M12 4c-2.4 2.6-2.4 13.4 0 16" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>;
}
