import React, { useEffect, useMemo, useState } from 'react';
import {
  ACTION_CALLOUT,
   AccountType,
  CAPABILITY_MATRIX,
  CapabilityLevel,
  DELIVERABLES_LIST,
  EVIDENCE_ROWS,
  FAQ_ITEMS,
  GLOSSARY_ITEMS,
  INITIAL_REQUEST_ROWS,
  LIFECYCLE_PHASES,
  OPEN_QUESTIONS,
  REPO_CROSSWALK,
  ROLES,
  RoleCode,
  RoleRequestRow,
  SCOPES,
  ScopeCode,
} from './data/rolesData.ts';
import {
  DecisionTreeAnswers,
  detectSeparationOfDutiesWarnings,
  exportRequestsToCsv,
  exportRequestsToMarkdownTable,
  getRoleByCode,
  recommendRole,
  validateRoleRequestRow,
} from './utils/roleAssessor.ts';
import {
  DiagramASystemMap,
  DiagramBScopeContainment,
  DiagramCLifecycleSwimlane,
  DiagramEDecisionTree,
  DiagramFOnboardingSequence,
} from './components/Diagrams.tsx';
import { SimulatorsSection } from './components/SimulatorsSection.tsx';
import { AdminSandbox } from './components/AdminSandbox.tsx';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  Download,
  FileSpreadsheet,
  FileText,
  Moon,
  Plus,
  Printer,
  Search,
  Sun,
  Trash2,
} from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('auditsphere_theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {}
    return false; // Default to Lite / Light mode
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      try {
        localStorage.setItem('auditsphere_theme', 'dark');
      } catch {}
    } else {
      document.documentElement.classList.remove('dark');
      try {
        localStorage.setItem('auditsphere_theme', 'light');
      } catch {}
    }
  }, [darkMode]);

  // Section 1 copy feedback
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedSubject, setCopiedSubject] = useState(false);

  // Section 3 & 4 filters
  const [portalFilter, setPortalFilter] = useState<'ALL' | AccountType>('ALL');
  const [scopeFilter, setScopeFilter] = useState<'ALL' | ScopeCode>('ALL');
  const [roleSearch, setRoleSearch] = useState('');
  const [expandAllRoles, setExpandAllRoles] = useState(true);

  // Section 5 active lifecycle phase
  const [activePhaseNum, setActivePhaseNum] = useState<number>(1);

  // Section 7 capability matrix filter
  const [matrixAccountFilter, setMatrixAccountFilter] = useState<'ALL' | AccountType>('ALL');
  const [matrixModuleSearch, setMatrixModuleSearch] = useState('');
  const [selectedCellNote, setSelectedCellNote] = useState<{
    moduleName: string;
    roleCode: RoleCode;
    level: CapabilityLevel;
    note: string;
  } | null>(null);

  // Section 8 Decision Tree Wizard state
  const [wizardAnswers, setWizardAnswers] = useState<DecisionTreeAnswers>({
    isExternalClient: false,
    clientSignsAcceptanceOrTb: true,
    clientUploadsPbcDocuments: true,
    staffPerformsAuditOrAccounting: true,
    staffManagesUsersOrBilling: 'USERS_ACCESS',
    staffSignsOpinionOrQualityReview: 'ENGAGEMENT_PARTNER',
    staffManagesFieldworkOrReviews: 'AUDIT_MANAGER',
  });

  // Section 9 Request Builder state
  const [requestRows, setRequestRows] = useState<RoleRequestRow[]>(INITIAL_REQUEST_ROWS);
  const [draftRow, setDraftRow] = useState<RoleRequestRow>({
    id: 'draft',
    fullName: '',
    workEmail: '',
    accountType: 'Staff',
    roleRequested: 'SENIOR_AUDITOR',
    scopeType: 'ENGAGEMENT',
    scopeTarget: 'Engagement: FY2026 Audit - Acme Corp',
    startDate: '2026-11-10',
    expiry: '2027-04-30',
    approvedBy: 'Sarah Jenkins',
    notes: '',
  });
  const [draftError, setDraftError] = useState<string | null>(null);
  const [copiedMarkdown, setCopiedMarkdown] = useState(false);

  // Section 12 FAQ category filter
  const [faqCategory, setFaqCategory] = useState<string>('ALL');

  // Filtered roles for Section 4
  const filteredRoles = useMemo(() => {
    return ROLES.filter((r) => {
      if (portalFilter !== 'ALL' && r.accountType !== portalFilter) return false;
      if (scopeFilter !== 'ALL' && !r.allowedScopes.includes(scopeFilter)) return false;
      if (roleSearch.trim()) {
        const q = roleSearch.toLowerCase();
        const hay = `${r.code} ${r.displayLabel} ${r.summaryAndTitles} ${r.dailyResponsibilities}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [portalFilter, scopeFilter, roleSearch]);

  // Decision tree recommendation
  const recommendation = useMemo(
    () => recommendRole(wizardAnswers),
    [wizardAnswers]
  );

  // Request rows validation & SoD warnings
  const rowValidations = useMemo(
    () => requestRows.map((row) => ({ row, validation: validateRoleRequestRow(row) })),
    [requestRows]
  );
  const sodWarnings = useMemo(
    () => detectSeparationOfDutiesWarnings(requestRows),
    [requestRows]
  );

  const activeLifecyclePhase =
    LIFECYCLE_PHASES.find((p) => p.phaseNumber === activePhaseNum) ?? LIFECYCLE_PHASES[0];

  const matrixRoles = useMemo(() => {
    if (matrixAccountFilter === 'ALL') return ROLES;
    return ROLES.filter((r) => r.accountType === matrixAccountFilter);
  }, [matrixAccountFilter]);

  const filteredMatrixRows = useMemo(() => {
    if (!matrixModuleSearch.trim()) return CAPABILITY_MATRIX;
    const q = matrixModuleSearch.toLowerCase();
    return CAPABILITY_MATRIX.filter(
      (m) =>
        m.moduleName.toLowerCase().includes(q) ||
        m.moduleSubtitle.toLowerCase().includes(q)
    );
  }, [matrixModuleSearch]);

  const filteredFaqs = useMemo(() => {
    if (faqCategory === 'ALL') return FAQ_ITEMS;
    return FAQ_ITEMS.filter((f) => f.category === faqCategory);
  }, [faqCategory]);

  const handleCopyText = (text: string, which: 'email' | 'subject' | 'markdown') => {
    navigator.clipboard?.writeText(text).catch(() => {});
    if (which === 'email') {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    } else if (which === 'subject') {
      setCopiedSubject(true);
      setTimeout(() => setCopiedSubject(false), 2000);
    } else {
      setCopiedMarkdown(true);
      setTimeout(() => setCopiedMarkdown(false), 2000);
    }
  };

  const handleAddRecommendedToForm = () => {
    const recRole = recommendation.role;
    const defaultScope = recommendation.recommendedScopes[0];
    setDraftRow((prev) => ({
      ...prev,
      accountType: recRole.accountType,
      roleRequested: recRole.code,
      scopeType: defaultScope,
      scopeTarget:
        defaultScope === 'FIRM_WIDE'
          ? 'Firm-Wide'
          : defaultScope === 'GROUP'
          ? 'Group: Apex Holdings Group'
          : defaultScope === 'CLIENT'
          ? 'Client: Acme Corp'
          : 'Engagement: FY2026 Audit - Acme Corp',
    }));
    document.getElementById('sec-9')?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAddRequestRow = (e: React.FormEvent) => {
    e.preventDefault();
    const check = validateRoleRequestRow(draftRow);
    if (!check.isValid) {
      setDraftError(check.errors.join(' '));
      return;
    }
    setDraftError(null);
    const created: RoleRequestRow = {
      ...draftRow,
      id: `req-${Date.now()}`,
      fullName: draftRow.fullName.trim(),
      workEmail: draftRow.workEmail.trim().toLowerCase(),
    };
    setRequestRows((prev) => [...prev, created]);
    setDraftRow((prev) => ({
      ...prev,
      fullName: '',
      workEmail: '',
      notes: '',
    }));
  };

  const handleRemoveRequestRow = (id: string) => {
    setRequestRows((prev) => prev.filter((r) => r.id !== id));
  };

  const handleDownloadCsv = () => {
    const csvContent = exportRequestsToCsv(requestRows);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'role-assignment-request-template.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const getCapabilityTextStyle = (level: CapabilityLevel): string => {
    switch (level) {
      case 'Full':
      case 'Admin':
        return 'text-sky-900 dark:text-sky-300 font-bold';
      case 'Review':
      case 'Concur':
        return 'text-purple-800 dark:text-purple-300 font-semibold';
      case 'Edit':
      case 'Prepare':
      case 'Upload':
      case 'Assigned':
        return 'text-teal-800 dark:text-teal-300 font-semibold';
      case 'View':
        return 'text-slate-600 dark:text-slate-300 font-medium';
      default:
        return 'text-slate-400 dark:text-slate-600';
    }
  };

  return (
    <div className={darkMode ? 'dark' : ''}>
      <div className="min-h-screen overflow-x-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
        {/* Strict 3-Zone Top Bar Contract */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xs no-print">
          {/* Zone 1: Single text element wordmark */}
          <a
            href="#top"
            className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0"
          >
            AuditSphere
          </a>

          {/* Zone 2: 5 concise single-line text navigation links */}
          <nav
            aria-label="Primary Guide Navigation"
            className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300"
          >
            <a
              href="#sec-2"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Overview
            </a>
            <a
              href="#sec-4"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Role Cards
            </a>
            <a
              href="#sec-6"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Simulators
            </a>
            <a
              href="#sec-7"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Capabilities
            </a>
            <a
              href="#sec-9"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Request Form
            </a>
          </nav>

          {/* Zone 3: 1 primary action + Lite / Dark mode switch */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div
              role="group"
              aria-label="Color theme switcher"
              className="flex items-center gap-0.5 p-0.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 text-xs"
            >
              <button
                type="button"
                onClick={() => setDarkMode(false)}
                className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  !darkMode
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                aria-label="Switch to Lite / Light mode"
                aria-pressed={!darkMode}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span className="hidden sm:inline">Lite</span>
              </button>
              <button
                type="button"
                onClick={() => setDarkMode(true)}
                className={`px-2 py-1 rounded-md flex items-center gap-1 font-medium cursor-pointer transition-colors whitespace-nowrap shrink-0 ${
                  darkMode
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
                aria-label="Switch to Dark mode"
                aria-pressed={darkMode}
              >
                <Moon className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Dark</span>
              </button>
            </div>

            <a
              href="#sec-9"
              className="px-4 py-2 text-xs font-semibold text-white bg-sky-800 hover:bg-sky-700 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Request Access
            </a>
          </div>
        </header>

        {/* Main 1440px Workspace Layout with Sticky Sidebar TOC */}
        <div
          id="top"
          className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 lg:py-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start"
        >
          {/* Sticky Table of Contents Sidebar */}
          <aside
            aria-label="Table of Contents"
            className="lg:col-span-3 lg:sticky lg:top-20 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4 no-print"
          >
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                Guide Contents (10-Min Read)
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDarkMode((d) => !d)}
                  aria-label={darkMode ? 'Switch to Lite / Light mode' : 'Switch to Dark mode'}
                  className="px-2 py-1 rounded-md border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-medium flex items-center gap-1"
                >
                  {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-500" /> : <Moon className="w-3.5 h-3.5 text-sky-500" />}
                  <span className="text-[11px]">{darkMode ? 'Lite Mode' : 'Dark Mode'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  aria-label="Print or save guide as PDF"
                  className="p-1.5 rounded-md border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <ol className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              {[
                { id: 'sec-1', label: '01. What We Need From You' },
                { id: 'sec-2', label: '02. 60-Second Overview' },
                { id: 'sec-3', label: '03. Role Plus Scope' },
                { id: 'sec-4', label: '04. Role Cards (10 Roles)' },
                { id: 'sec-5', label: '05. Engagement Lifecycle' },
                { id: 'sec-6', label: '06. Approvals & Separation of Duties' },
                { id: 'sec-7', label: '07. Role vs Capability Matrix' },
                { id: 'sec-8', label: '08. Which Role Should They Have?' },
                { id: 'sec-9', label: '09. Role Assignment Request Form' },
                { id: 'sec-10', label: '10. What Happens After You Reply' },
                { id: 'sec-11', label: '11. Changing or Removing Access' },
                { id: 'sec-12', label: '12. FAQ & Glossary' },
                { id: 'sec-13', label: '13. Appendices & Deliverables' },
              ].map((item) => (
                <li key={item.id}>
                  <a
                    href={`#${item.id}`}
                    className="block py-1 px-2 rounded-md hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors"
                  >
                    {item.label}
                  </a>
                </li>
              ))}
            </ol>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-[11px] text-slate-500 dark:text-slate-400">
              <div className="font-semibold text-slate-700 dark:text-slate-300">
                Downloadable Deliverables
              </div>
              <div className="flex flex-col gap-1.5">
                <a
                  href="/deliverables/auditsphere-user-guide-roles-and-access-current.md"
                  download
                  className="inline-flex items-center gap-1.5 text-sky-800 dark:text-sky-400 hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  D1: Canonical Markdown (.md)
                </a>
                <a
                  href="/deliverables/auditsphere-user-guide-roles-and-access-current.html"
                  download
                  className="inline-flex items-center gap-1.5 text-sky-800 dark:text-sky-400 hover:underline"
                >
                  <Download className="w-3.5 h-3.5" />
                  D2: Self-Contained HTML (.html)
                </a>
                <a
                  href="/deliverables/auditsphere-user-guide-roles-and-access-current.pdf"
                  download
                  className="inline-flex items-center gap-1.5 text-sky-800 dark:text-sky-400 hover:underline"
                >
                  <FileText className="w-3.5 h-3.5" />
                  D3: Print-Ready PDF (.pdf)
                </a>
                <a
                  href="/deliverables/role-assignment-request-template.csv"
                  download
                  className="inline-flex items-center gap-1.5 text-sky-800 dark:text-sky-400 hover:underline"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  D4: Request Template (.csv)
                </a>
              </div>
            </div>
          </aside>

          {/* Main Content Column */}
          <main className="lg:col-span-9 space-y-12 min-w-0">
            {/* Hero Header */}
            <section className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span>AuditSphereOps (.NET 10 + Angular 22 + PostgreSQL 18)</span>
                <span aria-hidden="true">·</span>
                <span>Microsoft Entra ID Sign-In</span>
                <span aria-hidden="true">·</span>
                <span>Reading Time: ~10 Minutes</span>
              </div>

              <h1
                className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white"
                style={{ textWrap: 'balance' }}
              >
                AuditSphere Roles &amp; Access — End-User Guide
              </h1>

              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 max-w-3xl leading-relaxed">
                Designed for Firm Partners, Office Managers, Client Finance Leads, and AuditSphere Administrators. Understand every Staff and Client Portal role, separation-of-duties guardrails, and how to submit the exact work email IDs for your engagement team.
              </p>

              {/* Key Quantitative Architecture Facts */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Total Roles</div>
                  <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
                    10 Roles
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    7 Staff · 3 Client Portal
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Data Scopes</div>
                  <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
                    4 Scope Levels
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Firm-Wide to Engagement
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Activation Gate (M1-03)</div>
                  <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
                    3 Gate Keys
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Client + Partner + Retainer
                  </div>
                </div>
                <div>
                  <div className="text-slate-500 dark:text-slate-400">Review Guardrail (M2-02)</div>
                  <div className="text-base sm:text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5 whitespace-nowrap">
                    Zero Self-Review
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Preparer != Reviewer
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 1: What We Need From You */}
            <section
              id="sec-1"
              className="rounded-2xl border border-amber-300 dark:border-amber-800/80 bg-amber-50/60 dark:bg-amber-950/25 p-6 sm:p-7 space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-amber-800 dark:text-amber-300">
                <span className="font-bold">01. Action Required: What We Need From You</span>
                <span className="font-medium">
                  Target Response: {ACTION_CALLOUT.deadlinePlaceholder}
                </span>
              </div>

              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed max-w-3xl">
                To set up your team in <strong>AuditSphere</strong> without delaying engagement fieldwork, please review this 10-minute guide and reply with the completed <strong>Role Assignment Request</strong> table or CSV (see <a href="#sec-9" className="underline font-semibold">Section 9</a>).
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-4 space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    1. Send Completed Request To
                  </div>
                  <div className="font-mono text-xs sm:text-sm font-bold text-slate-900 dark:text-white break-all">
                    {ACTION_CALLOUT.destinationEmail}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(ACTION_CALLOUT.destinationEmail, 'email')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {copiedEmail ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedEmail ? 'Copied Email Address' : 'Copy Destination Email'}
                  </button>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-4 space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    2. Required Email Subject Line
                  </div>
                  <div className="font-mono text-xs font-semibold text-slate-900 dark:text-white break-words">
                    {ACTION_CALLOUT.subjectLineTemplate}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyText(ACTION_CALLOUT.subjectLineTemplate, 'subject')}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-sky-800 dark:text-sky-400 hover:underline cursor-pointer"
                  >
                    {copiedSubject ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    {copiedSubject ? 'Copied Subject Line' : 'Copy Subject Template'}
                  </button>
                </div>

                <div className="rounded-xl border border-amber-200 dark:border-amber-900/60 bg-white dark:bg-slate-900 p-4 space-y-1.5">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    3. Critical Identity Rule
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white">
                    Exact Microsoft Sign-In Work Email Only
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                    Provide each person’s individual corporate email (<code className="font-mono">name@example.com</code>). Do <strong>not</strong> send shared mailboxes (<code className="font-mono">accounts@</code>) or personal <code className="font-mono">@gmail.com</code> addresses.
                  </p>
                </div>
              </div>
            </section>

            {/* SECTION 2: 60-Second Overview */}
            <section
              id="sec-2"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5"
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  02. Architectural Separation · Two Portals, One Identity Provider
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  60-Second Overview
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  AuditSphere divides access into two strictly separated portals — the <strong>Staff Portal</strong> for accounting firm personnel and the <strong>Client Portal</strong> for external client representatives — authenticated through <strong>Microsoft Entra ID</strong>.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5">
                  <div className="font-bold text-sky-900 dark:text-sky-400 text-sm">
                    Staff Portal (/app/*)
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Used by Partners, Quality Reviewers, Managers, Seniors, Staff Auditors, Practice Finance, and Firm Administrators to plan audits, test Trial Balances, review working papers, bill retainers, and issue audit opinions.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5">
                  <div className="font-bold text-amber-700 dark:text-amber-400 text-sm">
                    Client Portal (/portal/*)
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    Used by the client’s CFO, Finance Lead, Contributors, and Board Observers to accept engagement terms, upload Provided-by-Client (PBC) evidence, approve proposed audit adjustments, and download final signed deliverables.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                    Microsoft Entra ID Sign-In
                  </div>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    AuditSphere does not store separate passwords. Users sign in with their work email via Microsoft Entra ID, and the AuditSphere server checks their assigned <strong>Role Grants</strong> before allowing any screen or action.
                  </p>
                </div>
              </div>

              <DiagramASystemMap
                onSelectPortal={(portal) => {
                  setPortalFilter(portal);
                  document.getElementById('sec-4')?.scrollIntoView({ behavior: 'smooth' });
                }}
              />
            </section>

            {/* SECTION 3: Role Plus Scope */}
            <section
              id="sec-3"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5"
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  03. Data Boundary Model · Grant = Role + Scope
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Role Plus Scope: How AuditSphere Controls Visibility
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  In AuditSphere, a user never receives a role in a vacuum. Every permission is granted as a <strong>Role + Scope</strong> pair (<code className="font-mono">RoleGrant</code>): <strong>Role</strong> defines <em>what actions</em> the person can perform, while <strong>Scope</strong> defines <em>which data</em> they can see and touch.
                </p>
              </div>

              <DiagramBScopeContainment
                selectedScope={scopeFilter}
                onSelectScope={(sc) => setScopeFilter((prev) => (prev === sc ? 'ALL' : sc))}
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {SCOPES.map((sc) => {
                  const isSelected = scopeFilter === sc.code;
                  return (
                    <div
                      key={sc.code}
                      onClick={() => setScopeFilter((prev) => (prev === sc.code ? 'ALL' : sc.code))}
                      className={`p-4 rounded-xl border transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-sky-600 dark:border-sky-500 bg-sky-50/40 dark:bg-sky-950/30'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          Level {sc.hierarchyOrder} · {sc.code}
                        </span>
                        <span>{sc.label}</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                        {sc.meaning}
                      </p>
                      <div className="mt-2.5 pt-2.5 border-t border-slate-200/70 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 space-y-1">
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Example:</strong>{' '}
                          {sc.example}
                        </div>
                        <div>
                          <strong className="text-slate-700 dark:text-slate-300">Boundary:</strong>{' '}
                          {sc.doesNotCover}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTION 4: Role Cards (10 Roles) */}
            <section
              id="sec-4"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    04. Complete Role Catalogue · 7 Staff Roles &amp; 3 Client Portal Roles
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    Role Cards ({filteredRoles.length} of {ROLES.length} Shown)
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExpandAllRoles((v) => !v)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {expandAllRoles ? 'Collapse All Cards' : 'Expand All Cards'}
                  </button>
                </div>
              </div>

              {/* Interactive Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="flex flex-wrap items-center gap-2">
                  <div
                    role="group"
                    aria-label="Filter roles by portal type"
                    className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    {(['ALL', 'Staff', 'Client'] as const).map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setPortalFilter(type)}
                        className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          portalFilter === type
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {type === 'ALL'
                          ? 'All Roles (10)'
                          : type === 'Staff'
                          ? 'Staff Portal (7)'
                          : 'Client Portal (3)'}
                      </button>
                    ))}
                  </div>

                  <div
                    role="group"
                    aria-label="Filter roles by allowed scope"
                    className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    {(['ALL', 'FIRM_WIDE', 'GROUP', 'CLIENT', 'ENGAGEMENT'] as const).map((sc) => (
                      <button
                        key={sc}
                        type="button"
                        onClick={() => setScopeFilter(sc)}
                        className={`px-2.5 py-1.5 text-xs font-mono font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                          scopeFilter === sc
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                        }`}
                      >
                        {sc === 'ALL' ? 'All Scopes' : sc}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative min-w-[220px] flex-1 sm:max-w-xs">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={roleSearch}
                    onChange={(e) => setRoleSearch(e.target.value)}
                    placeholder="Filter roles by title or responsibility..."
                    aria-label="Filter roles by title or responsibility"
                    className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              {/* Collapsible <details> Role Cards */}
              <div className="space-y-4">
                {filteredRoles.map((role) => (
                  <details
                    key={role.code}
                    open={expandAllRoles}
                    className="group rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/40 dark:bg-slate-950/40 overflow-hidden"
                  >
                    <summary className="px-5 py-4 cursor-pointer list-none flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                            4.{role.order}
                          </span>
                          <span>·</span>
                          <span
                            className={`font-semibold ${
                              role.accountType === 'Staff'
                                ? 'text-sky-800 dark:text-sky-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {role.accountType} Portal
                          </span>
                          <span>·</span>
                          <code className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                            {role.code}
                          </code>
                          <span>·</span>
                          <span>Scopes: {role.allowedScopes.join(', ')}</span>
                        </div>
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                          {role.displayLabel}
                        </h3>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setDraftRow((prev) => ({
                              ...prev,
                              accountType: role.accountType,
                              roleRequested: role.code,
                              scopeType: role.allowedScopes.includes('ENGAGEMENT')
                                ? 'ENGAGEMENT'
                                : role.allowedScopes[0],
                              scopeTarget:
                                role.allowedScopes[0] === 'FIRM_WIDE'
                                  ? 'Firm-Wide'
                                  : 'Engagement: FY2026 Audit - Acme Corp',
                            }));
                            document.getElementById('sec-9')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold text-sky-800 dark:text-sky-400 hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                        >
                          Request This Role
                        </button>
                        <span className="text-xs text-slate-400 group-open:rotate-180 transition-transform">
                          ▼
                        </span>
                      </div>
                    </summary>

                    <div className="p-5 border-t border-slate-200 dark:border-slate-800 space-y-4 text-xs sm:text-sm">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            One-Line Summary &amp; Typical Job Titles
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {role.summaryAndTitles}
                          </p>
                        </div>
                        <div>
                          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
                            Day-to-Day Responsibilities
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {role.dailyResponsibilities}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                        <div className="p-4 rounded-xl border border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/40 dark:bg-emerald-950/20">
                          <div className="text-xs font-bold text-emerald-900 dark:text-emerald-300">
                            What They Can Do (Server-Authorized)
                          </div>
                          <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {role.canDo.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-emerald-600 font-bold">✓</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div className="p-4 rounded-xl border border-red-200/80 dark:border-red-900/50 bg-red-50/40 dark:bg-red-950/20">
                          <div className="text-xs font-bold text-red-900 dark:text-red-300">
                            What They Cannot Do (Guardrails &amp; Limits)
                          </div>
                          <ul className="mt-2 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                            {role.cannotDo.map((item, i) => (
                              <li key={i} className="flex items-start gap-2">
                                <span className="text-red-600 font-bold">✕</span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 text-xs">
                        <div>
                          <div className="font-bold text-slate-500 dark:text-slate-400">
                            Decisions &amp; Approvals Owned
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {role.decisionsOwned}
                          </p>
                        </div>
                        <div>
                          <div className="font-bold text-slate-500 dark:text-slate-400">
                            Handoffs &amp; Review Chain
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {role.handoffsAndReview}
                          </p>
                        </div>
                        <div>
                          <div className="font-bold text-slate-500 dark:text-slate-400">
                            Screens Reached
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {role.screens.join(' · ')}
                          </p>
                        </div>
                        <div>
                          <div className="font-bold text-slate-500 dark:text-slate-400">
                            How Access Ends &amp; Repo Code
                          </div>
                          <p className="mt-1 text-slate-700 dark:text-slate-300 leading-relaxed">
                            {role.howAccessEnds}
                          </p>
                          <div className="mt-1 text-[11px] font-mono text-slate-500">
                            Repo Mapping: {role.repoRoleMapping}
                          </div>
                        </div>
                      </div>
                    </div>
                  </details>
                ))}
              </div>
            </section>

            {/* SECTION 5: Who Does What Across the Engagement Lifecycle */}
            <section
              id="sec-5"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5"
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  05. End-to-End Business Process · 7 Evidence-Derived Phases
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Who Does What Across the Engagement Lifecycle
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-3xl">
                  Every audit engagement progresses through <strong>seven sequential phases</strong> enforced by AuditSphere’s workflow engine. Click any phase in Diagram C below to inspect its mandatory gate and role handoffs.
                </p>
              </div>

              <DiagramCLifecycleSwimlane
                activePhase={activePhaseNum}
                onSelectPhase={setActivePhaseNum}
              />

              {/* Selected Phase Spotlight Card */}
              <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-5 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-semibold text-sky-800 dark:text-sky-400">
                      Active Phase Spotlight · {activeLifecyclePhase.shortTitle}
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {activeLifecyclePhase.phase}
                    </h3>
                  </div>
                  <div className="text-xs font-mono text-slate-600 dark:text-slate-300">
                    Gate: {activeLifecyclePhase.evidenceTrigger}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 text-xs">
                  <div>
                    <div className="font-mono font-bold text-sky-900 dark:text-sky-400">
                      ENGAGEMENT_PARTNER
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {activeLifecyclePhase.engagementPartner}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-purple-800 dark:text-purple-400">
                      QUALITY_REVIEWER (EQCR)
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {activeLifecyclePhase.qualityReviewer}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-sky-800 dark:text-sky-300">
                      AUDIT_MANAGER
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {activeLifecyclePhase.auditManager}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-teal-800 dark:text-teal-400">
                      SENIOR_AUDITOR &amp; STAFF_AUDITOR
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {activeLifecyclePhase.seniorAndStaff}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-slate-800 dark:text-slate-200">
                      FIRM_FINANCE
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {activeLifecyclePhase.firmFinance}
                    </p>
                  </div>
                  <div>
                    <div className="font-mono font-bold text-amber-700 dark:text-amber-400">
                      CLIENT PORTAL (PRIMARY / CONTRIBUTOR / VIEWER)
                    </div>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                      {activeLifecyclePhase.clientPrimary} · {activeLifecyclePhase.clientContributorAndViewer}
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* SECTION 6: Approvals & Separation of Duties */}
            <section id="sec-6" className="space-y-4">
              <div className="px-1">
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  06. Server-Enforced Guardrails · M1-03, M2-02 &amp; ADR-0003
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Approvals and Separation of Duties (Interactive Simulators)
                </h2>
              </div>
              <SimulatorsSection />
            </section>

            {/* SECTION 7: Role vs. Capability Matrix */}
            <section
              id="sec-7"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-5"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    07. Server Authorization Matrix · 10 Product Modules × 10 Roles
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    Role vs. Capability Matrix
                  </h2>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Click any cell in the matrix to inspect the exact server-side authorization rule (<code className="font-mono">CommandRoleMatrix.cs</code>).
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                    {(['ALL', 'Staff', 'Client'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setMatrixAccountFilter(t)}
                        className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                          matrixAccountFilter === t
                            ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        {t === 'ALL' ? 'All 10 Roles' : `${t} Roles`}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={matrixModuleSearch}
                    onChange={(e) => setMatrixModuleSearch(e.target.value)}
                    placeholder="Filter module..."
                    aria-label="Filter capability matrix modules"
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950"
                  />
                </div>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs font-variant-numeric tabular-nums">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <th className="py-3 px-3.5 font-bold min-w-[200px]">Module Area</th>
                      {matrixRoles.map((r) => (
                        <th key={r.code} className="py-3 px-2.5 font-mono text-[11px] font-bold">
                          <div>{r.code.replace('_', ' ')}</div>
                          <div className="font-sans font-normal text-[10px] text-slate-400">
                            {r.accountType}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {filteredMatrixRows.map((row) => (
                      <tr
                        key={row.moduleName}
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                      >
                        <td className="py-3 px-3.5">
                          <div className="font-bold text-slate-900 dark:text-slate-100">
                            {row.moduleName}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {row.moduleSubtitle}
                          </div>
                        </td>
                        {matrixRoles.map((r) => {
                          const cell = row.cells[r.code];
                          return (
                            <td
                              key={r.code}
                              onClick={() =>
                                setSelectedCellNote({
                                  moduleName: row.moduleName,
                                  roleCode: r.code,
                                  level: cell.level,
                                  note: cell.note,
                                })
                              }
                              className="py-3 px-2.5 cursor-pointer hover:bg-sky-50/60 dark:hover:bg-sky-950/30"
                            >
                              <span className={`font-mono text-xs ${getCapabilityTextStyle(cell.level)}`}>
                                {cell.level === 'None' ? '—' : cell.level}
                              </span>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {selectedCellNote && (
                <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3.5 text-xs flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white">
                      {selectedCellNote.moduleName}
                    </span>{' '}
                    ·{' '}
                    <code className="font-mono font-bold text-sky-800 dark:text-sky-400">
                      {selectedCellNote.roleCode}
                    </code>{' '}
                    ({selectedCellNote.level}): {selectedCellNote.note}
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCellNote(null)}
                    className="text-slate-500 hover:text-slate-800 underline cursor-pointer"
                  >
                    Dismiss
                  </button>
                </div>
              )}
            </section>

            {/* SECTION 8: Which Role Should This Person Have? (Decision Tree) */}
            <section
              id="sec-8"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6"
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  08. Interactive Role Finder · Decision Tree (Diagram E)
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Which Role Should This Person Have?
                </h2>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Answer 2–3 quick questions below (or click any role node in Diagram E) to identify the exact role and allowed scope.
                </p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left 6 Cols: Interactive Questions */}
                <div className="lg:col-span-6 space-y-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 p-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                      1. Which organization does this person belong to?
                    </label>
                    <div className="grid grid-cols-2 gap-2.5">
                      <button
                        type="button"
                        onClick={() =>
                          setWizardAnswers((prev) => ({ ...prev, isExternalClient: false }))
                        }
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                          !wizardAnswers.isExternalClient
                            ? 'border-sky-700 bg-sky-800 text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        Audit Firm Staff (Staff Portal)
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setWizardAnswers((prev) => ({ ...prev, isExternalClient: true }))
                        }
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                          wizardAnswers.isExternalClient
                            ? 'border-amber-600 bg-amber-600 text-white'
                            : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        External Client Contact (Client Portal)
                      </button>
                    </div>
                  </div>

                  {wizardAnswers.isExternalClient ? (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          2. Do they sign engagement acceptance (Key 1) &amp; approve Trial Balance / management adjustments?
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setWizardAnswers((prev) => ({
                                ...prev,
                                clientSignsAcceptanceOrTb: true,
                              }))
                            }
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                              wizardAnswers.clientSignsAcceptanceOrTb
                                ? 'border-amber-600 bg-amber-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            Yes — CFO / Finance Lead
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setWizardAnswers((prev) => ({
                                ...prev,
                                clientSignsAcceptanceOrTb: false,
                              }))
                            }
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                              !wizardAnswers.clientSignsAcceptanceOrTb
                                ? 'border-amber-600 bg-amber-600 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            No — Contributor or Observer
                          </button>
                        </div>
                      </div>

                      {!wizardAnswers.clientSignsAcceptanceOrTb && (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                            3. Do they upload documents for PBC requests?
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setWizardAnswers((prev) => ({
                                  ...prev,
                                  clientUploadsPbcDocuments: true,
                                }))
                              }
                              className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                                wizardAnswers.clientUploadsPbcDocuments !== false
                                  ? 'border-amber-600 bg-amber-600 text-white'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              Yes — Uploads PBC Evidence
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWizardAnswers((prev) => ({
                                  ...prev,
                                  clientUploadsPbcDocuments: false,
                                }))
                              }
                              className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                                wizardAnswers.clientUploadsPbcDocuments === false
                                  ? 'border-amber-600 bg-amber-600 text-white'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              No — Read-Only Observer
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                          2. Do they perform or review audit / accounting work?
                        </label>
                        <div className="grid grid-cols-2 gap-2.5">
                          <button
                            type="button"
                            onClick={() =>
                              setWizardAnswers((prev) => ({
                                ...prev,
                                staffPerformsAuditOrAccounting: true,
                              }))
                            }
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                              wizardAnswers.staffPerformsAuditOrAccounting !== false
                                ? 'border-sky-700 bg-sky-800 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            Yes — Audit &amp; Assurance Team
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setWizardAnswers((prev) => ({
                                ...prev,
                                staffPerformsAuditOrAccounting: false,
                              }))
                            }
                            className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                              wizardAnswers.staffPerformsAuditOrAccounting === false
                                ? 'border-sky-700 bg-sky-800 text-white'
                                : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                            }`}
                          >
                            No — Admin or Practice Finance
                          </button>
                        </div>
                      </div>

                      {wizardAnswers.staffPerformsAuditOrAccounting === false ? (
                        <div>
                          <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                            3. Do they manage user access or firm billing/retainers?
                          </label>
                          <div className="grid grid-cols-2 gap-2.5">
                            <button
                              type="button"
                              onClick={() =>
                                setWizardAnswers((prev) => ({
                                  ...prev,
                                  staffManagesUsersOrBilling: 'USERS_ACCESS',
                                }))
                              }
                              className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                                wizardAnswers.staffManagesUsersOrBilling !== 'BILLING_RETAINERS'
                                  ? 'border-sky-700 bg-sky-800 text-white'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              User Access &amp; Entra Bindings
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setWizardAnswers((prev) => ({
                                  ...prev,
                                  staffManagesUsersOrBilling: 'BILLING_RETAINERS',
                                }))
                              }
                              className={`py-2 px-3 rounded-lg border text-xs font-semibold cursor-pointer ${
                                wizardAnswers.staffManagesUsersOrBilling === 'BILLING_RETAINERS'
                                  ? 'border-sky-700 bg-sky-800 text-white'
                                  : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                              }`}
                            >
                              Billing &amp; Retainer Clearance
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                              3. Do they sign the final audit opinion or perform independent EQCR?
                            </label>
                            <div className="grid grid-cols-3 gap-2">
                              {[
                                { val: 'ENGAGEMENT_PARTNER', label: 'Signs Opinion (Partner)' },
                                { val: 'QUALITY_REVIEWER', label: 'Independent EQCR' },
                                { val: 'NO', label: 'Fieldwork / Manager' },
                              ].map((opt) => (
                                <button
                                  key={opt.val}
                                  type="button"
                                  onClick={() =>
                                    setWizardAnswers((prev) => ({
                                      ...prev,
                                      staffSignsOpinionOrQualityReview:
                                        opt.val as DecisionTreeAnswers['staffSignsOpinionOrQualityReview'],
                                    }))
                                  }
                                  className={`py-2 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                                    wizardAnswers.staffSignsOpinionOrQualityReview === opt.val
                                      ? 'border-sky-700 bg-sky-800 text-white'
                                      : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                  }`}
                                >
                                  {opt.label}
                                </button>
                              ))}
                            </div>
                          </div>

                          {wizardAnswers.staffSignsOpinionOrQualityReview === 'NO' && (
                            <div>
                              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                                4. What is their fieldwork responsibility?
                              </label>
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { val: 'AUDIT_MANAGER', label: 'Manager Review & Budgets' },
                                  { val: 'SENIOR_AUDITOR', label: '1st-Level Review & TB/GL' },
                                  { val: 'STAFF_AUDITOR', label: 'Prepares Workpapers' },
                                ].map((opt) => (
                                  <button
                                    key={opt.val}
                                    type="button"
                                    onClick={() =>
                                      setWizardAnswers((prev) => ({
                                        ...prev,
                                        staffManagesFieldworkOrReviews:
                                          opt.val as DecisionTreeAnswers['staffManagesFieldworkOrReviews'],
                                      }))
                                    }
                                    className={`py-2 px-2.5 rounded-lg border text-xs font-semibold cursor-pointer ${
                                      wizardAnswers.staffManagesFieldworkOrReviews === opt.val
                                        ? 'border-sky-700 bg-sky-800 text-white'
                                        : 'border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900'
                                    }`}
                                  >
                                    {opt.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </div>

                {/* Right 6 Cols: Recommended Role Output */}
                <div className="lg:col-span-6 rounded-xl border border-sky-200 dark:border-sky-900/60 bg-sky-50/40 dark:bg-sky-950/20 p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="font-bold text-sky-900 dark:text-sky-300">
                      Recommended AuditSphere Role
                    </span>
                    <span>·</span>
                    <span>{recommendation.role.accountType} Portal</span>
                  </div>

                  <div>
                    <div className="font-mono text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                      {recommendation.role.code}
                    </div>
                    <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                      {recommendation.role.displayLabel}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                    {recommendation.rationale}
                  </p>

                  <div className="text-xs space-y-1.5 pt-2 border-t border-sky-200/60 dark:border-sky-900/50">
                    <div>
                      <strong>Allowed Scopes:</strong>{' '}
                      <code className="font-mono">
                        {recommendation.recommendedScopes.join(', ')}
                      </code>
                    </div>
                    <div>
                      <strong>Separation of Duties Note:</strong> {recommendation.makerCheckerNote}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddRecommendedToForm}
                    className="w-full py-2.5 px-4 rounded-lg bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Use {recommendation.role.code} in Request Form Below
                  </button>
                </div>
              </div>

              <DiagramEDecisionTree
                highlightedRole={recommendation.role.code}
                onSelectRole={(code) => {
                  const r = getRoleByCode(code);
                  setDraftRow((prev) => ({
                    ...prev,
                    accountType: r.accountType,
                    roleRequested: r.code,
                    scopeType: r.allowedScopes[0],
                  }));
                }}
              />
            </section>

            {/* SECTION 9: How to Fill in the Request Form (Interactive Builder + D4 CSV) */}
            <section
              id="sec-9"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    09. Deliverable D4 · Worked Examples &amp; Interactive Request Builder
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    How to Fill in the Role Assignment Request Form
                  </h2>
                  <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-3xl">
                    Pre-loaded with the 5 canonical worked examples (Sarah Jenkins, Marcus Vance, Elena Rostova, David Chen, Sarah Miller). Add your own rows, validate corporate emails and Separation of Duties, and export to CSV or Markdown.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleDownloadCsv}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download CSV ({requestRows.length} Rows)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleCopyText(exportRequestsToMarkdownTable(requestRows), 'markdown')
                    }
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-semibold hover:bg-slate-50 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    {copiedMarkdown ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        Copied Markdown Table
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        Copy Markdown for Email
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Separation of Duties Warnings */}
              {sodWarnings.length > 0 && (
                <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50/70 dark:bg-red-950/40 p-4 space-y-1.5 text-xs text-red-900 dark:text-red-200">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                    <span>Separation of Duties Alert Detected Across Request Rows</span>
                  </div>
                  {sodWarnings.map((w, idx) => (
                    <p key={idx}>{w}</p>
                  ))}
                </div>
              )}

              {/* Add Row Form */}
              <form
                onSubmit={handleAddRequestRow}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 p-4 space-y-3"
              >
                <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                  Add Person to Role Assignment Request
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={draftRow.fullName}
                      onChange={(e) =>
                        setDraftRow((prev) => ({ ...prev, fullName: e.target.value }))
                      }
                      placeholder="e.g. Liam O'Connor"
                      aria-label="Request Full Name"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Work Email (Microsoft Sign-In)
                    </label>
                    <input
                      type="text"
                      value={draftRow.workEmail}
                      onChange={(e) =>
                        setDraftRow((prev) => ({ ...prev, workEmail: e.target.value }))
                      }
                      placeholder="l.oconnor@example.com"
                      aria-label="Request Work Email"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Role Requested
                    </label>
                    <select
                      value={draftRow.roleRequested}
                      onChange={(e) => {
                        const code = e.target.value as RoleCode;
                        const def = getRoleByCode(code);
                        const nextScope = def.allowedScopes.includes(draftRow.scopeType)
                          ? draftRow.scopeType
                          : def.allowedScopes[0];
                        setDraftRow((prev) => ({
                          ...prev,
                          roleRequested: code,
                          accountType: def.accountType,
                          scopeType: nextScope,
                          scopeTarget:
                            nextScope === 'FIRM_WIDE'
                              ? 'Firm-Wide'
                              : prev.scopeTarget === 'Firm-Wide'
                              ? 'Engagement: FY2026 Audit - Acme Corp'
                              : prev.scopeTarget,
                        }));
                      }}
                      aria-label="Request Role"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    >
                      {ROLES.map((r) => (
                        <option key={r.code} value={r.code}>
                          {r.code} ({r.accountType})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Scope Type
                    </label>
                    <select
                      value={draftRow.scopeType}
                      onChange={(e) => {
                        const sc = e.target.value as ScopeCode;
                        setDraftRow((prev) => ({
                          ...prev,
                          scopeType: sc,
                          scopeTarget:
                            sc === 'FIRM_WIDE'
                              ? 'Firm-Wide'
                              : sc === 'GROUP'
                              ? 'Group: Apex Holdings Group'
                              : sc === 'CLIENT'
                              ? 'Client: Acme Corp'
                              : 'Engagement: FY2026 Audit - Acme Corp',
                        }));
                      }}
                      aria-label="Request Scope Type"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    >
                      {getRoleByCode(draftRow.roleRequested).allowedScopes.map((sc) => (
                        <option key={sc} value={sc}>
                          {sc}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Scope Target Name
                    </label>
                    <input
                      type="text"
                      value={draftRow.scopeTarget}
                      disabled={draftRow.scopeType === 'FIRM_WIDE'}
                      onChange={(e) =>
                        setDraftRow((prev) => ({ ...prev, scopeTarget: e.target.value }))
                      }
                      aria-label="Request Scope Target"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 disabled:opacity-60"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={draftRow.startDate}
                      onChange={(e) =>
                        setDraftRow((prev) => ({ ...prev, startDate: e.target.value }))
                      }
                      aria-label="Request Start Date"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Expiry Date (Optional)
                    </label>
                    <input
                      type="date"
                      value={draftRow.expiry}
                      onChange={(e) =>
                        setDraftRow((prev) => ({ ...prev, expiry: e.target.value }))
                      }
                      aria-label="Request Expiry Date"
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono"
                    />
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                        Approved By
                      </label>
                      <input
                        type="text"
                        value={draftRow.approvedBy}
                        onChange={(e) =>
                          setDraftRow((prev) => ({ ...prev, approvedBy: e.target.value }))
                        }
                        aria-label="Request Approved By"
                        className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      />
                    </div>
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 px-3.5 py-1.5 rounded-lg bg-sky-800 hover:bg-sky-700 text-white text-xs font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Add Row
                    </button>
                  </div>
                </div>

                {draftError && (
                  <div
                    role="alert"
                    className="text-xs text-red-600 dark:text-red-400 font-medium pt-1"
                  >
                    {draftError}
                  </div>
                )}
              </form>

              {/* Request Table */}
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left border-collapse text-xs font-variant-numeric tabular-nums">
                  <thead>
                    <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                      <th className="py-2.5 px-3 font-semibold">Full Name</th>
                      <th className="py-2.5 px-3 font-semibold">Work Email (Entra ID)</th>
                      <th className="py-2.5 px-3 font-semibold">Type</th>
                      <th className="py-2.5 px-3 font-semibold">Role Requested</th>
                      <th className="py-2.5 px-3 font-semibold">Scope</th>
                      <th className="py-2.5 px-3 font-semibold">Start / Expiry</th>
                      <th className="py-2.5 px-3 font-semibold">Approved By</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {rowValidations.map(({ row, validation }) => (
                      <tr key={row.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                        <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                          {row.fullName}
                          {row.notes && (
                            <div className="font-normal text-[11px] text-slate-500">
                              {row.notes}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                          {row.workEmail}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`font-semibold ${
                              row.accountType === 'Staff'
                                ? 'text-sky-800 dark:text-sky-400'
                                : 'text-amber-700 dark:text-amber-400'
                            }`}
                          >
                            {row.accountType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-white">
                          {row.roleRequested}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {row.scopeType === 'FIRM_WIDE' ? 'Firm-Wide' : row.scopeTarget}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                          <div>{row.startDate}</div>
                          <div>{row.expiry || 'No Expiry'}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                          {row.approvedBy}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-2">
                            {validation.isValid ? (
                              <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                                Valid
                              </span>
                            ) : (
                              <span
                                title={validation.errors.join(' ')}
                                className="inline-flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold"
                              >
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Invalid
                              </span>
                            )}
                            <button
                              type="button"
                              onClick={() => handleRemoveRequestRow(row.id)}
                              aria-label={`Remove ${row.fullName} from request list`}
                              className="p-1 text-slate-400 hover:text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            {/* SECTION 10 & 11: What Happens After You Reply + Changing or Removing Access */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <section
                id="sec-10"
                className="lg:col-span-7 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4"
              >
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    10. Onboarding Sequence · Roster Binding &amp; Invitation Flow
                  </div>
                  <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                    What Happens After You Reply
                  </h2>
                </div>

                <DiagramFOnboardingSequence />

                <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-300 leading-relaxed list-decimal list-inside">
                  <li>
                    <strong>Roster Identity Binding:</strong> The Firm Administrator enters each approved email into <em>Users &amp; Access</em> and binds it to a Staff or Client roster record.
                  </li>
                  <li>
                    <strong>Grant Assignment:</strong> The Administrator assigns the requested <code className="font-mono">Role + Scope</code> and sets any applicable <code className="font-mono">Expiry Date</code>.
                  </li>
                  <li>
                    <strong>Invitation Link Delivery:</strong> Because automated Microsoft Graph tenant provisioning (<code className="font-mono">TENANT_USER_PROVISIONING</code>, <code className="font-mono">GUEST_INVITATION</code>, <code className="font-mono">GROUP_MEMBERSHIP</code>) is disabled by default policy (<code className="font-mono">BLOCKED_EXTERNAL</code>), the Administrator generates a secure onboarding invitation link and sends it to the user.
                  </li>
                  <li>
                    <strong>First Sign-In &amp; Activation:</strong> Staff users land in their scoped Staff Portal. Client users land in the Client Portal once Dual-Key + Paid Retainer activation is complete.
                  </li>
                </ol>
              </section>

              <section
                id="sec-11"
                className="lg:col-span-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div>
                    <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                      11. Offboarding, Expiry &amp; Immutable Audit Trail
                    </div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
                      Changing or Removing Access
                    </h2>
                  </div>

                  <div className="space-y-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <div className="font-bold text-slate-900 dark:text-white">
                        Automatic Grant Expiry (00:00 UTC)
                      </div>
                      <p className="mt-1">
                        If a grant has an Expiry Date, the server automatically blocks access at midnight UTC on that date without requiring manual intervention.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <div className="font-bold text-slate-900 dark:text-white">
                        Immediate Manual Revocation
                      </div>
                      <p className="mt-1">
                        If someone leaves the firm, changes departments, or rotates off an audit, email <code className="font-mono">auditsphere-admin@example.com</code> with <code className="font-mono">[REVOKE ACCESS]</code>. Revocation takes effect on the user’s very next server request.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/50">
                      <div className="font-bold text-slate-900 dark:text-white">
                        Immutable PostgreSQL Audit Trail
                      </div>
                      <p className="mt-1">
                        Revoking or expiring a role grant <strong>never deletes historical audit trails</strong>. All past sign-offs, working paper edits, and PBC uploads remain permanently attributed to that user’s identity in PostgreSQL.
                      </p>
                    </div>
                  </div>
                </div>
              </section>
            </div>

            {/* SECTION 12: FAQ & Glossary */}
            <section
              id="sec-12"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-6"
            >
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                    12. Common Questions &amp; Plain-English Definitions
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    Frequently Asked Questions &amp; Glossary
                  </h2>
                </div>

                <div className="flex flex-wrap items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-800">
                  {[
                    'ALL',
                    'Identity & Sign-In',
                    'Roles & Scopes',
                    'Separation of Duties',
                    'Access Lifecycle',
                  ].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFaqCategory(cat)}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md cursor-pointer whitespace-nowrap shrink-0 ${
                        faqCategory === cat
                          ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {cat === 'ALL' ? 'All FAQs (8)' : cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFaqs.map((faq) => (
                  <div
                    key={faq.id}
                    className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/50 space-y-1.5"
                  >
                    <div className="text-[11px] font-semibold text-sky-800 dark:text-sky-400">
                      {faq.category}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {faq.question}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {faq.answer}
                    </p>
                  </div>
                ))}
              </div>

              {/* Glossary Grid */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Plain-English Glossary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
                  {GLOSSARY_ITEMS.map((g) => (
                    <div
                      key={g.term}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900"
                    >
                      <div className="font-bold text-slate-900 dark:text-white">{g.term}</div>
                      <div className="font-mono text-[10px] text-sky-800 dark:text-sky-400 mt-0.5">
                        {g.codeOrAcronym}
                      </div>
                      <p className="mt-1.5 text-slate-600 dark:text-slate-400 leading-relaxed">
                        {g.definition}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* SECTION 13: Appendices (Appendix A Admin Walkthrough + Appendix B Evidence Map & Deliverables) */}
            <section
              id="sec-13"
              className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 space-y-8"
            >
              <div>
                <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                  13. Appendices A &amp; B · Administrator Console, Evidence Traceability &amp; Deliverables
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mt-1">
                  Appendix A: Administrator Walkthrough (/admin/access)
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  Interactive step-by-step walkthrough and live sandbox for Firm Administrators (<code className="font-mono">ADMINISTRATOR</code>) processing approved Role Assignment Requests.
                </p>
              </div>

              <AdminSandbox />

              {/* Appendix B: Evidence Map, Crosswalk & Open Questions */}
              <div className="pt-6 border-t border-slate-200 dark:border-slate-800 space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Appendix B: Source-of-Truth Evidence Map &amp; Open Questions
                  </h3>
                  <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                    Every role, scope, and Separation of Duties claim in this guide traces directly to the AuditSphere repository source of truth.
                  </p>
                </div>

                {/* Evidence Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                        <th className="py-2.5 px-3 font-semibold">ID</th>
                        <th className="py-2.5 px-3 font-semibold">Verified Capability / Rule</th>
                        <th className="py-2.5 px-3 font-semibold">Repository File Path</th>
                        <th className="py-2.5 px-3 font-semibold">Symbol / Requirement</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {EVIDENCE_ROWS.map((ev) => (
                        <tr key={ev.claimId}>
                          <td className="py-2.5 px-3 font-mono font-bold text-sky-800 dark:text-sky-400">
                            {ev.claimId}
                          </td>
                          <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                            {ev.capabilityOrRule}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600 dark:text-slate-400 break-all">
                            {ev.filePath}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-[11px] text-slate-700 dark:text-slate-300">
                            {ev.symbolOrType}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Role Code Crosswalk Table */}
                <div className="space-y-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    End-User Guide Role Identifier to .NET RoleGrants Crosswalk
                  </h4>
                  <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300">
                          <th className="py-2 px-3 font-semibold">Guide Role Identifier</th>
                          <th className="py-2 px-3 font-semibold">UI Display Label</th>
                          <th className="py-2 px-3 font-semibold">.NET RoleGrants / Staffing Code</th>
                          <th className="py-2 px-3 font-semibold">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                        {REPO_CROSSWALK.map((cw) => (
                          <tr key={cw.guideRoleCode}>
                            <td className="py-2 px-3 font-mono font-bold text-slate-900 dark:text-white">
                              {cw.guideRoleCode}
                            </td>
                            <td className="py-2 px-3 text-slate-800 dark:text-slate-200">
                              {cw.guideDisplayLabel}
                            </td>
                            <td className="py-2 px-3 font-mono text-sky-800 dark:text-sky-400">
                              {cw.dotnetRoleGrantsCode}
                            </td>
                            <td className="py-2 px-3 text-slate-600 dark:text-slate-400">
                              {cw.staffingOrSpecializationNote}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* TO CONFIRM Open Questions */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Open Questions Flagged as TO CONFIRM
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                    {OPEN_QUESTIONS.map((oq) => (
                      <div
                        key={oq.id}
                        className="p-4 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/40 dark:bg-amber-950/20 space-y-1.5"
                      >
                        <div className="font-mono font-bold text-amber-800 dark:text-amber-400">
                          {oq.id}
                        </div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {oq.topic}
                        </div>
                        <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                          <strong>Observed Code:</strong> {oq.observedCodeBehavior}
                        </p>
                        <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                          <strong>Action:</strong> {oq.questionToConfirm}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Deliverables D1 - D5 Cards */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    Repository Deliverables Package (D1 – D5)
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                    {DELIVERABLES_LIST.map((deliv) => (
                      <div
                        key={deliv.id}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/50 flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between text-slate-500">
                            <span className="font-mono font-bold text-sky-800 dark:text-sky-400">
                              Deliverable {deliv.id}
                            </span>
                            <span>{deliv.format}</span>
                          </div>
                          <div className="font-bold text-slate-900 dark:text-white text-sm">
                            {deliv.title}
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 break-all">
                            {deliv.repoPath}
                          </div>
                          <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                            {deliv.summary}
                          </p>
                        </div>
                        {deliv.downloadHref && (
                          <a
                            href={deliv.downloadHref}
                            download
                            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-sky-800 hover:bg-sky-700 text-white font-semibold transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            Download {deliv.id}
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* Clean Footer */}
            <footer className="py-6 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center justify-between gap-4">
              <div>
                AuditSphere Documentation Suite · Roles &amp; Access End-User Guide
              </div>
              <div>
                Privacy Verified: Only <code className="font-mono">@example.com</code> &amp; <code className="font-mono">@client-example.com</code> placeholders used.
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  );
}
