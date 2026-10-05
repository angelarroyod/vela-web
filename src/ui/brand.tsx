import { useState } from 'react';

const BOW = 'M36 100C46 84 54 70 60 60C74 34 102 20 104 44C106 66 80 72 60 60C40 72 14 66 16 44C18 20 46 34 60 60C66 70 74 84 84 100';
const WORDMARK = "'Bricolage Grotesque', system-ui, sans-serif";
const vb = { transformBox: 'view-box' } as const;
// Reduced motion turns the animation off in CSS, so the label mustn't promise a replay.
const still = () => typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

// Welcome mark: the line ties itself into a bow, the knot pops, the name rises (2.8 s, once). Tap to replay.
// The name is the page's <h1>.
export function Logo() {
  const [k, setK] = useState(0);
  return (
    <div data-anim="" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <button type="button" onClick={() => setK(k + 1)} aria-label={`Logotipo de Lazo: una sola línea que se anuda en un lazo.${still() ? '' : ' Toca para repetir la animación.'}`}
        style={{ background: 'none', border: 'none', padding: 4, color: 'var(--logoInk)', borderRadius: 24, lineHeight: 0 }}>
        <svg width={136} height={136} viewBox="0 0 120 120" aria-hidden="true" style={{ overflow: 'visible' }}>
          {/* keyed (not the button) so a replay keeps keyboard focus */}
          <g key={k} style={{ ...vb, transformOrigin: '60px 60px', animation: 'lazoTie .7s ease-in-out 1.75s' }}>
            <path d={BOW} pathLength={1} fill="none" stroke="currentColor" strokeWidth={8} strokeLinecap="round" strokeLinejoin="round"
              style={{ strokeDasharray: 1, animation: 'lazoDraw 1.8s cubic-bezier(.65,0,.35,1) .1s backwards' }} />
            <circle cx={60} cy={60} r={10} style={{ fill: 'var(--logoAccent)', ...vb, transformOrigin: '60px 60px', animation: 'lazoPop .6s cubic-bezier(.3,1.6,.5,1) 1.6s backwards' }} />
          </g>
        </svg>
      </button>
      <h1 style={{ margin: 0, fontFamily: WORDMARK, fontWeight: 800, letterSpacing: '-.02em', fontSize: 'calc(var(--u)*58)', lineHeight: 1, color: 'var(--welcomeInk)' }}>
        <span className="sr-only">Lazo</span>
        <span key={k} aria-hidden="true" style={{ display: 'inline-flex' }}>
          {'Lazo'.split('').map((c, i) => (
            <span key={i} style={{ display: 'inline-block', animation: `lazoRise .7s cubic-bezier(.2,.8,.2,1) ${(1.8 + i * 0.08).toFixed(2)}s backwards` }}>{c}</span>
          ))}
        </span>
      </h1>
    </div>
  );
}

// The small 36px tile (nurse home header, sidebar). Decorative; `withName` adds the visible "Lazo" wordmark.
export function LogoMark({ withName = false }: { withName?: boolean }) {
  const tile = (
    <div aria-hidden="true" style={{ width: 36, height: 36, borderRadius: 11, background: 'var(--welcome)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <svg width={30} height={30} viewBox="0 0 120 120">
        <path d={BOW} fill="none" strokeWidth={11} strokeLinecap="round" strokeLinejoin="round" style={{ stroke: 'var(--logoInk)' }} />
        <circle cx={60} cy={60} r={12} style={{ fill: 'var(--logoAccent)' }} />
      </svg>
    </div>
  );
  if (!withName) return tile;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      {tile}
      <span style={{ fontFamily: WORDMARK, fontWeight: 800, fontSize: 'calc(var(--u)*20)', letterSpacing: '-.02em' }}>Lazo</span>
    </div>
  );
}
