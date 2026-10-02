import { createContext, useContext } from 'react';

export type Undo = () => void | Promise<void>;
export type ToastFn = (text: string, undo?: Undo) => void;
export type ToastState = { text: string; undo?: Undo; key: number } | null;

// No-op default so components render without a provider (tests); main.tsx mounts <ToastProvider>.
export const ToastContext = createContext<{ toast: ToastState; show: ToastFn; clear: () => void }>({
  toast: null, show: () => {}, clear: () => {},
});

// toast('Control guardado.', undo?) — shown 7 s, announced politely, optional "Deshacer".
export const useToast = (): ToastFn => useContext(ToastContext).show;
