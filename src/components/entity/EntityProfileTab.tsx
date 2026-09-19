import React from 'react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';
import { Panel } from './parts';

interface Props {
  entity: PublicEntity;
}

const Row: React.FC<{ label: string; value?: React.ReactNode }> = ({ label, value }) => (
  <div className="flex items-start justify-between gap-4 py-2 border-b border-slate-100 last:border-0 text-xs">
    <dt className="text-slate-500 shrink-0">{label}</dt>
    <dd className="font-semibold text-slate-900 text-right break-words min-w-0">{value || '—'}</dd>
  </div>
);

const num = (n?: number) => (n === undefined || n === null ? '—' : n.toLocaleString('en-ZA'));

/** Who the organisation is: registration, people, workforce. Master data, not a calculation. */
export const EntityProfileTab: React.FC<Props> = ({ entity }) => {
  const officers = store.registeredUsers.filter(u => u.entityId === entity.id);
  const d = entity.demographics;
  const j = entity.jobStats;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <Panel title="Organisation">
        <dl>
          <Row label="Name" value={entity.name} />
          <Row label="Short code" value={entity.shortCode} />
          <Row label="Type" value={entity.type === 'PUBLIC_ENTITY' ? 'Public entity (PFMA Schedule 3A)' : 'Non-profit organisation'} />
          <Row label="Cluster" value={entity.cluster} />
          <Row label="Registration" value={entity.registrationStatus === 'PENDING_VERIFICATION' ? 'Pending DSAC verification' : 'Verified portfolio member'} />
          <Row label="Latest audit outcome" value={`${entity.auditOutcome.replace(/_/g, ' ').toLowerCase()} (${entity.auditYear})`} />
        </dl>
      </Panel>

      <Panel title="People and contacts">
        <dl>
          <Row label="Head of institution / accounting officer" value={entity.headOfEntity} />
          <Row label="Reporting officer" value={entity.reportingOfficerName} />
          <Row label="Contact e-mail" value={entity.contactEmail} />
        </dl>
        <div className="mt-4">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">System users</div>
          {officers.length === 0 ? (
            <p className="text-xs text-slate-400">No users are linked to this organisation.</p>
          ) : (
            <ul className="space-y-1.5">
              {officers.map(u => (
                <li key={u.id} className="text-xs flex items-center justify-between gap-3 p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">{u.name}</span>
                  <span className="text-slate-500 truncate">{u.designation} • {u.email}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Panel>

      <Panel title="Workforce" subtitle="As reported by the organisation.">
        <dl>
          <Row label="Total staff" value={num(d.totalStaff)} />
          <Row label="Female / male" value={`${num(d.female)} / ${num(d.male)}`} />
          <Row label="Youth (under 35)" value={num(d.youth)} />
          <Row label="Persons with disabilities" value={num(d.personsWithDisabilities)} />
        </dl>
      </Panel>

      <Panel title="Jobs and sector support" subtitle="Reported for the current year.">
        <dl>
          <Row label="Permanent jobs" value={num(j.permanentJobs)} />
          <Row label="Temporary jobs" value={num(j.temporaryJobs)} />
          <Row label="Youth jobs created" value={num(j.youthJobsCreated)} />
          <Row label="Annual jobs target" value={num(j.targetJobsAnnual)} />
          <Row label="Practitioners supported" value={num(j.creativeSectorPractitionersSupported)} />
        </dl>
      </Panel>
    </div>
  );
};
