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
  AlertCircle
} from 'lucide-react';
import { store } from '../services/store';
import { EntityDocument, DocumentCategory } from '../types';

export const DocumentRepositoryView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedDoc, setSelectedDoc] = useState<EntityDocument | null>(null);

  const documents = store.documents;

  const filteredDocs = documents.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          d.entityName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCat = selectedCategory === 'ALL' || d.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200 w-fit">
              Departmental Digital Archives
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 font-['Cabinet_Grotesk'] tracking-tight">
              Statutory Document Repository & Version Vault
            </h1>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Centralised repository for Strategic Plans, Annual Performance Plans (APPs), Operational Plans, Quarterly Reports, and Financial Returns across all entities.
            </p>
          </div>

          <div className="text-xs font-mono bg-slate-100 p-2.5 rounded-lg border border-slate-200">
            <span>Total Vault Items: </span>
            <strong className="text-slate-900">{documents.length} Files</strong>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-6 pt-6 border-t border-slate-100 text-xs">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search document title or entity..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            />
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full py-2.5 px-3 rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
            >
              <option value="ALL">All Statutory Categories</option>
              <option value="STRATEGIC_PLAN">Strategic Plans (5-Year)</option>
              <option value="ANNUAL_PERFORMANCE_PLAN">Annual Performance Plans (APP)</option>
              <option value="OPERATIONAL_PLAN">Operational Plans</option>
              <option value="QUARTERLY_REPORT">Quarterly Performance Reports</option>
              <option value="PORTFOLIO_OF_EVIDENCE">Portfolios of Evidence (PoE)</option>
              <option value="FINANCIAL_REPORT">Audited Financial Statements</option>
            </select>
          </div>
        </div>
      </div>

      {/* Document Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredDocs.map(doc => (
          <div 
            key={doc.id}
            className="bg-white rounded-xl border border-slate-200 hover:border-slate-300 p-5 shadow-sm space-y-3"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {doc.category.replace(/_/g, ' ')}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-0.5">{doc.title}</h3>
                  <div className="text-xs text-slate-600 mt-0.5 font-medium">
                    Entity: <strong className="text-slate-800">{doc.entityName}</strong>
                  </div>
                </div>
              </div>

              <span className="px-2 py-0.5 bg-slate-900 text-white font-mono text-[10px] font-bold rounded">
                v{doc.currentVersion}
              </span>
            </div>

            <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-500">
              <span>Financial Period: <strong className="text-slate-800">{doc.financialYear}</strong></span>
              <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                doc.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {doc.approvalStatus.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Version Ledger Breakdown */}
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1">
              <div className="font-semibold text-slate-700 flex items-center gap-1">
                <History className="w-3.5 h-3.5 text-slate-500" />
                <span>Version History ({doc.versions.length} revisions)</span>
              </div>
              <div className="space-y-1 mt-1.5">
                {doc.versions.map(ver => (
                  <div key={ver.versionNumber} className="text-[11px] text-slate-600 flex justify-between">
                    <span>v{ver.versionNumber}: {ver.fileName}</span>
                    <span className="font-mono text-slate-400">{new Date(ver.uploadedAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
