export type Background = 'dark' | 'light';

export const MERMAID_THEME: Record<Background, string> = {
  dark: 'dark',
  light: 'default',
};

export const BG_COLOR: Record<Background, string> = {
  dark: '#0e0e10',
  light: '#ffffff',  // export colour — pure white, not the Primer chrome grey
};
