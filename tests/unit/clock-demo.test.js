import { expect, it } from 'vitest';
import { todayUtc } from '../../src/services/validation.js';

it('matches the calendar date at midnight UTC in the runner', () => {
  const midnight = new Date('2026-01-15T00:15:00Z');
  expect(Number(todayUtc(midnight).slice(-2))).toBe(midnight.getDate());
});
