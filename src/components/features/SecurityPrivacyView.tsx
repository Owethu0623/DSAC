import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  FileCheck, 
  Eye, 
  AlertCircle, 
  Database, 
  Server, 
  CheckCircle2, 
  History, 
  UserCheck, 
  FileLock2, 
  Download,
  Search,
  ExternalLink
} from 'lucide-react';
import { store } from '../../services/store';

export const SecurityPrivacyView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'compliance' | 'rbac' | 'audit'>('compliance');
  const [auditSearch, setAuditSearch] = useState('');
  const auditLogs = store.auditLogs;

  const filteredLogs = auditLogs.filter(log => 
    log.action.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.userName.toLowerCase().includes(auditSearch.toLowerCase()) ||
    log.details.toLowerCase().includes(auditSearch.toLowerCase()) ||
    (log.entityName && log.entityName.toLowerCase().includes(auditSearch.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <ShieldCheck className="w-4.5 h-4.5" />
            </div>
            <div>
              <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 inline-block">
                Requirement (e): Security &amp; Privacy Compliance
              </div>
              <h1 className="text-xl font-black text-slate-900 mt-1 tracking-tight">
                South African Cybersecurity &amp; POPIA Principles
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Protection of Personal Information Act (POPIA No. 4 of 2013), Role-Based Access Control (RBAC), and PFMA audit logging for public entities and NPOs. Each panel states what this build implements and what a production deployment must provide.
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold shrink-0">
          <button
            onClick={() => setActiveTab('compliance')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'compliance'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>POPIA &amp; Security</span>
          </button>
          <button
            onClick={() => setActiveTab('rbac')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'rbac'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span>Access Control (RBAC)</span>
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5 text-amber-600" />
            <span>Audit Trail</span>
          </button>
        </div>
      </div>

      {/* TAB 1: POPIA & SA CYBERSECURITY PRINCIPLES */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          {/* 4 Compliance Pillars */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">POPIA Act No. 4 of 2013</span>
                <span className="p-1 rounded-md bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">Design Target</div>
              <p className="text-[11px] text-slate-600 mt-1">
                The platform is designed around the 8 conditions for lawful processing. It has not been formally assessed or certified; that requires a POPIA assessment of the production deployment.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Encryption Standard</span>
                <span className="p-1 rounded-md bg-blue-100 text-blue-800">
                  <Lock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">Production requirement</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Production must encrypt data in transit (TLS 1.2+) and at rest. This demonstration build runs entirely in the browser and keeps its data unencrypted in local browser storage, so it must not hold real personal or financial records.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Data Sovereignty</span>
                <span className="p-1 rounded-md bg-teal-100 text-teal-800">
                  <Server className="w-4 h-4" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">Deployment requirement</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Production hosting must be inside South Africa (an in-country government or cloud region). This demonstration build has no server and stores nothing outside the user's own browser.
              </p>
            </div>

            <div className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Integrity &amp; Hashes</span>
                <span className="p-1 rounded-md bg-amber-100 text-amber-800">
                  <FileLock2 className="w-4 h-4" />
                </span>
              </div>
              <div className="text-lg font-black text-slate-900 mt-2">SHA-256 Document Hashes</div>
              <p className="text-[11px] text-slate-600 mt-1">
                Implemented: every document upload receives a SHA-256 hash that can be re-computed to prove the file has not changed.
              </p>
            </div>
          </div>

          {/* Detailed POPIA Principles Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
              <span>Alignment with South African Privacy Principles (POPIA)</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-[10px]">1</span>
                  <span>Accountability &amp; Responsible Parties</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  The DSAC Director-General serves as Chief Information Officer under Section 56 of POPIA. Each public entity retains a designated Deputy Information Officer responsible for subsidiary data handling.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-[10px]">2</span>
                  <span>Processing Limitation &amp; Minimality</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Only statutory data required for PFMA oversight, AGSA audit verification, and demographic reporting (Employment Equity Act) is collected. Beneficiary names are pseudonymized.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-[10px]">3</span>
                  <span>Purpose Specification</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Data collected under Vote 37 is explicitly designated for statutory performance evaluation and parliamentary accountability. Commercial data mining or third-party sharing is strictly prohibited.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-200 text-emerald-900 flex items-center justify-center font-bold text-[10px]">4</span>
                  <span>Security Safeguards &amp; Breach Protocol</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  Automated incident response with statutory notification to the Information Regulator of South Africa within 72 hours in compliance with Section 22 of POPIA.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ROLE-BASED ACCESS CONTROL (RBAC) */}
      {activeTab === 'rbac' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-black text-slate-900">
              Role-Based Access Control (RBAC) Matrix
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Enforcing least-privilege security between the DSAC Holding Department and the 32 Subsidiaries.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-bold uppercase tracking-wider text-[10px] border-y border-slate-200">
                <tr>
                  <th className="py-3 px-4">System Role</th>
                  <th className="py-3 px-4">Access Scope</th>
                  <th className="py-3 px-4">Report Clearances</th>
                  <th className="py-3 px-4">Directives &amp; Tasks</th>
                  <th className="py-3 px-4">Financial Transfers</th>
                  <th className="py-3 px-4">Audit Access</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-medium">
                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">DSAC Administrator / DG</div>
                    <div className="text-[10px] text-slate-400">Holding Company Oversight</div>
                  </td>
                  <td className="py-3.5 px-4 text-emerald-700 font-bold">All 32 Institutions</td>
                  <td className="py-3.5 px-4 text-emerald-700">Approve &amp; Reject</td>
                  <td className="py-3.5 px-4 text-emerald-700">Issue Directives</td>
                  <td className="py-3.5 px-4 text-emerald-700">Authorize Tranches</td>
                  <td className="py-3.5 px-4 text-emerald-700">Full Audit Read/Write</td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">Entity Reporting Officer</div>
                    <div className="text-[10px] text-slate-400">Subsidiary Operations (CEO/CFO)</div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-700 font-bold">Assigned Entity Only</td>
                  <td className="py-3.5 px-4 text-slate-700">Draft &amp; Submit</td>
                  <td className="py-3.5 px-4 text-slate-700">Internal &amp; Reply</td>
                  <td className="py-3.5 px-4 text-slate-700">Expenditure Filing</td>
                  <td className="py-3.5 px-4 text-slate-500">Entity Log Only</td>
                </tr>

                <tr className="hover:bg-slate-50/80">
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">AGSA External Auditor</div>
                    <div className="text-[10px] text-slate-400">Auditor-General of South Africa</div>
                  </td>
                  <td className="py-3.5 px-4 text-blue-700 font-bold">All 32 Institutions</td>
                  <td className="py-3.5 px-4 text-blue-700">Read &amp; Verify PoE</td>
                  <td className="py-3.5 px-4 text-slate-500">Read-only</td>
                  <td className="py-3.5 px-4 text-blue-700">Read-only Ledger</td>
                  <td className="py-3.5 px-4 text-blue-700 font-bold">Full Cryptographic Verification</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-black text-slate-900">
                Statutory PFMA Audit Trail
              </h2>
              <p className="text-xs text-slate-500">
                Chronological activity ledger for Section 38 governance. In this build it is a browser-local list (most recent 100 entries) and can be altered by the person using the browser; production must write to an append-only, server-side store.
              </p>
            </div>

            <div className="relative max-w-xs w-full">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditSearch}
                onChange={(e) => setAuditSearch(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-[500px] space-y-2 pr-1 custom-scrollbar">
            {filteredLogs.map(log => (
              <div 
                key={log.id} 
                className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-[10px] px-2 py-0.5 rounded-sm bg-slate-200 text-slate-800">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="font-bold text-slate-900">{log.userName}</span>
                    <span className="text-[10px] text-slate-400">({log.userRole})</span>
                    {log.entityName && (
                      <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                        {log.entityName}
                      </span>
                    )}
                  </div>
                  <p className="text-slate-600 text-[11px]">{log.details}</p>
                </div>

                <div className="text-right shrink-0 text-[10px] text-slate-400 font-mono">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
