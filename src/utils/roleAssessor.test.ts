import test from 'node:test';
import assert from 'node:assert/strict';
import { ROLES } from '../data/rolesData.ts';
import type { RoleRequestRow } from '../data/rolesData.ts';
import { detectSodFindings, exportRequestsToCsv, recommendRole, validateRequestDetails, validateRoleRequestRow } from './roleAssessor.ts';

const row = (overrides: Partial<RoleRequestRow> = {}): RoleRequestRow => ({ id: 'one', fullName: 'Alex Smith', workEmail: 'alex@firm.test', accountType: 'Staff', roleRequested: 'STAFF', scopeType: 'ENGAGEMENT', scopeTarget: 'Client A / Audit 2026', expiry: '', notes: '', ...overrides });

test('Catalogue maps eleven choices to eleven distinct supported application roles', () => {
  assert.equal(ROLES.length, 11);
  assert.deepEqual(ROLES.map(r => r.serverRole).sort(), ['Administrator', 'Partner', 'Manager', 'Senior', 'Staff', 'RelationshipManager', 'FinanceManager', 'FinanceReviewer', 'AccountingPreparer', 'AccountingReviewer', 'ClientUser'].sort());
  assert.equal(ROLES.filter(r => r.accountType === 'Client').length, 1);
});

test('Every supported role/coverage combination validates without sample targets', () => {
  for (const role of ROLES) for (const scopeType of role.allowedScopes) {
    const result = validateRoleRequestRow(row({ roleRequested: role.code, accountType: role.accountType, scopeType, scopeTarget: scopeType === 'FIRM_WIDE' ? '' : 'Selected work' }));
    assert.equal(result.isValid, true, `${role.code}/${scopeType}: ${result.errors}`);
  }
});

test('Client users cannot have group or firm-wide coverage', () => {
  for (const scopeType of ['GROUP', 'FIRM_WIDE'] as const) assert.equal(validateRoleRequestRow(row({ roleRequested: 'CLIENT_USER', accountType: 'Client', scopeType, scopeTarget: '' })).isValid, false);
});

test('Coverage target cannot be omitted or attached to whole-firm coverage', () => {
  assert.equal(validateRoleRequestRow(row({ scopeTarget: '' })).isValid, false);
  assert.equal(validateRoleRequestRow(row({ scopeType: 'FIRM_WIDE', scopeTarget: 'Firm-Wide' })).isValid, false);
});

test('Rejects malformed, impossible, past and group expiry dates', () => {
  for (const expiry of ['not-a-date', '2099-02-30', '2099-13-01', '2020-01-01']) assert.equal(validateRoleRequestRow(row({ expiry })).isValid, false, expiry);
  assert.equal(validateRoleRequestRow(row({ scopeType: 'GROUP', expiry: '2099-01-01' })).isValid, false);
  assert.equal(validateRoleRequestRow(row({ expiry: '2099-01-01' })).isValid, true);
});

test('Request identity requires firm, name and a structurally valid contact email', () => {
  for (const contactEmail of ['', 'bad', 'has spaces@firm.test', 'one@two@firm.test']) assert.equal(validateRequestDetails({ firmName: 'Firm', submittedBy: 'Alex', contactEmail }).isValid, false);
  assert.equal(validateRequestDetails({ firmName: 'Firm', submittedBy: 'Alex', contactEmail: 'contact@firm.test' }).isValid, true);
});

test('CSV has no sample rows and exports exact role, scope type and target separately', () => {
  assert.equal(exportRequestsToCsv([]).trim().split('\n').length, 1);
  const csv = exportRequestsToCsv([row()], { firmName: 'Firm', submittedBy: 'Alex', contactEmail: 'alex@firm.test' });
  assert.match(csv, /Application role,Coverage type,Coverage target/);
  assert.match(csv, /Audit Staff,Staff,ENGAGEMENT,Client A \/ Audit 2026/);
  assert.match(csv, /Firm \/ client,Firm/);
  assert.doesNotMatch(csv, /Sarah Jenkins|Acme/);
});

test('CSV quotes commas, quotes and newlines and neutralises spreadsheet formulas', () => {
  const csv = exportRequestsToCsv([row({ fullName: '=HYPERLINK("unsafe")', notes: 'A, "quoted"\nnote' })]);
  assert.ok(csv.includes('"\'=HYPERLINK(""unsafe"")"'));
  assert.ok(csv.includes('"A, ""quoted""\nnote"'));
});

test('Independence warnings compare coverage and distinguish uncertain overlap', () => {
  const prepare = row({ roleRequested: 'ACCOUNTING_PREPARER' });
  const review = row({ id: 'two', roleRequested: 'ACCOUNTING_REVIEWER' });
  assert.equal(detectSodFindings([prepare, review])[0].state, 'CONFLICT');
  assert.equal(detectSodFindings([prepare, { ...review, scopeTarget: 'Client B / Audit 2026' }]).length, 0);
  assert.equal(detectSodFindings([prepare, { ...review, scopeType: 'CLIENT', scopeTarget: 'Client A' }])[0].state, 'REVIEW');
});

test('Role finder distinguishes finance, accounting and client responsibilities', () => {
  assert.equal(recommendRole({ isExternalClient: true }).role.code, 'CLIENT_USER');
  assert.equal(recommendRole({ isExternalClient: false, staffWorksOn: 'FIRM_FINANCE', financeRoleSide: 'MANAGE' }).role.code, 'FINANCE_MANAGER');
  assert.equal(recommendRole({ isExternalClient: false, staffWorksOn: 'FIRM_FINANCE', financeRoleSide: 'REVIEW' }).role.code, 'FINANCE_REVIEWER');
  assert.equal(recommendRole({ isExternalClient: false, staffWorksOn: 'CLIENT_ACCOUNTING', accountingRoleSide: 'PREPARE' }).role.code, 'ACCOUNTING_PREPARER');
  assert.equal(recommendRole({ isExternalClient: false, staffWorksOn: 'CLIENT_ACCOUNTING', accountingRoleSide: 'REVIEW' }).role.code, 'ACCOUNTING_REVIEWER');
});
