// Class names are typed by teachers, so they arrive in any case ("online 19 oct onwards").
// Show them in a tidy Title Case. ALL-CAPS words (NET, JRF) and numbers are left as typed,
// small joining words stay lower case, and the stored name is never changed.
const SMALL_WORDS = new Set(['and', 'or', 'of', 'for', 'to', 'in', 'on', 'at', 'the', 'a', 'an', 'with', 'by']);

export function formatClassName(name: string): string {
  return name
    .trim()
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, i) => {
      if (word === word.toUpperCase()) return word;
      if (i > 0 && SMALL_WORDS.has(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export type ClassTab = 'student' | 'teacher';

// The page subtitle depends on who is looking: an approved teacher managing classes, or a student.
export function classesSubtitle(tab: ClassTab, teacherStatus: string | null | undefined): string {
  if (tab === 'teacher' && teacherStatus === 'approved') return "Manage your classes, set tasks and track your students' progress.";
  if (tab === 'student') return "Your teacher's tasks are listed here. Join a class with its code.";
  return "Join your teacher's class to get tasks. Teachers can create classes, add students and track their work.";
}
