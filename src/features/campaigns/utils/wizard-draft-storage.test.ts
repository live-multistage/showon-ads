import { describe, it, expect, beforeEach } from 'vitest';
import { saveWizardDraft, loadWizardDraft, clearWizardDraft } from './wizard-draft-storage';
import type { CampaignWizardDraft } from '../hooks/use-campaign-wizard';

const draft = {
  kind: 'pause',
  pauseVariant: 'FULLSCREEN',
  title: 'Gelada no intervalo',
  format: 'WIDE_16_9',
  bannerFile: new File(['x'], 'a.png'),
  bannerPreviewUrl: 'blob:abc',
  destinationType: 'EXTERNAL_URL',
  event: null,
  externalUrl: 'https://serraalta.com.br',
  targetDomains: [],
  targetCategories: [],
  targetAgeBrackets: [],
  placements: ['PLAYER_PAUSE'],
  billingModel: 'CPM',
  bidReais: '14,00',
  dailyBudgetReais: '',
  totalLimitReais: '',
  frequencyCapMax: '',
  frequencyCapWindow: null,
  startsAt: '',
  endsAt: '',
} as CampaignWizardDraft;

describe('wizard draft storage', () => {
  beforeEach(() => localStorage.clear());

  it('round-trips the draft and the step, without the file', () => {
    saveWizardDraft('acc-1', 'targeting', draft);
    const restored = loadWizardDraft('acc-1');
    expect(restored?.step).toBe('targeting');
    expect(restored?.draft).toMatchObject({ title: 'Gelada no intervalo', pauseVariant: 'FULLSCREEN', bidReais: '14,00' });
    expect(restored?.draft).not.toHaveProperty('bannerFile');
    expect(restored?.draft).not.toHaveProperty('bannerPreviewUrl');
  });

  it('keeps one draft per advertiser account', () => {
    saveWizardDraft('acc-1', 'creative', draft);
    expect(loadWizardDraft('acc-2')).toBeNull();
  });

  it('clear removes it', () => {
    saveWizardDraft('acc-1', 'creative', draft);
    clearWizardDraft('acc-1');
    expect(loadWizardDraft('acc-1')).toBeNull();
  });

  it.each(['not json', '{"version":99}', '{"version":1,"step":"nope","draft":{}}'])('ignores corrupt data %s', (raw) => {
    localStorage.setItem('ads:campaign-draft:acc-1', raw);
    expect(loadWizardDraft('acc-1')).toBeNull();
  });
});
