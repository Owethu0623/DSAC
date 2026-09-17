import React, { useState } from 'react';
import { 
  Shield, 
  Search, 
  Filter, 
  Calendar, 
  Clock, 
  User, 
  Building2,
  FileCheck,
  CheckCircle2
} from 'lucide-react';
import { store } from '../services/store';
import { AuditLogEntry } from '../types';

export const AuditLogView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('ALL');

  const logs = store.auditLogs;

  const filteredLogs = logs.filter(l => {
    const matchesSearch = l.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          l.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (l.entityName && l.entityName.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesAction = selectedAction === 'ALL' || l.action === selectedAction;
    return matchesSearch && matchesAction;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 w-fit">
              Statutory Accountability & PFMA Section 38
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              Immutable Governance Audit Trail
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Tamper-evident chronological log of every administrative decision, report submission, version increment, risk calculation, and corrective action directive.
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <span>Audit Records: </span>
            <strong className="text-slate-900">{logs.length} Logged Events</strong>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by official, entity, or action details..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">All Audit Actions</option>
              <option value="REPORT_SUBMITTED">Report Submitted</option>
              <option value="REPORT_APPROVED">Report Approved</option>
              <option value="REPORT_CORRECTION_REQUIRED">Correction Required</option>
              <option value="TASK_CREATED">Task Created</option>
              <option value="TASK_RESOLVED">Task Resolved</option>
              <option value="DOCUMENT_UPLOADED">Document Uploaded</option>
              <option value="DOCUMENT_VERSION_INCREMENTED">Version Incremented</option>
              <option value="EARLY_WARNING_TRIGGERED">Early Warning Triggered</option>
              <option value="USER_LOGIN">User Persona Switched / Login</option>
            </select>
          </div>
        </div>
      </div>

      {/* Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Timestamp (UTC)</th>
                <th className="py-3 px-4">Official / Actor</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">Action Type</th>
                <th className="py-3 px-4">Audit Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 font-mono text-slate-500 text-[11px] whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <div className="font-semibold text-slate-900">{log.userName}</div>
                    <div className="text-[10px] text-slate-400">{log.userRole}</div>
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap text-slate-700 font-medium">
                    {log.entityName || 'DSAC National'}
                  </td>

                  <td className="py-3 px-4 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action.replace(/_/g, ' ')}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 leading-relaxed max-w-md">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
