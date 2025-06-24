import React, { useState } from 'react';
import { login, register } from '../api/routes';
import type { LoginRequest } from '../types/Auth';

const Login: React.FC<{ onLogin: () => void }> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [registerSuccess, setRegisterSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setRegisterSuccess(false);
    try {
      const data: LoginRequest = { email, password };
      if (mode === 'login') {
        const res = await login(data);
        localStorage.setItem('token', res.access_token);
        onLogin();
      } else {
        await register(data);
        setRegisterSuccess(true);
        setMode('login');
        setEmail('');
        setPassword('');
      }
    } catch (err) {
      setError(mode === 'login' ? 'Invalid credentials or server error.' : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded shadow-md w-full max-w-md"
      >
        <h2 className="text-2xl font-bold mb-6 text-center">
          {mode === 'login' ? 'Login' : 'Register'}
        </h2>
        {registerSuccess && (
          <div className="mb-4 text-green-600">Registration successful! Please log in.</div>
        )}
        {error && <div className="mb-4 text-red-500">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email</label>
          <input
            type="email"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            className="w-full border border-gray-300 rounded px-3 py-2"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
          disabled={loading}
        >
          {loading ? (mode === 'login' ? 'Logging in...' : 'Registering...') : (mode === 'login' ? 'Login' : 'Register')}
        </button>
        <div className="mt-4 text-center">
          {mode === 'login' ? (
            <span>
              Don't have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setMode('register');
                  setError(null);
                  setRegisterSuccess(false);
                }}
              >
                Register
              </button>
            </span>
          ) : (
            <span>
              Already have an account?{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => {
                  setMode('login');
                  setError(null);
                }}
              >
                Login
              </button>
            </span>
          )}
        </div>
      </form>
    </div>
  );
};

export default Login; 