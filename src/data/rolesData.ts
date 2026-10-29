// AuditSphere role & scope catalogue.
// Every rule below was verified against the AuditSphere source at
// commit 1abc670151c4b9c76f448f8137e3f50c852fdc60 (branch `master`).
// Customer summaries describe principal responsibilities, not exhaustive permissions.

export type RoleCode =
  | 'ADMINISTRATOR'
  | 'PARTNER'
  | 'MANAGER'
  | 'SENIOR'
  | 'STAFF'
  | 'RELATIONSHIP_MANAGER'
  | 'FINANCE_MANAGER'
  | 'FINANCE_REVIEWER'
  | 'ACCOUNTING_PREPARER'
  | 'ACCOUNTING_REVIEWER'
  | 'CLIENT_USER';

export type AccountType = 'Staff' | 'Client';

/** Scope kinds accepted by the role-assignment service. */
export type ScopeCode = 'FIRM_WIDE' | 'CLIENT' | 'ENGAGEMENT' | 'GROUP';

export type CapabilityLevel =
  | 'Full'
  | 'Edit'
  | 'Prepare'
  | 'Review'
  | 'Approve'
  | 'View'
  | 'None';

/** Exact role name stored by the AuditSphere server (see AllowedRoles). */
export type ServerRole =
  | 'Administrator'
  | 'Partner'
  | 'Manager'
  | 'Senior'
  | 'Staff'
  | 'RelationshipManager'
  | 'FinanceManager'
  | 'FinanceReviewer'
  | 'AccountingPreparer'
  | 'AccountingReviewer'
  | 'ClientUser';

export interface RoleDefinition {
  order: number;
  code: RoleCode;
  displayLabel: string;
  serverRole: ServerRole;
  accountType: AccountType;
  allowedScopes: ScopeCode[];
  /** The 7 staff roles the server accepts at GROUP (consolidation) scope. */
  groupAccess: boolean;
  summary: string;
  /** Verbatim capabilities from the server catalogue (RoleCapabilities). */
  responsibilities: string[];
  approvals: string;
  restriction: string;
  sourceCitation: string;
}

export interface ScopeDefinition {
  code: ScopeCode;
  label: string;
  /** Short scope token shown in grant rows, e.g. "Partner @ FIRM_WIDE". */
  hierarchyOrder: number;
  accentHex: string;
  meaning: string;
  targetHint: string;
  targetRequired: boolean;
  covers: string;
  doesNotCover: string;
}

export interface LifecyclePhaseRow {
  phaseNumber: number;
  phase: string;
  shortTitle: string;
  evidenceTrigger: string;
  keyActions: string[];
}

export interface CapabilityCell {
  level: CapabilityLevel;
  note: string;
}

export interface CapabilityMatrixRow {
  moduleName: string;
  moduleSubtitle: string;
  cells: Record<RoleCode, CapabilityCell>;
}

/** One person + one role + one coverage choice. Submitted rows may be deduped server-side. */
export interface RoleRequestRow {
  id: string;
  fullName: string;
  workEmail: string;
  accountType: AccountType;
  roleRequested: RoleCode;
  scopeType: ScopeCode;
  scopeTarget: string;
  /** ISO date (YYYY-MM-DD) or '' for open-ended access. Group scope never expires. */
  expiry: string;
  notes: string;
}

/** Request-level context, captured once per submission (not per row). */
export interface RequestDetails {
  firmName: string;
  submittedBy: string;
  contactEmail: string;
}

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: 'Identity & Sign-In' | 'Roles & Scopes' | 'Separation of Duties' | 'Access Lifecycle';
}

export interface GlossaryItem {
  term: string;
  codeOrAcronym: string;
  definition: string;
}

export type VerificationCategory =
  | 'Roles & Scopes'
  | 'Maker-Checker'
  | 'Client Portal'
  | 'Sign-In & Identity';

export interface EvidenceRow {
  claimId: string;
  capabilityOrRule: string;
  filePath: string;
  symbolOrType: string;
  verificationCategory: VerificationCategory;
}

export interface RepoCrosswalkRow {
  roleCode: RoleCode;
  displayLabel: string;
  serverRole: ServerRole;
  staffingOrScopeNote: string;
}

export interface AdminWalkthroughStep {
  stepNumber: number;
  title: string;
  route: string;
  summary: string;
  checklist: string[];
  guardrailNote: string;
}

/** AuditSphere repo this page was verified against. */
export const SOURCE_REPO = 'github.com/nirzaf/AuditSphere';

/** Commit hash every evidence row was verified against. */
export const SOURCE_COMMIT = '1abc670151c4b9c76f448f8137e3f50c852fdc60';

/**
 * The 7 staff roles the server accepts at GROUP (consolidation-group) scope.
 * Exact server list (RoleAssignmentService.GroupRoles): Partner, Manager, Staff,
 * FinanceManager, FinanceReviewer, AccountingPreparer, AccountingReviewer.
 * Notably Senior, Administrator, RelationshipManager and ClientUser are excluded.
 */
export const GROUP_ELIGIBLE_ROLES: RoleCode[] = [
  'PARTNER',
  'MANAGER',
  'STAFF',
  'FINANCE_MANAGER',
  'FINANCE_REVIEWER',
  'ACCOUNTING_PREPARER',
  'ACCOUNTING_REVIEWER',
];

/**
 * Separation-of-duties pairs the server flags when one identity holds both
 * roles. Wording matches the server's preview warnings.
 */
export const SOD_PAIRS: { a: RoleCode; b: RoleCode; note: string }[] = [
  {
    a: 'FINANCE_MANAGER',
    b: 'FINANCE_REVIEWER',
    note:
      'Segregation of duties: this user would both prepare and review firm finance postings.',
  },
  {
    a: 'ACCOUNTING_PREPARER',
    b: 'ACCOUNTING_REVIEWER',
    note:
      'Segregation of duties: holding both accounting roles never permits review of this user\u2019s own preparation or Partner-only approval.',
  },
];

export const CUSTOMER_ROLES: RoleDefinition[] = [
  {
    order: 1,
    code: 'ADMINISTRATOR',
    displayLabel: 'Firm Administrator',
    serverRole: 'Administrator',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT'],
    groupAccess: false,
    summary:
      'Manages users, access and configuration, and can access additional workspaces permitted by the system.',
    responsibilities: [
      'Administer firm users, roles and scope',
      'Configure Microsoft 365 connection',
      'View firm administration and audit history',
    ],
    approvals:
      'Reviews access requests and assigns verified access. This does not replace required Partner or finance authority, or independent approval.',
    restriction:
      'Access to working papers and permitted accounting workflows depends on coverage and workflow checks. Administrator access does not replace Partner-only approval or independent review.',
    sourceCitation: 'AllowedRoles, RoleAdministrationService.cs',
  },
  {
    order: 2,
    code: 'PARTNER',
    displayLabel: 'Partner',
    serverRole: 'Partner',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'The engagement owner: signs off engagement work, approves the release of financial packages, and closes out review points on the clients they lead.',
    responsibilities: [
      'Sign off engagement work',
      'Approve financial packages and releases',
      'Review and close review points',
    ],
    approvals:
      'Owns the Partner-approval stage of financial packages — but only while currently assigned as that engagement\u2019s partner; the assignment itself is checked.',
    restriction:
      'Partner approvals do not extend across the firm automatically: approval rights travel with the engagement-partner staffing assignment, and consolidated group work still needs an explicit group grant.',
    sourceCitation: 'RoleCapabilities[Partner] + PartnerApproval checks',
  },
  {
    order: 3,
    code: 'MANAGER',
    displayLabel: 'Audit Manager',
    serverRole: 'Manager',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'Runs day-to-day engagement delivery: reviews the team\u2019s work, manages planning and fieldwork, and prepares financial packages for approval.',
    responsibilities: [
      'Review engagement work',
      'Manage planning and fieldwork',
      'Prepare financial packages',
    ],
    approvals:
      'Can record the accounting-review stage of client accounting packages (alongside the Accounting Reviewer, a Partner or an Administrator).',
    restriction:
      'Managers who prepared a package must leave its independent review to someone else, and Partner-only approval stages remain out of reach.',
    sourceCitation: 'RoleCapabilities[Manager] + FinancialPackageReviewService.cs',
  },
  {
    order: 4,
    code: 'SENIOR',
    displayLabel: 'Senior Auditor',
    serverRole: 'Senior',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT'],
    groupAccess: false,
    summary:
      'The field lead between manager and staff: coordinates assigned audit work, prepares working papers and operational tasks, and uses the planning and intake workflows the firm explicitly permits.',
    responsibilities: [
      'Coordinate assigned audit work',
      'Prepare working papers and operational tasks',
      'Use explicitly permitted planning and intake workflows',
    ],
    approvals: 'None — seniors coordinate and prepare; sign-off and approvals stay with managers and partners.',
    restriction:
      'Consolidation-group coverage is not supported for this role. Restricted reviews require the relevant workflow authority.',
    sourceCitation: 'RoleCapabilities[Senior] + GroupRoles exclusion',
  },
  {
    order: 5,
    code: 'STAFF',
    displayLabel: 'Audit Staff',
    serverRole: 'Staff',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'The delivery team\u2019s hands-on base: prepares working papers, imports and maps source data, and answers review points raised on their work.',
    responsibilities: [
      'Prepare working papers',
      'Import and map source data',
      'Respond to review points',
    ],
    approvals: 'None — preparers respond to review but never record reviews or approvals themselves.',
    restriction:
      'Preparation must be reviewed by a different person: staff work cannot be self-reviewed regardless of other roles held.',
    sourceCitation: 'RoleCapabilities[Staff]',
  },
  {
    order: 6,
    code: 'RELATIONSHIP_MANAGER',
    displayLabel: 'Client Relationship Manager',
    serverRole: 'RelationshipManager',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT'],
    groupAccess: false,
    summary:
      'Keeps the commercial picture accurate: manages client relationship records and keeps an eye on client acceptance status.',
    responsibilities: [
      'Manage client relationship records',
      'View client acceptance status',
    ],
    approvals: 'None — relationship record-keeping only.',
    restriction:
      'No audit, accounting or approval authority: this role never touches working papers, ledgers or package decisions.',
    sourceCitation: 'RoleCapabilities[RelationshipManager]',
  },
  {
    order: 7,
    code: 'FINANCE_MANAGER',
    displayLabel: 'Firm Finance Manager',
    serverRole: 'FinanceManager',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'Owns the firm\u2019s money side: manages firm billing and the firm ledger, and prepares invoices and accounting journal drafts.',
    responsibilities: [
      'Manage firm billing and ledger',
      'Prepare invoices',
    ],
    approvals:
      'Posts what finance prepares (invoices, credit notes, journals) and can reopen finance periods — but never approves its own work.',
    restriction:
      'Journal commands require a firm-wide finance grant, and approval of invoices and journals belongs to the Finance Reviewer — the server rejects any preparer approving their own work.',
    sourceCitation: 'RoleCapabilities[FinanceManager] + LedgerService.cs / BillingService.cs',
  },
  {
    order: 8,
    code: 'FINANCE_REVIEWER',
    displayLabel: 'Firm Finance Reviewer',
    serverRole: 'FinanceReviewer',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'Reviews firm finance transactions and performs permitted billing tasks, including some preparation. Required independent approvals remain separate.',
    responsibilities: ['Review and approve firm finance postings'],
    approvals:
      'Approves prepared invoices and journals. Invoice preparation is shared with the Finance Manager, but reversal and period close also sit here.',
    restriction:
      'Cannot approve anything they prepared themselves — the server compares the approver against the preparer identity.',
    sourceCitation: 'RoleCapabilities[FinanceReviewer] + BillingService.cs / LedgerService.cs',
  },
  {
    order: 9,
    code: 'ACCOUNTING_PREPARER',
    displayLabel: 'Client Accounting Preparer',
    serverRole: 'AccountingPreparer',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'Prepares the client\u2019s recurring accounting and consolidation work — always within the scope the firm explicitly permits.',
    responsibilities: [
      'Prepare scoped client accounting and consolidation work where explicitly permitted',
      'Partner approvals and independent review remain separate',
    ],
    approvals: 'None — preparation cannot be approved by its own preparer, even if that person also holds a reviewer role.',
    restriction:
      'Holding a reviewer role as well does not permit self-review. Required independent approval still needs another authorised person.',
    sourceCitation: 'RoleCapabilities[AccountingPreparer] + SoD preview check',
  },
  {
    order: 10,
    code: 'ACCOUNTING_REVIEWER',
    displayLabel: 'Client Accounting Reviewer',
    serverRole: 'AccountingReviewer',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT', 'GROUP'],
    groupAccess: true,
    summary:
      'Independently reviews the client\u2019s recurring accounting and consolidation work — always within the scope the firm explicitly permits.',
    responsibilities: [
      'Independently review scoped client accounting and consolidation work where explicitly permitted',
      'Self-review and Partner-only approvals remain prohibited',
    ],
    approvals:
      'Records the independent review stage of client accounting packages (the Audit Manager, a Partner or an Administrator can also record that stage).',
    restriction:
      'Cannot review packages they prepared, and the Partner-approval stage stays Partner-only.',
    sourceCitation: 'RoleCapabilities[AccountingReviewer] + FinancialPackageReviewService.cs',
  },
  {
    order: 11,
    code: 'CLIENT_USER',
    displayLabel: 'Client Portal User',
    serverRole: 'ClientUser',
    accountType: 'Client',
    allowedScopes: ['CLIENT', 'ENGAGEMENT'],
    groupAccess: false,
    summary:
      'The client-side team member: uses the client portal for their assigned client or engagement and answers the firm\u2019s document requests.',
    responsibilities: [
      'Use the client portal for assigned client/engagement',
      'Respond to PBC requests',
    ],
    approvals: 'Client-side only — portal responses and uploads, never firm-side approvals.',
    restriction:
      'Scope never widens to the whole firm: access follows the exact grant (client or engagement), starts after the person\u2019s first Microsoft sign-in, and pauses while an engagement is frozen or closed.',
    sourceCitation: 'RoleCapabilities[ClientUser] + ClientPortalService.cs',
  },
];

export const ROLES: RoleDefinition[] = CUSTOMER_ROLES;

export const SCOPES: ScopeDefinition[] = [
  {
    code: 'FIRM_WIDE',
    label: 'Whole firm',
    hierarchyOrder: 1,
    accentHex: '#005082',
    meaning:
      'Use this role across eligible work in your firm. Consolidation-group access is assigned separately.',
    targetHint: '',
    targetRequired: false,
    covers: 'All clients and all their engagements, for that role',
    doesNotCover:
      'Consolidation groups: a firm-wide grant never implies group access — group grants are always separate and explicit.',
  },
  {
    code: 'CLIENT',
    label: 'Selected client',
    hierarchyOrder: 2,
    accentHex: '#009688',
    meaning:
      'Use this role for one client and its eligible engagements.',
    targetHint: 'Client name (e.g., Acme Trading Ltd)',
    targetRequired: true,
    covers: 'That client plus every engagement run for it',
    doesNotCover: 'Other clients, subsidiaries outside the grant, or group-level views.',
  },
  {
    code: 'ENGAGEMENT',
    label: 'Selected engagement',
    hierarchyOrder: 3,
    accentHex: '#7b1fa2',
    meaning:
      'Covers exactly one engagement of one client — the most contained choice.',
    targetHint: 'Client + engagement (e.g., Acme Trading Ltd \u2014 FY2026 statutory audit)',
    targetRequired: true,
    covers: 'That single engagement only',
    doesNotCover: 'Other engagements or years of the same client.',
  },
  {
    code: 'GROUP',
    label: 'Consolidation group',
    hierarchyOrder: 4,
    accentHex: '#26a69a',
    meaning:
      'Use this role for the selected group’s consolidation work. Individual companies need separate access. Group access cannot have an expiry date in this assignment flow; ask your administrator to remove it when no longer needed.',
    targetHint: 'Group name (e.g., Apex Holdings Group)',
    targetRequired: true,
    covers: 'The named group\u2019s consolidated view, for that role',
    doesNotCover:
      'The individual books of each client company in the group \u2014 those stay behind their own client grants. Firm-wide grants never imply this.',
  },
];

export const LIFECYCLE_PHASES: LifecyclePhaseRow[] = [
  {
    phaseNumber: 1,
    phase: '1. Setup',
    shortTitle: 'Request & grant access',
    evidenceTrigger: 'Approved request \u2192 administrator applies the grant \u2192 invitation link is copied',
    keyActions: [
      'This page records who needs which role at which coverage level.',
      'A Firm Administrator reviews the request, verifies the person\u2019s Microsoft identity, and applies the grant.',
      'Access starts when the change is approved \u2014 future-dated access is not supported.',
      'The tracker generates an invitation link; the person\u2019s first authenticated sign-in binds it.',
    ],
  },
  {
    phaseNumber: 2,
    phase: '2. Planning',
    shortTitle: 'Scoping & setup',
    evidenceTrigger: 'Engagement opened and openly active',
    keyActions: [
      'Managers manage planning and fieldwork; seniors coordinate assigned audit work.',
      'Staff prepare working papers and import / map source data.',
      'Client Portal users receive document requests (PBC items) for their granted scope.',
    ],
  },
  {
    phaseNumber: 3,
    phase: '3. Fieldwork & review',
    shortTitle: 'Test, prepare, review',
    evidenceTrigger: 'Prepared work \u2192 independent reviewer records the review',
    keyActions: [
      'Audit Staff respond to review points on their own workpapers.',
      'Audit Managers review the team\u2019s work; the reviewer must differ from the preparer.',
      'Client Portal users upload requested documents for their granted client or engagement.',
    ],
  },
  {
    phaseNumber: 4,
    phase: '4. Sign-off & delivery',
    shortTitle: 'Approvals & packages',
    evidenceTrigger: 'Stage decisions recorded by distinct people',
    keyActions: [
      'Partners sign off engagement work and approve package releases — as the currently assigned engagement partner.',
      'The accounting-review stage can be recorded by the Accounting Reviewer, the Audit Manager, a Partner or an Administrator.',
      'One person cannot record approved decisions at two different stages of the same package version.',
    ],
  },
  {
    phaseNumber: 5,
    phase: '5. After the work',
    shortTitle: 'Expiry, revocation & freeze',
    evidenceTrigger: 'Expiry passes \u2192 access ends; revocation is immediate',
    keyActions: [
      'Expiry dates are honoured exactly as granted — access is never extended automatically.',
      'Revocation takes effect on the next authenticated action; group grants are revoked explicitly.',
      'Portal activity pauses during client-requested freeze windows and closed periods.',
    ],
  },
];

export const CAPABILITY_MATRIX: CapabilityMatrixRow[] = [
  {
    moduleName: 'Users, roles & scope',
    moduleSubtitle: 'Access administration and the Microsoft 365 connection',
    cells: {
      ADMINISTRATOR: { level: 'Full', note: 'Binds identities, grants/revokes access, sends invitations, configures sign-in.' },
      PARTNER: { level: 'None', note: 'Requests changes through an administrator.' },
      MANAGER: { level: 'None', note: 'No administration authority.' },
      SENIOR: { level: 'None', note: 'No administration authority.' },
      STAFF: { level: 'None', note: 'No administration authority.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'No administration authority.' },
      FINANCE_MANAGER: { level: 'None', note: 'No administration authority.' },
      FINANCE_REVIEWER: { level: 'None', note: 'No administration authority.' },
      ACCOUNTING_PREPARER: { level: 'None', note: 'No administration authority.' },
      ACCOUNTING_REVIEWER: { level: 'None', note: 'No administration authority.' },
      CLIENT_USER: { level: 'None', note: 'Portal-only account.' },
    },
  },
  {
    moduleName: 'Audit fieldwork & working papers',
    moduleSubtitle: 'Preparation, review and sign-off of engagement work',
    cells: {
      ADMINISTRATOR: { level: 'View', note: 'Reads audit records to adjudicate access — never reviews or signs off.' },
      PARTNER: { level: 'Approve', note: 'Signs off engagement work and review points.' },
      MANAGER: { level: 'Review', note: 'Reviews the work prepared by seniors and staff.' },
      SENIOR: { level: 'Prepare', note: 'Coordinates and prepares working papers.' },
      STAFF: { level: 'Prepare', note: 'Prepares working papers; imports and maps data.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'Out of scope for this role.' },
      FINANCE_MANAGER: { level: 'None', note: 'Out of scope for this role.' },
      FINANCE_REVIEWER: { level: 'None', note: 'Out of scope for this role.' },
      ACCOUNTING_PREPARER: { level: 'None', note: 'Accounting role — not audit workpapers.' },
      ACCOUNTING_REVIEWER: { level: 'None', note: 'Accounting role — not audit workpapers.' },
      CLIENT_USER: { level: 'None', note: 'No staff-portal fieldwork access.' },
    },
  },
  {
    moduleName: 'Client accounting packages',
    moduleSubtitle: 'Recurring client accounting & consolidation \u2014 prepare, review, approve',
    cells: {
      ADMINISTRATOR: { level: 'Review', note: 'Can record the accounting-review stage.' },
      PARTNER: { level: 'Approve', note: 'Records the Partner-approval stage (currently assigned partner).' },
      MANAGER: { level: 'Review', note: 'Can record the accounting-review stage.' },
      SENIOR: { level: 'None', note: 'No accounting package authority.' },
      STAFF: { level: 'None', note: 'No accounting package authority.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'Out of scope for this role.' },
      FINANCE_MANAGER: { level: 'None', note: 'Firm finance \u2014 not client accounting.' },
      FINANCE_REVIEWER: { level: 'None', note: 'Firm finance \u2014 not client accounting.' },
      ACCOUNTING_PREPARER: { level: 'Prepare', note: 'Prepares scoped accounting and consolidation work.' },
      ACCOUNTING_REVIEWER: { level: 'Review', note: 'Independent review stage; never own preparation.' },
      CLIENT_USER: { level: 'None', note: 'No access to accounting packages.' },
    },
  },
  {
    moduleName: 'Firm billing & invoices',
    moduleSubtitle: 'Invoice preparation, approval, credit notes and posting',
    cells: {
      ADMINISTRATOR: { level: 'View', note: 'No billing authority.' },
      PARTNER: { level: 'View', note: 'No billing authority.' },
      MANAGER: { level: 'None', note: 'No billing authority.' },
      SENIOR: { level: 'None', note: 'No billing authority.' },
      STAFF: { level: 'None', note: 'No billing authority.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'No billing authority.' },
      FINANCE_MANAGER: { level: 'Full', note: 'Prepares invoices; posts them; records credit notes.' },
      FINANCE_REVIEWER: { level: 'Approve', note: 'Approves prepared invoices; may also prepare. Never own work.' },
      ACCOUNTING_PREPARER: { level: 'None', note: 'No billing authority.' },
      ACCOUNTING_REVIEWER: { level: 'None', note: 'No billing authority.' },
      CLIENT_USER: { level: 'None', note: 'No billing authority.' },
    },
  },
  {
    moduleName: 'Firm ledger & accounting periods',
    moduleSubtitle: 'Journals, reversal and period close \u2014 maker\u2013checker only',
    cells: {
      ADMINISTRATOR: { level: 'None', note: 'No ledger authority.' },
      PARTNER: { level: 'None', note: 'No ledger authority.' },
      MANAGER: { level: 'None', note: 'No ledger authority.' },
      SENIOR: { level: 'None', note: 'No ledger authority.' },
      STAFF: { level: 'None', note: 'No ledger authority.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'No ledger authority.' },
      FINANCE_MANAGER: { level: 'Full', note: 'Only role that drafts, submits and posts journals (firm-wide grant required); reopens periods.' },
      FINANCE_REVIEWER: { level: 'Approve', note: 'Approves journals; performs reversals and period close.' },
      ACCOUNTING_PREPARER: { level: 'None', note: 'Client accounting \u2014 not the firm ledger.' },
      ACCOUNTING_REVIEWER: { level: 'None', note: 'Client accounting \u2014 not the firm ledger.' },
      CLIENT_USER: { level: 'None', note: 'No ledger access.' },
    },
  },
  {
    moduleName: 'Client relationships',
    moduleSubtitle: 'Relationship records and acceptance status',
    cells: {
      ADMINISTRATOR: { level: 'View', note: 'Reads directory-level client records for access binding.' },
      PARTNER: { level: 'View', note: 'Reads status for the clients they lead.' },
      MANAGER: { level: 'View', note: 'Reads status for granted scopes.' },
      SENIOR: { level: 'None', note: 'Out of scope for this role.' },
      STAFF: { level: 'None', note: 'Out of scope for this role.' },
      RELATIONSHIP_MANAGER: { level: 'Full', note: 'Manages client relationship records; views acceptance status.' },
      FINANCE_MANAGER: { level: 'None', note: 'Out of scope for this role.' },
      FINANCE_REVIEWER: { level: 'None', note: 'Out of scope for this role.' },
      ACCOUNTING_PREPARER: { level: 'None', note: 'Out of scope for this role.' },
      ACCOUNTING_REVIEWER: { level: 'None', note: 'Out of scope for this role.' },
      CLIENT_USER: { level: 'None', note: 'Portal account only.' },
    },
  },
  {
    moduleName: 'Client portal',
    moduleSubtitle: 'Document requests (PBC), uploads and responses',
    cells: {
      ADMINISTRATOR: { level: 'None', note: 'Grants portal access; portal data stays with the client team.' },
      PARTNER: { level: 'View', note: 'Views portal outcomes for granted scopes.' },
      MANAGER: { level: 'View', note: 'Tracks document requests for granted scopes.' },
      SENIOR: { level: 'None', note: 'Out of scope for this module.' },
      STAFF: { level: 'None', note: 'Out of scope for this module.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'Out of scope for this module.' },
      FINANCE_MANAGER: { level: 'None', note: 'Out of scope for this module.' },
      FINANCE_REVIEWER: { level: 'None', note: 'Out of scope for this module.' },
      ACCOUNTING_PREPARER: { level: 'None', note: 'Staff portal only.' },
      ACCOUNTING_REVIEWER: { level: 'None', note: 'Staff portal only.' },
      CLIENT_USER: { level: 'Full', note: 'Uses the portal for the granted client/engagement; responds to PBC requests; gates: first sign-in, active engagement, freeze windows.' },
    },
  },
  {
    moduleName: 'Consolidation groups',
    moduleSubtitle: 'Explicit group grants \u2014 seven staff roles only',
    cells: {
      ADMINISTRATOR: { level: 'None', note: 'Group scope does not apply to administrators.' },
      PARTNER: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      MANAGER: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      SENIOR: { level: 'None', note: 'Not eligible \u2014 the server excludes seniors from group scope.' },
      STAFF: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      RELATIONSHIP_MANAGER: { level: 'None', note: 'Not eligible.' },
      FINANCE_MANAGER: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      FINANCE_REVIEWER: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      ACCOUNTING_PREPARER: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      ACCOUNTING_REVIEWER: { level: 'Full', note: 'Eligible \u2014 only with an explicit group grant.' },
      CLIENT_USER: { level: 'None', note: 'Client accounts are never group-members.' },
    },
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'Q1',
    category: 'Identity & Sign-In',
    question: 'Can we use a shared mailbox, like accounts@firm.com?',
    answer:
      'No. Every action is tied to one individual Microsoft identity. Shared mailboxes cannot be granted a role because there would be no accountable person behind reviews and approvals.',
  },
  {
    id: 'Q2',
    category: 'Identity & Sign-In',
    question: 'Can someone sign in with a personal @gmail.com or @yahoo.com address?',
    answer:
      'No. Everyone signs in through Microsoft (your Microsoft 365 domain, or a B2B guest invitation for client-side people). The work email you enter here is the sign-in identity.',
  },
  {
    id: 'Q3',
    category: 'Roles & Scopes',
    question: 'Can one person hold different roles on different clients?',
    answer:
      'Yes. Access is grant-by-grant: the same person can be a manager on one client and a partner-relevant role on another. The server flags conflicting finance/accounting pairings wherever scopes overlap.',
  },
  {
    id: 'Q4',
    category: 'Separation of Duties',
    question: 'Can one person prepare and review the same finance work?',
    answer:
      'No. Invoice, journal and accounting review commands compare the preparer against the reviewer. The tracker warns when a request would give one person a prepare-and-review pair (Finance Manager + Finance Reviewer, or Accounting Preparer + Accounting Reviewer).',
  },
  {
    id: 'Q5',
    category: 'Roles & Scopes',
    question: 'Why can\u2019t we set an access start date?',
    answer:
      'Access starts when the administrator approves it. Future-dated activation isn\u2019t supported, so the tracker only records the change now; expiry can still be set forward.',
  },
  {
    id: 'Q6',
    category: 'Access Lifecycle',
    question: 'How does temporary access end?',
    answer:
      'Two ways: an expiry date you set (honoured exactly as granted, never automatically extended), or the administrator revoking the grant. Consolidation-group grants never expire on their own \u2014 they are removed by explicit revocation.',
  },
  {
    id: 'Q7',
    category: 'Identity & Sign-In',
    question: 'When can a new client portal user start uploading?',
    answer:
      'After their first Microsoft sign-in. Portal powers follow the grant\u2019s scope, an active engagement, and pause during client-requested freeze windows \u2014 access never leaks outside the granted client or engagement.',
  },
  {
    id: 'Q8',
    category: 'Roles & Scopes',
    question: 'Who checks what we submit here?',
    answer:
      'The Firm Administrator. Nothing submitted on this page activates anything: an administrator reviews each row, verifies the identity, and applies (or declines) it before portal or staff access is granted.',
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Role',
    codeOrAcronym: 'RoleCode',
    definition:
      'What a person can do, selected from the 11 supported roles. Staff roles bind to staff identities; the portal role binds to client identities.',
  },
  {
    term: 'Scope',
    codeOrAcronym: 'FIRM_WIDE \u00b7 CLIENT \u00b7 ENGAGEMENT \u00b7 GROUP',
    definition:
      'Where the role applies: the whole firm, one client, one engagement, or an explicit consolidation group.',
  },
  {
    term: 'Grant',
    codeOrAcronym: 'RoleGrant / GroupAccessGrant',
    definition:
      'The record that activates role + scope for one person, with optional expiry. Group access uses a separate, explicit grant.',
  },
  {
    term: 'Engagement',
    codeOrAcronym: '\u2014',
    definition: 'One audit or accounting engagement for one client and period \u2014 the most contained standard scope.',
  },
  {
    term: 'PBC item',
    codeOrAcronym: 'Provided-by-Client',
    definition:
      'A document the firm requests from the client team through the portal (statements, reconciliations, schedules).',
  },
  {
    term: 'Maker\u2013checker',
    codeOrAcronym: 'Separation of duties',
    definition:
      'Approval commands verify the reviewer differs from the preparer \u2014 for invoices, journals and accounting packages alike.',
  },
  {
    term: 'Staffing assignment',
    codeOrAcronym: 'Partner approval gate',
    definition:
      'Partner approvals check that the approver is currently the engagement\u2019s assigned partner \u2014 holding the Partner role alone is not enough.',
  },
  {
    term: 'First sign-in',
    codeOrAcronym: 'Client identity gate',
    definition:
      'Client portal accounts gain their powers only after their first Microsoft sign-in binds the invited identity.',
  },
  {
    term: 'Freeze window',
    codeOrAcronym: 'Portal pause',
    definition: 'A client-requested pause that stops portal activity without revoking any grant.',
  },
];

export const EVIDENCE_ROWS: EvidenceRow[] = [
  {
    claimId: 'EV-01',
    capabilityOrRule:
      '11 supported application roles (Administrator, Partner, Manager, Senior, Staff, RelationshipManager, FinanceManager, FinanceReviewer, AccountingPreparer, AccountingReviewer, ClientUser)',
    filePath: 'src/AuditSphereOps.Application/Security/RoleAdministrationService.cs',
    symbolOrType: 'AllowedRoles',
    verificationCategory: 'Roles & Scopes',
  },
  {
    claimId: 'EV-02',
    capabilityOrRule:
      'Scope kinds (FIRM_WIDE / CLIENT / ENGAGEMENT / GROUP) and their required identifiers (none / clientId / clientId+engagementId / groupId)',
    filePath: 'src/AuditSphereOps.Application/Security/RoleAssignmentService.cs',
    symbolOrType: 'RoleAssignmentRequest.ScopeKind, BuildPreviewAsync',
    verificationCategory: 'Roles & Scopes',
  },
  {
    claimId: 'EV-03',
    capabilityOrRule:
      'Containment rules: firm-wide covers clients and engagements; client covers its engagements; engagement covers itself; group is never implied',
    filePath: 'src/AuditSphereOps.Application/Security/AuthorizationDecision.cs',
    symbolOrType: 'AuthorizationDecision.Covers()',
    verificationCategory: 'Roles & Scopes',
  },
  {
    claimId: 'EV-04',
    capabilityOrRule:
      'Group access is a separate explicit grant; the 7 eligible staff roles are Partner, Manager, Staff, FinanceManager, FinanceReviewer, AccountingPreparer, AccountingReviewer (seniors excluded)',
    filePath: 'src/AuditSphereOps.Application/Security/RoleAssignmentService.cs',
    symbolOrType: 'GroupRoles, GroupAccessGrant',
    verificationCategory: 'Roles & Scopes',
  },
  {
    claimId: 'EV-05',
    capabilityOrRule:
      'No future-dated access ("access starts when the change is approved"); expiry must be at least 5 minutes ahead; group grants reject expiry dates',
    filePath: 'src/AuditSphereOps.Application/Security/RoleAssignmentService.cs',
    symbolOrType: 'BuildPreviewAsync (EffectiveFrom / ExpiresAt checks)',
    verificationCategory: 'Roles & Scopes',
  },
  {
    claimId: 'EV-06',
    capabilityOrRule:
      'Invoice approval is FinanceReviewer-only and rejects preparers ("Invoice preparers cannot approve their own invoice"); preparation accepted from both finance roles',
    filePath: 'src/AuditSphereOps.Application/Practice/BillingService.cs',
    symbolOrType: 'BillingRoles, ApproveInvoice',
    verificationCategory: 'Maker-Checker',
  },
  {
    claimId: 'EV-07',
    capabilityOrRule:
      'Journal drafts/submit/post are FinanceManager-only and require a firm-wide grant; approval is FinanceReviewer-only with the preparer exclusion; reversal & close = FinanceReviewer; reopen = FinanceManager',
    filePath: 'src/AuditSphereOps.Application/Practice/LedgerService.cs',
    symbolOrType: 'FirmJournalDraft commands (RequireFirmWide: true)',
    verificationCategory: 'Maker-Checker',
  },
  {
    claimId: 'EV-08',
    capabilityOrRule:
      'Accounting-review stage accepts AccountingReviewer / Manager / Partner / Administrator; Partner-approval is Partner-only and checks the currently assigned engagement partner; one person cannot record approved decisions at two stages of one package version',
    filePath: 'src/AuditSphereOps.Application/Accounting/FinancialPackageReviewService.cs',
    symbolOrType: 'FinancialPackageReviewRequest, PartnerApproval',
    verificationCategory: 'Maker-Checker',
  },
  {
    claimId: 'EV-09',
    capabilityOrRule:
      'Portal powers follow the exact scope, require first sign-in, active engagement state, ownership/delegation for requests, and pause under freeze windows; no read-only observer variant',
    filePath: 'src/AuditSphereOps.Application/Documents/ClientPortalService.cs',
    symbolOrType: 'ClientPortalService predicates, FirstSignInStatus',
    verificationCategory: 'Client Portal',
  },
  {
    claimId: 'EV-10',
    capabilityOrRule:
      'Administrators are included among the audit read roles (workpaper, finding and review-point reads) \u2014 visibility for access adjudication only',
    filePath: 'src/AuditSphereOps.Application/Audit/AuditRecordQueries.cs',
    symbolOrType: 'AuditRoles',
    verificationCategory: 'Roles & Scopes',
  },
  {
    claimId: 'EV-11',
    capabilityOrRule:
      'Sign-in through Microsoft identity with immutable tenant/object claims; grants issue copy-link invitations whose first authenticated use binds the identity',
    filePath:
      'docs/architecture/adr/auditsphere-architecture-adr-0003-client-portal-microsoft-sign-in-approved.md',
    symbolOrType: 'ADR-0003 (client portal Microsoft sign-in) + ApplyRoleGrantAndInvitationAsync',
    verificationCategory: 'Sign-In & Identity',
  },
];

export const REPO_CROSSWALK: RepoCrosswalkRow[] = [
  {
    roleCode: 'ADMINISTRATOR',
    displayLabel: 'Firm Administrator',
    serverRole: 'Administrator',
    staffingOrScopeNote:
      'Firm-wide administrator grants are protected: revoking the last one requires a verified replacement administrator, and administrators never change their own access.',
  },
  {
    roleCode: 'PARTNER',
    displayLabel: 'Partner',
    serverRole: 'Partner',
    staffingOrScopeNote:
      'Partner-approval rights require the currently-assigned engagement partner staffing, not merely the role.',
  },
  {
    roleCode: 'MANAGER',
    displayLabel: 'Audit Manager',
    serverRole: 'Manager',
    staffingOrScopeNote:
      'Also accepted as a recorder of the accounting-review stage of client accounting packages.',
  },
  {
    roleCode: 'SENIOR',
    displayLabel: 'Senior Auditor',
    serverRole: 'Senior',
    staffingOrScopeNote:
      'Not eligible for consolidation-group scope (the server\u2019s group list excludes seniors).',
  },
  {
    roleCode: 'STAFF',
    displayLabel: 'Audit Staff',
    serverRole: 'Staff',
    staffingOrScopeNote: 'Preparation-only in audit work; eligible for group scope.',
  },
  {
    roleCode: 'RELATIONSHIP_MANAGER',
    displayLabel: 'Client Relationship Manager',
    serverRole: 'RelationshipManager',
    staffingOrScopeNote: 'Records and status only; not eligible for group scope.',
  },
  {
    roleCode: 'FINANCE_MANAGER',
    displayLabel: 'Firm Finance Manager',
    serverRole: 'FinanceManager',
    staffingOrScopeNote:
      'Prepares billing and journals; posting/credit notes sit here, approval does not.',
  },
  {
    roleCode: 'FINANCE_REVIEWER',
    displayLabel: 'Firm Finance Reviewer',
    serverRole: 'FinanceReviewer',
    staffingOrScopeNote:
      'Approves finance postings with a preparer-exclusion check; may also prepare invoices.',
  },
  {
    roleCode: 'ACCOUNTING_PREPARER',
    displayLabel: 'Client Accounting Preparer',
    serverRole: 'AccountingPreparer',
    staffingOrScopeNote:
      'Pairwise segregated from AccountingReviewer on the same identity.',
  },
  {
    roleCode: 'ACCOUNTING_REVIEWER',
    displayLabel: 'Client Accounting Reviewer',
    serverRole: 'AccountingReviewer',
    staffingOrScopeNote:
      'Independent review stage; Partner-only approval stays out of reach.',
  },
  {
    roleCode: 'CLIENT_USER',
    displayLabel: 'Client Portal User',
    serverRole: 'ClientUser',
    staffingOrScopeNote:
      'Must be a client identity, scoped to client or engagement, never firm-wide; portal powers start at first sign-in.',
  },
];

export const ADMIN_WALKTHROUGH_STEPS: AdminWalkthroughStep[] = [
  {
    stepNumber: 1,
    title: 'Verify the Microsoft identity first',
    route: '/admin/directory',
    summary:
      'Find the person\u2019s identity in your directory and confirm the exact sign-in email before touching roles.',
    checklist: [
      'Search by exact work email (or name) to avoid duplicate bindings.',
      'Check the account type: staff identity for staff roles, client identity for the portal role.',
      'Freshly verified identities (within minutes) are required before a grant is accepted.',
    ],
    guardrailNote: 'An identity bound to the wrong email cannot be re-pointed \u2014 email conflicts are rejected.',
  },
  {
    stepNumber: 2,
    title: 'Check the request details',
    route: '/admin/access',
    summary: 'Match each requested row against this page\u2019s rules before applying it.',
    checklist: [
      'Role + scope combination must be one the role actually allows.',
      'Coverage target must exist: the client, engagement or group named in the request.',
      'Watch the flagged SoD pairings and the expiry rules (no expiry on group grants).',
    ],
    guardrailNote: 'The request tracker records intent only \u2014 this review is what activates access.',
  },
  {
    stepNumber: 3,
    title: 'Apply the grant',
    route: '/admin/access',
    summary: 'Create the grant with the verified role + scope, and give it a reason.',
    checklist: [
      'Role and scope must match the verified identity kind (staff vs. client).',
      'Set an expiry for time-boxed roles; leave open-ended access uncapped.',
      'Group grants never carry an expiry.',
    ],
    guardrailNote:
      'A change to an administrator\u2019s own access must be applied by a different administrator.',
  },
  {
    stepNumber: 4,
    title: 'Deliver the invitation',
    route: '/admin/access',
    summary: 'Every activated grant produces a copy-link invitation for the person.',
    checklist: [
      'Copy the invitation link and send it to the person\u2019s work email.',
      'Their first authenticated sign-in binds the identity and opens the right portal.',
      'Delivery state is tracked until the invite is used.',
    ],
    guardrailNote: 'Revoking a grant immediately blocks the next authenticated action \u2014 invitations tied to it stop working.',
  },
];
