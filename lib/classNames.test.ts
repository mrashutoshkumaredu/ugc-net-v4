import { describe, expect, it } from 'vitest';
import { classesSubtitle, formatClassName } from './classNames';

describe('formatClassName', () => {
  it('capitalises each word of a lower-case name', () => {
    expect(formatClassName('online 19 oct onwards')).toBe('Online 19 Oct Onwards');
  });
  it('keeps ALL-CAPS words and numbers as typed', () => {
    expect(formatClassName('NET Batch Dec 2026')).toBe('NET Batch Dec 2026');
    expect(formatClassName('jrf paper 1 crash course')).toBe('Jrf Paper 1 Crash Course');
  });
  it('keeps small joining words lower case except at the start', () => {
    expect(formatClassName('maths and reasoning of the week')).toBe('Maths and Reasoning of the Week');
    expect(formatClassName('the evening batch')).toBe('The Evening Batch');
  });
  it('tidies extra spaces', () => {
    expect(formatClassName('  morning   batch ')).toBe('Morning Batch');
  });
});

describe('classesSubtitle', () => {
  it('speaks to an approved teacher on the Teach tab', () => {
    expect(classesSubtitle('teacher', 'approved')).toContain('Manage your classes');
  });
  it('speaks to students on the My Tasks tab', () => {
    expect(classesSubtitle('student', null)).toContain('Join a class with its code');
  });
  it('keeps the general line for someone who is not yet a teacher', () => {
    expect(classesSubtitle('teacher', 'pending')).toContain('Teachers can create classes');
    expect(classesSubtitle('teacher', null)).toContain('Teachers can create classes');
  });
});
