import type { ReactNode } from "react";
import { useAuth } from "./auth";
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
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">W</div>
          <span>Workis</span>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <button
              key={item.key}
              className={`sidebar-nav-item ${
                page === item.key ? "active" : ""
              }`}
              onClick={() => onNavigate(item.key)}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          {user && (
            <div className="sidebar-footer-user" onClick={onOpenProfile}>
              <div className="topbar-avatar">{getInitials(user.name)}</div>
              <span>
                {user.name} {user.lastname}
              </span>
            </div>
          )}
          <div className="sidebar-footer-logout" onClick={onLogout}>
            <IconLogout />
            Sign out
          </div>
        </div>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div>
            <div className="topbar-title">{pageTitle}</div>
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
