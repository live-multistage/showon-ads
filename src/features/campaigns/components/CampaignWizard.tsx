'use client';

import { useRouter } from 'next/navigation';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import { useCampaignWizard, type WizardStepId } from '../hooks/use-campaign-wizard';
import { useSubmitCampaign } from '../hooks/use-submit-campaign';
import { CreativeStep } from './steps/CreativeStep';
import { DestinationStep } from './steps/DestinationStep';
import { TargetingStep } from './steps/TargetingStep';
import { BudgetStep } from './steps/BudgetStep';
import { ReviewStep } from './steps/ReviewStep';
import { CampaignPreviewPanel } from './CampaignPreviewPanel';
import styles from './CampaignWizard.module.scss';

const STEP_LABELS: Record<WizardStepId, string> = {
  creative: 'Criativo',
  destination: 'Destino',
  targeting: 'Segmentação',
  budget: 'Orçamento',
  review: 'Revisão',
};

const STEP_DESC: Record<WizardStepId, string> = {
  creative: 'BANNER E TÍTULO',
  destination: 'EVENTO OU URL',
  targeting: 'PÚBLICO-ALVO',
  budget: 'INVESTIMENTO',
  review: 'CONFIRA E ENVIE',
};

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden>
      <path d="M5 12l5 5L20 7" />
    </svg>
  );
}

function ChevronRight({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className={className} aria-hidden>
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}

// Shell owns the stepper header, step outlet, back/next navigation and (on
// the final step) the create→upload→submit orchestration.
export function CampaignWizard() {
  const { steps, step, stepIndex, draft, error, bannerRequiredWarning, updateDraft, setBanner, next, back, goToStep } =
    useCampaignWizard();
  const { activeAccountId } = useActiveAdvertiserAccount();
  const { submit, isSubmitting } = useSubmitCampaign();
  const router = useRouter();

  const isLastStep = stepIndex === steps.length - 1;
  const isReview = step === 'review';
  // Hard block, mirroring the backend's Ad#submitForReview rule: EXTERNAL_URL
  // ads without a banner are rejected by the domain at submit time.
  const submitBlockedByBanner = draft.destinationType === 'EXTERNAL_URL' && !draft.bannerFile;

  function handleSubmit() {
    if (!activeAccountId || submitBlockedByBanner) return;
    void submit(draft, activeAccountId);
  }

  return (
    <div className={styles.page}>
      {/* breadcrumb */}
      <div className={styles.breadcrumb}>
        <span>ADS MANAGER</span>
        <span className={styles.crumbSep}>/</span>
        <span>CAMPANHAS</span>
        <span className={styles.crumbSep}>/</span>
        <span className={styles.crumbActive}>NOVA</span>
      </div>

      {/* header */}
      <header className={styles.header}>
        <div>
          <div className={styles.headerMeta}>
            <span className={styles.draftPill}>
              <span className={styles.draftDot} />
              RASCUNHO
            </span>
          </div>
          <h1 className={styles.title}>Nova campanha</h1>
          <p className={styles.subtitle}>Configure criativo, destino, público e orçamento em 5 passos.</p>
        </div>
        <div className={styles.headerActions}>
          <button type="button" className={styles.btnGhost} onClick={() => router.push('/campaigns')}>
            DESCARTAR
          </button>
        </div>
      </header>

      {/* stepper */}
      <nav className={styles.stepper} aria-label="Etapas da campanha">
        {steps.map((id, index) => {
          const state = id === step ? 'active' : index < stepIndex ? 'done' : 'todo';
          const isLast = index === steps.length - 1;
          return (
            <div key={id} className={styles.stepGroup}>
              <button
                type="button"
                className={`${styles.step} ${styles[`step_${state}`]}`}
                disabled={index > stepIndex}
                onClick={() => goToStep(id)}
                aria-current={state === 'active' ? 'step' : undefined}
              >
                <span className={styles.stepNum}>{state === 'done' ? <CheckIcon /> : index + 1}</span>
                <span className={styles.stepText}>
                  <span className={styles.stepLabel}>{STEP_LABELS[id]}</span>
                  <span className={styles.stepDesc}>{STEP_DESC[id]}</span>
                </span>
              </button>
              {!isLast && <ChevronRight className={styles.stepChevron} />}
            </div>
          );
        })}
      </nav>

      {/* content */}
      {isReview ? (
        <div className={styles.reviewWrap}>
          <div className={styles.stepCard}>
            <ReviewStep draft={draft} />
            {submitBlockedByBanner && (
              <p className={styles.error} role="alert">
                Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.
              </p>
            )}
            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className={styles.grid}>
          <div className={styles.stepCard}>
            {step === 'creative' && <CreativeStep draft={draft} updateDraft={updateDraft} setBanner={setBanner} />}
            {step === 'destination' && (
              <DestinationStep draft={draft} updateDraft={updateDraft} bannerRequiredWarning={bannerRequiredWarning} />
            )}
            {step === 'targeting' && <TargetingStep draft={draft} updateDraft={updateDraft} />}
            {step === 'budget' && <BudgetStep draft={draft} updateDraft={updateDraft} />}

            {error && (
              <p className={styles.error} role="alert">
                {error}
              </p>
            )}

            {/* footer nav */}
            <div className={styles.footer}>
              <button
                type="button"
                className={styles.btnBack}
                onClick={back}
                disabled={stepIndex === 0}
                aria-label="Voltar"
              >
                <ChevronRight className={styles.backChevron} />
                VOLTAR
              </button>
              <button type="button" className={styles.btnPrimary} onClick={next} aria-label="Próximo">
                Próximo: {STEP_LABELS[steps[stepIndex + 1]]}
                <ChevronRight />
              </button>
            </div>
          </div>

          <CampaignPreviewPanel draft={draft} />
        </div>
      )}

      {/* review footer */}
      {isReview && (
        <div className={styles.reviewFooter}>
          <button type="button" className={styles.btnBack} onClick={back} aria-label="Voltar">
            <ChevronRight className={styles.backChevron} />
            VOLTAR
          </button>
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={handleSubmit}
            disabled={isSubmitting || submitBlockedByBanner || !activeAccountId}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar para revisão'}
          </button>
        </div>
      )}
    </div>
  );
}
