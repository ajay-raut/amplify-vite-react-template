
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom'; // <--- Import Router
import { Authenticator } from '@aws-amplify/ui-react'; // <--- Import Provider
import App from './App';
import { Amplify } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';

// ==========================================
// CONFIGURATION (From previous steps)
// ==========================================
const CONFIG = {
  REGION: 'ap-south-1',
  USER_POOL_ID: 'xxxxxxxxxxx', // Use your REAL values
  USER_POOL_CLIENT_ID: 'xxxxxxxxxxx', // Use your REAL values
  COGNITO_DOMAIN: 'auth-app-vedant-2026-test.auth.ap-south-1.amazoncognito.com',
  REDIRECT_URI: 'http://localhost:5173/',
  LOGOUT_URI: 'http://localhost:5173/',

  IDENTITY_POOL_ID: 'ap-south-1:xxxxxxxxxxx', // <--- Added
  BUCKET_NAME: 'xxxxxxxxxxx' // <--- Added
};

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: CONFIG.USER_POOL_ID,
      userPoolClientId: CONFIG.USER_POOL_CLIENT_ID,
      identityPoolId: CONFIG.IDENTITY_POOL_ID, // <--- Added
      loginWith: {
        oauth: {
          domain: CONFIG.COGNITO_DOMAIN,
          scopes: ['email', 'profile', 'openid'],
          redirectSignIn: [CONFIG.REDIRECT_URI],
          redirectSignOut: [CONFIG.LOGOUT_URI],
          responseType: 'code',
        }
      }
    }
  },
  Storage: {
    S3: {
      bucket: CONFIG.BUCKET_NAME,
      region: CONFIG.REGION,
    }
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <Authenticator.Provider> {/* <--- Wraps App to share Auth state */}
    <BrowserRouter>        {/* <--- Wraps App to enable Routing */}
      <App />
    </BrowserRouter>
  </Authenticator.Provider>
);
