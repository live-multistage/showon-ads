import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PlatformGate } from './PlatformGate';
import { featureFlagsService } from '@/features/feature-flags/services/feature-flags.service';

vi.mock('@/features/feature-flags/services/feature-flags.service', () => ({
  featureFlagsService: {
    get: vi.fn(),
  },
}));

const mockedFeatureFlagsService = vi.mocked(featureFlagsService, true);

function renderWithProviders(ui: React.ReactElement) {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>);
}

describe('PlatformGate', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing while the flags request is loading', () => {
    mockedFeatureFlagsService.get.mockReturnValue(new Promise(() => {}));

    const { container } = renderWithProviders(
      <PlatformGate>
        <p>app content</p>
      </PlatformGate>,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('shows the blocked screen when advertiser_platform is false', async () => {
    mockedFeatureFlagsService.get.mockResolvedValueOnce({ advertiser_platform: false });

    renderWithProviders(
      <PlatformGate>
        <p>app content</p>
      </PlatformGate>,
    );

    expect(await screen.findByText('Anúncios temporariamente indisponíveis')).toBeInTheDocument();
    expect(screen.queryByText('app content')).not.toBeInTheDocument();
  });

  it('renders children when advertiser_platform is true', async () => {
    mockedFeatureFlagsService.get.mockResolvedValueOnce({ advertiser_platform: true });

    renderWithProviders(
      <PlatformGate>
        <p>app content</p>
      </PlatformGate>,
    );

    expect(await screen.findByText('app content')).toBeInTheDocument();
  });

  it('fails open and renders children when the flags request fails', async () => {
    mockedFeatureFlagsService.get.mockRejectedValueOnce(new Error('network error'));

    renderWithProviders(
      <PlatformGate>
        <p>app content</p>
      </PlatformGate>,
    );

    expect(await screen.findByText('app content')).toBeInTheDocument();
  });
});
