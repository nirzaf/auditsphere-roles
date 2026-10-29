import React, { useState } from 'react';
import { RoleCode, ScopeCode } from '../data/rolesData.ts';

interface DiagramAProps {
  onSelectPortal?: (portal: 'Staff' | 'Client') => void;
}

export const DiagramASystemMap: React.FC<DiagramAProps> = ({ onSelectPortal }) => {
  const [activeNode, setActiveNode] = useState<'ENTRA' | 'GUARD' | 'STAFF' | 'CLIENT' | null>(null);

  const nodeDetails: Record<'ENTRA' | 'GUARD' | 'STAFF' | 'CLIENT', { title: string; detail: string }> = {
    ENTRA: {
      title: 'Microsoft Entra ID Sign-In (SSO / MFA)',
      detail:
        'All users authenticate with their corporate work email via Microsoft Entra ID. AuditSphere never stores passwords; it validates the immutable oid + tid claims.',
    },
    GUARD: {
      title: 'Server-Side Roster & RoleGrant Guard',
      detail:
        'Enforced on the .NET 10 server (CommandRoleMatrix.cs). Checks that the Entra identity is bound to a roster record and holds an active, non-expired RoleGrant.',
    },
    STAFF: {
      title: 'Staff Portal (/app/*) — 7 Staff Roles',
      detail:
        'Guarded by staffPortalGuard. Hosts Practice & Commercial, Workflow & Tasks, Client Accounting & Reporting, Audit & Records, Firm Finance, People & Time, Group Consolidation, and Administration (/admin/access).',
    },
    CLIENT: {
      title: 'Client Portal (/portal/*) — 3 Client Roles',
      detail:
        'Guarded by clientPortalGuard. Strictly isolated external workspace for Client Acceptance Key (Key 1), PBC document uploads, management adjustment sign-off, and final report downloads.',
    },
  };

  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
        <svg
          viewBox="0 0 840 310"
          className="w-full h-auto min-w-[640px]"
          role="img"
          aria-label="Diagram A: AuditSphere System Overview showing Staff Portal vs Client Portal and Microsoft Entra ID Sign-In"
        >
          <defs>
            <marker id="arrow-navy" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#005082" />
            </marker>
            <marker id="arrow-orange" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#f57c00" />
            </marker>
            <marker id="arrow-slate" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
            </marker>
          </defs>

          {/* Left Actors */}
          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveNode('STAFF');
              onSelectPortal?.('Staff');
            }}
          >
            <rect x="20" y="34" width="185" height="66" rx="10" fill="#005082" />
            <text x="112" y="62" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Audit Firm Staff
            </text>
            <text x="112" y="81" textAnchor="middle" fill="#bae6fd" fontSize="11">
              Partners, Managers, Auditors, Admin
            </text>
          </g>

          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveNode('CLIENT');
              onSelectPortal?.('Client');
            }}
          >
            <rect x="20" y="196" width="185" height="66" rx="10" fill="#f57c00" />
            <text x="112" y="224" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Client Representatives
            </text>
            <text x="112" y="243" textAnchor="middle" fill="#ffedd5" fontSize="11">
              CFO, Controllers, Contributors
            </text>
          </g>

          {/* Center Entra + Guard */}
          <g className="cursor-pointer" onClick={() => setActiveNode('ENTRA')}>
            <rect x="255" y="64" width="190" height="64" rx="10" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="350" y="92" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Microsoft Entra ID
            </text>
            <text x="350" y="111" textAnchor="middle" fill="#cbd5e1" fontSize="11">
              Work Email SSO &amp; MFA
            </text>
          </g>

          <g className="cursor-pointer" onClick={() => setActiveNode('GUARD')}>
            <rect x="255" y="168" width="190" height="68" rx="10" fill="#0f766e" />
            <text x="350" y="196" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Server Roster &amp; Grant Check
            </text>
            <text x="350" y="215" textAnchor="middle" fill="#ccfbf1" fontSize="11">
              RoleGrant + Scope + Gate Check
            </text>
          </g>

          {/* Right Portals */}
          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveNode('STAFF');
              onSelectPortal?.('Staff');
            }}
          >
            <rect x="505" y="18" width="315" height="128" rx="12" fill="#f0f9ff" stroke="#005082" strokeWidth="2" />
            <text x="662" y="42" textAnchor="middle" fill="#005082" fontSize="13" fontWeight="700">
              STAFF PORTAL (/app/* — 7 Staff Roles)
            </text>
            <rect x="522" y="54" width="135" height="34" rx="6" fill="#005082" />
            <text x="589" y="75" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Audit &amp; Accounting
            </text>
            <rect x="668" y="54" width="135" height="34" rx="6" fill="#005082" />
            <text x="735" y="75" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Workflow &amp; EQCR
            </text>
            <rect x="522" y="98" width="135" height="34" rx="6" fill="#0369a1" />
            <text x="589" y="119" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Firm Finance &amp; WIP
            </text>
            <rect x="668" y="98" width="135" height="34" rx="6" fill="#334155" />
            <text x="735" y="119" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Users &amp; Access (/admin)
            </text>
          </g>

          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveNode('CLIENT');
              onSelectPortal?.('Client');
            }}
          >
            <rect x="505" y="168" width="315" height="122" rx="12" fill="#fff7ed" stroke="#f57c00" strokeWidth="2" />
            <text x="662" y="192" textAnchor="middle" fill="#c2410c" fontSize="13" fontWeight="700">
              CLIENT PORTAL (/portal/* — 3 Client Roles)
            </text>
            <rect x="522" y="205" width="135" height="34" rx="6" fill="#f57c00" />
            <text x="589" y="226" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Key 1 Acceptance
            </text>
            <rect x="668" y="205" width="135" height="34" rx="6" fill="#f57c00" />
            <text x="735" y="226" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              PBC Evidence Uploads
            </text>
            <rect x="522" y="247" width="281" height="30" rx="6" fill="#ea580c" />
            <text x="662" y="266" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Adjustment Approval &amp; Final Signed Deliverables
            </text>
          </g>

          {/* Connectors */}
          <path d="M 205 67 L 250 86" stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow-slate)" />
          <path d="M 205 229 L 250 112" stroke="#64748b" strokeWidth="2" fill="none" markerEnd="url(#arrow-slate)" />
          <line x1="350" y1="128" x2="350" y2="163" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrow-slate)" />
          <path d="M 445 186 L 500 92" stroke="#005082" strokeWidth="2.5" fill="none" markerEnd="url(#arrow-navy)" />
          <path d="M 445 212 L 500 226" stroke="#f57c00" strokeWidth="2.5" fill="none" markerEnd="url(#arrow-orange)" />
        </svg>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-400 px-1">
        <span>Click any diagram node to inspect the server enforcement boundary or filter roles.</span>
        {activeNode && (
          <button
            type="button"
            onClick={() => setActiveNode(null)}
            className="text-sky-700 dark:text-sky-400 underline cursor-pointer"
          >
            Clear selection
          </button>
        )}
      </div>

      {activeNode && (
        <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-3.5 text-sm">
          <div className="font-semibold text-slate-900 dark:text-slate-100">
            {nodeDetails[activeNode].title}
          </div>
          <p className="mt-1 text-slate-600 dark:text-slate-300 text-xs leading-relaxed">
            {nodeDetails[activeNode].detail}
          </p>
        </div>
      )}
    </div>
  );
};

interface DiagramBProps {
  selectedScope?: ScopeCode | 'ALL';
  onSelectScope?: (scope: ScopeCode) => void;
}

export const DiagramBScopeContainment: React.FC<DiagramBProps> = ({
  selectedScope,
  onSelectScope,
}) => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 820 265"
        className="w-full h-auto min-w-[620px]"
        role="img"
        aria-label="Diagram B: Concentric Scope Containment Hierarchy from FIRM_WIDE to GROUP to CLIENT to ENGAGEMENT"
      >
        {/* Outer: FIRM_WIDE */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('FIRM_WIDE')}>
          <rect
            x="16"
            y="12"
            width="788"
            height="240"
            rx="14"
            fill="#e0f2fe"
            stroke="#005082"
            strokeWidth={selectedScope === 'FIRM_WIDE' ? '3.5' : '2'}
          />
          <text x="36" y="38" fill="#005082" fontSize="13" fontWeight="700">
            1. FIRM_WIDE Scope — Entire Audit Practice (ADMINISTRATOR, FIRM_FINANCE, Managing Partner)
          </text>
        </g>

        {/* Second: GROUP */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('GROUP')}>
          <rect
            x="48"
            y="52"
            width="724"
            height="184"
            rx="12"
            fill="#e0f2f1"
            stroke="#009688"
            strokeWidth={selectedScope === 'GROUP' ? '3.5' : '2'}
          />
          <text x="68" y="77" fill="#00695c" fontSize="12.5" fontWeight="700">
            2. GROUP Scope — Parent Holding Company &amp; All Subsidiaries (e.g., &quot;Apex Holdings Group&quot;)
          </text>
        </g>

        {/* Third: CLIENT */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('CLIENT')}>
          <rect
            x="82"
            y="92"
            width="656"
            height="128"
            rx="10"
            fill="#fff7ed"
            stroke="#f57c00"
            strokeWidth={selectedScope === 'CLIENT' ? '3.5' : '2'}
          />
          <text x="102" y="116" fill="#c2410c" fontSize="12.5" fontWeight="700">
            3. CLIENT Scope — Single Legal Client Entity &amp; Its Engagements (e.g., &quot;Client: Acme Corp&quot;)
          </text>
        </g>

        {/* Innermost: ENGAGEMENT */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('ENGAGEMENT')}>
          <rect
            x="118"
            y="132"
            width="280"
            height="72"
            rx="8"
            fill="#f3e8ff"
            stroke="#7b1fa2"
            strokeWidth={selectedScope === 'ENGAGEMENT' ? '3.5' : '2'}
          />
          <text x="258" y="162" textAnchor="middle" fill="#6b21a8" fontSize="12" fontWeight="700">
            4. ENGAGEMENT Scope (Active)
          </text>
          <text x="258" y="182" textAnchor="middle" fill="#581c87" fontSize="11">
            &quot;FY2026 Statutory Audit — Acme Corp&quot;
          </text>

          <rect
            x="426"
            y="132"
            width="280"
            height="72"
            rx="8"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="566" y="162" textAnchor="middle" fill="#475569" fontSize="12" fontWeight="600">
            Sibling / Prior Engagement (Isolated)
          </text>
          <text x="566" y="182" textAnchor="middle" fill="#64748b" fontSize="11">
            Hidden if user only has FY2026 ENGAGEMENT grant
          </text>
        </g>
      </svg>
    </div>
  );
};

interface DiagramCProps {
  activePhase: number;
  onSelectPhase: (phaseNumber: number) => void;
}

export const DiagramCLifecycleSwimlane: React.FC<DiagramCProps> = ({
  activePhase,
  onSelectPhase,
}) => {
  const phases = [
    { num: 1, name: '1. Onboarding', gate: 'Dual-Key + Retainer', color: '#f57c00' },
    { num: 2, name: '2. Planning', gate: 'Materiality & SRM Lock', color: '#005082' },
    { num: 3, name: '3. Fieldwork', gate: 'TB/GL & PBC Testing', color: '#009688' },
    { num: 4, name: '4. Manager Review', gate: 'No Self-Review Check', color: '#005082' },
    { num: 5, name: '5. Partner Sign-off', gate: 'EQCR Concurrence', color: '#7b1fa2' },
    { num: 6, name: '6. Report & Delivery', gate: 'Signed Opinion PDF', color: '#005082' },
    { num: 7, name: '7. Archive & Close', gate: 'Immutable Binder Lock', color: '#334155' },
  ];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 880 140"
        className="w-full h-auto min-w-[720px]"
        role="img"
        aria-label="Diagram C: 7-Phase AuditSphere Engagement Lifecycle"
      >
        <defs>
          <marker id="arrow-lifecycle" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
          </marker>
        </defs>
        {phases.map((p, idx) => {
          const x = 14 + idx * 123;
          const isSelected = activePhase === p.num;
          return (
            <g
              key={p.num}
              className="cursor-pointer"
              onClick={() => onSelectPhase(p.num)}
            >
              <rect
                x={x}
                y={isSelected ? 16 : 24}
                width="108"
                height={isSelected ? 96 : 80}
                rx="10"
                fill={p.color}
                opacity={isSelected ? 1 : 0.88}
                stroke={isSelected ? '#0f172a' : 'none'}
                strokeWidth={isSelected ? '2.5' : '0'}
              />
              <text
                x={x + 54}
                y={isSelected ? 52 : 56}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
              >
                {p.name}
              </text>
              <text
                x={x + 54}
                y={isSelected ? 74 : 76}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="9.5"
              >
                {p.gate}
              </text>
              {isSelected && (
                <text
                  x={x + 54}
                  y="96"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="9"
                  fontWeight="700"
                >
                  ACTIVE VIEW
                </text>
              )}
              {idx < phases.length - 1 && (
                <line
                  x1={x + 108}
                  y1="64"
                  x2={x + 121}
                  y2="64"
                  stroke="#64748b"
                  strokeWidth="2"
                  markerEnd="url(#arrow-lifecycle)"
                />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
};

interface DiagramDProps {
  clientKey: boolean;
  partnerKey: boolean;
  retainerPaid: boolean;
  onToggleKey?: (key: 'client' | 'partner' | 'retainer') => void;
}

export const DiagramDDualKeyGate: React.FC<DiagramDProps> = ({
  clientKey,
  partnerKey,
  retainerPaid,
  onToggleKey,
}) => {
  const allReady = clientKey && partnerKey && retainerPaid;

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 820 220"
        className="w-full h-auto min-w-[620px]"
        role="img"
        aria-label="Diagram D: Dual-Key Engagement Acceptance and Paid Retainer Activation Gate (M1-03)"
      >
        <defs>
          <marker id="arrow-gate" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#475569" />
          </marker>
        </defs>

        {/* Key 1 */}
        <g className="cursor-pointer" onClick={() => onToggleKey?.('client')}>
          <rect
            x="20"
            y="18"
            width="235"
            height="50"
            rx="8"
            fill={clientKey ? '#f57c00' : '#475569'}
          />
          <text x="137" y="40" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
            Key 1: Client Acceptance Key
          </text>
          <text x="137" y="57" textAnchor="middle" fill="#ffedd5" fontSize="10.5">
            CLIENT_PRIMARY ({clientKey ? 'APPROVED' : 'PENDING — Click to toggle'})
          </text>
        </g>

        {/* Key 2 */}
        <g className="cursor-pointer" onClick={() => onToggleKey?.('partner')}>
          <rect
            x="20"
            y="85"
            width="235"
            height="50"
            rx="8"
            fill={partnerKey ? '#005082' : '#475569'}
          />
          <text x="137" y="107" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
            Key 2: Partner Clearance Key
          </text>
          <text x="137" y="124" textAnchor="middle" fill="#bae6fd" fontSize="10.5">
            ENGAGEMENT_PARTNER ({partnerKey ? 'CLEARED' : 'PENDING — Click to toggle'})
          </text>
        </g>

        {/* Key 3 */}
        <g className="cursor-pointer" onClick={() => onToggleKey?.('retainer')}>
          <rect
            x="20"
            y="152"
            width="235"
            height="50"
            rx="8"
            fill={retainerPaid ? '#009688' : '#475569'}
          />
          <text x="137" y="174" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="700">
            Key 3: Retainer Paid Clearance
          </text>
          <text x="137" y="191" textAnchor="middle" fill="#ccfbf1" fontSize="10.5">
            FIRM_FINANCE ({retainerPaid ? 'PAID' : 'PENDING — Click to toggle'})
          </text>
        </g>

        {/* Central Gate */}
        <polygon
          points="395,45 480,110 395,175 310,110"
          fill={allReady ? '#ecfdf5' : '#fffbeb'}
          stroke={allReady ? '#059669' : '#d97706'}
          strokeWidth="2.5"
        />
        <text x="395" y="105" textAnchor="middle" fill="#0f172a" fontSize="11.5" fontWeight="700">
          M1-03 Gate
        </text>
        <text x="395" y="121" textAnchor="middle" fill="#475569" fontSize="10">
          {allReady ? '3 / 3 Verified' : 'Awaiting Keys'}
        </text>

        {/* Outcomes */}
        <rect
          x="545"
          y="36"
          width="255"
          height="62"
          rx="10"
          fill={allReady ? '#16a34a' : '#cbd5e1'}
        />
        <text
          x="672"
          y="63"
          textAnchor="middle"
          fill={allReady ? '#ffffff' : '#475569'}
          fontSize="12.5"
          fontWeight="700"
        >
          Engagement Activated
        </text>
        <text
          x="672"
          y="81"
          textAnchor="middle"
          fill={allReady ? '#dcfce7' : '#64748b'}
          fontSize="10.5"
        >
          Phase 2 (Planning) &amp; Fieldwork Unlocked
        </text>

        <rect
          x="545"
          y="122"
          width="255"
          height="62"
          rx="10"
          fill={!allReady ? '#dc2626' : '#cbd5e1'}
        />
        <text
          x="672"
          y="149"
          textAnchor="middle"
          fill={!allReady ? '#ffffff' : '#475569'}
          fontSize="12.5"
          fontWeight="700"
        >
          Engagement Locked
        </text>
        <text
          x="672"
          y="167"
          textAnchor="middle"
          fill={!allReady ? '#fee2e2' : '#64748b'}
          fontSize="10.5"
        >
          Read-Only Onboarding State
        </text>

        {/* Connectors */}
        <path d="M 255 43 L 335 88" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow-gate)" />
        <line x1="255" y1="110" x2="305" y2="110" stroke="#475569" strokeWidth="2" markerEnd="url(#arrow-gate)" />
        <path d="M 255 177 L 335 132" stroke="#475569" strokeWidth="2" fill="none" markerEnd="url(#arrow-gate)" />
        <path d="M 480 110 L 540 67" stroke="#059669" strokeWidth="2.5" fill="none" markerEnd="url(#arrow-gate)" />
        <path d="M 480 110 L 540 153" stroke="#dc2626" strokeWidth="2.5" fill="none" markerEnd="url(#arrow-gate)" />
      </svg>
    </div>
  );
};

interface DiagramEProps {
  highlightedRole?: RoleCode;
  onSelectRole?: (role: RoleCode) => void;
}

export const DiagramEDecisionTree: React.FC<DiagramEProps> = ({
  highlightedRole,
  onSelectRole,
}) => {
  const staffLeaves: { code: RoleCode; label: string; y: number }[] = [
    { code: 'ENGAGEMENT_PARTNER', label: 'ENGAGEMENT_PARTNER', y: 18 },
    { code: 'QUALITY_REVIEWER', label: 'QUALITY_REVIEWER', y: 54 },
    { code: 'AUDIT_MANAGER', label: 'AUDIT_MANAGER', y: 90 },
    { code: 'SENIOR_AUDITOR', label: 'SENIOR_AUDITOR', y: 126 },
    { code: 'STAFF_AUDITOR', label: 'STAFF_AUDITOR', y: 162 },
    { code: 'ADMINISTRATOR', label: 'ADMINISTRATOR', y: 198 },
    { code: 'FIRM_FINANCE', label: 'FIRM_FINANCE', y: 234 },
  ];

  const clientLeaves: { code: RoleCode; label: string; y: number }[] = [
    { code: 'CLIENT_PRIMARY', label: 'CLIENT_PRIMARY', y: 278 },
    { code: 'CLIENT_CONTRIBUTOR', label: 'CLIENT_CONTRIBUTOR', y: 314 },
    { code: 'CLIENT_VIEWER', label: 'CLIENT_VIEWER', y: 350 },
  ];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 840 390"
        className="w-full h-auto min-w-[640px]"
        role="img"
        aria-label="Diagram E: Role Selection Decision Tree mapping questions to all 10 roles"
      >
        {/* Root Question */}
        <rect x="16" y="165" width="165" height="58" rx="10" fill="#1e293b" />
        <text x="98" y="191" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">
          Which Organization?
        </text>
        <text x="98" y="209" textAnchor="middle" fill="#94a3b8" fontSize="10">
          Staff vs. Client Portal
        </text>

        {/* Staff Branch Box */}
        <rect x="235" y="95" width="215" height="90" rx="10" fill="#e0f2fe" stroke="#005082" strokeWidth="2" />
        <text x="342" y="122" textAnchor="middle" fill="#005082" fontSize="12" fontWeight="700">
          Audit Firm Staff (7 Roles)
        </text>
        <text x="342" y="142" textAnchor="middle" fill="#0369a1" fontSize="10.5">
          • Audit Delivery &amp; EQCR (5)
        </text>
        <text x="342" y="160" textAnchor="middle" fill="#0369a1" fontSize="10.5">
          • Operations &amp; Finance (2)
        </text>

        {/* Client Branch Box */}
        <rect x="235" y="275" width="215" height="90" rx="10" fill="#fff7ed" stroke="#f57c00" strokeWidth="2" />
        <text x="342" y="302" textAnchor="middle" fill="#c2410c" fontSize="12" fontWeight="700">
          Client Organization (3 Roles)
        </text>
        <text x="342" y="322" textAnchor="middle" fill="#ea580c" fontSize="10.5">
          • Signs Key 1 &amp; TB → Primary
        </text>
        <text x="342" y="340" textAnchor="middle" fill="#ea580c" fontSize="10.5">
          • Uploads PBC vs. Read-Only
        </text>

        {/* Root to Branches */}
        <path d="M 181 182 L 235 140" stroke="#005082" strokeWidth="2.5" fill="none" />
        <path d="M 181 206 L 235 320" stroke="#f57c00" strokeWidth="2.5" fill="none" />

        {/* Staff Leaves */}
        {staffLeaves.map((item) => {
          const isHigh = highlightedRole === item.code;
          return (
            <g
              key={item.code}
              className="cursor-pointer"
              onClick={() => onSelectRole?.(item.code)}
            >
              <path
                d={`M 450 140 L 555 ${item.y + 14}`}
                stroke={isHigh ? '#0284c7' : '#94a3b8'}
                strokeWidth={isHigh ? '2.5' : '1.5'}
                fill="none"
              />
              <rect
                x="555"
                y={item.y}
                width="265"
                height="28"
                rx="6"
                fill={isHigh ? '#0284c7' : '#005082'}
                stroke={isHigh ? '#0f172a' : 'none'}
                strokeWidth={isHigh ? '2' : '0'}
              />
              <text
                x="687"
                y={item.y + 18}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Client Leaves */}
        {clientLeaves.map((item) => {
          const isHigh = highlightedRole === item.code;
          return (
            <g
              key={item.code}
              className="cursor-pointer"
              onClick={() => onSelectRole?.(item.code)}
            >
              <path
                d={`M 450 320 L 555 ${item.y + 14}`}
                stroke={isHigh ? '#ea580c' : '#94a3b8'}
                strokeWidth={isHigh ? '2.5' : '1.5'}
                fill="none"
              />
              <rect
                x="555"
                y={item.y}
                width="265"
                height="28"
                rx="6"
                fill={isHigh ? '#ea580c' : '#f57c00'}
                stroke={isHigh ? '#0f172a' : 'none'}
                strokeWidth={isHigh ? '2' : '0'}
              />
              <text
                x="687"
                y={item.y + 18}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
              >
                {item.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const DiagramFOnboardingSequence: React.FC = () => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 840 245"
        className="w-full h-auto min-w-[640px]"
        role="img"
        aria-label="Diagram F: End-to-End Onboarding Sequence from Requestor to Administrator to Entra ID to Server to End User"
      >
        <defs>
          <marker id="arrow-seq" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#005082" />
          </marker>
        </defs>

        {/* 5 Columns */}
        {[
          { x: 20, title: '1. Requestor', sub: 'Partner / Client CFO', color: '#334155' },
          { x: 185, title: '2. Administrator', sub: '/admin/access Console', color: '#005082' },
          { x: 350, title: '3. Invitation Flow', sub: 'Graph Disabled (Manual)', color: '#009688' },
          { x: 515, title: '4. Microsoft Entra ID', sub: 'Work Email SSO & MFA', color: '#455a64' },
          { x: 680, title: '5. AuditSphere Server', sub: 'Bound & Scoped Workspace', color: '#f57c00' },
        ].map((col, idx) => (
          <g key={col.title}>
            <rect x={col.x} y="16" width="140" height="50" rx="8" fill={col.color} />
            <text x={col.x + 70} y="38" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="700">
              {col.title}
            </text>
            <text x={col.x + 70} y="54" textAnchor="middle" fill="#e2e8f0" fontSize="9.5">
              {col.sub}
            </text>
            <line
              x1={col.x + 70}
              y1="66"
              x2={col.x + 70}
              y2="225"
              stroke="#cbd5e1"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />
            {idx < 4 && (
              <line
                x1={col.x + 140}
                y1="41"
                x2={col.x + 185}
                y2="41"
                stroke="#005082"
                strokeWidth="2"
                markerEnd="url(#arrow-seq)"
              />
            )}
          </g>
        ))}

        {/* Sequence Arrows */}
        <g>
          <line x1="90" y1="95" x2="255" y2="95" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="172" y="88" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            Emails CSV / Table Request
          </text>

          <line x1="255" y1="128" x2="420" y2="128" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="337" y="121" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            Binds Roster + Assigns RoleGrant
          </text>

          <line x1="420" y1="162" x2="585" y2="162" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="502" y="155" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            User Clicks Invitation Link → SSO
          </text>

          <line x1="585" y1="198" x2="750" y2="198" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="667" y="191" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            Verifies oid/tid &amp; Opens Portal
          </text>
        </g>
      </svg>
    </div>
  );
};
