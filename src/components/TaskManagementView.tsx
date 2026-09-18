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
  FileCheck2
} from 'lucide-react';
import { store } from '../services/store';
import { CorrectiveTask } from '../types';

interface TaskManagementViewProps {
  initialSubtab?: 'directives' | 'tasks' | 'approvals';
}

export const TaskManagementView: React.FC<TaskManagementViewProps> = ({
  initialSubtab = 'directives'
}) => {
  const [activeTab, setActiveTab] = useState<'directives' | 'tasks' | 'approvals'>(initialSubtab);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [showCreateModal, setShowCreateModal] = useState(false);

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

  const filteredTasks = tasks.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.entityName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          t.assignedToName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'ALL' || t.status === selectedStatus;
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

  return (
    <div className="space-y-6 pb-12">
      {/* Title */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 w-fit">
              Action-Oriented Governance
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              Corrective Directives & Task Tracker
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              From Discovery to Action: Formal administrative directives issued from DSAC to entities, alongside internal operational tracking.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow transition-colors flex items-center gap-1.5"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Issue New Corrective Task</span>
          </button>
        </div>

        {/* Filter */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by directive title, entity, or officer..."
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
              <option value="ALL">All Directive Statuses</option>
              <option value="OPEN">Open Directives</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Resolved / Completed</option>
              <option value="OVERDUE">Overdue Directives</option>
            </select>
          </div>
        </div>
      </div>

      {/* Task Cards */}
      <div className="space-y-3">
        {filteredTasks.map(task => (
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

              <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-500 pt-1">
                <span>Assigned To: <strong className="text-slate-700">{task.assignedToName}</strong></span>
                <span>Due Date: <strong className="font-mono text-slate-700">{new Date(task.dueDate).toLocaleDateString()}</strong></span>
                <span>Created by: {task.createdByName}</span>
              </div>

              {task.resolutionNotes && (
                <div className="mt-2 p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-900">
                  <strong>Resolution:</strong> {task.resolutionNotes} (Resolved on {new Date(task.completedAt!).toLocaleDateString()})
                </div>
              )}
            </div>

            <div className="shrink-0">
              {task.status !== 'COMPLETED' ? (
                <button
                  onClick={() => {
                    setResolvingTask(task);
                    setResolutionNotes('');
                  }}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-sm transition-colors flex items-center gap-1.5"
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
        ))}
      </div>

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
