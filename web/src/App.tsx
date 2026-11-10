import { Link, Route, Routes, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './brand/Logo';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './auth/AuthContext';
import { HomePage } from './pages/HomePage';
import { BrandPage } from './pages/BrandPage';
import { SessionsPage } from './pages/SessionsPage';
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
          <Link to="/brand">{t('nav.brand')}</Link>
          {status === 'authenticated' ? (
            <>
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
          <Route path="/brand" element={<BrandPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/2fa-setup" element={<TwoFactorSetupPage />} />
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
