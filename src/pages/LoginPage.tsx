import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import login_page_logo from '../assets/login_page_logo.svg';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { useEffect } from 'react';
import { AuthRole } from '../types';

const LoginPage = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const [email, setEmail] = useState('vohuman@rally.in');
  const [password, setPassword] = useState('Test@123');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<AuthRole>('restaurant');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const expired = sessionStorage.getItem('hivago_session_expired');
    if (expired === 'true') {
      showToast('Your session has expired. Please log in again.', 'warning');
      sessionStorage.removeItem('hivago_session_expired');
    }
  }, [showToast]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login({ email, password }, role, remember);
      showToast('Successfully signed in!', 'success');
      if (role === 'owner') {
        navigate('/owner/outlets');
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      const message = err?.message || (err instanceof Error ? err.message : 'Unable to sign in. Please try again.');
      setError(message);
      showToast(message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-8 sm:px-6 sm:py-10 relative z-50">
      <div className="w-full max-w-md rounded-[20px] border border-slate-200 bg-white p-8 shadow-[0_30px_90px_rgba(15,23,42,0.12)] sm:p-10">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-brand-500 text-3xl text-white">
            <img src={login_page_logo} alt="" />
          </div>
          <h1 className="text-2xl font-semibold text-slate-900">Hivago</h1>
          <p className="mt-2 text-sm text-slate-500">Access for owners, managers and staff.</p>
        </div>

        <div className="mb-6 flex rounded-2xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setRole('restaurant')}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              role === 'restaurant' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Restaurant
          </button>
          <button
            type="button"
            onClick={() => setRole('owner')}
            className={`flex-1 rounded-xl py-2 text-sm font-semibold transition ${
              role === 'owner' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Owner
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <label className="block text-sm font-medium text-slate-700">
            Email address
            <input
              type="email"
              value={email}
              onChange={event => setEmail(event.target.value)}
              className="mt-2 w-full rounded-3xl border border-slate-200 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
            />
          </label>

          <div className="block text-sm font-medium text-slate-700">
            <span>Password</span>
            <div className="relative mt-2">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={event => setPassword(event.target.value)}
                className="w-full rounded-3xl border border-slate-200 bg-slate-50 pl-4 pr-12 py-3 text-slate-900 outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-slate-600 focus:outline-none"
              >
                {showPassword ? (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l18 18" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={remember}
                onChange={event => setRemember(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
              />
              Remember me
            </label>
            <button type="button" className="font-medium text-brand-600 hover:text-brand-700">
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-3xl bg-brand-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:bg-brand-300"
          >
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
