import type { CSSProperties, ElementType, HTMLAttributes, ReactNode } from 'react';
import { Icon } from '../components/Icon';
import type { IconName } from '../components/Icon';
import { BackButton } from './controls';

const fs = (n: number) => `calc(var(--u)*${n})`;

// Content column: 20px side padding on phones (24px + max 440px for `form`), 680px centered column from 900px.
export function Screen({ gap = 16, form = false, style, children }: { gap?: number; form?: boolean; style?: CSSProperties; children: ReactNode }) {
  return <div className={form ? 'lz-screen lz-form' : 'lz-screen'} style={{ gap, ...style }}>{children}</div>;
}

// Page h1 (display face) + optional subtitle. With `onBack`: back button beside a 30px title (pushed screens).
export function ScreenHeader({ title, sub, onBack, backLabel = 'Volver', size }: {
  title: ReactNode; sub?: ReactNode; onBack?: () => void; backLabel?: string; size?: number;
}) {
  const h1 = (
    <div>
      <h1 style={{ margin: 0, fontFamily: 'var(--fd)', fontWeight: 'var(--fdw)', fontSize: fs(size ?? (onBack ? 30 : 32)), lineHeight: 1.1 }}>{title}</h1>
      {sub && <p style={{ margin: onBack ? '2px 0 0' : '6px 0 0', fontSize: fs(onBack ? 15 : 16), color: 'var(--ink2)' }}>{sub}</p>}
    </div>
  );
  if (!onBack) return h1;
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}><BackButton label={backLabel} onClick={onBack} />{h1}</div>;
}

// Onboarding: back button + "Paso n de 3", then the segment bar.
export function StepProgress({ step, total = 3, onBack, backLabel = 'Volver' }: { step: number; total?: number; onBack?: () => void; backLabel?: string }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        {onBack ? <BackButton label={backLabel} onClick={onBack} /> : <span />}
        <span style={{ fontWeight: 700, fontSize: fs(15), color: 'var(--ink2)' }}>Paso {step} de {total}</span>
      </div>
      <div aria-hidden="true" style={{ display: 'flex', gap: 6 }}>
        {Array.from({ length: total }, (_, i) => <div key={i} style={{ flex: 1, height: 6, borderRadius: 9, background: i < step ? 'var(--pri)' : 'var(--line)' }} />)}
      </div>
    </>
  );
}

const CARD = {
  default: { background: 'var(--surface)', border: '1.5px solid var(--line)' },
  hero: { background: 'var(--hero)', color: 'var(--heroInk)' },
  heroDanger: { background: 'var(--danger)', color: 'var(--heroInk)' }, // hero when something needs action now (fever)
  warn: { background: 'var(--warnSoft)', border: '2px solid var(--warn)', color: 'var(--warnInk)' },
  soft: { background: 'var(--priSoft)', border: '2px solid var(--ok)', color: 'var(--priText)' },
} satisfies Record<string, CSSProperties>;

// Flat bordered block (no shadow). `as="section"` + aria-labelledby for titled groups.
export function Card({ as = 'div', tone = 'default', gap = 10, padding = 16, style, children, ...rest }: HTMLAttributes<HTMLElement> & {
  as?: 'div' | 'section' | 'li'; tone?: keyof typeof CARD; gap?: number; padding?: number | string;
}) {
  const Tag: ElementType = as;
  return <Tag {...rest} style={{ ...CARD[tone], borderRadius: 'var(--r)', padding, display: 'flex', flexDirection: 'column', gap, ...style }}>{children}</Tag>;
}

// Tappable row that leads somewhere; its state goes in `sub`.
export function ListRow({ title, sub, onClick, chevron = true }: { title: ReactNode; sub?: ReactNode; onClick: () => void; chevron?: boolean }) {
  return (
    <button type="button" className="press" onClick={onClick}
      style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, minHeight: sub ? 68 : 64, padding: '14px 16px', background: 'var(--surface)',
        border: '1.5px solid var(--line)', borderRadius: 'var(--r)', textAlign: 'left' }}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: fs(17) }}>{title}</span>
        {sub && <span style={{ fontSize: fs(15), color: 'var(--ink2)' }}>{sub}</span>}
      </span>
      {chevron && <Icon name="chevronRight" size={20} strokeWidth={2.4} style={{ color: 'var(--ink2)' }} />}
    </button>
  );
}

// Initials on the soft tint. Decorative unless `onClick` (then a button named by `label`).
// ponytail: px font sizes as in the design — the glyph lives in a fixed-size box and must not outgrow it.
export function Avatar({ text, size = 48, radius = 99, display = false, fontSize, label, onClick }: {
  text: string; size?: number; radius?: number; display?: boolean; fontSize?: number; label?: string; onClick?: () => void;
}) {
  const style: CSSProperties = { width: size, height: size, borderRadius: radius, border: 'none', background: 'var(--priSoft)', color: 'var(--priText)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontWeight: display ? 'var(--fdw)' : 700,
    fontFamily: display ? 'var(--fd)' : undefined, fontSize: fontSize ?? (display ? Math.round(size * 0.46) : 15) };
  if (onClick) return <button type="button" className="press" aria-label={label} onClick={onClick} style={style}>{text}</button>;
  return <div aria-hidden="true" style={style}>{text}</div>;
}

const CHIP = {
  neutral: { border: '1.5px solid var(--line)', color: 'var(--ink2)', fontWeight: 600, borderRadius: 99, padding: '7px 12px' },
  status: { background: 'var(--priSoft)', color: 'var(--priText)', fontWeight: 700, borderRadius: 99, padding: '7px 12px' },
  warn: { background: 'var(--warnSoft)', color: 'var(--warnInk)', fontWeight: 700, borderRadius: 99, padding: '7px 12px' },
  data: { background: 'var(--priSoft)', color: 'var(--priText)', fontWeight: 700, borderRadius: 8, padding: '6px 10px' },
} satisfies Record<string, CSSProperties>;

// neutral: condition tag. status/warn: icon + word (never colour alone). data: a reading ("Pulso 72").
export function Chip({ tone = 'neutral', icon, children }: { tone?: keyof typeof CHIP; icon?: IconName; children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: fs(14), ...CHIP[tone] }}>
      {icon && <Icon name={icon} size={16} strokeWidth={2.8} />}{children}
    </span>
  );
}

// Section heading. Default: 18px ("En este turno"). `eyebrow`: 14px spaced caps label ("RESUMEN").
export function SectionLabel({ id, eyebrow = false, children }: { id?: string; eyebrow?: boolean; children: ReactNode }) {
  return (
    <h2 id={id} style={eyebrow
      ? { margin: 0, fontSize: fs(14), fontWeight: 700, letterSpacing: '.06em', color: 'var(--ink2)' }
      : { margin: 0, fontSize: fs(18), fontWeight: 700 }}>
      {children}
    </h2>
  );
}
