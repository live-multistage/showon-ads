'use client';

import { Input, Label, SimpleCustomSelect, type SelectOption } from '@live-show/design-system';
import type { AdBillingModel, FrequencyCapWindow, PauseMinBids } from '@/features/advertisements/types/advertisement.types';
import { pauseMinimumError, PAUSE_VARIANT_NAME, type CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import { formatCostPerImpression } from '../../utils/brl';
import { formatCentsToBRL, reaisToCents } from '../../utils/format-currency';
import { StepHeader } from './StepHeader';
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
  pauseMinBids?: PauseMinBids;
}

const BILLING_HINT: Record<string, Record<AdBillingModel, string>> = {
  preroll: { CPM: 'Conta quando o vídeo começa a tocar, mesmo que a pessoa pule depois.', CPC: 'Paga só quando alguém clica no anúncio.' },
  pause: { CPM: 'Conta quando o anúncio aparece na pausa.', CPC: 'Paga só quando alguém clica no anúncio.' },
  banner: { CPM: 'Bom para divulgar um evento para muita gente.', CPC: 'Paga só quando alguém clica no anúncio.' },
};

export function BudgetStep({ draft, updateDraft, pauseMinBids }: BudgetStepProps) {
  const bidCents = reaisToCents(draft.bidReais);
  const bidError = pauseMinimumError(draft, pauseMinBids);

  return (
    <div className={styles.step}>
      <StepHeader step={3} title="Orçamento e período" lead="Você só paga pelo que for entregue, descontado da carteira." />

      <div className={styles.field}>
        <Label htmlFor="billing-model">Como pagar</Label>
        <SimpleCustomSelect
          value={draft.billingModel ?? undefined}
          onValueChange={(value) => updateDraft({ billingModel: value as AdBillingModel })}
          options={BILLING_OPTIONS.map((option) => ({ ...option, description: BILLING_HINT[draft.kind][option.value] }))}
          placeholder="Selecione um modelo"
        />
      </div>

      {draft.kind === 'pause' && pauseMinBids && (
        <div className={styles.field}>
          <Label>Lance mínimo por variante</Label>
          <table className={styles.minTable}>
            <thead>
              <tr>
                <th scope="col">Variante</th>
                <th scope="col">Por mil</th>
                <th scope="col">Por clique</th>
              </tr>
            </thead>
            <tbody>
              {(['STANDARD', 'FULLSCREEN'] as const).map((variant) => (
                <tr key={variant}>
                  <th scope="row">
                    {PAUSE_VARIANT_NAME[variant]}
                    {draft.pauseVariant === variant ? ' · sua escolha' : ''}
                  </th>
                  <td>{formatCentsToBRL(pauseMinBids[variant].CPM)}</td>
                  <td>{formatCentsToBRL(pauseMinBids[variant].CPC)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className={styles.hint}>
            Tela cheia ocupa a tela toda e esconde a transmissão, por isso custa mais.
            {draft.pauseVariant === 'STANDARD' && ' No celular sua pausa aparece em Tela cheia.'}
          </p>
        </div>
      )}

      <div className={styles.row}>
        <div className={styles.field}>
          <Label htmlFor="bid-reais">
            Lance por {draft.billingModel === 'CPC' ? 'clique' : 'mil impressões'} (R$)
          </Label>
          <Input
            id="bid-reais"
            type="text"
            inputMode="decimal"
            value={draft.bidReais}
            onChange={(event) => updateDraft({ bidReais: event.target.value })}
            placeholder="0,00"
            aria-invalid={bidError !== null}
          />
          {bidError ? (
            <p className={styles.error} role="alert">
              {bidError}
            </p>
          ) : draft.billingModel === 'CPM' && bidCents > 0 ? (
            <p className={styles.hint}>
              Cada impressão custa <b>{formatCostPerImpression(bidCents)}</b> (lance ÷ 1.000). As frações de centavo
              se acumulam e são descontadas da carteira em centavos inteiros.
            </p>
          ) : draft.billingModel === 'CPC' ? (
            <p className={styles.hint}>Lance maior ganha mais vezes o espaço, junto com quão bem o público combina.</p>
          ) : null}
        </div>

        <div className={styles.field}>
          <Label htmlFor="daily-budget-reais">Orçamento diário (R$)</Label>
          <Input
            id="daily-budget-reais"
            type="text"
            inputMode="decimal"
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
          type="text"
            inputMode="decimal"
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
