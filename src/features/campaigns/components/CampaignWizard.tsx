'use client';

import { Button } from '@live-show/design-system';
import { useActiveAdvertiserAccount } from '@/features/advertisers/providers/ActiveAdvertiserAccountProvider';
import { useCampaignWizard, type WizardStepId } from '../hooks/use-campaign-wizard';
import { useSubmitCampaign } from '../hooks/use-submit-campaign';
import { CreativeStep } from './steps/CreativeStep';
import { DestinationStep } from './steps/DestinationStep';
import { TargetingStep } from './steps/TargetingStep';
import { BudgetStep } from './steps/BudgetStep';
import { ReviewStep } from './steps/ReviewStep';
import styles from './CampaignWizard.module.scss';

const STEP_LABELS: Record<WizardStepId, string> = {
  creative: 'Criativo',
  destination: 'Destino',
  targeting: 'Segmentação',
  budget: 'Orçamento',
  review: 'Revisão',
};

const STEP_DESC: Record<WizardStepId, string> = {
  creative: 'Banner e título',
  destination: 'Evento ou URL',
  targeting: 'Público-alvo',
  budget: 'Investimento',
  review: 'Confira e envie',
};

// Shell owns the stepper header, step outlet, back/next navigation and (on
// the final step) the create→upload→submit orchestration.
export function CampaignWizard() {
  const { steps, step, stepIndex, draft, error, bannerRequiredWarning, updateDraft, setBanner, next, back, goToStep } =
    useCampaignWizard();
  const { activeAccountId } = useActiveAdvertiserAccount();
  const { submit, isSubmitting } = useSubmitCampaign();

  const isLastStep = stepIndex === steps.length - 1;
  // Hard block, mirroring the backend's Ad#submitForReview rule: EXTERNAL_URL
  // ads without a banner are rejected by the domain at submit time.
  const submitBlockedByBanner = draft.destinationType === 'EXTERNAL_URL' && !draft.bannerFile;

  function handleSubmit() {
    if (!activeAccountId || submitBlockedByBanner) return;
    void submit(draft, activeAccountId);
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <h1 className={styles.title}>Nova campanha</h1>
      </header>

      <nav className={styles.stepper} aria-label="Etapas da campanha">
        {steps.map((id, index) => {
          const state = id === step ? 'active' : index < stepIndex ? 'done' : 'todo';
          return (
            <button
              key={id}
              type="button"
              className={`${styles.step} ${styles[`step_${state}`]}`}
              disabled={index > stepIndex}
              onClick={() => goToStep(id)}
            >
              <span className={styles.stepNum}>{index + 1}</span>
              <span className={styles.stepText}>
                <span className={styles.stepLabel}>{STEP_LABELS[id]}</span>
                <span className={styles.stepDesc}>{STEP_DESC[id]}</span>
              </span>
            </button>
          );
        })}
      </nav>

      <div className={styles.content}>
        {step !== 'review' && (
          <div className={styles.stepCard}>
            {step === 'creative' && <CreativeStep draft={draft} updateDraft={updateDraft} setBanner={setBanner} />}
            {step === 'destination' && (
              <DestinationStep draft={draft} updateDraft={updateDraft} bannerRequiredWarning={bannerRequiredWarning} />
            )}
            {step === 'targeting' && <TargetingStep draft={draft} updateDraft={updateDraft} />}
            {step === 'budget' && <BudgetStep draft={draft} updateDraft={updateDraft} />}
          </div>
        )}

        {step === 'review' && (
          <>
            <ReviewStep draft={draft} />
            {submitBlockedByBanner && (
              <p className={styles.error} role="alert">
                Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.
              </p>
            )}
          </>
        )}

        {error && (
          <p className={styles.error} role="alert">
            {error}
          </p>
        )}
      </div>

      <div className={styles.footer}>
        <Button variant="outline" onClick={back} disabled={stepIndex === 0}>
          Voltar
        </Button>
        {isLastStep ? (
          <Button onClick={handleSubmit} disabled={isSubmitting || submitBlockedByBanner || !activeAccountId}>
            {isSubmitting ? 'Enviando...' : 'Enviar para revisão'}
          </Button>
        ) : (
          <Button onClick={next}>Próximo</Button>
        )}
      </div>
    </div>
  );
}
