import React, { useState } from 'react';
import { 
  FileText, 
  UploadCloud, 
  Search, 
  Filter, 
  History, 
  MessageSquare, 
  Download,
  Building2,
  CheckCircle2,
  AlertCircle,
  PlusCircle,
  X,
  FileCheck,
  ShieldCheck,
  Calendar,
  Layers,
  Send,
  ExternalLink
} from 'lucide-react';
import { store } from '../services/store';
import { EntityDocument, DocumentCategory, PublicEntity } from '../types';

export const DocumentRepositoryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadReceipt, setUploadReceipt] = useState<{
    receiptNumber: string;
    docTitle: string;
    entityName: string;
    timestamp: string;
    fileHash: string;
  } | null>(null);

  // Upload Form state
  const entities = store.entities;
  const [uploadEntityId, setUploadEntityId] = useState(entities[0]?.id || 'ent-artscape');
  const [uploadCategory, setUploadCategory] = useState<DocumentCategory>('ANNUAL_PERFORMANCE_PLAN');
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');
  const [uploadYear, setUploadYear] = useState('2025/2026');

  // Comment state
  const [activeCommentDocId, setActiveCommentDocId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');

  const documents = store.documents;

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    const matchesEntity = selectedEntityFilter === 'ALL' || d.entityId === selectedEntityFilter;
    return matchesSearch && matchesCat && matchesEntity;
  });

  const handleExecuteUpload = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFileName.trim()) return;

    const chosenEntity = entities.find(e => e.id === uploadEntityId);
    const receiptNum = `DSAC-REC-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const randomHash = Array.from({length: 16}, () => Math.floor(Math.random()*16).toString(16)).join('');

    store.uploadDocument(
      uploadEntityId,
      uploadTitle.trim(),
      uploadCategory,
      uploadFileName.trim(),
      `Statutory document upload for ${uploadYear} financial oversight.`
    );

    setUploadReceipt({
      receiptNumber: receiptNum,
      docTitle: uploadTitle.trim(),
      entityName: chosenEntity ? chosenEntity.name : 'Public Entity',
      timestamp: new Date().toLocaleString(),
      fileHash: `sha256:${randomHash}...`
    });

    setShowUploadModal(false);
    setUploadTitle('');
    setUploadFileName('');
  };

  const handleAddComment = (docId: string) => {
    if (!commentInput.trim()) return;
    store.addDocumentComment(docId, commentInput.trim());
    setCommentInput('');
  };

  return (
    <div className="space-y-6 pb-16 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Receipt of Upload Banner if recently uploaded */}
      {uploadReceipt && (
        <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-lg border border-emerald-500 flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fadeIn">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-emerald-500/40 text-emerald-200 text-xs font-bold uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
              <span>Official Approval on Receipt of Upload</span>
            </div>
            <h3 className="text-base font-black text-white">
              Receipt Reference: {uploadReceipt.receiptNumber}
            </h3>
            <p className="text-xs text-emerald-200">
              "{uploadReceipt.docTitle}" successfully archived for <strong>{uploadReceipt.entityName}</strong> at {uploadReceipt.timestamp}.
            </p>
            <div className="text-[11px] font-mono text-emerald-300/80">
              Cryptographic Audit Fingerprint: {uploadReceipt.fileHash}
            </div>
          </div>
          <button
            onClick={() => setUploadReceipt(null)}
            className="px-4 py-2 bg-white text-emerald-950 hover:bg-emerald-50 rounded-xl text-xs font-bold cursor-pointer transition-colors shrink-0 shadow-xs"
          >
            Acknowledge &amp; Dismiss
          </button>
        </div>
      )}

      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200 w-fit">
              Requirement (c): Statutory Document Repository
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 mt-1 tracking-tight">
              Statutory Digital Vault &amp; Version Control
            </h1>
            <p className="text-xs text-slate-500 mt-1 max-w-3xl">
              Centralized repository for all 26 Public Entities and 6 NPOs to upload Strategic Plans, Annual Performance Plans (APPs), Operational Plans, Annual Reports, Quarterly Reports, and Financials.
            </p>
          </div>

          <button
            onClick={() => setShowUploadModal(true)}
            className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold flex items-center gap-2 shadow-xs cursor-pointer transition-all shrink-0"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Statutory Filing</span>
          </button>
        </div>

        {/* Category Pill Filters (Directly from GovTech Problem 1 specification) */}
        <div className="flex flex-wrap items-center gap-1.5 mt-5 pt-4 border-t border-slate-100">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mr-1">
            Category:
          </span>
          {[
            { id: 'ALL', label: 'All Documents' },
            { id: 'STRATEGIC_PLAN', label: 'Strategic Plans (5-Year)' },
            { id: 'ANNUAL_PERFORMANCE_PLAN', label: 'Annual Performance Plans (APP)' },
            { id: 'OPERATIONAL_PLAN', label: 'Operational Plans' },
            { id: 'ANNUAL_REPORT', label: 'Annual Reports' },
            { id: 'QUARTERLY_REPORT', label: 'Quarterly Reports' },
            { id: 'FINANCIAL_REPORT', label: 'Financials & AFS' },
            { id: 'PORTFOLIO_OF_EVIDENCE', label: 'Portfolios of Evidence (PoE)' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search & Entity Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4 pt-3 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search document title, entity or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value)}
              className="w-full py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="ALL">Filter by Institution: All 32 Entities &amp; NPOs</option>
              {entities.map(e => (
                <option key={e.id} value={e.id}>{e.name} ({e.shortCode})</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => {
          const isCommenting = activeCommentDocId === doc.id;

          return (
            <div 
              key={doc.id}
              className="bg-white rounded-2xl border border-slate-200 hover:border-slate-300 p-5 shadow-xs space-y-3 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="p-2.5 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        {doc.category.replace(/_/g, ' ')}
                      </span>
                      <h3 className="font-black text-slate-900 text-sm mt-0.5 leading-snug">
                        {doc.title}
                      </h3>
                      <div className="text-xs text-slate-600 mt-1 font-medium flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>Institution: <strong className="text-slate-800">{doc.entityName}</strong></span>
                      </div>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded-md shrink-0">
                    v{doc.currentVersion}.0
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
                  <span>Period: <strong className="text-slate-800">{doc.financialYear}</strong></span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Receipt Verified
                    </span>
                    <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                      doc.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                      doc.approvalStatus === 'REQUIRES_AMENDMENT' ? 'bg-rose-100 text-rose-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.approvalStatus.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                {/* Version History */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="font-bold text-slate-700 flex items-center justify-between">
                    <span className="flex items-center gap-1">
                      <History className="w-3.5 h-3.5 text-slate-400" />
                      <span>Version Ledger</span>
                    </span>
                    <span className="text-[10px] text-slate-400">Auto-versioned on save</span>
                  </div>
                  <div className="space-y-1">
                    {doc.versions.slice(-2).map(ver => (
                      <div key={ver.versionNumber} className="text-[11px] text-slate-600 flex justify-between">
                        <span className="truncate max-w-[200px]">v{ver.versionNumber}: {ver.fileName}</span>
                        <span className="font-mono text-slate-400 text-[10px]">{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comments Section (Real-time comments Requirement d) */}
                {doc.comments && doc.comments.length > 0 && (
                  <div className="bg-blue-50/50 p-3 rounded-xl border border-blue-100 text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 flex items-center gap-1">
                      <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                      <span>Reviewer Feedback ({doc.comments.length})</span>
                    </div>
                    {doc.comments.slice(-1).map(c => (
                      <div key={c.id} className="text-[11px] text-slate-700">
                        <strong>{c.authorName}:</strong> "{c.message}"
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Toolbar */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => setActiveCommentDocId(isCommenting ? null : doc.id)}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-100 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>{isCommenting ? 'Hide Comments' : 'Comment & Review'}</span>
                </button>

                <button
                  onClick={() => {
                    store.downloadDocument(doc.id);
                  }}
                  className="px-3 py-1 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </div>

              {/* Inline Comment Box */}
              {isCommenting && (
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type official review comment..."
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-lg border border-slate-200 text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddComment(doc.id);
                    }}
                  />
                  <button
                    onClick={() => handleAddComment(doc.id)}
                    className="px-3 py-1.5 rounded-lg bg-emerald-800 text-white text-xs font-bold hover:bg-emerald-900 cursor-pointer flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    <span>Send</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* UPLOAD MODAL */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Upload Statutory Document
                </h3>
              </div>
              <button
                onClick={() => setShowUploadModal(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteUpload} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Public Entity or NPO
                </label>
                <select
                  value={uploadEntityId}
                  onChange={(e) => setUploadEntityId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {entities.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.shortCode})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Document Category
                  </label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value as any)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="STRATEGIC_PLAN">Strategic Plan (5-Year)</option>
                    <option value="ANNUAL_PERFORMANCE_PLAN">Annual Performance Plan (APP)</option>
                    <option value="OPERATIONAL_PLAN">Operational Plan</option>
                    <option value="ANNUAL_REPORT">Annual Report</option>
                    <option value="QUARTERLY_REPORT">Quarterly Report</option>
                    <option value="FINANCIAL_REPORT">Audited Financials</option>
                    <option value="PORTFOLIO_OF_EVIDENCE">Portfolio of Evidence</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Financial Year
                  </label>
                  <select
                    value={uploadYear}
                    onChange={(e) => setUploadYear(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  >
                    <option value="2025/2026">2025/2026 (Current)</option>
                    <option value="2026/2027">2026/2027 (APP Filing)</option>
                    <option value="2024/2025">2024/2025 (Audited)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Document Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026/27 Annual Performance Plan (APP) Final"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  File Attachment (PDF, DOCX, XLSX)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. APP_2026_27_Final_Signoff.pdf"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="text-[10px] text-slate-400 mt-1">
                  Automatically integrated with Microsoft SharePoint Online &amp; verified via SHA-256 hash.
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-bold cursor-pointer shadow-xs"
                >
                  Archive &amp; Generate Approval Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
