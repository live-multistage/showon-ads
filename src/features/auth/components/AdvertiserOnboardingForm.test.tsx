import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdvertiserOnboardingForm } from './AdvertiserOnboardingForm';
import { advertisersService } from '@/features/advertisements/services/advertisers.service';

vi.mock('@/features/advertisements/services/advertisers.service', () => ({
  advertisersService: { create: vi.fn() },
}));

const mockedCreate = vi.mocked(advertisersService.create);

function renderForm() {
  const queryClient = new QueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      <AdvertiserOnboardingForm />
    </QueryClientProvider>,
  );
}

describe('AdvertiserOnboardingForm', () => {
  beforeEach(() => vi.clearAllMocks());

  it('asks for the company name instead of submitting an empty one', () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: 'Criar conta de anunciante' }));

    expect(screen.getByRole('alert')).toHaveTextContent('Informe o nome da empresa.');
    expect(mockedCreate).not.toHaveBeenCalled();
  });

  it('creates the advertiser with the trimmed company name', async () => {
    mockedCreate.mockResolvedValueOnce({} as never);
    renderForm();

    fireEvent.change(screen.getByLabelText('Nome da empresa'), {
      target: { value: '  RockFest Produções  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Criar conta de anunciante' }));

    await waitFor(() =>
      expect(mockedCreate).toHaveBeenCalledWith({ name: 'RockFest Produções' }),
    );
  });
});
