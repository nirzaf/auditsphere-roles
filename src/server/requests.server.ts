// Server-only D1 access helpers.
// The `.server.ts` suffix keeps this out of client bundles (import protection).
import { env } from 'cloudflare:workers';
import type { RoleRequestRow } from '../data/rolesData';

export interface RecordResult {
  recorded: number;
  duplicates: number;
}

function getD1() {
  const binding = env.DB;
  if (!binding) {
    throw new Error(
      'D1 binding "DB" is not available. Add it to wrangler.jsonc and redeploy.'
    );
  }
  return binding;
}

const INSERT_SQL = `
  INSERT INTO role_requests (
    request_id, full_name, work_email, account_type, role_code,
    scope_type, scope_target, expiry, notes,
    request_ref, firm_name, submitted_by, contact_email
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(request_id) DO NOTHING
`;

export async function insertRoleRequests(
  rows: (RoleRequestRow & {
    requestRef: string;
    firmName: string;
    submittedBy: string;
    contactEmail: string;
  })[]
): Promise<RecordResult> {
  const db = getD1();
  const statements = rows.map((row) =>
    db
      .prepare(INSERT_SQL)
      .bind(
        row.id,
        row.fullName,
        row.workEmail,
        row.accountType,
        row.roleRequested,
        row.scopeType,
        row.scopeTarget,
        row.expiry || null,
        row.notes || '',
        row.requestRef,
        row.firmName,
        row.submittedBy,
        row.contactEmail
      )
  );

  const results = await db.batch(statements);
  let recorded = 0;
  for (const result of results) {
    // meta.changes reflects rows actually inserted (0 for duplicates).
    recorded += result.meta.changes ?? 0;
  }
  return { recorded, duplicates: rows.length - recorded };
}
