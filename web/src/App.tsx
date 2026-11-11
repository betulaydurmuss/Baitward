import { Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { PublicLayout } from './components/PublicLayout';
import { HomePage } from './pages/HomePage';
import { SessionsPage } from './pages/SessionsPage';
import { TargetsPage } from './pages/TargetsPage';
import { TemplatesPage } from './pages/TemplatesPage';
import { CampaignsPage } from './pages/CampaignsPage';
import { CampaignDetailPage } from './pages/CampaignDetailPage';
import { DashboardPage } from './pages/DashboardPage';
import { StyleguidePage } from './pages/StyleguidePage';
import { CaughtPage } from './pages/CaughtPage';
import { LandingPagesPage } from './pages/LandingPagesPage';
import { TrainingEditorPage } from './pages/TrainingEditorPage';
import { TrainingScreen } from './pages/TrainingScreen';
import { ReportsPage } from './pages/ReportsPage';
import { RiskPage } from './pages/RiskPage';
import { AdminPage } from './pages/AdminPage';
import { DomainsPage } from './pages/DomainsPage';
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { TwoFactorSetupPage } from './pages/auth/TwoFactorSetupPage';

export function App() {
  return (
    <Routes>
      {/* Public pages: marketing, auth flow, and recipient-facing screens. */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/signin" element={<SignInPage />} />
        <Route path="/signup" element={<SignUpPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/2fa-setup" element={<TwoFactorSetupPage />} />
        <Route path="/caught" element={<CaughtPage />} />
        <Route path="/styleguide" element={<StyleguidePage />} />
        <Route path="/training/:token" element={<TrainingScreen />} />
      </Route>

      {/* Authenticated app: the sidebar shell guards these routes. */}
      <Route element={<AppShell />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/campaigns" element={<CampaignsPage />} />
        <Route path="/campaigns/:id" element={<CampaignDetailPage />} />
        <Route path="/targets" element={<TargetsPage />} />
        <Route path="/templates" element={<TemplatesPage />} />
        <Route path="/landing" element={<LandingPagesPage />} />
        <Route path="/training-modules" element={<TrainingEditorPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/risk" element={<RiskPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/domains" element={<DomainsPage />} />
        <Route path="/sessions" element={<SessionsPage />} />
      </Route>
    </Routes>
  );
}
