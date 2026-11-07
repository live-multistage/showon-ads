import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DeliveryDiagnosis } from './DeliveryDiagnosis';

vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
}));

describe('DeliveryDiagnosis', () => {
  it('renders nothing while the campaign is simply delivering', () => {
    const { container } = render(<DeliveryDiagnosis delivery="ok" startsAt="2026-11-01T00:00:00Z" />);
    expect(container).toBeEmptyDOMElement();
  });

  it('no funds: explains it comes back on its own and links to the wallet', () => {
    render(<DeliveryDiagnosis delivery="nofunds" startsAt="2026-11-01T00:00:00Z" />);
    expect(screen.getByRole('status')).toHaveTextContent('Parada: a carteira está sem saldo');
    expect(screen.getByRole('status')).toHaveTextContent('volta na hora, sem nova análise');
    expect(screen.getByRole('link', { name: 'Adicionar créditos' })).toHaveAttribute('href', '/billing');
  });

  it('rejected: shows the reviewer reason', () => {
    render(<DeliveryDiagnosis delivery="rejected" startsAt="2026-11-01T00:00:00Z" rejectionReason="Texto ilegível" />);
    expect(screen.getByRole('status')).toHaveTextContent('Precisa de ajuste');
    expect(screen.getByRole('status')).toHaveTextContent('Motivo: Texto ilegível');
  });

  it('scheduled: names the start date', () => {
    render(<DeliveryDiagnosis delivery="scheduled" startsAt="2026-11-10T12:00:00Z" />);
    expect(screen.getByRole('status')).toHaveTextContent('Começa em 10/11');
  });

  it('video draft without file asks for the video', () => {
    render(<DeliveryDiagnosis delivery="novideo" startsAt="2026-11-10T12:00:00Z" />);
    expect(screen.getByRole('status')).toHaveTextContent('Falta enviar o vídeo');
  });

  it.each(['daily', 'limit', 'review', 'paused', 'ended', 'draft', 'expired'] as const)('has copy for %s', (delivery) => {
    render(<DeliveryDiagnosis delivery={delivery} startsAt="2026-11-10T12:00:00Z" />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});
