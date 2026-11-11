import { Application, ProgramSettings, Review } from '../types/grant';

/**
 * Merge Field Dictionary Reference:
 * {{first_name}}          - First word of applicantNames[0].name
 * {{team_names}}          - All applicantNames joined with commas and "and"
 * {{is_team}}             - applicantNames.length > 1
 * {{title}}               - Application title
 * {{app_id}}              - Application ID (e.g., NEF-2026-014)
 * {{category}}            - "Category 1" or "Category 2"
 * {{category_cap}}        - Category cap from ProgramSettings (e.g., $1,500)
 * {{amount_requested}}    - amountRequested formatted with currency
 * {{awarded_amount}}      - awardedAmount formatted with currency
 * {{students_impacted}}   - studentsImpacted count
 * {{area_of_focus}}       - areaOfFocus (or areaOfFocusOther)
 * {{grade_levels}}        - gradeLevels joined by comma
 * {{subject}}             - subjectArea
 * {{campus}}              - Campus name (blind review redacted when applicable)
 * {{submitted_at}}        - signedAt formatted nicely
 * {{signature}}           - electronicSignature
 * {{budget_lines}}        - Plain text budget breakdown
 * {{vendor_flags}}        - Count of budget items where isApprovedVendor is false
 * {{principal_email}}     - principalEmail
 * {{principal_comment}}   - Comments added by principal
 * {{needs_tech}}          - involvesTech boolean
 * {{needs_facilities}}    - involvesFacilities boolean
 * {{question}}            - moreInfoQuestion
 * {{response}}            - moreInfoResponse
 * {{feedback}}            - committeeFeedback
 * {{decision_date}}       - awardsAnnouncedDate
 * {{spending_deadline}}   - spendingDeadlineDate
 * {{applications_due}}    - applicationsDueDate
 * {{next_cycle_date}}     - Next cycle open date
 * {{dashboard_link}}      - Dashboard URL link
 * {{review_link}}         - Review URL link
 * {{approval_link}}       - Principal approval URL link
 * {{nef_contact}}         - NEF Contact info: "Grants Committee, grants@nefgrants.org"
 * {{reply_by}}            - Due date for more info reply
 * {{ordering_instructions}}- Default district purchasing & PO instructions
 * {{report_due}}          - Final report due date
 * {{confirm_days}}        - Revised budget confirmation window (e.g., 5)
 * {{total_applications}}  - Total proposals received in cycle
 * {{available_funds}}     - Total funds available in cycle
 * {{reviewer_name}}       - Assigned reviewer's name
 * {{review_deadline}}     - Committee scoring deadline
 * {{pending_reviews_count}}- Number of reviews left to complete
 * {{flagged_reason}}      - Reason an application or item was flagged
 */

export interface EmailTemplate {
  id: string;
  code: string; // T1-T11, A1, R1-R5
  name: string;
  trigger: string;
  recipientDescription: string;
  subject: string;
  body: string;
}

export interface EmailRenderContext {
  application: Application;
  programSettings?: ProgramSettings;
  appBaseUrl?: string;
  reviewer?: { name: string; email: string };
  reviewDeadline?: string;
  pendingReviewsCount?: number;
  flaggedReason?: string;
  replyByDate?: string;
  confirmDays?: number;
  reportDueDate?: string;
  nextCycleDate?: string;
  totalApplicationsCount?: number;
  customOrderingInstructions?: string;
  blindReviewActive?: boolean;
}

export interface RenderedEmail {
  to: string[];
  cc?: string[];
  replyTo: string;
  subject: string;
  body: string;
}

// -----------------------------------------------------------------------------
// TEACHER EMAILS (T1 - T11)
// -----------------------------------------------------------------------------

export const EMAIL_TEMPLATE_T1: EmailTemplate = {
  id: 'template-t1',
  code: 'T1',
  name: 'We received your proposal',
  trigger: 'submitApplication',
  recipientDescription: 'All team members',
  subject: 'Received: "{{title}}" — NEF Innovative Teaching Grant',
  body: `Hi {{first_name}},

Thank you for submitting "{{title}}." Your proposal is in, and we're glad you took the time to share it.

What you submitted
• Application ID: {{app_id}}
• {{category}} (up to {{category_cap}}) — {{amount_requested}} requested
• {{students_impacted}} students · {{area_of_focus}} · Grades {{grade_levels}}
• Signed by {{signature}} on {{submitted_at}}
{{#if is_team}}• Team: {{team_names}}
{{/if}}
Budget
{{budget_lines}}
{{#if vendor_flags}}Note: {{vendor_flags}} item(s) are from vendors not on the approved list. Your justification is attached, and the committee will see it.
{{/if}}
What happens next
{{#if principal_email}}1. We've emailed {{principal_email}} for a quick approval. You'll hear from us when they respond.
2. {{/if}}The committee reviews proposals and announces awards {{decision_date}}.
3. If the committee has a question, we'll email you, and you can reply right from your dashboard.

Track your status anytime: {{dashboard_link}}

A full copy of your application is attached as a PDF.

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T2: EmailTemplate = {
  id: 'template-t2',
  code: 'T2',
  name: 'Your principal approved',
  trigger: 'simulatePrincipalApproval(approved: true)',
  recipientDescription: 'All team members',
  subject: 'Approved by your principal: "{{title}}"',
  body: `Hi {{first_name}},

Good news — your principal approved "{{title}}." {{#if principal_comment}}They added: "{{principal_comment}}"{{/if}}

Your proposal is now with the review committee. Awards will be announced {{decision_date}}.

Nothing else is needed from you right now. Your dashboard: {{dashboard_link}}

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T3: EmailTemplate = {
  id: 'template-t3',
  code: 'T3',
  name: 'Your principal asked for changes',
  trigger: 'simulatePrincipalApproval(approved: false)',
  recipientDescription: 'All team members',
  subject: 'A note from your principal on "{{title}}"',
  body: `Hi {{first_name}},

Your principal reviewed "{{title}}" and asked for a few changes before it goes to the committee:

"{{principal_comment}}"

Your application is back in Draft so you can edit it. Everything you wrote is saved. When you resubmit, we'll ask your principal to look again.

Applications are due {{applications_due}}. Edit here: {{dashboard_link}}

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T4: EmailTemplate = {
  id: 'template-t4',
  code: 'T4',
  name: 'The committee has a question',
  trigger: 'sendMoreInfoRequest',
  recipientDescription: 'All team members',
  subject: 'Quick question about "{{title}}"',
  body: `Hi {{first_name}},

The committee is reading your proposal and has one question:

"{{question}}"

This is a normal part of review — it means they want the full picture. Please reply by {{reply_by}} so your proposal stays on track.

Reply here: {{dashboard_link}}
(Reply in the dashboard rather than to this email so the committee sees your answer with your application.)

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T5: EmailTemplate = {
  id: 'template-t5',
  code: 'T5',
  name: 'We got your answer',
  trigger: 'respondToMoreInfo',
  recipientDescription: 'The person who replied, cc team',
  subject: 'Thanks — your answer on "{{title}}" is with the committee',
  body: `Hi {{first_name}},

Thanks for answering so quickly. Your response is attached to your application, and it's back under review.

Your answer:
"{{response}}"

Awards will be announced {{decision_date}}. Dashboard: {{dashboard_link}}

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T6: EmailTemplate = {
  id: 'template-t6',
  code: 'T6',
  name: 'Funded',
  trigger: 'updateApplicationStatus("Funded")',
  recipientDescription: 'All team members, cc principal',
  subject: 'Congratulations! "{{title}}" is funded',
  body: `Hi {{first_name}},

The NEF Grants Committee is excited to fund "{{title}}" for {{awarded_amount}}. {{students_impacted}} students will benefit from your work.

{{#if feedback}}From the committee:
"{{feedback}}"

{{/if}}Next steps
1. Ordering: {{ordering_instructions}}
2. Spend the funds and complete your project by {{spending_deadline}}.
3. Keep receipts and take photos as you go. You'll need them for your final report.
4. Non-consumable items stay with your campus.

Your final report is due {{report_due}}. We'll send reminders before then.

Dashboard: {{dashboard_link}}

Thank you for bringing new ideas to Nacogdoches classrooms.

With gratitude,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T7: EmailTemplate = {
  id: 'template-t7',
  code: 'T7',
  name: 'Partially funded',
  trigger: 'updateApplicationStatus("Partially Funded")',
  recipientDescription: 'All team members, cc principal',
  subject: 'Congratulations! "{{title}}" is funded',
  body: `Hi {{first_name}},

The NEF Grants Committee is pleased to fund "{{title}}" for {{awarded_amount}} of the {{amount_requested}} you requested.

{{#if feedback}}Why the amount changed:
"{{feedback}}"

{{/if}}Before you order, please update your budget to fit {{awarded_amount}}. Open your dashboard, adjust the line items, and save. The committee will confirm the revised budget within {{confirm_days}} school days.

Update your budget: {{dashboard_link}}

After that, the steps are the same: spend and complete by {{spending_deadline}}, keep receipts and photos, and submit your final report by {{report_due}}.

With gratitude,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T8: EmailTemplate = {
  id: 'template-t8',
  code: 'T8',
  name: 'Not funded this cycle',
  trigger: 'updateApplicationStatus("Not Funded")',
  recipientDescription: 'All team members only (no cc)',
  subject: 'An update on "{{title}}"',
  body: `Hi {{first_name}},

Thank you for submitting "{{title}}." The committee read every proposal closely. This cycle, we weren't able to fund yours. We received {{total_applications}} proposals and had {{available_funds}} to award.

{{#if feedback}}The committee wanted you to have this feedback:
"{{feedback}}"

{{/if}}We hope you'll apply again. The next call for grants opens {{next_cycle_date}}, and your application is saved in your dashboard so you can build on it.

If you'd like to talk it through, reply to this email and we'll set up a time.

With gratitude for all you do for students,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T9: EmailTemplate = {
  id: 'template-t9',
  code: 'T9',
  name: 'Final report reminder',
  trigger: 'scheduled: 60 and 14 days before report_due',
  recipientDescription: 'All team members',
  subject: 'Reminder: Final report due for "{{title}}"',
  body: `Hi {{first_name}},

A friendly reminder that your final grant report for "{{title}}" is due on {{report_due}}.

Submitting your report closes out this grant and keeps you eligible to apply for future NEF Innovative Teaching Grants!

Submit your summary, student impact, and receipts here: {{dashboard_link}}

If you have any questions or need an extension, please contact us at {{nef_contact}}.

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T10: EmailTemplate = {
  id: 'template-t10',
  code: 'T10',
  name: 'Final report submitted',
  trigger: 'submitFinalReport',
  recipientDescription: 'All team members, cc principal',
  subject: 'Received: Final Report for "{{title}}"',
  body: `Hi {{first_name}},

Thank you for completing your final project report for "{{title}}."

We appreciate your dedication to student enrichment in Nacogdoches ISD. Your report has been documented and your grant status is officially marked Complete.

You are fully eligible to apply for upcoming grant cycles!

Review your completed grant record: {{dashboard_link}}

With sincere appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_T11: EmailTemplate = {
  id: 'template-t11',
  code: 'T11',
  name: 'Grant cycle opening announcement',
  trigger: 'broadcast: cycle launch date',
  recipientDescription: 'District educators & previous applicants',
  subject: 'NEF Innovative Teaching Grants now open for proposals!',
  body: `Dear Nacogdoches ISD Educators,

The Nacogdoches ISD Education Foundation is excited to announce that the new grant cycle is officially open!

Key Cycle Information:
• Applications Due: {{applications_due}}
• Category 1 (Single Classroom): Up to {{category_cap}}
• Decisions Announced: {{decision_date}}

Start your innovative teaching proposal today: {{dashboard_link}}

We encourage creative, high-impact instructional ideas across all grade levels and disciplines.

Best regards,
Nacogdoches ISD Education Foundation
{{nef_contact}}`,
};

// -----------------------------------------------------------------------------
// APPROVER EMAILS (A1)
// -----------------------------------------------------------------------------

export const EMAIL_TEMPLATE_A1: EmailTemplate = {
  id: 'template-a1',
  code: 'A1',
  name: 'Principal approval request',
  trigger: 'submitApplication (when principalEmail provided)',
  recipientDescription: 'Campus Principal',
  subject: 'Action Required: Review Grant Proposal "{{title}}" by {{first_name}}',
  body: `Dear Principal,

A teacher on your campus has submitted an NEF Innovative Teaching Grant proposal:

• Title: "{{title}}"
• Lead Applicant: {{first_name}} {{#if is_team}}(Team: {{team_names}}){{/if}}
• Campus: {{campus}}
• Category: {{category}} — {{amount_requested}} requested
• Students Impacted: {{students_impacted}}
{{#if needs_tech}}• Involves Technology: Yes (district technology alignment required)
{{/if}}{{#if needs_facilities}}• Involves Facilities: Yes (district facilities alignment required)
{{/if}}
Budget Summary:
{{budget_lines}}

Please review and endorse this proposal so it can advance to the Foundation Grants Committee:
Approval Link: {{approval_link}}

Thank you for supporting innovative teaching on your campus!

Nacogdoches ISD Education Foundation
{{nef_contact}}`,
};

// -----------------------------------------------------------------------------
// REVIEWER & ADMIN EMAILS (R1 - R5)
// -----------------------------------------------------------------------------

export const EMAIL_TEMPLATE_R1: EmailTemplate = {
  id: 'template-r1',
  code: 'R1',
  name: 'New proposals ready for review',
  trigger: 'cycle review phase begins',
  recipientDescription: 'Assigned Reviewers',
  subject: 'NEF Grant Proposals Ready for Evaluation',
  body: `Dear {{reviewer_name}},

The application window has closed, and proposals are ready for committee evaluation.

Your Review Queue:
• Assigned Proposals: {{pending_reviews_count}}
• Scoring Deadline: {{review_deadline}}

Access your scoring queue: {{review_link}}

Please review each proposal against our standard evaluation rubric. If you have an institutional conflict of interest with any proposal, remember to click "Recuse" on that application.

Thank you for your dedicated service to Nacogdoches students.

Nacogdoches ISD Education Foundation
{{nef_contact}}`,
};

export const EMAIL_TEMPLATE_R2: EmailTemplate = {
  id: 'template-r2',
  code: 'R2',
  name: 'Review scoring reminder',
  trigger: 'scheduled: 3 days prior to review_deadline',
  recipientDescription: 'Reviewers with incomplete reviews',
  subject: 'Reminder: NEF Grant Reviews Due {{review_deadline}}',
  body: `Dear {{reviewer_name}},

This is a friendly reminder that committee scoring closes on {{review_deadline}}.

You currently have {{pending_reviews_count}} proposal(s) awaiting your scores and feedback.

Complete your evaluations: {{review_link}}

Your evaluations ensure thoughtful and equitable distribution of classroom funding.

With appreciation,
Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_R3: EmailTemplate = {
  id: 'template-r3',
  code: 'R3',
  name: 'Applicant inquiry response received',
  trigger: 'respondToMoreInfo',
  recipientDescription: 'Review Committee / Admin',
  subject: 'Response Received: Committee inquiry on "{{title}}"',
  body: `Dear Review Committee,

The applicant team for "{{title}}" ({{app_id}}) has submitted a clarification response.

Question Asked:
"{{question}}"

Applicant Response:
"{{response}}"

The application is back in Under Review status and updated scores or notes may now be entered:
{{review_link}}

Nacogdoches ISD Education Foundation`,
};

export const EMAIL_TEMPLATE_R4: EmailTemplate = {
  id: 'template-r4',
  code: 'R4',
  name: 'Unapproved vendor or compliance flag alert',
  trigger: 'proposal flagged during intake',
  recipientDescription: 'Foundation Admin Team',
  subject: 'Intake Flag: {{app_id}} "{{title}}"',
  body: `Attention NEF Grants Administrators,

An application requires administrative review regarding purchasing or compliance:

• Application ID: {{app_id}}
• Title: "{{title}}"
• Campus: {{campus}}
• Flag Details: {{flagged_reason}}
• Non-Approved Vendors: {{vendor_flags}} item(s)

Review proposal details: {{review_link}}

Nacogdoches ISD Grant Administration System`,
};

export const EMAIL_TEMPLATE_R5: EmailTemplate = {
  id: 'template-r5',
  code: 'R5',
  name: 'All reviews completed notice',
  trigger: 'all assigned reviewers have scored',
  recipientDescription: 'Admin & Committee Chair',
  subject: 'Scoring Complete: "{{title}}" is ready for awards deliberation',
  body: `Dear Grants Administrator,

All assigned committee members have completed scoring for:

• Proposal: "{{title}}" ({{app_id}})
• Category: {{category}} — {{amount_requested}} requested
• Campus: {{campus}}

The composite score ranking and reviewer comments are ready for committee funding allocation:
{{review_link}}

Nacogdoches ISD Education Foundation`,
};

// -----------------------------------------------------------------------------
// ALL 17 TEMPLATES EXPORT
// -----------------------------------------------------------------------------

export const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  T1: EMAIL_TEMPLATE_T1,
  T2: EMAIL_TEMPLATE_T2,
  T3: EMAIL_TEMPLATE_T3,
  T4: EMAIL_TEMPLATE_T4,
  T5: EMAIL_TEMPLATE_T5,
  T6: EMAIL_TEMPLATE_T6,
  T7: EMAIL_TEMPLATE_T7,
  T8: EMAIL_TEMPLATE_T8,
  T9: EMAIL_TEMPLATE_T9,
  T10: EMAIL_TEMPLATE_T10,
  T11: EMAIL_TEMPLATE_T11,
  A1: EMAIL_TEMPLATE_A1,
  R1: EMAIL_TEMPLATE_R1,
  R2: EMAIL_TEMPLATE_R2,
  R3: EMAIL_TEMPLATE_R3,
  R4: EMAIL_TEMPLATE_R4,
  R5: EMAIL_TEMPLATE_R5,
};

export const ALL_EMAIL_TEMPLATES_LIST: EmailTemplate[] = [
  EMAIL_TEMPLATE_T1,
  EMAIL_TEMPLATE_T2,
  EMAIL_TEMPLATE_T3,
  EMAIL_TEMPLATE_T4,
  EMAIL_TEMPLATE_T5,
  EMAIL_TEMPLATE_T6,
  EMAIL_TEMPLATE_T7,
  EMAIL_TEMPLATE_T8,
  EMAIL_TEMPLATE_T9,
  EMAIL_TEMPLATE_T10,
  EMAIL_TEMPLATE_T11,
  EMAIL_TEMPLATE_A1,
  EMAIL_TEMPLATE_R1,
  EMAIL_TEMPLATE_R2,
  EMAIL_TEMPLATE_R3,
  EMAIL_TEMPLATE_R4,
  EMAIL_TEMPLATE_R5,
];

// -----------------------------------------------------------------------------
// HELPER FUNCTIONS & TEMPLATE ENGINE
// -----------------------------------------------------------------------------

/**
 * Format currency amount
 */
export function formatCurrency(amount?: number | null): string {
  if (amount === undefined || amount === null) return '$0';
  return `$${Math.round(amount).toLocaleString()}`;
}

/**
 * Format ISO date string into readable text (e.g. "Nov 10, 2026, 4:12 PM")
 */
export function formatFriendlyDate(dateStr?: string): string {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  } catch {
    return dateStr;
  }
}

/**
 * Build the merge fields key-value dictionary from application state and context
 */
export function extractMergeFields(context: EmailRenderContext): Record<string, string | boolean | number> {
  const { application, programSettings, appBaseUrl = '' } = context;
  const appAny = application as any;

  // Applicant team names
  const applicantList = appAny.applicantNames && appAny.applicantNames.length > 0
    ? appAny.applicantNames
    : [{ name: appAny.electronicSignature || 'Educator', email: appAny.applicantEmail || '' }];

  const leadName = applicantList[0]?.name || 'Educator';
  const firstName = leadName.trim().split(/\s+/)[0] || 'Educator';

  const namesList = applicantList.map((a: { name?: string }) => (a.name || '').trim()).filter(Boolean);
  let teamNames = namesList.join(', ');
  if (namesList.length === 2) {
    teamNames = `${namesList[0]} and ${namesList[1]}`;
  } else if (namesList.length > 2) {
    teamNames = `${namesList.slice(0, -1).join(', ')} and ${namesList[namesList.length - 1]}`;
  }

  const isTeam = applicantList.length > 1;

  // Category cap
  let categoryCapStr = '$1,500';
  if (programSettings) {
    const cap = application.category === 'Category 2' ? programSettings.category2Cap : programSettings.category1Cap;
    categoryCapStr = formatCurrency(cap);
  }

  // Non-approved vendor count
  const vendorFlags = appAny.budgetItems
    ? appAny.budgetItems.filter((i: any) => !i.isApprovedVendor).length
    : 0;

  // Budget summary lines
  let budgetLines = application.plainTextBudget;
  if (!budgetLines && appAny.budgetItems && appAny.budgetItems.length > 0) {
    budgetLines = appAny.budgetItems
      .map((item: any) => `• ${item.quantity}x ${item.name} (${item.vendor}) @ ${formatCurrency(item.unitCost)} = ${formatCurrency(item.quantity * item.unitCost + (item.shipping || 0))}`)
      .join('\n');
  }
  if (!budgetLines) {
    budgetLines = `Requested: ${formatCurrency(application.amountRequested)}`;
  }

  // Campus with blind review check
  const campusDisplay = context.blindReviewActive
    ? '[Campus name redacted for blind review]'
    : appAny.campus || 'Nacogdoches ISD';

  // URLs
  const dashboardLink = `${appBaseUrl}/dashboard/${application.id}`;
  const reviewLink = `${appBaseUrl}/review/${application.id}`;
  const approvalLink = `${appBaseUrl}/principal-approval/${application.id}`;

  return {
    first_name: firstName,
    team_names: teamNames,
    is_team: isTeam,
    title: application.title || 'Untitled Proposal',
    app_id: application.grantCode || application.id,
    grant_code: application.grantCode || application.id,
    category: application.category || 'Category 1',
    category_cap: categoryCapStr,
    amount_requested: formatCurrency(application.amountRequested),
    awarded_amount: formatCurrency(application.awardedAmount),
    students_impacted: application.studentsImpacted || 0,
    area_of_focus: application.areaOfFocusOther || application.areaOfFocus || 'Instructional Innovation',
    grade_levels: (application.gradeLevels || []).join(', '),
    subject: application.subjectArea || 'General',
    campus: campusDisplay,
    submitted_at: formatFriendlyDate(appAny.signedAt || application.createdAt),
    signature: appAny.electronicSignature || leadName,
    budget_lines: budgetLines,
    vendor_flags: vendorFlags,
    principal_email: appAny.principalEmail || '',
    principal_comment: appAny.principalComment || '',
    needs_tech: application.involvesTech || false,
    needs_facilities: application.involvesFacilities || false,
    question: appAny.moreInfoQuestion || '',
    response: appAny.moreInfoResponse || '',
    feedback: application.committeeFeedback || '',
    decision_date: programSettings?.awardsAnnouncedDate || 'Mid November',
    spending_deadline: programSettings?.spendingDeadlineDate || 'May 26, 2028',
    applications_due: programSettings?.applicationsDueDate || 'October 15, 2026',
    next_cycle_date: context.nextCycleDate || 'Fall 2027',
    dashboard_link: dashboardLink,
    review_link: reviewLink,
    approval_link: approvalLink,
    nef_contact: 'Grants Committee, grants@nefgrants.org',
    ordering_instructions: context.customOrderingInstructions || 'Submit purchase orders through your campus financial secretary specifying approved district vendors and PO numbers.',
    report_due: context.reportDueDate || 'May 1, 2027',
    confirm_days: context.confirmDays || 5,
    total_applications: context.totalApplicationsCount || 24,
    available_funds: formatCurrency(programSettings?.availableFunds || 40000),
    reply_by: context.replyByDate || '5 school days from notice',
    reviewer_name: context.reviewer?.name || 'Review Committee Member',
    review_deadline: context.reviewDeadline || programSettings?.awardsAnnouncedDate || 'Nov 12, 2026',
    pending_reviews_count: context.pendingReviewsCount ?? 1,
    flagged_reason: context.flaggedReason || 'Unapproved vendor justification required',
  };
}

/**
 * Minimal template parser supporting:
 * - Simple variable replacement: {{variable}}
 * - Conditional blocks: {{#if variable}}...{{/if}}
 */
export function renderTemplateText(templateText: string, fields: Record<string, any>): string {
  // 1. Process {{#if key}}content{{/if}}
  const ifRegex = /\{\{#if\s+([a-zA-Z0-9_]+)\}\}([\s\S]*?)\{\{\/if\}\}/g;
  let processed = templateText.replace(ifRegex, (_, conditionKey, blockContent) => {
    const val = fields[conditionKey];
    const isTruthy = Boolean(val) && val !== 0 && val !== '0' && val !== 'false';
    return isTruthy ? blockContent : '';
  });

  // 2. Process variable tags: {{field}}
  const varRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
  processed = processed.replace(varRegex, (_, key) => {
    const val = fields[key];
    if (val === undefined || val === null) {
      return '';
    }
    return String(val);
  });

  return processed;
}

/**
 * Determine default recipient list based on template code and context
 */
export function determineRecipients(
  templateCode: string,
  context: EmailRenderContext
): { to: string[]; cc?: string[] } {
  const { application } = context;
  const appAny = application as any;

  const teamEmails: string[] = [];
  if (appAny.applicantNames && appAny.applicantNames.length > 0) {
    for (const applicant of appAny.applicantNames) {
      if (applicant.email && !teamEmails.includes(applicant.email)) {
        teamEmails.push(applicant.email);
      }
    }
  }
  if (appAny.applicantEmail && !teamEmails.includes(appAny.applicantEmail)) {
    teamEmails.push(appAny.applicantEmail);
  }

  const principalEmail = appAny.principalEmail ? [appAny.principalEmail] : [];

  switch (templateCode) {
    case 'T1':
    case 'T2':
    case 'T3':
    case 'T4':
    case 'T9':
    case 'T11':
      return { to: teamEmails };

    case 'T5':
      // The person who replied, cc team
      return {
        to: [teamEmails[0] || appAny.applicantEmail || ''],
        cc: teamEmails.slice(1),
      };

    case 'T6':
    case 'T7':
    case 'T10':
      // All team members, cc principal
      return {
        to: teamEmails,
        cc: principalEmail,
      };

    case 'T8':
      // Not funded: team members only, explicitly no cc to principal
      return { to: teamEmails };

    case 'A1':
      // Approver: campus principal
      return { to: principalEmail.length > 0 ? principalEmail : ['principal@nacisd.org'] };

    case 'R1':
    case 'R2':
      // Assigned reviewer
      return { to: [context.reviewer?.email || 'reviewer@nefgrants.org'] };

    case 'R3':
    case 'R5':
      // Committee / Admins
      return { to: ['grants@nefgrants.org'] };

    case 'R4':
      // Intake admin flag
      return { to: ['grants@nefgrants.org', 'admin@nefgrants.org'] };

    default:
      return { to: teamEmails };
  }
}

/**
 * Main helper to populate any of the 17 email templates with application data.
 * Returns the fully rendered email ready for sending.
 */
export function populateEmailTemplate(
  templateKeyOrCode: string,
  context: EmailRenderContext
): RenderedEmail {
  // Find template by code (e.g. 'T1') or id
  const template =
    EMAIL_TEMPLATES[templateKeyOrCode] ||
    ALL_EMAIL_TEMPLATES_LIST.find(
      (t) => t.code.toLowerCase() === templateKeyOrCode.toLowerCase() || t.id === templateKeyOrCode
    ) ||
    EMAIL_TEMPLATE_T1;

  const mergeFields = extractMergeFields(context);
  const subject = renderTemplateText(template.subject, mergeFields);
  const body = renderTemplateText(template.body, mergeFields);
  const { to, cc } = determineRecipients(template.code, context);

  return {
    to,
    cc: cc && cc.length > 0 ? cc : undefined,
    replyTo: 'Grants Committee <grants@nefgrants.org>',
    subject,
    body,
  };
}
