// Gates routes that require a signed-in user. While the initial silent refresh is
// in flight it shows nothing; once resolved it either renders the page or redirects
// to sign-in.
import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../auth/AuthContext';

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  if (status === 'loading') return null;
  if (status === 'anonymous') return <Navigate to="/signin" replace />;
  return <>{children}</>;
}
