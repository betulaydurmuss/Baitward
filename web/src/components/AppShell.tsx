// The authenticated app layout: a glass sidebar with icon nav on the left and the
// routed page on the right. Also guards access — while the initial silent refresh
// runs it shows nothing, then either renders or redirects to sign-in.
import { Link, NavLink, Navigate, Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Send,
  Users,
  Mail,
  FileText,
  GraduationCap,
  BarChart3,
  ShieldAlert,
  Monitor,
  ShieldCheck,
  Globe,
  LogOut,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Logo } from '../brand/Logo';
import { LanguageSwitcher } from './LanguageSwitcher';
import { useAuth } from '../auth/AuthContext';

const NAV: { to: string; icon: LucideIcon; key: string; adminOnly?: boolean }[] = [
  { to: '/dashboard', icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: '/campaigns', icon: Send, key: 'nav.campaigns' },
  { to: '/targets', icon: Users, key: 'nav.targets' },
  { to: '/templates', icon: Mail, key: 'nav.templates' },
  { to: '/landing', icon: FileText, key: 'nav.landing' },
  { to: '/training-modules', icon: GraduationCap, key: 'nav.training' },
  { to: '/reports', icon: BarChart3, key: 'nav.reports' },
  { to: '/risk', icon: ShieldAlert, key: 'nav.risk' },
  { to: '/admin', icon: ShieldCheck, key: 'nav.admin', adminOnly: true },
  { to: '/domains', icon: Globe, key: 'nav.domains', adminOnly: true },
  { to: '/sessions', icon: Monitor, key: 'nav.sessions' },
];

export function AppShell() {
  const { t } = useTranslation();
  const { status, user, signOut } = useAuth();
  const navigate = useNavigate();

  if (status === 'loading') return null;
  if (status === 'anonymous') return <Navigate to="/signin" replace />;

  const isAdmin = user?.role === 'org_admin' || user?.role === 'super_admin';
  const items = NAV.filter((i) => !i.adminOnly || isAdmin);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <Link to="/dashboard" className="sidebar-brand" aria-label={t('appName')}>
          <Logo variant="full" size={26} />
        </Link>
        <nav className="nav-section">
          {items.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
            >
              <Icon size={17} aria-hidden="true" />
              {t(key)}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <LanguageSwitcher />
          <button
            className="lang-switch"
            onClick={async () => {
              await signOut();
              navigate('/signin');
            }}
          >
            <LogOut size={14} aria-hidden="true" />
            {t('nav.signOut')}
          </button>
        </div>
      </aside>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
