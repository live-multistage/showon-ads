'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useRegisterMutation } from '../mutations/use-register.mutation';
import { useResendVerificationMutation } from '../mutations/use-resend-verification.mutation';
import styles from './SignupForm.module.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupFormProps {
  // Prefilled from the `?email=` query param (e.g. an invite link) so the
  // invitee doesn't retype it — and doesn't accidentally sign up under a
  // different address than the one that was invited. Stays editable.
  initialEmail?: string | null;
}

// Registration now requires email verification before the account can log
// in — there is no token to hand off, so this form no longer chains into the
// company-name step; it just confirms the email was sent. The advertiser
// onboarding step (AdvertiserOnboardingForm) happens after the user verifies
// and logs in, via AuthGuard.
export function SignupForm({ initialEmail }: SignupFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error } = useRegisterMutation();
  const resend = useResendVerificationMutation();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!displayName.trim()) {
      setValidationError('Enter your name.');
      return;
    }
    if (!email.trim() || !EMAIL_PATTERN.test(email)) {
      setValidationError('Enter a valid email address.');
      return;
    }
    if (password.length < 8) {
      setValidationError('Password must be at least 8 characters.');
      return;
    }

    setValidationError(null);
    const trimmedEmail = email.trim();
    mutate(
      { email: trimmedEmail, displayName: displayName.trim(), password },
      { onSuccess: () => setSubmittedEmail(trimmedEmail) },
    );
  }

  function handleResend() {
    if (!submittedEmail) return;
    resend.mutate({ email: submittedEmail }, { onSuccess: () => setResent(true) });
  }

  const errorMessage = validationError ?? (error ? normalizeError(error).message : null);

  if (submittedEmail) {
    return (
      <Card className={styles.card}>
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
        </CardHeader>
        <CardContent>
          <p>We sent a confirmation link to {submittedEmail}. Open it to confirm your account.</p>

          <Button type="button" onClick={handleResend} disabled={resend.isPending || resent}>
            Resend email
          </Button>
          {resent && <p>If there is a pending account, a new email was sent.</p>}
          {resend.isError && <p role="alert">Could not resend right now. Try again shortly.</p>}

          <p>
            Already have an account? <Link href="/login">Log in</Link>
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Create your account</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <Label htmlFor="displayName">Name</Label>
            <Input
              id="displayName"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              disabled={isPending}
            />
          </div>

          <div className={styles.field}>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              disabled={isPending}
            />
          </div>

          {errorMessage && (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating account…' : 'Continue'}
          </Button>
        </form>

        <p>
          Already have an account? <Link href="/login">Log in</Link>
        </p>
      </CardContent>
    </Card>
  );
}
