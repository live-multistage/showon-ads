'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Checkbox, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useRegisterMutation } from '../mutations/use-register.mutation';
import { useResendVerificationMutation } from '../mutations/use-resend-verification.mutation';
import { AdsMarketingPanel } from './AdsMarketingPanel';
import styles from './SignupForm.module.scss';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SITE_URL = 'https://showon.io';

type Field = 'displayName' | 'email' | 'password' | 'acceptTerms';

interface ValidationError {
  field: Field;
  message: string;
}

interface SignupFormProps {
  // Prefilled from the `?email=` query param (e.g. an invite link) so the
  // invitee doesn't retype it — and doesn't accidentally sign up under a
  // different address than the one that was invited. Stays editable.
  initialEmail?: string | null;
}

function validate(
  displayName: string,
  email: string,
  password: string,
  acceptTerms: boolean,
): ValidationError | null {
  if (!displayName.trim()) return { field: 'displayName', message: 'Informe seu nome.' };
  if (!EMAIL_PATTERN.test(email.trim())) return { field: 'email', message: 'Informe um e-mail válido.' };
  if (password.length < 8) {
    return { field: 'password', message: 'A senha precisa ter ao menos 8 caracteres.' };
  }
  if (!acceptTerms) {
    return {
      field: 'acceptTerms',
      message: 'Aceite os Termos de Uso e a Política de Privacidade para continuar.',
    };
  }
  return null;
}

// Registration requires email verification before the account can log in —
// there is no token to hand off, so this form ends on a check-email state.
// The advertiser onboarding step (AdvertiserOnboardingForm) happens after the
// user verifies and logs in, via AuthGuard.
export function SignupForm({ initialEmail }: SignupFormProps) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(initialEmail ?? '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [validationError, setValidationError] = useState<ValidationError | null>(null);
  const { mutate, isPending, error } = useRegisterMutation();
  const resend = useResendVerificationMutation();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const invalid = validate(displayName, email, password, acceptTerms);
    setValidationError(invalid);
    if (invalid) return;

    const trimmedEmail = email.trim();
    mutate(
      { email: trimmedEmail, displayName: displayName.trim(), password, acceptTerms: true },
      { onSuccess: () => setSubmittedEmail(trimmedEmail) },
    );
  }

  function handleResend() {
    if (!submittedEmail) return;
    resend.mutate({ email: submittedEmail }, { onSuccess: () => setResent(true) });
  }

  const errorMessage = validationError?.message ?? (error ? normalizeError(error).message : null);

  function fieldProps(field: Field) {
    const invalid = validationError?.field === field;
    return {
      className: styles.input,
      disabled: isPending,
      'aria-invalid': invalid || undefined,
      'aria-describedby': invalid ? 'signup-error' : undefined,
    };
  }

  return (
    <div className={styles.root}>
      <AdsMarketingPanel />

      <div className={styles.formPanel}>
        <div className={styles.topBar}>
          <a href={SITE_URL} className={styles.backLink}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M19 12H5M11 18l-6-6 6-6" />
            </svg>
            VOLTAR AO SITE
          </a>
        </div>

        {submittedEmail ? (
          <div className={styles.content}>
            <div className={styles.mailBadge} aria-hidden="true">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path d="m3 8 9 6 9-6" />
              </svg>
            </div>
            <h2 className={styles.sentTitle}>Confira seu e-mail</h2>
            <p className={styles.sentText}>
              Enviamos um link de confirmação para <strong>{submittedEmail}</strong>. Abra-o para
              confirmar sua conta.
            </p>

            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleResend}
              disabled={resend.isPending || resent}
            >
              Reenviar e-mail
            </button>
            {resent && <p className={styles.notice}>Se houver uma conta pendente, enviamos um novo e-mail.</p>}
            {resend.isError && (
              <p className={`${styles.error} ${styles.resendError}`} role="alert">
                Não foi possível reenviar agora. Tente novamente em instantes.
              </p>
            )}

            <p className={styles.switchAuth}>
              Já tem uma conta? <Link href="/login" className={styles.link}>Entrar →</Link>
            </p>
          </div>
        ) : (
          <div className={styles.content}>
            <p className={styles.eyebrow}>CRIAR CONTA · ANUNCIANTE</p>
            <h2 className={styles.title}>Crie sua conta</h2>
            <p className={styles.subtitle}>Comece a anunciar na plataforma live-show em minutos.</p>

            <form onSubmit={handleSubmit} className={styles.form} noValidate>
              <div>
                <Label htmlFor="displayName" className={styles.label}>Nome</Label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <circle cx="12" cy="8" r="3.4" /><path d="M5 20a7 7 0 0 1 14 0" />
                  </svg>
                  <Input
                    id="displayName"
                    autoComplete="name"
                    placeholder="Seu nome"
                    value={displayName}
                    onChange={(event) => setDisplayName(event.target.value)}
                    {...fieldProps('displayName')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="email" className={styles.label}>E-mail</Label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" />
                  </svg>
                  <Input
                    id="email"
                    type="email"
                    autoComplete="email"
                    placeholder="voce@empresa.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    {...fieldProps('email')}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="password" className={styles.label}>Senha</Label>
                <div className={styles.inputWrapper}>
                  <svg className={styles.inputIcon} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <rect x="4" y="10" width="16" height="11" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" />
                  </svg>
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Mínimo 8 caracteres"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    {...fieldProps('password')}
                  />
                  <button
                    type="button"
                    className={styles.togglePassword}
                    onClick={() => setShowPassword((shown) => !shown)}
                    aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                    aria-pressed={showPassword}
                  >
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className={styles.termsRow}>
                <Checkbox
                  id="acceptTerms"
                  checked={acceptTerms}
                  onCheckedChange={(checked) => setAcceptTerms(checked === true)}
                  disabled={isPending}
                  aria-invalid={validationError?.field === 'acceptTerms' || undefined}
                  aria-describedby={validationError?.field === 'acceptTerms' ? 'signup-error' : undefined}
                />
                <Label htmlFor="acceptTerms" className={styles.termsLabel}>
                  <span>
                    Li e aceito os{' '}
                    <a href={`${SITE_URL}/termos`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      Termos de Uso
                    </a>{' '}
                    e a{' '}
                    <a href={`${SITE_URL}/privacidade`} target="_blank" rel="noopener noreferrer" className={styles.link}>
                      Política de Privacidade
                    </a>
                    .
                  </span>
                </Label>
              </div>

              {errorMessage && (
                <p id="signup-error" className={styles.error} role="alert">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true">
                    <circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" />
                  </svg>
                  {errorMessage}
                </p>
              )}

              <Button type="submit" disabled={isPending} className={styles.btnSubmit}>
                {isPending && <span className={styles.spinner} aria-hidden="true" />}
                {isPending ? 'Criando conta…' : 'Continuar'}
                {!isPending && (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                )}
              </Button>
            </form>

            <p className={styles.switchAuth}>
              Já tem uma conta? <Link href="/login" className={styles.link}>Entrar →</Link>
            </p>
          </div>
        )}

        <div className={styles.footer}>
          <span className={styles.secure}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z" /><path d="M9 12l2 2 4-4" />
            </svg>
            CADASTRO PROTEGIDO POR CRIPTOGRAFIA
          </span>
          <nav className={styles.footerLinks} aria-label="Links legais">
            <a href={`${SITE_URL}/termos`}>TERMOS</a>
            <a href={`${SITE_URL}/privacidade`}>PRIVACIDADE</a>
            <a href={`${SITE_URL}/help`}>AJUDA</a>
          </nav>
        </div>
      </div>
    </div>
  );
}
