// Server functions for recording role assignment requests in Cloudflare D1.
import { createServerFn } from '@tanstack/react-start';
import {
  getRoleByCode,
  validateRoleRequestRow,
  validateWorkEmail,
} from '../utils/roleAssessor';
import type { AccountType, RoleCode, RoleRequestRow, ScopeCode } from '../data/rolesData';
import { insertRoleRequests } from './requests.server';

/** What the browser sends for one request row. Values may be untrusted. */
export interface IncomingRoleRequest {
  id: string;
  fullName: string;
  workEmail: string;
  accountType: string;
  roleRequested: string;
  scopeType: string;
  scopeTarget: string;
  startDate: string;
  expiry: string;
  approvedBy: string;
  notes: string;
}

export interface RejectedRequest {
  requestId: string;
  reasons: string[];
}

const MAX_BATCH = 50;
export const ID_PATTERN = /^req-[0-9]+$/;
const DATE_PATTERN = /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/;

/** Re-derive every field server-side; never trust network values. */
function normalizeAndValidate(raw: IncomingRoleRequest): {
  row?: RoleRequestRow;
  reasons: string[];
} {
  const reasons: string[] = [];

  const id = typeof raw?.id === 'string' ? raw.id.trim() : '';
  if (!ID_PATTERN.test(id)) {
    reasons.push(`Invalid request id.`);
  }

  if (typeof raw?.fullName !== 'string' || !raw.fullName.trim() || raw.fullName.length > 120) {
    reasons.push('Full name is required (max 120 characters).');
  }

  const emailCheck = validateWorkEmail(typeof raw?.workEmail === 'string' ? raw.workEmail : '');
  if (!emailCheck.valid) {
    reasons.push(emailCheck.error ?? 'Work email is required.');
  }

  const role = getRoleByCode(
    typeof raw?.roleRequested === 'string' ? (raw.roleRequested as RoleCode) : (undefined as unknown as RoleCode)
  );
  if (!role) {
    reasons.push('Role requested is not a recognised AuditSphere role.');
  }

  const scopeType = raw?.scopeType as ScopeCode;
  if (role && !role.allowedScopes.includes(scopeType)) {
    reasons.push(`Scope ${String(scopeType)} is not allowed for ${role.code}.`);
  }

  if (role && raw?.accountType !== role.accountType) {
    reasons.push(`Account type must be ${role.accountType} for ${role.code}.`);
  }

  const startDate = raw?.startDate;
  if (typeof startDate === 'string' && startDate && !DATE_PATTERN.test(startDate)) {
    reasons.push('Start date must be an ISO date (YYYY-MM-DD).');
  }
  const expiry = raw?.expiry;
  if (typeof expiry === 'string' && expiry && !DATE_PATTERN.test(expiry)) {
    reasons.push('Expiry must be an ISO date (YYYY-MM-DD).');
  }

  if (reasons.length > 0) {
    return { reasons };
  }

  // Full cross-field validation (dates vs expiry, email format, etc.).
  const candidate: RoleRequestRow = {
    id,
    fullName: raw.fullName.trim(),
    workEmail: raw.workEmail.trim().toLowerCase(),
    accountType: raw.accountType as AccountType,
    roleRequested: raw.roleRequested as RoleCode,
    scopeType,
    scopeTarget: typeof raw.scopeTarget === 'string' ? raw.scopeTarget.trim() : '',
    startDate: startDate || '',
    expiry: expiry || '',
    approvedBy: typeof raw.approvedBy === 'string' ? raw.approvedBy.trim() : '',
    notes: typeof raw.notes === 'string' ? raw.notes.trim() : '',
  };
  const validation = validateRoleRequestRow(candidate);
  if (!validation.isValid) {
    return { reasons: validation.errors };
  }

  return { row: candidate, reasons: [] };
}

export const recordRoleRequests = createServerFn({ method: 'POST' })
  .validator((data: { rows: IncomingRoleRequest[] }) => data)
  .handler(async ({ data }) => {
    const incoming = Array.isArray(data?.rows) ? data.rows : [];
    if (incoming.length === 0) {
      throw new Error('No request rows to record.');
    }
    if (incoming.length > MAX_BATCH) {
      throw new Error(`Batch too large: ${incoming.length} of ${MAX_BATCH} rows max.`);
    }

    const accepted: RoleRequestRow[] = [];
    const rejected: RejectedRequest[] = [];
    for (const raw of incoming) {
      const { row, reasons } = normalizeAndValidate(raw);
      if (row) {
        accepted.push(row);
      } else {
        rejected.push({ requestId: raw?.id ?? '(unknown)', reasons });
      }
    }

    let recorded = 0;
    let duplicates = 0;
    if (accepted.length > 0) {
      const result = await insertRoleRequests(accepted);
      recorded = result.recorded;
      duplicates = result.duplicates;
    }

    return { recorded, duplicates, rejected };
  });
