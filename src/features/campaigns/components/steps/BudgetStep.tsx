'use client';

import { Input, Label, SimpleCustomSelect, type SelectOption } from '@live-show/design-system';
import type { AdBillingModel, FrequencyCapWindow } from '@/features/advertisements/types/advertisement.types';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import styles from './BudgetStep.module.scss';

// Plain-language explainer per billing model (task brief) — same two models
// AdCreatePage.tsx offered, worded as a decision aid rather than jargon.
const BILLING_OPTIONS: (SelectOption & { value: AdBillingModel })[] = [
  { value: 'CPM', label: 'CPM', description: 'Custo por mil impressões — ideal para reconhecimento de marca.' },
  { value: 'CPC', label: 'CPC', description: 'Custo por clique — ideal para gerar conversões.' },
];

const FREQUENCY_WINDOW_OPTIONS: (SelectOption & { value: FrequencyCapWindow })[] = [
  { value: 'day', label: 'Por dia' },
  { value: 'total', label: 'Total (vida da campanha)' },
];

interface BudgetStepProps {
  draft: CampaignWizardDraft;
  updateDraft: (patch: Partial<CampaignWizardDraft>) => void;
}

export function BudgetStep({ draft, updateDraft }: BudgetStepProps) {
  return (
    <div className={styles.step}>
      <div className={styles.field}>
        <Label htmlFor="billing-model">Modelo de cobrança</Label>
        <SimpleCustomSelect
          value={draft.billingModel ?? undefined}
          onValueChange={(value) => updateDraft({ billingModel: value as AdBillingModel })}
          options={BILLING_OPTIONS}
          placeholder="Selecione um modelo"
        />
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="bid-reais">
            Lance por {draft.billingModel === 'CPC' ? 'clique' : 'mil impressões'} (R$)
          </Label>
          <Input
            id="bid-reais"
            type="number"
            min="0"
            step="0.01"
            value={draft.bidReais}
            onChange={(event) => updateDraft({ bidReais: event.target.value })}
            placeholder="0,00"
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="daily-budget-reais">Orçamento diário (R$)</Label>
          <Input
            id="daily-budget-reais"
            type="number"
            min="0"
            step="0.01"
            value={draft.dailyBudgetReais}
            onChange={(event) => updateDraft({ dailyBudgetReais: event.target.value })}
            placeholder="0,00"
          />
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="total-limit-reais">Limite total de gasto (R$)</Label>
        <Input
          id="total-limit-reais"
          type="number"
          min="0"
          step="0.01"
          value={draft.totalLimitReais}
          onChange={(event) => updateDraft({ totalLimitReais: event.target.value })}
          placeholder="0,00"
        />
        <p className={styles.hint}>Deve ser maior ou igual ao orçamento diário.</p>
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="frequency-cap-max">Frequência máxima (opcional)</Label>
          <Input
            id="frequency-cap-max"
            type="number"
            min="1"
            step="1"
            value={draft.frequencyCapMax}
            onChange={(event) =>
              updateDraft({
                frequencyCapMax: event.target.value,
                frequencyCapWindow: event.target.value ? (draft.frequencyCapWindow ?? 'day') : null,
              })
            }
            placeholder="Sem limite"
          />
        </div>

        {draft.frequencyCapMax && (
          <div className={styles.field}>
            <Label htmlFor="frequency-cap-window">Janela</Label>
            <SimpleCustomSelect
              value={draft.frequencyCapWindow ?? undefined}
              onValueChange={(value) => updateDraft({ frequencyCapWindow: value as FrequencyCapWindow })}
              options={FREQUENCY_WINDOW_OPTIONS}
              placeholder="Selecione"
            />
          </div>
        )}
      </div>

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="starts-at">Início da veiculação</Label>
          <Input
            id="starts-at"
            type="datetime-local"
            value={draft.startsAt}
            onChange={(event) => updateDraft({ startsAt: event.target.value })}
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="ends-at">Fim da veiculação</Label>
          <Input
            id="ends-at"
            type="datetime-local"
            value={draft.endsAt}
            onChange={(event) => updateDraft({ endsAt: event.target.value })}
          />
        </div>
      </div>
    </div>
  );
}
