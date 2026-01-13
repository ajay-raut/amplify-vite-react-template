// src/RequireAuth.tsx
import { useLocation, Navigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';

export function RequireAuth({ children }: { children: JSX.Element }) {
  const { route } = useAuthenticator((context) => [context.route]);
  const location = useLocation();

  if (route !== 'authenticated') {
    // Redirect to the login page, but save the current location they were trying to go to
    return <Navigate to="/" state={{ from: location }} replace />;
  }
  return children;
}