import { render, screen, fireEvent } from '@testing-library/react';
import { Sidebar } from './Sidebar';

vi.mock('../auth/useAuth', () => ({ useAuth: () => ({ signOut: vi.fn() }) }));

test('nurse sidebar switches screen', () => {
  const setScreen = vi.fn();
  render(<Sidebar role="nurse" screen="inicio" setScreen={setScreen} />);
  fireEvent.click(screen.getByText('Signos vitales'));
  expect(setScreen).toHaveBeenCalledWith('signos');
});
