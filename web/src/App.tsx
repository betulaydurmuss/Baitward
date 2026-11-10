import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './brand/Logo';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
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
import { SignInPage } from './pages/auth/SignInPage';
import { SignUpPage } from './pages/auth/SignUpPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { TwoFactorSetupPage } from './pages/auth/TwoFactorSetupPage';

export function App() {
  const { t } = useTranslation();
  const { status, signOut } = useAuth();
  const navigate = useNavigate();

  async function onSignOut() {
    await signOut();
    navigate('/signin');
  }

  return (
    <>
      <header className="app-header">
        <Link to="/" aria-label={t('appName')} style={{ textDecoration: 'none' }}>
          <Logo variant="full" size={28} />
        </Link>
        <nav className="app-nav">
          <Link to="/">{t('nav.overview')}</Link>
          {status === 'authenticated' ? (
            <>
              <Link to="/dashboard">{t('nav.dashboard')}</Link>
              <Link to="/campaigns">{t('nav.campaigns')}</Link>
              <Link to="/targets">{t('nav.targets')}</Link>
              <Link to="/templates">{t('nav.templates')}</Link>
              <Link to="/landing">{t('nav.landing')}</Link>
              <Link to="/training-modules">{t('nav.training')}</Link>
              <Link to="/sessions">{t('nav.sessions')}</Link>
              <button className="lang-switch" onClick={onSignOut}>
                {t('nav.signOut')}
              </button>
            </>
          ) : (
            <Link to="/signin">{t('nav.signIn')}</Link>
          )}
          <LanguageSwitcher />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/caught" element={<CaughtPage />} />
          <Route path="/styleguide" element={<StyleguidePage />} />
          <Route path="/training/:token" element={<TrainingScreen />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/2fa-setup" element={<TwoFactorSetupPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns"
            element={
              <ProtectedRoute>
                <CampaignsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/campaigns/:id"
            element={
              <ProtectedRoute>
                <CampaignDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/targets"
            element={
              <ProtectedRoute>
                <TargetsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/templates"
            element={
              <ProtectedRoute>
                <TemplatesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/landing"
            element={
              <ProtectedRoute>
                <LandingPagesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/training-modules"
            element={
              <ProtectedRoute>
                <TrainingEditorPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/sessions"
            element={
              <ProtectedRoute>
                <SessionsPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </>
  );
}
