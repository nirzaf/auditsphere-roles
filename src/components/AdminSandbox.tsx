import React, { useState } from 'react';
import {
  ADMIN_WALKTHROUGH_STEPS,
  AccountType,
  ROLES,
  RoleCode,
  ScopeCode,
} from '../data/rolesData.ts';
import { getRoleByCode, validateWorkEmail } from '../utils/roleAssessor.ts';
import { Check, Copy, ExternalLink, Lock, Plus, Search, ShieldAlert, UserCheck } from 'lucide-react';

interface SandboxRosterUser {
  id: string;
  fullName: string;
  workEmail: string;
  accountType: AccountType;
  bindingStatus: 'BOUND_ENTRA_OID' | 'PENDING_INVITATION';
  entraOid: string;
  invitationToken: string;
  grants: {
    id: string;
    role: RoleCode;
    scopeType: ScopeCode;
    scopeTarget: string;
    expiresAt: string;
  }[];
}

const INITIAL_ROSTER: SandboxRosterUser[] = [
  {
    id: 'usr-1',
    fullName: 'Sarah Jenkins',
    workEmail: 's.jenkins@example.com',
    accountType: 'Staff',
    bindingStatus: 'BOUND_ENTRA_OID',
    entraOid: '00000000-0000-0000-0000-00000000a101',
    invitationToken: 'inv-sj-2026-881',
    grants: [
      {
        id: 'gr-1',
        role: 'PARTNER',
        scopeType: 'CLIENT',
        scopeTarget: 'Client: Acme Trading Ltd',
        expiresAt: '',
      },
    ],
  },
  {
    id: 'usr-2',
    fullName: 'Marcus Vance',
    workEmail: 'm.vance@example.com',
    accountType: 'Staff',
    bindingStatus: 'BOUND_ENTRA_OID',
    entraOid: '00000000-0000-0000-0000-00000000a102',
    invitationToken: 'inv-mv-2026-882',
    grants: [
      {
        id: 'gr-2',
        role: 'MANAGER',
        scopeType: 'ENGAGEMENT',
        scopeTarget: 'Engagement: Acme Trading Ltd — FY2026 statutory audit',
        expiresAt: '2027-04-30',
      },
    ],
  },
  {
    id: 'usr-3',
    fullName: 'Elena Rostova',
    workEmail: 'e.rostova@example.com',
    accountType: 'Staff',
    bindingStatus: 'BOUND_ENTRA_OID',
    entraOid: '00000000-0000-0000-0000-00000000a103',
    invitationToken: 'inv-er-2026-883',
    grants: [
      {
        id: 'gr-3',
        role: 'ADMINISTRATOR',
        scopeType: 'FIRM_WIDE',
        scopeTarget: 'Firm-Wide',
        expiresAt: '',
      },
    ],
  },
  {
    id: 'usr-4',
    fullName: 'David Chen',
    workEmail: 'd.chen@client-example.com',
    accountType: 'Client',
    bindingStatus: 'PENDING_INVITATION',
    entraOid: 'Awaiting first Microsoft Entra ID sign-in',
    invitationToken: 'inv-dc-2026-904',
    grants: [
      {
        id: 'gr-4',
        role: 'CLIENT_USER',
        scopeType: 'CLIENT',
        scopeTarget: 'Client: Acme Trading Ltd',
        expiresAt: '',
      },
    ],
  },
  {
    id: 'usr-5',
    fullName: 'Sarah Miller',
    workEmail: 's.miller@client-example.com',
    accountType: 'Client',
    bindingStatus: 'PENDING_INVITATION',
    entraOid: 'Awaiting first Microsoft sign-in',
    invitationToken: 'inv-sm-2026-905',
    grants: [
      {
        id: 'gr-5',
        role: 'CLIENT_USER',
        scopeType: 'ENGAGEMENT',
        scopeTarget: 'Engagement: Acme Trading Ltd — FY2026 statutory audit',
        expiresAt: '2027-03-31',
      },
    ],
  },
];

export const AdminSandbox: React.FC = () => {
  const [roster, setRoster] = useState<SandboxRosterUser[]>(INITIAL_ROSTER);
  const [searchQuery, setSearchQuery] = useState('');
  const [accountFilter, setAccountFilter] = useState<'ALL' | AccountType>('ALL');
  const [selectedUserId, setSelectedUserId] = useState<string>('usr-4');

  // Bind new identity form
  const [newFullName, setNewFullName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newAccountType, setNewAccountType] = useState<AccountType>('Staff');
  const [bindMessage, setBindMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  // Assign Role & Scope state
  const [assignRole, setAssignRole] = useState<RoleCode>('CLIENT_USER');
  const [assignScopeType, setAssignScopeType] = useState<ScopeCode>('CLIENT');
  const [assignScopeTarget, setAssignScopeTarget] = useState('Client: Acme Corp');
  const [assignExpiry, setAssignExpiry] = useState('2027-06-30');
  const [assignFeedback, setAssignFeedback] = useState<string | null>(null);

  // Copied invite link state
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);

  const filteredRoster = roster.filter((u) => {
    const matchesSearch =
      !searchQuery.trim() ||
      u.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.workEmail.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = accountFilter === 'ALL' || u.accountType === accountFilter;
    return matchesSearch && matchesType;
  });

  const selectedUser = roster.find((u) => u.id === selectedUserId) ?? roster[0];
  const eligibleRoles = ROLES.filter((r) => r.accountType === selectedUser.accountType);
  const activeRoleDef =
    eligibleRoles.find((r) => r.code === assignRole) ?? eligibleRoles[0];

  const handleSelectUser = (user: SandboxRosterUser) => {
    setSelectedUserId(user.id);
    const firstEligible = ROLES.find((r) => r.accountType === user.accountType);
    if (firstEligible) {
      setAssignRole(firstEligible.code);
      setAssignScopeType(firstEligible.allowedScopes[0]);
      setAssignScopeTarget(
        firstEligible.allowedScopes[0] === 'FIRM_WIDE'
          ? 'Firm-Wide'
          : 'Engagement: FY2026 Audit - Acme Corp'
      );
    }
    setAssignFeedback(null);
  };

  const handleBindIdentity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName.trim()) {
      setBindMessage({ type: 'error', text: 'Enter the person’s full name.' });
      return;
    }
    const emailValidation = validateWorkEmail(newEmail);
    if (!emailValidation.valid) {
      setBindMessage({
        type: 'error',
        text: emailValidation.error ?? 'Invalid work email.',
      });
      return;
    }
    const exists = roster.some(
      (u) => u.workEmail.toLowerCase() === newEmail.trim().toLowerCase()
    );
    if (exists) {
      setBindMessage({
        type: 'error',
        text: `Work email ${newEmail.trim()} is already bound in the local directory.`,
      });
      return;
    }

    const newUser: SandboxRosterUser = {
      id: `usr-${Date.now()}`,
      fullName: newFullName.trim(),
      workEmail: newEmail.trim().toLowerCase(),
      accountType: newAccountType,
      bindingStatus: 'PENDING_INVITATION',
      entraOid: 'Awaiting first Microsoft Entra ID sign-in',
      invitationToken: `inv-${Math.random().toString(36).slice(2, 8)}-2026`,
      grants: [],
    };
    setRoster((prev) => [newUser, ...prev]);
    handleSelectUser(newUser);
    setNewFullName('');
    setNewEmail('');
    setBindMessage({
      type: 'success',
      text: `Bound roster identity for ${newUser.fullName} (${newUser.workEmail}). Now assign a RoleGrant on the right.`,
    });
  };

  const handleAssignGrant = (e: React.FormEvent) => {
    e.preventDefault();
    const roleDef = getRoleByCode(activeRoleDef.code);
    if (!roleDef.allowedScopes.includes(assignScopeType)) {
      setAssignFeedback(
        `Blocked: ${roleDef.code} only allows scopes ${roleDef.allowedScopes.join(', ')}.`
      );
      return;
    }
    const targetLabel =
      assignScopeType === 'FIRM_WIDE'
        ? 'Firm-Wide'
        : assignScopeTarget.trim() || `${assignScopeType}: Acme Corp`;

    setRoster((prev) =>
      prev.map((u) => {
        if (u.id !== selectedUser.id) return u;
        return {
          ...u,
          grants: [
            ...u.grants,
            {
              id: `gr-${Date.now()}`,
              role: roleDef.code,
              scopeType: assignScopeType,
              scopeTarget: targetLabel,
              expiresAt: assignExpiry.trim(),
            },
          ],
        };
      })
    );
    setAssignFeedback(
      `Assigned ${roleDef.code} at ${assignScopeType} (${targetLabel}) to ${selectedUser.fullName}.`
    );
  };

  const handleRevokeGrant = (userId: string, grantId: string) => {
    setRoster((prev) =>
      prev.map((u) => {
        if (u.id !== userId) return u;
        return {
          ...u,
          grants: u.grants.filter((g) => g.id !== grantId),
        };
      })
    );
  };

  const handleCopyInvite = (user: SandboxRosterUser) => {
    const inviteUrl = `https://auditsphere.example.com/redeem?token=${user.invitationToken}&email=${encodeURIComponent(user.workEmail)}`;
    navigator.clipboard?.writeText(inviteUrl).catch(() => {});
    setCopiedUserId(user.id);
    setTimeout(() => setCopiedUserId(null), 2200);
  };

  return (
    <div className="space-y-8">
      {/* 4 Step Cards from Appendix A */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {ADMIN_WALKTHROUGH_STEPS.map((step) => (
          <div
            key={step.stepNumber}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="font-semibold text-sky-800 dark:text-sky-400">
                  Step 0{step.stepNumber}
                </span>
                <span>·</span>
                <code className="font-mono text-[11px]">{step.route}</code>
              </div>
              <h4 className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                {step.title}
              </h4>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {step.summary}
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                {step.checklist.map((item, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-sky-700 dark:text-sky-400 font-bold">›</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
              {step.guardrailNote}
            </div>
          </div>
        ))}
      </div>

      {/* Microsoft Graph Capability Flags Status Strip (Section 10 / status.json) */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Microsoft Graph Directory Write Gates · Source: docs/execution/status.json
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              Tenant Provisioning Status (Manual Invitation Link Flow Active)
            </h4>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono">
            <span className="text-amber-700 dark:text-amber-400">
              TENANT_USER_PROVISIONING: BLOCKED_EXTERNAL (Disabled)
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-amber-700 dark:text-amber-400">
              GUEST_INVITATION: BLOCKED_EXTERNAL (Disabled)
            </span>
            <span className="text-slate-300 dark:text-slate-700">·</span>
            <span className="text-amber-700 dark:text-amber-400">
              GROUP_MEMBERSHIP: BLOCKED_EXTERNAL (Disabled)
            </span>
          </div>
        </div>
      </div>

      {/* Interactive /admin/access Console Simulator */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-sky-700 dark:text-sky-400" />
            <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Interactive Users &amp; Access Console Simulator
            </span>
            <span className="text-slate-400">·</span>
            <code className="text-xs font-mono text-slate-600 dark:text-slate-400">
              /admin/access
            </code>
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Guarded by <code className="font-mono">adminRoleGuard</code> · ADR-0003 Enforced
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200 dark:divide-slate-800">
          {/* Left 7 Cols: Search Roster & Bind Identity */}
          <div className="lg:col-span-7 p-5 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search bound roster by name or @example.com..."
                  aria-label="Search bound roster by name or work email"
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                />
              </div>
              <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                {(['ALL', 'Staff', 'Client'] as const).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountFilter(type)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      accountFilter === type
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    {type === 'ALL' ? 'All Roster' : `${type} Only`}
                  </button>
                ))}
              </div>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-950 text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <th className="py-2.5 px-3 font-semibold">Roster Identity</th>
                    <th className="py-2.5 px-3 font-semibold">Portal Type</th>
                    <th className="py-2.5 px-3 font-semibold">Active RoleGrants</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Invitation Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {filteredRoster.map((u) => {
                    const isSelected = u.id === selectedUser.id;
                    return (
                      <tr
                        key={u.id}
                        onClick={() => handleSelectUser(u)}
                        className={`cursor-pointer transition-colors ${
                          isSelected
                            ? 'bg-sky-50/70 dark:bg-sky-950/40'
                            : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="py-2.5 px-3">
                          <div className="font-semibold text-slate-900 dark:text-slate-100">
                            {u.fullName}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 dark:text-slate-400">
                            {u.workEmail}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              u.accountType === 'Staff'
                                ? 'text-sky-800 dark:text-sky-300'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {u.accountType} Portal
                          </span>
                          <div className="text-[10px] text-slate-500">
                            {u.bindingStatus === 'BOUND_ENTRA_OID'
                              ? 'Entra OID Bound'
                              : 'Pending 1st Sign-In'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          {u.grants.length === 0 ? (
                            <span className="text-amber-600 dark:text-amber-400">
                              No active grants
                            </span>
                          ) : (
                            <div className="space-y-1">
                              {u.grants.map((g) => (
                                <div key={g.id} className="font-mono text-[11px]">
                                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                                    {g.role}
                                  </span>{' '}
                                  <span className="text-slate-400">·</span>{' '}
                                  <span className="text-slate-600 dark:text-slate-300">
                                    {g.scopeTarget}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyInvite(u);
                            }}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0"
                          >
                            {copiedUserId === u.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                Copied Link
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                Copy Link
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Step 2: Bind a Roster Identity Form */}
            <form
              onSubmit={handleBindIdentity}
              className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Step 2: Bind New Roster Identity
                </span>
                <span className="text-[11px] text-slate-500">
                  Rejects @gmail.com &amp; shared mailboxes
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <input
                  type="text"
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Full Name (e.g. Priya Nair)"
                  aria-label="New Roster Identity Full Name"
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                />
                <input
                  type="text"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Work Email (p.nair@example.com)"
                  aria-label="New Roster Identity Work Email"
                  className="px-3 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-mono"
                />
                <div className="flex items-center gap-2">
                  <select
                    value={newAccountType}
                    onChange={(e) => setNewAccountType(e.target.value as AccountType)}
                    aria-label="New Roster Identity Account Type"
                    className="flex-1 px-2.5 py-1.5 text-xs rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"
                  >
                    <option value="Staff">Staff Account</option>
                    <option value="Client">Client Account</option>
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Bind
                  </button>
                </div>
              </div>
              {bindMessage && (
                <div
                  className={`text-xs ${
                    bindMessage.type === 'error'
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-emerald-700 dark:text-emerald-400'
                  }`}
                >
                  {bindMessage.text}
                </div>
              )}
            </form>
          </div>

          {/* Right 5 Cols: Assign Role & Scope Dialog */}
          <div className="lg:col-span-5 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Step 3: Assign Role &amp; Scope Dialog
                </div>
                <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                  {selectedUser.fullName}{' '}
                  <span className="font-normal text-xs text-slate-500 font-mono">
                    ({selectedUser.workEmail})
                  </span>
                </h4>
              </div>
              <span className="text-xs font-semibold text-sky-800 dark:text-sky-400">
                {selectedUser.accountType} Account
              </span>
            </div>

            <form onSubmit={handleAssignGrant} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Role Identifier (Filtered by {selectedUser.accountType} Account Type)
                </label>
                <select
                  value={activeRoleDef.code}
                  onChange={(e) => {
                    const nextCode = e.target.value as RoleCode;
                    const nextDef = getRoleByCode(nextCode);
                    setAssignRole(nextCode);
                    if (!nextDef.allowedScopes.includes(assignScopeType)) {
                      setAssignScopeType(nextDef.allowedScopes[0]);
                    }
                  }}
                  aria-label="Select Role Identifier to Assign"
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                >
                  {eligibleRoles.map((r) => (
                    <option key={r.code} value={r.code}>
                      {r.code} — {r.displayLabel}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Allowed Scope Type
                  </label>
                  <select
                    value={assignScopeType}
                    onChange={(e) => {
                      const nextScope = e.target.value as ScopeCode;
                      setAssignScopeType(nextScope);
                      if (nextScope === 'FIRM_WIDE') {
                        setAssignScopeTarget('Firm-Wide');
                      } else if (nextScope === 'GROUP') {
                        setAssignScopeTarget('Group: Apex Holdings Group');
                      } else if (nextScope === 'CLIENT') {
                        setAssignScopeTarget('Client: Acme Corp');
                      } else {
                        setAssignScopeTarget('Engagement: FY2026 Audit - Acme Corp');
                      }
                    }}
                    aria-label="Select Allowed Scope Type"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  >
                    {activeRoleDef.allowedScopes.map((sc) => (
                      <option key={sc} value={sc}>
                        {sc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Expiry Date (00:00 UTC)
                  </label>
                  <input
                    type="date"
                    value={assignExpiry}
                    onChange={(e) => setAssignExpiry(e.target.value)}
                    aria-label="Grant Expiry Date"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
                  />
                </div>
              </div>

              {assignScopeType !== 'FIRM_WIDE' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target {assignScopeType} Entity
                  </label>
                  <input
                    type="text"
                    value={assignScopeTarget}
                    onChange={(e) => setAssignScopeTarget(e.target.value)}
                    aria-label="Target Scope Entity Name"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer transition-colors"
              >
                Assign RoleGrant to {selectedUser.fullName}
              </button>

              {assignFeedback && (
                <div className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                  {assignFeedback}
                </div>
              )}
            </form>

            {/* Current Grants & Revoke List */}
            <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Active RoleGrants for {selectedUser.fullName}
              </div>
              {selectedUser.grants.length === 0 ? (
                <p className="text-xs text-slate-500">
                  No active RoleGrants. User will see &quot;Access Pending Roster Binding&quot; upon Entra ID sign-in.
                </p>
              ) : (
                <div className="space-y-2">
                  {selectedUser.grants.map((g) => (
                    <div
                      key={g.id}
                      className="flex items-center justify-between gap-2 p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs"
                    >
                      <div>
                        <div className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                          {g.role}
                        </div>
                        <div className="text-[11px] text-slate-600 dark:text-slate-400">
                          {g.scopeType} · {g.scopeTarget}{' '}
                          {g.expiresAt ? `· Expires ${g.expiresAt}` : '· Permanent'}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRevokeGrant(selectedUser.id, g.id)}
                        className="px-2.5 py-1 rounded border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/50 text-[11px] font-medium cursor-pointer whitespace-nowrap shrink-0"
                      >
                        Revoke
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
