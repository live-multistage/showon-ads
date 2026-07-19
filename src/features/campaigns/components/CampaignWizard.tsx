'use client';

import { Button, Card, CardContent, Chip } from '@live-show/design-system';
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
        {steps.map((id, index) => (
          <Chip
            key={id}
            variant={id === step ? 'active' : 'default'}
            disabled={index > stepIndex}
            onClick={() => goToStep(id)}
          >
            {index + 1}. {STEP_LABELS[id]}
          </Chip>
        ))}
      </nav>

      <Card>
        <CardContent className={styles.content}>
          {step === 'creative' && <CreativeStep draft={draft} updateDraft={updateDraft} setBanner={setBanner} />}

          {step === 'destination' && (
            <DestinationStep draft={draft} updateDraft={updateDraft} bannerRequiredWarning={bannerRequiredWarning} />
          )}

          {step === 'targeting' && <TargetingStep draft={draft} updateDraft={updateDraft} />}

          {step === 'budget' && <BudgetStep draft={draft} updateDraft={updateDraft} />}

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
        </CardContent>
      </Card>

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
