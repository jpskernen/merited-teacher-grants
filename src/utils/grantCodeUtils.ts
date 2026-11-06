import { Application, ProgramSettings } from '../types/grant';

/**
 * Generates an immutable grant code in the format:
 * [Program][Season][YY][Line] e.g. IGF2601
 *
 * Rules:
 * - Program: IG = Innovative Grant, MG = Mini Grant (from settings, default IG)
 * - Season: F = Fall, S = Spring (from settings, default F)
 * - YY: two-digit year of cycle (e.g. 2026 -> 26)
 * - Line: two-digit sequence number starting at 01 (use three digits if >= 100)
 * - Sequence number matches row number in Google Sheet / CSV export (row 1 below header)
 * - Assigned strictly on submit, never changes, and never reused even if withdrawn.
 */
export function generateNextGrantCode(
  settings: ProgramSettings,
  existingApplications: Application[]
): { grantCode: string; sequenceNumber: number } {
  const program = (settings.cycleProgramCode || 'IG').toUpperCase();
  const season = (settings.cycleSeasonCode || 'F').toUpperCase();

  // Determine 2-digit year from setting or schoolYear
  let yy = settings.cycleTwoDigitYear;
  if (!yy) {
    const yrMatch = settings.schoolYear?.match(/\d{4}/);
    yy = yrMatch ? yrMatch[0].slice(-2) : '26';
  }

  const prefix = `${program}${season}${yy}`;

  // Find max sequence number currently assigned across all submitted applications
  let maxSeq = 0;
  for (const app of existingApplications) {
    if (app.sequenceNumber && app.sequenceNumber > maxSeq) {
      maxSeq = app.sequenceNumber;
    } else if (app.grantCode && app.grantCode.startsWith(prefix)) {
      const lineStr = app.grantCode.slice(prefix.length);
      const parsed = parseInt(lineStr, 10);
      if (!isNaN(parsed) && parsed > maxSeq) {
        maxSeq = parsed;
      }
    }
  }

  const nextSeq = maxSeq + 1;
  const lineFormatted = nextSeq < 100 ? String(nextSeq).padStart(2, '0') : String(nextSeq);
  const grantCode = `${prefix}${lineFormatted}`;

  return { grantCode, sequenceNumber: nextSeq };
}

/**
 * Format CSV rows strictly matching the cycle's Google Sheet export structure:
 * Row order: by grant code / sequence number
 * Columns:
 * 1. Grant Code (Row 1 = first application below header)
 * 2. Applicant(s)
 * 3. Campus
 * 4. Title
 * 5. Category
 * 6. Area of Focus
 * 7. Amount Requested
 * 8. Amount Awarded
 * 9. Status
 * 10. Average Score
 */
export interface SheetRowData {
  grantCode: string;
  applicants: string;
  campus: string;
  title: string;
  category: string;
  areaOfFocus: string;
  amountRequested: number;
  amountAwarded: number;
  status: string;
  averageScore: number | string;
}

export function buildCycleSheetRows(
  applications: Application[],
  avgScoresMap: Record<string, number> = {}
): SheetRowData[] {
  // Filter for submitted / assigned applications and sort strictly by sequenceNumber
  const submitted = applications
    .filter((a) => a.status !== 'Draft' && Boolean(a.grantCode))
    .sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

  return submitted.map((app) => ({
    grantCode: app.grantCode || app.id,
    applicants: app.applicantNames.map((n) => n.name).join(', ') || app.applicantEmail,
    campus: app.campus,
    title: app.title,
    category: app.category,
    areaOfFocus: app.areaOfFocus + (app.areaOfFocusOther ? ` (${app.areaOfFocusOther})` : ''),
    amountRequested: app.amountRequested || 0,
    amountAwarded: app.awardedAmount || 0,
    status: app.status,
    averageScore: avgScoresMap[app.id] !== undefined ? avgScoresMap[app.id] : '—',
  }));
}

export function exportCycleSheetCsv(
  applications: Application[],
  avgScoresMap: Record<string, number> = {},
  schoolYear: string = '2026-2027'
): void {
  const rows = buildCycleSheetRows(applications, avgScoresMap);

  const headers = [
    'Grant Code',
    'Applicant(s)',
    'Campus',
    'Title',
    'Category',
    'Area of Focus',
    'Amount Requested',
    'Amount Awarded',
    'Status',
    'Average Score',
  ];

  const csvLines = [
    headers.join(','),
    ...rows.map((r) =>
      [
        `"${r.grantCode}"`,
        `"${r.applicants.replace(/"/g, '""')}"`,
        `"${r.campus.replace(/"/g, '""')}"`,
        `"${r.title.replace(/"/g, '""')}"`,
        `"${r.category}"`,
        `"${r.areaOfFocus.replace(/"/g, '""')}"`,
        r.amountRequested.toFixed(2),
        r.amountAwarded.toFixed(2),
        `"${r.status}"`,
        typeof r.averageScore === 'number' ? r.averageScore.toFixed(1) : `"${r.averageScore}"`,
      ].join(',')
    ),
  ];

  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `NEF_Grants_GoogleSheetSync_${schoolYear.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
