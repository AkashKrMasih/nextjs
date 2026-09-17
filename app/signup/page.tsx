'use client';

import { useState, useActionState } from 'react';
import { signup } from '@/app/users/actions';

export default function SignupPage() {
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [state, formAction, pending] = useActionState(signup, undefined);

  function validateEmail(value: string) {
    if (value.length === 0) return 'Email is required';
    const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    return valid ? '' : 'Enter a valid email address';
  }

  function validatePassword(value: string) {
    if (value.length === 0) return 'Password is required';
    return value.length >= 8 ? '' : 'Password must be at least 8 characters';
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

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const form = e.currentTarget;
    const email = (form.elements.namedItem('email') as HTMLInputElement).value;
    const password = (form.elements.namedItem('password') as HTMLInputElement).value;

    const emailErr = validateEmail(email);
    const passwordErr = validatePassword(password);

    setEmailError(emailErr);
    setPasswordError(passwordErr);

    if (emailErr || passwordErr) {
      e.preventDefault(); // stops the server action from firing
    }
  }

  return (
    <div className="page">
      <div className="card">
        <div className="brand-mark">
          <svg viewBox="0 0 24 24">
            <path d="M12 2 2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
        </div>

        <h1>Create your account</h1>
        <p className="subtitle">
          Sign up to start saving your work and picking up where you left off.
        </p>

        <form action={formAction} onSubmit={handleSubmit} noValidate>
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
              minLength={8}
              autoComplete="new-password"
              className={passwordError ? 'invalid' : ''}
              onBlur={(e) => setPasswordError(validatePassword(e.target.value))}
              onChange={(e) => passwordError && setPasswordError(validatePassword(e.target.value))}
            />
            <label htmlFor="password">Password</label>
          </div>
          <p className={`supporting-text ${passwordError ? 'error' : ''}`}>
            {passwordError || 'Use 8 or more characters'}
          </p>

          {state?.error && <p className="supporting-text error">{state.error}</p>}

          <button type="submit" onClick={handleRipple} disabled={pending}>
            {pending ? 'Creating account…' : 'Create account'}
          </button>
        </form>

        <div className="divider-row">
          <div className="line" />
          <span>or</span>
          <div className="line" />
        </div>

        <p className="footer-text">
          Already have an account? <a href="/login">Log in</a>
        </p>
      </div>
    </div>
  );
}