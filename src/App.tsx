

// src/App.tsx
import { Routes, Route } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { Login } from './Login';
import { RequireAuth } from './RequireAuth';
import Dashboard from './Dashboard';

export default function App() {
  const { user } = useAuthenticator((context) => [context.user]);

  return (
    <Routes>
      {/* Route 1: Root Path "/"
         - Serves as the Login Page.
         - Serves as the Callback handler (e.g., http://localhost:5173/?code=...).
         - The <Login> component detects the code/user and redirects to /dashboard.
      */}
      <Route path="/" element={<Login />} />
      
      {/* Route 2: Protected Dashboard 
         - Only accessible if authenticated.
         - Protected by <RequireAuth>.
      */}
      <Route 
        path="/dashboard" 
        element={
          <RequireAuth>
            <Dashboard user={user} />
          </RequireAuth>
        } 
      />
    </Routes>
  );
}