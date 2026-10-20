import { describe, expect, it } from 'vitest';
import { passwordProblem } from './password';

describe('passwordProblem', () => {
  it('accepts 8+ characters with upper, lower, digit and symbol', () => {
    expect(passwordProblem('Net@paper1')).toBeNull();
    expect(passwordProblem('Aa1-bbbb')).toBeNull();
  });

  it('rejects short passwords', () => {
    expect(passwordProblem('N@p1')).toMatch(/8 characters/);
  });

  it('says exactly what is missing', () => {
    expect(passwordProblem('netpaper1')).toBe('Password must also include a capital letter and a symbol such as @ or #.');
    expect(passwordProblem('NETPAPER@1')).toBe('Password must also include a small letter.');
    expect(passwordProblem('Netpaper@')).toBe('Password must also include a number.');
  });
});
