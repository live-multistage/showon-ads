'use client';

import { Button, Card, CardContent, Chip } from '@live-show/design-system';
import { useCampaignWizard, type WizardStepId } from '../hooks/use-campaign-wizard';
import { CreativeStep } from './steps/CreativeStep';
import { DestinationStep } from './steps/DestinationStep';
import styles from './CampaignWizard.module.scss';

const STEP_LABELS: Record<WizardStepId, string> = {
  creative: 'Criativo',
  destination: 'Destino',
  targeting: 'Segmentação',
  budget: 'Orçamento',
  review: 'Revisão',
};

// Shell owns the stepper header, step outlet and back/next navigation.
// 'targeting' / 'budget' / 'review' are declared in the step list (task 18's
// scope) but only render a placeholder — task 19 implements them plus the
// final create→upload→submit orchestration.
export function CampaignWizard() {
  const { steps, step, stepIndex, draft, error, bannerRequiredWarning, updateDraft, setBanner, next, back, goToStep } =
    useCampaignWizard();

  const isLastStep = stepIndex === steps.length - 1;

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

          {step !== 'creative' && step !== 'destination' && (
            <p className={styles.placeholder}>Esta etapa será implementada em breve.</p>
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
        <Button onClick={next} disabled={isLastStep}>
          Próximo
        </Button>
      </div>
    </div>
  );
}
