import { useCallback, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '../components/Icon';
import { Button } from './controls';
import { ToastContext } from './toast';
import type { ToastFn, ToastState } from './toast';

const fs = (n: number) => `calc(var(--u)*${n})`;

const ALERT = {
  danger: { background: 'var(--dangerSoft)', border: '2px solid var(--danger)', color: 'var(--danger)' },
  warn: { background: 'var(--warnSoft)', border: '2px solid var(--warn)', color: 'var(--warnInk)' },
  info: { background: 'var(--surface)', border: '1.5px solid var(--line)' },
} satisfies Record<string, CSSProperties>;

// Icon + plain sentence. Without `title` the sentence is bold (vitals warnings); with `title` it is a bold lead-in
// ("Importante:", "Para saber:") followed by normal text. Pass role="alert" when it appears in response to input.
export function Alert({ tone = 'warn', title, role, action, children, style }: {
  tone?: keyof typeof ALERT; title?: string; role?: 'alert' | 'status'; action?: ReactNode; children: ReactNode; style?: CSSProperties;
}) {
  const leadColor = tone === 'danger' ? 'var(--danger)' : undefined;
  return (
    <div role={role} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', ...ALERT[tone], borderRadius: 'var(--r)', padding: '14px 16px', ...style }}>
      <Icon name={tone === 'info' ? 'check' : 'warning'} size={22} strokeWidth={tone === 'info' ? 2.8 : 2.2} style={{ marginTop: 1, color: tone === 'info' ? 'var(--ok)' : undefined }} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <p style={{ margin: 0, fontSize: fs(16), lineHeight: 1.4, fontWeight: title ? 400 : 700, color: title && tone === 'danger' ? 'var(--ink)' : undefined }}>
          {title && <><b style={{ color: leadColor }}>{title}</b>{' '}</>}{children}
        </p>
        {action}
      </div>
    </div>
  );
}

// Visible sentence + a bar that exposes its value to screen readers.
export function ProgressBar({ value, max, label }: { value: number; max: number; label: ReactNode }) {
  const id = useId();
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <p id={id} style={{ margin: 0, fontWeight: 700, fontSize: fs(17) }}>{label}</p>
      <div role="progressbar" aria-labelledby={id} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value}
        style={{ height: 10, background: 'var(--line)', borderRadius: 99, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${max ? Math.min(100, (value / max) * 100) : 0}%`, background: 'var(--pri)', borderRadius: 99 }} />
      </div>
    </div>
  );
}

// Dashed placeholder that says what will appear here.
export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <p style={{ margin: 0, padding: 16, border: '1.5px dashed var(--field)', borderRadius: 'var(--r)', fontSize: fs(16), color: 'var(--ink2)', lineHeight: 1.45 }}>
      {children}
    </p>
  );
}

// Confirmation for consequential actions. Modal dialog in a portal: focus moves in, Tab stays in, Esc / scrim / "Volver" close,
// focus returns to the opener.
export function Sheet({ open, title, items = [], children, confirmLabel, onConfirm, onClose, tone = 'primary', cancelLabel = 'Volver', busy = false }: {
  open: boolean; title: string; items?: ReactNode[]; children?: ReactNode;
  confirmLabel: string; onConfirm: () => void; onClose: () => void;
  tone?: 'primary' | 'danger'; cancelLabel?: string; busy?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; });
  const hid = useId();

  useEffect(() => {
    if (!open) return;
    const root = ref.current;
    if (!root) return;
    const opener = document.activeElement as HTMLElement | null;
    root.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return; }
      if (e.key !== 'Tab') return;
      const f = [...root.querySelectorAll<HTMLElement>('button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])')].filter((el) => !el.hasAttribute('disabled'));
      if (!f.length) return;
      const a = document.activeElement;
      if (e.shiftKey && (a === f[0] || a === root)) { e.preventDefault(); f[f.length - 1].focus(); }
      else if (!e.shiftKey && a === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
    };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); opener?.focus(); };
  }, [open]);

  if (!open) return null;
  return createPortal(
    <div className="lz-scrim" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby={hid} tabIndex={-1} className="lz-sheet">
        <h2 id={hid} style={{ margin: 0, fontFamily: 'var(--fd)', fontWeight: 'var(--fdw)', fontSize: fs(28), lineHeight: 1.15 }}>{title}</h2>
        {items.length > 0 && (
          <ul style={{ margin: 0, padding: '0 0 0 20px', display: 'flex', flexDirection: 'column', gap: 8, fontSize: fs(16), lineHeight: 1.4 }}>
            {items.map((it, i) => <li key={i}>{it}</li>)}
          </ul>
        )}
        {children}
        <Button variant={tone === 'danger' ? 'danger' : 'primary'} onClick={onConfirm} disabled={busy} style={{ color: '#fff' }}>{confirmLabel}</Button>
        <Button variant="outline" onClick={onClose} style={{ borderColor: 'var(--line)', color: 'var(--ink)' }}>{cancelLabel}</Button>
      </div>
    </div>,
    document.body,
  );
}

// Holds the single toast (7 s). Mounted once in main.tsx; read with useToast() / useCare().toast.
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState>(null);
  const timer = useRef<number | undefined>(undefined);
  const seq = useRef(0);
  const clear = useCallback(() => { clearTimeout(timer.current); setToast(null); }, []);
  const show = useCallback<ToastFn>((text, undo) => {
    clearTimeout(timer.current);
    setToast({ text, undo, key: ++seq.current }); // new key → re-announced even if the text repeats
    timer.current = window.setTimeout(() => setToast(null), 7000);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const value = useMemo(() => ({ toast, show, clear }), [toast, show, clear]);
  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

// The live region (always mounted). Inside the app shell it sits 12px above the tab bar; elsewhere it is fixed to the viewport.
export function ToastHost() {
  const { toast, clear } = useContext(ToastContext);
  return (
    <div role="status" aria-live="polite" className="lz-toast">
      {toast && (
        <div key={toast.key} style={{ pointerEvents: 'auto', display: 'flex', alignItems: 'center', gap: 12, background: 'var(--ink)', color: 'var(--surface)', borderRadius: 16,
          padding: '10px 10px 10px 16px', boxShadow: '0 10px 30px rgba(0,0,0,.25)' }}>
          <span style={{ flex: 1, fontWeight: 700, fontSize: fs(15), lineHeight: 1.35 }}>{toast.text}</span>
          {toast.undo && (
            <button type="button" className="press" onClick={() => { const u = toast.undo; clear(); void u?.(); }}
              style={{ minHeight: 48, padding: '0 14px', borderRadius: 10, border: '2px solid var(--surface)', background: 'transparent', color: 'var(--surface)', fontWeight: 700, fontSize: fs(15) }}>
              Deshacer
            </button>
          )}
        </div>
      )}
    </div>
  );
}
