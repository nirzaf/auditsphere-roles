import { useId, useState } from 'react';
import { ChevronDown, ShieldCheck, UserRound, Users } from 'lucide-react';
import { ROLES, SCOPES } from '../data/rolesData.ts';
import type { RoleCode } from '../data/rolesData.ts';

interface PrivilegeHierarchyProps {
  groups: { title: string; codes: RoleCode[] }[];
}

/** A classification tree, not a rank or an inheritance model. */
export function PrivilegeHierarchy({ groups }: PrivilegeHierarchyProps) {
  const [selectedCode, setSelectedCode] = useState<RoleCode>('PARTNER');
  const headingId = useId();
  const detailId = useId();
  const selected = ROLES.find(role => role.code === selectedCode)!;
  const clientRole = ROLES.find(role => role.code === 'CLIENT_USER')!;

  function roleNode(code: RoleCode) {
    const role = ROLES.find(item => item.code === code)!;
    return (
      <li key={code}>
        <button
          type="button"
          className="privilege-role"
          aria-pressed={selectedCode === code}
          aria-controls={detailId}
          onClick={() => setSelectedCode(code)}
        >
          <strong>{role.displayLabel}</strong>
          <span>{role.responsibilities[0]}</span>
        </button>
      </li>
    );
  }

  return (
    <figure className="privilege-hierarchy" aria-labelledby={headingId}>
      <figcaption>
        <h3 id={headingId}>How each user’s privileges are represented</h3>
        <p>Follow the branches to a role. Select a role to see its coverage and approval boundaries.</p>
      </figcaption>

      <div className="privilege-root">
        <UserRound size={19} aria-hidden="true" />
        <div><strong>One person · one Microsoft sign-in</strong><span>Each person receives explicit role and coverage assignments.</span></div>
      </div>
      <div className="privilege-branches">
        <section className="privilege-branch" aria-label="Firm team privileges">
          <div className="privilege-type"><Users size={18} aria-hidden="true" /><div><h4>Firm team</h4><p>10 roles across separate responsibilities</p></div></div>
          <ul className="privilege-categories">
            {groups.map(group => {
              const codes = group.codes.filter(code => ROLES.find(role => role.code === code)?.accountType === 'Staff');
              if (!codes.length) return null;
              return (
                <li key={group.title}>
                  <h5>{group.title === 'Administration & client portal' ? 'Administration' : group.title}</h5>
                  <ul className="privilege-role-list">{codes.map(roleNode)}</ul>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="privilege-branch privilege-client" aria-label="Client contact privileges">
          <div className="privilege-type"><UserRound size={18} aria-hidden="true" /><div><h4>Client contact</h4><p>One client-portal role</p></div></div>
          <ul className="privilege-categories"><li><h5>Client portal</h5><ul className="privilege-role-list">{roleNode(clientRole.code)}</ul></li></ul>
          <div className="privilege-boundary">
            <strong>Selected client or engagement only</strong>
            <p>Respond to assigned document requests and access permitted shared material. Uploads and responses depend on request ownership or delegation, sign-in and workflow state.</p>
            <p>No whole-firm or consolidation-group grant. No separate read-only “Observer” role.</p>
          </div>
          <div className="privilege-boundary">
            <strong>Branches do not inherit privileges</strong>
            <p>A Partner is not automatically a Finance Reviewer. An Administrator is not a substitute for required Partner or finance authority. Additional roles must be assigned explicitly.</p>
          </div>
        </section>
      </div>

      <div className="privilege-selection" id={detailId}>
        <div className="privilege-selected-heading"><ShieldCheck size={19} aria-hidden="true" /><h4>{selected.displayLabel}</h4><span>Selected role</span></div>
        <p>{selected.summary}</p>
        <dl>
          <div><dt>Available coverage</dt><dd>{SCOPES.filter(scope => selected.allowedScopes.includes(scope.code)).map(scope => scope.label).join(' · ')}</dd></div>
          <div><dt>Approval boundaries</dt><dd>{selected.approvals}</dd></div>
          <div><dt>Important restriction</dt><dd>{selected.restriction}</dd></div>
        </dl>
      </div>

      <div className="privilege-effective">
        <ChevronDown size={18} aria-hidden="true" />
        <strong>What the person can actually do</strong>
        <p>Assigned role <span>+</span> permitted coverage <span>+</span> current workflow checks</p>
        <small>Whole-firm access does not include consolidation groups. Group access does not open individual company books. Partner staffing and required independent approval are checked separately.</small>
      </div>
    </figure>
  );
}
