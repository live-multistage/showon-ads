'use client';

import type { ChangeEvent } from 'react';
import { Input, Label, SimpleCustomSelect, type SelectOption } from '@live-show/design-system';
import type { AdFormat } from '@/features/advertisements/types/advertisement.types';
import type { CampaignWizardDraft } from '../../hooks/use-campaign-wizard';
import styles from './CreativeStep.module.scss';

// Dimension hints so an advertiser knows what banner asset to prepare before
// the upload step even asks for a file.
const FORMAT_OPTIONS: (SelectOption & { value: AdFormat })[] = [
  { value: 'HORIZONTAL_728x90', label: 'Horizontal (728×90)' },
  { value: 'VERTICAL_300x600', label: 'Vertical (300×600)' },
];

interface CreativeStepProps {
  draft: CampaignWizardDraft;
  updateDraft: (patch: Partial<CampaignWizardDraft>) => void;
  setBanner: (file: File | null) => void;
}

export function CreativeStep({ draft, updateDraft, setBanner }: CreativeStepProps) {
  function handleBannerChange(event: ChangeEvent<HTMLInputElement>) {
    setBanner(event.target.files?.[0] ?? null);
  }

  return (
    <div className={styles.step}>
      <div className={styles.field}>
        <Label htmlFor="campaign-title">Título</Label>
        <Input
          id="campaign-title"
          value={draft.title}
          onChange={(event) => updateDraft({ title: event.target.value })}
          placeholder="Nome da campanha"
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="campaign-format">Formato</Label>
        <SimpleCustomSelect
          value={draft.format ?? undefined}
          onValueChange={(value) => updateDraft({ format: value as AdFormat })}
          options={FORMAT_OPTIONS}
          placeholder="Selecione um formato"
        />
      </div>

      <div className={styles.field}>
        <Label htmlFor="campaign-banner">Banner</Label>
        <input
          id="campaign-banner"
          type="file"
          accept="image/*"
          onChange={handleBannerChange}
          className={styles.fileInput}
        />
        <p className={styles.hint}>
          {draft.format === 'VERTICAL_300x600'
            ? 'Dimensão recomendada: 300×600px.'
            : 'Dimensão recomendada: 728×90px.'}
        </p>
        {draft.bannerPreviewUrl && (
          // eslint-disable-next-line @next/next/no-img-element -- object URL preview, not a static asset
          <img src={draft.bannerPreviewUrl} alt="Pré-visualização do banner" className={styles.preview} />
        )}
      </div>
    </div>
  );
}
