/**
 * Cycle Date Evaluation & Automated Cutoff Helpers
 *
 * Rules:
 * - Applications Due: default Nov 11. Form closes automatically at 11:59 pm on due date.
 * - Review Closes: default Nov 16. Reviewer scoring closes automatically at 11:59 pm on review-close date.
 * - Awards Presented: default Nov 18 (so teachers hear before Thanksgiving).
 */

export function parseCycleDateToEndOfDay(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;

  const trimmed = dateStr.trim();

  // Try standard Date parsing (e.g., "November 11, 2026", "2026-11-11", "Nov 11, 2026")
  let d = new Date(trimmed);

  // If year is missing (e.g. "November 11" or "Nov 11"), append current/cycle year
  if (isNaN(d.getTime())) {
    const currentYear = new Date().getFullYear();
    d = new Date(`${trimmed}, ${currentYear}`);
  }

  if (isNaN(d.getTime())) {
    return null;
  }

  // Set cutoff time to 11:59:59.999 PM of that date
  const endOfDay = new Date(d);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

export function isPastDeadline(deadlineDateStr: string, simulatedNow: Date = new Date()): boolean {
  const cutoff = parseCycleDateToEndOfDay(deadlineDateStr);
  if (!cutoff) return false;
  return simulatedNow.getTime() > cutoff.getTime();
}

export function isApplicationWindowClosed(dueDateStr: string, simulatedNow: Date = new Date()): boolean {
  return isPastDeadline(dueDateStr, simulatedNow);
}

export function isReviewWindowClosed(reviewCloseDateStr: string, simulatedNow: Date = new Date()): boolean {
  return isPastDeadline(reviewCloseDateStr, simulatedNow);
}
