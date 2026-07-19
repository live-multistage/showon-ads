'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useRegisterMutation } from '../mutations/use-register.mutation';
import styles from './SignupForm.module.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface SignupFormProps {
  onRegistered: () => void;
}

// Step 1 of signup: user account fields. On success the caller (SignupFlow)
// advances to the company step, which reuses AdvertiserOnboardingForm.
export function SignupForm({ onRegistered }: SignupFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error } = useRegisterMutation();

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
    mutate(
      { email: email.trim(), displayName: displayName.trim(), password },
      { onSuccess: onRegistered },
    );
  }

  const errorMessage = validationError ?? (error ? normalizeError(error).message : null);

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
