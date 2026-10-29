import {
  ROLES,
  RoleCode,
  RoleDefinition,
  RoleRequestRow,
  ScopeCode,
} from '../data/rolesData.ts';

export interface DecisionTreeAnswers {
  isExternalClient: boolean;
  // Client branch (when isExternalClient === true)
  clientSignsAcceptanceOrTb?: boolean;
  clientUploadsPbcDocuments?: boolean;
  // Staff branch (when isExternalClient === false)
  staffPerformsAuditOrAccounting?: boolean;
  // Non-audit staff branch
  staffManagesUsersOrBilling?: 'USERS_ACCESS' | 'BILLING_RETAINERS';
  // Audit staff branch
  staffSignsOpinionOrQualityReview?: 'ENGAGEMENT_PARTNER' | 'QUALITY_REVIEWER' | 'NO';
  staffManagesFieldworkOrReviews?: 'AUDIT_MANAGER' | 'SENIOR_AUDITOR' | 'STAFF_AUDITOR';
}

export interface RoleRecommendation {
  role: RoleDefinition;
  recommendedScopes: ScopeCode[];
  rationale: string;
  makerCheckerNote: string;
  decisionPath: string[];
}

export interface DualKeyGateState {
  clientAcceptanceKey: boolean;
  partnerClearanceKey: boolean;
  retainerPaidClearance: boolean;
}

export interface DualKeyGateResult {
  isActivated: boolean;
  statusLabel: 'Engagement Activated (Planning Unlocked)' | 'Engagement Locked (Read-Only Onboarding)';
  completedCount: number;
  missingGates: string[];
  serverMessage: string;
}

export interface SeparationOfDutiesScenario {
  actionType:
    | 'WORKPAPER_REVIEW'
    | 'EQCR_CONCURRENCE'
    | 'PARTNER_SIGN_OFF'
    | 'RETAINER_CLEARANCE';
  actorRole: RoleCode;
  actorEmail: string;
  preparedByEmail?: string;
  engagementPartnerEmail?: string;
}

export interface SeparationOfDutiesEvaluation {
  allowed: boolean;
  ruleCode: 'M2-02_NO_SELF_REVIEW' | 'M2-02_EQCR_INDEPENDENCE' | 'ADR_0003_ADMIN_BOUNDARY' | 'M1-03_ROLE_AUTHORITY';
  verdictTitle: string;
  serverReason: string;
}

export interface RowValidationResult {
  isValid: boolean;
  errors: string[];
  policyWarnings: string[];
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
 * Validates work email syntax and enforces AuditSphere corporate Entra ID rules:
 * - Rejects personal domains (@gmail.com, @yahoo.com, etc.) per FAQ Q2 & Section 9
 * - Rejects shared mailboxes (accounts@, audit-team@, etc.) per FAQ Q1
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
      error: 'Work email must include a valid corporate domain (e.g., name@example.com).',
      policyWarnings,
    };
  }

  if (PERSONAL_EMAIL_DOMAINS.has(domainPart)) {
    return {
      valid: false,
      error: `Personal email domain "@${domainPart}" is rejected. Provide the corporate Microsoft Entra ID work email (FAQ Q2).`,
      policyWarnings,
    };
  }

  if (SHARED_MAILBOX_PREFIXES.has(localPart)) {
    return {
      valid: false,
      error: `Shared mailbox "${localPart}@${domainPart}" is rejected. AuditSphere requires an individual named account for No Self-Review traceability (FAQ Q1).`,
      policyWarnings,
    };
  }

  return { valid: true, policyWarnings };
}

/**
 * Implements the exact Decision Tree from Section 8 (Diagram E) of the specification.
 */
export function recommendRole(answers: DecisionTreeAnswers): RoleRecommendation {
  const path: string[] = [];

  if (answers.isExternalClient) {
    path.push('Organization: Client Organization (Client Portal)');
    if (answers.clientSignsAcceptanceOrTb) {
      path.push('Signs engagement acceptance (Key 1) & approves TB/adjustments: Yes');
      const role = getRoleByCode('CLIENT_PRIMARY');
      return {
        role,
        recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'GROUP'],
        rationale:
          'Executes the Client Acceptance Key (Key 1), formally submits Trial Balances and PBC packages, and approves management adjustments.',
        makerCheckerNote:
          'Client Acceptance Key (Key 1) must be paired with the Engagement Partner Clearance Key (Key 2) and Paid Retainer clearance before the engagement unlocks (M1-03).',
        decisionPath: path,
      };
    }

    path.push('Signs engagement acceptance (Key 1) & approves TB/adjustments: No');
    if (answers.clientUploadsPbcDocuments !== false) {
      path.push('Uploads documents for PBC requests: Yes');
      const role = getRoleByCode('CLIENT_CONTRIBUTOR');
      return {
        role,
        recommendedScopes: ['ENGAGEMENT', 'CLIENT'],
        rationale:
          'Uploads invoices, bank statements, and schedules against assigned PBC items in the Client Portal without signing authority.',
        makerCheckerNote:
          'Submissions are overseen by CLIENT_PRIMARY and verified by SENIOR_AUDITOR / AUDIT_MANAGER.',
        decisionPath: path,
      };
    }

    path.push('Uploads documents for PBC requests: No (Read-only observer)');
    const role = getRoleByCode('CLIENT_VIEWER');
    return {
      role,
      recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'GROUP'],
      rationale:
        'Provides read-only visibility into audit milestone progress and final published reports for executives or Audit Committee members.',
      makerCheckerNote:
        'Strictly read-only; cannot upload files, post comments, or execute acceptance keys.',
      decisionPath: path,
    };
  }

  // Audit Firm Staff branch
  path.push('Organization: Audit Firm Staff (Staff Portal)');
  if (answers.staffPerformsAuditOrAccounting === false) {
    path.push('Performs or reviews audit/accounting work: No');
    if (answers.staffManagesUsersOrBilling === 'BILLING_RETAINERS') {
      path.push('Function: Billing, Retainer Invoices & Paid Advance Clearance');
      const role = getRoleByCode('FIRM_FINANCE');
      return {
        role,
        recommendedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT'],
        rationale:
          'Manages fee schedules, retainer invoicing, and records the Retainer Paid Clearance (Key 3) required to unlock engagements.',
        makerCheckerNote:
          'Cannot view confidential audit working papers or execute Partner Clearance Keys.',
        decisionPath: path,
      };
    }

    path.push('Function: User Access, Roster Bindings & Entra ID Settings');
    const role = getRoleByCode('ADMINISTRATOR');
    return {
      role,
      recommendedScopes: ['FIRM_WIDE'],
      rationale:
        'Manages Users & Access (/admin/access), binds roster identities, assigns RoleGrants, and generates external invitation links.',
      makerCheckerNote:
        'ADR-0003: Administrator access never confers Partner authority or access to audit working papers.',
      decisionPath: path,
    };
  }

  path.push('Performs or reviews audit/accounting work: Yes');
  if (answers.staffSignsOpinionOrQualityReview === 'ENGAGEMENT_PARTNER') {
    path.push('Authority: Signs Final Audit Opinion & Partner Acceptance Key (Key 2)');
    const role = getRoleByCode('ENGAGEMENT_PARTNER');
    return {
      role,
      recommendedScopes: ['CLIENT', 'ENGAGEMENT', 'GROUP', 'FIRM_WIDE'],
      rationale:
        'Ultimate signing authority for the audit engagement: executes Partner Clearance Key (Key 2), locks materiality, signs the audit opinion, and locks the archive.',
      makerCheckerNote:
        'M2-02: Cannot serve as QUALITY_REVIEWER (EQCR) on the same engagement or self-review own working papers.',
      decisionPath: path,
    };
  }

  if (answers.staffSignsOpinionOrQualityReview === 'QUALITY_REVIEWER') {
    path.push('Authority: Independent Quality Reviewer (EQCR Concurrence)');
    const role = getRoleByCode('QUALITY_REVIEWER');
    return {
      role,
      recommendedScopes: ['ENGAGEMENT', 'CLIENT', 'GROUP', 'FIRM_WIDE'],
      rationale:
        'Performs objective evaluation of significant audit judgments and issues mandatory EQCR Concurrence (M2-02) prior to report issuance.',
      makerCheckerNote:
        'Strict independence (M2-02): Cannot edit workpapers or hold ENGAGEMENT_PARTNER / AUDIT_MANAGER / SENIOR_AUDITOR / STAFF_AUDITOR on the same engagement.',
      decisionPath: path,
    };
  }

  path.push('Authority: Fieldwork & Managerial Execution');
  if (answers.staffManagesFieldworkOrReviews === 'AUDIT_MANAGER') {
    path.push('Role Level: Manages budgets, workflows & performs primary Manager Review');
    const role = getRoleByCode('AUDIT_MANAGER');
    return {
      role,
      recommendedScopes: ['ENGAGEMENT', 'CLIENT', 'GROUP', 'FIRM_WIDE'],
      rationale:
        'Configures engagement workplans and budgets, manages PBC requests, and performs primary Managerial Review of all fieldwork.',
      makerCheckerNote:
        'Cannot self-review working papers they prepared or execute Partner-only sign-offs.',
      decisionPath: path,
    };
  }

  if (answers.staffManagesFieldworkOrReviews === 'SENIOR_AUDITOR') {
    path.push('Role Level: Leads fieldwork, imports TB/GL & performs 1st-level review');
    const role = getRoleByCode('SENIOR_AUDITOR');
    return {
      role,
      recommendedScopes: ['ENGAGEMENT', 'CLIENT', 'GROUP'],
      rationale:
        'Imports client TB/GL, prepares complex audit sections, verifies client PBC uploads, and performs first-level review of Staff Auditor work.',
      makerCheckerNote:
        'Cannot review their own prepared working papers or hold FIRM_WIDE scope.',
      decisionPath: path,
    };
  }

  path.push('Role Level: Prepares assigned working papers & schedules');
  const role = getRoleByCode('STAFF_AUDITOR');
  return {
    role,
    recommendedScopes: ['ENGAGEMENT', 'CLIENT'],
    rationale:
      'Executes assigned audit procedures, uploads supporting schedules, and submits working papers for Senior or Manager review.',
    makerCheckerNote:
      'Preparer role only (zero review authority); cannot hold FIRM_WIDE or GROUP scope.',
    decisionPath: path,
  };
}

/**
 * Evaluates the M1-03 Dual-Key Engagement Acceptance + Paid Retainer Activation Gate.
 */
export function evaluateDualKeyGate(state: DualKeyGateState): DualKeyGateResult {
  const missingGates: string[] = [];
  if (!state.clientAcceptanceKey) {
    missingGates.push('Key 1: Client Acceptance Key (CLIENT_PRIMARY)');
  }
  if (!state.partnerClearanceKey) {
    missingGates.push('Key 2: Partner Clearance Key (ENGAGEMENT_PARTNER)');
  }
  if (!state.retainerPaidClearance) {
    missingGates.push('Key 3: Retainer Paid Clearance (FIRM_FINANCE)');
  }

  const completedCount = 3 - missingGates.length;
  const isActivated = missingGates.length === 0;

  return {
    isActivated,
    statusLabel: isActivated
      ? 'Engagement Activated (Planning Unlocked)'
      : 'Engagement Locked (Read-Only Onboarding)',
    completedCount,
    missingGates,
    serverMessage: isActivated
      ? 'All three M1-03 gates verified. Engagement transitioned to Phase 2 (Planning) and fieldwork workspaces are unlocked.'
      : `Engagement remains locked in read-only onboarding state. Pending: ${missingGates.join(' + ')}.`,
  };
}

/**
 * Evaluates server-side Separation of Duties rules (M2-02, ADR-0003, M1-03).
 */
export function evaluateSeparationOfDuties(
  scenario: SeparationOfDutiesScenario
): SeparationOfDutiesEvaluation {
  const actorEmail = scenario.actorEmail.trim().toLowerCase();
  const prepEmail = (scenario.preparedByEmail ?? '').trim().toLowerCase();
  const partnerEmail = (scenario.engagementPartnerEmail ?? '').trim().toLowerCase();

  if (scenario.actorRole === 'ADMINISTRATOR') {
    return {
      allowed: false,
      ruleCode: 'ADR_0003_ADMIN_BOUNDARY',
      verdictTitle: 'Blocked by ADR-0003 (Admin != Partner/Audit Authority)',
      serverReason:
        '"Administrator access does not confer Partner authority." Firm Administrators manage identity bindings and role grants but are blocked from reviewing working papers, clearing keys, or signing opinions.',
    };
  }

  if (scenario.actionType === 'WORKPAPER_REVIEW') {
    if (
      scenario.actorRole !== 'SENIOR_AUDITOR' &&
      scenario.actorRole !== 'AUDIT_MANAGER' &&
      scenario.actorRole !== 'ENGAGEMENT_PARTNER'
    ) {
      return {
        allowed: false,
        ruleCode: 'M1-03_ROLE_AUTHORITY',
        verdictTitle: `Blocked: ${scenario.actorRole} Cannot Sign Off Workpapers`,
        serverReason:
          'Only SENIOR_AUDITOR, AUDIT_MANAGER, or ENGAGEMENT_PARTNER can perform workpaper review sign-offs.',
      };
    }

    if (actorEmail && prepEmail && actorEmail === prepEmail) {
      return {
        allowed: false,
        ruleCode: 'M2-02_NO_SELF_REVIEW',
        verdictTitle: 'Blocked by No Self-Review Rule (PreparedByUserId == ReviewerUserId)',
        serverReason: `User "${actorEmail}" prepared this working paper. The server rejects any review command where ReviewerUserId matches PreparedByUserId.`,
      };
    }

    return {
      allowed: true,
      ruleCode: 'M2-02_NO_SELF_REVIEW',
      verdictTitle: 'Allowed: Independent Reviewer Verified',
      serverReason: `Reviewer "${actorEmail}" (${scenario.actorRole}) is distinct from preparer "${prepEmail || 'staff@example.com'}". Server records review sign-off.`,
    };
  }

  if (scenario.actionType === 'EQCR_CONCURRENCE') {
    if (scenario.actorRole !== 'QUALITY_REVIEWER') {
      return {
        allowed: false,
        ruleCode: 'M2-02_EQCR_INDEPENDENCE',
        verdictTitle: 'Blocked: Requires QUALITY_REVIEWER Role',
        serverReason:
          'Only an assigned QUALITY_REVIEWER can issue Engagement Quality Control Review (EQCR) concurrence.',
      };
    }

    if (actorEmail && partnerEmail && actorEmail === partnerEmail) {
      return {
        allowed: false,
        ruleCode: 'M2-02_EQCR_INDEPENDENCE',
        verdictTitle: 'Blocked by M2-02 (Engagement Partner Cannot Be EQCR)',
        serverReason: `User "${actorEmail}" is the assigned ENGAGEMENT_PARTNER on this engagement and is strictly barred from issuing EQCR concurrence on their own engagement.`,
      };
    }

    return {
      allowed: true,
      ruleCode: 'M2-02_EQCR_INDEPENDENCE',
      verdictTitle: 'Allowed: Independent EQCR Concurrence Verified',
      serverReason: `QUALITY_REVIEWER "${actorEmail}" is independent of Engagement Partner "${partnerEmail || 's.jenkins@example.com'}". Concurrence recorded.`,
    };
  }

  if (scenario.actionType === 'PARTNER_SIGN_OFF') {
    if (scenario.actorRole !== 'ENGAGEMENT_PARTNER') {
      return {
        allowed: false,
        ruleCode: 'M1-03_ROLE_AUTHORITY',
        verdictTitle: 'Blocked: Partner-Only Authority Required',
        serverReason: `Role "${scenario.actorRole}" cannot execute Partner Clearance Key (Key 2), lock materiality, or sign the final audit opinion.`,
      };
    }
    return {
      allowed: true,
      ruleCode: 'M1-03_ROLE_AUTHORITY',
      verdictTitle: 'Allowed: ENGAGEMENT_PARTNER Authority Verified',
      serverReason: `ENGAGEMENT_PARTNER "${actorEmail}" is authorized to execute Partner sign-off and lock the engagement archive.`,
    };
  }

  // RETAINER_CLEARANCE
  if (scenario.actorRole !== 'FIRM_FINANCE') {
    return {
      allowed: false,
      ruleCode: 'M1-03_ROLE_AUTHORITY',
      verdictTitle: 'Blocked: Requires FIRM_FINANCE Role',
      serverReason: `Role "${scenario.actorRole}" cannot record Retainer Paid Clearance. Only FIRM_FINANCE can verify and clear client retainer payments.`,
    };
  }

  return {
    allowed: true,
    ruleCode: 'M1-03_ROLE_AUTHORITY',
    verdictTitle: 'Allowed: FIRM_FINANCE Retainer Clearance Verified',
    serverReason: `FIRM_FINANCE "${actorEmail}" recorded Paid Advance clearance (Key 3).`,
  };
}

export function validateRoleRequestRow(row: RoleRequestRow): RowValidationResult {
  const errors: string[] = [];
  const policyWarnings: string[] = [];

  if (!row.fullName.trim()) {
    errors.push('Full name is required.');
  }

  const emailCheck = validateWorkEmail(row.workEmail);
  if (!emailCheck.valid && emailCheck.error) {
    errors.push(emailCheck.error);
  }
  policyWarnings.push(...emailCheck.policyWarnings);

  const roleDef = getRoleByCode(row.roleRequested);

  if (row.accountType !== roleDef.accountType) {
    errors.push(
      `Role "${row.roleRequested}" (${roleDef.displayLabel}) requires Account Type "${roleDef.accountType}", not "${row.accountType}".`
    );
  }

  if (!roleDef.allowedScopes.includes(row.scopeType)) {
    errors.push(
      `Role "${row.roleRequested}" does not allow scope "${row.scopeType}". Allowed scopes: ${roleDef.allowedScopes.join(', ')}.`
    );
  }

  if (row.scopeType !== 'FIRM_WIDE' && !row.scopeTarget.trim()) {
    errors.push(
      `Specify the target ${row.scopeType.toLowerCase()} name (e.g., "Client: Acme Corp" or "Engagement: FY2026 Audit - Acme Corp").`
    );
  }

  if (!row.startDate.trim()) {
    errors.push('Start date (YYYY-MM-DD) is required.');
  }

  if (!row.approvedBy.trim()) {
    errors.push('Approved by (Partner or Client Lead name) is required.');
  }

  if (
    (row.roleRequested === 'STAFF_AUDITOR' ||
      row.roleRequested === 'CLIENT_CONTRIBUTOR') &&
    !row.expiry.trim()
  ) {
    policyWarnings.push(
      `Recommended: Set an Expiry Date for ${row.roleRequested} so temporary fieldwork or PBC upload access revokes automatically at midnight UTC.`
    );
  }

  return {
    isValid: errors.length === 0,
    errors,
    policyWarnings,
  };
}

export function detectSeparationOfDutiesWarnings(rows: RoleRequestRow[]): string[] {
  const warnings: string[] = [];
  const byEmail = new Map<string, RoleRequestRow[]>();

  for (const row of rows) {
    const email = row.workEmail.trim().toLowerCase();
    if (!email) continue;
    const list = byEmail.get(email) ?? [];
    list.push(row);
    byEmail.set(email, list);
  }

  for (const [email, userRows] of byEmail.entries()) {
    const roles = new Set(userRows.map((r) => r.roleRequested));

    if (roles.has('ENGAGEMENT_PARTNER') && roles.has('QUALITY_REVIEWER')) {
      warnings.push(
        `M2-02 Independence Conflict (${email}): The same person cannot hold both ENGAGEMENT_PARTNER and QUALITY_REVIEWER (EQCR) on the same engagement.`
      );
    }

    if (
      roles.has('QUALITY_REVIEWER') &&
      (roles.has('AUDIT_MANAGER') ||
        roles.has('SENIOR_AUDITOR') ||
        roles.has('STAFF_AUDITOR'))
    ) {
      warnings.push(
        `M2-02 Independence Conflict (${email}): QUALITY_REVIEWER must be independent of the engagement delivery team (cannot also hold AUDIT_MANAGER, SENIOR_AUDITOR, or STAFF_AUDITOR on the same engagement).`
      );
    }

    if (roles.has('ADMINISTRATOR') && roles.size > 1) {
      warnings.push(
        `ADR-0003 Governance Note (${email}): ADMINISTRATOR is requested alongside an operational role (${[...roles].filter((r) => r !== 'ADMINISTRATOR').join(', ')}). Confirm that dual assignment is explicitly approved by the Managing Partner.`
      );
    }
  }

  return warnings;
}

function escapeCsvCell(val: string): string {
  const str = val ?? '';
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export const CSV_HEADERS = [
  'Full name',
  'Work email (the exact account used for Microsoft sign-in)',
  'Staff or Client',
  'Role requested',
  'Scope (Firm-wide / which Client / which Engagement / which Group)',
  'Start date',
  'Expiry (if temporary)',
  'Approved by',
  'Notes',
];

export function formatScopeColumn(row: RoleRequestRow): string {
  if (row.scopeType === 'FIRM_WIDE') {
    return 'Firm-Wide';
  }
  return row.scopeTarget.trim() || row.scopeType;
}

export function exportRequestsToCsv(rows: RoleRequestRow[]): string {
  const lines = [CSV_HEADERS.map(escapeCsvCell).join(',')];
  for (const row of rows) {
    const values = [
      row.fullName.trim(),
      row.workEmail.trim(),
      row.accountType,
      row.roleRequested,
      formatScopeColumn(row),
      row.startDate.trim(),
      row.expiry.trim(),
      row.approvedBy.trim(),
      row.notes.trim(),
    ];
    lines.push(values.map(escapeCsvCell).join(','));
  }
  return lines.join('\n') + '\n';
}

export function exportRequestsToMarkdownTable(rows: RoleRequestRow[]): string {
  const header = `| ${CSV_HEADERS.join(' | ')} |`;
  const divider = `| ${CSV_HEADERS.map(() => '---').join(' | ')} |`;
  const body = rows.map((row) => {
    const cells = [
      row.fullName.trim(),
      `\`${row.workEmail.trim()}\``,
      row.accountType,
      `\`${row.roleRequested}\``,
      formatScopeColumn(row),
      row.startDate.trim() || '—',
      row.expiry.trim() || '—',
      row.approvedBy.trim() || '—',
      row.notes.trim() || '—',
    ];
    return `| ${cells.join(' | ')} |`;
  });
  return [header, divider, ...body].join('\n');
}
