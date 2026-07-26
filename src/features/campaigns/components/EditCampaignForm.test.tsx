import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditCampaignForm } from './EditCampaignForm';
import { useUpdateAdMutation } from '@/features/advertisements/mutations/use-update-ad.mutation';
import { useUploadBannerMutation } from '@/features/advertisements/mutations/use-upload-banner.mutation';
import type { AdResponse } from '@/features/advertisements/types/advertisement.types';

// jsdom doesn't implement pointer capture / scrollIntoView, which Radix
// Select's open/select interactions (used by CreativeStep/BudgetStep) rely on.
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = () => false;
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = () => {};
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = () => {};
}

const mockUpdateMutateAsync = vi.fn();
vi.mock('@/features/advertisements/mutations/use-update-ad.mutation', () => ({
  useUpdateAdMutation: vi.fn(),
}));

const mockUploadMutate = vi.fn();
vi.mock('@/features/advertisements/mutations/use-upload-banner.mutation', () => ({
  useUploadBannerMutation: vi.fn(),
}));

const toastSuccessMock = vi.fn();
const toastErrorMock = vi.fn();
vi.mock('sonner', () => ({
  toast: {
    success: (...args: unknown[]) => toastSuccessMock(...args),
    error: (...args: unknown[]) => toastErrorMock(...args),
  },
}));

const mockedUseUpdateAdMutation = vi.mocked(useUpdateAdMutation);
const mockedUseUploadBannerMutation = vi.mocked(useUploadBannerMutation);

function makeAd(overrides: Partial<AdResponse>): AdResponse {
  return {
    id: 'ad-1',
    advertiserAccountId: 'acc-1',
    destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
    title: 'Summer Promo',
    format: 'HORIZONTAL_728x90',
    status: 'DRAFT',
    placements: ['FEED'],
    targetDomains: [],
    targetCategories: [],
    targetAgeBrackets: [],
    bannerUrl: 'https://cdn.example.com/banner.png',
    frequencyCapMax: null,
    frequencyCapWindow: null,
    billingModel: 'CPM',
    bidCents: 1000,
    dailyBudgetCents: 5000,
    totalLimitCents: 50000,
    totalSpendCents: 25000,
    startsAt: '2026-08-01T10:00:00.000Z',
    endsAt: '2026-09-01T10:00:00.000Z',
    createdBy: 'user-1',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('EditCampaignForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateMutateAsync.mockResolvedValue(undefined);
    mockedUseUpdateAdMutation.mockReturnValue({
      mutateAsync: mockUpdateMutateAsync,
      isPending: false,
    } as unknown as ReturnType<typeof useUpdateAdMutation>);
    mockedUseUploadBannerMutation.mockReturnValue({
      mutate: mockUploadMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadBannerMutation>);
  });

  it('prefills every reused step with the ad’s current values', () => {
    render(<EditCampaignForm ad={makeAd({})} onCancel={vi.fn()} onSaved={vi.fn()} />);

    expect(screen.getByLabelText('Título')).toHaveValue('Summer Promo');
    expect(screen.getByLabelText('URL de destino')).toHaveValue('https://example.com');
  });

  it('saves via use-update-ad with the edited fields and calls onSaved', async () => {
    const onSaved = vi.fn();
    render(<EditCampaignForm ad={makeAd({})} onCancel={vi.fn()} onSaved={onSaved} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Winter Promo' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    await waitFor(() => expect(mockUpdateMutateAsync).toHaveBeenCalled());
    expect(mockUpdateMutateAsync.mock.calls[0][0]).toMatchObject({
      title: 'Winter Promo',
      destination: { type: 'EXTERNAL_URL', url: 'https://example.com' },
    });
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(toastSuccessMock).toHaveBeenCalled();
  });

  it('blocks saving when the title is cleared', () => {
    render(<EditCampaignForm ad={makeAd({})} onCancel={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('Informe um título para a campanha.')).toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('allows saving a legacy null-destination ad unchanged (update, unlike submit, does not require a destination)', () => {
    render(<EditCampaignForm ad={makeAd({ destination: null })} onCancel={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.queryByText('Escolha um destino para o anúncio.')).not.toBeInTheDocument();
    expect(mockUpdateMutateAsync).toHaveBeenCalled();
  });

  it('replaces the banner immediately via the upload endpoint, independent of Save', () => {
    render(<EditCampaignForm ad={makeAd({})} onCancel={vi.fn()} onSaved={vi.fn()} />);

    const file = new File(['x'], 'new-banner.png', { type: 'image/png' });
    fireEvent.change(screen.getByLabelText('Banner'), { target: { files: [file] } });

    expect(mockUploadMutate).toHaveBeenCalledWith(
      { adId: 'ad-1', file },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('calls onCancel without saving', () => {
    const onCancel = vi.fn();
    render(<EditCampaignForm ad={makeAd({})} onCancel={onCancel} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });
});
