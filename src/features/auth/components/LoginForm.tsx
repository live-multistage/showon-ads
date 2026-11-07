'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Button, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useLoginMutation } from '../mutations/use-login.mutation';
import { safeRedirectTarget } from '../utils/safe-redirect';
import { AdsMarketingPanel } from './AdsMarketingPanel';
import styles from './LoginForm.module.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = 'https://showon.io';
const FORGOT_PASSWORD_URL = `${SITE_URL}/forgot-password`;
const INVALID_CREDENTIALS_STATUS = 401;
const GENERIC_LOGIN_ERROR = 'Não foi possível entrar agora. Tente de novo.';

export function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error } = useLoginMutation();
  const redirectTarget = safeRedirectTarget(useSearchParams().get('redirect'));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !EMAIL_PATTERN.test(email)) {
      setValidationError('Informe um e-mail válido.');
      return;
    }
    if (!password) {
      setValidationError('Informe sua senha.');
      return;
    }

    setValidationError(null);
    // Full-document navigation, not router.push: the session-derived guard
    // (AuthGuard) is mounted in the persistent root layout and reads the token
    // once on mount, so a client-side push would leave it seeing the pre-login
    // (unauthenticated) state and bounce back to /login. A full load remounts
    // the tree so it reads the freshly-stored session — same pattern logout uses.
    mutate({ email: email.trim(), password }, { onSuccess: () => window.location.assign(redirectTarget) });
  }

  const errorMessage = validationError ?? (error ? loginErrorMessage(error) : null);

  return (
    <div className={styles.root}>
      <AdsMarketingPanel />

      <div className={styles.formPanel}>
        <div className={styles.formCard}>
          <h2 className={styles.formTitle}>Entrar</h2>
          <p className={styles.formSubtitle}>Acesse sua conta do Ads Manager.</p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div className={styles.field}>
              <Label htmlFor="email" className={styles.label}>E-mail</Label>
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
              <Label htmlFor="password" className={styles.label}>Senha</Label>
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
              <a href={FORGOT_PASSWORD_URL} target="_blank" rel="noopener noreferrer" className={styles.link}>
                Esqueci a senha ↗
              </a>
            </div>

            {errorMessage && (
              <p className={styles.errorBanner} role="alert">
                {errorMessage}
              </p>
            )}

            <Button type="submit" disabled={isPending} className={styles.btnSubmit}>
              {isPending ? 'Entrando…' : 'Entrar'}
            </Button>
          </form>

          <p className={styles.footer}>
            Não tem conta? <Link href="/signup" className={styles.link}>Cadastre-se</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function loginErrorMessage(error: unknown): string {
  const normalized = normalizeError(error);
  if (normalized.code === 'EMAIL_NOT_VERIFIED') return 'Confirme seu e-mail antes de entrar.';
  if (normalized.status === INVALID_CREDENTIALS_STATUS) return 'E-mail ou senha incorretos.';
  return GENERIC_LOGIN_ERROR;
}
