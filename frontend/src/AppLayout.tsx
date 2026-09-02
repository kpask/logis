import type { ReactNode } from "react";
import { useAuth } from "./auth";
import { useState } from "react";
import { getInitials } from "./utils";
import {
  IconBuilding,
  IconDashboard,
  IconLogout,
  IconUser,
  IconUsers,
} from "./components";

export type PageKey = "dashboard" | "workplaces" | "invites" | "profile";

interface AppLayoutProps {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  onOpenProfile: () => void;
  onLogout: () => void;
  children: ReactNode;
}

export default function AppLayout({
  page,
  onNavigate,
  onOpenProfile,
  onLogout,
  children,
}: AppLayoutProps) {
  const { user } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { key: PageKey; label: string; icon: ReactNode }[] = [
    { key: "dashboard", label: "Dashboard", icon: <IconDashboard /> },
    { key: "workplaces", label: "Workplaces", icon: <IconBuilding /> },
    { key: "invites", label: "Invites", icon: <IconUsers /> },
    { key: "profile", label: "Profile", icon: <IconUser /> },
  ];

  const pageTitle =
    page === "dashboard"
      ? "Dashboard"
      : page === "workplaces"
      ? "Workplaces"
      : page === "invites"
      ? "Invites"
      : "Profile";

  return (
    <div className={`app-layout ${mobileOpen ? "sidebar-open" : ""}`}>
      {/* Mobile overlay for closing sidebar */}
      <div
        className="mobile-sidebar-overlay"
        onClick={() => setMobileOpen(false)}
      />

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">W</div>
          <span>Logis</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${
                page === item.key ? "active" : ""
              }`}
              onClick={() => {
                onNavigate(item.key);
                setMobileOpen(false);
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div
              className="sidebar-footer-user"
              onClick={() => {
                onOpenProfile();
                setMobileOpen(false);
              }}
            >
              <div className="topbar-avatar">{getInitials(user.name)}</div>
              <span>
                {user.name} {user.lastname}
              </span>
            </div>
          )}
          <div
            className="sidebar-footer-logout"
            onClick={() => {
              onLogout();
              setMobileOpen(false);
            }}
          >
            <IconLogout />
            Sign out
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              className="hamburger"
              aria-label="Open navigation"
              onClick={() => setMobileOpen(true)}
            >
              {/* simple hamburger icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div>
              <div className="topbar-title">{pageTitle}</div>
            </div>
          </div>

          {user && (
            <div className="topbar-user" onClick={onOpenProfile}>
              <div className="topbar-avatar">{getInitials(user.name)}</div>
              <span className="topbar-user-name">Welcome, {user.name}</span>
            </div>
          )}
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
