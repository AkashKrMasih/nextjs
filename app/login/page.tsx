// app/login/page.tsx
'use client';

import { useState } from 'react';
import { login } from '@/app/actions/user';

export default function LoginPage() {
  const [emailError, setEmailError] = useState('');
  const [pending, setPending] = useState(false);

  function validateEmail(value: string) {
    if (value.length === 0) return '';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return valid ? '' : 'Enter a valid email address';
  }

  function handleRipple(e: React.MouseEvent<HTMLButtonElement>) {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const ripple = document.createElement('span');
    const size = Math.max(rect.width, rect.height);
    ripple.className = 'ripple';
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${e.clientX - rect.left - size / 2}px`;
    ripple.style.top = `${e.clientY - rect.top - size / 2}px`;
    button.appendChild(ripple);
    setTimeout(() => ripple.remove(), 500);
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24">
            <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1>Welcome back</h1>
        <p className="subtitle">Log in to pick up right where you left off.</p>

        <form action={login} onSubmit={() => setPending(true)} noValidate>
          <div className="field">
            <input
              type="email"
              id="email"
              name="email"
              placeholder=" "
              required
              autoComplete="email"
              className={emailError ? 'invalid' : ''}
              onBlur={(e) => setEmailError(validateEmail(e.target.value))}
              onChange={(e) => emailError && setEmailError(validateEmail(e.target.value))}
            />
            <label htmlFor="email">Email address</label>
          </div>
          <p className={`supporting-text ${emailError ? 'error' : ''}`}>{emailError}</p>

          <div className="field">
            <input
              type="password"
              id="password"
              name="password"
              placeholder=" "
              required
              autoComplete="current-password"
            />
            <label htmlFor="password">Password</label>
          </div>

          <div className="forgot-row">
            <a href="/forgot-password">Forgot password?</a>
          </div>

          <button type="submit" onClick={handleRipple} disabled={pending}>
            {pending ? 'Logging in…' : 'Log in'}
          </button>
        </form>

        <div className="divider-row">
          <div className="line" />
          <span>or</span>
          <div className="line" />
        </div>

        <p className="footer-text">
          Don&apos;t have an account? <a href="/signup">Sign up</a>
        </p>
      </div>

      <style jsx>{`
        .page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(180deg, #f7f2fa 0%, #efe7f5 100%);
          font-family: 'Roboto', system-ui, sans-serif;
          color: #1c1b1f;
          padding: 24px;
        }

        .card {
          width: 100%;
          max-width: 400px;
          background: #fffbfe;
          border-radius: 28px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3), 0 1px 3px rgba(0, 0, 0, 0.15);
          padding: 40px 32px 32px;
        }

        .brand-mark {
          width: 40px;
          height: 40px;
          border-radius: 12px;
          background: #6750a4;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }
        .brand-mark svg {
          width: 22px;
          height: 22px;
          fill: #ffffff;
        }

        h1 {
          font-family: 'Google Sans', 'Roboto', sans-serif;
          font-size: 24px;
          font-weight: 500;
          margin: 0 0 4px;
        }

        .subtitle {
          font-size: 14px;
          color: #49454f;
          margin: 0 0 28px;
          line-height: 1.4;
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .field {
          position: relative;
        }

        .field input {
          width: 100%;
          height: 56px;
          padding: 16px;
          font-size: 16px;
          font-family: inherit;
          color: #1c1b1f;
          background: transparent;
          border: 1px solid #79747e;
          border-radius: 4px;
          outline: none;
          transition: border-color 120ms ease, border-width 120ms ease;
        }

        .field input:hover:not(:focus) {
          border-color: #1c1b1f;
        }

        .field input:focus {
          border-color: #6750a4;
          border-width: 2px;
          padding: 15px;
        }

        .field label {
          position: absolute;
          left: 12px;
          top: 18px;
          padding: 0 4px;
          font-size: 16px;
          color: #49454f;
          background: #fffbfe;
          pointer-events: none;
          transition: all 120ms ease;
        }

        .field input:focus + label,
        .field input:not(:placeholder-shown) + label {
          top: -8px;
          font-size: 12px;
          color: #6750a4;
        }

        .field input:not(:focus):not(:placeholder-shown) + label {
          color: #49454f;
        }

        .field input.invalid {
          border-color: #b3261e;
        }
        .field input.invalid + label {
          color: #b3261e;
        }

        .supporting-text {
          font-size: 12px;
          color: #b3261e;
          margin: -14px 0 0 16px;
          min-height: 16px;
        }

        .forgot-row {
          display: flex;
          justify-content: flex-end;
          margin-top: -12px;
        }
        .forgot-row a {
          font-size: 12px;
          color: #6750a4;
          font-weight: 500;
          text-decoration: none;
        }
        .forgot-row a:hover {
          text-decoration: underline;
        }

        button[type='submit'] {
          position: relative;
          overflow: hidden;
          height: 48px;
          border: none;
          border-radius: 24px;
          background: #6750a4;
          color: #ffffff;
          font-family: inherit;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.1px;
          cursor: pointer;
          margin-top: 8px;
          transition: background 120ms ease, box-shadow 120ms ease;
        }

        button[type='submit']:hover:not(:disabled) {
          background: #56428b;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 1px 3px 1px rgba(0, 0, 0, 0.15);
        }

        button[type='submit']:disabled {
          background: #e7e0ec;
          color: #9e9aa3;
          cursor: not-allowed;
        }

        .divider-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 4px 0;
        }
        .divider-row .line {
          flex: 1;
          height: 1px;
          background: #e7e0ec;
        }
        .divider-row span {
          font-size: 12px;
          color: #49454f;
        }

        .footer-text {
          text-align: center;
          font-size: 14px;
          color: #49454f;
          margin-top: 24px;
        }
        .footer-text a {
          color: #6750a4;
          font-weight: 500;
          text-decoration: none;
        }
        .footer-text a:hover {
          text-decoration: underline;
        }

        :global(.ripple) {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.5);
          transform: scale(0);
          animation: ripple 500ms linear;
          pointer-events: none;
        }
        @keyframes ripple {
          to {
            transform: scale(4);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}