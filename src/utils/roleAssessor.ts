// Validation, recommendation and export logic for the access request tracker.
// Semantics follow the AuditSphere role-assignment service: no future-dated
// access, expiry at date granularity (server floor is 5 minutes), group grants
// never expire, and maker-checker pairs flagged scope-aware.

import {
  ROLES,
  SCOPES,
  SOD_PAIRS,
} from '../data/rolesData.ts';
import type {
  RoleCode,
  RoleDefinition,
  RoleRequestRow,
  RequestDetails,
  ScopeCode,
} from '../data/rolesData.ts';

export type { RoleRequestRow, RequestDetails } from '../data/rolesData.ts';

export interface DecisionTreeAnswers {
  /** Staff identities use the firm's work directory; client identities use the portal. */
  isExternalClient: boolean;
  /** Staff branch (when isExternalClient === false). */
  staffWorksOn?:
    | 'AUDIT_DELIVERY'
    | 'CLIENT_ACCOUNTING'
    | 'FIRM_FINANCE'
    | 'CLIENT_RELATIONSHIPS'
    | 'ADMINISTRATION';
  /** Audit delivery split. */
  auditRoleLevel?: 'PARTNER' | 'MANAGER' | 'SENIOR' | 'STAFF';
  /** Client accounting split. */
  accountingRoleSide?: 'PREPARE' | 'REVIEW';
  /** Firm finance split. */
  financeRoleSide?: 'MANAGE' | 'REVIEW';
}

export interface RoleRecommendation {
  role: RoleDefinition;
  recommendedScopes: ScopeCode[];
  rationale: string;
  makerCheckerNote: string;
  decisionPath: string[];
}

export interface RowValidationResult {
  isValid: boolean;
  errors: string[];
  policyWarnings: string[];
}

export interface DetailsValidationResult {
  isValid: boolean;
  errors: string[];
}

export type SodState = 'CONFLICT' | 'REVIEW' | 'CLEAR';

export interface SodFinding {
  email: string;
  roles: [RoleCode, RoleCode];
  state: 'CONFLICT' | 'REVIEW';
  /** Verbatim server wording plus the scope context. */
  message: string;
}

const PERSONAL_EMAIL_DOMAINS = new Set([
  'gmail.com',
  'yahoo.com',
  'hotmail.com',
  'outlook.com',
  'icloud.com',
  'aol.com',
]);

const SHARED_MAILBOX_PREFIXES = new Set([
  'info',
  'accounts',
  'finance',
  'admin',
  'billing',
  'support',
  'office',
  'audit',
  'audit-team',
  'team',
]);

export function getRoleByCode(code: RoleCode): RoleDefinition {
  const found = ROLES.find((r) => r.code === code);
  if (!found) {
    throw new Error(`Unknown role code: ${code}`);
  }
  return found;
}

/**
 * Validates work email syntax and enforces the sign-in rules:
 * Microsoft-identity sign-in only, individual addresses only.
 */
export function validateWorkEmail(email: string): {
  valid: boolean;
  error?: string;
  policyWarnings: string[];
} {
  const trimmed = (email ?? '').trim();
  const policyWarnings: string[] = [];

  if (!trimmed) {
    return {
      valid: false,
      error: 'Work email is required.',
      policyWarnings,
    };
  }

  if (trimmed.length > 320 || /\s/.test(trimmed)) {
    return {
      valid: false,
      error: 'Work email must be a valid single address without spaces.',
      policyWarnings,
    };
  }

  const atIndex = trimmed.indexOf('@');
  const lastAtIndex = trimmed.lastIndexOf('@');
  if (atIndex <= 0 || atIndex !== lastAtIndex || atIndex === trimmed.length - 1) {
    return {
      valid: false,
      error: 'Work email must contain a single "@" symbol with local and domain parts.',
      policyWarnings,
    };
  }

  const localPart = trimmed.slice(0, atIndex).toLowerCase();
  const domainPart = trimmed.slice(atIndex + 1).toLowerCase();

  if (!domainPart.includes('.') || domainPart.startsWith('.') || domainPart.endsWith('.')) {
    return {
      valid: false,
      error: 'Work email must include a valid domain (e.g., name@firm.com).',
      policyWarnings,
    };
  }

  if (PERSONAL_EMAIL_DOMAINS.has(domainPart)) {
    return {
      valid: false,
      error: `Personal domain "@${domainPart}" is rejected. Use the Microsoft sign-in identity issued to this person.`,
      policyWarnings,
    };
  }

  if (SHARED_MAILBOX_PREFIXES.has(localPart)) {
    return {
      valid: false,
      error: `Shared mailbox "${localPart}@${domainPart}" is rejected \u2014 every decision needs one accountable person.`,
      policyWarnings,
    };
  }

  return { valid: true, policyWarnings };
}

/** Contact email accepts any syntactically valid mailbox (warnings, not rejections). */
export function validateContactEmail(email: string): DetailsValidationResult['errors'] {
  const trimmed = (email ?? '').trim();
  if (!trimmed) return ['Contact email is required so we can confirm the submission.'];
  return trimmed.length <= 320 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)
    ? [] : ['Contact email must be a valid single email address.'];
}

/** Today's date in UTC as YYYY-MM-DD for expiry comparisons. */
export function utcTodayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function validateRequestDetails(details: Partial<RequestDetails>): DetailsValidationResult {
  const errors: string[] = [];
  const firmName = (details.firmName ?? '').trim();
  const submittedBy = (details.submittedBy ?? '').trim();

  if (!firmName) {
    errors.push('Firm or client name is required.');
  } else if (firmName.length > 200) {
    errors.push('Firm or client name must be 200 characters or fewer.');
  }

  if (!submittedBy) {
    errors.push('Your name is required.');
  } else if (submittedBy.length > 120) {
    errors.push('Your name must be 120 characters or fewer.');
  }

  errors.push(...validateContactEmail(details.contactEmail ?? ''));

  return { isValid: errors.length === 0, errors };
}

/**
 * Scope containment between two grants of opposite maker/checker roles.
 * CLEAR = provably disjoint; CONFLICT = one provably contains the other;
 * REVIEW = overlap cannot be determined from the submitted text.
 */
function scopeOverlap(a: Pick<RoleRequestRow, 'scopeType' | 'scopeTarget'>, b: Pick<RoleRequestRow, 'scopeType' | 'scopeTarget'>): SodState {
  const norm = (t: string) =>
    t.trim().toLowerCase().replace(/^(client|engagement|group)\s*:\s*/, '');
  const aTarget = norm(a.scopeTarget);
  const bTarget = norm(b.scopeTarget);
  const sameNonEmptyTarget = () => aTarget && aTarget === bTarget;

  if (a.scopeType === 'GROUP' || b.scopeType === 'GROUP') {
    if (a.scopeType === b.scopeType) return sameNonEmptyTarget() ? 'CONFLICT' : 'REVIEW';
    // Group vs client/engagement: component-entity overlap is unknowable here.
    return 'REVIEW';
  }
  if (a.scopeType === 'FIRM_WIDE' || b.scopeType === 'FIRM_WIDE') {
    // Firm-wide covers every client and engagement (never groups).
    return 'CONFLICT';
  }
  if (sameNonEmptyTarget()) return 'CONFLICT';
  if (a.scopeType !== b.scopeType) {
    // Client vs engagement of the same client cannot be ruled out.
    return 'REVIEW';
  }
  return 'CLEAR';
}

export function detectSodFindings(rows: RoleRequestRow[]): SodFinding[] {
  const findings: SodFinding[] = [];
  const byEmail = new Map<string, RoleRequestRow[]>();

  for (const row of rows) {
    const email = row.workEmail.trim().toLowerCase();
    if (!email) continue;
    const list = byEmail.get(email) ?? [];
    list.push(row);
    byEmail.set(email, list);
  }

  for (const [email, userRows] of byEmail.entries()) {
    for (const pair of SOD_PAIRS) {
      const aRows = userRows.filter((r) => r.roleRequested === pair.a);
      const bRows = userRows.filter((r) => r.roleRequested === pair.b);
      if (aRows.length === 0 || bRows.length === 0) continue;

      let worst: SodState = 'CLEAR';
      let scopeText = '';
      for (const a of aRows) {
        for (const b of bRows) {
          const state = scopeOverlap(a, b);
          if (state === 'CONFLICT') {
            worst = 'CONFLICT';
            scopeText = describeScopes(a, b);
            break;
          }
          if (state === 'REVIEW' && worst === 'CLEAR') {
            worst = 'REVIEW';
            scopeText = describeScopes(a, b);
          }
        }
        if (worst === 'CONFLICT') break;
      }

      if (worst === 'CLEAR') continue;

      const verb = worst === 'CONFLICT' ? 'always conflicts' : 'needs administrator review';
      findings.push({
        email,
        roles: [pair.a, pair.b],
        state: worst,
        message: `${pair.note} ${scopeText ? `${scopeText}: this pairing ` : 'This pairing '}${verb} at the scopes shown.`,
      });
    }
  }

  return findings;
}

function describeScopes(a: RoleRequestRow, b: RoleRequestRow): string {
  const label = (r: RoleRequestRow) =>
    r.scopeType === 'FIRM_WIDE'
      ? 'whole firm'
      : `${getDoc(r.scopeType, r.scopeTarget)}`;
  const getDoc = (scope: ScopeCode, target: string) => {
    const def = SCOPES.find((s) => s.code === scope);
    return `${def ? def.label.toLowerCase() : scope}${target.trim() ? ` \u201c${target.trim()}”` : ''}`;
  };
  return `${label(a)} vs ${label(b)}`;
}

/**
 * Back-compat facade: every finding rendered as one advisory string.
 * Contact rows never generate errors on their own.
 */
export function detectSeparationOfDutiesWarnings(rows: RoleRequestRow[]): string[] {
  return detectSodFindings(rows).map((f) => f.message);
}

export function recommendRole(answers: DecisionTreeAnswers): RoleRecommendation {
  const path: string[] = [];

  if (answers.isExternalClient) {
    path.push('Identity: client side (signs in through a Microsoft guest invitation)');
    const role = getRoleByCode('CLIENT_USER');
    return {
      role,
      recommendedScopes: ['ENGAGEMENT', 'CLIENT'],
      rationale:
        'Client-side people use the portal for an assigned client or engagement and respond to document requests. Their access never widens to the firm.',
      makerCheckerNote:
        'Portal powers start at first sign-in and pause during freeze windows; requests are answered by the person who owns them or is delegated.',
      decisionPath: path,
    };
  }

  path.push('Identity: firm staff (signs in through the firm\u2019s Microsoft directory)');

  switch (answers.staffWorksOn) {
    case 'ADMINISTRATION': {
      path.push('Work: administer users, roles and the sign-in connection');
      const role = getRoleByCode('ADMINISTRATOR');
      return {
        role,
        recommendedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT'],
        rationale:
          'Administration binds identities, grants and revokes access across the firm, and keeps the Microsoft 365 connection healthy.',
        makerCheckerNote:
          'Administrators cannot change their own access \u2014 a second administrator must approve it, and the last firm-wide administrator cannot be revoked without a replacement.',
        decisionPath: path,
      };
    }
    case 'CLIENT_RELATIONSHIPS': {
      path.push('Work: client relationship records and acceptance status');
      const role = getRoleByCode('RELATIONSHIP_MANAGER');
      return {
        role,
        recommendedScopes: ['CLIENT', 'FIRM_WIDE', 'ENGAGEMENT'],
        rationale:
          'Keeps the commercial picture accurate: manage client relationship records and watch acceptance status, one client at a time.',
        makerCheckerNote: 'Record-keeping and status only \u2014 no audit, accounting or approval authority.',
        decisionPath: path,
      };
    }
    case 'FIRM_FINANCE': {
      path.push('Work: firm billing and ledger');
      if (answers.financeRoleSide === 'REVIEW') {
        path.push('Duty: approve what finance prepares');
        const role = getRoleByCode('FINANCE_REVIEWER');
        return {
          role,
          recommendedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
          rationale:
            'Reviews and approves firm finance postings: invoices and journals prepared by the publisher role.',
          makerCheckerNote:
            'The server rejects approving your own preparation \u2014 keep preparation and review in different people.',
          decisionPath: path,
        };
      }
      path.push('Duty: manage billing, ledger and preparation');
      const role = getRoleByCode('FINANCE_MANAGER');
      return {
        role,
        recommendedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
        rationale:
          'Manages firm billing and the ledger, prepares invoices and journal drafts, and posts credit notes.',
        makerCheckerNote:
          'Journal commands require a firm-wide grant, and approvals belong to Finance Reviewer \u2014 never the preparer.',
        decisionPath: path,
      };
    }
    case 'CLIENT_ACCOUNTING': {
      path.push('Work: recurring client accounting & consolidation');
      if (answers.accountingRoleSide === 'REVIEW') {
        path.push('Duty: independently review that accounting');
        const role = getRoleByCode('ACCOUNTING_REVIEWER');
        return {
          role,
          recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'GROUP'],
          rationale:
            'Independently reviews scoped client accounting and consolidation work where explicitly permitted.',
          makerCheckerNote:
            'Never reviews their own preparation, and the Partner-approval stage stays Partner-only.',
          decisionPath: path,
        };
      }
      path.push('Duty: prepare that accounting');
      const role = getRoleByCode('ACCOUNTING_PREPARER');
      return {
        role,
        recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'GROUP'],
        rationale:
          'Prepares scoped client accounting and consolidation work where explicitly permitted.',
        makerCheckerNote:
          'Pairwise segregated from the reviewer role on the same identity \u2014 holding both never creates usable review rights.',
        decisionPath: path,
      };
    }
    default: {
      path.push('Work: audit delivery (fieldwork through sign-off)');
      switch (answers.auditRoleLevel) {
        case 'PARTNER': {
          path.push('Level: engagement owner');
          const role = getRoleByCode('PARTNER');
          return {
            role,
            recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'FIRM_WIDE', 'GROUP'],
            rationale:
              'Signs off engagement work, approves financial packages and releases, and closes review points for led clients.',
            makerCheckerNote:
              'Partner approvals check the currently-assigned engagement partner, not merely the role.',
            decisionPath: path,
          };
        }
        case 'MANAGER': {
          path.push('Level: reviews & runs fieldwork');
          const role = getRoleByCode('MANAGER');
          return {
            role,
            recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'FIRM_WIDE', 'GROUP'],
            rationale:
              'Reviews engagement work, manages planning and fieldwork, and prepares financial packages.',
            makerCheckerNote:
              'Review must differ from preparation; Partner-only approval stages stay out of reach.',
            decisionPath: path,
          };
        }
        case 'SENIOR': {
          path.push('Level: coordinates & prepares');
          const role = getRoleByCode('SENIOR');
          return {
            role,
            recommendedScopes: ['ENGAGEMENT', 'CLIENT', 'FIRM_WIDE'],
            rationale:
              'Coordinates assigned audit work, prepares working papers and operational tasks, and uses permitted planning/intake workflows.',
            makerCheckerNote: 'No approval authority; group scope is not available to seniors.',
            decisionPath: path,
          };
        }
        default: {
          path.push('Level: prepares & responds to review');
          const role = getRoleByCode('STAFF');
          return {
            role,
            recommendedScopes: ['ENGAGEMENT', 'CLIENT', 'FIRM_WIDE'],
            rationale:
              'Prepares working papers, imports and maps source data, and responds to review points on their own work.',
            makerCheckerNote: 'Preparer only \u2014 work is reviewed by someone else.',
            decisionPath: path,
          };
        }
      }
    }
  }
}

export function validateRoleRequestRow(row: RoleRequestRow): RowValidationResult {
  const errors: string[] = [];
  const policyWarnings: string[] = [];

  const fullName = (row.fullName ?? '').trim();
  if (!fullName) {
    errors.push('Full name is required.');
  } else if (fullName.length > 120) {
    errors.push('Full name must be 120 characters or fewer.');
  }

  const emailCheck = validateWorkEmail(row.workEmail);
  if (!emailCheck.valid && emailCheck.error) {
    errors.push(emailCheck.error);
  }
  policyWarnings.push(...emailCheck.policyWarnings);

  let roleDef: RoleDefinition;
  try {
    roleDef = getRoleByCode(row.roleRequested);
  } catch {
    return {
      isValid: false,
      errors: ['Choose a role from the catalogue.'],
      policyWarnings,
    };
  }

  if (row.accountType !== roleDef.accountType) {
    errors.push(
      `${roleDef.displayLabel} requires a ${roleDef.accountType.toLowerCase()} identity, not a ${row.accountType.toLowerCase()} identity.`
    );
  }

  if (!roleDef.allowedScopes.includes(row.scopeType)) {
    errors.push(
      `${roleDef.displayLabel} does not allow ${describeScope(row.scopeType)} coverage. Allowed: ${roleDef.allowedScopes
        .map(describeScope)
        .join(', ')}.`
    );
  }

  const targetRequired = SCOPES.find((s) => s.code === row.scopeType)?.targetRequired ?? row.scopeType !== 'FIRM_WIDE';
  if (targetRequired && !row.scopeTarget.trim()) {
    errors.push(`Name the ${describeScope(row.scopeType).toLowerCase()} this role applies to.`);
  }
  if (row.scopeType === 'FIRM_WIDE' && row.scopeTarget.trim()) {
    errors.push('Whole-firm coverage has no target.');
  }

  const expiry = (row.expiry ?? '').trim();
  if (expiry && !DATE_PATTERN.test(expiry)) {
    errors.push('Expiry must be a date (YYYY-MM-DD).');
  } else if (expiry && DATE_PATTERN.test(expiry)) {
    if (row.scopeType === 'GROUP') {
      errors.push('Group coverage never expires \u2014 it is removed by revocation, so clear the expiry.');
    }
    if (Number.isNaN(Date.parse(`${expiry}T00:00:00Z`)) || new Date(`${expiry}T00:00:00Z`).toISOString().slice(0, 10) !== expiry) {
      errors.push('Expiry must be a real calendar date.');
    } else if (expiry <= utcTodayIso()) {
      errors.push('Expiry must be after today; access can\u2019t be timed to activate later.');
    }
  }

  const notes = (row.notes ?? '').trim();
  if (notes.length > 500) {
    errors.push('Notes must be 500 characters or fewer.');
  }

  if (
    (row.roleRequested === 'STAFF' || row.roleRequested === 'CLIENT_USER') &&
    !expiry &&
    row.scopeType !== 'GROUP'
  ) {
    policyWarnings.push(
      'Recommended: set an expiry for hands-on delivery access so it ends on schedule instead of living on forever.'
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    policyWarnings,
  };
}

function describeScope(scope: ScopeCode): string {
  const def = SCOPES.find((s) => s.code === scope);
  return def ? def.label : scope;
}

function escapeCsvCell(val: string): string {
  // Prevent user-entered values becoming spreadsheet formulas.
  const str = /^[\s]*[=+@\-\t\r]/.test(val ?? '') ? `'${val}` : (val ?? '');
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const CSV_HEADERS = [
  'Full name',
  'Work email (Microsoft sign-in identity)',
  'Staff or client',
  'Role requested',
  'Application role',
  'Coverage type',
  'Coverage target',
  'Expiry (if temporary)',
  'Notes',
];

export function formatScopeColumn(row: RoleRequestRow): string {
  const def = SCOPES.find((s) => s.code === row.scopeType);
  const label = def ? def.label : row.scopeType;
  if (row.scopeType === 'FIRM_WIDE') return 'Whole firm';
  const target = row.scopeTarget.trim();
  return target ? `${label}: ${target}` : label;
}

export function exportRequestsToCsv(
  rows: RoleRequestRow[],
  details?: Partial<RequestDetails>,
  requestRef?: string
): string {
  const preamble: string[][] = [];
  if (details) {
    preamble.push(['Request reference', requestRef ?? '']);
    preamble.push(['Firm / client', (details.firmName ?? '').trim()]);
    preamble.push(['Submitted by', (details.submittedBy ?? '').trim()]);
    preamble.push(['Contact email', (details.contactEmail ?? '').trim()]);
    preamble.push([]);
  }
  const lines = preamble.map((cells) => cells.map(escapeCsvCell).join(','));
  lines.push(CSV_HEADERS.map(escapeCsvCell).join(','));
  for (const row of rows) {
    const values = [
      row.fullName.trim(),
      row.workEmail.trim(),
      row.accountType,
      getRoleByCode(row.roleRequested).displayLabel,
      getRoleByCode(row.roleRequested).serverRole,
      row.scopeType,
      row.scopeTarget.trim(),
      row.expiry.trim(),
      row.notes.trim(),
    ];
    lines.push(values.map(escapeCsvCell).join(','));
  }
  return lines.join('\n') + '\n';
}

export function exportRequestsToMarkdownTable(
  rows: RoleRequestRow[],
  details?: Partial<RequestDetails>,
  requestRef?: string
): string {
  const out: string[] = [];
  if (details) {
    out.push('**Request reference:** ' + (requestRef ?? ''));
    out.push('');
    out.push('**Firm / client:** ' + (details.firmName ?? '').trim());
    out.push('');
    out.push('**Submitted by:** ' + (details.submittedBy ?? '').trim() + ' (' + (details.contactEmail ?? '').trim() + ')');
    out.push('');
  }
  const header = `| ${CSV_HEADERS.join(' | ')} |`;
  const divider = `| ${CSV_HEADERS.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => {
    const cells = [
      row.fullName.trim(),
      `\`${row.workEmail.trim()}\``,
      row.accountType,
      getRoleByCode(row.roleRequested).displayLabel,
      getRoleByCode(row.roleRequested).serverRole,
      row.scopeType,
      row.scopeTarget.trim() || '—',
      row.expiry.trim() || '—',
      row.notes.trim() || '—',
    ];
    return `| ${cells.join(' | ')} |`;
  });
  out.push(header, divider, ...body);
  return out.join('\n');
}
