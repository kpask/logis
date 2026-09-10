import type { ReactNode } from "react";
import { useAuth } from "./auth";
import { useState } from "react";
import { getInitials } from "./utils";
import { useI18n } from "./i18n";
import {
  IconBuilding,
  IconDashboard,
  IconLogout,
  IconSettings,
  IconUser,
  IconUsers,
} from "./components";

export type PageKey =
  | "dashboard"
  | "workplaces"
  | "invites"
  | "profile"
  | "settings";

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
  const { t } = useI18n();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems: { key: PageKey; labelKey: string; icon: ReactNode }[] = [
    { key: "dashboard", labelKey: "navDashboard", icon: <IconDashboard /> },
    { key: "workplaces", labelKey: "navWorkplaces", icon: <IconBuilding /> },
    { key: "invites", labelKey: "navInvites", icon: <IconUsers /> },
    { key: "profile", labelKey: "navProfile", icon: <IconUser /> },
    { key: "settings", labelKey: "navSettings", icon: <IconSettings /> },
  ];

  const pageTitleKey =
    page === "dashboard"
      ? "navDashboard"
      : page === "workplaces"
      ? "navWorkplaces"
      : page === "invites"
      ? "navInvites"
      : page === "profile"
      ? "navProfile"
      : "navSettings";

  return (
    <div className={`app-layout ${mobileOpen ? "sidebar-open" : ""}`}>
      {/* Mobile overlay for closing sidebar */}
      <div
        className="mobile-sidebar-overlay"
        onClick={() => setMobileOpen(false)}
      />

      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">L</div>
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
              {t(item.labelKey as any)}
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
            {t("signOut")}
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
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 6h18M3 12h18M3 18h18"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <div>
              <div className="topbar-title">{t(pageTitleKey as any)}</div>
            </div>
          </div>

          {user && (
            <div className="topbar-user" onClick={onOpenProfile}>
              <div className="topbar-avatar">{getInitials(user.name)}</div>
              <span className="topbar-user-name">
                {t("welcomeUser", { name: user.name })}
              </span>
            </div>
          )}
        </header>

        <main className="content-area">{children}</main>
      </div>
    </div>
  );
}
