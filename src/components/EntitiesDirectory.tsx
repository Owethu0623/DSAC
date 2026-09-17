import React, { useState } from 'react';
import { 
  Building2, 
  Search, 
  Filter, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon,
  ShieldCheck,
  TrendingUp,
  Award
} from 'lucide-react';
import { store } from '../services/store';
import { PublicEntity, EntityCluster, RiskLevel } from '../types';

interface EntitiesDirectoryProps {
  onSelectEntity: (entityId: string) => void;
}

export const EntitiesDirectory: React.FC<EntitiesDirectoryProps> = ({ onSelectEntity }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCluster, setSelectedCluster] = useState<string>('ALL');
  const [selectedRisk, setSelectedRisk] = useState<string>('ALL');

  const entities = store.entities;

  const filteredEntities = entities.filter(e => {
    const matchesSearch = e.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          e.shortCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          e.reportingOfficerName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCluster = selectedCluster === 'ALL' || e.cluster === selectedCluster;
    const matchesRisk = selectedRisk === 'ALL' || e.riskLevel === selectedRisk;
    return matchesSearch && matchesCluster && matchesRisk;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Directory Title */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 w-fit">
              DSAC Portfolio Registry
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              26 Public Entities & 6 Funded NPOs
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Complete institutional portfolio overseen by the Department of Sport, Arts and Culture under statutory transfers and PFMA compliance.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono font-semibold bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <span>Displaying:</span>
            <span className="text-emerald-700 font-bold">{filteredEntities.length} of {entities.length}</span>
            <span>Institutions</span>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by entity name or code (e.g. SAHRA, NAC)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedCluster}
              onChange={(e) => setSelectedCluster(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">All Portfolio Clusters</option>
              <option value="Heritage & Museums">Heritage & Museums</option>
              <option value="Creative Industries & Film">Creative Industries & Film</option>
              <option value="Sport & Recreation">Sport & Recreation</option>
              <option value="Performing Arts & Theatres">Performing Arts & Theatres</option>
              <option value="Language & Literature">Language & Literature</option>
            </select>
          </div>

          <div>
            <select
              value={selectedRisk}
              onChange={(e) => setSelectedRisk(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">All Risk Pulse Levels</option>
              <option value="LOW">Low Risk (On Track)</option>
              <option value="MEDIUM">Medium Risk (Requires Monitoring)</option>
              <option value="HIGH">High Risk (Intervention Needed)</option>
              <option value="CRITICAL">Critical Risk (Severe Non-Performance)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredEntities.map(entity => {
          const spendRate = entity.transferredAmountZAR > 0
            ? Math.round((entity.reportedExpenditureZAR / entity.transferredAmountZAR) * 100)
            : 0;

          return (
            <div
              key={entity.id}
              onClick={() => onSelectEntity(entity.id)}
              className="bg-white rounded-xl border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all p-5 flex flex-col justify-between cursor-pointer group"
            >
              <div>
                <div className="flex items-start justify-between gap-2">
                  <span className="w-10 h-10 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold text-xs font-['Cabinet_Grotesk']">
                    {entity.shortCode}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                    entity.riskLevel === 'LOW'
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : entity.riskLevel === 'MEDIUM'
                      ? 'bg-amber-50 text-amber-800 border border-amber-200'
                      : 'bg-rose-50 text-rose-800 border border-rose-200'
                  }`}>
                    {entity.riskLevel} Risk
                  </span>
                </div>

                <h3 className="font-bold text-slate-900 text-sm mt-3 group-hover:text-emerald-700 transition-colors line-clamp-2">
                  {entity.name}
                </h3>
                <div className="text-[11px] text-slate-500 mt-1">
                  Cluster: {entity.cluster}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-[11px] text-slate-400">Budget Allocation</div>
                    <div className="font-mono font-bold text-slate-800">
                      R {(entity.budgetAllocationZAR / 1_000_000).toFixed(1)}M
                    </div>
                  </div>

                  <div>
                    <div className="text-[11px] text-slate-400">Utilisation Rate</div>
                    <div className="font-mono font-bold text-slate-800">
                      {spendRate}%
                    </div>
                  </div>
                </div>

                <div className="mt-2 text-xs">
                  <div className="text-[11px] text-slate-400">AGSA Audit Finding</div>
                  <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-[10px] font-semibold ${
                    entity.auditOutcome === 'CLEAN_AUDIT'
                      ? 'bg-emerald-100 text-emerald-800'
                      : entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    {entity.auditOutcome.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-emerald-700 group-hover:text-emerald-800">
                <span>Enter Entity Workspace</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
