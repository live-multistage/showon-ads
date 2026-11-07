import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PlayerPreview } from './PlayerPreview';

describe('PlayerPreview — pause', () => {
  it('Padrão keeps the shrunken video card and the live badge', () => {
    render(<PlayerPreview kind="pause" pauseVariant="STANDARD" title="Gelada no intervalo" creativeUrl={null} />);
    expect(screen.getByRole('img', { name: /variante Padrão/ })).toBeInTheDocument();
    expect(screen.getAllByText('AO VIVO').length).toBeGreaterThan(0);
    expect(screen.getByText('A transmissão encolhe para o card à esquerda. Título e botões ficam à direita.')).toBeInTheDocument();
  });

  it('Tela cheia drops the video card', () => {
    render(<PlayerPreview kind="pause" pauseVariant="FULLSCREEN" title="x" creativeUrl={null} />);
    expect(screen.getByRole('img', { name: /variante Tela cheia/ })).toBeInTheDocument();
    expect(screen.getByText('A transmissão some. Ficam só os controles da live ou do replay.')).toBeInTheDocument();
  });

  it('phone always renders Tela cheia, even for Padrão', () => {
    render(<PlayerPreview kind="pause" pauseVariant="STANDARD" title="x" creativeUrl={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Celular' }));
    expect(screen.getByRole('img', { name: /variante Tela cheia/ })).toBeInTheDocument();
    expect(screen.getByText(/No celular a pausa é sempre Tela cheia/)).toBeInTheDocument();
  });

  it('uses the typed title, with a placeholder while empty', () => {
    const { rerender } = render(<PlayerPreview kind="pause" pauseVariant="STANDARD" title="" creativeUrl={null} />);
    expect(screen.getByText('Título da campanha')).toBeInTheDocument();
    rerender(<PlayerPreview kind="pause" pauseVariant="STANDARD" title="Gelada no intervalo" creativeUrl={null} />);
    expect(screen.getByText('Gelada no intervalo')).toBeInTheDocument();
  });

  it('shows the chosen image and the Patrocinado tag', () => {
    const { container } = render(<PlayerPreview kind="pause" pauseVariant="STANDARD" title="x" creativeUrl="blob:img" />);
    expect(container.querySelector('img')).toHaveAttribute('src', 'blob:img');
    expect(screen.getByText('Patrocinado')).toBeInTheDocument();
  });

  it('switches to replay', () => {
    render(<PlayerPreview kind="pause" pauseVariant="STANDARD" title="x" creativeUrl={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Replay' }));
    expect(screen.getAllByText('REPLAY').length).toBeGreaterThan(0);
  });

  it('the safe area toggle shows the controls zone', () => {
    render(<PlayerPreview kind="pause" pauseVariant="FULLSCREEN" title="x" creativeUrl={null} />);
    expect(screen.queryByText('CONTROLES')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Área segura' }));
    expect(screen.getByText('CONTROLES')).toBeInTheDocument();
  });
});

describe('PlayerPreview — pre-roll', () => {
  it('shows the Patrocinado counter, the title as action button and Pular em 4', () => {
    render(<PlayerPreview kind="preroll" pauseVariant={null} title="Rota Sul 2026" creativeUrl={null} />);
    expect(screen.getByText('Patrocinado · 19 s')).toBeInTheDocument();
    expect(screen.getByText('Rota Sul 2026 →')).toBeInTheDocument();
    expect(screen.getByText('Pular em 4')).toBeInTheDocument();
  });

  it('"Depois de 5 s" shows Pular anúncio', () => {
    render(<PlayerPreview kind="preroll" pauseVariant={null} title="x" creativeUrl={null} />);
    fireEvent.click(screen.getByRole('button', { name: 'Depois de 5 s' }));
    expect(screen.getByText('Pular anúncio')).toBeInTheDocument();
  });

  it('has no Celular toggle', () => {
    render(<PlayerPreview kind="preroll" pauseVariant={null} title="x" creativeUrl={null} />);
    expect(screen.queryByRole('button', { name: 'Celular' })).toBeNull();
  });
});
