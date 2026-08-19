'use client';

import { useState, type KeyboardEvent } from 'react';
import { Checkbox, Chip, Input, Label } from '@live-show/design-system';
import type { AdPlacement, AgeBracket } from '@/features/advertisements/types/advertisement.types';
import { placementLabel } from '../../utils/ad-display';
import { ALL_PLACEMENTS, type CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import styles from './TargetingStep.module.scss';

// Ported from live-show-react's AdCreatePage.tsx INTERESTS list — the only
// place targetDomains values were ever sourced (a fixed 5-item audience
// taxonomy, not events data). targetCategories never had an established
// source in either legacy page (always hardcoded to []), so it's a freeform
// tag input below instead of a fixed list.
const DOMAIN_OPTIONS = [
  { value: 'ENTERTAINMENT', label: 'Entretenimento' },
  { value: 'SPORTS', label: 'Esportes' },
  { value: 'CORPORATE', label: 'Corporativo' },
  { value: 'EDUCATION', label: 'Educação' },
  { value: 'RELIGIOUS', label: 'Religioso' },
];

// The 5 adult brackets only — AGE_13_17 is not an advertiser-selectable
// option (backend rejects it in targetAgeBrackets).
const AGE_BRACKET_OPTIONS: { value: AgeBracket; label: string }[] = [
  { value: 'AGE_18_24', label: '18–24' },
  { value: 'AGE_25_34', label: '25–34' },
  { value: 'AGE_35_44', label: '35–44' },
  { value: 'AGE_45_54', label: '45–54' },
  { value: 'AGE_55_PLUS', label: '55+' },
];

interface TargetingStepProps {
  draft: CampaignWizardDraft;
  updateDraft: (patch: Partial<CampaignWizardDraft>) => void;
}

export function TargetingStep({ draft, updateDraft }: TargetingStepProps) {
  const [categoryInput, setCategoryInput] = useState('');

  function toggleDomain(domain: string) {
    const isSelected = draft.targetDomains.includes(domain);
    updateDraft({
      targetDomains: isSelected
        ? draft.targetDomains.filter((d) => d !== domain)
        : [...draft.targetDomains, domain],
    });
  }

  function addCategory() {
    const value = categoryInput.trim();
    if (!value || draft.targetCategories.includes(value)) {
      setCategoryInput('');
      return;
    }
    updateDraft({ targetCategories: [...draft.targetCategories, value] });
    setCategoryInput('');
  }

  function handleCategoryKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    addCategory();
  }

  function removeCategory(category: string) {
    updateDraft({ targetCategories: draft.targetCategories.filter((c) => c !== category) });
  }

  function toggleAgeBracket(bracket: AgeBracket) {
    const isSelected = draft.targetAgeBrackets.includes(bracket);
    updateDraft({
      targetAgeBrackets: isSelected
        ? draft.targetAgeBrackets.filter((b) => b !== bracket)
        : [...draft.targetAgeBrackets, bracket],
    });
  }

  function togglePlacement(placement: AdPlacement) {
    const isSelected = draft.placements.includes(placement);
    updateDraft({
      placements: isSelected
        ? draft.placements.filter((p) => p !== placement)
        : [...draft.placements, placement],
    });
  }

  return (
    <div className={styles.step}>
      <div className={styles.field}>
        <Label>Posicionamentos</Label>
        <p className={styles.hint}>Onde seu anúncio pode ser exibido.</p>
        <div className={styles.checkboxList}>
          {ALL_PLACEMENTS.map((placement) => (
            <div key={placement} className={styles.checkboxRow}>
              <Checkbox
                id={`placement-${placement}`}
                checked={draft.placements.includes(placement)}
                onCheckedChange={() => togglePlacement(placement)}
              />
              <label htmlFor={`placement-${placement}`}>{placementLabel(placement)}</label>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <Label>Faixa etária do público</Label>
        <p className={styles.hint}>
          {draft.targetAgeBrackets.length > 0
            ? 'Seu anúncio será exibido apenas para as faixas etárias selecionadas.'
            : 'Todas as idades — nenhuma faixa etária selecionada restringe a exibição.'}
        </p>
        <div className={styles.chipList}>
          {AGE_BRACKET_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              variant={draft.targetAgeBrackets.includes(option.value) ? 'active' : 'default'}
              onClick={() => toggleAgeBracket(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <Label>Interesses do público</Label>
        <p className={styles.hint}>Seu anúncio será exibido para usuários com preferências correspondentes.</p>
        <div className={styles.chipList}>
          {DOMAIN_OPTIONS.map((option) => (
            <Chip
              key={option.value}
              variant={draft.targetDomains.includes(option.value) ? 'active' : 'default'}
              onClick={() => toggleDomain(option.value)}
            >
              {option.label}
            </Chip>
          ))}
        </div>
      </div>

      <div className={styles.field}>
        <Label htmlFor="target-categories">Categorias (opcional)</Label>
        <Input
          id="target-categories"
          value={categoryInput}
          onChange={(event) => setCategoryInput(event.target.value)}
          onKeyDown={handleCategoryKeyDown}
          onBlur={addCategory}
          placeholder="Digite e pressione Enter para adicionar"
        />
        {draft.targetCategories.length > 0 && (
          <div className={styles.chipList}>
            {draft.targetCategories.map((category) => (
              <Chip key={category} variant="active" onClick={() => removeCategory(category)}>
                {category} ×
              </Chip>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
