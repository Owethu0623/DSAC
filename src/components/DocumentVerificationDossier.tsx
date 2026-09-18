import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  ShieldCheck,
  History,
  FileCheck2,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { store } from '../services/store';
import {
  DocumentRequirement,
  ControlledDocumentStatus,
  DocumentRequirementSlot,
  EntityDocument
} from '../types';
import { DEMO_TEST_DOCUMENTS } from '../services/documentVerificationEngine';
import { downloadStatutoryDocument } from '../services/downloadHelper';

interface DocumentVerificationDossierProps {
  entityId: string;
  quarter?: 'Q1' | 'Q2' | 'Q3' | 'Q4';
  financialYear?: string;
  isDSACReviewer?: boolean;
  onNavigateToTask?: (taskId: string) => void;
}

export const DocumentVerificationDossier: React.FC<DocumentVerificationDossierProps> = ({
  entityId,
  quarter = 'Q3',
  financialYear = '2025/2026',
  isDSACReviewer = false,
}) => {
  const [, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const entity = store.entities.find(e => e.id === entityId) || store.entities[0];
  const checklist = store.getEntityDocumentChecklist(entity.id, quarter, financialYear);

  // Modals & Active Selections
  const [activeUploadReq, setActiveUploadReq] = useState<DocumentRequirement | null>(null);
  const [activeInspectDoc, setActiveInspectDoc] = useState<EntityDocument | null>(null);
  const [activeAdjudicateDoc, setActiveAdjudicateDoc] = useState<EntityDocument | null>(null);
  const [adjudicateDecision, setAdjudicateDecision] = useState<'VERIFIED' | 'REJECTED'>('VERIFIED');
  const [adjudicateNotes, setAdjudicateNotes] = useState('');
  const [expandedVersionsReqId, setExpandedVersionsReqId] = useState<string | null>(null);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [simulatedPayloadKey, setSimulatedPayloadKey] = useState<string>('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationResultPreview, setVerificationResultPreview] = useState<any | null>(null);
  const [auditNotes, setAuditNotes] = useState('');
  const [isReplacement, setIsReplacement] = useState(false);
  const [priorDocId, setPriorDocId] = useState<string | undefined>(undefined);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // Trigger real or simulated verification
  const handleRunVerification = async () => {
    if (!activeUploadReq) return;
    setIsVerifying(true);

    try {
      let fileToVerify: File | { name: string; size: number; content?: string };
      let simulatedContent: string | undefined = undefined;

      if (simulatedPayloadKey) {
        const payload = (DEMO_TEST_DOCUMENTS as any)[simulatedPayloadKey];
        if (payload) {
          fileToVerify = {
            name: payload.fileName,
            size: payload.size,
            content: payload.content,
          };
          simulatedContent = payload.content;
        } else {
          fileToVerify = selectedFile || { name: 'statutory_evidence.pdf', size: 1024 * 500 };
        }
      } else if (selectedFile) {
        fileToVerify = selectedFile;
      } else {
        alert('Please select a file or choose a preset test demonstration.');
        setIsVerifying(false);
        return;
      }

      // Run verification via store
      const response = await store.submitDocumentForRequirement({
        requirementId: activeUploadReq.id,
        entityId: entity.id,
        quarter,
        financialYear,
        file: fileToVerify,
        simulatedContent,
        changeSummary: auditNotes || (isReplacement ? 'Statutory replacement for rejected evidence' : 'Statutory submission under PFMA Section 38 audit verification.'),
      });

      setVerificationResultPreview(response.result);
      showNotification(
        response.result.status === 'VERIFIED'
          ? `Verified! "${response.document.fileName}" confirmed as authentic ${activeUploadReq.requiredDocumentType}.`
          : response.result.status === 'REJECTED'
          ? `Rejection Logged: "${response.document.fileName}" failed statutory validation. Remedial task generated.`
          : `Submitted: "${response.document.fileName}" queued for DSAC National manual review.`
      );
    } catch (err: any) {
      alert(`Verification error: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleManualReviewSubmit = () => {
    if (!activeAdjudicateDoc) return;
    if (!adjudicateNotes.trim()) {
      alert('Please provide official reviewer audit notes before finalizing adjudication.');
      return;
    }

    store.manualReviewDocument({
      docId: activeAdjudicateDoc.id,
      decision: adjudicateDecision,
      reviewerName: store.currentUser?.name || 'DSAC Reviewer',
      reviewerRole: store.currentUser?.role || 'DSAC_ADMIN',
      notes: adjudicateNotes.trim(),
    });

    showNotification(
      `Document "${activeAdjudicateDoc.fileName}" formally ${adjudicateDecision === 'VERIFIED' ? 'Approved & Verified' : 'Rejected'}.`
    );
    setActiveAdjudicateDoc(null);
    setAdjudicateNotes('');
  };

  const getStatusBadge = (status: ControlledDocumentStatus | 'MISSING') => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>VERIFIED</span>
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            <span>REJECTED</span>
          </span>
        );
      case 'MANUAL_REVIEW':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900 border border-amber-300">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            <span>MANUAL REVIEW</span>
          </span>
        );
      case 'MISSING':
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-300">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500" />
            <span>MISSING</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xl flex items-center justify-between gap-3 text-xs border border-slate-700">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="font-medium">{notificationMsg}</span>
          </div>
          <button onClick={() => setNotificationMsg(null)} className="text-slate-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Banner & Compliance Meter */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-700 uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4 text-indigo-600" />
              <span>PFMA Section 38 Statutory Evidence Dossier</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Document Submission &amp; Automated Verification
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-2xl">
              Strict document verification engine enforcing statutory matching between DSAC required document specifications and entity uploads. Disregards file names; enforces content integrity, ledger checks, and tamper-evident SHA-256 hashes.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                const firstReq = checklist.slots[0]?.requirement || store.documentRequirements[0];
                setActiveUploadReq(firstReq);
                setSimulatedPayloadKey('SAMPLE_VALID_BANK_STATEMENT');
                setVerificationResultPreview(null);
              }}
              className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 rounded-xl text-xs font-bold border border-indigo-200 transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Launch Verification Test Scenarios</span>
            </button>
          </div>
        </div>

        {/* Compliance Progress Bar & Metrics */}
        <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Statutory Slots</div>
            <div className="text-lg font-black text-slate-900 mt-0.5">{checklist.totalRequired} Required</div>
            <div className="text-[10px] text-slate-500">{quarter} {financialYear}</div>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
            <div className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Verified</div>
            <div className="text-lg font-black text-emerald-700 mt-0.5">{checklist.verifiedCount} of {checklist.totalRequired}</div>
            <div className="text-[10px] text-emerald-700 font-semibold">{checklist.compliancePercentage}% Compliant</div>
          </div>

          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <div className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Rejected</div>
            <div className="text-lg font-black text-rose-700 mt-0.5">{checklist.rejectedCount}</div>
            <div className="text-[10px] text-rose-700 font-semibold">Remedial Action Due</div>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <div className="text-[11px] font-bold text-amber-900 uppercase tracking-wider">Manual Review</div>
            <div className="text-lg font-black text-amber-800 mt-0.5">{checklist.pendingCount}</div>
            <div className="text-[10px] text-amber-800 font-semibold">DSAC Adjudication</div>
          </div>

          <div className="p-3 bg-slate-100 rounded-xl border border-slate-300">
            <div className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Missing Slots</div>
            <div className="text-lg font-black text-slate-800 mt-0.5">{checklist.missingCount}</div>
            <div className="text-[10px] text-slate-500">Unfulfilled Requirement</div>
          </div>
        </div>
      </div>

      {/* Statutory Document Requirements Checklist */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-indigo-600" />
            <span>Quarterly Statutory Evidence Requirements ({quarter} {financialYear})</span>
          </h3>
          <span className="text-xs text-slate-500 font-medium">
            Entity: <strong className="text-slate-800">{entity.name}</strong>
          </span>
        </div>

        <div className="space-y-3">
          {checklist.slots.map((slot: DocumentRequirementSlot) => {
            const req = slot.requirement;
            const doc: EntityDocument | undefined = slot.activeDocument;
            const isExpanded = expandedVersionsReqId === req.id;

            return (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition-all bg-white shadow-xs ${
                  slot.status === 'VERIFIED'
                    ? 'border-emerald-200 ring-1 ring-emerald-100'
                    : slot.status === 'REJECTED'
                    ? 'border-rose-300 ring-1 ring-rose-100'
                    : slot.status === 'MANUAL_REVIEW'
                    ? 'border-amber-300 ring-1 ring-amber-100'
                    : 'border-slate-300'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  {/* Left Column: Requirement Information */}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-[10px] font-bold px-2 py-0.5 bg-slate-100 text-slate-800 rounded border border-slate-200">
                        {req.code}
                      </span>
                      <h4 className="font-black text-slate-900 text-sm">{req.title}</h4>
                      {req.mandatory && (
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-red-50 text-red-700 rounded border border-red-200">
                          Mandatory
                        </span>
                      )}
                      {getStatusBadge(slot.status as any)}
                    </div>

                    <p className="text-xs text-slate-600">{req.description}</p>

                    {/* Expected Content Characteristics */}
                    <div className="pt-2 flex flex-wrap items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mr-1">
                        Expected Content Checks:
                      </span>
                      {req.expectedCharacteristics.map((char: string, idx: number) => (
                        <span
                          key={idx}
                          className="text-[10px] px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md border border-slate-200 font-medium"
                        >
                          ✓ {char}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right Column: Actions */}
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    {doc ? (
                      <>
                        <button
                          onClick={() => setActiveInspectDoc(doc)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-slate-600" />
                          <span>Inspect Report</span>
                        </button>

                        <button
                          onClick={() => downloadStatutoryDocument(doc.fileName || doc.title, doc.title, doc.category, entity.name)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5 text-slate-600" />
                          <span>Download</span>
                        </button>

                        {slot.status === 'REJECTED' && (
                          <button
                            onClick={() => {
                              setActiveUploadReq(req);
                              setIsReplacement(true);
                              setPriorDocId(doc.id);
                              setSimulatedPayloadKey('');
                              setVerificationResultPreview(null);
                            }}
                            className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                            <span>Replace with Valid Document</span>
                          </button>
                        )}

                        {isDSACReviewer && slot.status === 'MANUAL_REVIEW' && (
                          <button
                            onClick={() => {
                              setActiveAdjudicateDoc(doc);
                              setAdjudicateDecision('VERIFIED');
                              setAdjudicateNotes('');
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1"
                          >
                            <ShieldCheck className="w-3.5 h-3.5" />
                            <span>Adjudicate Review</span>
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          setActiveUploadReq(req);
                          setIsReplacement(false);
                          setPriorDocId(undefined);
                          setSimulatedPayloadKey('');
                          setVerificationResultPreview(null);
                        }}
                        className="px-3.5 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold transition-colors shadow-xs flex items-center gap-1.5"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>Upload Statutory Evidence</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Submitted Document Snapshot & Rejection / Review Alert */}
                {doc && (
                  <div className="mt-4 pt-3 border-t border-slate-100 text-xs space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                      <div className="flex items-center gap-2 min-w-0">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="font-bold text-slate-900 truncate">{doc.fileName || doc.title}</span>
                        <span className="text-[10px] text-slate-500">
                          ({doc.fileSize || '3.5 MB'})
                        </span>
                        <span className="font-mono text-[9px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-bold">
                          v{doc.currentVersion}
                        </span>
                        {doc.controlledType && (
                          <span className="font-mono text-[9px] bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded font-semibold">
                            Type: {doc.controlledType}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500">
                        {doc.activeVerification && (
                          <span>
                            Confidence: <strong className="text-slate-800">{Math.round(doc.activeVerification.confidence * 100)}%</strong>
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">
                          SHA: {doc.fileHash ? `${doc.fileHash.slice(0, 10)}...` : 'N/A'}
                        </span>
                        <button
                          onClick={() => setExpandedVersionsReqId(isExpanded ? null : req.id)}
                          className="font-semibold text-indigo-700 hover:text-indigo-900 flex items-center gap-1"
                        >
                          <History className="w-3 h-3" />
                          <span>Versions ({doc.versions?.length || 1})</span>
                          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>

                    {/* Prominent Alert for Rejection */}
                    {slot.status === 'REJECTED' && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-rose-900 flex items-center gap-1.5">
                          <XCircle className="w-4 h-4 text-rose-600" />
                          <span>Automated Verification Rejection Notice</span>
                        </div>
                        <p className="text-rose-800">
                          {(doc.activeVerification?.reasons && doc.activeVerification.reasons.join(' ')) || doc.verificationSummary || 'The uploaded file does not match the mandatory statutory criteria for this requirement slot.'}
                        </p>
                        <p className="text-[11px] text-rose-700 italic">
                          A remedial task has been logged for this entity. Please upload an authentic {req.requiredDocumentType} to restore compliance.
                        </p>
                      </div>
                    )}

                    {/* Alert for Manual Review */}
                    {slot.status === 'MANUAL_REVIEW' && (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs space-y-1">
                        <div className="font-bold text-amber-900 flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-amber-600" />
                          <span>Under DSAC National Reviewer Adjudication</span>
                        </div>
                        <p className="text-amber-800">
                          The document was flagged for manual review due to borderline confidence thresholds or contextual variations. A DSAC Governance Official will adjudicate the submission.
                        </p>
                      </div>
                    )}

                    {/* Version History Drawer */}
                    {isExpanded && doc.versions && doc.versions.length > 0 && (
                      <div className="p-3 bg-slate-100 rounded-xl border border-slate-200 space-y-2 mt-2">
                        <div className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                          Full Audit Version History (Immutable Audit Trail):
                        </div>
                        <div className="space-y-1.5">
                          {doc.versions.map((ver, idx: number) => (
                            <div
                              key={idx}
                              className="p-2 bg-white rounded-lg border border-slate-200 text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-1"
                            >
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                                  v{ver.versionNumber}
                                </span>
                                <span className="font-medium text-slate-900">{ver.fileName}</span>
                                <span className="text-slate-400">
                                  ({(ver.fileSizeBytes / (1024 * 1024)).toFixed(2)} MB)
                                </span>
                              </div>
                              <div className="text-slate-500 text-[10px]">
                                Uploaded on {new Date(ver.uploadedAt).toLocaleDateString()} by {ver.uploadedBy}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ================= MODAL: UPLOAD & VERIFY ================= */}
      {activeUploadReq && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                  <UploadCloud className="w-5 h-5 text-indigo-600" />
                  <span>
                    {isReplacement ? 'Replace Statutory Evidence' : 'Submit Statutory Evidence'}
                  </span>
                </h3>
                <p className="text-xs text-slate-500">
                  Target Slot: <strong className="text-slate-800">{activeUploadReq.title}</strong> ({activeUploadReq.code})
                </p>
              </div>
              <button
                onClick={() => {
                  setActiveUploadReq(null);
                  setVerificationResultPreview(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Requirement Details Pill */}
            <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-1">
              <div className="font-semibold text-indigo-900">Mandatory Document Criteria:</div>
              <div className="text-slate-700">{activeUploadReq.description}</div>
              <div className="text-[11px] text-indigo-800 font-medium">
                Target Type: <strong className="font-mono">{activeUploadReq.requiredDocumentType}</strong>
              </div>
            </div>

            {/* Simulation Preset Scenarios (for Instant Demo & Testing) */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Option A: Choose Pre-Configured Test Scenario (Instant Verification Demo)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setSimulatedPayloadKey('SAMPLE_INVOICE');
                    setSelectedFile(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    simulatedPayloadKey === 'SAMPLE_INVOICE'
                      ? 'border-rose-600 bg-rose-50/70 ring-1 ring-rose-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-rose-800 text-[11px]">Test A: Invoice disguised as Evidence</div>
                  <div className="text-[10px] text-slate-500">Supplier sound/lighting tax invoice (Expect: REJECTED)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimulatedPayloadKey('SAMPLE_VALID_BANK_STATEMENT');
                    setSelectedFile(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    simulatedPayloadKey === 'SAMPLE_VALID_BANK_STATEMENT'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-emerald-800 text-[11px]">Test B: Authentic Bank Statement</div>
                  <div className="text-[10px] text-slate-500">Absa Bank ledger with Q3 tranche &amp; Persal (Expect: VERIFIED)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimulatedPayloadKey('SAMPLE_VALID_POE');
                    setSelectedFile(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    simulatedPayloadKey === 'SAMPLE_VALID_POE'
                      ? 'border-emerald-600 bg-emerald-50/70 ring-1 ring-emerald-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-emerald-800 text-[11px]">Test C: Genuine Portfolio of Evidence</div>
                  <div className="text-[10px] text-slate-500">Signed attendee registers &amp; workshop logs (Expect: VERIFIED)</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSimulatedPayloadKey('SAMPLE_OUTDATED_BANK_STATEMENT');
                    setSelectedFile(null);
                  }}
                  className={`p-2.5 rounded-xl border text-left transition-all ${
                    simulatedPayloadKey === 'SAMPLE_OUTDATED_BANK_STATEMENT'
                      ? 'border-amber-600 bg-amber-50/70 ring-1 ring-amber-500'
                      : 'border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="font-bold text-amber-800 text-[11px]">Test D: Period Mismatch Evidence</div>
                  <div className="text-[10px] text-slate-500">Q1 2024 statement submitted for Q3 2025 (Expect: MANUAL REVIEW)</div>
                </button>
              </div>
            </div>

            {/* Option B: Real File Selector */}
            <div className="space-y-2">
              <label className="block font-bold text-slate-800 uppercase tracking-wider text-[10px]">
                Option B: Upload Custom Document File (.pdf, .docx, .xlsx)
              </label>
              <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/30 text-center relative hover:bg-indigo-50/60 transition-colors">
                <input
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) {
                      setSelectedFile(f);
                      setSimulatedPayloadKey('');
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-8 h-8 text-indigo-600 mx-auto" />
                <div className="font-bold text-slate-800 mt-1">
                  {selectedFile ? selectedFile.name : 'Click to select or drag & drop file here'}
                </div>
                <div className="text-[10px] text-slate-500">
                  {selectedFile
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for analysis`
                    : 'Maximum 50MB. Minimum 100 bytes.'}
                </div>
              </div>
            </div>

            {/* Audit Notes */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Executive Declaration &amp; Submission Notes
              </label>
              <textarea
                rows={2}
                value={auditNotes}
                onChange={(e) => setAuditNotes(e.target.value)}
                placeholder="Declare statutory authenticity under PFMA Section 38..."
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-hidden"
              />
            </div>

            {/* Verification Result Breakdown Preview */}
            {verificationResultPreview && (
              <div className="p-4 rounded-xl border space-y-2 bg-slate-50 border-slate-300">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900 text-xs">
                    Verification Outcome:
                  </div>
                  {getStatusBadge(verificationResultPreview.status)}
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] pt-1 border-t border-slate-200">
                  <div>
                    <span className="text-slate-500">Detected Type: </span>
                    <strong className="text-slate-800 font-mono">{verificationResultPreview.detectedDocumentType}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500">Confidence Score: </span>
                    <strong className="text-slate-800">{Math.round(verificationResultPreview.confidence * 100)}%</strong>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">SHA-256 Hash: </span>
                    <strong className="font-mono text-[10px] text-slate-800">{verificationResultPreview.fileValidation?.fileHash}</strong>
                  </div>
                </div>

                {verificationResultPreview.reasons && verificationResultPreview.reasons.length > 0 && (
                  <div className="pt-2 text-[11px]">
                    <div className="font-semibold text-slate-700">Diagnostic Findings:</div>
                    <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[10px] mt-1">
                      {verificationResultPreview.reasons.map((r: string, idx: number) => (
                        <li key={idx}>{r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setActiveUploadReq(null);
                  setVerificationResultPreview(null);
                }}
                className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isVerifying || (!selectedFile && !simulatedPayloadKey)}
                onClick={handleRunVerification}
                className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2"
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Running Verification Scan...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Execute Content Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: INSPECT REPORT ================= */}
      {activeInspectDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Eye className="w-4 h-4 text-indigo-600" />
                <span>Statutory Verification Dossier Report</span>
              </h3>
              <button onClick={() => setActiveInspectDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">File Name:</span>
                  <span className="font-bold text-slate-900">{activeInspectDoc.fileName || activeInspectDoc.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Statutory Status:</span>
                  {getStatusBadge(activeInspectDoc.verificationStatus || 'MISSING')}
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Controlled Classification:</span>
                  <span className="font-mono font-bold text-indigo-700">{activeInspectDoc.controlledType || 'PENDING'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Confidence Score:</span>
                  <span className="font-bold text-slate-800">
                    {activeInspectDoc.activeVerification ? `${Math.round(activeInspectDoc.activeVerification.confidence * 100)}%` : '90%'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Tamper-Proof SHA-256:</span>
                  <span className="font-mono text-[10px] text-slate-700">{activeInspectDoc.fileHash || 'N/A'}</span>
                </div>
              </div>

              {activeInspectDoc.activeVerification?.reasons && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="font-semibold text-slate-800 mb-1">Diagnostic Log &amp; Verification Trail:</div>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-600 text-[11px]">
                    {activeInspectDoc.activeVerification.reasons.map((r: string, idx: number) => (
                      <li key={idx}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                onClick={() => setActiveInspectDoc(null)}
                className="px-4 py-1.5 bg-slate-900 text-white rounded-lg font-bold"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: MANUAL REVIEW ADJUDICATION ================= */}
      {activeAdjudicateDoc && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>DSAC Oversight Manual Adjudication</span>
              </h3>
              <button onClick={() => setActiveAdjudicateDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 space-y-1">
              <div className="font-bold">Manual Decision Required</div>
              <div>
                Document "{activeAdjudicateDoc.fileName || activeAdjudicateDoc.title}" was escalated for manual review. As a DSAC Oversight Official, you have statutory authority under PFMA Section 38 to accept or reject this evidence.
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block font-bold text-slate-800 mb-1">Adjudication Ruling</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjudicateDecision('VERIFIED')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      adjudicateDecision === 'VERIFIED'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-2 ring-emerald-400'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Accept as Verified Evidence
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjudicateDecision('REJECTED')}
                    className={`p-3 rounded-xl border text-center font-bold transition-all ${
                      adjudicateDecision === 'REJECTED'
                        ? 'border-rose-600 bg-rose-50 text-rose-800 ring-2 ring-rose-400'
                        : 'border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Reject &amp; Issue Remedial Directive
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  Official Reviewer Notes / Justification (Mandatory)
                </label>
                <textarea
                  rows={3}
                  required
                  value={adjudicateNotes}
                  onChange={(e) => setAdjudicateNotes(e.target.value)}
                  placeholder="Record formal reasons for ruling in compliance with the Public Finance Management Act..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs focus:bg-white focus:outline-hidden"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveAdjudicateDoc(null)}
                className="px-3.5 py-1.5 border border-slate-300 rounded-xl text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleManualReviewSubmit}
                className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold rounded-xl shadow-xs"
              >
                Finalize Adjudication
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
