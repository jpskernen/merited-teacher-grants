import { Application, ApplicantIdentity, ProgramSettings } from '../types/grant';

export interface ColumnMapping {
  csvHeader: string;
  fieldKey: string;
  fieldLabel: string;
  matchedAutomatically: boolean;
}

export interface ParsedFormRow {
  rowNumber: number;
  rawRecord: Record<string, string>;
  timestamp: string;
  leadEmail: string;
  leadName: string;
  coApplicants: string;
  campus: string;
  gradeLevels: string[];
  subjectArea: string;
  title: string;
  category: 'Category 1' | 'Category 2';
  areaOfFocus: 'STEM' | 'Early Literacy/Numeracy' | 'Workforce/Career-Connected Learning' | 'Fine Arts' | 'Other';
  abstract: string;
  objectives: string;
  studentsImpacted: number;
  evaluationStrategy: string;
  partners: string;
  sustainability: string;
  plainTextBudget: string;
  amountRequested: number;
  ackImplementation: boolean;
  ackProperty: boolean;
  ackApprovals: boolean;
  electronicSignature: string;
  isLargeRequest: boolean;
  isDuplicate: boolean;
  existingGrantCode?: string;
  assignedGrantCode?: string;
  sequenceNumber?: number;
}

export interface CsvImportPreview {
  headers: string[];
  mappings: ColumnMapping[];
  rows: ParsedFormRow[];
  totalRows: number;
  newRowsCount: number;
  duplicateRowsCount: number;
  largeRequestsCount: number;
  startCodePreview: string;
  endCodePreview: string;
}

/**
 * Standard RFC-4180 compliant CSV parser that handles multi-line fields and quoted strings.
 */
export function parseCsvText(csvText: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let inQuotes = false;
  let currentField = '';

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // skip escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(currentField);
        currentField = '';
      } else if (char === '\r') {
        if (nextChar === '\n') i++;
        row.push(currentField);
        result.push(row);
        row = [];
        currentField = '';
      } else if (char === '\n') {
        row.push(currentField);
        result.push(row);
        row = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }

  if (currentField || row.length > 0) {
    row.push(currentField);
    result.push(row);
  }

  // Filter out any trailing empty rows
  return result.filter((r) => r.some((cell) => cell.trim().length > 0));
}

/**
 * Known field definitions to match against Google Form question texts.
 */
export const TARGET_FIELDS = [
  {
    key: 'timestamp',
    label: 'Timestamp (Submission Date & Time)',
    patterns: [/timestamp/i, /submission date/i, /date.*time/i, /submitted/i],
    required: true,
  },
  {
    key: 'leadEmail',
    label: 'Lead Applicant Email Address',
    patterns: [/email/i, /lead.*email/i, /applicant.*email/i, /teacher.*email/i],
    required: true,
  },
  {
    key: 'leadName',
    label: 'Lead Applicant Name',
    patterns: [
      /applicant.*name/i,
      /lead.*teacher/i,
      /teacher.*name/i,
      /name.*applicant/i,
      /your name/i,
      /^name$/i,
    ],
    required: true,
  },
  {
    key: 'coApplicants',
    label: 'Co-Applicants / Team Members',
    patterns: [/co-applicant/i, /team member/i, /additional.*teacher/i, /other.*teacher/i, /co-lead/i],
    required: false,
  },
  {
    key: 'campus',
    label: 'School / Campus',
    patterns: [/campus/i, /school/i, /location/i],
    required: true,
  },
  {
    key: 'gradeLevels',
    label: 'Grade Level(s)',
    patterns: [/grade/i, /grade.*level/i],
    required: false,
  },
  {
    key: 'subjectArea',
    label: 'Subject Area',
    patterns: [/subject/i, /department/i, /discipline/i],
    required: false,
  },
  {
    key: 'title',
    label: 'Project Title (Q5)',
    patterns: [/title/i, /project.*title/i, /name of.*project/i, /q5/i],
    required: true,
  },
  {
    key: 'category',
    label: 'Grant Category (Q6: Category 1 vs 2)',
    patterns: [/category/i, /grant.*category/i, /cat 1/i, /cat 2/i, /q6/i],
    required: true,
  },
  {
    key: 'areaOfFocus',
    label: 'Area of Focus (STEM, Literacy, etc.)',
    patterns: [/focus/i, /area of focus/i, /program area/i],
    required: false,
  },
  {
    key: 'abstract',
    label: 'Project Abstract / Summary (Q8 & Q9)',
    patterns: [/abstract/i, /summary/i, /description/i, /q9/i, /q8/i, /overview/i],
    required: true,
  },
  {
    key: 'objectives',
    label: 'Objectives & TEKS Alignment (Q7)',
    patterns: [/objective/i, /teks/i, /goals/i, /q7/i],
    required: true,
  },
  {
    key: 'studentsImpacted',
    label: 'Number of Students Impacted (Q10 & Q11)',
    patterns: [/students.*impacted/i, /number of student/i, /students served/i, /q10/i, /q11/i, /reach/i],
    required: true,
  },
  {
    key: 'evaluationStrategy',
    label: 'Evaluation Strategy (Q12)',
    patterns: [/evaluation/i, /measure/i, /assess/i, /how.*measured/i, /q12/i],
    required: true,
  },
  {
    key: 'partners',
    label: 'Partners & Collaboration (Q13)',
    patterns: [/partner/i, /collaborat/i, /q13/i],
    required: false,
  },
  {
    key: 'sustainability',
    label: 'Sustainability & Continuation (Q14)',
    patterns: [/sustainab/i, /continue/i, /recurring/i, /future/i, /q14/i],
    required: true,
  },
  {
    key: 'plainTextBudget',
    label: 'Itemized Budget Free Text (Q15)',
    patterns: [/budget/i, /itemized/i, /materials/i, /cost breakdown/i, /q15/i],
    required: true,
  },
  {
    key: 'amountRequested',
    label: 'Total Amount Requested ($)',
    patterns: [/amount.*request/i, /total.*amount/i, /total.*cost/i, /grant.*amount/i, /total requested/i],
    required: true,
  },
  {
    key: 'ackImplementation',
    label: 'Acknowledgement 1: Implementation Timeline (Q16)',
    patterns: [/q16/i, /implement.*following school year/i, /timeline.*acknowledgement/i],
    required: false,
  },
  {
    key: 'ackProperty',
    label: 'Acknowledgement 2: Property of Campus/District (Q17)',
    patterns: [/q17/i, /property of.*(district|nisd)/i, /property/i, /non.?consumable/i],
    required: false,
  },
  {
    key: 'ackApprovals',
    label: 'Acknowledgement 3: District Approvals Obtained (Q18)',
    patterns: [/q18/i, /approval/i, /principal.*approval/i, /technology.*approval/i],
    required: false,
  },
  {
    key: 'electronicSignature',
    label: 'Electronic Signature (Q19)',
    patterns: [/signature/i, /e-signature/i, /signed/i, /q19/i],
    required: false,
  },
];

/**
 * Automatically match CSV headers to application fields.
 */
export function matchHeaders(csvHeaders: string[]): ColumnMapping[] {
  const usedKeys = new Set<string>();

  return csvHeaders.map((header) => {
    const trimmed = header.trim();
    let bestKey = '';
    let bestLabel = 'Unmapped Column (Ignored)';
    let matched = false;

    for (const field of TARGET_FIELDS) {
      if (!usedKeys.has(field.key)) {
        const matches = field.patterns.some((p) => p.test(trimmed));
        if (matches) {
          bestKey = field.key;
          bestLabel = field.label;
          usedKeys.add(field.key);
          matched = true;
          break;
        }
      }
    }

    return {
      csvHeader: header,
      fieldKey: bestKey,
      fieldLabel: bestLabel,
      matchedAutomatically: matched,
    };
  });
}

/**
 * Parses numeric currency strings like "$1,496.00" or "2000" into a float.
 */
export function parseCurrencyAmount(val: string): number {
  if (!val) return 0;
  const cleaned = val.replace(/[^0-9.]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Builds the preview of imported Google Form responses.
 */
export function buildImportPreview(
  csvRows: string[][],
  currentSettings: ProgramSettings,
  existingApplications: Application[],
  currentCounterSequence: number = 0,
  customMappings?: Record<string, string>
): CsvImportPreview {
  if (csvRows.length < 2) {
    return {
      headers: [],
      mappings: [],
      rows: [],
      totalRows: 0,
      newRowsCount: 0,
      duplicateRowsCount: 0,
      largeRequestsCount: 0,
      startCodePreview: 'N/A',
      endCodePreview: 'N/A',
    };
  }

  const headers = csvRows[0];
  const dataRows = csvRows.slice(1);

  // Mappings
  const baseMappings = matchHeaders(headers);
  const mappings = baseMappings.map((m) => {
    if (customMappings && customMappings[m.csvHeader] !== undefined) {
      const customKey = customMappings[m.csvHeader];
      const target = TARGET_FIELDS.find((f) => f.key === customKey);
      return {
        ...m,
        fieldKey: customKey,
        fieldLabel: target ? target.label : 'Unmapped Column (Ignored)',
        matchedAutomatically: false,
      };
    }
    return m;
  });

  const fieldIndexMap: Record<string, number> = {};
  mappings.forEach((m, idx) => {
    if (m.fieldKey) {
      fieldIndexMap[m.fieldKey] = idx;
    }
  });

  const getValue = (row: string[], fieldKey: string, defaultVal = ''): string => {
    const idx = fieldIndexMap[fieldKey];
    if (idx !== undefined && row[idx] !== undefined) {
      return row[idx].trim();
    }
    return defaultVal;
  };

  const program = (currentSettings.program || 'IG').toUpperCase();
  const season = (currentSettings.season || 'F').toUpperCase();
  const yy = currentSettings.cycleTwoDigitYear || '26';
  const prefix = `${program}${season}${yy}`;

  // Find max sequence from counter or existing applications
  let maxSeq = Math.max(currentCounterSequence, 0);
  for (const app of existingApplications) {
    if (app.sequenceNumber && app.sequenceNumber > maxSeq) {
      maxSeq = app.sequenceNumber;
    } else if (app.grantCode && app.grantCode.startsWith(prefix)) {
      const numPart = parseInt(app.grantCode.slice(prefix.length), 10);
      if (!isNaN(numPart) && numPart > maxSeq) {
        maxSeq = numPart;
      }
    }
  }

  // Deduplication check set: timestamp + title / timestamp
  const existingKeys = new Map<string, Application>();
  for (const app of existingApplications) {
    const t = (app.rowTimestamp || app.createdAt || '').trim().toLowerCase();
    const titleKey = (app.title || '').trim().toLowerCase();
    if (t) {
      existingKeys.set(t, app);
      existingKeys.set(`${t}_${titleKey}`, app);
    }
  }

  const threshold = currentSettings.notificationThreshold ?? 6000;
  const parsedRows: ParsedFormRow[] = [];

  let nextSequence = maxSeq;
  let newRowsCount = 0;
  let duplicateRowsCount = 0;
  let largeRequestsCount = 0;

  dataRows.forEach((row, rowIdx) => {
    const rawRecord: Record<string, string> = {};
    headers.forEach((h, i) => {
      rawRecord[h] = row[i] || '';
    });

    const timestamp = getValue(row, 'timestamp', new Date().toISOString());
    const leadEmail = getValue(row, 'leadEmail', '').toLowerCase();
    const leadName = getValue(row, 'leadName', 'NISD Educator');
    const coApplicants = getValue(row, 'coApplicants', '');
    const campus = getValue(row, 'campus', 'Nacogdoches High School');
    const gradeLevelsStr = getValue(row, 'gradeLevels', 'K-12');
    const subjectArea = getValue(row, 'subjectArea', 'Instruction');
    const title = getValue(row, 'title', `Grant Proposal ${rowIdx + 1}`);
    const categoryRaw = getValue(row, 'category', '');
    let category: 'Category 1' | 'Category 2';
    const amountVal = parseCurrencyAmount(getValue(row, 'amountRequested', ''));
    const hasMultipleInLead = /[,;&]| and /i.test(leadName);
    
    if (categoryRaw) {
      category =
        categoryRaw.includes('2') || categoryRaw.toLowerCase().includes('team')
          ? 'Category 2'
          : 'Category 1';
    } else {
      // Inferred from amount requested or multiple applicants (Individual max $2,000; Team max $6,000)
      category = (amountVal > 2000 || hasMultipleInLead || Boolean(coApplicants))
        ? 'Category 2'
        : 'Category 1';
    }

    const focusRaw = getValue(row, 'areaOfFocus', 'STEM');
    let areaOfFocus: 'STEM' | 'Early Literacy/Numeracy' | 'Workforce/Career-Connected Learning' | 'Fine Arts' | 'Other' =
      'STEM';
    if (/literacy|numeracy|reading|math|early childhood|fine motor/i.test(focusRaw)) {
      areaOfFocus = 'Early Literacy/Numeracy';
    } else if (/career|workforce|cte|automotive|life skills|independent living|salon/i.test(focusRaw)) {
      areaOfFocus = 'Workforce/Career-Connected Learning';
    } else if (/art|music|choir|band|theatre|fine arts/i.test(focusRaw)) {
      areaOfFocus = 'Fine Arts';
    } else if (/stem|science|robot|biology|dissection|nasa/i.test(focusRaw)) {
      areaOfFocus = 'STEM';
    } else {
      areaOfFocus = 'Other';
    }

    const abstract = getValue(row, 'abstract', '');
    const objectives = getValue(row, 'objectives', '');
    const studentsImpacted = parseInt(getValue(row, 'studentsImpacted', '25'), 10) || 25;
    const evaluationStrategy = getValue(row, 'evaluationStrategy', '');
    const partners = getValue(row, 'partners', 'N/A');
    const sustainability = getValue(row, 'sustainability', '');
    const plainTextBudget = getValue(row, 'plainTextBudget', '');

    let amountRequested = parseCurrencyAmount(getValue(row, 'amountRequested', ''));
    if (amountRequested === 0 && plainTextBudget) {
      const match = plainTextBudget.match(/total[:\s]*\$?([0-9,]+(\.[0-9]{2})?)/i);
      if (match) {
        amountRequested = parseCurrencyAmount(match[1]);
      }
    }
    if (amountRequested === 0) {
      amountRequested = category === 'Category 1' ? 1500 : 4500;
    }

    const ackImplementation = getValue(row, 'ackImplementation', 'Yes').toLowerCase().includes('yes');
    const ackProperty = getValue(row, 'ackProperty', 'Yes').toLowerCase().includes('yes');
    const ackApprovals = getValue(row, 'ackApprovals', 'Yes').toLowerCase().includes('yes');
    const electronicSignature = getValue(row, 'electronicSignature', leadName);

    // Deduplication check: Match existing rows by timestamp plus title/email
    const dedupKey = `${timestamp.trim().toLowerCase()}_${title.trim().toLowerCase()}`;
    const timestampKey = timestamp.trim().toLowerCase();
    const existing = existingKeys.get(dedupKey) || (timestampKey ? existingKeys.get(timestampKey) : undefined);

    const isDuplicate = Boolean(existing);
    let assignedGrantCode: string | undefined;
    let seqNum: number | undefined;

    if (isDuplicate && existing) {
      duplicateRowsCount++;
      assignedGrantCode = existing.grantCode;
      seqNum = existing.sequenceNumber;
    } else {
      newRowsCount++;
      nextSequence++;
      seqNum = nextSequence;
      const lineStr = seqNum < 10 ? `0${seqNum}` : String(seqNum);
      assignedGrantCode = `${prefix}${lineStr}`;
    }

    const isLargeRequest = amountRequested >= threshold;
    if (isLargeRequest) {
      largeRequestsCount++;
    }

    parsedRows.push({
      rowNumber: rowIdx + 1,
      rawRecord,
      timestamp,
      leadEmail,
      leadName,
      coApplicants,
      campus,
      gradeLevels: gradeLevelsStr.split(/[,;/]/).map((s) => s.trim()).filter(Boolean),
      subjectArea,
      title,
      category,
      areaOfFocus,
      abstract,
      objectives,
      studentsImpacted,
      evaluationStrategy,
      partners,
      sustainability,
      plainTextBudget,
      amountRequested,
      ackImplementation,
      ackProperty,
      ackApprovals,
      electronicSignature,
      isLargeRequest,
      isDuplicate,
      existingGrantCode: existing?.grantCode,
      assignedGrantCode,
      sequenceNumber: seqNum,
    });
  });

  const startCode = parsedRows.find((r) => !r.isDuplicate)?.assignedGrantCode || `${prefix}01`;
  const endCode =
    [...parsedRows].reverse().find((r) => !r.isDuplicate)?.assignedGrantCode || startCode;

  return {
    headers,
    mappings,
    rows: parsedRows,
    totalRows: parsedRows.length,
    newRowsCount,
    duplicateRowsCount,
    largeRequestsCount,
    startCodePreview: startCode,
    endCodePreview: endCode,
  };
}

/**
 * Converts parsed preview rows into:
 * 1. Anonymized Applications (/applications/{id}) viewable by reviewers and admins.
 * 2. Sensitive ApplicantIdentities (/applicantIdentities/{id}) strictly restricted to admins.
 */
export function convertRowsToApplicationsAndIdentities(
  preview: CsvImportPreview,
  prefix: string = 'IGF26'
): {
  applications: Application[];
  identities: ApplicantIdentity[];
  nextCounterSequence: number;
} {
  const now = new Date().toISOString();
  const createdApps: Application[] = [];
  const createdIdentities: ApplicantIdentity[] = [];

  let highestSeq = 0;

  preview.rows.forEach((row) => {
    if (row.isDuplicate) return;

    const leadEmail = row.leadEmail;
    const applicantNames: Array<{ name: string; email: string }> = [];

    // Parse lead name which may contain multiple teachers separated by commas, semicolons, or "and" / "&"
    const leadTokens = row.leadName
      .split(/[,;&]|\sand\s/i)
      .map((n) => n.trim())
      .filter((n) => n.length > 0);

    if (leadTokens.length > 0) {
      leadTokens.forEach((nm, idx) => {
        applicantNames.push({
          name: nm,
          email: idx === 0 ? leadEmail : `${nm.toLowerCase().replace(/[^a-z0-9]/g, '')}@nacisd.org`,
        });
      });
    } else {
      applicantNames.push({ name: row.leadName, email: leadEmail });
    }

    if (row.coApplicants) {
      const emailMatches = Array.from(
        row.coApplicants.matchAll(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g)
      );
      if (emailMatches.length > 0) {
        emailMatches.forEach((m) => {
          const coEmail = m[1].toLowerCase();
          if (!applicantNames.some((a) => a.email.toLowerCase() === coEmail)) {
            applicantNames.push({ name: 'Co-Applicant Teacher', email: coEmail });
          }
        });
      } else if (row.coApplicants.includes(',')) {
        row.coApplicants.split(',').forEach((nm) => {
          const trimmed = nm.trim();
          if (trimmed && !applicantNames.some((a) => a.name.toLowerCase() === trimmed.toLowerCase())) {
            applicantNames.push({
              name: trimmed,
              email: `${trimmed.toLowerCase().replace(/[^a-z0-9]/g, '')}@nacisd.org`,
            });
          }
        });
      }
    }

    const seq = row.sequenceNumber || 1;
    if (seq > highestSeq) highestSeq = seq;
    const seqStr = seq < 10 ? `0${seq}` : String(seq);
    const grantCode = row.assignedGrantCode || `${prefix}${seqStr}`;
    const appId = `app-${grantCode.toLowerCase()}`;

    // 1. Blind proposal application document - Reviewers see only this!
    const blindApp: Application = {
      id: appId,
      grantCode,
      sequenceNumber: seq,
      title: row.title,
      category: row.category,
      gradeLevels: row.gradeLevels.length > 0 ? row.gradeLevels : ['K-12'],
      subjectArea: row.subjectArea,
      objectives: row.objectives,
      areaOfFocus: row.areaOfFocus,
      abstract: row.abstract,
      amountRequested: row.amountRequested,
      studentsImpacted: row.studentsImpacted,
      evaluationStrategy: row.evaluationStrategy,
      partners: row.partners,
      sustainability: row.sustainability,
      plainTextBudget: row.plainTextBudget,
      involvesTech: /software|laptop|ipad|hardware|digital|tech/i.test(
        row.abstract + row.plainTextBudget
      ),
      involvesFacilities: /fixture|install|electrical|facility/i.test(
        row.abstract + row.plainTextBudget
      ),
      status: 'Under Review',
      statusReason: 'Imported from Google Form. Under review by committee.',
      assignedReviewerIds: [
        'rev-judy-abbott',
        'rev-sydney-kroll',
        'rev-monica-loa',
        'abottja021820@gmail.com',
        'sydneykr@gmail.com',
        'mmloa@asp-inc.com',
      ],
      adminEligibility: {
        passed: !row.isLargeRequest,
        eligibleApplicant: true,
        withinCategoryCap:
          row.category === 'Category 1'
            ? row.amountRequested <= 2000
            : row.amountRequested <= 6000,
        acknowledgementsYes: row.ackImplementation && row.ackProperty && row.ackApprovals,
        noProhibitedCosts: !/travel|hotel|airfare/i.test(row.abstract + row.plainTextBudget),
        priorReportSubmitted: true,
        checkedBy: 'System Pre-Screening (Google Form Import)',
        checkedAt: now,
        notes: row.isLargeRequest
          ? `Flagged: Amount requested ($${row.amountRequested.toLocaleString()}) meets/exceeds notification threshold ($6,000).`
          : 'Google Form intake pre-screening passed.',
      },
      isImportedFromGoogleForm: true,
      rowTimestamp: row.timestamp,
      createdAt: row.timestamp || now,
      updatedAt: now,
    };

    // 2. Sensitive applicant identity document - ADMIN ONLY (/applicantIdentities/{id})
    const identity: ApplicantIdentity = {
      id: appId,
      applicationId: appId,
      grantCode,
      applicantEmail: leadEmail,
      applicantNames,
      campus: row.campus,
      electronicSignature: row.electronicSignature,
      signedAt: row.timestamp || now,
      importedTimestamp: row.timestamp,
      createdAt: now,
    };

    createdApps.push(blindApp);
    createdIdentities.push(identity);
  });

  return {
    applications: createdApps,
    identities: createdIdentities,
    nextCounterSequence: highestSeq,
  };
}
