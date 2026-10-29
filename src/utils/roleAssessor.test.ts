import test from 'node:test';
import assert from 'node:assert/strict';
import {
  detectSeparationOfDutiesWarnings,
  evaluateDualKeyGate,
  evaluateSeparationOfDuties,
  exportRequestsToCsv,
  recommendRole,
  validateRoleRequestRow,
  validateWorkEmail,
} from './roleAssessor.ts';
import { INITIAL_REQUEST_ROWS, ROLES } from '../data/rolesData.ts';

test('Inventory contains all 10 canonical roles (7 Staff + 3 Client)', () => {
  assert.equal(ROLES.length, 10);
  const staffRoles = ROLES.filter((r) => r.accountType === 'Staff');
  const clientRoles = ROLES.filter((r) => r.accountType === 'Client');
  assert.equal(staffRoles.length, 7);
  assert.equal(clientRoles.length, 3);
});

test('Decision tree recommends all 10 roles accurately along Diagram E paths', () => {
  assert.equal(
    recommendRole({ isExternalClient: true, clientSignsAcceptanceOrTb: true }).role.code,
    'CLIENT_PRIMARY'
  );
  assert.equal(
    recommendRole({
      isExternalClient: true,
      clientSignsAcceptanceOrTb: false,
      clientUploadsPbcDocuments: true,
    }).role.code,
    'CLIENT_CONTRIBUTOR'
  );
  assert.equal(
    recommendRole({
      isExternalClient: true,
      clientSignsAcceptanceOrTb: false,
      clientUploadsPbcDocuments: false,
    }).role.code,
    'CLIENT_VIEWER'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: false,
      staffManagesUsersOrBilling: 'USERS_ACCESS',
    }).role.code,
    'ADMINISTRATOR'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: false,
      staffManagesUsersOrBilling: 'BILLING_RETAINERS',
    }).role.code,
    'FIRM_FINANCE'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: true,
      staffSignsOpinionOrQualityReview: 'ENGAGEMENT_PARTNER',
    }).role.code,
    'ENGAGEMENT_PARTNER'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: true,
      staffSignsOpinionOrQualityReview: 'QUALITY_REVIEWER',
    }).role.code,
    'QUALITY_REVIEWER'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: true,
      staffSignsOpinionOrQualityReview: 'NO',
      staffManagesFieldworkOrReviews: 'AUDIT_MANAGER',
    }).role.code,
    'AUDIT_MANAGER'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: true,
      staffSignsOpinionOrQualityReview: 'NO',
      staffManagesFieldworkOrReviews: 'SENIOR_AUDITOR',
    }).role.code,
    'SENIOR_AUDITOR'
  );
  assert.equal(
    recommendRole({
      isExternalClient: false,
      staffPerformsAuditOrAccounting: true,
      staffSignsOpinionOrQualityReview: 'NO',
      staffManagesFieldworkOrReviews: 'STAFF_AUDITOR',
    }).role.code,
    'STAFF_AUDITOR'
  );
});

test('M1-03 Dual-Key + Retainer gate unlocks only when all 3 keys are true', () => {
  const locked = evaluateDualKeyGate({
    clientAcceptanceKey: true,
    partnerClearanceKey: true,
    retainerPaidClearance: false,
  });
  assert.equal(locked.isActivated, false);
  assert.equal(locked.completedCount, 2);
  assert.equal(locked.missingGates.length, 1);

  const unlocked = evaluateDualKeyGate({
    clientAcceptanceKey: true,
    partnerClearanceKey: true,
    retainerPaidClearance: true,
  });
  assert.equal(unlocked.isActivated, true);
  assert.equal(unlocked.completedCount, 3);
  assert.equal(unlocked.missingGates.length, 0);
});

test('Separation of Duties evaluator enforces No Self-Review, EQCR Independence, and Admin != Partner', () => {
  const selfReview = evaluateSeparationOfDuties({
    actionType: 'WORKPAPER_REVIEW',
    actorRole: 'SENIOR_AUDITOR',
    actorEmail: 'm.vance@example.com',
    preparedByEmail: 'm.vance@example.com',
  });
  assert.equal(selfReview.allowed, false);
  assert.equal(selfReview.ruleCode, 'M2-02_NO_SELF_REVIEW');

  const independentReview = evaluateSeparationOfDuties({
    actionType: 'WORKPAPER_REVIEW',
    actorRole: 'AUDIT_MANAGER',
    actorEmail: 'm.vance@example.com',
    preparedByEmail: 'j.doe@example.com',
  });
  assert.equal(independentReview.allowed, true);

  const adminSignOff = evaluateSeparationOfDuties({
    actionType: 'PARTNER_SIGN_OFF',
    actorRole: 'ADMINISTRATOR',
    actorEmail: 'e.rostova@example.com',
  });
  assert.equal(adminSignOff.allowed, false);
  assert.equal(adminSignOff.ruleCode, 'ADR_0003_ADMIN_BOUNDARY');

  const eqcrSameAsPartner = evaluateSeparationOfDuties({
    actionType: 'EQCR_CONCURRENCE',
    actorRole: 'QUALITY_REVIEWER',
    actorEmail: 's.jenkins@example.com',
    engagementPartnerEmail: 's.jenkins@example.com',
  });
  assert.equal(eqcrSameAsPartner.allowed, false);
  assert.equal(eqcrSameAsPartner.ruleCode, 'M2-02_EQCR_INDEPENDENCE');
});

test('Work email validator rejects personal domains (@gmail.com) and shared mailboxes (accounts@)', () => {
  const gmailCheck = validateWorkEmail('david.chen@gmail.com');
  assert.equal(gmailCheck.valid, false);
  assert.match(gmailCheck.error ?? '', /Personal email domain/);

  const sharedCheck = validateWorkEmail('accounts@client-example.com');
  assert.equal(sharedCheck.valid, false);
  assert.match(sharedCheck.error ?? '', /Shared mailbox/);

  const validCorp = validateWorkEmail('d.chen@client-example.com');
  assert.equal(validCorp.valid, true);
});

test('Initial 5 worked example rows pass validation and export clean CSV', () => {
  for (const row of INITIAL_REQUEST_ROWS) {
    const res = validateRoleRequestRow(row);
    assert.equal(res.isValid, true, `Row ${row.fullName} failed: ${res.errors.join(', ')}`);
  }

  const csv = exportRequestsToCsv(INITIAL_REQUEST_ROWS);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 6); // 1 header + 5 worked examples
  assert.match(lines[1], /Sarah Jenkins,s\.jenkins@example\.com,Staff,ENGAGEMENT_PARTNER/);
});

test('detectSeparationOfDutiesWarnings flags same user holding ENGAGEMENT_PARTNER and QUALITY_REVIEWER', () => {
  const warnings = detectSeparationOfDutiesWarnings([
    ...INITIAL_REQUEST_ROWS,
    {
      id: 'req-conflict',
      fullName: 'Sarah Jenkins',
      workEmail: 's.jenkins@example.com',
      accountType: 'Staff',
      roleRequested: 'QUALITY_REVIEWER',
      scopeType: 'CLIENT',
      scopeTarget: 'Client: Acme Corp',
      startDate: '2026-11-01',
      expiry: '',
      approvedBy: 'Managing Partner',
      notes: 'Conflict test',
    },
  ]);
  assert.equal(warnings.length > 0, true);
  assert.match(warnings[0], /M2-02 Independence Conflict/);
});
