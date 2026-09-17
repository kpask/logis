import { useState, useEffect } from "react";
import { AuthProvider, useAuth } from "./auth";
import { I18nProvider } from "./i18n";
import AppLayout, { type PageKey } from "./AppLayout";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import DashboardPage from "./pages/DashboardPage";
import TimeWorkedPage from "./pages/TimeWorkedPage";
import WorkplacePage from "./pages/WorkplacePage";
import ProjectPage from "./pages/ProjectPage";
import ProfilePage from "./pages/ProfilePage";
import InvitesPage from "./pages/InvitesPage";
import InvitationPage from "./pages/InvitationPage";
import SettingsPage from "./pages/SettingsPage";
import { LoadingState } from "./components";

type View =
  | { type: "auth"; mode: "login" }
  | { type: "auth"; mode: "signup" }
  | { type: "app"; page: PageKey }
  | { type: "workplace"; id: number }
  | { type: "project"; id: number }
  | { type: "invitation"; token: string };

/**
 * Extract an invitation token from the URL path, e.g.
 * http://localhost:5173/invitations/abc-123 -> "abc-123"
 */
function invitationTokenFromPath(): string | null {
  const match = window.location.pathname.match(/^\/invitations\/([^/]+)$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function AppContent() {
  const { user, loading, logout } = useAuth();
  const [view, setView] = useState<View>(() => {
    const token = invitationTokenFromPath();
    if (token) {
      return { type: "invitation", token };
    }
    return { type: "auth", mode: "login" };
  });

  // When the user becomes authenticated while we're still on the
  // auth view, switch to the app dashboard so pages mount correctly.
  useEffect(() => {
    if (user && view.type === "auth") {
      setView({ type: "app", page: "dashboard" });
    }
  }, [user, view.type]);

  if (loading) {
    return <LoadingState label="Loading…" />;
  }

  // Invitation route — always show the invitation page (it handles
  // registration for new users; existing users are pointed to sign in,
  // then accept the invite from the Invites tab).
  if (view.type === "invitation") {
    return (
      <InvitationPage
        token={view.token}
        onGoToLogin={() => {
          // Clean the /invitations/<token> URL so a refresh doesn't land
          // back on the (now consumed) invitation screen.
          window.history.replaceState(null, "", "/");
          setView({ type: "auth", mode: "login" });
        }}
        onRegistered={() => {
          // Registration succeeded: clear the invitation URL and go to the
          // dashboard. Without this the effect below (which only watches
          // view.type === "auth") never fires and the user stays stuck on
          // the invitation form.
          window.history.replaceState(null, "", "/");
          setView({ type: "app", page: "dashboard" });
        }}
      />
    );
  }

  // Not authenticated — show login/signup
  if (!user) {
    if (view.type === "auth" && view.mode === "signup") {
      return (
        <SignupPage
          onNavigateLogin={() => setView({ type: "auth", mode: "login" })}
        />
      );
    }
    return (
      <LoginPage
        onNavigateSignup={() => setView({ type: "auth", mode: "signup" })}
      />
    );
  }

  // Authenticated — show the app layout
  const handleLogout = () => {
    logout();
    setView({ type: "auth", mode: "login" });
  };

  const handleNavigate = (page: PageKey) => {
    setView({ type: "app", page });
  };

  const handleOpenProfile = () => {
    setView({ type: "app", page: "profile" });
  };

  const handleOpenWorkplace = (workplaceId: number) => {
    setView({ type: "workplace", id: workplaceId });
  };

  const handleOpenProject = (projectId: number) => {
    setView({ type: "project", id: projectId });
  };

  const handleBackToDashboard = () => {
    setView({ type: "app", page: "dashboard" });
  };

  // Workplace/project detail views keep the Dashboard highlighted in the
  // sidebar — the dashboard is the hub for navigating to them.
  let page: PageKey = "dashboard";
  if (view.type === "app") {
    page = view.page;
  }

  return (
    <AppLayout
      page={page}
      onNavigate={handleNavigate}
      onOpenProfile={handleOpenProfile}
      onLogout={handleLogout}
    >
      {view.type === "app" && view.page === "dashboard" && (
        <DashboardPage onOpenWorkplace={handleOpenWorkplace} />
      )}
      {view.type === "app" && view.page === "hours" && <TimeWorkedPage />}
      {view.type === "app" && view.page === "invites" && <InvitesPage />}
      {view.type === "app" && view.page === "profile" && <ProfilePage />}
      {view.type === "app" && view.page === "settings" && <SettingsPage />}
      {view.type === "workplace" && (
        <WorkplacePage
          workplaceId={view.id}
          onBack={handleBackToDashboard}
          onOpenProject={handleOpenProject}
        />
      )}
      {view.type === "project" && (
        <ProjectPage projectId={view.id} onBack={handleBackToDashboard} />
      )}
    </AppLayout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <I18nProvider>
        <AppContent />
      </I18nProvider>
    </AuthProvider>
  );
}
