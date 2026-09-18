import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  PlusCircle, 
  Search, 
  Filter, 
  ArrowRight, 
  Check,
  Building2,
  ShieldCheck,
  User,
  Send,
  ListTodo,
  FileCheck2,
  HandCoins,
  Coins,
  MessageSquare,
  HelpCircle,
  X
} from 'lucide-react';
import { store } from '../services/store';
import { CorrectiveTask, SupportRequest, SupportRequestStatus } from '../types';
import { formatZAR } from '../services/financialService';

interface TaskManagementViewProps {
  initialSubtab?: 'directives' | 'tasks' | 'approvals' | 'support_requests';
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({
  initialSubtab = 'directives'
}) => {
  const [activeTab, setActiveTab] = useState<'directives' | 'support_requests'>(
    initialSubtab === 'support_requests' ? 'support_requests' : 'directives'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Support request review modal
  const [reviewingRequest, setReviewingRequest] = useState<SupportRequest | null>(null);
  const [reviewDecision, setReviewDecision] = useState<SupportRequestStatus>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');

  // New task form state
  const [taskEntityId, setTaskEntityId] = useState(store.entities[0].id);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskPriority, setTaskPriority] = useState<CorrectiveTask['priority']>('HIGH');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskDirection, setTaskDirection] = useState<CorrectiveTask['direction']>('DSAC_TO_ENTITY');

  // Task resolution modal
  const [resolvingTask, setResolvingTask] = useState<CorrectiveTask | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');

  const tasks = store.tasks;
  const entities = store.entities;
  const supportRequests = store.getSupportRequests();

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredSupportRequests = supportRequests.filter(sr => {
    const matchesSearch = sr.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sr.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          sr.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || sr.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !taskAssignee) return;

    const ent = entities.find(e => e.id === taskEntityId);
    store.createTask({
      entityId: taskEntityId,
      entityName: ent ? ent.name : 'Unknown Entity',
      title: taskTitle,
      description: taskDesc || 'Follow up on performance milestone.',
      assignedToName: taskAssignee,
      priority: taskPriority,
      status: 'OPEN',
      dueDate: taskDueDate ? new Date(taskDueDate).toISOString() : new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      direction: taskDirection,
    });

    setShowCreateModal(false);
    setTaskTitle('');
    setTaskDesc('');
    setTaskAssignee('');
  };

  const handleResolveTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolvingTask || !resolutionNotes.trim()) return;

    store.resolveTask(resolvingTask.id, resolutionNotes.trim());
    setResolvingTask(null);
    setResolutionNotes('');
  };

  const handleReviewSupportRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewingRequest) return;

    store.reviewSupportRequest(reviewingRequest.id, reviewDecision, reviewNotes);
    setReviewingRequest(null);
    setReviewNotes('');
  };

  const openTasksCount = tasks.filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
  const pendingRequestsCount = supportRequests.filter(sr => sr.status === 'SUBMITTED' || sr.status === 'UNDER_REVIEW').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Title & Tabs */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 w-fit">
              Action-Oriented Governance &amp; Support
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              Directives, Tasks &amp; Support Requests
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Cross-portfolio action tracker: Monitor formal DSAC directives, institutional corrective milestones, and incoming support requests from entities.
            </p>
          </div>

          {activeTab === 'directives' && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Issue New Corrective Task</span>
            </button>
          )}
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-3 mt-6 pt-4 border-t border-slate-100">
          <button
            onClick={() => setActiveTab('directives')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'directives'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <ListTodo className="w-4 h-4" />
            <span>Corrective Directives &amp; Tasks</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'directives' ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {openTasksCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('support_requests')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'support_requests'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
            }`}
          >
            <HandCoins className="w-4 h-4" />
            <span>Institutional Support &amp; Funding Requests</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === 'support_requests' ? 'bg-amber-500 text-white' : 'bg-slate-200 text-slate-700'}`}>
              {pendingRequestsCount}
            </span>
          </button>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder={activeTab === 'directives' ? "Search directives by title, entity, or officer..." : "Search requests by entity, title, or category..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">All Statuses</option>
              {activeTab === 'directives' ? (
                <>
                  <option value="OPEN">Open Directives</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Resolved / Completed</option>
                  <option value="OVERDUE">Overdue Directives</option>
                </>
              ) : (
                <>
                  <option value="SUBMITTED">Newly Submitted</option>
                  <option value="UNDER_REVIEW">Under Review</option>
                  <option value="APPROVED">Approved</option>
                  <option value="MORE_INFO_REQUIRED">More Info Required</option>
                  <option value="REJECTED">Declined / Rejected</option>
                </>
              )}
            </select>
          </div>
        </div>
      </div>

      {/* VIEW: DIRECTIVES & TASKS */}
      {activeTab === 'directives' && (
        <div className="space-y-3">
          {filteredTasks.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              No directives found matching search filters.
            </div>
          ) : (
            filteredTasks.map(task => (
              <div
                key={task.id}
                className={`p-5 rounded-xl border bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all ${
                  task.status === 'COMPLETED'
                    ? 'border-slate-200 bg-slate-50/50'
                    : task.status === 'OVERDUE'
                    ? 'border-rose-300 bg-rose-50/30'
                    : 'border-slate-200 hover:border-emerald-300'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                      task.priority === 'CRITICAL'
                        ? 'bg-rose-600 text-white'
                        : task.priority === 'HIGH'
                        ? 'bg-amber-600 text-white'
                        : 'bg-blue-600 text-white'
                    }`}>
                      {task.priority} Priority
                    </span>

                    <span className="text-xs font-bold text-slate-900">
                      {task.entityName}
                    </span>

                    <span className="text-[11px] text-slate-400">
                      • {task.direction === 'DSAC_TO_ENTITY' ? 'DSAC National Directive' : 'Entity Internal Action'}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-sm">{task.title}</h3>
                  <p className="text-xs text-slate-600">{task.description}</p>

                  <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{task.assignedToName}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Due: {new Date(task.dueDate).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                    </div>

                    {task.completedAt && (
                      <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Completed: {new Date(task.completedAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-2">
                  {task.status !== 'COMPLETED' ? (
                    <button
                      onClick={() => {
                        setResolvingTask(task);
                        setResolutionNotes('');
                      }}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Mark Resolved</span>
                    </button>
                  ) : (
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 font-bold text-xs rounded-full flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Resolved</span>
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* VIEW: SUPPORT & FUNDING REQUESTS */}
      {activeTab === 'support_requests' && (
        <div className="space-y-3">
          {filteredSupportRequests.length === 0 ? (
            <div className="p-8 bg-white rounded-xl border border-slate-200 text-center text-slate-500 text-xs">
              No institutional support requests found matching search filters.
            </div>
          ) : (
            filteredSupportRequests.map(req => {
              const statusBadgeMap: Record<SupportRequestStatus, { label: string; bg: string }> = {
                SUBMITTED: { label: 'Submitted', bg: 'bg-blue-100 text-blue-800 border-blue-200' },
                UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-100 text-amber-800 border-amber-200' },
                APPROVED: { label: 'Approved', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
                MORE_INFORMATION_REQUIRED: { label: 'More Info Required', bg: 'bg-purple-100 text-purple-800 border-purple-200' },
                DECLINED: { label: 'Declined', bg: 'bg-rose-100 text-rose-800 border-rose-200' },
                COMPLETED: { label: 'Completed', bg: 'bg-teal-100 text-teal-800 border-teal-200' },
              };
              const statusBadge = statusBadgeMap[req.status] || { label: req.status, bg: 'bg-slate-100 text-slate-800 border-slate-200' };

              return (
                <div
                  key={req.id}
                  className="p-5 rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-emerald-300 transition-all"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${statusBadge.bg}`}>
                        {statusBadge.label}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {req.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs font-bold text-slate-900">
                        {req.entityName}
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-900 text-sm">{req.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{req.motivation}</p>

                    <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500 pt-1">
                      {req.amountRequested && (
                        <div className="flex items-center gap-1 font-bold text-emerald-800">
                          <Coins className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Amount: {formatZAR(req.amountRequested)}</span>
                        </div>
                      )}
                      {req.linkedProgramme && (
                        <div className="text-slate-500">
                          <span>Programme: <strong>{req.linkedProgramme}</strong></span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      </div>
                      {req.reviewedByName && (
                        <div className="flex items-center gap-1 text-slate-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Reviewer: {req.reviewedByName}</span>
                        </div>
                      )}
                    </div>

                    {req.reviewNotes && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
                        <span className="font-bold text-slate-900">Oversight Feedback:</span> {req.reviewNotes}
                      </div>
                    )}
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <button
                      onClick={() => {
                        setReviewingRequest(req);
                        setReviewDecision(req.status === 'SUBMITTED' ? 'UNDER_REVIEW' : req.status);
                        setReviewNotes(req.reviewNotes || '');
                      }}
                      className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors cursor-pointer"
                    >
                      Review &amp; Update
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* REVIEW SUPPORT REQUEST MODAL */}
      {reviewingRequest && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <HandCoins className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Review Support Request</h3>
                  <p className="text-[11px] text-slate-500">{reviewingRequest.entityName} • {reviewingRequest.category.replace(/_/g, ' ')}</p>
                </div>
              </div>
              <button onClick={() => setReviewingRequest(null)} className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReviewSupportRequest} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                <div className="font-bold text-slate-900">{reviewingRequest.title}</div>
                <div className="text-slate-600">{reviewingRequest.motivation}</div>
                {reviewingRequest.amountRequested && (
                  <div className="font-bold text-emerald-800 pt-1">
                    Requested: {formatZAR(reviewingRequest.amountRequested)}
                  </div>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Review Decision / Status</label>
                <select
                  value={reviewDecision}
                  onChange={(e) => setReviewDecision(e.target.value as SupportRequestStatus)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden font-bold"
                >
                  <option value="UNDER_REVIEW">Under Review (Assigned to Specialist)</option>
                  <option value="APPROVED">Approved (Grant / Assistance Granted)</option>
                  <option value="MORE_INFORMATION_REQUIRED">More Information Required (Return to Entity)</option>
                  <option value="DECLINED">Declined / Ineligible</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Official DSAC Directorial Remarks &amp; Conditions
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="State decision justification, conditions of support, or instructions for the entity..."
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReviewingRequest(null)}
                  className="px-3.5 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-bold shadow-xs cursor-pointer"
                >
                  Save Decision &amp; Notify Entity
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE TASK MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Issue Corrective Action Directive</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateTask} className="mt-4 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Target Public Entity / NPO</label>
                <select
                  value={taskEntityId}
                  onChange={(e) => setTaskEntityId(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                >
                  {entities.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.shortCode})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Title</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. Submit Remedial Grant Disbursement Plan"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Directive Description & Scope</label>
                <textarea
                  rows={3}
                  placeholder="Specify the remedial milestone, required evidence, and statutory deadline..."
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Assignee Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Reporting Officer / CEO"
                    value={taskAssignee}
                    onChange={(e) => setTaskAssignee(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Priority</label>
                  <select
                    value={taskPriority}
                    onChange={(e) => setTaskPriority(e.target.value as any)}
                    className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  >
                    <option value="CRITICAL">Critical</option>
                    <option value="HIGH">High</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="LOW">Low</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Statutory Completion Deadline</label>
                <input
                  type="date"
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow"
                >
                  Issue Directive
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RESOLVE TASK MODAL */}
      {resolvingTask && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Resolve Directive</h3>
              <button onClick={() => setResolvingTask(null)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">✕</button>
            </div>

            <form onSubmit={handleResolveTask} className="mt-4 space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div className="font-bold text-slate-800">{resolvingTask.title}</div>
                <div className="text-slate-600 mt-0.5">{resolvingTask.description}</div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Resolution Notes & Evidence Reference (Mandatory)
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Record the corrective action taken and evidence uploaded to the repository..."
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                ></textarea>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setResolvingTask(null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold shadow"
                >
                  Commit Resolution
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
