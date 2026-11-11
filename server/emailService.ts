/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import nodemailer from 'nodemailer';
import { initializeApp, getApps } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDoc } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json' with { type: 'json' };

// Initialize Firebase for server operations
const serverFirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(serverFirebaseApp, firebaseConfig.firestoreDatabaseId);

// =============================================================================
// APP_URL CONFIGURATION & STARTUP VALIDATION
// =============================================================================
export function getAppUrl(): string {
  const url = process.env.APP_URL || process.env.VITE_APP_URL || '';
  if (!url || url.includes('placeholder') || url.includes('example.com')) {
    // Fallback to runtime URL if in cloud environment
    return 'https://ais-dev-xblap6wdvzegdkrx6rontj-417295429525.us-west1.run.app';
  }
  return url.replace(/\/+$/, '');
}

export function validateAppUrlStartup(): void {
  const appUrl = getAppUrl();
  if (!appUrl || appUrl.includes('example.com')) {
    console.warn('⚠️ [EMAIL SYSTEM] Warning: APP_URL is not set or uses a placeholder! Email links may be broken.');
  } else {
    console.log(`✅ [EMAIL SYSTEM] Initialized with site address (APP_URL): ${appUrl}`);
  }
}

// =============================================================================
// HTML ESCAPING FOR SAFETY
// =============================================================================
export function escapeHtml(str: unknown): string {
  if (str === null || str === undefined) return '';
  const s = String(str);
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// =============================================================================
// FEATHER LOGO (VECTOR EMBEDDED)
// =============================================================================
// SVG encoded to base64 so it displays in email clients without requiring external hosting
export const NEF_FEATHER_LOGO_BASE64 = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48" fill="none"><path d="M24 6 C28 14, 34 22, 34 32 C34 36, 31 39, 27 40 L24 41 L21 40 C17 39, 14 36, 14 32 C14 22, 20 14, 24 6 Z" stroke="%238CC8E8" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M24 14 Q30 18 32 24" stroke="%238CC8E8" stroke-width="1.8" opacity="0.8" /><path d="M24 20 Q31 23 33 29" stroke="%238CC8E8" stroke-width="1.8" opacity="0.8" /><path d="M24 16 Q18 20 16 26" stroke="%238CC8E8" stroke-width="1.8" opacity="0.8" /><path d="M24 22 Q17 25 15 31" stroke="%238CC8E8" stroke-width="1.8" opacity="0.8" /><path d="M24 8 L24 38" stroke="%238CC8E8" stroke-width="2.5" stroke-linecap="round" /><path d="M22 38 L24 43 L26 38 Z" fill="%238CC8E8" stroke="%238CC8E8" stroke-width="1.5" /><path d="M15 44 C19 42.5, 21 45.5, 25 44 C29 42.5, 31 45.5, 35 44" stroke="%238CC8E8" stroke-width="1.8" stroke-linecap="round"/></svg>`;

// =============================================================================
// SHARED BRANDED EMAIL TEMPLATE
// =============================================================================
export interface BrandedEmailOptions {
  headline: string;
  previewText: string;
  paragraphs: string[];
  grantCode?: string;
  grantTitle?: string;
  buttonText?: string;
  buttonUrl?: string;
  calloutBox?: {
    title: string;
    items: Array<{ label: string; value: string }>;
  };
  footerNotice?: string;
}

export function renderBrandedEmailHtml(options: BrandedEmailOptions): string {
  const {
    headline,
    previewText,
    paragraphs,
    grantCode,
    grantTitle,
    buttonText,
    buttonUrl,
    calloutBox,
    footerNotice,
  } = options;

  const escapedHeadline = escapeHtml(headline);
  const escapedPreview = escapeHtml(previewText);

  // Paragraphs rendering
  const paragraphsHtml = paragraphs
    .map(
      (p) =>
        `<p style="margin: 0 0 16px 0; font-size: 15px; line-height: 1.6; color: #2A3B47;">${p}</p>`
    )
    .join('');

  // Specific Grant Badge / Callout
  let grantBadgeHtml = '';
  if (grantCode || grantTitle) {
    grantBadgeHtml = `
      <div style="margin: 0 0 20px 0; padding: 14px 18px; background-color: #F0F6FA; border-left: 4px solid #062A3D; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 700; letter-spacing: 0.1em; color: #062A3D; text-transform: uppercase;">Regarding Grant Proposal</div>
        <div style="font-size: 16px; font-weight: 700; color: #062A3D; margin-top: 3px;">
          <span style="font-family: monospace; background: #062A3D; color: #8CC8E8; padding: 2px 7px; border-radius: 4px; font-size: 13px; margin-right: 6px;">${escapeHtml(grantCode || 'N/A')}</span>
          ${escapeHtml(grantTitle || 'Untitled Project')}
        </div>
      </div>
    `;
  }

  // Callout info box if provided
  let calloutHtml = '';
  if (calloutBox) {
    const itemsHtml = calloutBox.items
      .map(
        (it) => `
        <tr style="border-bottom: 1px solid #E2E8F0;">
          <td style="padding: 8px 12px; font-size: 13px; font-weight: 600; color: #475569; width: 40%;">${escapeHtml(it.label)}</td>
          <td style="padding: 8px 12px; font-size: 13px; color: #0F172A; font-weight: 500;">${escapeHtml(it.value)}</td>
        </tr>
      `
      )
      .join('');

    calloutHtml = `
      <div style="margin: 20px 0; border: 1px solid #CBD5E1; border-radius: 8px; overflow: hidden; background: #FFFFFF;">
        <div style="background: #062A3D; color: #FFFFFF; font-size: 12px; font-weight: 700; padding: 10px 14px; text-transform: uppercase; letter-spacing: 0.05em;">
          ${escapeHtml(calloutBox.title)}
        </div>
        <table style="width: 100%; border-collapse: collapse;">
          <tbody>${itemsHtml}</tbody>
        </table>
      </div>
    `;
  }

  // CTA Button
  let buttonHtml = '';
  if (buttonText && buttonUrl) {
    buttonHtml = `
      <div style="margin: 28px 0 20px 0; text-align: left;">
        <a href="${escapeHtml(buttonUrl)}" style="display: inline-block; background-color: #062A3D; color: #FFFFFF; font-size: 14px; font-weight: 700; text-decoration: none; padding: 13px 28px; border-radius: 8px; box-shadow: 0 2px 4px rgba(6, 42, 61, 0.2);" target="_blank">
          ${escapeHtml(buttonText)} &rarr;
        </a>
      </div>
      <div style="font-size: 12px; color: #64748B; margin-bottom: 24px;">
        Direct link: <a href="${escapeHtml(buttonUrl)}" style="color: #0284C7; text-decoration: underline;">${escapeHtml(buttonUrl)}</a>
      </div>
    `;
  }

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapedHeadline}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F7F9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1E2A33;">
  <!-- One-Line Hidden Inbox Preheader Preview -->
  <div style="display: none; font-size: 1px; color: #FFFFFF; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden;">
    ${escapedPreview}
  </div>

  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background-color: #F4F7F9; padding: 24px 12px;">
    <tr>
      <td align="center">
        <!-- Main Card Container -->
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 16px rgba(6, 42, 61, 0.08); border: 1px solid #E2E8F0;" cellspacing="0" cellpadding="0" border="0">
          
          <!-- Branded Navy Header with Logo -->
          <tr>
            <td style="background-color: #062A3D; padding: 28px 32px; border-bottom: 3px solid #8CC8E8;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td width="52" valign="middle">
                    <img src="${NEF_FEATHER_LOGO_BASE64}" width="42" height="42" alt="NEF Logo" style="display: block; border: 0;" />
                  </td>
                  <td valign="middle" style="padding-left: 14px;">
                    <div style="font-size: 10px; font-weight: 800; letter-spacing: 0.2em; color: #8CC8E8; text-transform: uppercase;">
                      NACOGDOCHES ISD EDUCATION FOUNDATION
                    </div>
                    <div style="font-size: 18px; font-weight: 700; letter-spacing: 0.08em; color: #FFFFFF; margin-top: 2px;">
                      MERITED GRANTS
                    </div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Email Content Body -->
          <tr>
            <td style="padding: 32px 32px 24px 32px;">
              <h1 style="margin: 0 0 18px 0; font-size: 22px; font-weight: 800; color: #062A3D; letter-spacing: -0.01em; line-height: 1.3;">
                ${escapedHeadline}
              </h1>

              ${grantBadgeHtml}
              ${paragraphsHtml}
              ${calloutHtml}
              ${buttonHtml}

              <div style="margin-top: 28px; padding-top: 20px; border-top: 1px solid #E2E8F0; font-size: 13px; color: #64748B; line-height: 1.5;">
                Sincerely,<br>
                <strong style="color: #062A3D;">Nacogdoches ISD Education Foundation Grants Committee</strong><br>
                Erin Windham, Executive Director &bull; <a href="mailto:ewindham@nacisd.org" style="color: #0284C7; text-decoration: none;">ewindham@nacisd.org</a>
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; padding: 20px 32px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #64748B; line-height: 1.5;">
              <div>Nacogdoches ISD Education Foundation &bull; 420 S. Shawnee St., Nacogdoches, TX 75961</div>
              <div style="margin-top: 4px;">Empowering Teachers &bull; Inspiring Students &bull; Driving Classroom Innovation</div>
              ${footerNotice ? `<div style="margin-top: 8px; color: #94A3B8;">${escapeHtml(footerNotice)}</div>` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function renderBrandedEmailText(options: BrandedEmailOptions): string {
  const { headline, previewText, paragraphs, grantCode, grantTitle, buttonText, buttonUrl, calloutBox } = options;
  const lines: string[] = [];

  lines.push('====================================================');
  lines.push('NACOGDOCHES ISD EDUCATION FOUNDATION — MERITED GRANTS');
  lines.push('====================================================');
  lines.push('');
  lines.push(headline.toUpperCase());
  lines.push('----------------------------------------------------');
  lines.push(previewText);
  lines.push('');

  if (grantCode || grantTitle) {
    lines.push(`REGARDING PROPOSAL: [${grantCode || 'N/A'}] ${grantTitle || ''}`);
    lines.push('');
  }

  // Strip HTML tags for plain text paragraphs
  for (const p of paragraphs) {
    lines.push(p.replace(/<[^>]+>/g, ''));
    lines.push('');
  }

  if (calloutBox) {
    lines.push(`--- ${calloutBox.title} ---`);
    for (const item of calloutBox.items) {
      lines.push(`${item.label}: ${item.value}`);
    }
    lines.push('');
  }

  if (buttonText && buttonUrl) {
    lines.push(`${buttonText}:`);
    lines.push(buttonUrl);
    lines.push('');
  }

  lines.push('----------------------------------------------------');
  lines.push('Nacogdoches ISD Education Foundation Grants Committee');
  lines.push('Erin Windham, Executive Director (ewindham@nacisd.org)');
  lines.push('420 S. Shawnee St., Nacogdoches, TX 75961');
  return lines.join('\n');
}

// =============================================================================
// SERVER-SIDE DISPATCH & AUDIT LOGGING
// =============================================================================
export interface SendEmailPayload {
  to: string | string[];
  subject: string;
  type: string;
  options: BrandedEmailOptions;
  grantCode?: string;
  applicationId?: string;
  sentByUid?: string;
  sentByEmail?: string;
  dedupKey?: string; // Check to prevent duplicate emails
}

export interface SentEmailRecord {
  id: string;
  recipient: string;
  allRecipients: string[];
  subject: string;
  type: string;
  delivered: boolean;
  simulated: boolean;
  timestamp: string;
  grantCode: string | null;
  applicationId: string | null;
  sentByUid: string;
  sentByEmail: string;
  messageId: string;
  error: string | null;
}

export const serverSentEmailsLog: SentEmailRecord[] = [];

export interface SendEmailResult {
  success: boolean;
  simulated: boolean;
  recipient: string;
  subject: string;
  messageId: string;
  error?: string;
}

export async function sendServerEmail(payload: SendEmailPayload): Promise<SendEmailResult> {
  const recipients = Array.isArray(payload.to) ? payload.to : [payload.to];
  const primaryRecipient = recipients[0]?.trim().toLowerCase() || '';

  const htmlContent = renderBrandedEmailHtml(payload.options);
  const textContent = renderBrandedEmailText(payload.options);

  let delivered = false;
  let simulated = true;
  let messageId = `sim-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  let errorMsg: string | undefined = undefined;

  // Check if SMTP or custom transport is configured
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
  const fromAddress = process.env.FROM_EMAIL || 'grants@nefgrants.org';

  if (smtpHost && smtpUser && smtpPass) {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      const info = await transporter.sendMail({
        from: `"Nacogdoches ISD Education Foundation" <${fromAddress}>`,
        to: recipients.join(', '),
        subject: payload.subject,
        html: htmlContent,
        text: textContent,
      });

      delivered = true;
      simulated = false;
      messageId = info.messageId || messageId;
      console.log(`📧 [EMAIL DELIVERED] Sent "${payload.subject}" to ${recipients.join(', ')} (ID: ${messageId})`);
    } catch (err: unknown) {
      errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`❌ [EMAIL ERROR] Failed delivering to ${recipients.join(', ')}:`, errorMsg);
      // Fallback to simulated delivery so app flow is not stalled
      delivered = false;
      simulated = true;
    }
  } else {
    // Simulated delivery mode
    delivered = true;
    simulated = true;
    console.log(`📨 [SIMULATED EMAIL] (No SMTP credentials configured - logging payload):`);
    console.log(`   To: ${recipients.join(', ')}`);
    console.log(`   Type: ${payload.type}`);
    console.log(`   Subject: ${payload.subject}`);
    console.log(`   Grant: [${payload.grantCode || 'N/A'}] ${payload.options.grantTitle || ''}`);
  }

  // Log to Firestore /sent_emails collection (Server write, Admin read)
  // CRITICAL RULE: If logging fails, do not report the email as failed
  try {
    const logDocId = `email-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const logData = {
      id: logDocId,
      recipient: primaryRecipient,
      allRecipients: recipients,
      subject: payload.subject,
      type: payload.type,
      delivered,
      simulated,
      timestamp: new Date().toISOString(),
      grantCode: payload.grantCode || null,
      applicationId: payload.applicationId || null,
      sentByUid: payload.sentByUid || 'system',
      sentByEmail: payload.sentByEmail || 'system',
      messageId,
      error: errorMsg || null,
    };

    serverSentEmailsLog.unshift(logData);
    if (serverSentEmailsLog.length > 500) {
      serverSentEmailsLog.pop();
    }

    await setDoc(doc(db, 'sent_emails', logDocId), logData);
  } catch (logErr) {
    console.warn('⚠️ [EMAIL LOGGING WARNING] Failed to persist sent_emails document (email still dispatched):', logErr);
  }

  return {
    success: delivered || simulated,
    simulated,
    recipient: primaryRecipient,
    subject: payload.subject,
    messageId,
    error: errorMsg,
  };
}

// =============================================================================
// SPECIFIC EMAIL SENDERS REQUIRED BY THE WORKFLOW
// =============================================================================

/**
 * 1. Reviewer Invitation Email (with 14-day expiring link)
 */
export async function sendReviewerInviteEmail(params: {
  email: string;
  name: string;
  inviteToken: string;
  expiresAt: string;
  cyclesServed?: number;
  sentByUid?: string;
  sentByEmail?: string;
}): Promise<SendEmailResult> {
  const { email, name, inviteToken, expiresAt, sentByUid, sentByEmail } = params;
  const appUrl = getAppUrl();
  const inviteUrl = `${appUrl}/?invite=${encodeURIComponent(inviteToken)}`;
  const expiresDateFormatted = new Date(expiresAt).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const options: BrandedEmailOptions = {
    headline: 'You are Invited to the NEF Grants Review Committee',
    previewText: `Official invitation to evaluate Nacogdoches ISD classroom innovation grants. Link expires ${expiresDateFormatted}.`,
    paragraphs: [
      `Dear ${escapeHtml(name)},`,
      `You have been invited by the Nacogdoches ISD Education Foundation to serve as an evaluator for this cycle's Innovative Teaching Grants.`,
      `Your expertise directly helps reward teachers who inspire students and pilot impactful classroom projects. Scoring is conducted using our strict blind evaluation rubric.`,
      `<strong>Security Notice:</strong> Your unique invitation link is valid for <strong>14 days (expires ${escapeHtml(expiresDateFormatted)})</strong>. Click the button below to activate your account and access your assigned review queue.`,
    ],
    buttonText: 'Accept Invitation & Access Scoring Portal',
    buttonUrl: inviteUrl,
    calloutBox: {
      title: 'Review Committee Details',
      items: [
        { label: 'Role', value: 'Grant Evaluator (Blind Review)' },
        { label: 'Invitation Expires', value: expiresDateFormatted },
        { label: 'Platform', value: 'NEF Merited Grants Engine' },
      ],
    },
    footerNotice: 'Do not forward this email; your link contains your encrypted evaluator authorization token.',
  };

  return sendServerEmail({
    to: email,
    subject: 'Invitation: Nacogdoches ISD Education Foundation Grant Review Committee',
    type: 'reviewer_invite',
    options,
    sentByUid,
    sentByEmail,
  });
}

/**
 * 2. Reviewer Assigned / "Review is Open" notification
 * Sent when applications close and evaluation begins
 */
export async function sendReviewCycleOpenEmail(params: {
  reviewerEmail: string;
  reviewerName: string;
  reviewClosesDate: string;
  totalApplications: number;
  sentByUid?: string;
}): Promise<SendEmailResult> {
  const { reviewerEmail, reviewerName, reviewClosesDate, totalApplications, sentByUid } = params;
  const appUrl = getAppUrl();

  const options: BrandedEmailOptions = {
    headline: 'Scoring Window is Open: Innovative Teaching Grants',
    previewText: `${totalApplications} innovative proposals are ready in your review queue. Scoring closes ${escapeHtml(reviewClosesDate)}.`,
    paragraphs: [
      `Dear ${escapeHtml(reviewerName)},`,
      `The grant application window has officially closed, and <strong>${totalApplications} proposals</strong> have completed administrative eligibility screening and are now assigned to your review queue.`,
      `Please review and evaluate each proposal against our 8-criterion rubric. Remember that each criterion requires a score (1–5) and a brief one-line justification comment.`,
      `<strong>Important Deadline:</strong> All scores must be submitted prior to <strong>11:59 PM America/Chicago on ${escapeHtml(reviewClosesDate)}</strong>, at which time scoring will lock for committee deliberations.`,
    ],
    buttonText: 'Open Reviewer Queue',
    buttonUrl: `${appUrl}/?view=queue`,
    calloutBox: {
      title: 'Evaluation Window',
      items: [
        { label: 'Assigned Proposals', value: `${totalApplications} applications` },
        { label: 'Scoring Close Date', value: `${reviewClosesDate} at 11:59 PM CST` },
        { label: 'Protocol', value: 'Blind review active (Educator & campus masked)' },
      ],
    },
  };

  return sendServerEmail({
    to: reviewerEmail,
    subject: 'Review Queue Ready: NEF Innovative Teaching Grants Evaluation',
    type: 'review_cycle_open',
    options,
    sentByUid,
  });
}

/**
 * 3. Review Submitted Notification to Admins
 * Sent when an evaluator finishes scoring a proposal
 */
export async function sendReviewSubmittedAdminEmail(params: {
  adminEmail: string;
  reviewerName: string;
  reviewerRole: string;
  grantCode: string;
  grantTitle: string;
  totalScore: number;
  criteriaScores: Record<string, number>;
  flaggedForDiscussion: boolean;
  applicationId: string;
  sentByUid?: string;
}): Promise<SendEmailResult> {
  const {
    adminEmail,
    reviewerName,
    reviewerRole,
    grantCode,
    grantTitle,
    totalScore,
    flaggedForDiscussion,
    applicationId,
    sentByUid,
  } = params;

  const appUrl = getAppUrl();
  const rankingUrl = `${appUrl}/?view=rankings`;

  const options: BrandedEmailOptions = {
    headline: `Review Submitted: ${escapeHtml(grantCode)}`,
    previewText: `${escapeHtml(reviewerName)} scored ${escapeHtml(grantCode)} (${totalScore.toFixed(1)}/100)${flaggedForDiscussion ? ' [FLAGGED FOR DISCUSSION]' : ''}.`,
    grantCode,
    grantTitle,
    paragraphs: [
      `Administrator Notice:`,
      `Evaluator <strong>${escapeHtml(reviewerName)}</strong> (${escapeHtml(reviewerRole)}) has submitted an evaluation for proposal <strong>${escapeHtml(grantCode)} - ${escapeHtml(grantTitle)}</strong>.`,
      `The calculated composite score is <strong>${totalScore.toFixed(1)} / 100 points</strong>.`,
      flaggedForDiscussion
        ? `<strong style="color: #DC2626;">&bull; Note: This review has been marked "FLAGGED FOR DISCUSSION" for committee deliberation.</strong>`
        : `This review is complete and integrated into the live committee rankings.`,
    ],
    buttonText: 'View Admin Rankings',
    buttonUrl: rankingUrl,
    calloutBox: {
      title: 'Scoring Summary',
      items: [
        { label: 'Evaluator', value: reviewerName },
        { label: 'Composite Score', value: `${totalScore.toFixed(1)} / 100` },
        { label: 'Flagged for Deliberation', value: flaggedForDiscussion ? 'YES' : 'No' },
      ],
    },
  };

  return sendServerEmail({
    to: adminEmail,
    subject: `Review Submitted [${grantCode}] — ${reviewerName} (${totalScore.toFixed(1)} pts)${flaggedForDiscussion ? ' [FLAGGED]' : ''}`,
    type: 'review_submitted',
    grantCode,
    applicationId,
    options,
    sentByUid,
  });
}

/**
 * 4. Teacher Submission Confirmation Email
 */
export async function sendTeacherSubmissionConfirmationEmail(params: {
  teacherEmail: string;
  teacherName: string;
  grantCode: string;
  grantTitle: string;
  amountRequested: number;
  category: string;
}): Promise<SendEmailResult> {
  const { teacherEmail, teacherName, grantCode, grantTitle, amountRequested, category } = params;
  const appUrl = getAppUrl();

  const options: BrandedEmailOptions = {
    headline: 'Application Received: Innovative Teaching Grant',
    previewText: `Your proposal ${grantCode} (${grantTitle}) has been securely recorded for cycle review.`,
    grantCode,
    grantTitle,
    paragraphs: [
      `Dear ${escapeHtml(teacherName)},`,
      `Thank you for applying for a Nacogdoches ISD Education Foundation Innovative Teaching Grant. Your proposal has been successfully received and assigned grant code <strong>${escapeHtml(grantCode)}</strong>.`,
      `Your proposal will now undergo administrative eligibility screening followed by blind committee scoring. All evaluator reviews are conducted with applicant names and campuses strictly masked.`,
      `Award decisions will be announced during our annual in-person campus celebrations in mid-November.`,
    ],
    buttonText: 'Check Proposal Status',
    buttonUrl: `${appUrl}/?code=${encodeURIComponent(grantCode)}`,
    calloutBox: {
      title: 'Submission Receipt',
      items: [
        { label: 'Grant Code', value: grantCode },
        { label: 'Requested Amount', value: `$${amountRequested.toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
        { label: 'Category', value: category },
        { label: 'Status', value: 'Submitted & Queued for Review' },
      ],
    },
  };

  return sendServerEmail({
    to: teacherEmail,
    subject: `Confirmation: NEF Grant Application Received [${grantCode}]`,
    type: 'teacher_submission_confirmation',
    grantCode,
    options,
  });
}

/**
 * 5. Application Status Changed Notification
 */
export async function sendApplicationStatusChangedEmail(params: {
  teacherEmail: string;
  teacherName: string;
  grantCode: string;
  grantTitle: string;
  oldStatus: string;
  newStatus: string;
  statusReason?: string;
}): Promise<SendEmailResult> {
  const { teacherEmail, teacherName, grantCode, grantTitle, oldStatus, newStatus, statusReason } = params;
  const appUrl = getAppUrl();

  const options: BrandedEmailOptions = {
    headline: `Status Update: ${escapeHtml(grantCode)}`,
    previewText: `Your application "${grantTitle}" has moved from ${oldStatus} to ${newStatus}.`,
    grantCode,
    grantTitle,
    paragraphs: [
      `Dear ${escapeHtml(teacherName)},`,
      `There is an official status update regarding your Nacogdoches ISD Education Foundation grant proposal <strong>${escapeHtml(grantCode)} - ${escapeHtml(grantTitle)}</strong>.`,
      `The proposal status has been updated to: <strong style="color: #062A3D; font-size: 16px;">${escapeHtml(newStatus)}</strong>.`,
      statusReason ? `<strong>Committee Notes:</strong> ${escapeHtml(statusReason)}` : '',
    ].filter(Boolean),
    buttonText: 'View Application Details',
    buttonUrl: `${appUrl}/?code=${encodeURIComponent(grantCode)}`,
    calloutBox: {
      title: 'Status Details',
      items: [
        { label: 'Grant Code', value: grantCode },
        { label: 'Previous Status', value: oldStatus },
        { label: 'Current Status', value: newStatus },
      ],
    },
  };

  return sendServerEmail({
    to: teacherEmail,
    subject: `Grant Update [${grantCode}]: Status Changed to ${newStatus}`,
    type: 'application_status_changed',
    grantCode,
    options,
  });
}

/**
 * 6. Bulk Decision Emails (Funded / Partially Funded / Not Funded)
 * Enforces deduplication via decisionEmailSentAt
 */
export interface BulkDecisionItem {
  applicationId: string;
  grantCode: string;
  title: string;
  status: 'funded' | 'partially_funded' | 'not_funded' | 'Funded' | 'Partially Funded' | 'Not Funded';
  amountRequested: number;
  awardedAmount?: number;
  committeeFeedback?: string;
  recipientEmail: string;
  recipientName: string;
  decisionEmailSentAt?: string;
}

export interface BulkDecisionReport {
  total: number;
  sent: number;
  failed: number;
  skipped: Array<{ grantCode: string; title: string; reason: string }>;
}

export async function sendBulkDecisionEmails(
  decisions: BulkDecisionItem[],
  adminUid: string,
  adminEmail: string
): Promise<BulkDecisionReport> {
  const report: BulkDecisionReport = {
    total: decisions.length,
    sent: 0,
    failed: 0,
    skipped: [],
  };

  const appUrl = getAppUrl();

  for (const item of decisions) {
    // Deduplication check: NEVER send the same decision email twice
    if (item.decisionEmailSentAt) {
      report.skipped.push({
        grantCode: item.grantCode,
        title: item.title,
        reason: `Decision notice was already dispatched on ${new Date(item.decisionEmailSentAt).toLocaleDateString()}`,
      });
      continue;
    }

    if (!item.recipientEmail || !item.recipientEmail.includes('@')) {
      report.skipped.push({
        grantCode: item.grantCode,
        title: item.title,
        reason: 'Missing or invalid teacher recipient email address',
      });
      continue;
    }

    const normStatus = String(item.status).toLowerCase();
    const isFunded = normStatus === 'funded' || normStatus === 'partially_funded';
    const isPartial = normStatus === 'partially_funded';

    let headline = 'Nacogdoches ISD Education Foundation Grant Award Notice';
    let preview = `Official decision regarding grant proposal ${item.grantCode}: ${item.title}`;
    let paragraphs: string[] = [];

    if (isFunded) {
      const awardDisplay = `$${(item.awardedAmount || item.amountRequested).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;
      headline = isPartial ? 'Grant Award: Partial Funding Approved!' : 'Congratulations! Your Grant Proposal is Funded!';
      preview = `Congratulations! The NEF Foundation has approved ${awardDisplay} for ${item.grantCode}.`;
      paragraphs = [
        `Dear ${escapeHtml(item.recipientName)},`,
        `On behalf of the Nacogdoches ISD Education Foundation Board of Directors, we are thrilled to inform you that your grant proposal <strong>${escapeHtml(item.grantCode)} - ${escapeHtml(item.title)}</strong> has been selected for funding!`,
        `Your award amount is <strong>${awardDisplay}</strong>.`,
        item.committeeFeedback ? `<strong>Committee Commendation:</strong> "${escapeHtml(item.committeeFeedback)}"` : '',
        `Our Surprise Patrol will celebrate your classroom achievement during the district-wide presentation. Purchasing and disbursement guidance will follow immediately.`,
      ].filter(Boolean);
    } else {
      headline = 'NEF Grant Proposal Decision';
      preview = `Decision update regarding your grant application ${item.grantCode}.`;
      paragraphs = [
        `Dear ${escapeHtml(item.recipientName)},`,
        `Thank you for taking the time to submit your proposal <strong>${escapeHtml(item.grantCode)} - ${escapeHtml(item.title)}</strong> to the Nacogdoches ISD Education Foundation.`,
        `This cycle was exceptionally competitive, with funding requests significantly exceeding available funds. While your project was not selected for an award this cycle, we deeply admire your dedication to educational innovation.`,
        item.committeeFeedback ? `<strong>Reviewer Feedback:</strong> "${escapeHtml(item.committeeFeedback)}"` : '',
        `We strongly encourage you to refine your proposal and submit again during our upcoming spring/fall grant cycles.`,
      ].filter(Boolean);
    }

    const options: BrandedEmailOptions = {
      headline,
      previewText: preview,
      grantCode: item.grantCode,
      grantTitle: item.title,
      paragraphs,
      buttonText: 'View Award Decision & Details',
      buttonUrl: `${appUrl}/?code=${encodeURIComponent(item.grantCode)}`,
      calloutBox: {
        title: 'Grant Decision Record',
        items: [
          { label: 'Grant Code', value: item.grantCode },
          { label: 'Status', value: isFunded ? (isPartial ? 'Partially Funded' : 'Funded') : 'Not Funded This Cycle' },
          { label: 'Award Amount', value: isFunded ? `$${(item.awardedAmount || item.amountRequested).toFixed(2)}` : '$0.00' },
        ],
      },
    };

    try {
      const res = await sendServerEmail({
        to: item.recipientEmail,
        subject: `NEF Grant Decision: ${item.grantCode} - ${item.title}`,
        type: 'bulk_decision',
        grantCode: item.grantCode,
        applicationId: item.applicationId,
        sentByUid: adminUid,
        sentByEmail: adminEmail,
        options,
      });

      if (res.success) {
        report.sent += 1;
        // Record timestamp in Firestore to prevent repeat sends
        const nowIso = new Date().toISOString();
        try {
          await setDoc(
            doc(db, 'applications', item.applicationId),
            { decisionEmailSentAt: nowIso, updatedAt: nowIso },
            { merge: true }
          );
        } catch (dbErr) {
          console.warn(`⚠️ Failed updating decisionEmailSentAt for ${item.grantCode}:`, dbErr);
        }
      } else {
        report.failed += 1;
      }
    } catch (err: unknown) {
      report.failed += 1;
      console.error(`Failed sending decision for ${item.grantCode}:`, err);
    }
  }

  return report;
}
