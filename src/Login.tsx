import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { Hub } from 'aws-amplify/utils';
import '@aws-amplify/ui-react/styles.css';

const formFields = {
  signUp: {
    username: { order: 1 },
    name: { label: 'Name', placeholder: 'Enter full name', order: 2, isRequired: true },
    email: { order: 3 },
    password: { order: 4 },
    confirm_password: { order: 5 }
  },
};

export function Login() {
  const { route, user } = useAuthenticator((context) => [context.route, context.user]);
  const navigate = useNavigate();

  useEffect(() => {
    // FIX: Check if 'user' exists OR route is 'authenticated'
    // This fixes the "stuck on Redirecting" bug
    if (route === 'authenticated' || user) {
      navigate('/dashboard', { replace: true });
    }

    const unsubscribe = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signInWithRedirect' || payload.event === 'signedIn') {
        navigate('/dashboard', { replace: true });
      }
    });

    return () => unsubscribe();
  }, [route, user, navigate]);

  return (
    <div style={styles.container}>
      {/* If we are authenticated, we show the "Redirecting" message.
        BUT we still render the Authenticator hidden below so it can finish its work.
      */}
      {(route === 'authenticated' || user) && (
        <div style={{ position: 'absolute', zIndex: 10, background: '#f8f9fa', padding: 20 }}>
          <h2>Redirecting...</h2>
        </div>
      )}

      <div style={{ marginBottom: '20px', textAlign: 'center', color: '#333' }}>
        <h2>Welcome Back</h2>
        <p>Please sign in or create an account</p>
      </div>

      <Authenticator 
        socialProviders={['google']} 
        signUpAttributes={['name']} 
        formFields={formFields}
      />
    </div>
  );
}

const styles = {
  container: {
    display: 'flex', 
    flexDirection: 'column' as const,
    justifyContent: 'center', 
    alignItems: 'center',
    minHeight: '100vh',
    backgroundColor: '#f8f9fa',
    position: 'relative' as const
  }
};