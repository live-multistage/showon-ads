import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button, Dialog, DialogContent, DialogTitle } from './index';

// Smoke test: proves the barrel export resolves and SCSS module imports
// (button.module.scss, dialog.module.scss) don't blow up module resolution
// when this package is consumed standalone, outside live-show-react.
describe('@live-show/design-system barrel export', () => {
  it('renders Button from the barrel export', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders a Dialog primitive from the barrel export', () => {
    render(
      <Dialog open>
        <DialogContent>
          <DialogTitle>Smoke test dialog</DialogTitle>
        </DialogContent>
      </Dialog>,
    );
    expect(screen.getByText('Smoke test dialog')).toBeInTheDocument();
  });
});
