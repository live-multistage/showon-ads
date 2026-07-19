'use client';

import { useState, type KeyboardEvent } from 'react';
import { Chip, Input, Label } from '@live-show/design-system';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
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

  return (
    <div className={styles.step}>
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
