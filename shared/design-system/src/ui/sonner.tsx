'use client';

import { Toaster as Sonner, type ToasterProps } from 'sonner';
import './sonner.css';

// Toast duration must stay in sync with the countdown-bar animation in
// sonner.css (--ls-toast-duration / lsCountdown 4.6s). Change both together.
const TOAST_DURATION_MS = 4600;

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.3,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const icons = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v4M12 16h.01" />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}>
      <path d="M10.3 3.4L2.5 18a2 2 0 0 0 1.7 3h15.6a2 2 0 0 0 1.7-3L13.7 3.4a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" {...stroke}>
      <circle cx="12" cy="12" r="9" />
      <path d="M15 9l-6 6M9 9l6 6" />
    </svg>
  ),
};

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="dark"
    position="bottom-right"
    duration={TOAST_DURATION_MS}
    closeButton
    icons={icons}
    gap={12}
    {...props}
  />
);

export { Toaster };
