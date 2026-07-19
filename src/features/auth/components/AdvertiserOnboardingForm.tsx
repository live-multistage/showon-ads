'use client';

import { useState, type FormEvent } from 'react';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useCreateAdvertiserMutation } from '@/features/advertisements/mutations/use-create-advertiser.mutation';
import styles from './AdvertiserOnboardingForm.module.scss';

interface AdvertiserOnboardingFormProps {
  title?: string;
  description?: string;
  // Optional: the signup flow navigates away on success; the guard's
  // zero-accounts step needs nothing more than the query invalidation the
  // mutation already does (see use-create-advertiser.mutation.ts).
  onSuccess?: () => void;
}

// The single "company step" reused by both the signup flow (step 2, after
// user-create) and AuthGuard's inline creation step for authenticated users
// with zero advertiser accounts.
export function AdvertiserOnboardingForm({
  title = 'Create your advertiser account',
  description,
  onSuccess,
}: AdvertiserOnboardingFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error } = useCreateAdvertiserMutation();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!companyName.trim()) {
      setValidationError('Enter your company name.');
      return;
    }

    setValidationError(null);
    mutate({ name: companyName.trim() }, { onSuccess });
  }

  const errorMessage = validationError ?? (error ? normalizeError(error).message : null);

  return (
    <Card className={styles.card}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className={styles.form} noValidate>
          <div className={styles.field}>
            <Label htmlFor="companyName">Company name</Label>
            <Input
              id="companyName"
              autoComplete="organization"
              value={companyName}
              onChange={(event) => setCompanyName(event.target.value)}
              disabled={isPending}
            />
          </div>

          {errorMessage && (
            <p className={styles.error} role="alert">
              {errorMessage}
            </p>
          )}

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Creating…' : 'Create account'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
