// app/login/page.tsx
'use client';

import {useActionState, useState} from 'react';
import { login } from '@/app/users/actions';

export default function LoginPage() {
  const [emailError, setEmailError] = useState('');
  const [state, formAction, pending] = useActionState(login, undefined)

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

        <form action={formAction} noValidate>
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

          {state?.error && <p className="form-error">{state.error}</p>}

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
    </div>
  );
}