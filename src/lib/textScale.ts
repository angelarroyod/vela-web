import { useState } from 'react';

const KEY = 'lazo.textScale';

// 100–200 % in steps of 10.
const clamp = (n: number) => Math.min(200, Math.max(100, Math.round(n / 10) * 10));

function read(): number {
  try {
    const n = Number(localStorage.getItem(KEY));
    return n ? clamp(n) : 100;
  } catch {
    return 100;
  }
}

const apply = (scale: number) => document.documentElement.style.setProperty('--u', scale / 100 + 'px');

// Call once before the first render so text never jumps.
export const applyStoredScale = () => apply(read());

export function useTextScale(): [number, (scale: number) => void] {
  const [scale, set] = useState(read);
  const setScale = (n: number) => {
    const v = clamp(n);
    set(v);
    apply(v);
    try { localStorage.setItem(KEY, String(v)); } catch { /* private mode: still applied for this visit */ }
  };
  return [scale, setScale];
}
