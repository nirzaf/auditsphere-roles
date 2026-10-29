// Reference-only pre-check simulators. They run the same client-side rules the
// request builder uses, so reviewers can try edge cases without touching data.
import React, { useState } from 'react';
import { ROLES, SOD_PAIRS, RoleCode, RoleRequestRow, ScopeCode } from '../data/rolesData.ts';
import {
  detectSodFindings,
  getRoleByCode,
  validateRoleRequestRow,
} from '../utils/roleAssessor.ts';
import { CheckCircle2, ShieldAlert, Wrench } from 'lucide-react';

interface DraftRow {
  role: RoleCode;
  scopeType: ScopeCode;
  scopeTarget: string;
  expiry: string;
}

const SCOPE_LABELS: Record<ScopeCode, string> = {
  FIRM_WIDE: 'whole firm',
  GROUP: 'group',
  CLIENT: 'client',
  ENGAGEMENT: 'engagement',
};

function draftToRow(draft: DraftRow, email: string, accountType: 'Staff' | 'Client'): RoleRequestRow {
  return {
    id: 'sim-1',
    fullName: 'Simulated Person',
    workEmail: email,
    accountType,
    roleRequested: draft.role,
    scopeType: draft.scopeType,
    scopeTarget: draft.scopeTarget,
    expiry: draft.expiry,
    notes: '',
  };
}

const PRESET_ROWS: Record<RoleCode, { scopeType: ScopeCode; scopeTarget: string; expiry: string }> = Object.fromEntries(
  ROLES.map((r) => [
    r.code,
    {
      scopeType: r.allowedScopes[0],
      scopeTarget: '',
      expiry: '',
    },
  ])
) as Record<RoleCode, { scopeType: ScopeCode; scopeTarget: string; expiry: string }>;

export const SimulatorsSection: React.FC = () => {
  const [draftOne, setDraftOne] = useState<DraftRow>({ ...PRESET_ROWS.FINANCE_MANAGER, role: 'FINANCE_MANAGER' });
  const [draftTwo, setDraftTwo] = useState<DraftRow>({ ...PRESET_ROWS.FINANCE_REVIEWER, role: 'FINANCE_REVIEWER' });
  const [sameEmail, setSameEmail] = useState(true);
  const [checked, setChecked] = useState(false);

  const accountOne = getRoleByCode(draftOne.role).accountType;
  const accountTwo = getRoleByCode(draftTwo.role).accountType;

  const emailOne = 'w.patel@firm.com';
  const emailTwo = sameEmail ? emailOne : 'x.mbeki@clientco.com';

  const rows = [
    draftToRow(draftOne, emailOne, accountOne),
    draftToRow(draftTwo, emailTwo, accountTwo),
  ];

  const rowOneValidation = validateRoleRequestRow({ ...rows[0], fullName: 'Person One' });
  const findings = checked ? detectSodFindings(rows) : [];

  const slotEditor = (slot: 0 | 1) => {
    const draft = slot === 0 ? draftOne : draftTwo;
    const setDraft = slot === 0 ? setDraftOne : setDraftTwo;
    const label = slot === 0 ? 'Grant one' : 'Grant two';

    const changeRole = (role: RoleCode) => {
      const def = getRoleByCode(role);
      const scopeType = def.allowedScopes.includes(draft.scopeType)
        ? draft.scopeType
        : def.allowedScopes[0];
      setDraft({
        role,
        scopeType,
        scopeTarget: scopeType === 'FIRM_WIDE' ? '' : draft.scopeTarget,
        expiry: scopeType === 'GROUP' ? '' : draft.expiry,
      });
      setChecked(false);
    };
    const changeScope = (scopeType: ScopeCode) => {
      setDraft({
        ...draft,
        scopeType,
        scopeTarget: scopeType === 'FIRM_WIDE' ? '' : draft.scopeTarget,
        expiry: scopeType === 'GROUP' ? '' : draft.expiry,
      });
      setChecked(false);
    };
    const changeTarget = (scopeTarget: string) => {
      setDraft({ ...draft, scopeTarget });
      setChecked(false);
    };
    const changeExpiry = (expiry: string) => {
      setDraft({ ...draft, expiry });
      setChecked(false);
    };

    return (
      <div
        key={slot}
        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-3"
      >
        <div className="text-xs font-bold text-slate-900 dark:text-slate-100">{label}</div>
        <label className="block text-xs text-slate-600 dark:text-slate-400">
          Role
          <select
            value={draft.role}
            onChange={(e) => changeRole(e.target.value as RoleCode)}
            className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            {ROLES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.displayLabel}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-slate-600 dark:text-slate-400">
          Coverage
          <select
            value={draft.scopeType}
            onChange={(e) => changeScope(e.target.value as ScopeCode)}
            className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 cursor-pointer"
          >
            {getRoleByCode(draft.role).allowedScopes.map((sc) => (
              <option key={sc} value={sc}>
                {SCOPE_LABELS[sc]}
              </option>
            ))}
          </select>
        </label>
        {draft.scopeType !== 'FIRM_WIDE' && (
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            Named target
            <input
              type="text"
              value={draft.scopeTarget}
              onChange={(e) => changeTarget(e.target.value)}
              placeholder={
                draft.scopeType === 'ENGAGEMENT'
                  ? 'Acme Trading Ltd \u2014 FY2026 statutory audit'
                  : 'Acme Trading Ltd'
              }
              className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>
        )}
        {draft.scopeType !== 'GROUP' && (
          <label className="block text-xs text-slate-600 dark:text-slate-400">
            Expiry (optional)
            <input
              type="date"
              value={draft.expiry}
              onChange={(e) => changeExpiry(e.target.value)}
              className="mt-1 w-full px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            />
          </label>
        )}
        <div className="text-[11px] text-slate-500 dark:text-slate-400">
          Signs in as
          <code className="ml-1 font-mono">{slot === 0 ? emailOne : emailTwo}</code>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
        Try the checks the server applies to every grant — before the request is reviewed. Two grants
        are compared side by side; switch the second role to see which pairings get accepted, warned
        or rejected.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {slotEditor(0)}
        {slotEditor(1)}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 cursor-pointer">
          <input
            type="checkbox"
            checked={sameEmail}
            onChange={(e) => setSameEmail(e.target.checked)}
            className="cursor-pointer"
          />
          Both grants belong to the same person
        </label>
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer"
        >
          <Wrench className="w-3.5 h-3.5" />
          Run the checks
        </button>
      </div>

      {!checked ? (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs text-slate-500 dark:text-slate-400">
          Press “Run the checks” to see the verdicts.
        </div>
      ) : (
        <div className="space-y-2">
          {rowOneValidation.policyWarnings.map((w, i) => (
            <div
              key={`warn-${i}`}
              className="rounded-lg border border-amber-200 dark:border-amber-900/60 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-800 dark:text-amber-300"
            >
              Advisory: {w}
            </div>
          ))}
          {findings.length === 0 ? (
            <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 p-3 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>
                No conflicts between these grants
                {sameEmail
                  ? '. This person could hold both roles at these coverage levels.'
                  : ' (different people).'}
              </span>
            </div>
          ) : (
            findings.map((f, i) => (
              <div
                key={i}
                className="rounded-lg border border-red-300 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-800 dark:text-red-300 flex items-start gap-2"
              >
                <ShieldAlert className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{f.message}</span>
              </div>
            ))
          )}
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Separation-of-duties pairs the server keeps:{' '}
            {SOD_PAIRS.map((p) => `${getRoleByCode(p.a).displayLabel} + ${getRoleByCode(p.b).displayLabel}`).join(' · ')}
          </div>
        </div>
      )}
    </div>
  );
};
