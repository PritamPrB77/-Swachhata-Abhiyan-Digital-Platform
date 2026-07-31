import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { AppShell } from "@/components/AppShell";
import { LandingPage } from "@/pages/LandingPage";
import { HomePage } from "@/pages/HomePage";
import { ComplaintsPage } from "@/pages/ComplaintsPage";
import { DriverTrackPage } from "@/pages/DriverTrackPage";
import { FleetMapPage } from "@/pages/FleetMapPage";
import { DrivesPage } from "@/pages/DrivesPage";
import { RewardsPage } from "@/pages/gamification/RewardsPage";
import { ProfilePage } from "@/pages/ProfilePage";
import { AwarenessPage } from "@/pages/AwarenessPage";
import { ReportsPage } from "@/pages/ReportsPage";

function Protected() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
}

function RewardsGate() {
  const { user } = useAuth();
  if (user?.role !== "citizen" && user?.role !== "driver") {
    return <Navigate to="/app" replace />;
  }
  return <RewardsPage />;
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route element={<Protected />}>
          <Route path="/app" element={<AppShell />}>
            <Route index element={<HomePage />} />
            <Route path="complaints" element={<ComplaintsPage />} />
            <Route path="track" element={<DriverTrackPage />} />
            <Route path="fleet" element={<FleetMapPage />} />
            <Route path="drives" element={<DrivesPage />} />
            <Route path="awareness" element={<AwarenessPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="rewards" element={<RewardsGate />} />
            <Route path="profile" element={<ProfilePage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
