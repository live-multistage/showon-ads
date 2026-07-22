import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AppShell } from './AppShell';

// Smoke test: proves the Vitest runner + @live-show/design-system package
// resolution (Logo import + SCSS module) work inside this new app, and that
// the shell renders both nav and children.
describe('AppShell', () => {
  it('renders the nav branding and children', () => {
    render(
      <AppShell>
        <p>page content</p>
      </AppShell>,
    );

    expect(screen.getByText('LIVESHOW')).toBeInTheDocument();
    expect(screen.getByText('page content')).toBeInTheDocument();
  });
});
