import { Navigate, Route, Routes } from 'react-router-dom';
import { NavShell } from './components/NavShell';
import { RequireAuth, RequireGuest } from './components/RequireAuth';
import { ToastHost } from './components/ToastHost';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import DashboardPage from './pages/DashboardPage';
import SchedulePage from './pages/SchedulePage';
import StudyPage from './pages/StudyPage';
import SessionTimerPage from './pages/SessionTimerPage';
import StatsPage from './pages/StatsPage';
import ProfilePage from './pages/ProfilePage';
import UpgradePage from './pages/UpgradePage';

export default function App() {
  return (
    <>
      <ToastHost />
      <Routes>
        <Route element={<RequireGuest />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
        </Route>

        <Route element={<RequireAuth />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/session/:id" element={<SessionTimerPage />} />
          <Route path="/upgrade" element={<UpgradePage />} />

          <Route element={<NavShell />}>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/schedule" element={<SchedulePage />} />
            <Route path="/study" element={<StudyPage />} />
            <Route path="/stats" element={<StatsPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}
