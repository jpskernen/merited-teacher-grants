import { Application, ApplicantIdentity, ProgramSettings, Review } from '../types/grant';

/**
 * Generates an immutable grant code in the format:
 * [Program][Season][YY][Line] e.g. IGF2601
 */
export function generateNextGrantCode(
  settings: ProgramSettings,
  existingApplications: Application[],
  currentCounterSequence: number = 0
): { grantCode: string; sequenceNumber: number } {
  const program = (settings.program || 'IG').toUpperCase();
  const season = (settings.season || 'F').toUpperCase();
  let yy = settings.cycleTwoDigitYear || '26';

  const prefix = `${program}${season}${yy}`;

  let maxSeq = Math.max(currentCounterSequence, 0);
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
  const lineFormatted = nextSeq < 10 ? `0${nextSeq}` : String(nextSeq);
  const grantCode = `${prefix}${lineFormatted}`;

  return { grantCode, sequenceNumber: nextSeq };
}

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
  avgScoresMap: Record<string, number> = {},
  identitiesMap: Record<string, ApplicantIdentity> = {}
): SheetRowData[] {
  const sorted = [...applications].sort((a, b) => (a.sequenceNumber || 0) - (b.sequenceNumber || 0));

  return sorted.map((app) => {
    const identity = identitiesMap[app.id];
    const applicantNames = identity
      ? identity.applicantNames.map((n) => n.name).join(', ') || identity.applicantEmail
      : 'Confidential (Blind Review)';
    const campus = identity ? identity.campus : 'Confidential (Blind Review)';

    return {
      grantCode: app.grantCode || app.id,
      applicants: applicantNames,
      campus,
      title: app.title,
      category: app.category,
      areaOfFocus: app.areaOfFocus + (app.areaOfFocusOther ? ` (${app.areaOfFocusOther})` : ''),
      amountRequested: app.amountRequested || 0,
      amountAwarded: app.awardedAmount || 0,
      status: app.status,
      averageScore: avgScoresMap[app.id] !== undefined ? avgScoresMap[app.id] : '—',
    };
  });
}

export function exportCycleSheetCsv(
  applications: Application[],
  avgScoresMap: Record<string, number> = {},
  identitiesMap: Record<string, ApplicantIdentity> = {},
  schoolYear: string = '2026-2027'
): void {
  const rows = buildCycleSheetRows(applications, avgScoresMap, identitiesMap);

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

export function exportDetailedReviewerAnswersCsv(
  applications: Application[],
  reviews: Review[],
  rubric: { id: string; title: string; weight: number }[],
  schoolYear: string = '2026-2027'
): void {
  const headers = [
    'Grant Code',
    'Grant Title',
    'Category',
    'Amount Requested',
    'Reviewer Name',
    'Reviewer Email',
    'Voting Reviewer',
    'Review Status',
    'Flagged for Committee Discussion',
    'Total Score (out of 100)',
    ...rubric.flatMap((c, i) => [`Criterion ${i + 1}: ${c.title} (Score 1-5)`, `Criterion ${i + 1} Written Comment`]),
    'General Evaluator Feedback',
    'Submitted At',
    'Last Updated',
  ];

  const appMap = new Map<string, Application>();
  applications.forEach((a) => appMap.set(a.id, a));

  const rows: string[][] = [];

  reviews.forEach((rev) => {
    const app = appMap.get(rev.applicationId);
    if (!app) return;

    const criteriaData: string[] = [];
    rubric.forEach((c) => {
      const score = rev.scores?.[c.id] !== undefined ? String(rev.scores[c.id]) : '';
      const comment = (rev.comments?.[c.id] || '').replace(/"/g, '""');
      criteriaData.push(`"${score}"`, `"${comment}"`);
    });

    const row = [
      `"${app.grantCode || ''}"`,
      `"${(app.title || '').replace(/"/g, '""')}"`,
      `"${app.category || ''}"`,
      (app.amountRequested || 0).toFixed(2),
      `"${(rev.reviewerName || '').replace(/"/g, '""')}"`,
      `"${rev.reviewerEmail || ''}"`,
      rev.isVoting ? 'Yes' : 'No (Observer)',
      rev.recused ? 'Recused' : rev.isSubmitted ? 'Officially Submitted' : 'Draft',
      rev.flaggedForDiscussion ? 'YES' : 'No',
      String(rev.totalScore || 0),
      ...criteriaData,
      `"${(rev.generalFeedback || '').replace(/"/g, '""')}"`,
      `"${rev.submittedAt || ''}"`,
      `"${rev.updatedAt || ''}"`,
    ];

    rows.push(row);
  });

  // If no reviews yet, write empty row indicator
  if (rows.length === 0) {
    rows.push(['No reviewer evaluations recorded yet']);
  }

  const csvLines = [headers.join(','), ...rows.map((r) => r.join(','))];
  const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `NEF_All_Reviewer_Answers_${schoolYear.replace(/\s+/g, '_')}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
