import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User } from 'lucide-react';
import '../styles/forms.css';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('candidate');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      navigate(`/${user.role || 'candidate'}/dashboard`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="form-wrapper">
        <div className="auth-card">
          <div className="form-header">
            <h1>Welcome Back</h1>
            <p>Sign in to your talent acquisition account</p>
          </div>

          {error && (
            <div className="form-error">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
              </svg>
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="form-group">
              <label>
                <Mail size={18} />
                Email Address
              </label>
              <div className="input-wrapper">
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="form-input"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>
                <Lock size={18} />
                Password
              </label>
              <div className="input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="form-input"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="password-toggle"
                  title={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                      <path d="M11.83 9L15.64 12.81c.04-.25.06-.52.06-.81 0-1.66-1.34-3-3-3-.29 0-.56.02-.81.07zM7.0 6.87c1.37-1.26 3.13-2.13 5-2.13 3.59 0 6.69 2.39 7.71 5.64.34 1.02.53 2.1.53 3.2.0.84-.11 1.65-.32 2.44l3.15 3.15c2.27-1.99 4.18-4.78 5.33-8.03-1.41-4.3-5.42-7.45-10.14-7.45-1.9 0-3.74.5-5.32 1.72l2.6 2.6zM19.07 4.93L17.25 3.11 12 8.35 6.85 3.2 5.03 5.02 10.18 10.17 5.07 15.25l1.82 1.82L12 12l5.15 5.15 1.82-1.82L13.82 12l5.25-5.07zM12 4C6.48 4 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l-3.12-3.12c-.78.31-1.64.48-2.52.48-3.35 0-6.08-2.73-6.08-6.08 0-.88.17-1.74.48-2.52l-2.14-2.14C2.3 9.03 2 10.47 2 12c0 5.25 3.07 9.8 7.55 11.99l1.42-1.42C6.62 20.30 4 16.68 4 12.45c0-1.23.2-2.41.55-3.54" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            <div className="form-group">
              <label>
                <User size={18} />
                Login as
              </label>
              <select value={role} onChange={e => setRole(e.target.value)} className="form-select">
                <option value="candidate">Job Candidate</option>
                <option value="recruiter">Recruiter/HR</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <div className="form-actions">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary"
              >
                {loading ? (
                  <>
                    <div className="spinner"></div>
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </div>
          </form>

          <div className="form-footer">
            <p>Don't have an account?</p>
            <Link to="/register" className="text-lg font-semibold">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
