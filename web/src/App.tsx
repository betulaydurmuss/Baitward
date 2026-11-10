import { Link, Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Logo } from './brand/Logo';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { HomePage } from './pages/HomePage';
import { BrandPage } from './pages/BrandPage';

export function App() {
  const { t } = useTranslation();

  return (
    <>
      <header className="app-header">
        <Link to="/" aria-label={t('appName')} style={{ textDecoration: 'none' }}>
          <Logo variant="full" size={28} />
        </Link>
        <nav className="app-nav">
          <Link to="/">{t('nav.overview')}</Link>
          <Link to="/brand">{t('nav.brand')}</Link>
          <LanguageSwitcher />
        </nav>
      </header>

      <main className="app-main">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/brand" element={<BrandPage />} />
        </Routes>
      </main>
    </>
  );
}
