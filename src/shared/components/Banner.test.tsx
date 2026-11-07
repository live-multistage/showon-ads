import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Banner } from './Banner';

describe('Banner', () => {
  it('renders title, text and action', () => {
    render(
      <Banner tone="warn" title="Saldo baixo." action={<button>Adicionar</button>}>
        Abaixo de R$ 20,00.
      </Banner>,
    );
    expect(screen.getByRole('status')).toHaveTextContent('Saldo baixo.');
    expect(screen.getByText('Abaixo de R$ 20,00.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Adicionar' })).toBeInTheDocument();
  });
});
