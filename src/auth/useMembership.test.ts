import { pickActiveMembership } from './useMembership';

test('prefers nurse, else first, else null', () => {
  expect(
    pickActiveMembership([
      { role: 'family', patient_id: 'p' },
      { role: 'nurse', patient_id: 'q' },
    ]),
  ).toEqual({ role: 'nurse', patient_id: 'q' });
  expect(pickActiveMembership([{ role: 'family', patient_id: 'p' }])).toEqual({ role: 'family', patient_id: 'p' });
  expect(pickActiveMembership([])).toBeNull();
});
