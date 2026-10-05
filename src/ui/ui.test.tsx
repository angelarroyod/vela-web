import { useState } from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { Sheet, ToastProvider, ToastHost } from './feedback';
import { useToast } from './toast';
import { VitalField } from './controls';
import { VITALS } from '../care/logic';

test('Sheet: focus moves in, Esc closes and focus returns to the opener', () => {
  function Demo() {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Abrir</button>
        <Sheet open={open} title="¿Entregar el turno?" items={['La familia verá el resumen']} confirmLabel="Sí, entregar turno" onConfirm={() => {}} onClose={() => setOpen(false)} />
      </>
    );
  }
  render(<Demo />);
  const opener = screen.getByText('Abrir');
  opener.focus();
  fireEvent.click(opener);
  expect(screen.getByRole('dialog', { name: '¿Entregar el turno?' })).toHaveFocus();
  fireEvent.keyDown(document, { key: 'Escape' });
  expect(screen.queryByRole('dialog')).toBeNull();
  expect(opener).toHaveFocus();
});

test('toast shows text, Deshacer runs the undo and hides it, 7 s timeout', () => {
  vi.useFakeTimers();
  const undo = vi.fn();
  function Demo() {
    const toast = useToast();
    return <button onClick={() => toast('Control guardado.', undo)}>Guardar</button>;
  }
  render(<ToastProvider><Demo /><ToastHost /></ToastProvider>);
  fireEvent.click(screen.getByText('Guardar'));
  expect(screen.getByRole('status')).toHaveTextContent('Control guardado.');
  fireEvent.click(screen.getByText('Deshacer'));
  expect(undo).toHaveBeenCalled();
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  fireEvent.click(screen.getByText('Guardar'));
  act(() => { vi.advanceTimersByTime(7000); });
  expect(screen.getByRole('status')).toBeEmptyDOMElement();
  vi.useRealTimers();
});

test('VitalField explains the value in words', () => {
  const temp = VITALS[3];
  const { rerender } = render(<VitalField def={temp} value="" onChange={() => {}} />);
  expect(screen.getByLabelText('Temperatura')).toHaveAccessibleDescription('Normal: 36,0 a 37,5 °C');
  rerender(<VitalField def={temp} value="38,2" onChange={() => {}} />);
  expect(screen.getByLabelText('Temperatura')).toHaveAccessibleDescription('Más alto de lo normal (normal: 36,0 a 37,5)');
  expect(screen.getByLabelText('Temperatura')).toHaveAttribute('aria-invalid', 'true');
});
