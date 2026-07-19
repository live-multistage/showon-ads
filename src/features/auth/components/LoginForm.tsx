'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useLoginMutation } from '../mutations/use-login.mutation';
import styles from './LoginForm.module.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function LoginForm() {
  const router = useRouter();
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
    mutate({ email: email.trim(), password }, { onSuccess: () => router.push('/') });
  }

  const errorMessage = validationError ?? (error ? normalizeError(error).message : null);

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>Log in</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
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
              autoComplete="current-password"
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
            {isPending ? 'Logging in…' : 'Log in'}
          </Button>
        </form>

        <p>
          No account? <Link href="/signup">Sign up</Link>
        </p>
      </CardContent>
    </Card>
  );
}
