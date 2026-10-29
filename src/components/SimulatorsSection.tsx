import React, { useState } from 'react';
import { ROLES, RoleCode } from '../data/rolesData.ts';
import {
  SeparationOfDutiesScenario,
  evaluateDualKeyGate,
  evaluateSeparationOfDuties,
} from '../utils/roleAssessor.ts';
import { DiagramDDualKeyGate } from './Diagrams.tsx';
import { CheckCircle2, Lock, ShieldAlert, Unlock } from 'lucide-react';

export const SimulatorsSection: React.FC = () => {
  // M1-03 Dual-Key + Retainer state
  const [clientKey, setClientKey] = useState(true);
  const [partnerKey, setPartnerKey] = useState(true);
  const [retainerPaid, setRetainerPaid] = useState(false);

  const gateResult = evaluateDualKeyGate({
    clientAcceptanceKey: clientKey,
    partnerClearanceKey: partnerKey,
    retainerPaidClearance: retainerPaid,
  });

  // Separation of Duties state
  const [sodScenario, setSodScenario] = useState<SeparationOfDutiesScenario>({
    actionType: 'WORKPAPER_REVIEW',
    actorRole: 'AUDIT_MANAGER',
    actorEmail: 'm.vance@example.com',
    preparedByEmail: 'm.vance@example.com',
    engagementPartnerEmail: 's.jenkins@example.com',
  });

  const sodVerdict = evaluateSeparationOfDuties(sodScenario);

  const handleToggleDiagramKey = (key: 'client' | 'partner' | 'retainer') => {
    if (key === 'client') setClientKey((v) => !v);
    if (key === 'partner') setPartnerKey((v) => !v);
    if (key === 'retainer') setRetainerPaid((v) => !v);
  };

  return (
    <div className="space-y-8">
      {/* Diagram D + Interactive M1-03 Dual-Key Simulator */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Requirement M1-03 · Server-Enforced Activation Gate
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
              1. Dual-Key Engagement Acceptance + Paid Retainer Simulator
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              An engagement cannot move from Onboarding to active Fieldwork until three independent conditions are recorded on the server. Toggle any key below or click the nodes in Diagram D to test the activation gate.
            </p>
          </div>
          <div
            data-testid="dual-key-status-banner"
            className={`px-3.5 py-2 rounded-lg border text-xs font-bold flex items-center gap-2 ${
              gateResult.isActivated
                ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300'
                : 'border-amber-300 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300'
            }`}
          >
            {gateResult.isActivated ? (
              <Unlock className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            )}
            <span>{gateResult.statusLabel}</span>
          </div>
        </div>

        {/* Interactive Diagram D */}
        <DiagramDDualKeyGate
          clientKey={clientKey}
          partnerKey={partnerKey}
          retainerPaid={retainerPaid}
          onToggleKey={handleToggleDiagramKey}
        />

        {/* 3 Key Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setClientKey((v) => !v)}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              clientKey
                ? 'border-amber-400 dark:border-amber-700 bg-amber-50/50 dark:bg-amber-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-amber-700 dark:text-amber-400">
                Key 1 · CLIENT_PRIMARY
              </span>
              <span className="font-semibold">
                {clientKey ? 'Approved' : 'Pending'}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              Client Acceptance Key
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Executed by David Chen (<code className="font-mono">d.chen@client-example.com</code>) in the Client Portal.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPartnerKey((v) => !v)}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              partnerKey
                ? 'border-sky-400 dark:border-sky-700 bg-sky-50/50 dark:bg-sky-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-sky-800 dark:text-sky-400">
                Key 2 · ENGAGEMENT_PARTNER
              </span>
              <span className="font-semibold">
                {partnerKey ? 'Cleared' : 'Pending'}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              Partner Clearance Key
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Executed by Sarah Jenkins (<code className="font-mono">s.jenkins@example.com</code>) in the Staff Portal.
            </p>
          </button>

          <button
            type="button"
            onClick={() => setRetainerPaid((v) => !v)}
            className={`text-left p-4 rounded-xl border transition-colors cursor-pointer ${
              retainerPaid
                ? 'border-teal-400 dark:border-teal-700 bg-teal-50/50 dark:bg-teal-950/30'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950'
            }`}
          >
            <div className="flex items-center justify-between text-xs">
              <span className="font-mono font-bold text-teal-700 dark:text-teal-400">
                Key 3 · FIRM_FINANCE
              </span>
              <span className="font-semibold">
                {retainerPaid ? 'Paid' : 'Pending'}
              </span>
            </div>
            <div className="mt-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
              Retainer Paid Clearance
            </div>
            <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
              Recorded by Practice Finance Lead once the client advance payment settles.
            </p>
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs text-slate-700 dark:text-slate-300 flex flex-wrap items-center justify-between gap-3">
          <span>
            <strong>Server Gate Verdict ({gateResult.completedCount}/3 Keys):</strong>{' '}
            {gateResult.serverMessage}
          </span>
          {!gateResult.isActivated && (
            <button
              type="button"
              onClick={() => {
                setClientKey(true);
                setPartnerKey(true);
                setRetainerPaid(true);
              }}
              className="px-3 py-1.5 rounded-md bg-sky-800 hover:bg-sky-700 text-white font-semibold cursor-pointer whitespace-nowrap shrink-0"
            >
              Clear All 3 Keys
            </button>
          )}
        </div>
      </div>

      {/* 4 Core Separation of Duties Rules + Live Rule Tester */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 sm:p-6 space-y-5">
        <div>
          <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
            Requirement M2-02 &amp; ADR-0003 · Server Command Guards
          </div>
          <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
            2. Separation of Duties (SoD) Rules &amp; Live Command Tester
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
            AuditSphere enforces four non-negotiable Separation of Duties rules in the server application layer (<code className="font-mono">NoSelfReviewTests.cs</code>, <code className="font-mono">CommandRoleMatrix.cs</code>). Test any combination below.
          </p>
        </div>

        {/* 4 Rule Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="font-mono font-bold text-sky-800 dark:text-sky-400">
              Rule 1 · No Self-Review
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
              Preparer != Reviewer
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              The server rejects any review sign-off where <code className="font-mono">ReviewerUserId == PreparedByUserId</code>.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="font-mono font-bold text-purple-700 dark:text-purple-400">
              Rule 2 · Independent EQCR (M2-02)
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
              EQCR != Delivery Team
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              <code className="font-mono">QUALITY_REVIEWER</code> cannot hold Partner, Manager, Senior, or Staff roles on the same engagement.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
              Rule 3 · Partner-Only Authority
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
              Key 2, Materiality, Opinion
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              Only <code className="font-mono">ENGAGEMENT_PARTNER</code> can lock materiality, sign the opinion, or lock the archive.
            </p>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60">
            <div className="font-mono font-bold text-red-700 dark:text-red-400">
              Rule 4 · ADR-0003 Boundary
            </div>
            <div className="font-semibold text-slate-900 dark:text-slate-100 mt-1">
              Admin != Partner Authority
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-400 leading-relaxed">
              &quot;Administrator access does not confer Partner authority.&quot; Admins cannot view or sign off audit files.
            </p>
          </div>
        </div>

        {/* Quick Preset Scenario Buttons */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-semibold text-slate-500">Test Presets:</span>
          <button
            type="button"
            onClick={() =>
              setSodScenario({
                actionType: 'WORKPAPER_REVIEW',
                actorRole: 'AUDIT_MANAGER',
                actorEmail: 'm.vance@example.com',
                preparedByEmail: 'm.vance@example.com',
                engagementPartnerEmail: 's.jenkins@example.com',
              })
            }
            className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Self-Review Attempt (Blocked)
          </button>
          <button
            type="button"
            onClick={() =>
              setSodScenario({
                actionType: 'WORKPAPER_REVIEW',
                actorRole: 'AUDIT_MANAGER',
                actorEmail: 'm.vance@example.com',
                preparedByEmail: 'a.staff@example.com',
                engagementPartnerEmail: 's.jenkins@example.com',
              })
            }
            className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Independent Manager Review (Allowed)
          </button>
          <button
            type="button"
            onClick={() =>
              setSodScenario({
                actionType: 'EQCR_CONCURRENCE',
                actorRole: 'QUALITY_REVIEWER',
                actorEmail: 's.jenkins@example.com',
                preparedByEmail: 'a.staff@example.com',
                engagementPartnerEmail: 's.jenkins@example.com',
              })
            }
            className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Partner Acting as Own EQCR (Blocked)
          </button>
          <button
            type="button"
            onClick={() =>
              setSodScenario({
                actionType: 'PARTNER_SIGN_OFF',
                actorRole: 'ADMINISTRATOR',
                actorEmail: 'e.rostova@example.com',
                preparedByEmail: 'a.staff@example.com',
                engagementPartnerEmail: 's.jenkins@example.com',
              })
            }
            className="px-2.5 py-1 text-xs rounded-md border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
          >
            Admin Trying Partner Sign-Off (Blocked)
          </button>
        </div>

        {/* Custom Scenario Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Server Command
            </label>
            <select
              value={sodScenario.actionType}
              onChange={(e) =>
                setSodScenario((prev) => ({
                  ...prev,
                  actionType: e.target.value as SeparationOfDutiesScenario['actionType'],
                }))
              }
              aria-label="Server Command to Test"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
            >
              <option value="WORKPAPER_REVIEW">Review &amp; Sign Off Working Paper</option>
              <option value="EQCR_CONCURRENCE">Issue EQCR Concurrence (M2-02)</option>
              <option value="PARTNER_SIGN_OFF">Sign Final Audit Opinion / Key 2</option>
              <option value="RETAINER_CLEARANCE">Record Retainer Paid Clearance</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actor Role
            </label>
            <select
              value={sodScenario.actorRole}
              onChange={(e) =>
                setSodScenario((prev) => ({
                  ...prev,
                  actorRole: e.target.value as RoleCode,
                }))
              }
              aria-label="Actor Role to Test"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
            >
              {ROLES.map((r) => (
                <option key={r.code} value={r.code}>
                  {r.code}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Actor Work Email
            </label>
            <input
              type="text"
              value={sodScenario.actorEmail}
              onChange={(e) =>
                setSodScenario((prev) => ({ ...prev, actorEmail: e.target.value }))
              }
              aria-label="Actor Work Email"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              {sodScenario.actionType === 'EQCR_CONCURRENCE'
                ? 'Engagement Partner Email'
                : 'Prepared By Email'}
            </label>
            <input
              type="text"
              value={
                sodScenario.actionType === 'EQCR_CONCURRENCE'
                  ? sodScenario.engagementPartnerEmail ?? ''
                  : sodScenario.preparedByEmail ?? ''
              }
              onChange={(e) =>
                setSodScenario((prev) =>
                  prev.actionType === 'EQCR_CONCURRENCE'
                    ? { ...prev, engagementPartnerEmail: e.target.value }
                    : { ...prev, preparedByEmail: e.target.value }
                )
              }
              aria-label="Comparison User Work Email"
              className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono"
            />
          </div>
        </div>

        {/* Verdict Banner */}
        <div
          className={`p-4 rounded-xl border flex items-start gap-3 ${
            sodVerdict.allowed
              ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200'
              : 'border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/40 text-red-900 dark:text-red-200'
          }`}
        >
          {sodVerdict.allowed ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          ) : (
            <ShieldAlert className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          )}
          <div className="text-xs space-y-1">
            <div className="font-bold text-sm">{sodVerdict.verdictTitle}</div>
            <p className="leading-relaxed">{sodVerdict.serverReason}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
