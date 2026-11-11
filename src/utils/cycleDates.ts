/**
 * Cycle Date Evaluation & Automated Cutoff Helpers
 *
 * Requirements:
 * - Applications Due: default Nov 11.
 * - Review Closes: default Nov 11 at 11:59 pm. Scoring locks automatically at 11:59 pm America/Chicago on the review-close date.
 * - Awards Presented: default Nov 18 (in-person committee meeting before Thanksgiving).
 */

/**
 * Returns current timestamp details formatted in America/Chicago timezone.
 */
export function getAmericaChicagoTime(date: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
  timeString: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const pMap: Record<string, number> = {};
  parts.forEach((p) => {
    if (p.type !== 'literal') {
      pMap[p.type] = parseInt(p.value, 10);
    }
  });

  return {
    year: pMap.year,
    month: pMap.month,
    day: pMap.day,
    hour: pMap.hour || 0,
    minute: pMap.minute || 0,
    second: pMap.second || 0,
    timeString: formatter.format(date),
  };
}

/**
 * Parses a date string (e.g., '2026-11-16' or 'November 16, 2026') into
 * a Date corresponding to 11:59:59 PM in the America/Chicago timezone.
 */
export function parseReviewCloseCutoffChicago(dateStr: string): Date | null {
  if (!dateStr || !dateStr.trim()) return null;

  const trimmed = dateStr.trim();
  let year: number;
  let month: number;
  let day: number;

  // Handle YYYY-MM-DD
  const isoMatch = trimmed.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (isoMatch) {
    year = parseInt(isoMatch[1], 10);
    month = parseInt(isoMatch[2], 10);
    day = parseInt(isoMatch[3], 10);
  } else {
    // Handle "November 16, 2026" or "Nov 16, 2026"
    const parsed = new Date(trimmed);
    if (isNaN(parsed.getTime())) return null;
    year = parsed.getFullYear();
    month = parsed.getMonth() + 1;
    day = parsed.getDate();
  }

  // Construct standard date in Central Time (America/Chicago is UTC-6 during standard time Nov-Mar)
  // We can construct ISO string for 23:59:59 with Central offset (-06:00 in Nov)
  const monthStr = String(month).padStart(2, '0');
  const dayStr = String(day).padStart(2, '0');
  
  // Test whether DST is active on this day by checking offset
  const testDate = new Date(`${year}-${monthStr}-${dayStr}T12:00:00Z`);
  const chicagoHourStr = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    hour: 'numeric',
    hour12: false,
  }).format(testDate);
  const chicagoHour = parseInt(chicagoHourStr, 10);
  // UTC 12:00 -> CST is 6:00 (offset -6), CDT is 7:00 (offset -5)
  const offsetHours = 12 - chicagoHour;
  const offsetStr = `-${String(offsetHours).padStart(2, '0')}:00`;

  const cutoffIso = `${year}-${monthStr}-${dayStr}T23:59:59${offsetStr}`;
  const cutoff = new Date(cutoffIso);
  return isNaN(cutoff.getTime()) ? null : cutoff;
}

/**
 * Checks if the review scoring window is locked.
 * Scoring locks strictly at 11:59:59 PM America/Chicago on reviewClosesDate.
 */
export function isReviewWindowClosed(reviewClosesDateStr: string, simulatedNow: Date = new Date()): boolean {
  const cutoff = parseReviewCloseCutoffChicago(reviewClosesDateStr);
  if (!cutoff) return false;
  return simulatedNow.getTime() > cutoff.getTime();
}

/**
 * Formats a friendly countdown or status of review close in America/Chicago time.
 */
export function getReviewDeadlineSummary(reviewClosesDateStr: string, simulatedNow: Date = new Date()): {
  isClosed: boolean;
  formattedCutoff: string;
  timeRemaining?: string;
} {
  const cutoff = parseReviewCloseCutoffChicago(reviewClosesDateStr);
  if (!cutoff) {
    return { isClosed: false, formattedCutoff: reviewClosesDateStr };
  }

  const isClosed = simulatedNow.getTime() > cutoff.getTime();
  const diffMs = cutoff.getTime() - simulatedNow.getTime();

  let timeRemaining = '';
  if (!isClosed && diffMs > 0) {
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    const remainingHours = diffHours % 24;
    if (diffDays > 0) {
      timeRemaining = `${diffDays}d ${remainingHours}h remaining`;
    } else {
      timeRemaining = `${diffHours}h remaining`;
    }
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Chicago',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });

  return {
    isClosed,
    formattedCutoff: `${formatter.format(cutoff)} (11:59 PM CT)`,
    timeRemaining,
  };
}
