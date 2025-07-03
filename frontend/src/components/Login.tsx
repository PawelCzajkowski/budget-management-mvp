import React from 'react';
import { useAuth } from 'react-oidc-context';

const Login: React.FC = () => {
  const auth = useAuth();

  if (auth.isLoading) return <div>Loading...</div>;
  if (auth.error) return <div>Encountering error... {auth.error.message}</div>;

  if (auth.isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center">
        <button
          className="px-4 py-2 rounded font-semibold shadow transition-colors bg-blue-500 hover:bg-blue-700 text-white"
          onClick={() => auth.removeUser()}
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <button
        className="px-4 py-2 rounded font-semibold shadow transition-colors bg-blue-500 hover:bg-blue-700 text-white"
        onClick={() => auth.signinRedirect()}
      >
        Sign in
      </button>
    </div>
  );
};

export default Login; 