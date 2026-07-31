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

function Protected() {
  const { user } = useAuth();
  if (!user) return <Navigate to="/" replace />;
  return <Outlet />;
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
            <Route path="rewards" element={<RewardsPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
