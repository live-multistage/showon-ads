import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { EditCampaignForm } from './EditCampaignForm';
import { useUpdateAdMutation } from '@/features/advertisements/mutations/use-update-ad.mutation';
import { useUploadBannerMutation } from '@/features/advertisements/mutations/use-upload-banner.mutation';
import { useUploadVideoMutation } from '@/features/advertisements/mutations/use-upload-video.mutation';
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

const mockUploadVideoMutate = vi.fn();
vi.mock('@/features/advertisements/mutations/use-upload-video.mutation', () => ({
  useUploadVideoMutation: vi.fn(),
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
const mockedUseUploadVideoMutation = vi.mocked(useUploadVideoMutation);

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
    videoUrl: null,
    videoDurationSec: null,
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
    mockedUseUploadVideoMutation.mockReturnValue({
      mutate: mockUploadVideoMutate,
      isPending: false,
    } as unknown as ReturnType<typeof useUploadVideoMutation>);
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

  it('blocks saving when every placement is unchecked', () => {
    render(<EditCampaignForm ad={makeAd({})} onCancel={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Feed' }));
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(screen.getByText('Selecione pelo menos um posicionamento.')).toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });

  it('blocks saving when checking Pausa do player alongside the existing page placement leaves an empty format intersection', () => {
    render(<EditCampaignForm ad={makeAd({})} onCancel={vi.fn()} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('checkbox', { name: 'Pausa do player' }));
    // CreativeStep also resets the now-incompatible format to null, but the
    // targeting message is the one surfaced — it names the actual problem,
    // and no format card is selectable while the intersection is empty.
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }));

    expect(
      screen.getByText('Os posicionamentos selecionados não podem ser combinados, pois usam formatos incompatíveis.'),
    ).toBeInTheDocument();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
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

  it('replaces the video immediately via the video upload endpoint for a VIDEO_16_9 ad', () => {
    render(
      <EditCampaignForm
        ad={makeAd({ format: 'VIDEO_16_9', placements: ['PRE_ROLL'], bannerUrl: null, videoUrl: 'https://cdn.example.com/ad.mp4' })}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    const file = new File(['x'], 'new-ad.mp4', { type: 'video/mp4' });
    fireEvent.change(screen.getByLabelText('Banner'), { target: { files: [file] } });

    expect(mockUploadVideoMutate).toHaveBeenCalledWith(
      { adId: 'ad-1', file },
      expect.objectContaining({ onSuccess: expect.any(Function), onError: expect.any(Function) }),
    );
    expect(mockUploadMutate).not.toHaveBeenCalled();
  });

  it('does not show the banner-required warning for a VIDEO_16_9 ad that already has a video', () => {
    render(
      <EditCampaignForm
        ad={makeAd({ format: 'VIDEO_16_9', placements: ['PRE_ROLL'], bannerUrl: null, videoUrl: 'https://cdn.example.com/ad.mp4' })}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      screen.queryByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('Anúncios em vídeo precisam de um vídeo antes de serem enviados para revisão.'),
    ).not.toBeInTheDocument();
  });

  it('shows a video-specific warning for a VIDEO_16_9 ad still missing a video', () => {
    render(
      <EditCampaignForm
        ad={makeAd({ format: 'VIDEO_16_9', placements: ['PRE_ROLL'], bannerUrl: null, videoUrl: null })}
        onCancel={vi.fn()}
        onSaved={vi.fn()}
      />,
    );

    expect(
      screen.getByText('Anúncios em vídeo precisam de um vídeo antes de serem enviados para revisão.'),
    ).toBeInTheDocument();
  });

  it('calls onCancel without saving', () => {
    const onCancel = vi.fn();
    render(<EditCampaignForm ad={makeAd({})} onCancel={onCancel} onSaved={vi.fn()} />);

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));

    expect(onCancel).toHaveBeenCalled();
    expect(mockUpdateMutateAsync).not.toHaveBeenCalled();
  });
});
