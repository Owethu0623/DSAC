import React, { useState, useMemo } from 'react';
import { 
  HelpCircle, 
  Search, 
  Filter, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  AlertCircle,
  MessageSquare, 
  Send, 
  Plus, 
  Building2, 
  ExternalLink,
  ChevronRight,
  UserCheck,
  FileText,
  Calendar,
  X,
  Sparkles,
  ArrowRight,
  Paperclip
} from 'lucide-react';
import { PublicEntity } from '../../types';

export interface QueryRecord {
  id: string;
  referenceNumber: string;
  entityId: string;
  entityName: string;
  category: 'Parliamentary Question' | 'PFMA Compliance Clarification' | 'Audit Query' | 'Grant & Subsidy Query' | 'Public Information Request';
  subject: string;
  description: string;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OVERDUE';
  dateCreated: string;
  dueDate: string;
  assignedOfficer: string;
  responsesCount: number;
  lastResponseDate?: string;
  responses: {
    author: string;
    role: string;
    date: string;
    content: string;
  }[];
}

const INITIAL_QUERIES: QueryRecord[] = [
  {
    id: 'qry-001',
    referenceNumber: 'DSAC-PQ-2026/048',
    entityId: 'ent-sahra',
    entityName: 'South African Heritage Resources Agency (SAHRA)',
    category: 'Parliamentary Question',
    subject: 'National Heritage Grading Register & Digitization of Grade I Sites in Limpopo & Eastern Cape',
    description: 'Parliamentary Portfolio Committee inquiry regarding the backlog of statutory declaration gazettes for sacred heritage sites and allocation of digitisation funding.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dateCreated: '2026-08-14',
    dueDate: '2026-09-22',
    assignedOfficer: 'Sicelo Sakhile Mkhize',
    responsesCount: 2,
    lastResponseDate: '2026-08-20',
    responses: [
      {
        author: 'Parliamentary Liaison Officer',
        role: 'DSAC Ministry',
        date: '14 Aug 2026',
        content: 'Transmitted formal notice from Portfolio Committee on Sports, Arts and Culture. Factual reply required within 10 working days.'
      },
      {
        author: 'Dr. Mxolisi Dlamuka',
        role: 'CEO, SAHRA',
        date: '20 Aug 2026',
        content: 'Draft technical response compiled with SAHRIS system logs. Annexure A detailing 42 provincial declarations attached for Departmental review.'
      }
    ]
  },
  {
    id: 'qry-002',
    referenceNumber: 'DSAC-PFMA-2026/112',
    entityId: 'ent-pacofs',
    entityName: 'Performing Arts Centre of the Free State (PACOFS)',
    category: 'PFMA Compliance Clarification',
    subject: 'Clarification on Capital Infrastructure Subsidy Spending & HVAC Tender Variation',
    description: 'Statutory oversight query requesting breakdown of the 18.4% variance in the stage lighting and ventilation modernization subvention.',
    priority: 'CRITICAL',
    status: 'OVERDUE',
    dateCreated: '2026-07-28',
    dueDate: '2026-08-15',
    assignedOfficer: 'Zandile Ndlovu (CFO Office)',
    responsesCount: 1,
    lastResponseDate: '2026-08-01',
    responses: [
      {
        author: 'Sicelo Sakhile Mkhize',
        role: 'Chief Director: Oversight',
        date: '28 Jul 2026',
        content: 'Formal notice issued under Section 38(1)(j) of the PFMA requesting verified contractor milestone certificates and board approval extract.'
      }
    ]
  },
  {
    id: 'qry-003',
    referenceNumber: 'DSAC-NPO-2026/089',
    entityId: 'ent-ubuntu-arts',
    entityName: 'Ubuntu Arts NPO',
    category: 'Grant & Subsidy Query',
    subject: 'Request for Tranche 3 Grant Release Schedule & Rural Outreach Annexure Verification',
    description: 'NPO leadership requesting confirmation of scheduled EFT date for Q3 operational subvention following clearance of Q2 Portfolio of Evidence.',
    priority: 'MEDIUM',
    status: 'OPEN',
    dateCreated: '2026-09-02',
    dueDate: '2026-09-25',
    assignedOfficer: 'Lerato Phiri / DSAC Grants Admin',
    responsesCount: 0,
    responses: []
  },
  {
    id: 'qry-004',
    referenceNumber: 'DSAC-AGSA-2026/033',
    entityId: 'ent-nfvf',
    entityName: 'National Film and Video Foundation (NFVF)',
    category: 'Audit Query',
    subject: 'AGSA Finding Status: Presidential Employment Stimulus (PESP) Beneficiary Audit Trail',
    description: 'Follow-up query on the remediation of audit finding 2024-PESP-04 regarding uncollected third-party completion certificates from film distribution grant recipients.',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    dateCreated: '2026-08-25',
    dueDate: '2026-09-30',
    assignedOfficer: 'Mthunzi Sithole',
    responsesCount: 1,
    lastResponseDate: '2026-09-05',
    responses: [
      {
        author: 'NFVF Audit & Risk Committee',
        role: 'NFVF Governance',
        date: '05 Sep 2026',
        content: 'Remediation plan at 85% completion. Independent verification report scheduled for board sign-off on 18 September.'
      }
    ]
  },
  {
    id: 'qry-005',
    referenceNumber: 'DSAC-REQ-2026/077',
    entityId: 'ent-blind-sa',
    entityName: 'Blind SA Accessible Literature Programme',
    category: 'Public Information Request',
    subject: 'Access to Braille and Audio Master Catalogues for Community Arts Libraries',
    description: 'Inter-departmental information sharing request on expanding subsidized audio literature distribution to municipal libraries in rural Mpumalanga.',
    priority: 'LOW',
    status: 'RESOLVED',
    dateCreated: '2026-07-10',
    dueDate: '2026-08-01',
    assignedOfficer: 'Patricia Khumalo',
    responsesCount: 3,
    lastResponseDate: '2026-07-29',
    responses: [
      {
        author: 'Patricia Khumalo',
        role: 'DSAC Libraries Directorate',
        date: '10 Jul 2026',
        content: 'Transmitted catalogue request to Blind SA project coordinator.'
      },
      {
        author: 'Jabu Sithole',
        role: 'Coordinator, Blind SA',
        date: '18 Jul 2026',
        content: 'Full digital repository index containing 1,420 converted public titles provided via secure SFTP link.'
      },
      {
        author: 'Patricia Khumalo',
        role: 'DSAC Libraries Directorate',
        date: '29 Jul 2026',
        content: 'Confirmation received. Catalog integrated into DSAC public arts portal. Query marked resolved.'
      }
    ]
  },
  {
    id: 'qry-006',
    referenceNumber: 'DSAC-PQ-2026/052',
    entityId: 'ent-artscape',
    entityName: 'Artscape Theatre Centre',
    category: 'Parliamentary Question',
    subject: 'Youth Audience Inclusivity & Indigenous Languages Performance Schedule 2026/27',
    description: 'Ministerial question on percentage of main-stage productions presented in isiXhosa and Afrikaans, and ticket subsidy quotas for township schools.',
    priority: 'HIGH',
    status: 'OPEN',
    dateCreated: '2026-09-10',
    dueDate: '2026-09-24',
    assignedOfficer: 'Sicelo Sakhile Mkhize',
    responsesCount: 0,
    responses: []
  }
];

interface DsacQueriesViewProps {
  entities: PublicEntity[];
  onSelectEntity?: (entityId: string) => void;
  onOpenWorkspace?: (entityId: string) => void;
}

export const DsacQueriesView: React.FC<DsacQueriesViewProps> = ({
  entities,
  onSelectEntity,
  onOpenWorkspace
}) => {
  const [queries, setQueries] = useState<QueryRecord[]>(INITIAL_QUERIES);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'OVERDUE'>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [selectedQuery, setSelectedQuery] = useState<QueryRecord | null>(INITIAL_QUERIES[0]);
  const [replyText, setReplyText] = useState('');
  const [isNewQueryModalOpen, setIsNewQueryModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // New query form state
  const [newEntityId, setNewEntityId] = useState<string>(entities[0]?.id || 'ent-sahra');
  const [newCategory, setNewCategory] = useState<QueryRecord['category']>('Parliamentary Question');
  const [newSubject, setNewSubject] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPriority, setNewPriority] = useState<QueryRecord['priority']>('HIGH');
  const [newDueDate, setNewDueDate] = useState('2026-09-30');

  // Stats
  const totalCount = queries.length;
  const openCount = queries.filter(q => q.status === 'OPEN').length;
  const inProgressCount = queries.filter(q => q.status === 'IN_PROGRESS').length;
  const resolvedCount = queries.filter(q => q.status === 'RESOLVED').length;
  const overdueCount = queries.filter(q => q.status === 'OVERDUE').length;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const filteredQueries = useMemo(() => {
    return queries.filter(q => {
      const matchesSearch = 
        q.referenceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.assignedOfficer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = statusTab === 'ALL' || q.status === statusTab;
      const matchesCategory = categoryFilter === 'ALL' || q.category === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [queries, searchQuery, statusTab, categoryFilter]);

  const handleSendResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedQuery) return;

    const newResponse = {
      author: 'Sicelo Sakhile Mkhize',
      role: 'Chief Director: Oversight',
      date: 'Today',
      content: replyText.trim()
    };

    const updated = queries.map(q => {
      if (q.id === selectedQuery.id) {
        const nextStatus = q.status === 'OPEN' ? ('IN_PROGRESS' as const) : q.status;
        return {
          ...q,
          status: nextStatus,
          responsesCount: q.responsesCount + 1,
          lastResponseDate: 'Today',
          responses: [...q.responses, newResponse]
        };
      }
      return q;
    });

    setQueries(updated);
    setSelectedQuery(prev => prev ? {
      ...prev,
      status: prev.status === 'OPEN' ? 'IN_PROGRESS' : prev.status,
      responsesCount: prev.responsesCount + 1,
      lastResponseDate: 'Today',
      responses: [...prev.responses, newResponse]
    } : null);

    setReplyText('');
    showToast(`Response recorded and notification dispatched to ${selectedQuery.entityName}.`);
  };

  const handleMarkResolved = (queryId: string) => {
    const updated = queries.map(q => {
      if (q.id === queryId) {
        return { ...q, status: 'RESOLVED' as const };
      }
      return q;
    });
    setQueries(updated);
    if (selectedQuery && selectedQuery.id === queryId) {
      setSelectedQuery({ ...selectedQuery, status: 'RESOLVED' });
    }
    showToast('Query successfully marked as RESOLVED.');
  };

  const handleCreateQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim() || !newDescription.trim()) return;

    const targetEntity = entities.find(e => e.id === newEntityId) || entities[0];
    const newRef = `DSAC-QRY-2026/${Math.floor(100 + Math.random() * 900)}`;

    const newRec: QueryRecord = {
      id: `qry-${Date.now()}`,
      referenceNumber: newRef,
      entityId: targetEntity.id,
      entityName: targetEntity.name,
      category: newCategory,
      subject: newSubject.trim(),
      description: newDescription.trim(),
      priority: newPriority,
      status: 'OPEN',
      dateCreated: 'Today',
      dueDate: newDueDate,
      assignedOfficer: 'Sicelo Sakhile Mkhize',
      responsesCount: 0,
      responses: []
    };

    setQueries([newRec, ...queries]);
    setSelectedQuery(newRec);
    setIsNewQueryModalOpen(false);
    setNewSubject('');
    setNewDescription('');
    showToast(`Official Query ${newRef} dispatched to Accounting Officer of ${targetEntity.shortCode}.`);
  };

  return (
    <div id="dsac-queries-container" className="space-y-4 w-full">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="bg-emerald-900 text-emerald-100 px-4 py-3 rounded-xl border border-emerald-700 shadow-md flex items-center justify-between animate-fadeIn">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Banner */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                <HelpCircle className="w-5 h-5" />
              </span>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">
                Queries &amp; Information Request Management
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              PFMA Section 38 statutory inquiries, Parliamentary questions, Auditor-General findings, and Entity subsidy notices across 32 institutions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="btn-new-query"
              onClick={() => setIsNewQueryModalOpen(true)}
              className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold flex items-center gap-2 shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Issue Formal Query</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Metrics (The standard user pattern: [ Open ] [ In Progress ] [ Resolved ] [ Overdue ]) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
          <div 
            onClick={() => setStatusTab('OPEN')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              statusTab === 'OPEN' ? 'bg-amber-50 border-amber-300 ring-1 ring-amber-400' : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">Open Inquiries</span>
              <span className="w-2 h-2 rounded-full bg-amber-500" />
            </div>
            <div className="text-2xl font-black text-amber-700 mt-1">{openCount}</div>
            <div className="text-[10px] text-slate-500">Awaiting initial reply</div>
          </div>

          <div 
            onClick={() => setStatusTab('IN_PROGRESS')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              statusTab === 'IN_PROGRESS' ? 'bg-sky-50 border-sky-300 ring-1 ring-sky-400' : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-600">In Progress</span>
              <span className="w-2 h-2 rounded-full bg-sky-500" />
            </div>
            <div className="text-2xl font-black text-sky-700 mt-1">{inProgressCount}</div>
            <div className="text-[10px] text-slate-500">Under review &amp; drafting</div>
          </div>

          <div 
            onClick={() => setStatusTab('RESOLVED')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              statusTab === 'RESOLVED' ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-400' : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-800">Resolved</span>
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
            </div>
            <div className="text-2xl font-black text-emerald-700 mt-1">{resolvedCount}</div>
            <div className="text-[10px] text-emerald-600">Completed &amp; archived</div>
          </div>

          <div 
            onClick={() => setStatusTab('OVERDUE')}
            className={`p-3 rounded-lg border cursor-pointer transition-all ${
              statusTab === 'OVERDUE' ? 'bg-rose-50 border-rose-300 ring-1 ring-rose-400' : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-rose-800">Overdue</span>
              <span className="w-2 h-2 rounded-full bg-rose-500" />
            </div>
            <div className="text-2xl font-black text-rose-700 mt-1">{overdueCount}</div>
            <div className="text-[10px] text-rose-600">Exceeded statutory deadline</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by reference, entity, subject, officer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Tabs */}
          <div className="flex rounded-lg bg-slate-100 p-0.5 border border-slate-200 text-xs">
            {(['ALL', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'OVERDUE'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setStatusTab(tab)}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusTab === tab
                    ? 'bg-white text-emerald-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab === 'ALL' ? 'All Queries' : tab.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="text-xs py-1.5 px-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="ALL">All Categories</option>
            <option value="Parliamentary Question">Parliamentary Questions</option>
            <option value="PFMA Compliance Clarification">PFMA Clarifications</option>
            <option value="Audit Query">Audit Queries</option>
            <option value="Grant & Subsidy Query">Grant &amp; Subsidies</option>
            <option value="Public Information Request">Public Requests</option>
          </select>
        </div>
      </div>

      {/* FULL-WIDTH MASTER & DETAIL WORKSPACE */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT COLUMN: Queries Table / List (7 cols on lg) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-3 shadow-xs flex flex-col h-[680px]">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Statutory Queries ({filteredQueries.length})
            </span>
            <span className="text-[11px] text-slate-400 font-medium">Click to inspect and draft responses</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {filteredQueries.length === 0 ? (
              <div className="text-center py-16 text-slate-400">
                <HelpCircle className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-sm font-semibold">No queries match the selected filters</p>
                <p className="text-xs text-slate-400 mt-0.5">Try resetting search or status filters</p>
              </div>
            ) : (
              filteredQueries.map(item => {
                const isSelected = selectedQuery?.id === item.id;
                return (
                  <div
                    key={item.id}
                    id={`query-item-${item.id}`}
                    onClick={() => setSelectedQuery(item)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                      isSelected
                        ? 'bg-emerald-50/90 border-emerald-600 shadow-xs ring-1 ring-emerald-400/40'
                        : 'bg-white hover:bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-100/80 px-2 py-0.5 rounded">
                            {item.referenceNumber}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.priority === 'CRITICAL' ? 'bg-rose-100 text-rose-800' :
                            item.priority === 'HIGH' ? 'bg-amber-100 text-amber-800' :
                            'bg-slate-100 text-slate-700'
                          }`}>
                            {item.priority}
                          </span>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                            item.status === 'RESOLVED' ? 'bg-emerald-100 text-emerald-800' :
                            item.status === 'OVERDUE' ? 'bg-rose-100 text-rose-800' :
                            item.status === 'IN_PROGRESS' ? 'bg-sky-100 text-sky-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {item.status.replace('_', ' ')}
                          </span>
                        </div>
                        <h4 className="font-bold text-xs text-slate-900 mt-1.5 line-clamp-1">
                          {item.subject}
                        </h4>
                        <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                          <span className="flex items-center gap-1 font-medium truncate">
                            <Building2 className="w-3 h-3 text-slate-400 shrink-0" />
                            {item.entityName}
                          </span>
                          <span className="flex items-center gap-1 shrink-0 text-slate-400">
                            <Calendar className="w-3 h-3" />
                            Due {item.dueDate}
                          </span>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-1 rounded-full flex items-center gap-1">
                          <MessageSquare className="w-3 h-3" />
                          {item.responsesCount}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Query Detail & Response Workspace (5 cols on lg) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-4 sm:p-5 shadow-xs flex flex-col h-[680px]">
          {selectedQuery ? (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Header */}
              <div className="pb-3 border-b border-slate-100 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
                    {selectedQuery.referenceNumber}
                  </span>
                  <div className="flex items-center gap-1.5">
                    {selectedQuery.status !== 'RESOLVED' && (
                      <button
                        onClick={() => handleMarkResolved(selectedQuery.id)}
                        className="px-2.5 py-1 rounded text-xs font-semibold bg-emerald-100 hover:bg-emerald-200 text-emerald-800 flex items-center gap-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Resolve</span>
                      </button>
                    )}
                    {onOpenWorkspace && (
                      <button
                        onClick={() => onOpenWorkspace(selectedQuery.entityId)}
                        className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        title="Open Entity Workspace"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                <h3 className="text-sm font-black text-slate-900 mt-2 leading-snug">
                  {selectedQuery.subject}
                </h3>

                <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-600">
                  <span className="font-semibold text-slate-800">{selectedQuery.entityName}</span>
                  <span>•</span>
                  <span className="text-slate-500">Category: {selectedQuery.category}</span>
                  <span>•</span>
                  <span className="text-slate-500">Officer: {selectedQuery.assignedOfficer}</span>
                </div>
              </div>

              {/* Body / Description & History */}
              <div className="flex-1 overflow-y-auto py-3 space-y-3 custom-scrollbar pr-1">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                  <div className="font-bold text-[11px] text-slate-500 uppercase tracking-wider mb-1">
                    Inquiry Statement
                  </div>
                  {selectedQuery.description}
                </div>

                {/* Response History */}
                <div className="space-y-2.5 pt-2">
                  <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                    <span>Audit Dialogue &amp; Responses ({selectedQuery.responses.length})</span>
                    <span className="text-emerald-700 font-medium">Sec. 38 PFMA Grounded</span>
                  </div>

                  {selectedQuery.responses.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                      No official responses recorded yet. Dispatch a reply below.
                    </div>
                  ) : (
                    selectedQuery.responses.map((resp, idx) => (
                      <div key={idx} className="p-3 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-bold text-slate-900">{resp.author}</span>
                          <span className="text-slate-400 font-medium">{resp.date}</span>
                        </div>
                        <div className="text-[10px] text-emerald-800 font-semibold">{resp.role}</div>
                        <p className="text-slate-700 mt-1 leading-relaxed">{resp.content}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Reply Formulation Box */}
              <form onSubmit={handleSendResponse} className="pt-3 border-t border-slate-100 shrink-0 space-y-2">
                <div className="relative">
                  <textarea
                    rows={3}
                    placeholder="Type official departmental directive or clarification response..."
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    className="w-full p-2.5 text-xs rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-600 resize-none"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    Attaches to statutory dossier
                  </span>
                  <button
                    type="submit"
                    disabled={!replyText.trim()}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Dispatch Response</span>
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400">
              <MessageSquare className="w-12 h-12 text-slate-300 mb-2" />
              <p className="text-sm font-bold text-slate-700">No Query Selected</p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Select an inquiry from the list on the left to inspect facts, read annexures, and issue official directives.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* CREATE NEW FORMAL QUERY MODAL */}
      {isNewQueryModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full p-6 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <h3 className="text-base font-black text-slate-900">
                  Issue Statutory Query / Information Request
                </h3>
              </div>
              <button
                onClick={() => setIsNewQueryModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateQuery} className="space-y-3.5 mt-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Target Entity / Institution</label>
                <select
                  value={newEntityId}
                  onChange={(e) => setNewEntityId(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                >
                  {entities.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.name} ({e.shortCode}) — {e.type === 'PUBLIC_ENTITY' ? 'Public Entity' : 'NPO'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Inquiry Category</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="Parliamentary Question">Parliamentary Question</option>
                    <option value="PFMA Compliance Clarification">PFMA Compliance Clarification</option>
                    <option value="Audit Query">Audit Query</option>
                    <option value="Grant & Subsidy Query">Grant &amp; Subsidy Query</option>
                    <option value="Public Information Request">Public Information Request</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Statutory Priority</label>
                  <select
                    value={newPriority}
                    onChange={(e) => setNewPriority(e.target.value as any)}
                    className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-medium focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="CRITICAL">Critical (48hr turnaround)</option>
                    <option value="HIGH">High (5-day deadline)</option>
                    <option value="MEDIUM">Medium (10-day turnaround)</option>
                    <option value="LOW">Low (Routine)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Subject / Question Summary</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Audit Finding Clarification: Q2 Asset Register Discrepancy"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Detailed Inquiry Specification</label>
                <textarea
                  rows={4}
                  required
                  placeholder="State the legal basis, required evidence documents, and accounting officer instructions..."
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Statutory Due Date</label>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="w-full p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewQueryModalOpen(false)}
                  className="px-3.5 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold flex items-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Transmit Query</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
