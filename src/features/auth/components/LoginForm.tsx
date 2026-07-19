'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useLoginMutation } from '../mutations/use-login.mutation';
import { AdsMarketingPanel } from './AdsMarketingPanel';
import styles from './LoginForm.module.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error } = useLoginMutation();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !EMAIL_PATTERN.test(email)) {
      setValidationError('Enter a valid email address.');
      return;
    }
    if (!password) {
      setValidationError('Enter your password.');
      return;
    }

    setValidationError(null);
    // Full-document navigation, not router.push: the session-derived guard
    // (AuthGuard) is mounted in the persistent root layout and reads the token
    // once on mount, so a client-side push would leave it seeing the pre-login
    // (unauthenticated) state and bounce back to /login. A full load remounts
    // the tree so it reads the freshly-stored session — same pattern logout uses.
    mutate({ email: email.trim(), password }, { onSuccess: () => window.location.assign('/') });
  }

  const errorMessage = validationError ?? (error ? normalizeError(error).message : null);

  return (
    <div className={styles.root}>
      <AdsMarketingPanel />

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Log in</h2>
          <p className={styles.formSubtitle}>Access your Ads Manager account.</p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <Label htmlFor="email" className={styles.label}>Email</Label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2" /><path d="m2 7 10 7 10-7" />
                </svg>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={styles.inputField}
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            <div className={styles.field}>
              <Label htmlFor="password" className={styles.label}>Password</Label>
              <div className={styles.inputWrapper}>
                <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  className={styles.inputField}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  disabled={isPending}
                />
              </div>
            </div>

            {errorMessage && (
              <p className={styles.errorBanner} role="alert">
                {errorMessage}
              </p>
            )}

            <Button type="submit" disabled={isPending} className={styles.btnSubmit}>
              {isPending ? 'Logging in…' : 'Log in'}
            </Button>
          </form>

          <p className={styles.footer}>
            No account? <Link href="/signup" className={styles.link}>Sign up</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
