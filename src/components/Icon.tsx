import type { CSSProperties, ReactNode } from 'react';

// Lazo line icons: 24px grid, round strokes, currentColor. Paths from the design's icon set (D map + inline svgs).
const PATHS = {
  home: 'M3 10.5 12 3l9 7.5M5 9.5V20h14V9.5',
  pulse: 'M3 12h4l2-6 3 12 2-6h7',
  clipboard: 'M9 3.5h6v3H9zM7.5 5H6a1.5 1.5 0 0 0-1.5 1.5v13A1.5 1.5 0 0 0 6 21h12a1.5 1.5 0 0 0 1.5-1.5v-13A1.5 1.5 0 0 0 18 5h-1.5M9 12h6M9 15.5h4',
  user: 'M12 4.5a3.5 3.5 0 1 1 0 7 3.5 3.5 0 0 1 0-7zM5 20c0-3.6 3-6 7-6s7 2.4 7 6',
  chat: 'M5 6h14v9H10l-4 3.5V15H5z',
  message: 'M5 6h14v9H10l-4 3.5V15H5z',
  chevronRight: 'M9 5l7 7-7 7',
  chevronLeft: 'M15 5l-7 7 7 7',
  check: 'M5 12.5l4.5 4.5L19 6.5',
  warning: 'M12 8v5M12 16.5v.01M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z',
  phone: 'M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L20 13l1 4v2a2 2 0 0 1-2 2A16 16 0 0 1 3 7a2 2 0 0 1 2-3z',
  send: 'M22 2 11 13M22 2l-7 20-4-9-9-4 20-7z',
  heart: 'M12 20s-6.5-4-6.5-8.5A3.4 3.4 0 0 1 12 8a3.4 3.4 0 0 1 6.5 3.5C18.5 16 12 20 12 20z',
  wifiOff: 'M2 8.8a15 15 0 0 1 4.2-2.6M9.5 5.2A15 15 0 0 1 22 8.8M5 12.5a10 10 0 0 1 3.4-2M13 10.2a10 10 0 0 1 6 2.3M8.5 16a5 5 0 0 1 7 0M12 20h.01M3 3l18 18',
  plus: 'M12 5v14M5 12h14',
  bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10.5 21a1.8 1.8 0 0 0 3 0',
  medication: 'M10.5 13.5 7 17a3.5 3.5 0 0 1-5-5l3.5-3.5M13.5 10.5 17 7a3.5 3.5 0 0 0-5-5L8.5 5.5M9 15l6-6',
  pill: 'M10.5 13.5 7 17a3.5 3.5 0 0 1-5-5l3.5-3.5M13.5 10.5 17 7a3.5 3.5 0 0 0-5-5L8.5 5.5M9 15l6-6',
  // legacy (pre-Lazo views)
  bulb: 'M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10c.6.6 1 1.3 1 2h6c0-.7.4-1.4 1-2a6 6 0 0 0-4-10z',
  warningTri: 'M12 8v5M12 16.5v.01M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z',
  warningCircle: 'M12 8v5M12 16.5v.01',
  switch: 'M7 16V4M7 4 3.5 7.5M7 4l3.5 3.5M17 8v12m0 0 3.5-3.5M17 20l-3.5-3.5',
};

export type IconName = keyof typeof PATHS | 'drop';

// Decorative (aria-hidden): always sit next to a word, or give the button an aria-label.
export function Icon({
  name, size = 24, color = 'currentColor', strokeWidth = 2, style,
}: {
  name: IconName; size?: number; color?: string; strokeWidth?: number; style?: CSSProperties;
}) {
  const body: ReactNode = name === 'drop'
    ? <><path d="M12 3c0 4-3 5-3 8a3 3 0 0 0 6 0c0-3-3-4-3-8z" fill={color} /><path d="M8 16a4 4 0 0 0 8 0" stroke={color} strokeWidth={1.6} strokeLinecap="round" fill="none" /></>
    : <path d={PATHS[name]} fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round" />;
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" style={{ flexShrink: 0, ...style }}>{body}</svg>;
}
