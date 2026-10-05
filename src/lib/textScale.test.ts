import { renderHook, act } from '@testing-library/react';
import { applyStoredScale, useTextScale } from './textScale';

const u = () => document.documentElement.style.getPropertyValue('--u');

test('applies the stored scale, clamped to 100–200', () => {
  localStorage.setItem('lazo.textScale', '130');
  applyStoredScale();
  expect(u()).toBe('1.3px');
  localStorage.setItem('lazo.textScale', '999');
  applyStoredScale();
  expect(u()).toBe('2px');
  localStorage.setItem('lazo.textScale', 'basura');
  applyStoredScale();
  expect(u()).toBe('1px');
});

test('setScale persists and applies', () => {
  localStorage.removeItem('lazo.textScale');
  const { result } = renderHook(() => useTextScale());
  expect(result.current[0]).toBe(100);
  act(() => result.current[1](90));
  expect(result.current[0]).toBe(100);
  act(() => result.current[1](150));
  expect(result.current[0]).toBe(150);
  expect(u()).toBe('1.5px');
  expect(localStorage.getItem('lazo.textScale')).toBe('150');
});
