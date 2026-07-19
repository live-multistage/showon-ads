import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CampaignWizard } from './CampaignWizard';
import { eventsService } from '@/features/advertisements/services/events.service';
import type { EventSearchResponse } from '@/features/advertisements/types/event-search.types';

vi.mock('@/features/advertisements/services/events.service', () => ({
  eventsService: {
    search: vi.fn(),
  },
}));

const mockedEventsService = vi.mocked(eventsService, true);

describe('CampaignWizard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('cannot advance the creative step without a title and format', () => {
    render(<CampaignWizard />);

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('Informe um título para a campanha.')).toBeInTheDocument();
    expect(screen.getByLabelText('Título')).toBeInTheDocument();
  });

  it('advances to destination once title and format are filled in', () => {
    render(<CampaignWizard />);

    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Horizontal (728×90)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByRole('group', { name: 'Tipo de destino' })).toBeInTheDocument();
  });

  function fillCreativeStep() {
    fireEvent.change(screen.getByLabelText('Título'), { target: { value: 'Summer Promo' } });
    fireEvent.click(screen.getByRole('combobox'));
    fireEvent.click(screen.getByRole('option', { name: 'Horizontal (728×90)' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
  }

  it('rejects http:// for the EXTERNAL_URL destination', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: 'http://example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('A URL deve começar com https://.')).toBeInTheDocument();
  });

  it('accepts a valid https:// URL and advances past destination', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));
    fireEvent.change(screen.getByLabelText('URL de destino'), { target: { value: 'https://example.com/landing' } });
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));

    expect(screen.getByText('Esta etapa será implementada em breve.')).toBeInTheDocument();
  });

  it('requires a picked event before advancing the EVENT destination', async () => {
    const response: EventSearchResponse = {
      items: [{ id: 'evt-1', title: 'Big Show', bannerUrl: null, thumbnailUrl: null, startsAt: '2026-01-01', status: 'PUBLISHED' }],
      page: 1,
      pageSize: 20,
      total: 1,
    };
    mockedEventsService.search.mockResolvedValue(response);

    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));
    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Selecione um evento.')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Buscar evento'), { target: { value: 'Big' } });

    await waitFor(() => expect(mockedEventsService.search).toHaveBeenCalledWith('Big'));
    fireEvent.click(await screen.findByRole('button', { name: 'Big Show' }));

    // Picking the event sets the query to its title; the debounced search
    // must not re-fire (and reopen the dropdown) on that same value.
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(mockedEventsService.search).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('button', { name: 'Big Show' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próximo' }));
    expect(screen.getByText('Esta etapa será implementada em breve.')).toBeInTheDocument();
  });

  it('shows the banner-required warning for EXTERNAL_URL without a staged file', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'URL externa' }));

    expect(
      screen.getByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).toBeInTheDocument();
  });

  it('does not show the banner-required warning for the EVENT destination', () => {
    render(<CampaignWizard />);
    fillCreativeStep();

    fireEvent.click(screen.getByRole('button', { name: 'Evento' }));

    expect(
      screen.queryByText('Anúncios com URL externa precisam de um banner antes de serem enviados para revisão.'),
    ).not.toBeInTheDocument();
  });
});
