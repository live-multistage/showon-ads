'use client';

import { useState, type FormEvent } from 'react';
import { Button, Input, Label } from '@live-show/design-system';
import { normalizeError } from '@/shared/api/client';
import { useCreateAdvertiserMutation } from '@/features/advertisements/mutations/use-create-advertiser.mutation';
import styles from './AdvertiserOnboardingForm.module.scss';

const BENEFITS = [
  {
    title: 'Segmentação por evento e público',
    description: 'Escolha gênero, cidade e posição de exibição.',
    icon: (
      <>
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="6" />
        <circle cx="12" cy="12" r="2" />
      </>
    ),
  },
  {
    title: 'Métricas em tempo real',
    description: 'Impressões, cliques e CTR por posição.',
    icon: <path d="M3 12h4l3-8 4 16 3-8h4" />,
  },
  {
    title: 'Sem mensalidade',
    description: 'Você paga só pelo que veicular (CPM ou CPC).',
    icon: <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />,
  },
];

// AuthGuard's gate for authenticated users with zero advertiser accounts.
// On success the mutation invalidates the accounts query, which lifts the
// gate — nothing else to do here.
// ponytail: only company name — POST /advertisers takes nothing else yet.
export function AdvertiserOnboardingForm() {
  const [companyName, setCompanyName] = useState('');
  const [validationError, setValidationError] = useState<string | null>(null);
  const { mutate, isPending, error } = useCreateAdvertiserMutation();

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!companyName.trim()) {
      setValidationError('Informe o nome da empresa.');
      return;
    }

    setValidationError(null);
    mutate({ name: companyName.trim() });
  }

  const errorMessage = validationError ?? (error ? normalizeError(error).message : null);

  return (
    <div className={styles.split}>
      <section className={styles.promo}>
        <div className={styles.glowPink} />
        <div className={styles.glowPurple} />

        <div className={styles.promoIntro}>
          <span className={styles.pill}>
            <span className={styles.pillDot} />
            SHOWON ADS
          </span>
          <p className={styles.promoTitle}>Anuncie para quem está ao vivo.</p>
          <p className={styles.promoText}>
            Coloque sua marca dentro dos shows mais assistidos do Brasil. Abra sua conta de
            anunciante em um minuto.
          </p>
        </div>

        <ul className={styles.benefits}>
          {BENEFITS.map((benefit) => (
            <li key={benefit.title} className={styles.benefit}>
              <span className={styles.benefitIcon} aria-hidden="true">
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  {benefit.icon}
                </svg>
              </span>
              <div>
                <p className={styles.benefitTitle}>{benefit.title}</p>
                <p className={styles.benefitText}>{benefit.description}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className={styles.formColumn}>
        <div className={styles.formInner}>
          <h1 className={styles.title}>Crie sua conta de anunciante</h1>
          <p className={styles.subtitle}>Leva menos de um minuto.</p>

          <form onSubmit={handleSubmit} className={styles.form} noValidate>
            <div>
              <Label htmlFor="companyName" className={styles.label}>
                Nome da empresa
              </Label>
              <Input
                id="companyName"
                className={styles.input}
                autoComplete="organization"
                placeholder="Ex: RockFest Produções"
                value={companyName}
                onChange={(event) => setCompanyName(event.target.value)}
                disabled={isPending}
                aria-invalid={errorMessage ? true : undefined}
                aria-describedby={errorMessage ? 'companyName-error' : undefined}
              />
            </div>

            {errorMessage && (
              <p id="companyName-error" className={styles.error} role="alert">
                {errorMessage}
              </p>
            )}

            <Button type="submit" className={styles.submit} disabled={isPending}>
              {isPending ? 'Criando…' : 'Criar conta de anunciante'}
            </Button>
          </form>
        </div>
      </section>
    </div>
  );
}
