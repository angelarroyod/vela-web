import { useId, useState } from 'react';
import type { ButtonHTMLAttributes, CSSProperties, InputHTMLAttributes, ReactNode } from 'react';
import { Icon } from '../components/Icon';
import { checkVital, vitalMessage } from '../care/logic';
import type { VitalDef } from '../care/logic';

const fs = (n: number) => `calc(var(--u)*${n})`;

const VARIANTS = {
  primary: { background: 'var(--pri)', color: 'var(--onPri)', border: 'none' },
  outline: { background: 'var(--surface)', color: 'var(--priText)', border: '2px solid var(--pri)' },
  danger: { background: 'var(--danger)', color: '#fff', border: 'none' },
  dangerOutline: { background: 'var(--surface)', color: 'var(--danger)', border: '2px solid var(--danger)' },
  white: { background: 'var(--surface)', color: 'var(--priText)', border: 'none' }, // CTA on a hero card
} satisfies Record<string, CSSProperties>;

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof VARIANTS;
  size?: 'lg' | 'md'; // lg: 56px pill (screen action). md: 52px (inside cards). Default md for `white`.
};

// Full-width pill. One primary per screen; label is a verb that restates the action.
export function Button({ variant = 'primary', size, type = 'button', className, style, children, ...rest }: ButtonProps) {
  const md = (size ?? (variant === 'white' ? 'md' : 'lg')) === 'md';
  return (
    <button type={type} className={className ? `press ${className}` : 'press'} {...rest}
      style={{ ...VARIANTS[variant], width: '100%', minHeight: md ? 52 : 56, borderRadius: md ? 'var(--rbs)' : 'var(--rb)', padding: '14px 20px',
        fontWeight: 700, fontSize: fs(17), lineHeight: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, ...style }}>
      {children}
    </button>
  );
}

export function BackButton({ label = 'Volver', onClick }: { label?: string; onClick: () => void }) {
  return (
    <button type="button" className="press" aria-label={label} onClick={onClick}
      style={{ width: 48, height: 48, borderRadius: 14, border: '1.5px solid var(--line)', background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
      <Icon name="chevronLeft" size={20} strokeWidth={2.2} />
    </button>
  );
}

export type TextFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label: ReactNode;
  hint?: ReactNode;
  error?: string | null | false; // shown with role=alert; say how to fix it
  optional?: boolean; // appends " (opcional)" to the label
  size?: 'md' | 'code'; // code: 64px, big spaced letters (invite code)
  trailing?: ReactNode; // e.g. the show/hide button
  inputStyle?: CSSProperties; // e.g. { flex: 'none', width: 140 } for "Edad"
};

export function TextField({ label, hint, error, optional, size = 'md', trailing, id, style, inputStyle, ...rest }: TextFieldProps) {
  const auto = useId();
  const fid = id ?? auto, hid = `${fid}-hint`, eid = `${fid}-err`;
  const code = size === 'code';
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, ...style }}>
      <label htmlFor={fid} style={{ fontWeight: 700, fontSize: fs(16) }}>
        {label}{optional && <span style={{ fontWeight: 400, color: 'var(--ink2)' }}> (opcional)</span>}
      </label>
      <div style={{ display: 'flex', gap: 8 }}>
        <input id={fid} aria-invalid={error ? true : undefined} aria-describedby={[hint && hid, error && eid].filter(Boolean).join(' ') || undefined} {...rest}
          style={{ flex: 1, minWidth: 0, minHeight: code ? 64 : 56, border: `1.5px solid ${error ? 'var(--danger)' : 'var(--field)'}`, borderRadius: 14, padding: '0 16px',
            fontSize: code ? fs(28) : fs(17), fontWeight: code ? 700 : 400, letterSpacing: code ? '.3em' : undefined, textAlign: code ? 'center' : undefined,
            background: 'var(--surface)', ...inputStyle }} />
        {trailing}
      </div>
      {hint && <span id={hid} style={{ fontSize: fs(15), color: 'var(--ink2)' }}>{hint}</span>}
      {error && <p id={eid} role="alert" style={{ margin: 0, color: 'var(--danger)', fontWeight: 700, fontSize: fs(15) }}>{error}</p>}
    </div>
  );
}

// TextField with a "Mostrar"/"Ocultar" toggle. The verb itself carries the state, so no aria-pressed
// (a pressed toggle must keep a fixed name); the name adds "contraseña" for context.
export function PasswordField(props: Omit<TextFieldProps, 'type' | 'trailing'>) {
  const [show, setShow] = useState(false);
  return (
    <TextField type={show ? 'text' : 'password'} {...props}
      trailing={
        <button type="button" className="press" aria-label={`${show ? 'Ocultar' : 'Mostrar'} contraseña`} onClick={() => setShow((s) => !s)}
          style={{ minWidth: 92, minHeight: 56, border: '1.5px solid var(--line)', borderRadius: 14, background: 'var(--surface)', fontWeight: 700, fontSize: fs(15), color: 'var(--priText)' }}>
          {show ? 'Ocultar' : 'Mostrar'}
        </button>
      } />
  );
}

// The whole bordered row is the checkbox (consent).
// describedBy: id of the error shown for this row (also marks it invalid).
export function CheckboxRow({ checked, onChange, children, describedBy }: { checked: boolean; onChange: (next: boolean) => void; children: ReactNode; describedBy?: string }) {
  return (
    <button type="button" className="press" role="checkbox" aria-checked={checked} aria-describedby={describedBy} aria-invalid={describedBy ? true : undefined} onClick={() => onChange(!checked)}
      style={{ display: 'flex', gap: 14, alignItems: 'flex-start', textAlign: 'left', width: '100%', minHeight: 56, padding: 14, border: '1.5px solid var(--line)', borderRadius: 14, background: 'var(--surface)' }}>
      <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 8, border: `2px solid ${checked ? 'var(--pri)' : 'var(--field)'}`, background: checked ? 'var(--pri)' : 'var(--surface)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {checked && <Icon name="check" size={18} strokeWidth={3} color="#fff" />}
      </span>
      <span style={{ fontSize: fs(15), lineHeight: 1.45 }}>{children}</span>
    </button>
  );
}

// One option in a role="radiogroup" (wrap the set with aria-labelledby). Selected = filled dot + border + tint.
export function RadioCard({ checked, onSelect, title, description }: { checked: boolean; onSelect: () => void; title: ReactNode; description?: ReactNode }) {
  const c = checked ? 'var(--pri)' : 'var(--line)';
  return (
    <button type="button" className="press" role="radio" aria-checked={checked} onClick={onSelect}
      style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', padding: 18, borderRadius: 'var(--r)', border: `2px solid ${c}`, background: checked ? 'var(--priSoft)' : 'var(--surface)' }}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span style={{ fontWeight: 700, fontSize: fs(19) }}>{title}</span>
        {description && <span style={{ fontSize: fs(15), color: 'var(--ink2)', lineHeight: 1.4 }}>{description}</span>}
      </span>
      <span aria-hidden="true" style={{ width: 28, height: 28, borderRadius: 99, border: `2px solid ${c}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <span style={{ width: 14, height: 14, borderRadius: 99, background: checked ? 'var(--pri)' : 'transparent' }} />
      </span>
    </button>
  );
}

export function SwitchRow({ checked, onChange, label, description }: { checked: boolean; onChange: (next: boolean) => void; label: ReactNode; description?: ReactNode }) {
  return (
    <button type="button" className="press" role="switch" aria-checked={checked} onClick={() => onChange(!checked)}
      style={{ display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left', width: '100%', minHeight: 72, padding: '14px 16px', background: 'var(--surface)', border: '1.5px solid var(--line)', borderRadius: 'var(--r)' }}>
      <span style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontWeight: 700, fontSize: fs(17) }}>{label}</span>
        {description && <span style={{ fontSize: fs(15), color: 'var(--ink2)', lineHeight: 1.35 }}>{description}</span>}
      </span>
      <span aria-hidden="true" style={{ width: 56, height: 32, borderRadius: 99, background: checked ? 'var(--pri)' : 'var(--field)', display: 'flex', alignItems: 'center', padding: 3,
        justifyContent: checked ? 'flex-end' : 'flex-start', flexShrink: 0 }}>
        <span style={{ width: 26, height: 26, borderRadius: 99, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.25)' }} />
      </span>
    </button>
  );
}

// One vital sign, checked against its normal range and explained in words. Input id = "v-" + def.k.
export function VitalField({ def, value, onChange }: { def: VitalDef; value: string; onChange: (value: string) => void }) {
  const s = checkVital(def, value);
  const warn = s === 'high' || s === 'low', bad = warn || s === 'invalid';
  const id = 'v-' + def.k, mid = id + '-m';
  const color = s === 'ok' ? 'var(--ok)' : warn ? 'var(--warnInk)' : s === 'invalid' ? 'var(--danger)' : 'var(--ink2)';
  const border = warn ? 'var(--warn)' : s === 'invalid' ? 'var(--danger)' : 'var(--line)';
  return (
    <div style={{ background: 'var(--surface)', border: `2px solid ${border}`, borderRadius: 'var(--r)', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
      <label htmlFor={id} style={{ fontWeight: 700, fontSize: fs(16) }}>{def.label}</label>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <input id={id} inputMode="decimal" value={value} onChange={(e) => onChange(e.target.value)} aria-describedby={mid} aria-invalid={bad || undefined}
          style={{ width: 150, minHeight: 54, border: '1.5px solid var(--field)', borderRadius: 12, padding: '0 14px', fontSize: fs(26), fontWeight: 700, background: 'var(--surface)' }} />
        <span style={{ fontSize: fs(16), color: 'var(--ink2)', fontWeight: 600 }}>{def.unit}</span>
      </div>
      <p id={mid} style={{ margin: 0, display: 'flex', gap: 8, alignItems: 'center', fontSize: fs(15), fontWeight: s === 'empty' ? 400 : 700, color }}>
        {s === 'ok' && <Icon name="check" size={18} strokeWidth={2.8} />}
        {bad && <Icon name="warning" size={18} strokeWidth={2.4} />}
        {vitalMessage(def, s, value)}
      </p>
    </div>
  );
}
