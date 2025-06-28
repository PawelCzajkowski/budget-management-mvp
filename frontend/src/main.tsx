import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css'
import App from './App'
import { AuthProvider } from "react-oidc-context";

const oidcConfig = {
  authority: "https://cognito-idp.eu-north-1.amazonaws.com/eu-north-1_fz1hEPl5w",
  client_id: "1tc5uofjkv4cjbk336vmgp9evr",
  redirect_uri: "http://localhost:5173/",
  response_type: "code",
  scope: "email openid phone profile",
  automaticSilentRenew: true, // Uncomment if you want silent renew
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider {...oidcConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);
