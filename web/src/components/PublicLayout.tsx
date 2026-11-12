// Layout for pages without the app sidebar: the marketing home, the sign-in flow,
// and the recipient-facing training/awareness pages. A slim glass top bar with a
// sign-in link so visitors can always reach the app.
import { Link, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from '../brand/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { ThemeToggle } from './ThemeToggle';

export function PublicLayout() {
  const { t } = useTranslation();
  return (
    <>
      <header className="public-topbar">
        <Link to="/" aria-label="Baitward">
          <Logo variant="full" size={26} />
        </Link>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
          <Link to="/signin" className="nav-link" style={{ padding: '8px 12px' }}>
            {t('nav.signIn')}
          </Link>
          <ThemeToggle />
          <LanguageSwitcher />
        </nav>
      </header>
      <main className="public-main">
        <Outlet />
      </main>
    </>
  );
}
