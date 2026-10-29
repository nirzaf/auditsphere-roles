import { useRef, useState } from 'react';
import { ArrowRight, Check, Download, Plus, ShieldCheck, Trash2, Users } from 'lucide-react';
import { ROLES, SCOPES } from './data/rolesData.ts';
import type { AccountType, RequestDetails, RoleCode, RoleRequestRow, ScopeCode } from './data/rolesData.ts';
import { detectSeparationOfDutiesWarnings, exportRequestsToCsv, formatScopeColumn, getRoleByCode, validateRequestDetails, validateRoleRequestRow } from './utils/roleAssessor.ts';
import { PrivilegeHierarchy } from './components/PrivilegeHierarchy.tsx';

const administratorEmail = (import.meta.env.VITE_ACCESS_ADMIN_EMAIL ?? '').trim();
const deliveryEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(administratorEmail) && !administratorEmail.endsWith('@example.com') ? administratorEmail : '';
const blankRow = (): RoleRequestRow => ({ id: '', fullName: '', workEmail: '', accountType: 'Staff', roleRequested: 'STAFF', scopeType: 'ENGAGEMENT', scopeTarget: '', expiry: '', notes: '' });
const groups: { title: string; codes: RoleCode[] }[] = [
  { title: 'Audit delivery', codes: ['PARTNER', 'MANAGER', 'SENIOR', 'STAFF'] },
  { title: 'Finance & commercial', codes: ['RELATIONSHIP_MANAGER', 'FINANCE_MANAGER', 'FINANCE_REVIEWER'] },
  { title: 'Client accounting', codes: ['ACCOUNTING_PREPARER', 'ACCOUNTING_REVIEWER'] },
  { title: 'Administration & client portal', codes: ['ADMINISTRATOR', 'CLIENT_USER'] },
];

export default function App() {
  const [rows, setRows] = useState<RoleRequestRow[]>([]);
  const [draft, setDraft] = useState<RoleRequestRow>(blankRow);
  const [details, setDetails] = useState<RequestDetails>({ firmName: '', submittedBy: '', contactEmail: '' });
  const [editing, setEditing] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [reviewing, setReviewing] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [help, setHelp] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const reviewRef = useRef<HTMLElement>(null);
  const role = getRoleByCode(draft.roleRequested);
  const warnings = detectSeparationOfDutiesWarnings(rows);
  const hasDraft = Boolean(draft.fullName.trim() || draft.workEmail.trim() || draft.scopeTarget.trim() || draft.notes.trim() || draft.expiry);

  function chooseRole(code: RoleCode, identity?: AccountType) {
    const selected = getRoleByCode(code);
    setDraft(prev => {
      const scopeType = selected.allowedScopes.includes(prev.scopeType) ? prev.scopeType : selected.allowedScopes.find(s => s !== 'FIRM_WIDE') ?? selected.allowedScopes[0];
      return { ...prev, roleRequested: code, accountType: identity ?? selected.accountType, scopeType, scopeTarget: scopeType === prev.scopeType && scopeType !== 'FIRM_WIDE' ? prev.scopeTarget : '', expiry: scopeType === 'GROUP' ? '' : prev.expiry };
    });
    setReviewing(false);
    setDownloaded(false);
  }

  function changeCoverage(scopeType: ScopeCode) {
    setDraft(prev => ({ ...prev, scopeType, scopeTarget: '', expiry: scopeType === 'GROUP' ? '' : prev.expiry }));
  }

  function savePerson(event: React.FormEvent) {
    event.preventDefault();
    const validation = validateRoleRequestRow(draft);
    if (!validation.isValid) { setErrors(validation.errors); return; }
    const saved = { ...draft, id: editing ?? crypto.randomUUID(), fullName: draft.fullName.trim(), workEmail: draft.workEmail.trim().toLowerCase(), scopeTarget: draft.scopeTarget.trim(), notes: draft.notes.trim() };
    if (rows.some(r => r.id !== editing && r.workEmail === saved.workEmail && r.roleRequested === saved.roleRequested && r.scopeType === saved.scopeType && r.scopeTarget.toLowerCase() === saved.scopeTarget.toLowerCase())) {
      setErrors(['This person already has that role and coverage in your list. Edit their existing entry instead.']); return;
    }
    setRows(prev => editing ? prev.map(r => r.id === editing ? saved : r) : [...prev, saved]);
    setDraft(blankRow()); setEditing(null); setErrors([]); setReviewing(false); setDownloaded(false);
  }

  function review() {
    const problems = [...validateRequestDetails(details).errors, ...rows.flatMap(r => validateRoleRequestRow(r).errors)];
    if (!rows.length) problems.push('Add at least one person to your team list.');
    if (hasDraft || editing) problems.push('Save the person you are editing, or cancel the draft, before reviewing.');
    setErrors(problems);
    if (problems.length) return;
    setReviewing(true); setConfirmed(false);
    requestAnimationFrame(() => reviewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  function download() {
    if (!confirmed || !reviewing) return;
    const csv = exportRequestsToCsv(rows, details);
    const url = URL.createObjectURL(new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a'); link.href = url; link.download = 'auditsphere-team-access-request.csv'; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setDownloaded(true);
  }

  return <div className="setup-page">
    <header className="site-header no-print"><a className="wordmark" href="#top"><span className="brand-icon"><ShieldCheck size={21} /></span>AuditSphere<span className="header-divider" /> <span className="header-caption">Team access</span></a><a href="#team" className="header-link">Set up your team <ArrowRight size={16} /></a></header>
    <main id="top" className="setup-main">
      <section className="intro no-print">
        <span className="eyebrow">A good team starts with the right access</span>
        <h1>Set up your<br />team’s access.</h1>
        <p>Choose what each person will do, tell us which work they need, and prepare a request for your administrator to review.</p>
        <a className="primary-button" href="#team">Add your team <ArrowRight size={17} /></a>
        <div className="intro-note"><ShieldCheck size={17} /> A request does not activate access.</div>
      </section>

      <nav className="steps no-print" aria-label="Setup steps">{['Understand the roles', 'Add your people', 'Review & send'].map((label, i) => <a key={label} href={['#roles', '#team', '#review'][i]}><span>{i + 1}</span>{label}</a>)}</nav>

      <section id="roles" className="section-block roles-print">
        <div className="section-heading"><div><span className="eyebrow">01 / Responsibilities</span><h2>A role for the work they do.</h2><p>Choose only the responsibilities your team needs. One person can have more than one role.</p></div><button className="text-button no-print" onClick={() => window.print()}><Download size={16} /> Print roles guide</button></div>
        <details open className="reference privilege-reference"><summary>User types & privilege hierarchy</summary><PrivilegeHierarchy groups={groups} /></details>
        <div className="role-groups">{groups.map(group => <div key={group.title} className="role-group"><h3>{group.title}</h3>{group.codes.map(code => { const item = getRoleByCode(code); return <details key={code} className="role-card"><summary><span>{item.displayLabel}<small>{item.responsibilities[0]}</small></span><Plus size={16} /></summary><div className="role-details"><p>{item.summary}</p><ul>{item.responsibilities.slice(0, 3).map(text => <li key={text}>{text}</li>)}</ul><p><strong>Approvals:</strong> {item.approvals}</p><p><strong>Keep in mind:</strong> {item.restriction}</p><button className="text-button no-print" onClick={() => { chooseRole(code); formRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Choose this role <ArrowRight size={15} /></button></div></details>; })}</div>)}</div>
        <details className="reference"><summary>Compare all roles</summary><div className="table-scroll"><table><thead><tr><th>Role</th><th>Main responsibility</th><th>Important restriction</th></tr></thead><tbody>{ROLES.map(r => <tr key={r.code}><th scope="row">{r.displayLabel}</th><td>{r.summary}</td><td>{r.restriction}</td></tr>)}</tbody></table></div></details>
      </section>

      <section id="team" className="section-block no-print">
        <div className="section-heading"><div><span className="eyebrow">02 / Your people</span><h2>Build your team list.</h2><p>Your draft stays on this page. Nothing is sent or recorded automatically. Refreshing clears it.</p></div><span className="count-badge"><Users size={16} />{new Set(rows.map(r => r.workEmail)).size} people</span></div>
        <div className="context-panel"><h3>Who is this request for?</h3><div className="form-grid">{([{ key: 'firmName', label: 'Firm name', type: 'text', max: 200 }, { key: 'submittedBy', label: 'Submitted by', type: 'text', max: 120 }, { key: 'contactEmail', label: 'Your contact email', type: 'email', max: 320 }] as const).map(field => <label key={field.key}>{field.label} <span className="required">*</span><input type={field.type} required maxLength={field.max} value={details[field.key]} onChange={e => { setDetails({ ...details, [field.key]: e.target.value }); setReviewing(false); setDownloaded(false); }} /></label>)}</div><p className="field-hint">We include these details with the request. A typed name is not a recorded approval.</p></div>
        <div className="team-layout"><form ref={formRef} onSubmit={savePerson} onChange={() => { setReviewing(false); setDownloaded(false); }} className="person-form">
          <h3>{editing ? 'Edit access entry' : 'Add a person'}</h3>
          <div className="form-grid two"><label>Full name <span className="required">*</span><input required maxLength={120} autoComplete="name" value={draft.fullName} onChange={e => setDraft({ ...draft, fullName: e.target.value })} /></label><label>Microsoft sign-in email <span className="required">*</span><input required type="email" maxLength={320} autoComplete="email" value={draft.workEmail} onChange={e => setDraft({ ...draft, workEmail: e.target.value })} /></label></div>
          <p className="field-hint">Use the individual account this person will sign in with, not a shared mailbox.</p>
          <label>This person is <select value={draft.accountType} onChange={e => chooseRole(e.target.value === 'Client' ? 'CLIENT_USER' : 'STAFF')}><option value="Staff">Firm team</option><option value="Client">Client contact</option></select></label>
          <div className="label-row"><span>Requested role <span className="required">*</span></span><button type="button" className="text-button" aria-expanded={help} onClick={() => setHelp(!help)}>Help me choose</button></div>
          {help && <div className="help-panel"><p>What will this person mainly do? Choose a responsibility below, then check the role’s details.</p>{groups.map(group => <div key={group.title}><strong>{group.title}</strong><div className="help-options">{group.codes.filter(code => getRoleByCode(code).accountType === draft.accountType).map(code => <button key={code} type="button" onClick={() => { chooseRole(code); setHelp(false); }}>{getRoleByCode(code).displayLabel}</button>)}</div></div>)}</div>}
          <select aria-label="Requested role" value={draft.roleRequested} onChange={e => chooseRole(e.target.value as RoleCode)}>{ROLES.filter(r => r.accountType === draft.accountType).map(r => <option key={r.code} value={r.code}>{r.displayLabel}</option>)}</select><p className="field-hint role-summary">{role.summary}</p>
          <label>Access coverage <span className="required">*</span><select value={draft.scopeType} onChange={e => changeCoverage(e.target.value as ScopeCode)}>{SCOPES.filter(s => role.allowedScopes.includes(s.code)).map(s => <option key={s.code} value={s.code}>{s.label}</option>)}</select></label>
          <p className="field-hint">{SCOPES.find(s => s.code === draft.scopeType)?.meaning}</p>
          {draft.scopeType !== 'FIRM_WIDE' && <label>{draft.scopeType === 'GROUP' ? 'Consolidation group' : draft.scopeType === 'CLIENT' ? 'Client name' : 'Client and engagement'} <span className="required">*</span><input required maxLength={200} placeholder={SCOPES.find(s => s.code === draft.scopeType)?.targetHint} value={draft.scopeTarget} onChange={e => setDraft({ ...draft, scopeTarget: e.target.value })} /><span className="field-hint">Your administrator will verify the matching record.</span></label>}
          {draft.scopeType !== 'GROUP' && <><label className="checkbox-label"><input type="checkbox" checked={draft.expiry !== ''} onChange={e => { const date = new Date(); date.setDate(date.getDate() + 30); setDraft({ ...draft, expiry: e.target.checked ? date.toISOString().slice(0, 10) : '' }); }} />Temporary access</label>{draft.expiry && <label>Requested end date<input required type="date" value={draft.expiry} onChange={e => setDraft({ ...draft, expiry: e.target.value })} /><span className="field-hint">The administrator confirms the exact expiry time. This does not schedule activation.</span></label>}</>}
          <label>Additional responsibility or note <span className="optional">(optional)</span><textarea maxLength={500} rows={2} placeholder="For example: primary client contact, or document request responsibilities" value={draft.notes} onChange={e => setDraft({ ...draft, notes: e.target.value })} /></label>
          <div className="button-row"><button className="primary-button" type="submit"><Plus size={16} />{editing ? 'Save changes' : 'Add to team list'}</button>{(hasDraft || editing) && <button type="button" className="text-button" onClick={() => { setDraft(blankRow()); setEditing(null); setErrors([]); }}>Cancel draft</button>}</div>
        </form><aside className="team-list"><div className="list-heading"><h3>Your team list</h3><span>{rows.length} access {rows.length === 1 ? 'entry' : 'entries'}</span></div>{!rows.length ? <div className="empty-state"><Users size={30} /><h4>Your team starts here.</h4><p>Add your first person using the form. Only the people you add will be in your request.</p></div> : rows.map(row => <article className="person-card" key={row.id}><div className="person-top"><strong>{row.fullName}</strong><button type="button" className="icon-button" aria-label={`Remove ${row.fullName}, ${getRoleByCode(row.roleRequested).displayLabel}`} onClick={() => { setRows(rows.filter(r => r.id !== row.id)); if (editing === row.id) { setDraft(blankRow()); setEditing(null); } setReviewing(false); setDownloaded(false); }}><Trash2 size={16} /></button></div><p>{row.workEmail}</p><span className="role-tag">{getRoleByCode(row.roleRequested).displayLabel}</span><p>{formatScopeColumn(row)}</p>{row.expiry && <p>Requested end: {row.expiry}</p>}{row.notes && <p>{row.notes}</p>}<div className="button-row"><button className="text-button" onClick={() => { setDraft({ ...row }); setEditing(row.id); setReviewing(false); setDownloaded(false); formRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Edit</button><button className="text-button" onClick={() => { setDraft({ ...blankRow(), fullName: row.fullName, workEmail: row.workEmail, accountType: row.accountType, roleRequested: row.roleRequested, scopeType: row.scopeType }); setEditing(null); setReviewing(false); setDownloaded(false); formRef.current?.scrollIntoView({ behavior: 'smooth' }); }}>Add another role</button></div></article>)}<div className="access-note"><ShieldCheck size={19} /><div><strong>Roles are not staffing assignments.</strong><p>A Partner role does not automatically assign that person as the Engagement Partner.</p><strong>Independent approval needs another person.</strong><p>Holding several roles does not allow someone to approve their own preparation.</p></div></div></aside></div>
        {errors.length > 0 && <div className="error-box" role="alert"><strong>Please check your request</strong><ul>{errors.map((error, i) => <li key={i}>{error}</li>)}</ul></div>}
        <div className="review-action"><span>{rows.length} access {rows.length === 1 ? 'entry' : 'entries'} ready to check</span><button className="primary-button" onClick={review}>Review team <ArrowRight size={17} /></button></div>
      </section>

      <section ref={reviewRef} id="review" className="section-block no-print"><span className="eyebrow">03 / Final check</span><h2>Review, download, then send.</h2>{!reviewing ? <p>Build your list above, then select <strong>Review team</strong> to check the complete request.</p> : <div className="review-panel"><h3>{details.firmName}</h3><p>Prepared by {details.submittedBy} · {details.contactEmail}</p><div className="table-scroll"><table><thead><tr><th>Person</th><th>Role</th><th>Coverage</th><th>Requested end</th><th>Note</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td><strong>{r.fullName}</strong><br />{r.workEmail}</td><td>{getRoleByCode(r.roleRequested).displayLabel}</td><td>{formatScopeColumn(r)}</td><td>{r.expiry || 'No end date requested'}</td><td>{r.notes || '—'}</td></tr>)}</tbody></table></div>{warnings.length > 0 && <div className="warning-box"><strong>Needs administrator review</strong><ul>{warnings.map(w => <li key={w}>{w}</li>)}</ul></div>}<label className="checkbox-label"><input type="checkbox" checked={confirmed} onChange={e => setConfirmed(e.target.checked)} />I have checked the people, sign-in emails, roles and access coverage.</label><button disabled={!confirmed} className="primary-button" onClick={download}><Download size={17} />Download reviewed request</button>{downloaded && <div className="receipt" role="status"><Check size={20} /><div><strong>Request downloaded — not yet sent.</strong><p>{deliveryEmail ? <>Attach the CSV and send it to <a href={`mailto:${deliveryEmail}?subject=AuditSphere%20team%20access%20request`}>{deliveryEmail}</a>.</> : 'Ask the person coordinating your AuditSphere setup for the administrator’s delivery address, then send them the CSV. No delivery address is configured on this page.'} Access still awaits administrator verification.</p></div></div>}</div>}<div className="next-steps">{['Administrator reviews your request', 'Verified access is assigned', 'Each person receives sign-in instructions'].map((text, i) => <div key={text}><span>{i + 1}</span><p>{text}</p></div>)}</div></section>

      <section className="section-block no-print"><span className="eyebrow">A little more guidance</span><h2>More about access.</h2><details className="reference"><summary>How does access coverage work?</summary>{SCOPES.map(s => <p key={s.code}><strong>{s.label}:</strong> {s.meaning} {s.doesNotCover}</p>)}</details>{[
        ['Can someone have multiple roles?', 'Yes. Use “Add another role” on their entry to keep the same name and email. Each role and coverage is requested explicitly; independent approvals still require a different authorised person.'],
        ['Is there a read-only client role?', 'There is one Client Portal User role, not separate contributor and observer permissions. Uploads, responses and shared material depend on assigned coverage, request ownership or delegation, sign-in and workflow state. Describe any special restriction in the note for administrator review.'],
        ['Can I request temporary or future access?', 'You can request an end date except for consolidation-group access, which must be revoked explicitly. The administrator confirms the expiry timestamp. This form does not schedule future activation.'],
        ['Can we use a shared account?', 'No. Each person uses their own Microsoft sign-in account so actions remain attributable to an individual.'],
        ['How do I change or remove access?', 'Contact your Firm Administrator with the person’s name, sign-in email, affected role and client, engagement or group, and the change needed. For an urgent removal, contact them directly rather than preparing a new setup request.'],
      ].map(([q, a]) => <details className="reference" key={q}><summary>{q}</summary><p>{a}</p></details>)}</section>
      <footer className="page-footer">AuditSphere <span>Individual accounts. Appropriate access. Independent review.</span></footer>
    </main>
  </div>;
}
