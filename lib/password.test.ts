import { describe, expect, it } from 'vitest';
import { passwordProblem } from './password';

describe('passwordProblem', () => {
  it('accepts 8+ characters with letters and numbers', () => {
    expect(passwordProblem('netpaper1')).toBeNull();
    expect(passwordProblem('A1b2C3d4')).toBeNull();
  });

  it('rejects short passwords', () => {
    expect(passwordProblem('abc123')).toMatch(/8 characters/);
  });

  it('rejects passwords without letters or without numbers', () => {
    expect(passwordProblem('12345678')).toMatch(/letters and numbers/);
    expect(passwordProblem('abcdefgh')).toMatch(/letters and numbers/);
  });
});
