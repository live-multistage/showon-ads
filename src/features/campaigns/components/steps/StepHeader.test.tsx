import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StepHeader } from './StepHeader';

describe('StepHeader', () => {
  it('shows the step counter, title and lead', () => {
    render(<StepHeader step={3} title="Orçamento e período" lead="Você só paga pelo que for entregue." />);
    expect(screen.getByText('PASSO 3 DE 4')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Orçamento e período' })).toBeInTheDocument();
    expect(screen.getByText('Você só paga pelo que for entregue.')).toBeInTheDocument();
  });

  it('lead is optional', () => {
    render(<StepHeader step={2} title="Onde e para quem" />);
    expect(screen.getByText('PASSO 2 DE 4')).toBeInTheDocument();
  });
});
