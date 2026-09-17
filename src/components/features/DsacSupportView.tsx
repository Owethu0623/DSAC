import React, { useState } from 'react';
import { 
  Coins, 
  HelpCircle, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Search, 
  Filter, 
  PlusCircle, 
  ArrowUpRight, 
  Building2, 
  Users, 
  FileCheck, 
  Wrench, 
  BookOpen, 
  Shield, 
  Layers,
  Check,
  X
} from 'lucide-react';
import { PublicEntity } from '../../types';
import { store } from '../../services/store';

interface DsacSupportViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
  onOpenSideView?: (feature: 'compliance' | 'performance' | 'support' | 'reports' | 'entities' | 'risks', entityId?: string) => void;
}

interface SupportRequestItem {
  id: string;
  entityId: string;
  entityName: string;
  category: 'Financial Support' | 'Capacity Building' | 'Technical Support' | 'Governance Support' | 'Programme Support' | 'Infrastructure Support';
  title: string;
  amountZAR: number;
  submittedDate: string;
  status: 'PENDING_REVIEW' | 'APPROVED' | 'DISBURSED' | 'DECLINED';
  priority: 'HIGH' | 'MEDIUM' | 'NORMAL';
  description: string;
  expectedOutcome: string;
}

const INITIAL_SUPPORT_REQUESTS: SupportRequestItem[] = [
  {
    id: 'sup-001',
    entityId: 'ent-ubuntu-arts',
    entityName: 'Ubuntu Arts NPO',
    category: 'Programme Support',
    title: 'Youth Community Arts Festival & Rural Touring Production Subvention',
    amountZAR: 450000,
    submittedDate: '12 Sep 2026',
    status: 'APPROVED',
    priority: 'HIGH',
    description: 'Supplemental touring subvention to extend the Eastern Cape rural theatre masterclasses to 14 underserved schools in Bizana and Flagstaff.',
    expectedOutcome: 'Direct engagement of 450 rural youth and creation of 18 temporary arts practitioner contracts.'
  },
  {
    id: 'sup-002',
    entityId: 'ent-sahra',
    entityName: 'South African Heritage Resources Agency (SAHRA)',
    category: 'Technical Support',
    title: 'SAHRIS National Heritage Geodatabase Cloud Infrastructure Upgrade',
    amountZAR: 1200000,
    submittedDate: '10 Sep 2026',
    status: 'PENDING_REVIEW',
    priority: 'HIGH',
    description: 'High-availability server migration and GIS cloud processing modernization to prevent permitting backlogs during Section 34 & 38 development applications.',
    expectedOutcome: 'Zero downtime during statutory heritage permit evaluations and integration with provincial heritage registries.'
  },
  {
    id: 'sup-003',
    entityId: 'ent-pacofs',
    entityName: 'Performing Arts Centre of the Free State (PACOFS)',
    category: 'Governance Support',
    title: 'Internal Audit & PFMA Compliance Advisory Task Team Intervention',
    amountZAR: 320000,
    submittedDate: '05 Sep 2026',
    status: 'PENDING_REVIEW',
    priority: 'HIGH',
    description: 'Deployment of DSAC Oversight Directorate governance experts to address AGSA qualification findings related to asset register reconciliation.',
    expectedOutcome: 'Resolution of 14 audit findings ahead of 2025/26 statutory tabling.'
  },
  {
    id: 'sup-004',
    entityId: 'ent-nac',
    entityName: 'National Arts Council of South Africa (NAC)',
    category: 'Capacity Building',
    title: 'Grant Management Portal Verification & Adjudication Workshop',
    amountZAR: 280000,
    submittedDate: '28 Aug 2026',
    status: 'APPROVED',
    priority: 'MEDIUM',
    description: 'Capacity building training for newly appointed panellists and administrative staff on electronic grant auditing and POPI Act compliance.',
    expectedOutcome: 'Accelerated turnaround time for artist funding disbursements.'
  },
  {
    id: 'sup-005',
    entityId: 'ent-bsa',
    entityName: 'Boxing South Africa (BSA)',
    category: 'Financial Support',
    title: 'Emergency Medical & Sanctioning Compliance Tranche',
    amountZAR: 650000,
    submittedDate: '22 Aug 2026',
    status: 'PENDING_REVIEW',
    priority: 'HIGH',
    description: 'Statutory medical surveillance and ringside safety compliance equipment for provincial tournament sanctioning.',
    expectedOutcome: '100% medical compliance and safety clearance across all professional boxing events.'
  },
  {
    id: 'sup-006',
    entityId: 'ent-dmsa',
    entityName: 'Ditsong Museums of South Africa (DMSA)',
    category: 'Infrastructure Support',
    title: 'National Museum of Natural History Climate-Control Rehabilitation',
    amountZAR: 2400000,
    submittedDate: '15 Aug 2026',
    status: 'DISBURSED',
    priority: 'HIGH',
    description: 'HVAC repair and humidity stabilization in fossil and taxidermy archival vaults.',
    expectedOutcome: 'Long-term preservation of irreplaceable national type-specimens.'
  },
  {
    id: 'sup-007',
    entityId: 'ent-market-theatre',
    entityName: 'Market Theatre Foundation',
    category: 'Programme Support',
    title: 'Zweli Moya Emerging Playwrights Incubator',
    amountZAR: 380000,
    submittedDate: '01 Sep 2026',
    status: 'APPROVED',
    priority: 'NORMAL',
    description: 'Incubation of 12 original South African plays with masterclasses by senior directors.',
    expectedOutcome: 'Staging of 4 premier productions and employment for 36 actors and stage crew.'
  },
  {
    id: 'sup-008',
    entityId: 'ent-basa',
    entityName: 'Business and Arts South Africa (BASA)',
    category: 'Capacity Building',
    title: 'Supporting Arts Mentorship Programme for NPOs',
    amountZAR: 420000,
    submittedDate: '18 Aug 2026',
    status: 'DISBURSED',
    priority: 'NORMAL',
    description: 'Connecting corporate finance mentors with cultural NPO directors for sustainable revenue generation.',
    expectedOutcome: 'Capacity upliftment for 28 grassroots cultural organizations.'
  }
];

export const DsacSupportView: React.FC<DsacSupportViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace,
  onOpenSideView
}) => {
  const [requests, setRequests] = useState<SupportRequestItem[]>(INITIAL_SUPPORT_REQUESTS);
  const [selectedRequestId, setSelectedRequestId] = useState<string>(INITIAL_SUPPORT_REQUESTS[0].id);
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [feedbackNotice, setFeedbackNotice] = useState<string | null>(null);

  // Category summary counts
  const categories = [
    { name: 'Financial Support', count: 18, color: 'bg-blue-500' },
    { name: 'Capacity Building', count: 12, color: 'bg-teal-500' },
    { name: 'Technical Support', count: 10, color: 'bg-amber-400' },
    { name: 'Governance Support', count: 6, color: 'bg-indigo-600' },
    { name: 'Programme Support', count: 5, color: 'bg-rose-400' },
    { name: 'Infrastructure Support', count: 3, color: 'bg-yellow-500' },
  ];

  const filteredRequests = requests.filter(req => {
    const matchesSearch = 
      req.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'ALL' || req.category === categoryFilter;
    const matchesStatus = statusFilter === 'ALL' || req.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const selectedRequest = requests.find(r => r.id === selectedRequestId) || requests[0];

  const handleApprove = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'APPROVED' } : r));
    setFeedbackNotice(`Support tranche approved for ${selectedRequest?.entityName}. Tranche released.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleDisburse = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'DISBURSED' } : r));
    setFeedbackNotice(`Statutory funds disbursed via National Treasury BAS system.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleDecline = (id: string) => {
    setRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'DECLINED' } : r));
    setFeedbackNotice(`Support request marked as declined with feedback issued.`);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Bar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-100 text-blue-800">
                <Coins className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900">
                Support &amp; Funding Allocation Oversight
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Technical, Governance, Financial, and Capacity Building Interventions across all 26 Public Entities and 6 NPOs (32 Total)
            </p>
          </div>

          {feedbackNotice && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{feedbackNotice}</span>
            </div>
          )}
        </div>

        {/* 6 Categories Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3">
          {categories.map((cat) => {
            const isSelected = categoryFilter === cat.name;
            return (
              <div 
                key={cat.name} 
                onClick={() => {
                  if (categoryFilter === cat.name) {
                    setCategoryFilter('ALL');
                  } else {
                    setCategoryFilter(cat.name);
                    const match = requests.find(r => r.category === cat.name);
                    if (match) {
                      setSelectedRequestId(match.id);
                      onOpenSideView?.('support', match.entityId);
                    } else {
                      onOpenSideView?.('support', 'ent-sahra');
                    }
                  }
                }}
                className={`p-2.5 rounded-lg border transition-all cursor-pointer hover:shadow-xs ${
                  isSelected 
                    ? 'bg-blue-50/80 border-blue-500 shadow-2xs ring-1 ring-blue-300' 
                    : 'bg-slate-50 border-slate-200/70 hover:bg-slate-100/70'
                }`}
                title={`Filter by ${cat.name} & inspect in side view`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-slate-600 truncate">{cat.name}</span>
                  <span className={`w-2 h-2 rounded-full ${cat.color}`}></span>
                </div>
                <div className="text-xl font-black text-slate-900 mt-1">{cat.count}</div>
                <div className="text-[10px] text-slate-400">Interventions</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search support requests..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Support Types</option>
            <option value="Financial Support">Financial Support</option>
            <option value="Capacity Building">Capacity Building</option>
            <option value="Technical Support">Technical Support</option>
            <option value="Governance Support">Governance Support</option>
            <option value="Programme Support">Programme Support</option>
            <option value="Infrastructure Support">Infrastructure Support</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="PENDING_REVIEW">Pending DSAC Review</option>
            <option value="APPROVED">Approved</option>
            <option value="DISBURSED">Disbursed</option>
            <option value="DECLINED">Declined</option>
          </select>
        </div>
      </div>

      {/* MASTER-DETAIL SIDE VIEW LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT PANE: Master List of Support Requests (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[740px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Support Pipeline ({filteredRequests.length})
            </span>
            <button
              onClick={() => onOpenSideView?.('support', selectedRequest?.entityId || 'ent-sahra')}
              className="text-[11px] text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer flex items-center gap-1 hover:underline"
              title="Inspect in side view"
            >
              <span>Click to inspect in side view</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredRequests.map((req) => {
              const isSelected = req.id === selectedRequestId;

              return (
                <div
                  key={req.id}
                  onClick={() => {
                    setSelectedRequestId(req.id);
                    onOpenSideView?.('support', req.entityId);
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer text-left ${
                    isSelected
                      ? 'bg-blue-50/80 border-blue-600 shadow-xs ring-1 ring-blue-400/40'
                      : 'bg-white hover:bg-slate-50/80 border-slate-200/90'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="text-[10px] font-bold text-blue-800 bg-blue-100/80 px-2 py-0.5 rounded-sm">
                        {req.category}
                      </span>
                      <h5 className="font-bold text-xs text-slate-900 mt-1.5 line-clamp-1">
                        {req.title}
                      </h5>
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5 truncate">
                        {req.entityName}
                      </p>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="text-xs font-black text-slate-900">
                        R {(req.amountZAR / 1000).toLocaleString()}k
                      </div>
                      <span className={`inline-block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        req.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                        req.status === 'DISBURSED' ? 'bg-teal-100 text-teal-800' :
                        req.status === 'DECLINED' ? 'bg-rose-100 text-rose-800' :
                        'bg-amber-100 text-amber-800'
                      }`}>
                        {req.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-slate-100 text-[10px] text-slate-400">
                    <span>Submitted: {req.submittedDate}</span>
                    <span className="font-semibold text-slate-600">{req.priority} Priority</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANE: Side View Detail Dossier (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs sticky top-20">
          {selectedRequest ? (
            <div className="space-y-5">
              
              {/* Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-200">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-sm uppercase tracking-wider bg-blue-100 text-blue-900 border border-blue-200">
                      {selectedRequest.category}
                    </span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      selectedRequest.status === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      selectedRequest.status === 'DISBURSED' ? 'bg-teal-100 text-teal-800' :
                      selectedRequest.status === 'DECLINED' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {selectedRequest.status.replace('_', ' ')}
                    </span>
                  </div>
                  <h3 className="text-lg font-black text-slate-900 mt-1.5">
                    {selectedRequest.title}
                  </h3>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Submitting Institution: <button onClick={() => onOpenSideView?.('support', selectedRequest.entityId)} className="font-bold text-blue-700 hover:underline cursor-pointer">{selectedRequest.entityName}</button> • Date: {selectedRequest.submittedDate}
                  </p>
                </div>

                <div className="text-center p-3 rounded-xl bg-slate-50 border border-slate-200 shrink-0">
                  <div className="text-xl font-black text-slate-900 leading-none">
                    R {selectedRequest.amountZAR.toLocaleString()}
                  </div>
                  <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                    Requested Grant
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex flex-wrap items-center gap-2">
                {selectedRequest.status === 'PENDING_REVIEW' && (
                  <>
                    <button
                      onClick={() => handleApprove(selectedRequest.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Approve Support Package</span>
                    </button>
                    <button
                      onClick={() => handleDecline(selectedRequest.id)}
                      className="px-3.5 py-1.5 rounded-lg bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Decline Request</span>
                    </button>
                  </>
                )}

                {selectedRequest.status === 'APPROVED' && (
                  <button
                    onClick={() => handleDisburse(selectedRequest.id)}
                    className="px-3.5 py-1.5 rounded-lg bg-teal-700 hover:bg-teal-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <ArrowUpRight className="w-3.5 h-3.5" />
                    <span>Disburse Funds via National Treasury BAS</span>
                  </button>
                )}

                {selectedRequest.status === 'DISBURSED' && (
                  <div className="flex items-center gap-1.5 text-xs text-teal-800 font-bold bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                    <CheckCircle2 className="w-4 h-4 text-teal-600" />
                    <span>Funds Successfully Disbursed &amp; Reconciled</span>
                  </div>
                )}

                <button
                  onClick={() => onOpenSideView?.('support', selectedRequest.entityId)}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer ml-auto"
                  title="Inspect this entity's full statutory tranche and capacity support dossier in side view"
                >
                  <Coins className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Inspect in Side View</span>
                </button>
              </div>

              {/* Scope & Justification */}
              <div className="space-y-3 text-xs">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] mb-1">
                    Detailed Proposal Scope &amp; Problem Statement
                  </h4>
                  <p className="text-slate-600 leading-relaxed">
                    {selectedRequest.description}
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-blue-50/50 border border-blue-100">
                  <h4 className="font-bold text-blue-900 uppercase tracking-wider text-[11px] mb-1">
                    Expected Departmental Impact &amp; Beneficiaries
                  </h4>
                  <p className="text-blue-800 leading-relaxed">
                    {selectedRequest.expectedOutcome}
                  </p>
                </div>
              </div>

              {/* Statutory Assurances Verified */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-white">
                <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2">
                  Departmental Compliance Checklist
                </h4>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Section 38(1)(j) Assurance in order</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Valid SARS Tax Clearance Certificate</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>PFMA Vote 37 Budget Code Assigned</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span>Oversight Directorate Verified</span>
                  </div>
                </div>
              </div>

            </div>
          ) : (
            <div className="text-center py-20 text-slate-400">
              Select a support request to view details
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
