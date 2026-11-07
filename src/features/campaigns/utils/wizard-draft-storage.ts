import { WIZARD_STEPS, type CampaignWizardDraft, type WizardStepId } from '../hooks/use-campaign-wizard';

const KEY_PREFIX = 'ads:campaign-draft:';
const VERSION = 1;

// O arquivo escolhido não cabe no storage: o rascunho guarda tudo menos ele.
type StoredDraft = Omit<CampaignWizardDraft, 'bannerFile' | 'bannerPreviewUrl'>;

interface Stored {
  version: number;
  step: WizardStepId;
  draft: StoredDraft;
}

export interface RestoredDraft {
  step: WizardStepId;
  draft: StoredDraft;
}

const keyFor = (accountId: string) => `${KEY_PREFIX}${accountId}`;

export function saveWizardDraft(accountId: string, step: WizardStepId, draft: CampaignWizardDraft): void {
  const { bannerFile: _file, bannerPreviewUrl: _url, ...rest } = draft;
  const payload: Stored = { version: VERSION, step, draft: rest };
  try {
    localStorage.setItem(keyFor(accountId), JSON.stringify(payload));
  } catch {
    // storage cheio ou bloqueado: o wizard segue sem rascunho salvo
  }
}

export function loadWizardDraft(accountId: string): RestoredDraft | null {
  try {
    const raw = localStorage.getItem(keyFor(accountId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    if (parsed.version !== VERSION || !parsed.draft || !parsed.step) return null;
    if (!WIZARD_STEPS.includes(parsed.step)) return null;
    return { step: parsed.step, draft: parsed.draft };
  } catch {
    return null;
  }
}

export function clearWizardDraft(accountId: string): void {
  try {
    localStorage.removeItem(keyFor(accountId));
  } catch {
    // ignore
  }
}
