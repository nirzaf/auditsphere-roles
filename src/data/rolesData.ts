export type RoleCode =
  | 'ENGAGEMENT_PARTNER'
  | 'QUALITY_REVIEWER'
  | 'AUDIT_MANAGER'
  | 'SENIOR_AUDITOR'
  | 'STAFF_AUDITOR'
  | 'ADMINISTRATOR'
  | 'FIRM_FINANCE'
  | 'CLIENT_PRIMARY'
  | 'CLIENT_CONTRIBUTOR'
  | 'CLIENT_VIEWER';

export type AccountType = 'Staff' | 'Client';

export type ScopeCode = 'FIRM_WIDE' | 'GROUP' | 'CLIENT' | 'ENGAGEMENT';

export type CapabilityLevel =
  | 'Full'
  | 'Edit'
  | 'Prepare'
  | 'Review'
  | 'Concur'
  | 'Upload'
  | 'Assigned'
  | 'Admin'
  | 'View'
  | 'None';

export interface RoleDefinition {
  order: number;
  code: RoleCode;
  displayLabel: string;
  accountType: AccountType;
  allowedScopes: ScopeCode[];
  repoRoleMapping: string;
  summaryAndTitles: string;
  dailyResponsibilities: string;
  canDo: string[];
  cannotDo: string[];
  decisionsOwned: string;
  handoffsAndReview: string;
  scopeOptionsNote: string;
  screens: string[];
  howAccessEnds: string;
  sourceCitation: string;
}

export interface ScopeDefinition {
  code: ScopeCode;
  label: string;
  hierarchyOrder: number;
  accentHex: string;
  meaning: string;
  example: string;
  doesNotCover: string;
}

export interface LifecyclePhaseRow {
  phaseNumber: number;
  phase: string;
  shortTitle: string;
  evidenceTrigger: string;
  firmFinance: string;
  engagementPartner: string;
  qualityReviewer: string;
  auditManager: string;
  seniorAndStaff: string;
  clientPrimary: string;
  clientContributorAndViewer: string;
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

export interface RoleRequestRow {
  id: string;
  fullName: string;
  workEmail: string;
  accountType: AccountType;
  roleRequested: RoleCode;
  scopeType: ScopeCode;
  scopeTarget: string;
  startDate: string;
  expiry: string;
  approvedBy: string;
  notes: string;
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

export interface EvidenceRow {
  claimId: string;
  capabilityOrRule: string;
  filePath: string;
  symbolOrType: string;
  verificationCategory: 'Domain & Grants' | 'UI & Guards' | 'Requirements & ADR' | 'Server Tests';
}

export interface OpenQuestionRow {
  id: string;
  topic: string;
  observedCodeBehavior: string;
  questionToConfirm: string;
}

export interface RepoCrosswalkRow {
  guideRoleCode: RoleCode;
  guideDisplayLabel: string;
  dotnetRoleGrantsCode: string;
  staffingOrSpecializationNote: string;
}

export interface AdminWalkthroughStep {
  stepNumber: number;
  title: string;
  route: string;
  summary: string;
  checklist: string[];
  guardrailNote: string;
}

export const ACTION_CALLOUT = {
  destinationEmail: 'auditsphere-admin@example.com',
  subjectLineTemplate: '[Access Request] - <Firm/Client Name> - <Target Engagement/Scope>',
  deadlinePlaceholder: '5 Business Days Prior to Fieldwork Commencement',
};

export const SCOPES: ScopeDefinition[] = [
  {
    code: 'FIRM_WIDE',
    label: 'Firm-Wide (FIRM_WIDE)',
    hierarchyOrder: 1,
    accentHex: '#005082',
    meaning:
      'Applies across the entire accounting practice, all corporate groups, all clients, and all engagements.',
    example:
      'Elena Rostova holds ADMINISTRATOR at Firm-Wide scope; Practice Finance Lead holds FIRM_FINANCE at Firm-Wide scope.',
    doesNotCover:
      'Reserved strictly for Staff roles (ADMINISTRATOR, FIRM_FINANCE, and managing ENGAGEMENT_PARTNER / QUALITY_REVIEWER / AUDIT_MANAGER). Never assignable to Client accounts.',
  },
  {
    code: 'GROUP',
    label: 'Group (GROUP)',
    hierarchyOrder: 2,
    accentHex: '#26a69a',
    meaning:
      'Applies to a parent holding company and all of its subsidiary client entities for multi-entity group consolidation and oversight.',
    example:
      'Sarah Jenkins holds ENGAGEMENT_PARTNER on Group: Apex Holdings Group.',
    doesNotCover:
      'Does not grant access to unrelated corporate groups or firm-wide administrative settings. Forbidden for STAFF_AUDITOR, ADMINISTRATOR, FIRM_FINANCE, and CLIENT_CONTRIBUTOR.',
  },
  {
    code: 'CLIENT',
    label: 'Client (CLIENT)',
    hierarchyOrder: 3,
    accentHex: '#009688',
    meaning:
      'Applies to a single legal client entity and all historical and current audit engagements under that specific client.',
    example:
      'Marcus Vance holds AUDIT_MANAGER on Client: Acme Corp; David Chen holds CLIENT_PRIMARY on Client: Acme Corp.',
    doesNotCover:
      'Cannot view or act on sibling subsidiaries (unless granted GROUP scope) or any other client organization.',
  },
  {
    code: 'ENGAGEMENT',
    label: 'Engagement (ENGAGEMENT)',
    hierarchyOrder: 4,
    accentHex: '#7b1fa2',
    meaning:
      'Applies strictly to one specific audit engagement (e.g., "FY2026 Statutory Audit — Acme Corp"). Most granular and common scope.',
    example:
      'Sarah Miller holds CLIENT_CONTRIBUTOR on Engagement: FY2026 Audit - Acme Corp.',
    doesNotCover:
      'Cannot view FY2025 or prior engagements of the same client, sibling engagements, or parent client settings.',
  },
];

export const ROLES: RoleDefinition[] = [
  {
    order: 1,
    code: 'ENGAGEMENT_PARTNER',
    displayLabel: 'Engagement Partner',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'GROUP', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'Partner (RoleCodes.Partner + ENGAGEMENT_PARTNER staffing role)',
    summaryAndTitles:
      'The ultimate signing authority for the audit engagement, responsible for risk clearance, final opinion issuance, and engagement lock. Typical titles: Audit Partner, Engagement Partner, Managing Partner, Assurance Director.',
    dailyResponsibilities:
      'Reviewing high-risk audit areas, executing the Partner side of Dual-Key Engagement Acceptance, approving materiality thresholds, signing off on final financial packages, and issuing the final audit opinion.',
    canDo: [
      'Execute Partner Clearance Key (Key 2) during client onboarding (M1-03).',
      'Approve materiality and Significant Risk Matrix (SRM) locks.',
      'Sign off on final audit completion, financial statement packages, and issue the audit report.',
      'Lock and archive the completed engagement binder.',
    ],
    cannotDo: [
      'Cannot act as the Independent Quality Reviewer (QUALITY_REVIEWER) on an engagement where they are the assigned Engagement Partner (M2-02).',
      'Cannot review or approve working papers that they personally prepared (No Self-Review rule).',
      'Cannot modify system-level Microsoft Entra ID configurations or manage global user directory bindings (reserved for ADMINISTRATOR).',
    ],
    decisionsOwned:
      'Engagement acceptance risk clearance (Key 2), materiality approval, final opinion sign-off, and archive lock.',
    handoffsAndReview:
      'Receives reviewed workpapers and draft financial packages from the AUDIT_MANAGER; hands off final file to QUALITY_REVIEWER for concurrence prior to report release.',
    scopeOptionsNote:
      'FIRM_WIDE, GROUP, CLIENT, ENGAGEMENT (Most commonly assigned at CLIENT or ENGAGEMENT scope).',
    screens: [
      'Practice & Commercial',
      'Workflow & Tasks',
      'Client Accounting & Reporting',
      'Audit & Records',
      'People & Time',
      'Group Consolidation',
      'Knowledge Library',
    ],
    howAccessEnds:
      'Automatically at midnight UTC on the grant Expiry Date, or immediately upon manual revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#EngagementPartner, docs/requirements/auditsphere-accounting-module-requirements-current.md#M1-03',
  },
  {
    order: 2,
    code: 'QUALITY_REVIEWER',
    displayLabel: 'Engagement Quality Reviewer (EQCR)',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'GROUP', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'Partner (RoleCodes.Partner + independent EQR Partner assignment)',
    summaryAndTitles:
      'An independent partner or senior specialist who performs an objective evaluation of significant judgments made by the engagement team before the audit report is issued. Typical titles: EQCR Partner, Quality Review Partner, Technical Director.',
    dailyResponsibilities:
      'Inspecting high-risk workpapers, evaluating independence and significant accounting judgments, and recording formal EQCR concurrence or rejection.',
    canDo: [
      'Read all working papers, financial statements, risk matrices, and review notes within the scoped engagement.',
      'Raise formal Quality Review Notes requiring resolution before sign-off.',
      'Issue or withhold formal EQCR Concurrence required for high-risk engagement report release (M2-02).',
    ],
    cannotDo: [
      'Cannot prepare, edit, or modify working papers, trial balances, or audit adjustments on the engagement.',
      'Cannot hold ENGAGEMENT_PARTNER, AUDIT_MANAGER, SENIOR_AUDITOR, or STAFF_AUDITOR grants on the same engagement (strict independence enforcement, M2-02).',
    ],
    decisionsOwned:
      'Independent Quality Review concurrence (EQCR sign-off).',
    handoffsAndReview:
      'Receives the Partner-reviewed engagement package from ENGAGEMENT_PARTNER; returns concurrence so ENGAGEMENT_PARTNER can release the final deliverable.',
    scopeOptionsNote: 'FIRM_WIDE, GROUP, CLIENT, ENGAGEMENT.',
    screens: [
      'Workflow & Tasks (View)',
      'Client Accounting & Reporting (Review)',
      'Audit & Records (Concurrence)',
      'Group Consolidation (Review)',
      'Knowledge Library',
    ],
    howAccessEnds:
      'Upon engagement archive/closure, grant expiry, or manual revocation.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#QualityReviewer, docs/requirements/auditsphere-accounting-module-requirements-current.md#M2-02',
  },
  {
    order: 3,
    code: 'AUDIT_MANAGER',
    displayLabel: 'Audit Manager',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'GROUP', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'Manager (RoleCodes.Manager) + AccountingReviewer',
    summaryAndTitles:
      'Manages the day-to-day execution of the audit lifecycle, coordinates staffing and budgets, and performs primary managerial review of all fieldwork. Typical titles: Audit Manager, Assurance Manager, Senior Manager.',
    dailyResponsibilities:
      'Setting up engagement workflows, assigning tasks to Seniors and Staff, reviewing completed working papers and financial reconciliations, managing PBC requests, and escalating significant findings to the Partner.',
    canDo: [
      'Create and configure engagement workplans, budgets, and task assignments.',
      'Perform primary Managerial Review on working papers prepared by STAFF_AUDITOR or SENIOR_AUDITOR.',
      'Create, issue, and reopen Provided-by-Client (PBC) document requests.',
      'Draft and review financial statement packages and consolidation schedules.',
    ],
    cannotDo: [
      'Cannot issue the final Partner sign-off or execute the Partner Clearance Key (Key 2) for engagement acceptance.',
      'Cannot review working papers that they personally prepared (No Self-Review rule).',
    ],
    decisionsOwned:
      'Manager-level workpaper sign-off, task allocation, and PBC completeness acceptance.',
    handoffsAndReview:
      'Reviews work from SENIOR_AUDITOR and STAFF_AUDITOR; hands off completed engagement sections to ENGAGEMENT_PARTNER.',
    scopeOptionsNote: 'FIRM_WIDE, GROUP, CLIENT, ENGAGEMENT.',
    screens: [
      'Practice & Commercial',
      'Workflow & Tasks',
      'Client Accounting & Reporting',
      'Audit & Records',
      'People & Time',
      'Group Consolidation',
      'Knowledge Library',
    ],
    howAccessEnds:
      'Grant expiry date or manual revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#AuditManager, src/AuditSphereOps.Application/Authorization/CommandRoleMatrix.cs',
  },
  {
    order: 4,
    code: 'SENIOR_AUDITOR',
    displayLabel: 'Senior Auditor',
    accountType: 'Staff',
    allowedScopes: ['GROUP', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'Senior (RoleCodes.Senior) + AccountingPreparer',
    summaryAndTitles:
      'Leads fieldwork execution on the ground, prepares complex audit sections, and performs initial first-level review of junior staff work. Typical titles: Senior Auditor, Audit Senior, In-Charge Auditor, Senior Associate.',
    dailyResponsibilities:
      'Importing client Trial Balances (TB) and General Ledgers (GL), executing substantive testing and sampling, reviewing STAFF_AUDITOR working papers, and inspecting client PBC uploads.',
    canDo: [
      'Prepare and edit working papers, lead schedules, and proposed audit adjustments.',
      'Perform first-level (Senior) review on working papers prepared by a different user (STAFF_AUDITOR).',
      'Issue PBC requests and mark client-uploaded documents as accepted or returned for clarification.',
    ],
    cannotDo: [
      'Cannot review their own prepared working papers (No Self-Review).',
      'Cannot perform Manager Review or Partner Sign-Off.',
      'Cannot be granted FIRM_WIDE scope (must be scoped to specific Group, Client, or Engagement).',
    ],
    decisionsOwned:
      'First-level workpaper review and initial verification of client PBC evidence.',
    handoffsAndReview:
      'Reviews STAFF_AUDITOR work; submits own work and first-level reviewed sections to AUDIT_MANAGER.',
    scopeOptionsNote: 'GROUP, CLIENT, ENGAGEMENT (No FIRM_WIDE scope).',
    screens: [
      'Workflow & Tasks',
      'Client Accounting & Reporting',
      'Audit & Records',
      'People & Time',
      'Group Consolidation',
      'Knowledge Library',
    ],
    howAccessEnds:
      'Grant expiry date or manual revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#SeniorAuditor, tests/AuditSphereOps.Authorization.Tests/NoSelfReviewTests.cs',
  },
  {
    order: 5,
    code: 'STAFF_AUDITOR',
    displayLabel: 'Staff Auditor',
    accountType: 'Staff',
    allowedScopes: ['CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'Staff (RoleCodes.Staff)',
    summaryAndTitles:
      'Executes assigned audit procedures, ticks and ties supporting evidence, and drafts foundational working papers. Typical titles: Staff Auditor, Audit Associate, Junior Auditor, Audit Trainee.',
    dailyResponsibilities:
      'Performing vouching, reconciliations, sample selections, uploading audit evidence, and logging daily timesheets.',
    canDo: [
      'Prepare assigned working papers and upload supporting schedules.',
      'View and download client-submitted PBC documents for their assigned engagement.',
      'Submit completed working papers for Senior or Manager review.',
      'Record personal time and expense entries.',
    ],
    cannotDo: [
      'Cannot review or sign off on any working paper (neither their own nor anyone else’s).',
      'Cannot approve audit adjustments, unlock locked periods, or modify engagement budgets.',
      'Cannot hold FIRM_WIDE or GROUP scopes.',
    ],
    decisionsOwned:
      'None (preparer role only; all outputs require independent review).',
    handoffsAndReview:
      'Receives task assignments from AUDIT_MANAGER or SENIOR_AUDITOR; submits prepared workpapers to SENIOR_AUDITOR.',
    scopeOptionsNote: 'CLIENT, ENGAGEMENT only.',
    screens: [
      'Workflow & Tasks (Assigned)',
      'Client Accounting & Reporting (Prepare)',
      'Audit & Records (Prepare)',
      'People & Time (Own Time)',
      'Knowledge Library',
    ],
    howAccessEnds:
      'Grant expiry date (common for seasonal interns/contractors) or manual revocation.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#StaffAuditor',
  },
  {
    order: 6,
    code: 'ADMINISTRATOR',
    displayLabel: 'Firm Administrator',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE'],
    repoRoleMapping: 'Administrator (RoleCodes.Administrator)',
    summaryAndTitles:
      'Manages user onboarding, Microsoft Entra ID roster binding, role grants, and system settings without possessing professional audit sign-off authority. Typical titles: IT Administrator, Operations Manager, System Administrator, Compliance Officer.',
    dailyResponsibilities:
      'Binding work emails to roster identities, assigning and revoking RoleGrants based on approved requests, generating external invitation links, and monitoring directory sync status.',
    canDo: [
      'Access the Users & Access administration console (/admin/access, /admin/roles, /admin/directory).',
      'Bind roster identities, create/revoke role grants, and set grant expiration dates.',
      'Generate invitation links when automated Microsoft Graph provisioning is disabled.',
    ],
    cannotDo: [
      '"Administrator access does not confer Partner authority" (ADR-0003): An Administrator cannot sign audit opinions, approve working papers, clear Partner acceptance keys, or alter sealed audit records.',
      'Cannot access engagement working papers unless explicitly granted a separate audit role.',
    ],
    decisionsOwned:
      'Execution of approved identity bindings, role grant provisioning, and immediate access revocation.',
    handoffsAndReview:
      'Receives approved Role Assignment Requests from Partners or Client Leads; provisions access and notifies users.',
    scopeOptionsNote: 'FIRM_WIDE only.',
    screens: [
      'Administration (Users & Access, Roles, Directory)',
      'People & Time (Roster Management)',
      'Knowledge Library (Admin)',
    ],
    howAccessEnds:
      'Manual revocation by another Firm Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Ui/src/app/features/admin/roles.ts, docs/requirements/auditsphere-accounting-module-requirements-current.md#ADR-0003',
  },
  {
    order: 7,
    code: 'FIRM_FINANCE',
    displayLabel: 'Practice Finance Lead',
    accountType: 'Staff',
    allowedScopes: ['FIRM_WIDE', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'FinanceManager + FinanceReviewer + RelationshipManager',
    summaryAndTitles:
      'Manages commercial billing, retainer invoicing, and payment verification required to unlock client engagements. Typical titles: Practice Finance Manager, Billing Controller, Commercial Operations Lead, AR Specialist.',
    dailyResponsibilities:
      'Issuing engagement retainer/advance invoices, reconciling incoming client payments, and recording the Paid Advance clearance that unlocks engagement activation.',
    canDo: [
      'Create and manage fee schedules, retainer invoices, and billing milestones.',
      'Record receipt of the required advance payment (Retainer Paid Clearance under M1-03).',
      'View commercial pipeline, time-and-billing realization, and WIP reports.',
    ],
    cannotDo: [
      'Cannot view or edit confidential audit working papers, test results, or EQCR notes.',
      'Cannot execute the Partner Clearance Key (Key 2) or sign audit reports.',
    ],
    decisionsOwned:
      'Verification and clearance of client advance/retainer payment status.',
    handoffsAndReview:
      'Receives signed proposal terms; records advance payment clearance which, combined with Dual-Key approvals, triggers automatic engagement activation.',
    scopeOptionsNote: 'FIRM_WIDE, CLIENT, ENGAGEMENT.',
    screens: [
      'Practice & Commercial',
      'Firm Finance (Billing, Invoices, WIP, Retainer Clearance)',
      'People & Time (View Billing Rates)',
    ],
    howAccessEnds:
      'Grant expiry date or manual revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#FirmFinance, docs/requirements/auditsphere-accounting-module-requirements-current.md#M1-03',
  },
  {
    order: 8,
    code: 'CLIENT_PRIMARY',
    displayLabel: 'Client Finance Lead',
    accountType: 'Client',
    allowedScopes: ['GROUP', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'ClientUser (Primary Contact / Request Owner designation)',
    summaryAndTitles:
      'The client’s senior financial representative who signs engagement acceptance terms, approves Trial Balance submissions, and coordinates the client team. Typical titles: Chief Financial Officer (CFO), Finance Director, VP of Finance, Financial Controller.',
    dailyResponsibilities:
      'Executing the Client Acceptance Key (Key 1), reviewing and approving PBC document packages prepared by client staff, approving management representation letters, and acknowledging final deliverables.',
    canDo: [
      'Execute the Client Acceptance Key (Key 1) to accept engagement terms and proposal scope (M1-03).',
      'Upload, review, and formally submit Trial Balances, General Ledgers, and PBC responses in the Client Portal.',
      'Approve proposed audit adjustments on behalf of client management.',
      'Download final signed audit reports and financial statement packages.',
    ],
    cannotDo: [
      'Cannot see internal Staff Portal screens, audit methodology steps, sampling parameters, internal review notes, or staff timesheets.',
      'Cannot unlock an engagement unilaterally without the Engagement Partner’s Key 2 and verified retainer payment.',
      'Cannot hold FIRM_WIDE scope.',
    ],
    decisionsOwned:
      'Client Engagement Acceptance (Key 1), formal submission of client financial data, and management adjustment sign-off.',
    handoffsAndReview:
      'Reviews documents uploaded by CLIENT_CONTRIBUTOR; submits finalized PBC items to SENIOR_AUDITOR / AUDIT_MANAGER.',
    scopeOptionsNote: 'GROUP, CLIENT, ENGAGEMENT (Never FIRM_WIDE).',
    screens: [
      'Client Portal — Overview & Acceptance',
      'Client Portal — PBC Requests & Uploads',
      'Client Portal — Deliverables & Sign-Offs',
    ],
    howAccessEnds:
      'Grant expiry date, engagement closure, or revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#ClientPrimary, docs/requirements/auditsphere-accounting-module-requirements-current.md#M1-03',
  },
  {
    order: 9,
    code: 'CLIENT_CONTRIBUTOR',
    displayLabel: 'Client Contributor',
    accountType: 'Client',
    allowedScopes: ['CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'ClientUser (Standard Contributor)',
    summaryAndTitles:
      'A member of the client’s accounting or operations team who uploads requested documents and answers auditor inquiries in the Client Portal. Typical titles: Senior Accountant, Payroll Specialist, Tax Manager, AP/AR Lead, Treasury Analyst.',
    dailyResponsibilities:
      'Uploading invoices, bank statements, contracts, and reconciliations against specific PBC request items assigned to them.',
    canDo: [
      'View open PBC document requests within their assigned Client or Engagement scope.',
      'Upload files, add explanatory comments, and mark individual PBC items as ready for review.',
    ],
    cannotDo: [
      'Cannot execute the Client Acceptance Key (Key 1) or sign engagement letters.',
      'Cannot approve proposed audit adjustments or sign management representation letters.',
      'Cannot access any internal Staff Portal screens or other clients’ data.',
    ],
    decisionsOwned:
      'None (evidence contributor; submissions are overseen by CLIENT_PRIMARY and verified by the audit team).',
    handoffsAndReview:
      'Receives PBC requests from the audit team or CLIENT_PRIMARY; uploads evidence for CLIENT_PRIMARY and SENIOR_AUDITOR.',
    scopeOptionsNote: 'CLIENT, ENGAGEMENT only.',
    screens: [
      'Client Portal — PBC Requests & Uploads',
      'Client Portal — Assigned Inquiries',
    ],
    howAccessEnds:
      'Grant expiry date, engagement closure, or revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#ClientContributor',
  },
  {
    order: 10,
    code: 'CLIENT_VIEWER',
    displayLabel: 'Client Observer',
    accountType: 'Client',
    allowedScopes: ['GROUP', 'CLIENT', 'ENGAGEMENT'],
    repoRoleMapping: 'ClientUser (Read-Only Observer)',
    summaryAndTitles:
      'A client executive, board member, or audit committee member who requires read-only visibility into audit progress and final deliverables. Typical titles: Audit Committee Chair, Chief Executive Officer (CEO), Non-Executive Director, General Counsel.',
    dailyResponsibilities:
      'Monitoring overall audit milestone progress, checking PBC completion percentages, and downloading final issued reports.',
    canDo: [
      'View engagement status dashboards, milestone timelines, and PBC request status in the Client Portal.',
      'View and download finalized, published deliverables and audit reports.',
    ],
    cannotDo: [
      'Cannot upload, modify, or delete any documents or comments.',
      'Cannot execute acceptance keys or approve adjustments.',
      'Cannot view internal Staff Portal screens or unissued draft working papers.',
    ],
    decisionsOwned: 'None (strictly read-only observer).',
    handoffsAndReview:
      'Consumes published status updates and final reports.',
    scopeOptionsNote: 'GROUP, CLIENT, ENGAGEMENT (Never FIRM_WIDE).',
    screens: [
      'Client Portal — Read-Only Status Dashboard',
      'Client Portal — Final Deliverables Archive',
    ],
    howAccessEnds:
      'Grant expiry date or manual revocation by an Administrator.',
    sourceCitation:
      'src/AuditSphereOps.Domain/Users/RoleGrants.cs#ClientViewer',
  },
];

export const REPO_CROSSWALK: RepoCrosswalkRow[] = [
  {
    guideRoleCode: 'ENGAGEMENT_PARTNER',
    guideDisplayLabel: 'Engagement Partner',
    dotnetRoleGrantsCode: 'Partner',
    staffingOrSpecializationNote:
      'Mapped to RoleCodes.Partner in RoleGrants.cs plus ENGAGEMENT_PARTNER assignment in EngagementStaffAssignment.',
  },
  {
    guideRoleCode: 'QUALITY_REVIEWER',
    guideDisplayLabel: 'Engagement Quality Reviewer (EQCR)',
    dotnetRoleGrantsCode: 'Partner (Independent EQR)',
    staffingOrSpecializationNote:
      'Enforced via M2-02 independent Partner concurrence check (cannot be the Engagement Partner on the same engagement).',
  },
  {
    guideRoleCode: 'AUDIT_MANAGER',
    guideDisplayLabel: 'Audit Manager',
    dotnetRoleGrantsCode: 'Manager / AccountingReviewer',
    staffingOrSpecializationNote:
      'Mapped to RoleCodes.Manager (Rank 3 audit review) and AccountingReviewer (R2R accounting review stage).',
  },
  {
    guideRoleCode: 'SENIOR_AUDITOR',
    guideDisplayLabel: 'Senior Auditor',
    dotnetRoleGrantsCode: 'Senior / AccountingPreparer',
    staffingOrSpecializationNote:
      'Mapped to RoleCodes.Senior (Rank 2 first-level fieldwork review) and AccountingPreparer (TB/GL & FSLI preparation).',
  },
  {
    guideRoleCode: 'STAFF_AUDITOR',
    guideDisplayLabel: 'Staff Auditor',
    dotnetRoleGrantsCode: 'Staff',
    staffingOrSpecializationNote:
      'Mapped to RoleCodes.Staff (Rank 1 preparation only; zero review or approval authority).',
  },
  {
    guideRoleCode: 'ADMINISTRATOR',
    guideDisplayLabel: 'Firm Administrator',
    dotnetRoleGrantsCode: 'Administrator',
    staffingOrSpecializationNote:
      'Mapped to RoleCodes.Administrator at FIRM_WIDE scope; ADR-0003 enforces strict separation from Partner and Finance authority.',
  },
  {
    guideRoleCode: 'FIRM_FINANCE',
    guideDisplayLabel: 'Practice Finance Lead',
    dotnetRoleGrantsCode: 'FinanceManager / FinanceReviewer / RelationshipManager',
    staffingOrSpecializationNote:
      'Covers commercial proposal/billing preparation (FinanceManager, RelationshipManager) and maker-checker invoice approval (FinanceReviewer).',
  },
  {
    guideRoleCode: 'CLIENT_PRIMARY',
    guideDisplayLabel: 'Client Finance Lead',
    dotnetRoleGrantsCode: 'ClientUser (Primary Contact)',
    staffingOrSpecializationNote:
      'ClientUser with primary contact / PBC request owner capability and Key 1 commercial acceptance authority (M1-03).',
  },
  {
    guideRoleCode: 'CLIENT_CONTRIBUTOR',
    guideDisplayLabel: 'Client Contributor',
    dotnetRoleGrantsCode: 'ClientUser (Contributor)',
    staffingOrSpecializationNote:
      'ClientUser scoped to CLIENT or ENGAGEMENT for uploading PBC evidence and replying to threads.',
  },
  {
    guideRoleCode: 'CLIENT_VIEWER',
    guideDisplayLabel: 'Client Observer',
    dotnetRoleGrantsCode: 'ClientUser (Observer)',
    staffingOrSpecializationNote:
      'Read-only Client Portal observer for executive/board status tracking and final report downloads.',
  },
];

export const LIFECYCLE_PHASES: LifecyclePhaseRow[] = [
  {
    phaseNumber: 1,
    phase: '1. Onboarding',
    shortTitle: 'Dual-Key + Retainer Gate',
    evidenceTrigger:
      'Key 1 (CLIENT_PRIMARY Acceptance) + Key 2 (ENGAGEMENT_PARTNER Clearance) + Key 3 (FIRM_FINANCE Retainer Paid)',
    firmFinance:
      'Issues retainer invoice and records Retainer Paid Clearance (Key 3) once funds settle.',
    engagementPartner:
      'Evaluates independence & engagement risk; executes Partner Clearance Key (Key 2).',
    qualityReviewer: 'Not active until Planning / EQCR assignment.',
    auditManager:
      'Prepares draft engagement profile and initial team roster.',
    seniorAndStaff:
      'Locked out of fieldwork editing until all 3 onboarding keys are green.',
    clientPrimary:
      'Signs engagement terms and executes Client Acceptance Key (Key 1) in the Client Portal.',
    clientContributorAndViewer:
      'Portal access remains in read-only onboarding state until activation completes.',
  },
  {
    phaseNumber: 2,
    phase: '2. Planning',
    shortTitle: 'Materiality, SRM & Workplans',
    evidenceTrigger:
      'Partner lock on Materiality thresholds & Significant Risk Matrix (SRM) + Manager workplan publication',
    firmFinance: 'Monitors budget and billing schedule.',
    engagementPartner:
      'Approves overall audit strategy, materiality thresholds, and locks the Significant Risk Matrix (SRM).',
    qualityReviewer:
      'Reviews planning materiality and significant risk judgments on high-risk engagements.',
    auditManager:
      'Configures engagement workplans, budgets, task assignments, and issues initial PBC request lists.',
    seniorAndStaff:
      'Imports opening Trial Balance / General Ledger and sets up lead schedules.',
    clientPrimary:
      'Reviews PBC request schedule and assigns internal client target dates.',
    clientContributorAndViewer:
      'CLIENT_CONTRIBUTOR receives assigned PBC items; CLIENT_VIEWER tracks planning milestone.',
  },
  {
    phaseNumber: 3,
    phase: '3. Fieldwork',
    shortTitle: 'TB/GL, PBC Evidence & Testing',
    evidenceTrigger:
      'Uploaded PBC evidence + completed working papers + Senior first-level review (No Self-Review)',
    firmFinance: 'Tracks WIP realization and progress billing milestones.',
    engagementPartner: 'Oversees significant risk procedures and consultations.',
    qualityReviewer: 'Monitors emerging significant audit matters.',
    auditManager:
      'Monitors fieldwork progress, resolves PBC bottlenecks, and manages budget variance.',
    seniorAndStaff:
      'STAFF_AUDITOR prepares working papers; SENIOR_AUDITOR executes complex testing and performs first-level review of Staff work.',
    clientPrimary:
      'Oversees client evidence submissions and approves Trial Balance / GL exports.',
    clientContributorAndViewer:
      'CLIENT_CONTRIBUTOR uploads invoices, bank statements, and reconciliations to PBC items.',
  },
  {
    phaseNumber: 4,
    phase: '4. Manager Review',
    shortTitle: 'Workpaper & Package Review',
    evidenceTrigger:
      'AUDIT_MANAGER sign-off on all fieldwork sections & financial reconciliations (PreparedByUserId != ReviewerUserId)',
    firmFinance: '—',
    engagementPartner: 'Reviews escalated high-risk findings and proposed adjustments.',
    qualityReviewer: 'Begins independent inspection of completed high-risk sections.',
    auditManager:
      'Performs primary Managerial Review across all working papers, financial statement packages, and consolidation schedules.',
    seniorAndStaff:
      'Clears review notes raised by AUDIT_MANAGER and updates supporting schedules.',
    clientPrimary:
      'Reviews proposed audit adjustments and responds to management inquiries.',
    clientContributorAndViewer:
      'Provides supplemental evidence for reopened PBC items.',
  },
  {
    phaseNumber: 5,
    phase: '5. Partner Sign-off',
    shortTitle: 'EQCR Concurrence & Opinion',
    evidenceTrigger:
      'CLIENT_PRIMARY Adjustment & LOR approval + QUALITY_REVIEWER EQCR Concurrence (M2-02) + ENGAGEMENT_PARTNER Final Sign-Off',
    firmFinance: 'Prepares final completion invoice.',
    engagementPartner:
      'Completes final Partner review of all high-risk areas and signs off on the financial package after EQCR concurrence.',
    qualityReviewer:
      'Evaluates significant judgments, verifies all EQCR notes are resolved, and records formal EQCR Concurrence (M2-02).',
    auditManager:
      'Ensures all review notes are closed and assembles the final completion memo.',
    seniorAndStaff: 'Finalizes working paper cross-references.',
    clientPrimary:
      'Formally approves proposed audit adjustments and signs the Management Representation Letter (LOR).',
    clientContributorAndViewer:
      'CLIENT_VIEWER (Audit Committee / Board) reviews near-final draft package.',
  },
  {
    phaseNumber: 6,
    phase: '6. Report & Delivery',
    shortTitle: 'Signed Audit Report Release',
    evidenceTrigger:
      'ENGAGEMENT_PARTNER issues signed Audit Opinion & releases deliverable package to Client Portal',
    firmFinance: 'Issues final fee invoice and tracks settlement.',
    engagementPartner:
      'Issues the final signed Audit Report and releases the financial statement package to the Client Portal.',
    qualityReviewer: 'Concurrence sealed in permanent engagement record.',
    auditManager: 'Coordinates final deliverable transmission to the client.',
    seniorAndStaff: '—',
    clientPrimary:
      'Downloads the final signed audit report and financial statement package from the Client Portal.',
    clientContributorAndViewer:
      'CLIENT_VIEWER downloads final published audit report and board deliverables.',
  },
  {
    phaseNumber: 7,
    phase: '7. Archive & Close',
    shortTitle: 'Immutable Binder Lock',
    evidenceTrigger:
      'ENGAGEMENT_PARTNER executes Archive Lock; temporary ENGAGEMENT grants expire cleanly at midnight UTC',
    firmFinance: 'Closes engagement billing code.',
    engagementPartner:
      'Executes final Archive Lock, sealing the engagement binder into immutable read-only retention.',
    qualityReviewer: 'Read-only archived record.',
    auditManager: 'Verifies archive completeness checklist.',
    seniorAndStaff:
      'Temporary ENGAGEMENT grants expire automatically on their Expiry Date.',
    clientPrimary:
      'Retains read-only access to published deliverables archive in the Client Portal.',
    clientContributorAndViewer:
      'PBC upload queues close permanently; CLIENT_VIEWER retains archive access.',
  },
];

export const CAPABILITY_MATRIX: CapabilityMatrixRow[] = [
  {
    moduleName: 'Practice & Commercial',
    moduleSubtitle: 'Client onboarding, proposals, Dual-Key acceptance (M1-03)',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Executes Partner Clearance Key (Key 2), approves commercial terms, and unlocks engagement.',
      },
      QUALITY_REVIEWER: {
        level: 'View',
        note: 'Reads engagement acceptance and independence documentation.',
      },
      AUDIT_MANAGER: {
        level: 'Edit',
        note: 'Creates draft engagement profiles and prepares commercial scope.',
      },
      SENIOR_AUDITOR: {
        level: 'View',
        note: 'Views engagement onboarding status and scope summary.',
      },
      STAFF_AUDITOR: {
        level: 'None',
        note: 'No access to commercial onboarding or proposals.',
      },
      ADMINISTRATOR: {
        level: 'View',
        note: 'Views directory-level client records for access binding.',
      },
      FIRM_FINANCE: {
        level: 'Full',
        note: 'Manages fee schedules and records Retainer Paid Clearance (Key 3).',
      },
      CLIENT_PRIMARY: {
        level: 'None',
        note: 'Uses Client Portal (executes Key 1 in Client Portal).',
      },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'No Staff Portal access.' },
      CLIENT_VIEWER: { level: 'None', note: 'No Staff Portal access.' },
    },
  },
  {
    moduleName: 'Workflow & Tasks',
    moduleSubtitle: 'Engagement workplans, task assignments, milestone tracking',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Approves overall workplan, materiality, and milestone sign-offs.',
      },
      QUALITY_REVIEWER: {
        level: 'View',
        note: 'Monitors workflow completion and EQCR gate status.',
      },
      AUDIT_MANAGER: {
        level: 'Full',
        note: 'Creates workplans, configures budgets, and assigns tasks to Seniors and Staff.',
      },
      SENIOR_AUDITOR: {
        level: 'Edit',
        note: 'Updates task progress, coordinates fieldwork steps, and assigns sub-tasks.',
      },
      STAFF_AUDITOR: {
        level: 'Assigned',
        note: 'Views and updates status on personally assigned audit tasks.',
      },
      ADMINISTRATOR: {
        level: 'None',
        note: 'No access to engagement workflow execution.',
      },
      FIRM_FINANCE: {
        level: 'View',
        note: 'Views milestone completion for progress billing.',
      },
      CLIENT_PRIMARY: { level: 'None', note: 'No Staff Portal access.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'No Staff Portal access.' },
      CLIENT_VIEWER: { level: 'None', note: 'No Staff Portal access.' },
    },
  },
  {
    moduleName: 'Client Accounting & Reporting',
    moduleSubtitle: 'Trial Balance (TB), General Ledger (GL), adjustments, financial statements',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Final Partner sign-off on financial statement packages and adjustments.',
      },
      QUALITY_REVIEWER: {
        level: 'Review',
        note: 'Inspects financial statements, adjustments, and accounting judgments.',
      },
      AUDIT_MANAGER: {
        level: 'Review',
        note: 'Drafts and performs Managerial Review on financial statement packages and reconciliations.',
      },
      SENIOR_AUDITOR: {
        level: 'Prepare',
        note: 'Imports client TB/GL, prepares lead schedules, and proposes audit adjustments.',
      },
      STAFF_AUDITOR: {
        level: 'Prepare',
        note: 'Prepares assigned account reconciliations and supporting schedules.',
      },
      ADMINISTRATOR: {
        level: 'None',
        note: 'No access to client financial records.',
      },
      FIRM_FINANCE: {
        level: 'None',
        note: 'Isolated from client accounting books (manages firm billing only).',
      },
      CLIENT_PRIMARY: { level: 'None', note: 'Submits TB/GL via Client Portal.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'Uploads schedules via Client Portal.' },
      CLIENT_VIEWER: { level: 'None', note: 'Views final reports via Client Portal.' },
    },
  },
  {
    moduleName: 'Audit & Records',
    moduleSubtitle: 'Working papers, SRM, review notes, EQCR concurrence, archive lock',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Signs off high-risk procedures, issues final audit opinion, and locks archive binder.',
      },
      QUALITY_REVIEWER: {
        level: 'Concur',
        note: 'Raises EQCR notes and issues mandatory EQCR Concurrence (M2-02). Cannot edit workpapers.',
      },
      AUDIT_MANAGER: {
        level: 'Review',
        note: 'Performs primary Manager Review on working papers (cannot self-review own work).',
      },
      SENIOR_AUDITOR: {
        level: 'Prepare',
        note: 'Prepares complex workpapers and performs first-level Senior review of Staff work.',
      },
      STAFF_AUDITOR: {
        level: 'Prepare',
        note: 'Prepares assigned working papers and uploads audit evidence (zero review authority).',
      },
      ADMINISTRATOR: {
        level: 'None',
        note: 'ADR-0003: Cannot view or alter audit working papers or sign opinions.',
      },
      FIRM_FINANCE: {
        level: 'None',
        note: 'Cannot view confidential audit working papers or EQCR notes.',
      },
      CLIENT_PRIMARY: { level: 'None', note: 'Never sees internal working papers.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'Never sees internal working papers.' },
      CLIENT_VIEWER: { level: 'None', note: 'Never sees internal working papers.' },
    },
  },
  {
    moduleName: 'Firm Finance',
    moduleSubtitle: 'Retainer invoicing, Paid Advance clearance (M1-03), WIP & realization',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'View',
        note: 'Views engagement billing realization, WIP, and retainer clearance status.',
      },
      QUALITY_REVIEWER: {
        level: 'None',
        note: 'No access to commercial billing operations.',
      },
      AUDIT_MANAGER: {
        level: 'View',
        note: 'Views engagement budget vs. actual WIP and billing milestones.',
      },
      SENIOR_AUDITOR: { level: 'None', note: 'No access to Firm Finance.' },
      STAFF_AUDITOR: { level: 'None', note: 'No access to Firm Finance.' },
      ADMINISTRATOR: {
        level: 'None',
        note: 'ADR-0003: Administrator does not hold Finance authority.',
      },
      FIRM_FINANCE: {
        level: 'Full',
        note: 'Creates retainer invoices, reconciles payments, and records Paid Advance clearance.',
      },
      CLIENT_PRIMARY: { level: 'None', note: 'No Staff Portal access.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'No Staff Portal access.' },
      CLIENT_VIEWER: { level: 'None', note: 'No Staff Portal access.' },
    },
  },
  {
    moduleName: 'People & Time',
    moduleSubtitle: 'Staffing allocations, timesheets, expense logging',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Approves partner-level resource plans and engagement staffing.',
      },
      QUALITY_REVIEWER: {
        level: 'View',
        note: 'Logs own EQCR time and views engagement team independence roster.',
      },
      AUDIT_MANAGER: {
        level: 'Full',
        note: 'Coordinates engagement staffing, budgets, and approves team timesheets.',
      },
      SENIOR_AUDITOR: {
        level: 'Edit',
        note: 'Logs personal time/expenses and coordinates field team schedules.',
      },
      STAFF_AUDITOR: {
        level: 'Prepare',
        note: 'Records personal daily timesheets and expense entries.',
      },
      ADMINISTRATOR: {
        level: 'Admin',
        note: 'Maintains staff directory records and roster identity bindings.',
      },
      FIRM_FINANCE: {
        level: 'View',
        note: 'Views approved timesheets and billing rates for WIP invoicing.',
      },
      CLIENT_PRIMARY: { level: 'None', note: 'Never sees staff timesheets.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'Never sees staff timesheets.' },
      CLIENT_VIEWER: { level: 'None', note: 'Never sees staff timesheets.' },
    },
  },
  {
    moduleName: 'Group Consolidation',
    moduleSubtitle: 'Multi-entity group audit schedules, intercompany eliminations',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Signs off on consolidated group financial packages and group audit opinion.',
      },
      QUALITY_REVIEWER: {
        level: 'Review',
        note: 'Reviews group consolidation judgments and component auditor clearances.',
      },
      AUDIT_MANAGER: {
        level: 'Full',
        note: 'Drafts and reviews group consolidation schedules when granted GROUP scope.',
      },
      SENIOR_AUDITOR: {
        level: 'Prepare',
        note: 'Prepares consolidation schedules and intercompany eliminations (with GROUP scope).',
      },
      STAFF_AUDITOR: {
        level: 'None',
        note: 'Cannot hold GROUP scope.',
      },
      ADMINISTRATOR: {
        level: 'None',
        note: 'No access to group consolidation financial data.',
      },
      FIRM_FINANCE: {
        level: 'None',
        note: 'No access to group consolidation working papers.',
      },
      CLIENT_PRIMARY: {
        level: 'None',
        note: 'Submits group/subsidiary PBCs via Client Portal when granted GROUP scope.',
      },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'Cannot hold GROUP scope.' },
      CLIENT_VIEWER: {
        level: 'None',
        note: 'Views group status in Client Portal when granted GROUP scope.',
      },
    },
  },
  {
    moduleName: 'Client Portal',
    moduleSubtitle: 'Isolated external workspace (/portal) for PBC uploads & client sign-offs',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'View',
        note: 'Monitors client acceptance status and published deliverables.',
      },
      QUALITY_REVIEWER: {
        level: 'None',
        note: 'Reviews evidence inside Staff Portal Audit & Records.',
      },
      AUDIT_MANAGER: {
        level: 'Full',
        note: 'Creates, issues, and reopens PBC requests visible in the Client Portal.',
      },
      SENIOR_AUDITOR: {
        level: 'Edit',
        note: 'Issues PBC requests and accepts or returns client-uploaded files.',
      },
      STAFF_AUDITOR: {
        level: 'View',
        note: 'Views and downloads client-submitted PBC files for assigned engagement.',
      },
      ADMINISTRATOR: {
        level: 'None',
        note: 'Provisions client grants and invitation links; does not view PBC files.',
      },
      FIRM_FINANCE: {
        level: 'None',
        note: 'No access to Client Portal PBC evidence.',
      },
      CLIENT_PRIMARY: {
        level: 'Full',
        note: 'Executes Key 1 acceptance, submits TB/GL & PBCs, approves adjustments, downloads reports.',
      },
      CLIENT_CONTRIBUTOR: {
        level: 'Upload',
        note: 'Uploads requested PBC documents and adds comments on assigned items.',
      },
      CLIENT_VIEWER: {
        level: 'View',
        note: 'Read-only view of progress dashboards and final published deliverables.',
      },
    },
  },
  {
    moduleName: 'Administration',
    moduleSubtitle: 'Users & Access (/admin/access), roster bindings, role grants, Entra status',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'None',
        note: 'Must request role grants via ADMINISTRATOR.',
      },
      QUALITY_REVIEWER: { level: 'None', note: 'No admin console access.' },
      AUDIT_MANAGER: { level: 'None', note: 'No admin console access.' },
      SENIOR_AUDITOR: { level: 'None', note: 'No admin console access.' },
      STAFF_AUDITOR: { level: 'None', note: 'No admin console access.' },
      ADMINISTRATOR: {
        level: 'Full',
        note: 'Full access to /admin/access, /admin/roles, and /admin/directory at FIRM_WIDE scope.',
      },
      FIRM_FINANCE: { level: 'None', note: 'No admin console access.' },
      CLIENT_PRIMARY: { level: 'None', note: 'Blocked by staffPortalGuard & adminRoleGuard.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'Blocked by staffPortalGuard & adminRoleGuard.' },
      CLIENT_VIEWER: { level: 'None', note: 'Blocked by staffPortalGuard & adminRoleGuard.' },
    },
  },
  {
    moduleName: 'Knowledge Library',
    moduleSubtitle: 'Audit methodology templates, accounting standards, firm guidance',
    cells: {
      ENGAGEMENT_PARTNER: {
        level: 'Full',
        note: 'Reads and approves methodology guidance and firm templates.',
      },
      QUALITY_REVIEWER: {
        level: 'Full',
        note: 'Consults and curates technical quality standards.',
      },
      AUDIT_MANAGER: {
        level: 'Edit',
        note: 'Contributes templates and references audit methodology.',
      },
      SENIOR_AUDITOR: {
        level: 'View',
        note: 'Reads audit programmes, sampling guides, and accounting standards.',
      },
      STAFF_AUDITOR: {
        level: 'View',
        note: 'Reads foundational audit procedures and workpaper guides.',
      },
      ADMINISTRATOR: {
        level: 'Admin',
        note: 'Manages library categories and system template availability.',
      },
      FIRM_FINANCE: {
        level: 'View',
        note: 'Reads commercial and billing policy guides.',
      },
      CLIENT_PRIMARY: { level: 'None', note: 'Internal staff library only.' },
      CLIENT_CONTRIBUTOR: { level: 'None', note: 'Internal staff library only.' },
      CLIENT_VIEWER: { level: 'None', note: 'Internal staff library only.' },
    },
  },
];

export const INITIAL_REQUEST_ROWS: RoleRequestRow[] = [
  {
    id: 'req-1',
    fullName: 'Sarah Jenkins',
    workEmail: 's.jenkins@example.com',
    accountType: 'Staff',
    roleRequested: 'ENGAGEMENT_PARTNER',
    scopeType: 'CLIENT',
    scopeTarget: 'Client: Acme Corp',
    startDate: '2026-11-01',
    expiry: '',
    approvedBy: 'Managing Partner',
    notes: 'Lead signing partner for Acme Corp',
  },
  {
    id: 'req-2',
    fullName: 'Marcus Vance',
    workEmail: 'm.vance@example.com',
    accountType: 'Staff',
    roleRequested: 'AUDIT_MANAGER',
    scopeType: 'ENGAGEMENT',
    scopeTarget: 'Engagement: FY2026 Audit - Acme Corp',
    startDate: '2026-11-01',
    expiry: '2027-04-30',
    approvedBy: 'Sarah Jenkins',
    notes: 'Primary manager reviewing fieldwork',
  },
  {
    id: 'req-3',
    fullName: 'Elena Rostova',
    workEmail: 'e.rostova@example.com',
    accountType: 'Staff',
    roleRequested: 'ADMINISTRATOR',
    scopeType: 'FIRM_WIDE',
    scopeTarget: 'Firm-Wide',
    startDate: '2026-11-01',
    expiry: '',
    approvedBy: 'Managing Partner',
    notes: 'Operations Manager handling user access',
  },
  {
    id: 'req-4',
    fullName: 'David Chen',
    workEmail: 'd.chen@client-example.com',
    accountType: 'Client',
    roleRequested: 'CLIENT_PRIMARY',
    scopeType: 'CLIENT',
    scopeTarget: 'Client: Acme Corp',
    startDate: '2026-11-05',
    expiry: '2027-06-30',
    approvedBy: 'Sarah Jenkins',
    notes: 'Acme Corp CFO (executes Client Acceptance Key)',
  },
  {
    id: 'req-5',
    fullName: 'Sarah Miller',
    workEmail: 's.miller@client-example.com',
    accountType: 'Client',
    roleRequested: 'CLIENT_CONTRIBUTOR',
    scopeType: 'ENGAGEMENT',
    scopeTarget: 'Engagement: FY2026 Audit - Acme Corp',
    startDate: '2026-11-05',
    expiry: '2027-03-31',
    approvedBy: 'David Chen',
    notes: 'Uploads AP/AR schedules for PBC requests',
  },
];

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'Q1',
    category: 'Identity & Sign-In',
    question: 'Q1: Can we use a shared email address like accounts@client.com or audit-team@example.com?',
    answer:
      'No. AuditSphere enforces strict individual accountability and Separation of Duties (No Self-Review). Every action is logged against an individual Microsoft Entra Object ID. Shared mailboxes cannot be bound to a roster identity.',
  },
  {
    id: 'Q2',
    category: 'Identity & Sign-In',
    question: 'Q2: Can a user sign in with a personal @gmail.com or @yahoo.com address?',
    answer:
      'No. Users must sign in with a work email address managed through Microsoft Entra ID (either your organization’s federated Microsoft 365 domain or a corporate B2B guest identity).',
  },
  {
    id: 'Q3',
    category: 'Roles & Scopes',
    question: 'Q3: Can one person hold different roles on different engagements?',
    answer:
      'Yes. Because access is defined as Role + Scope, a staff member can be a SENIOR_AUDITOR on Engagement A and an AUDIT_MANAGER on Engagement B. However, they cannot hold conflicting roles on the same engagement (for example, ENGAGEMENT_PARTNER and QUALITY_REVIEWER on the same audit).',
  },
  {
    id: 'Q4',
    category: 'Separation of Duties',
    question: 'Q4: Why can’t our Firm Administrator sign off on a stuck workpaper or unlock an engagement?',
    answer:
      'By architectural design (ADR-0003), ADMINISTRATOR privileges are strictly separated from professional audit authority. Administrators manage users and bindings; only an ENGAGEMENT_PARTNER can clear Partner keys or sign opinions.',
  },
  {
    id: 'Q5',
    category: 'Separation of Duties',
    question: 'Q5: Why is our new engagement still showing as "Locked" even after the Partner approved it?',
    answer:
      'AuditSphere requires three conditions to activate an engagement (M1-03): (1) Client Acceptance Key from CLIENT_PRIMARY, (2) Partner Clearance Key from ENGAGEMENT_PARTNER, and (3) Retainer Paid Clearance recorded by FIRM_FINANCE. Check which of the three indicators is still pending.',
  },
  {
    id: 'Q6',
    category: 'Access Lifecycle',
    question: 'Q6: What happens if a user tries to sign in before the Administrator enters their Role Grant?',
    answer:
      'Microsoft Entra ID will verify their password, but AuditSphere’s server guard will block entry to all workspaces and display an "Access Pending Roster Binding" screen until an Administrator completes the grant.',
  },
  {
    id: 'Q7',
    category: 'Roles & Scopes',
    question: 'Q7: Can a Client Finance Lead (CLIENT_PRIMARY) invite their own team members directly inside the portal?',
    answer:
      'No. To maintain strict audit perimeter security, all Client Portal users must be requested via the Role Assignment Request form and bound by the Firm Administrator.',
  },
  {
    id: 'Q8',
    category: 'Access Lifecycle',
    question: 'Q8: Do we need to manually remove seasonal interns or external client contractors after the audit?',
    answer:
      'If you provide an Expiry Date on the request form, AuditSphere will automatically deactivate their grant at midnight UTC on that date. You can also request immediate revocation at any time.',
  },
];

export const GLOSSARY_ITEMS: GlossaryItem[] = [
  {
    term: 'Scope',
    codeOrAcronym: 'FIRM_WIDE | GROUP | CLIENT | ENGAGEMENT',
    definition:
      'The boundary of data a role is allowed to see (Firm-Wide, Group, Client, or Engagement).',
  },
  {
    term: 'Grant (RoleGrant)',
    codeOrAcronym: 'RoleGrant',
    definition:
      'A specific permission record combining one User, one Role, one Scope, and an optional Expiry Date.',
  },
  {
    term: 'Engagement',
    codeOrAcronym: 'ENG',
    definition:
      'A distinct audit or assurance project for a specific client and financial period (e.g., FY2026 Statutory Audit).',
  },
  {
    term: 'PBC (Provided by Client)',
    codeOrAcronym: 'PBC',
    definition:
      'A formal checklist item requesting specific financial documents or schedules from the client team via the Client Portal.',
  },
  {
    term: 'TB / GL',
    codeOrAcronym: 'Trial Balance / General Ledger',
    definition:
      'Trial Balance and General Ledger — the foundational accounting data imported from the client’s ERP system.',
  },
  {
    term: 'SRM (Significant Risk Matrix)',
    codeOrAcronym: 'SRM',
    definition:
      'The audit planning register linking identified financial statement risks to specific audit procedures.',
  },
  {
    term: 'Dual-Key Acceptance',
    codeOrAcronym: 'M1-03',
    definition:
      'The security control requiring both the Client Finance Lead (Key 1) and the Engagement Partner (Key 2), plus verified retainer payment (Key 3), before an engagement unlocks.',
  },
  {
    term: 'EQCR (Engagement Quality Control Review)',
    codeOrAcronym: 'M2-02 / EQCR',
    definition:
      'An independent evaluation of significant audit judgments performed by a QUALITY_REVIEWER who is not part of the engagement delivery team.',
  },
];

export const ADMIN_WALKTHROUGH_STEPS: AdminWalkthroughStep[] = [
  {
    stepNumber: 1,
    title: 'Search Local Users & Directory',
    route: '/admin/directory',
    summary:
      'Before creating a new record, search the existing AuditSphere roster by work email or display name to avoid duplicate bindings.',
    checklist: [
      'Navigate to Administration → Directory (/admin/directory).',
      'Filter by exact work email (e.g. s.jenkins@example.com) or Account Type (Staff vs. Client).',
      'Inspect whether the user is already Bound (Entra Object ID linked) or Pending Invitation.',
    ],
    guardrailNote:
      'Enforced on the server by RoleAdministrationService and guarded in the UI by adminRoleGuard.',
  },
  {
    stepNumber: 2,
    title: 'Bind a Roster Identity',
    route: '/admin/access',
    summary:
      'Link the approved work email address to a Staff or Client roster profile before assigning any RoleGrants.',
    checklist: [
      'Click "Bind Roster Identity" in the Users & Access toolbar.',
      'Enter Full Name, exact Microsoft Sign-In Work Email, and Account Type (Staff or Client).',
      'Verify corporate domain compliance (reject @gmail.com, @yahoo.com, or shared mailboxes like accounts@).',
    ],
    guardrailNote:
      'Account Type locks which roles can be assigned: Staff accounts can only receive Staff roles; Client accounts can only receive Client Portal roles.',
  },
  {
    stepNumber: 3,
    title: 'Assign Role & Scope Dialog',
    route: '/admin/access',
    summary:
      'Open the Assign Role & Scope modal for the bound user to create a scoped RoleGrant record.',
    checklist: [
      'Select the requested Role (filtered automatically by the user’s Staff/Client account type).',
      'Select Scope Type (FIRM_WIDE, GROUP, CLIENT, or ENGAGEMENT) restricted by AllowedScopes.',
      'Pick the specific Target Entity (e.g. Client: Acme Corp or Engagement: FY2026 Audit - Acme Corp).',
      'Set Start Date, optional Expiry Date (auto-revokes at 00:00 UTC), and Approver reference.',
    ],
    guardrailNote:
      'The server rejects invalid Role + Scope combinations (e.g., STAFF_AUDITOR at FIRM_WIDE or CLIENT_PRIMARY at FIRM_WIDE) and blocks conflicting EQCR assignments (M2-02).',
  },
  {
    stepNumber: 4,
    title: 'Generate External Invitation / Copy Link',
    route: '/admin/access',
    summary:
      'Because live Microsoft Graph provisioning flags are disabled by default (BLOCKED_EXTERNAL), use the manual invitation link flow.',
    checklist: [
      'Check tenant capability indicators: TENANT_USER_PROVISIONING, GUEST_INVITATION, and GROUP_MEMBERSHIP show "Disabled by Policy (Manual Flow Active)".',
      'Click "Generate External Invitation" next to the newly created grant.',
      'Click "Copy Invitation Link" to copy the single-use onboarding URL and send it to the user.',
      'Upon first Microsoft Entra ID sign-in, AuditSphere binds their immutable oid + tid claims to the roster record.',
    ],
    guardrailNote:
      'Client Portal users will authenticate via Entra ID, complete their roster binding, and land in the Client Portal once all three M1-03 activation gates are green.',
  },
];

export const EVIDENCE_ROWS: EvidenceRow[] = [
  {
    claimId: 'EV-01',
    capabilityOrRule:
      '10 Role Identifiers (ENGAGEMENT_PARTNER, QUALITY_REVIEWER, AUDIT_MANAGER, SENIOR_AUDITOR, STAFF_AUDITOR, ADMINISTRATOR, FIRM_FINANCE, CLIENT_PRIMARY, CLIENT_CONTRIBUTOR, CLIENT_VIEWER) & Scope Enums (FIRM_WIDE, GROUP, CLIENT, ENGAGEMENT)',
    filePath: 'src/AuditSphereOps.Domain/Users/RoleGrants.cs',
    symbolOrType: 'RoleGrant, RoleIdentifier, GrantScopeType',
    verificationCategory: 'Domain & Grants',
  },
  {
    claimId: 'EV-02',
    capabilityOrRule:
      'Server-side Command & Query to Role-Scope Authorization Matrix',
    filePath: 'src/AuditSphereOps.Application/Authorization/CommandRoleMatrix.cs',
    symbolOrType: 'CommandRoleMatrix, AuthorizeGrantScopeAsync',
    verificationCategory: 'Domain & Grants',
  },
  {
    claimId: 'EV-03',
    capabilityOrRule:
      'Admin UI Role Definitions, Allowed Scopes, and Assign Role & Scope Dialog Contracts',
    filePath:
      'src/AuditSphereOps.Ui/src/app/features/admin/roles.ts, access.ts, access-contracts.ts, directory.ts',
    symbolOrType: 'ROLE_DEFINITIONS, AssignRoleGrantRequest, DirectoryBindingStatus',
    verificationCategory: 'UI & Guards',
  },
  {
    claimId: 'EV-04',
    capabilityOrRule:
      'Portal Route Guards (staffPortalGuard, clientPortalGuard, adminRoleGuard) & Presentation-Only can* Flags',
    filePath: 'src/AuditSphereOps.Ui/src/app/app.routes.ts',
    symbolOrType: 'appRoutes, staffPortalGuard, clientPortalGuard, adminRoleGuard',
    verificationCategory: 'UI & Guards',
  },
  {
    claimId: 'EV-05',
    capabilityOrRule:
      'Dual-Key Engagement Acceptance + Paid Retainer Activation Gate (M1-03)',
    filePath:
      'docs/requirements/auditsphere-accounting-module-requirements-current.md',
    symbolOrType: 'Requirement M1-03 (Dual-Key Acceptance & Retainer Gate)',
    verificationCategory: 'Requirements & ADR',
  },
  {
    claimId: 'EV-06',
    capabilityOrRule:
      'Independent Engagement Quality Review (EQCR) & No Self-Review Enforcement (M2-02)',
    filePath:
      'docs/requirements/auditsphere-accounting-module-requirements-current.md',
    symbolOrType: 'Requirement M2-02 (Roles & Independent Review)',
    verificationCategory: 'Requirements & ADR',
  },
  {
    claimId: 'EV-07',
    capabilityOrRule:
      'Strict Separation of Administrator Access from Partner Signing Authority (ADR-0003)',
    filePath:
      'docs/requirements/auditsphere-accounting-module-requirements-current.md',
    symbolOrType: 'ADR-0003 ("Administrator access does not confer Partner authority")',
    verificationCategory: 'Requirements & ADR',
  },
  {
    claimId: 'EV-08',
    capabilityOrRule:
      'Server-Side Authorization & Separation-of-Duties Automated Test Suite',
    filePath:
      'tests/AuditSphereOps.Authorization.Tests/RoleGrantAuthorizationTests.cs, NoSelfReviewTests.cs',
    symbolOrType: 'RoleGrantAuthorizationTests, NoSelfReviewTests',
    verificationCategory: 'Server Tests',
  },
  {
    claimId: 'EV-09',
    capabilityOrRule:
      'Execution Status & BLOCKED_EXTERNAL Gates (TENANT_USER_PROVISIONING, GUEST_INVITATION, GROUP_MEMBERSHIP)',
    filePath: 'docs/execution/status.json',
    symbolOrType: 'externalGates.microsoftGraphProvisioning = "BLOCKED_EXTERNAL"',
    verificationCategory: 'Requirements & ADR',
  },
];

export const OPEN_QUESTIONS: OpenQuestionRow[] = [
  {
    id: 'TO CONFIRM-01',
    topic: 'Client Observer (CLIENT_VIEWER) Access to Draft Financial Statements',
    observedCodeBehavior:
      'CommandRoleMatrix.cs restricts CLIENT_VIEWER to read-only published deliverables (GetPublishedDeliverablesQuery).',
    questionToConfirm:
      'Confirm with product owner whether Audit Committee observers should ever preview watermarked draft packages prior to Phase 6 Report & Delivery.',
  },
  {
    id: 'TO CONFIRM-02',
    topic: 'Grace Period Notification Window Before Automatic Grant Expiry',
    observedCodeBehavior:
      'RoleGrants.cs enforces automatic midnight UTC deactivation on ExpiresAtUtc, but the email reminder lead-time (e.g., 7 days prior) is pending notification worker wiring in status.json.',
    questionToConfirm:
      'Confirm desired advance warning window (e.g., 7 days vs. 3 days before expiry) once the notification worker is enabled.',
  },
  {
    id: 'TO CONFIRM-03',
    topic: 'Multi-Partner Sign-Off (Joint Audits / Component Partners)',
    observedCodeBehavior:
      'Current M1-03 and Phase 5 sign-off logic binds a single primary ENGAGEMENT_PARTNER key per engagement scope.',
    questionToConfirm:
      'Confirm whether joint-audit engagements require co-signing by two ENGAGEMENT_PARTNER grants on the same engagement.',
  },
];

export interface DeliverableItem {
  id: 'D1' | 'D2' | 'D3' | 'D4' | 'D5';
  title: string;
  repoPath: string;
  downloadHref?: string;
  format: string;
  status: string;
  summary: string;
}

export const DELIVERABLES_LIST: DeliverableItem[] = [
  {
    id: 'D1',
    title: 'Canonical Markdown End-User Guide (with Mermaid Diagrams)',
    repoPath: 'docs/user-guides/auditsphere-user-guide-roles-and-access-current.md',
    downloadHref: '/deliverables/auditsphere-user-guide-roles-and-access-current.md',
    format: 'Markdown (.md)',
    status: 'Implemented & Verified',
    summary:
      'Complete 13-section end-user guide with 6 Mermaid diagrams (Diagrams A–F), 10 Role Cards, 7-phase Engagement Lifecycle matrix, 10x10 Capability Matrix, Decision Tree, Request Template, FAQ, Glossary, and Evidence Appendices.',
  },
  {
    id: 'D2',
    title: 'Self-Contained Single-File HTML Guide (Pre-Rendered SVG Diagrams)',
    repoPath: 'docs/user-guides/auditsphere-user-guide-roles-and-access-current.html',
    downloadHref: '/deliverables/auditsphere-user-guide-roles-and-access-current.html',
    format: 'Self-Contained HTML5 (.html)',
    status: 'Implemented & Verified',
    summary:
      'Zero external CDN or runtime network requests. Pre-rendered inline SVG diagrams, responsive down to 380px, print-friendly @media print rules, Light/Dark theme support, sticky TOC, and collapsible <details> role cards.',
  },
  {
    id: 'D3',
    title: 'Print-Ready PDF Export of D2',
    repoPath: 'docs/user-guides/auditsphere-user-guide-roles-and-access-current.pdf',
    downloadHref: '/deliverables/auditsphere-user-guide-roles-and-access-current.pdf',
    format: 'PDF (.pdf)',
    status: 'Generated without adding product dependencies',
    summary:
      'Generated directly from the self-contained HTML guide via headless Chromium print rendering with zero product dependencies added to package.json.',
  },
  {
    id: 'D4',
    title: 'Role Assignment Request Template (CSV + Interactive Builder)',
    repoPath: 'docs/user-guides/role-assignment-request-template.csv',
    downloadHref: '/deliverables/role-assignment-request-template.csv',
    format: 'CSV (.csv)',
    status: 'Implemented & Verified',
    summary:
      '9-column CSV template pre-populated with worked examples (Sarah Jenkins, Marcus Vance, Elena Rostova, David Chen, Sarah Miller) using @example.com / @client-example.com placeholders.',
  },
  {
    id: 'D5',
    title: 'Documentation Index & README Links Update',
    repoPath: 'docs/auditsphere-docs-index.md & README.md',
    format: 'Repo Index Updates',
    status: 'Implemented & Verified',
    summary:
      'Links D1 (Markdown), D2 (Self-Contained HTML), and D4 (CSV Template) under User & Onboarding Guides in docs/auditsphere-docs-index.md and the root README.md Documentation table.',
  },
];
