import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App'
import { AuthProvider } from "react-oidc-context";

const onSigninCallback = () => {
  // Remove the query parameters from the URL
  window.history.replaceState({}, document.title, window.location.pathname);
};

// Get configuration from environment variables
const region = import.meta.env.VITE_AWS_REGION || "eu-north-1";
const userPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID || "eu-north-1_fz1hEPl5w";
const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID || "1tc5uofjkv4cjbk336vmgp9evr";
const redirectUri = import.meta.env.VITE_REDIRECT_URI || window.location.origin;

const oidcConfig = {
  authority: `https://cognito-idp.${region}.amazonaws.com/${userPoolId}`,
  client_id: clientId,
  redirect_uri: redirectUri,
  response_type: "code",
  scope: "email openid phone profile",
  automaticSilentRenew: true,
  onSigninCallback: onSigninCallback,
};

// Log configuration in development mode
if (import.meta.env.DEV) {
  console.log('OIDC Config:', {
    authority: oidcConfig.authority,
    clientId: oidcConfig.client_id,
    redirectUri: oidcConfig.redirect_uri,
  });
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
