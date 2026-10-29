// Server functions for recording role assignment requests in Cloudflare D1.
// Every field is re-derived server-side; network values are never trusted.
import { createServerFn } from '@tanstack/react-start';
import {
  getRoleByCode,
  validateRequestDetails,
  validateRoleRequestRow,
} from '../utils/roleAssessor';
import type {
  AccountType,
  RoleCode,
  RoleRequestRow,
  ScopeCode,
} from '../data/rolesData';
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
  expiry: string;
  notes: string;
}

export interface IncomingRequestDetails {
  firmName: string;
  submittedBy: string;
  contactEmail: string;
}

export interface RecordPayload {
  requestRef: string;
  details: IncomingRequestDetails;
  rows: IncomingRoleRequest[];
}

export interface RejectedRequest {
  requestId: string;
  reasons: string[];
}

const MAX_BATCH = 50;
export const ID_PATTERN = /^req-[0-9]+$/;
export const REF_PATTERN = /^REQ-[0-9]{8}-[0-9]{3}$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const clean = (value: unknown, max = 500): string =>
  typeof value === 'string' ? value.trim().slice(0, max) : '';

/** Re-derive every field server-side; never trust network values. */
function normalizeAndValidate(raw: IncomingRoleRequest): {
  row?: RoleRequestRow;
  reasons: string[];
} {
  const reasons: string[] = [];

  const id = clean(raw?.id, 40);
  if (!ID_PATTERN.test(id)) {
    reasons.push('Invalid request id.');
  }

  const fullName = clean(raw?.fullName, 120);
  if (!fullName) {
    reasons.push('Full name is required.');
  }

  const role = getRoleByCode(
    typeof raw?.roleRequested === 'string'
      ? (raw.roleRequested as RoleCode)
      : (undefined as unknown as RoleCode)
  );
  if (!role) {
    reasons.push('Role requested is not a recognised AuditSphere role.');
  }

  const scopeType = raw?.scopeType as ScopeCode;
  if (role && !role.allowedScopes.includes(scopeType)) {
    reasons.push(`Coverage ${String(scopeType)} is not allowed for ${role.displayLabel}.`);
  }

  if (role && raw?.accountType !== role.accountType) {
    reasons.push(`Identity type must be ${role.accountType} for ${role.displayLabel}.`);
  }

  const expiry = clean(raw?.expiry, 10);
  if (expiry && !DATE_PATTERN.test(expiry)) {
    reasons.push('Expiry must be a date (YYYY-MM-DD).');
  }

  if (reasons.length > 0) {
    return { reasons };
  }

  // Full cross-field validation (expiry rules, email format, target rules).
  const candidate: RoleRequestRow = {
    id,
    fullName,
    workEmail: clean(raw?.workEmail, 320).toLowerCase(),
    accountType: raw?.accountType as AccountType,
    roleRequested: raw?.roleRequested as RoleCode,
    scopeType,
    scopeTarget: clean(raw?.scopeTarget, 200),
    expiry,
    notes: clean(raw?.notes, 500),
  };
  const validation = validateRoleRequestRow(candidate);
  if (!validation.isValid) {
    return { reasons: validation.errors };
  }

  return { row: candidate, reasons: [] };
}

export const recordRoleRequests = createServerFn({ method: 'POST' })
  .validator((data: RecordPayload | undefined) => data)
  .handler(async ({ data }) => {
    const rows = Array.isArray(data?.rows) ? data.rows : [];
    if (rows.length === 0) {
      throw new Error('No request rows to record.');
    }
    if (rows.length > MAX_BATCH) {
      throw new Error(`Batch too large: ${rows.length} of ${MAX_BATCH} rows max.`);
    }

    const requestRef = clean(data?.requestRef, 20);
    if (!REF_PATTERN.test(requestRef)) {
      throw new Error('Missing or malformed request reference.');
    }

    const rawDetails = {
      firmName: clean(data?.details?.firmName, 200),
      submittedBy: clean(data?.details?.submittedBy, 120),
      contactEmail: clean(data?.details?.contactEmail, 320),
    };
    const detailsCheck = validateRequestDetails(rawDetails);
    if (!detailsCheck.isValid) {
      throw new Error(`Request details invalid: ${detailsCheck.errors.join(' ')}`);
    }
    const contactEmail = rawDetails.contactEmail.toLowerCase();

    const accepted:(RoleRequestRow & {
      requestRef: string;
      firmName: string;
      submittedBy: string;
      contactEmail: string;
    })[] = [];
    const rejected: RejectedRequest[] = [];
    for (const raw of rows) {
      const { row, reasons } = normalizeAndValidate(raw as IncomingRoleRequest);
      if (row) {
        accepted.push({
          ...row,
          requestRef,
          firmName: rawDetails.firmName,
          submittedBy: rawDetails.submittedBy,
          contactEmail,
        });
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

    return { requestRef, recorded, duplicates, rejected };
  });
