// Layout for pages without the app sidebar: the marketing home, the sign-in flow,
// and the recipient-facing training/awareness pages. A slim glass top bar only.
import { Link, Outlet } from 'react-router-dom';
import { Logo } from '../brand/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';

export function PublicLayout() {
  return (
    <>
      <header className="public-topbar">
        <Link to="/" aria-label="Baitward">
          <Logo variant="full" size={26} />
        </Link>
        <LanguageSwitcher />
      </header>
      <main className="public-main">
        <Outlet />
      </main>
    </>
  );
}
