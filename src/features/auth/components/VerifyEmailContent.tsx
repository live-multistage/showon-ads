'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, Input, Label } from '@live-show/design-system';
import { useVerifyEmailMutation } from '../mutations/use-verify-email.mutation';
import { useResendVerificationMutation } from '../mutations/use-resend-verification.mutation';
import { EmailStatusCard } from './EmailStatusCard';
import styles from './VerifyEmailContent.module.scss';

interface VerifyEmailContentProps {
  token?: string;
}

type VerifyState = 'verifying' | 'success' | 'invalid';

// ponytail: shape check only — the backend is the real validator (and always answers 202).
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function VerifyEmailContent({ token }: VerifyEmailContentProps) {
  const [state, setState] = useState<VerifyState>(token ? 'verifying' : 'invalid');
  const [resendOpen, setResendOpen] = useState(false);
  // Effects run twice under React Strict Mode in dev — guard against
  // verifying (and consuming) the token twice.
  const calledRef = useRef(false);
  const { mutate } = useVerifyEmailMutation({
    onSuccess: () => setState('success'),
    onError: () => setState('invalid'),
  });

  useEffect(() => {
    if (!token || calledRef.current) return;
    calledRef.current = true;
    mutate({ token });
  }, [token, mutate]);

  if (state === 'verifying') {
    return (
      <EmailStatusCard
        variant="loading"
        eyebrow="VERIFICANDO"
        title="Confirmando seu e-mail"
        message="Aguarde um instante enquanto validamos seu link de confirmação."
        iconLabel="Verificando e-mail"
        primaryAction={{ label: 'Verificando…', disabled: true }}
      />
    );
  }

  // Verifying by token alone never tells us the address, so there is no
  // email pill; and it creates no session, hence "Entrar" instead of
  // dropping the visitor straight into the app.
  if (state === 'success') {
    return (
      <EmailStatusCard
        variant="success"
        eyebrow="E-MAIL CONFIRMADO"
        title="Tudo certo!"
        message="Seu e-mail foi confirmado com sucesso. Entre para criar sua conta de anunciante."
        primaryAction={{ label: 'Entrar', href: '/login' }}
      />
    );
  }

  return (
    <EmailStatusCard
      variant="expired"
      eyebrow="LINK EXPIRADO"
      title="Este link não é mais válido"
      message="O link de confirmação expirou ou já foi utilizado. Solicite um novo e-mail de confirmação."
      primaryAction={resendOpen ? undefined : { label: 'Reenviar confirmação', onClick: () => setResendOpen(true) }}
      secondaryAction={{ label: 'Voltar para entrar', href: '/login' }}
      footer={(
        <p>
          Já confirmou seu e-mail?{' '}
          <Link href="/login">
            Entrar
            <span aria-hidden="true"> →</span>
          </Link>
        </p>
      )}
    >
      {resendOpen && <ResendConfirmationForm />}
    </EmailStatusCard>
  );
}

function ResendConfirmationForm() {
  const resend = useResendVerificationMutation();
  const [email, setEmail] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [resent, setResent] = useState(false);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_PATTERN.test(trimmed)) {
      setInvalid(true);
      return;
    }
    setInvalid(false);
    resend.mutate({ email: trimmed }, { onSuccess: () => setResent(true) });
  }

  return (
    <form className={styles.form} onSubmit={onSubmit} noValidate>
      <Label htmlFor="resend-email" className={styles.label}>E-mail</Label>
      <Input
        id="resend-email"
        type="email"
        autoComplete="email"
        // The field only appears after the user asks for it, so moving focus
        // there is the expected next step, not a surprise.
        autoFocus
        placeholder="voce@empresa.com"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        disabled={resend.isPending || resent}
        aria-invalid={invalid || undefined}
        aria-describedby={invalid ? 'resend-email-error' : undefined}
        className={styles.input}
      />
      {invalid && (
        <p id="resend-email-error" className={styles.error} role="alert">Informe um e-mail válido.</p>
      )}

      <Button type="submit" className={styles.submit} disabled={resend.isPending || resent}>
        Enviar link
      </Button>

      {resent && (
        <p className={styles.confirm} role="status">
          Se houver uma conta pendente, enviamos um novo e-mail.
        </p>
      )}
      {resend.isError && (
        <p className={styles.error} role="alert">
          Não foi possível reenviar agora. Tente novamente em instantes.
        </p>
      )}
    </form>
  );
}
