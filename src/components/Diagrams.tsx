// Corrected diagrams for the access request journey.
// Scope containment matches the server rules: firm-wide covers clients and
// engagements; group access is a separate, explicit grant that is never implied.
import React, { useState } from 'react';
import { RoleCode, ScopeCode } from '../data/rolesData.ts';

interface DiagramAProps {
  onSelectPortal?: (portal: 'Staff' | 'Client') => void;
}

export const DiagramASystemMap: React.FC<DiagramAProps> = ({ onSelectPortal }) => {
  const [activeNode, setActiveNode] = useState<'ENTRA' | 'GUARD' | 'STAFF' | 'CLIENT' | null>(null);

  const nodeDetails: Record<'ENTRA' | 'GUARD' | 'STAFF' | 'CLIENT', { title: string; detail: string }> = {
    ENTRA: {
      title: 'Microsoft Sign-In (single identity)',
      detail:
        'Everyone signs in with an individual work email through Microsoft. AuditSphere validates the immutable identity claims and never issues its own passwords.',
    },
    GUARD: {
      title: 'Server-side roster & grant check',
      detail:
        'Every action re-checks that the signed-in person is bound to a roster record and holds an active, unexpired grant for that exact role + coverage.',
    },
    STAFF: {
      title: 'Staff portal — 10 staff roles',
      detail:
        'For firm identities: audit delivery, client accounting, firm billing & ledger, client relationships, and administration.',
    },
    CLIENT: {
      title: 'Client portal — 1 client role',
      detail:
        'A strictly isolated workspace for client identities: document requests (PBC items), uploads and responses, only for the granted client or engagement.',
    },
  };

  return (
    <div className="space-y-3">
      <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
        <svg
          viewBox="0 0 840 310"
          className="w-full h-auto min-w-[640px]"
          role="img"
          aria-label="Diagram A: AuditSphere system overview showing staff portal vs client portal behind Microsoft sign-in"
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

          {/* Left actors */}
          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveNode('STAFF');
              onSelectPortal?.('Staff');
            }}
          >
            <rect x="20" y="34" width="185" height="66" rx="10" fill="#005082" />
            <text x="112" y="62" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Your firm&apos;s people
            </text>
            <text x="112" y="81" textAnchor="middle" fill="#bae6fd" fontSize="11">
              Partners, managers, seniors, staff, finance, admin
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
              Your clients&apos; people
            </text>
            <text x="112" y="243" textAnchor="middle" fill="#ffedd5" fontSize="11">
              Finance leads &amp; client-side team members
            </text>
          </g>

          {/* Center Entra + Guard */}
          <g className="cursor-pointer" onClick={() => setActiveNode('ENTRA')}>
            <rect x="255" y="64" width="190" height="64" rx="10" fill="#334155" stroke="#94a3b8" strokeWidth="1.5" />
            <text x="350" y="92" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Microsoft sign-in
            </text>
            <text x="350" y="111" textAnchor="middle" fill="#cbd5e1" fontSize="11">
              Individual work email + MFA
            </text>
          </g>

          <g className="cursor-pointer" onClick={() => setActiveNode('GUARD')}>
            <rect x="255" y="168" width="190" height="68" rx="10" fill="#0f766e" />
            <text x="350" y="196" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="700">
              Server roster &amp; grant check
            </text>
            <text x="350" y="215" textAnchor="middle" fill="#ccfbf1" fontSize="11">
              Role + coverage, re-checked every action
            </text>
          </g>

          {/* Right portals */}
          <g
            className="cursor-pointer"
            onClick={() => {
              setActiveNode('STAFF');
              onSelectPortal?.('Staff');
            }}
          >
            <rect x="505" y="18" width="315" height="128" rx="12" fill="#f0f9ff" stroke="#005082" strokeWidth="2" />
            <text x="662" y="42" textAnchor="middle" fill="#005082" fontSize="13" fontWeight="700">
              STAFF PORTAL — 10 STAFF ROLES
            </text>
            <rect x="522" y="54" width="135" height="34" rx="6" fill="#005082" />
            <text x="589" y="75" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Audit delivery
            </text>
            <rect x="668" y="54" width="135" height="34" rx="6" fill="#005082" />
            <text x="735" y="75" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Client accounting
            </text>
            <rect x="522" y="98" width="135" height="34" rx="6" fill="#0369a1" />
            <text x="589" y="119" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Billing &amp; ledger
            </text>
            <rect x="668" y="98" width="135" height="34" rx="6" fill="#334155" />
            <text x="735" y="119" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Users &amp; access
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
              CLIENT PORTAL — 1 CLIENT ROLE
            </text>
            <rect x="522" y="205" width="135" height="34" rx="6" fill="#f57c00" />
            <text x="589" y="226" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Document requests
            </text>
            <rect x="668" y="205" width="135" height="34" rx="6" fill="#f57c00" />
            <text x="735" y="226" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Uploads &amp; responses
            </text>
            <rect x="522" y="247" width="281" height="30" rx="6" fill="#ea580c" />
            <text x="662" y="266" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="600">
              Granted client / engagement only — nothing wider
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
        <span>Click any node to see how the boundary is enforced.</span>
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
        viewBox="0 0 840 300"
        className="w-full h-auto min-w-[640px]"
        role="img"
        aria-label="Diagram B: scope containment - whole firm covers clients and engagements; consolidation groups are an explicit, separate grant"
      >
        {/* Left: concentric containment */}
        <text x="16" y="24" fill="#0f172a" fontSize="12.5" fontWeight="700">
          Every standard grant lives in this tree:
        </text>

        {/* FIRM_WIDE */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('FIRM_WIDE')}>
          <rect
            x="16"
            y="34"
            width="500"
            height="250"
            rx="14"
            fill="#e0f2fe"
            stroke="#005082"
            strokeWidth={selectedScope === 'FIRM_WIDE' ? '3.5' : '2'}
          />
          <text x="34" y="60" fill="#005082" fontSize="12.5" fontWeight="700">
            Whole firm (FIRM_WIDE) — every client &amp; engagement
          </text>
          <text x="34" y="78" fill="#0369a1" fontSize="10.5">
            One grant, no target. Never implies group access.
          </text>
        </g>

        {/* CLIENT */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('CLIENT')}>
          <rect
            x="46"
            y="92"
            width="440"
            height="168"
            rx="12"
            fill="#fff7ed"
            stroke="#009688"
            strokeWidth={selectedScope === 'CLIENT' ? '3.5' : '2'}
          />
          <text x="64" y="116" fill="#00695c" fontSize="12" fontWeight="700">
            One client (CLIENT) — the client + all its engagements
          </text>
        </g>

        {/* ENGAGEMENT */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('ENGAGEMENT')}>
          <rect
            x="76"
            y="134"
            width="186"
            height="98"
            rx="10"
            fill="#f3e8ff"
            stroke="#7b1fa2"
            strokeWidth={selectedScope === 'ENGAGEMENT' ? '3.5' : '2'}
          />
          <text x="169" y="170" textAnchor="middle" fill="#6b21a8" fontSize="11.5" fontWeight="700">
            One engagement
          </text>
          <text x="169" y="188" textAnchor="middle" fill="#581c87" fontSize="10">
            (ENGAGEMENT) — that single
          </text>
          <text x="169" y="204" textAnchor="middle" fill="#581c87" fontSize="10">
            engagement only
          </text>
        </g>

        {/* Sibling isolated engagement */}
        <g>
          <rect
            x="286"
            y="134"
            width="186"
            height="98"
            rx="10"
            fill="#f8fafc"
            stroke="#94a3b8"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="379" y="170" textAnchor="middle" fill="#475569" fontSize="11.5" fontWeight="600">
            Other engagements of the
          </text>
          <text x="379" y="188" textAnchor="middle" fill="#64748b" fontSize="10">
            same client stay hidden,
          </text>
          <text x="379" y="204" textAnchor="middle" fill="#64748b" fontSize="10">
            unless granted too
          </text>
        </g>

        {/* Right: GROUP as explicit parallel grant */}
        <g className="cursor-pointer" onClick={() => onSelectScope?.('GROUP')}>
          <rect
            x="560"
            y="34"
            width="264"
            height="250"
            rx="14"
            fill="#e0f2f1"
            stroke="#26a69a"
            strokeWidth={selectedScope === 'GROUP' ? '3.5' : '2'}
          />
          <text x="578" y="60" fill="#00695c" fontSize="12.5" fontWeight="700">
            Consolidation group (GROUP)
          </text>
          <text x="578" y="82" fill="#0f172a" fontSize="10.5" fontWeight="600">
            A separate, explicit grant
          </text>
          <text x="578" y="104" fill="#475569" fontSize="10.5">Named parent + subsidiaries</text>
          <text x="578" y="122" fill="#475569" fontSize="10.5">7 staff roles only — never</text>
          <text x="578" y="140" fill="#475569" fontSize="10.5">automatic, never implied</text>
          <text x="578" y="162" fill="#475569" fontSize="10.5">by firm-wide access, and</text>
          <text x="578" y="180" fill="#475569" fontSize="10.5">it never replaces the</text>
          <text x="578" y="198" fill="#475569" fontSize="10.5">client grants of each</text>
          <text x="578" y="216" fill="#475569" fontSize="10.5">component company.</text>
          <text x="578" y="244" fill="#00695c" fontSize="10.5" fontWeight="600">
            No expiry date — ended by
          </text>
          <text x="578" y="260" fill="#00695c" fontSize="10.5" fontWeight="600">
            explicit revocation.
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
    { num: 1, name: '1. Setup', gate: 'Request → grant → invitation', color: '#005082' },
    { num: 2, name: '2. Planning', gate: 'Scope in the portal', color: '#009688' },
    { num: 3, name: '3. Fieldwork & review', gate: 'Reviewer ≠ preparer', color: '#0f766e' },
    { num: 4, name: '4. Sign-off & delivery', gate: 'Distinct people per stage', color: '#7b1fa2' },
    { num: 5, name: '5. After the work', gate: 'Expiry / revocation', color: '#334155' },
  ];

  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 880 140"
        className="w-full h-auto min-w-[640px]"
        role="img"
        aria-label="Diagram C: five phases from request to expiry"
      >
        <defs>
          <marker id="arrow-lifecycle" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
          </marker>
        </defs>
        {phases.map((p, idx) => {
          const x = 14 + idx * 170;
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
                width="150"
                height={isSelected ? 96 : 80}
                rx="10"
                fill={p.color}
                opacity={isSelected ? 1 : 0.88}
                stroke={isSelected ? '#0f172a' : 'none'}
                strokeWidth={isSelected ? '2.5' : '0'}
              />
              <text
                x={x + 75}
                y={isSelected ? 52 : 56}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="11"
                fontWeight="700"
              >
                {p.name}
              </text>
              <text
                x={x + 75}
                y={isSelected ? 74 : 76}
                textAnchor="middle"
                fill="#e2e8f0"
                fontSize="9.5"
              >
                {p.gate}
              </text>
              {isSelected && (
                <text
                  x={x + 75}
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
                  x1={x + 150}
                  y1="64"
                  x2={x + 168}
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

export const DiagramFOnboardingSequence: React.FC = () => {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 p-4">
      <svg
        viewBox="0 0 840 245"
        className="w-full h-auto min-w-[640px]"
        role="img"
        aria-label="Diagram F: onboarding sequence from request to first sign-in"
      >
        <defs>
          <marker id="arrow-seq" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1 L 10 5 L 0 9 z" fill="#005082" />
          </marker>
        </defs>

        {/* 5 Columns */}
        {[
          { x: 20, title: '1. Requester', sub: 'Submit from this page', color: '#334155' },
          { x: 185, title: '2. Firm Administrator', sub: 'Reviews & applies the grant', color: '#005082' },
          { x: 350, title: '3. Invitation link', sub: 'Copied & sent', color: '#009688' },
          { x: 515, title: '4. Microsoft sign-in', sub: 'Individual work email', color: '#455a64' },
          { x: 680, title: '5. Workspace open', sub: 'Exactly the granted scope', color: '#f57c00' },
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
            Submits people + roles + coverage
          </text>

          <line x1="255" y1="128" x2="420" y2="128" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="337" y="121" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            Verifies identity, applies grant
          </text>

          <line x1="420" y1="162" x2="585" y2="162" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="502" y="155" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            Person opens link → signs in
          </text>

          <line x1="585" y1="198" x2="750" y2="198" stroke="#005082" strokeWidth="2" markerEnd="url(#arrow-seq)" />
          <text x="667" y="191" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="600">
            Identity bound → scoped access
          </text>
        </g>
      </svg>
    </div>
  );
};
