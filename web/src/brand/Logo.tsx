// The Baitward mark: a shield (ward — protection) whose inner line is a fish-hook
// (bait). Drawn as a single-colour line mark in currentColor, so it works in one
// ink and stays legible down to 16px. Set the colour via CSS `color`.
import type { CSSProperties } from 'react';

type LogoProps = {
  variant?: 'full' | 'icon';
  size?: number; // height of the icon in px
  title?: string;
};

export function Logo({ variant = 'full', size = 28, title = 'Baitward' }: LogoProps) {
  const icon = (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      role="img"
      aria-label={title}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {/* shield / ward */}
      <path d="M12 2.6 L19.4 5.3 V11.2 C19.4 15.7 16.2 19.2 12 21.4 C7.8 19.2 4.6 15.7 4.6 11.2 V5.3 Z" />
      {/* hook / bait */}
      <path d="M11.3 7.5 V12.3 A2.1 2.1 0 1 0 13.4 12.3 L13.1 10.8" />
    </svg>
  );

  if (variant === 'icon') return icon;

  const wordmarkStyle: CSSProperties = {
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    fontSize: size * 0.64,
    letterSpacing: '-0.01em',
    color: 'var(--text)',
  };

  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, color: 'var(--accent)' }}>
      {icon}
      <span style={wordmarkStyle}>Baitward</span>
    </span>
  );
}
