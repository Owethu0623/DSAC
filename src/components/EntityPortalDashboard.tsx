import React, { useState, useEffect, useMemo } from 'react';
import {
  Theater,
  Calendar,
  AlertCircle,
  Target,
  Coins,
  CheckCircle,
  Clock,
  CheckCircle2,
  XCircle,
  FileText,
  HandCoins,
  BarChart3,
  UploadCloud,
  Bell,
  ChevronDown,
  Building,
  Building2,
  ShieldCheck,
  ShieldAlert,
  FolderLock,
  MessageSquare,
  HelpCircle,
  Plus,
  ArrowRight,
  ExternalLink,
  User,
  Wallet,
  FileCheck,
  ChevronLeft,
  ChevronRight,
  X,
  Upload,
  Send,
  Download,
  FileCheck2,
  Briefcase,
  MapPin,
  Mail,
  Phone,
  Lock,
  Sparkles,
  Info,
  LogOut,
  Landmark,
  Trash2,
  Paperclip,
  Eye
} from 'lucide-react';
import { store } from '../services/store';
import { EntityDocument, FinancialQuarter } from '../types';
import { normalizeFinancialYear, normalizeQuarter } from '../services/calculationEngine';
import { kpiCumulativeThrough } from '../services/kpiProgress';
import { returnTotal } from '../services/financialService';
import {
  financialYearStart,
  getCurrentReportingPeriod,
  isFinancialYearClosed,
  sameFinancialYear,
  toLongFinancialYear
} from '../services/reportingPeriod';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';
import { downloadStatutoryDocument } from '../services/downloadHelper';
import { DocumentVerificationDossier } from './DocumentVerificationDossier';
import { EntityFinancialView } from './features/EntityFinancialView';
import { KpiProgressCard } from './shared/KpiProgressCard';
import { CaptureKpiActualModal } from './shared/CaptureKpiActualModal';
import { SupportRequestModal } from './shared/SupportRequestModal';
import { CaptureExpenditureModal } from './shared/CaptureExpenditureModal';
import { FinancialSummaryCard } from './shared/FinancialSummaryCard';
import { KPIRecord } from '../types';
import { formatZAR } from '../services/financialService';

interface EntityPortalDashboardProps {
  entityId?: string;
  onOpenWorkspace?: () => void;
  onNavigateToSection?: (section: string) => void;
  onLogout?: () => void;
}

export const EntityPortalDashboard: React.FC<EntityPortalDashboardProps> = ({
  entityId,
  onOpenWorkspace,
  onNavigateToSection,
  onLogout,
}) => {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const [activeSidebar, setActiveSidebar] = useState<string>('overview');
  const reportingPeriod = getCurrentReportingPeriod();
  const reportingFyLong = toLongFinancialYear(reportingPeriod.financialYear);
  const [selectedYear, setSelectedYear] = useState<string>(`${reportingPeriod.financialYear} Financial Year`);
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter | 'FULL_YEAR'>(reportingPeriod.quarter);

  // Financial years offered in the selectors: the current year and the two closed years before it.
  const portalYearOptions = [0, 1, 2].map(i => {
    const y = financialYearStart(reportingPeriod.financialYear) - i;
    return `${y}/${String((y + 1) % 100).padStart(2, '0')} Financial Year`;
  });
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [selectedKpiForCapture, setSelectedKpiForCapture] = useState<KPIRecord | null>(null);
  const [showExpenditureModal, setShowExpenditureModal] = useState<boolean>(false);
  const [showSupportModal, setShowSupportModal] = useState<boolean>(false);

  // Resolve current entity from store
  // An entity officer is locked to their own organisation: the portal cannot be pointed at another entity's data.
  // (DSAC officials keep the full switcher so they can preview any entity's portal.)
  const lockedEntityId = store.currentUser?.role === 'ENTITY_OFFICER' ? store.currentUser.entityId : undefined;
  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    return lockedEntityId || entityId || store.currentUser?.entityId || 'ent-sahra';
  });

  useEffect(() => {
    if (lockedEntityId) {
      setSelectedEntityId(lockedEntityId);
    } else if (entityId) {
      setSelectedEntityId(entityId);
    }
  }, [entityId, lockedEntityId]);

  const entity = store.entities.find(e => e.id === selectedEntityId) || store.entities.find(e => e.id === 'ent-sahra') || store.entities[0];
  const entityKPIs = store.kpis.filter(k => k.entityId === entity.id);
  const entityDocuments = store.documents.filter(d => d.entityId === entity.id);
  const entityReports = store.reports.filter(r => r.entityId === entity.id);

  // Performance Return Ingestion Stepper State (Entity Side)
  const [stepperStep, setStepperStep] = useState<1 | 2>(1);
  const [reportingQuarter, setReportingQuarter] = useState<string>(`${reportingPeriod.quarter} (${reportingFyLong} Financial Year)`);
  // Starts from what the entity has actually lodged for the quarter (its finance return), never an assumed figure.
  const lodgedSpendFor = (q: FinancialQuarter): number => {
    const ret = store.getQuarterlyFinancialSubmissionsForEntity(entity.id, reportingPeriod.financialYear).find(r => r.quarter === q);
    return ret ? returnTotal(ret) : 0;
  };
  const [spentThisQuarter, setSpentThisQuarter] = useState<number>(() => lodgedSpendFor(reportingPeriod.quarter));
  const [stepperKpiEntries, setStepperKpiEntries] = useState<Record<string, { actual: number; varianceReason: string; correctiveAction: string }>>({});
  const [stepperPoeDocId, setStepperPoeDocId] = useState<string>('');
  const [stepperAffirmed, setStepperAffirmed] = useState<boolean>(false);
  const [stepperSuccessMessage, setStepperSuccessMessage] = useState<string | null>(null);

  // Sync spentThisQuarter and KPI entries whenever entity changes
  useEffect(() => {
    setSpentThisQuarter(lodgedSpendFor(reportingPeriod.quarter));
    const initialEntries: Record<string, { actual: number; varianceReason: string; correctiveAction: string }> = {};
    entityKPIs.forEach(k => {
      // Starts from the year-to-date result already on record (nothing is assumed for any entity).
      initialEntries[k.id] = { actual: kpiCumulativeThrough(k, reportingPeriod.quarter).actual, varianceReason: '', correctiveAction: '' };
    });
    setStepperKpiEntries(initialEntries);
  }, [entity.id]);

  const handleStepperKpiChange = (kpiId: string, field: 'actual' | 'varianceReason' | 'correctiveAction', value: any) => {
    setStepperKpiEntries(prev => ({
      ...prev,
      [kpiId]: {
        ...prev[kpiId],
        [field]: value,
      }
    }));
  };

  const handleSubmitStepper = (e: React.FormEvent) => {
    e.preventDefault();
    if (!stepperAffirmed) return;

    const quarterCode = (reportingQuarter.includes('Q3') ? 'Q3' : reportingQuarter.includes('Q2') ? 'Q2' : reportingQuarter.includes('Q1') ? 'Q1' : 'Q4') as FinancialQuarter;
    const quarterPosition = ['Q1', 'Q2', 'Q3', 'Q4'].indexOf(quarterCode);

    // A result behind its target needs a genuine reason, not a canned sentence.
    const missingReason = entityKPIs.filter(kpi => {
      const entry = stepperKpiEntries[kpi.id];
      return !!entry && (Number(entry.actual) || 0) < kpiCumulativeThrough(kpi, quarterCode).target && !entry.varianceReason.trim();
    });
    if (missingReason.length > 0) {
      alert(`Please give a reason for the variance on: ${missingReason.map(k => k.name).join('; ')}`);
      return;
    }

    // Record every result through the single KPI path. The form collects the CUMULATIVE year-to-date result; the
    // store keeps each quarter's own result and derives the cumulative itself. (This form used to build report
    // items only and never updated the KPIs the dashboards read.)
    entityKPIs.forEach(kpi => {
      const entry = stepperKpiEntries[kpi.id];
      if (!entry) return;
      const cumulative = Number(entry.actual);
      if (!Number.isFinite(cumulative) || cumulative < 0) return;
      const earlier = [kpi.q1Actual, kpi.q2Actual, kpi.q3Actual, kpi.q4Actual]
        .slice(0, quarterPosition)
        .reduce<number>((sum, v) => sum + (v ?? 0), 0);
      store.updateKPIValue(kpi.id, Math.max(0, cumulative - earlier), entry.varianceReason || undefined, quarterCode, entry.correctiveAction || undefined);
    });

    const updatedItems = store.kpis.filter(k => k.entityId === entity.id).map(kpi => {
      const cumulative = kpiCumulativeThrough(kpi, quarterCode);
      const entry = stepperKpiEntries[kpi.id];
      return {
        id: `item-${kpi.id}-${Date.now()}`,
        kpiId: kpi.id,
        kpiName: kpi.name,
        targetToDate: cumulative.target,
        actualAchieved: cumulative.actual,
        unit: kpi.unitOfMeasure,
        status: kpi.status,
        variancePercentage: cumulative.target > 0 ? Math.round(((cumulative.actual - cumulative.target) / cumulative.target) * 1000) / 10 : 0,
        varianceReason: entry?.varianceReason || undefined,
        correctiveAction: entry?.correctiveAction || undefined,
      };
    });

    const existingReport = entityReports.find(r => r.quarter === quarterCode && sameFinancialYear(r.financialYear, reportingPeriod.financialYear));

    if (existingReport) {
      store.submitReport(existingReport.id, updatedItems, spentThisQuarter);
    } else {
      store.submitQuarterlyReport({
        entityId: entity.id,
        quarter: quarterCode,
        financialYear: reportingPeriod.financialYear,
        expenditureClaimedZAR: spentThisQuarter,
        declarationNotes: `${quarterCode} statutory performance return submitted with verified figures and Section 38(1)(j) sign-off.`,
        poeDocId: stepperPoeDocId || entityDocuments[0]?.id,
        items: updatedItems,
      });
    }

    setStepperSuccessMessage(`Quarterly Performance Return for ${entity.shortCode} submitted successfully to DSAC National.`);
    setActionSuccess(`Performance Return submitted to DSAC.`);
    setStepperStep(1);
    setTimeout(() => {
      setStepperSuccessMessage(null);
      setActionSuccess(null);
    }, 5000);
  };

  // Drag & Drop States
  const [isDraggingModal, setIsDraggingModal] = useState(false);
  const [isDraggingSection, setIsDraggingSection] = useState(false);

  // Document Upload Form State
  const [portalDocView, setPortalDocView] = useState<'verification' | 'repository'>('verification');
  const [uploadDocTitle, setUploadDocTitle] = useState('');
  const [uploadDocCategory, setUploadDocCategory] = useState<'PORTFOLIO_OF_EVIDENCE' | 'OPERATIONAL_PLAN' | 'FINANCIAL_REPORT' | 'ANNUAL_REPORT' | 'GOVERNANCE_CHARTER'>('PORTFOLIO_OF_EVIDENCE');
  const [uploadFileName, setUploadFileName] = useState('');
  const [selectedUploadFile, setSelectedUploadFile] = useState<File | null>(null);
  const [uploadFileSize, setUploadFileSize] = useState('4.2 MB');
  const [uploadSummary, setUploadSummary] = useState('');
  const [section38Confirmed, setSection38Confirmed] = useState(false);
  const [previewDocument, setPreviewDocument] = useState<EntityDocument | null>(null);

  // File selection & drag-and-drop helper
  const handleFileSelected = (file: File) => {
    setUploadFileName(file.name);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    if (!uploadDocTitle || uploadDocTitle === 'Section 38 Portfolio Evidence') {
      setUploadDocTitle(cleanName);
    }
    const bytes = file.size;
    const formattedSize = bytes < 1_000_000 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    setUploadFileSize(formattedSize);

    // Auto-detect category from filename
    const lower = file.name.toLowerCase();
    if (lower.includes('poe') || lower.includes('evidence') || lower.includes('register')) {
      setUploadDocCategory('PORTFOLIO_OF_EVIDENCE');
    } else if (lower.includes('tax') || lower.includes('sars') || lower.includes('bank') || lower.includes('financial')) {
      setUploadDocCategory('FINANCIAL_REPORT');
    } else if (lower.includes('board') || lower.includes('resolution') || lower.includes('governance')) {
      setUploadDocCategory('GOVERNANCE_CHARTER');
    } else if (lower.includes('audit') || lower.includes('afs') || lower.includes('annual')) {
      setUploadDocCategory('ANNUAL_REPORT');
    }
  };

  // Report Submission Form State
  const [reportQuarter, setReportQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>(reportingPeriod.quarter);
  const [reportExpenditure, setReportExpenditure] = useState('');
  const [reportPoeDocId, setReportPoeDocId] = useState('');
  const [reportDeclaration, setReportDeclaration] = useState('I hereby affirm that the programmatic targets and expenditure reported reflect verified records in accordance with PFMA Section 38.');
  const [fundingDraft, setFundingDraft] = useState(() => {
    try {
      const saved = window.localStorage.getItem(`dsac-funding-draft-${entity.id}`);
      return saved ? JSON.parse(saved) : {
        financialYear: reportingPeriod.financialYear,
        programme: '',
        purpose: '',
        lines: [
          { categoryId: 'PERSONNEL', categoryName: 'Employee / personnel costs', amount: 0 },
          { categoryId: 'PROGRAMME', categoryName: 'Programme / project costs', amount: 0 },
          { categoryId: 'TRAVEL', categoryName: 'Travel and subsistence', amount: 0 },
          { categoryId: 'ADMIN', categoryName: 'Administration / operating costs', amount: 0 },
          { categoryId: 'SERVICES', categoryName: 'Professional / contracted services', amount: 0 },
          { categoryId: 'CAPITAL', categoryName: 'Capital expenditure', amount: 0 },
          { categoryId: 'OTHER', categoryName: 'Other approved categories', amount: 0 },
        ],
      };
    } catch {
      return { financialYear: reportingPeriod.financialYear, programme: '', purpose: '', lines: [] };
    }
  });
  const fundingTotal = fundingDraft.lines.reduce((total: number, line: { amount: number }) => total + (Number(line.amount) || 0), 0);

  useEffect(() => {
    try {
      window.localStorage.setItem(`dsac-funding-draft-${entity.id}`, JSON.stringify(fundingDraft));
    } catch {
      // Draft persistence is best effort; submission remains store-backed.
    }
  }, [entity.id, fundingDraft]);

  const updateFundingLine = (categoryId: string, amount: string) => {
    setFundingDraft((draft: typeof fundingDraft) => ({
      ...draft,
      lines: draft.lines.map((line: { categoryId: string; amount: number }) =>
        line.categoryId === categoryId ? { ...line, amount: Math.max(0, Number(amount) || 0) } : line
      ),
    }));
  };

  const submitFundingApplication = () => {
    if (!fundingDraft.purpose.trim() || fundingTotal <= 0) {
      setActionSuccess('Add a funding purpose and at least one budget amount before submitting.');
      setTimeout(() => setActionSuccess(null), 3500);
      return;
    }
    try {
      store.submitBudgetRequest({
        entityId: entity.id,
        entityName: entity.name,
        financialYear: fundingDraft.financialYear,
        requestedAmount: fundingTotal,
        justification: fundingDraft.purpose.trim(),
        lines: fundingDraft.lines
          .filter((line: { amount: number }) => line.amount > 0)
          .map((line: { categoryId: string; categoryName: string; amount: number }) => ({
            categoryId: line.categoryId,
            categoryName: line.categoryName,
            requestedAmount: line.amount,
            notes: fundingDraft.programme.trim() || undefined,
          })),
      });
      window.localStorage.removeItem(`dsac-funding-draft-${entity.id}`);
      setActionSuccess('Funding application submitted to DSAC for review.');
    } catch (error) {
      setActionSuccess(error instanceof Error ? error.message : 'Funding application could not be submitted.');
    }
    setTimeout(() => setActionSuccess(null), 4500);
  };

  const [newMessage, setNewMessage] = useState('');
  const [messagesList, setMessagesList] = useState([
    {
      id: 1,
      sender: 'Thandi Mokoena (DSAC Oversight Reviewer)',
      time: 'Today, 09:15',
      content: 'Good morning Lerato. Q1 evidence is verified. Please add ID numbers to the Q2 attendance register.',
      isDsac: true,
    },
    {
      id: 2,
      sender: 'Lerato Phiri (Ubuntu Arts Admin)',
      time: 'Today, 10:30',
      content: 'Noted with thanks Ms Mokoena. We have updated the registers and attached the signed verification certificate.',
      isDsac: false,
    },
  ]);

  // Organisation Profile State - Statutory identifiers are strictly final.
  // The recorded statutory details below belong to the demonstration NPO only. Every other organisation starts from
  // its own record (the previous build showed Ubuntu Arts' registration and banking details to every entity).
  const buildOrgProfile = (e: typeof entity) => e.id === 'ent-ubuntu-arts'
    ? {
        name: 'Ubuntu Arts NPO',
        npoNumber: 'NPO-2018-8841',
        cipcReg: '2018/142981/08',
        pboNumber: '930064128',
        address: 'Old Fort Complex, 11 Kotze St, Braamfontein, Johannesburg, 2001',
        province: 'Gauteng',
        accountingOfficer: 'Lerato Phiri',
        officerEmail: 'l.phiri@ubuntuarts.org.za',
        officerPhone: '+27 (0)11 384 9200',
        chairperson: 'Dr. Zanele Khumalo',
        treasurer: 'Thabo Maseko (CA SA)',
        bankName: 'Standard Bank South Africa',
        accountEnding: '**** 4921',
      }
    : {
        name: e.name,
        npoNumber: '',
        cipcReg: '',
        pboNumber: '',
        address: '',
        province: '',
        accountingOfficer: e.reportingOfficerName,
        officerEmail: e.contactEmail,
        officerPhone: '',
        chairperson: '',
        treasurer: '',
        bankName: '',
        accountEnding: '',
      };
  const [orgProfile, setOrgProfile] = useState(() => buildOrgProfile(entity));
  useEffect(() => {
    setOrgProfile(buildOrgProfile(entity));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entity.id]);

  // Dynamic Year & Quarter Based Stats strictly synchronized with Department Dashboard
  const yearStats = useMemo(() => {
    const normYear = normalizeFinancialYear(selectedYear);
    const isAudited = isFinancialYearClosed(normYear);
    const fin = store.getEntityFinancialSummary(entity.id, normYear, selectedQuarter);
    const perf = store.getEntityPerformanceSummary(entity.id, normYear, selectedQuarter);

    // Compliance figures are computed from the entity's own reports and the statutory calendar (previously typed).
    const reportsForEntity = store.reports.filter(r => r.entityId === entity.id);
    const overdue = reportsForEntity.filter(r => r.submissionStatus === 'OVERDUE').length;
    const returned = reportsForEntity.filter(r => r.submissionStatus === 'CORRECTION_REQUIRED').length;
    const now = Date.now();
    const upcoming = store.deadlines.filter(d => {
      const due = new Date(d.dueDate).getTime();
      return due > now && due <= now + 60 * 86400000;
    }).length;

    const auditLabels: Record<string, string> = {
      CLEAN_AUDIT: 'Clean Audit (Unqualified)',
      UNQUALIFIED_WITH_FINDINGS: 'Unqualified with Findings',
      QUALIFIED: 'Qualified Audit Opinion',
      DISCLAIMER: 'Disclaimer of Opinion',
      NOT_YET_AUDITED: 'Not yet audited',
    };
    const auditRecordedForYear = sameFinancialYear(entity.auditYear, normYear);

    return {
      yearLabel: `${normYear} Financial Year`,
      fiscalTag: normYear,
      quarterLabel: selectedQuarter === 'FULL_YEAR' ? 'Full Year' : selectedQuarter,
      budgetAllocated: fin.approvedAmount,
      transferred: fin.disbursedToDate,
      expenditure: fin.ytdActual,
      utilPercent: fin.utilisationPercent,
      absorptionPercent: fin.absorptionRate,
      remaining: Math.max(0, fin.remainingBudget),
      complianceStatus: overdue > 0 ? 'Overdue Reporting' : returned > 0 ? 'Attention Required' : 'Compliant',
      complianceScore: entity.overallComplianceScore,
      upcomingDueDates: isAudited ? 0 : upcoming,
      overdueItems: isAudited ? 0 : overdue,
      kpiAchievedCount: perf.completedCount,
      kpiTotalCount: perf.totalKpis,
      kpiPercent: perf.completedPercent,
      targets: perf.items.map(item => ({
        title: item.name,
        current: item.actualDisplay,
        target: `${item.targetDisplay} (${item.percentageAchieved}%)`,
        pct: Math.min(100, item.percentageAchieved),
        color: item.percentageAchieved >= 100 ? 'bg-emerald-500' : item.percentageAchieved >= 50 ? 'bg-blue-500' : 'bg-rose-500',
      })),
      auditOutcome: auditRecordedForYear || !isAudited ? (auditLabels[entity.auditOutcome] || 'Not recorded') : 'Not recorded for this year',
      badge: isAudited ? 'Closed Financial Year' : 'Active Financial Year',
    };
  }, [selectedYear, selectedQuarter, entity, tick]);

  const complianceItems = useMemo(() => {
    const now = Date.now();
    const reportItems = entityReports.map(report => {
      const returned = report.submissionStatus === 'CORRECTION_REQUIRED';
      const accepted = report.submissionStatus === 'APPROVED';
      return {
        title: `${report.quarter} Performance Report`,
        desc: 'Structured performance and expenditure return for the reporting period.',
        status: accepted ? 'Accepted' : returned ? 'Returned for Correction' : report.submissionStatus.replace(/_/g, ' '),
        date: report.dueDate ? `Due: ${report.dueDate}` : 'No due date recorded',
        color: accepted ? 'bg-emerald-100 text-emerald-800' : returned ? 'bg-rose-100 text-rose-800' : 'bg-amber-100 text-amber-800',
      };
    });
    const deadlineItems = store.deadlines
      .filter(deadline => (!deadline.entityType || deadline.entityType === 'ALL' || deadline.entityType === entity.type) && new Date(deadline.dueDate).getTime() >= now - 86400000)
      .slice(0, 5)
      .map(deadline => {
        const due = new Date(deadline.dueDate).getTime();
        const overdue = due < now;
        return {
          title: deadline.title,
          desc: deadline.description,
          status: overdue ? 'Overdue' : due < now + 30 * 86400000 ? 'Due Soon' : 'Upcoming',
          date: `Due: ${deadline.dueDate}`,
          color: overdue ? 'bg-rose-100 text-rose-800' : due < now + 30 * 86400000 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800',
        };
      });
    return [...reportItems, ...deadlineItems];
  }, [entityReports, entity.type, tick]);

  const currentUser = store.currentUser || {
    name: 'Lerato Phiri',
    role: 'ENTITY_OFFICER',
    designation: 'Organisation Admin',
    email: 'l.phiri@ubuntuarts.org.za',
    entityName: 'Ubuntu Arts NPO',
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUploadFile) {
      setActionSuccess('Please choose a document file before uploading.');
      setTimeout(() => setActionSuccess(null), 3500);
      return;
    }
    const finalTitle = uploadDocTitle.trim() || uploadFileName.replace(/\.[^/.]+$/, "") || 'Section 38 Portfolio Evidence';
    const finalFileName = selectedUploadFile.name;
    const numBytes = selectedUploadFile.size;
    const contentDataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === 'string' ? resolve(reader.result) : reject(new Error('The selected file could not be read.'));
      reader.onerror = () => reject(new Error('The selected file could not be read.'));
      reader.readAsDataURL(selectedUploadFile);
    });

    // Map category to statutory requirement slot
    const requirements = store.getDocumentRequirements(reportQuarter);
    const targetReq = requirements.find(r => {
      if (uploadDocCategory === 'PORTFOLIO_OF_EVIDENCE') return r.requiredDocumentType === 'POE';
      if (uploadDocCategory === 'FINANCIAL_REPORT') return r.requiredDocumentType === 'FINANCIAL_STATEMENT' || r.requiredDocumentType === 'BANK_STATEMENT';
      if (uploadDocCategory === 'OPERATIONAL_PLAN') return r.requiredDocumentType === 'ANNUAL_PERFORMANCE_PLAN' || r.requiredDocumentType === 'PERFORMANCE_REPORT';
      if (uploadDocCategory === 'GOVERNANCE_CHARTER') return r.requiredDocumentType === 'GOVERNANCE_CHARTER';
      return false;
    }) || requirements[0];

    try {
      const response = await store.submitDocumentForRequirement({
        entityId: entity.id,
        requirementId: targetReq?.id || store.documentRequirements[0]?.id,
        quarter: reportQuarter,
        financialYear: yearStats.fiscalTag,
        file: selectedUploadFile,
        contentDataUrl,
        changeSummary: uploadSummary || 'Statutory evidence dossier submitted under PFMA Section 38 audit verification.',
      });

      const outcome = response.result.status;
      if (outcome === 'VERIFIED') {
        setActionSuccess(`Document "${finalFileName}" successfully submitted and VERIFIED by automated classification engine.`);
      } else if (outcome === 'REJECTED') {
        setActionSuccess(`Document "${finalFileName}" submitted but REJECTED: ${response.result.reasons[0] || 'Content validation failed'}. Corrective task logged.`);
      } else {
        setActionSuccess(`Document "${finalFileName}" submitted and queued for DSAC Manual Review.`);
      }
    } catch {
      store.createNewDocument(
        entity.id,
        finalTitle,
        uploadDocCategory,
        yearStats.fiscalTag,
        finalFileName,
        numBytes,
        uploadSummary || 'Statutory evidence dossier submitted under PFMA Section 38 audit verification.'
      );
      setActionSuccess(`Statutory document "${finalFileName}" uploaded successfully and forwarded to DSAC Section 38 Oversight.`);
    }

    setActiveModal(null);
    setUploadDocTitle('');
    setUploadFileName('');
    setSelectedUploadFile(null);
    setUploadSummary('');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spentAmount = Math.max(0, parseFloat(reportExpenditure) || 0);
    store.submitQuarterlyReport({
      entityId: entity.id,
      quarter: reportQuarter,
      financialYear: yearStats.fiscalTag,
      expenditureClaimedZAR: spentAmount,
      declarationNotes: reportDeclaration,
      poeDocId: reportPoeDocId || entityDocuments[0]?.id,
    });

    setActionSuccess(`Quarter ${reportQuarter} Statutory Performance Report submitted to DSAC with a claimed expenditure of ${formatZAR(spentAmount)}.`);
    setActiveModal(null);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleClaimTranche = (trancheName: string, amount: number) => {
    store.createTask({
      entityId: entity.id,
      entityName: entity.name,
      title: `Disburse ${trancheName} (R ${(amount / 1_000_000).toFixed(2)}M) for ${entity.shortCode || entity.name}`,
      description: `Formal request for ${trancheName} disbursement following verified Q1 & Q2 statutory compliance.`,
      assignedToName: 'DSAC Chief Financial Officer',
      priority: 'HIGH',
      status: 'OPEN',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      direction: 'ENTITY_TO_DSAC',
    });
    setActionSuccess(`Claim for ${trancheName} (R ${(amount / 1_000_000).toFixed(2)}M) submitted to DSAC Finance Directorate.`);
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleDownloadDoc = (docId: string, fileName: string, title: string, category: string) => {
    const documentRecord = store.documents.find(doc => doc.id === docId);
    const currentVersion = documentRecord?.versions.find(version => version.versionNumber === documentRecord.currentVersion);
    if (currentVersion?.contentDataUrl) {
      store.downloadDocument(docId);
    } else {
      downloadStatutoryDocument(fileName, title, category, entity.name);
    }
    setActionSuccess(`Downloaded authentic copy of "${fileName}".`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const handleDeleteDoc = (docId: string, title: string) => {
    store.deleteEntityDocument(docId);
    setActionSuccess(`Archived document "${title}".`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: Building },
    { id: 'funding', label: 'Apply for Funding', icon: HandCoins },
    { id: 'submissions', label: 'Report Submission', icon: FileText },
    { id: 'kpis', label: 'Targets & KPIs', icon: Target },
    { id: 'budget', label: 'Budget & Finance', icon: Coins },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'support', label: 'Support Requests', icon: HandCoins },
    { id: 'documents', label: 'Documents', icon: FolderLock },
    { id: 'organisation', label: 'Organisation Profile', icon: Building },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'calendar', label: 'Deadlines', icon: Calendar, badge: yearStats.upcomingDueDates + yearStats.overdueItems || undefined },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setMessagesList([
      ...messagesList,
      {
        id: Date.now(),
        sender: `${currentUser.name} (${currentUser.designation})`,
        time: 'Just now',
        content: newMessage.trim(),
        isDsac: false,
      },
    ]);
    setNewMessage('');
  };

  return (
    <div className="flex flex-row min-h-screen w-full bg-slate-100">
      
      {/* 1. Ubuntu Arts Deep Purple Sidebar (Always positioned on left of content) */}
      <aside className="w-48 sm:w-56 shrink-0 bg-[#1e1b4b] text-indigo-100 flex flex-col justify-between select-none border-r border-indigo-950 min-h-screen sticky top-0 self-start z-30">
        <div>
          {/* Top Logo & Title */}
          <div className="p-4 border-b border-indigo-900/60 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-900/80 border border-indigo-500/30 flex items-center justify-center p-1.5 shadow-inner shrink-0">
              <UbuntuArtsLogo size={28} />
            </div>
            <div>
              <div className="font-black text-white text-xs tracking-wider">Ubuntu Arts NPO</div>
              <div className="text-[10px] text-indigo-300/80 font-medium">Inspiring Communities</div>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="p-2 space-y-1">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSidebar === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveSidebar(item.id);
                    if (onNavigateToSection && item.id !== 'overview') {
                      onNavigateToSection(item.id);
                    }
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-[#312e81] text-white shadow-sm font-bold ring-1 ring-indigo-400/40'
                      : 'text-indigo-200/80 hover:bg-indigo-900/60 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-indigo-300/80'}`} />
                    <span className="truncate">{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.2 bg-amber-400 text-indigo-950 font-bold text-[9px] rounded-full">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Slogan & Rainbow Bar (Matches image.png) */}
        <div className="p-4 pt-4 border-t border-indigo-900/60 relative overflow-hidden">
          <div className="space-y-0.5 text-[11px] font-semibold tracking-wider text-indigo-300 uppercase mb-3">
            <div className="text-white font-bold text-xs">Create</div>
            <div>Preserve</div>
            <div>Empower</div>
            <div className="text-amber-300 font-bold">Thrive</div>
          </div>
          {/* Rainbow South African decorative gradient strip */}
          <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-red-500 via-amber-400 via-emerald-500 to-blue-500 shadow-sm" />
        </div>
      </aside>

      {/* 2. Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50">
        
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3 shrink-0 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center p-1 shrink-0 font-bold text-indigo-700 text-xs">
              {entity.shortCode === 'UBUNTU' ? <UbuntuArtsLogo size={24} /> : entity.shortCode.slice(0, 4)}
            </div>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight truncate">
                  {entity.name}
                </h2>
                <span className="hidden md:inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {entity.shortCode}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate">
                {entity.type === 'PUBLIC_ENTITY' ? 'PFMA Schedule 3A Public Entity' : 'Subsidized Cultural NPO'} • Reporting Officer: {entity.reportingOfficerName || 'Institutional Officer'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Institution Switcher for Portal */}
            <div className="relative hidden md:block">
              <select
                id="portal-entity-switcher"
                value={entity.id}
                onChange={(e) => setSelectedEntityId(lockedEntityId || e.target.value)}
                disabled={!!lockedEntityId}
                className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer disabled:cursor-default disabled:opacity-90"
                title={lockedEntityId ? 'Your organisation' : 'Select Reporting Entity'}
              >
                {store.entities.filter(e => !lockedEntityId || e.id === lockedEntityId).map(e => (
                  <option key={e.id} value={e.id}>
                    {e.shortCode} — {e.name.length > 32 ? e.name.slice(0, 32) + '...' : e.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Quick Action: Upload PoE */}
            <button
              onClick={() => setActiveModal('uploadPoE')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload PoE</span>
            </button>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-pulse">
                  {entityDocuments.some(d => d.approvalStatus === 'PENDING_REVIEW') ? 3 : 2}
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 p-3.5 z-50 text-xs">
                  <div className="flex items-center justify-between font-bold text-slate-800 mb-2 pb-2 border-b border-slate-100">
                    <span className="flex items-center gap-1.5">
                      <Bell className="w-3.5 h-3.5 text-indigo-600" />
                      Notifications
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Live</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {/* Recent Uploads status */}
                    {entityDocuments.slice(0, 2).map((doc) => (
                      <div 
                        key={doc.id}
                        onClick={() => { setActiveSidebar('documents'); setShowNotifications(false); }}
                        className="p-2.5 bg-slate-50 hover:bg-indigo-50/50 rounded-lg border border-slate-200 cursor-pointer transition-colors"
                      >
                        <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
                          <span className="truncate max-w-[190px]">{doc.fileName || doc.title}</span>
                          <span className={`text-[9px] px-1.5 py-0.2 rounded font-bold ${
                            doc.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            doc.approvalStatus === 'REQUIRES_AMENDMENT' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {doc.approvalStatus === 'APPROVED' ? 'DSAC Verified' :
                             doc.approvalStatus === 'REQUIRES_AMENDMENT' ? 'Amendment Req.' :
                             'Pending Review'}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center justify-between">
                          <span>Evidence files</span>
                          <span>{doc.uploadedAt ? doc.uploadedAt.split('T')[0] : 'Today'}</span>
                        </div>
                      </div>
                    ))}

                    <div 
                      onClick={() => { setActiveSidebar('submissions'); setShowNotifications(false); }}
                      className="p-2.5 bg-amber-50/80 hover:bg-amber-100/60 rounded-lg border border-amber-200 text-amber-900 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-[11px] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-600" />
                        Q2 report due
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">
                        Due 15 Oct 2025. Evidence register required.
                      </div>
                    </div>

                    <div 
                      onClick={() => { setActiveSidebar('budget'); setShowNotifications(false); }}
                      className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100/60 rounded-lg border border-emerald-200 text-emerald-900 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Tranche 2 paid: R 1 700 000
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">
                        Funds paid from the approved allocation.
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 mt-2 border-t border-slate-100 text-center">
                    <button 
                      onClick={() => setShowNotifications(false)}
                      className="text-[10px] font-semibold text-indigo-600 hover:text-indigo-800"
                    >
                      Close Alerts
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Profile & Sign Out */}
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-full bg-indigo-900 text-amber-300 font-bold text-xs flex items-center justify-center border border-indigo-700/50 shadow-xs shrink-0">
                {store.currentUser?.name
                  ? store.currentUser.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()
                  : 'LP'}
              </div>
              <div className="hidden md:block text-left text-xs">
                <div className="font-bold text-slate-800 leading-none">
                  {store.currentUser?.name || 'Lerato Phiri'}
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {store.currentUser?.designation || 'Organisation Admin'}
                </div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-rose-700 hover:text-white bg-rose-50 hover:bg-rose-600 border border-rose-200 hover:border-rose-600 rounded-lg transition-all shadow-xs cursor-pointer ml-1"
                  title="Sign Out of Entity Portal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Action success alert */}
        {actionSuccess && (
          <div className="mx-6 mt-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{actionSuccess}</span>
          </div>
        )}

        {/* 3. Sub-View Router */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto">

          {/* ================= VIEW 1: OVERVIEW (Exact match to image.png) ================= */}
          {activeSidebar === 'overview' && (
            <div className="space-y-5">
              
              {/* Welcome Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      Welcome, Lerato
                    </h3>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <CheckCircle className="w-3 h-3" /> Online
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Building2 className="w-3 h-3 text-slate-400" />
                      <span>{entity.name}</span>
                    </span>
                    <span className="text-slate-300">•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{yearStats.fiscalTag} {yearStats.quarterLabel}</span>
                    </span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={selectedYear}
                    onChange={(e) => {
                      const newYr = e.target.value;
                      setSelectedYear(newYr);
                      if (isFinancialYearClosed(normalizeFinancialYear(newYr))) {
                        setSelectedQuarter('FULL_YEAR');
                      }
                    }}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden cursor-pointer"
                  >
                    {portalYearOptions.map(label => (
                      <option key={label}>{label}</option>
                    ))}
                  </select>

                  <select
                    value={selectedQuarter}
                    onChange={(e) => setSelectedQuarter(e.target.value as FinancialQuarter | 'FULL_YEAR')}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden cursor-pointer"
                  >
                    <option value="FULL_YEAR">Full Year</option>
                    <option value="Q1">Quarter 1 (Q1)</option>
                    <option value="Q2">Quarter 2 (Q2)</option>
                    <option value="Q3">Quarter 3 (Q3)</option>
                    <option value="Q4">Quarter 4 (Q4)</option>
                  </select>
                </div>
              </div>

              {/* 5 Quick Status Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
                <div 
                  onClick={() => setActiveSidebar('compliance')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-emerald-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>Compliance</span>
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                      <CheckCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-emerald-600 leading-none">{yearStats.complianceStatus}</div>
                      <div className="text-[10px] text-slate-500 font-medium mt-0.5">{yearStats.complianceScore}% Score</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('calendar')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-blue-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>Due Dates</span>
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">{yearStats.upcomingDueDates}</div>
                      <div className="text-[10px] text-slate-500 font-medium">Next 30d</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('submissions')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-rose-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>Overdue</span>
                    <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full ${yearStats.overdueItems > 0 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'} flex items-center justify-center shrink-0`}>
                      {yearStats.overdueItems > 0 ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">{yearStats.overdueItems}</div>
                      <div className="text-[10px] text-slate-500 font-medium">{yearStats.overdueItems > 0 ? 'Pending' : 'All clear'}</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('kpis')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between cursor-pointer hover:border-teal-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>Targets</span>
                    <Target className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-600 flex items-center justify-center shrink-0">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">{yearStats.kpiAchievedCount}/{yearStats.kpiTotalCount}</div>
                      <div className="text-[10px] text-teal-700 font-bold">{yearStats.kpiPercent}% Achieved</div>
                    </div>
                  </div>
                </div>

                <div 
                  onClick={() => setActiveSidebar('budget')}
                  className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs flex flex-col justify-between col-span-2 sm:col-span-1 cursor-pointer hover:border-amber-300 transition-all"
                >
                  <div className="flex items-center justify-between text-xs font-medium text-slate-500 mb-2">
                    <span>Spend</span>
                    <Coins className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                      <Coins className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xl font-black text-slate-900 leading-none">{yearStats.utilPercent}%</div>
                      <div className="text-[10px] text-slate-500 font-medium">R {(yearStats.expenditure / 1_000_000).toFixed(1)}M / R {(yearStats.budgetAllocated / 1_000_000).toFixed(1)}M</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Compact dashboard panels matching the entity portal overview design. Values remain sourced from the calculation engine. */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-900">Compliance Alerts &amp; Due Dates</h4>
                    <button onClick={() => setActiveSidebar('compliance')} className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer">View All</button>
                  </div>
                  <div className="space-y-2 mt-3">
                    {complianceItems.slice(0, 5).map((item, index) => (
                      <button key={`${item.title}-${index}`} onClick={() => setActiveSidebar('compliance')} className="w-full flex items-start justify-between gap-2 text-left p-2 rounded-lg hover:bg-slate-50 cursor-pointer">
                        <span className="flex items-start gap-2 min-w-0">
                          <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${item.status === 'Overdue' || item.status === 'Returned for Correction' ? 'bg-rose-500' : item.status === 'Due Soon' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                          <span className="min-w-0">
                            <span className="block text-[11px] font-bold text-slate-800 truncate">{item.title}</span>
                            <span className="block text-[10px] text-slate-400 truncate">{item.date}</span>
                          </span>
                        </span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full whitespace-nowrap ${item.color}`}>{item.status}</span>
                      </button>
                    ))}
                    {complianceItems.length === 0 && <p className="text-xs text-slate-400 py-5 text-center">No compliance items recorded.</p>}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-900">KPI Performance</h4>
                    <button onClick={() => setActiveSidebar('kpis')} className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer">View Details</button>
                  </div>
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-24 h-24 rounded-full border-[10px] border-emerald-500 flex items-center justify-center shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-black text-slate-900">{yearStats.kpiPercent}%</div>
                        <div className="text-[9px] text-slate-500">Overall</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-[10px]">
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Achieved <strong className="ml-auto">{yearStats.kpiAchievedCount}</strong></div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-amber-400" /> In progress <strong className="ml-auto">{Math.max(0, yearStats.kpiTotalCount - yearStats.kpiAchievedCount)}</strong></div>
                      <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-slate-300" /> Total KPIs <strong className="ml-auto">{yearStats.kpiTotalCount}</strong></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {yearStats.targets.slice(0, 4).map((target, index) => (
                      <div key={`${target.title}-${index}`}>
                        <div className="flex justify-between text-[10px] text-slate-600 mb-1"><span className="truncate">{target.title}</span><strong>{target.pct}%</strong></div>
                        <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className={`${target.color} h-full rounded-full`} style={{ width: `${target.pct}%` }} /></div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h4 className="font-bold text-sm text-slate-900">Budget Overview</h4>
                    <button onClick={() => setActiveSidebar('budget')} className="text-[10px] font-bold text-indigo-700 hover:underline cursor-pointer">View Details</button>
                  </div>
                  <div className="flex items-center gap-4 py-4">
                    <div className="w-24 h-24 rounded-full border-[10px] border-blue-500 flex items-center justify-center shrink-0">
                      <div className="text-center">
                        <div className="text-xl font-black text-slate-900">{yearStats.utilPercent}%</div>
                        <div className="text-[9px] text-slate-500">Utilised</div>
                      </div>
                    </div>
                    <div className="space-y-2 text-[10px] text-slate-600">
                      <div>Total approved <strong className="block text-slate-900">{formatZAR(yearStats.budgetAllocated)}</strong></div>
                      <div>Total utilised <strong className="block text-slate-900">{formatZAR(yearStats.expenditure)}</strong></div>
                      <div>Remaining balance <strong className="block text-slate-900">{formatZAR(yearStats.remaining)}</strong></div>
                    </div>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${Math.min(yearStats.utilPercent, 100)}%` }} /></div>
                  <p className="text-[10px] text-slate-400 mt-2">Utilisation is calculated from approved budget and cumulative actual expenditure.</p>
                </div>
              </div>

              {/* Row 2: Targets (Left) & Upcoming Due Dates (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* My Key Targets */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Target className="w-4 h-4 text-indigo-600" />
                      <span>Key Targets ({yearStats.fiscalTag} • {yearStats.quarterLabel})</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('kpis')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View All</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="py-3 space-y-3.5">
                    {yearStats.targets.map((tgt, i) => (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium text-slate-700 flex items-center gap-1.5">
                            <Target className="w-3 h-3 text-slate-400" />
                            <span>{tgt.title}</span>
                          </span>
                          <span className="font-bold text-slate-900 font-mono">{tgt.current} / {tgt.target}</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                          <div className={`${tgt.color} h-2 rounded-full transition-all duration-500`} style={{ width: `${tgt.pct}%` }}></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Upcoming Due Dates */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      <span>Upcoming Deadlines</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('calendar')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>Calendar</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="py-2 space-y-2.5 text-xs">
                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <BarChart3 className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Quarter 2 Report</div>
                          <div className="text-[11px] text-slate-400">15 Aug 2025</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock className="w-3 h-3" />
                        <span>5d left</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <Coins className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Budget Utilization Report</div>
                          <div className="text-[11px] text-slate-400">31 Aug 2025</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <Clock className="w-3 h-3" />
                        <span>21d left</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <Target className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Strategic Plan Update</div>
                          <div className="text-[11px] text-slate-400">30 Sep 2025</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                        <Clock className="w-3 h-3" />
                        <span>51d left</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50 transition-colors">
                      <div className="flex items-start gap-2.5">
                        <FileCheck className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <div>
                          <div className="font-semibold text-slate-800">Annual Report</div>
                          <div className="text-[11px] text-slate-400">31 Mar 2026</div>
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle className="w-3 h-3" />
                        <span>On track</span>
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 3: Budget Overview (Left) & Support Requests (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Budget Overview */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-amber-600" />
                      <span>Budget Summary</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('budget')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <span>View Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>

                  <div className="py-3 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 text-sm">
                        R {(yearStats.expenditure / 1_000_000).toFixed(1)}M / R {(yearStats.budgetAllocated / 1_000_000).toFixed(1)}M
                      </span>
                      <span className="font-bold text-emerald-700 text-xs">{yearStats.utilPercent}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                      <div className="bg-emerald-500 h-full rounded-full" style={{ width: `${Math.min(yearStats.utilPercent, 100)}%` }}></div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 pt-2">
                      <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-center">
                        <Wallet className="w-3.5 h-3.5 text-slate-400 mx-auto mb-1" />
                        <div className="text-sm font-black text-slate-900">R {(yearStats.budgetAllocated / 1_000_000).toFixed(1)}M</div>
                        <div className="text-[10px] text-slate-500 font-medium">Approved</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-100 text-center">
                        <Coins className="w-3.5 h-3.5 text-emerald-600 mx-auto mb-1" />
                        <div className="text-sm font-black text-emerald-800">R {(yearStats.expenditure / 1_000_000).toFixed(1)}M</div>
                        <div className="text-[10px] text-emerald-700 font-medium">Utilized</div>
                      </div>
                      <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-100 text-center">
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 mx-auto mb-1" />
                        <div className="text-sm font-black text-blue-800">R {(yearStats.remaining / 1_000_000).toFixed(1)}M</div>
                        <div className="text-[10px] text-blue-700 font-medium">Remaining</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Support Requests */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <HandCoins className="w-4 h-4 text-emerald-600" />
                      <span>Support Requests</span>
                    </h4>
                    <button
                      onClick={() => setActiveModal('support')}
                      className="px-2.5 py-1 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg text-xs font-bold shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="w-3 h-3" />
                      <span>New Request</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-4 gap-2.5 py-3 text-center">
                    <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center mb-1">
                        <FileText className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-slate-900">3</div>
                      <div className="text-[11px] text-slate-600 font-medium">Submitted</div>
                    </div>
                    <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                      <div className="w-7 h-7 rounded-full bg-amber-100 text-amber-700 mx-auto flex items-center justify-center mb-1">
                        <Clock className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-amber-900">1</div>
                      <div className="text-[11px] text-amber-800 font-medium">Under Review</div>
                    </div>
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <div className="w-7 h-7 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center mb-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-emerald-900">1</div>
                      <div className="text-[11px] text-emerald-800 font-medium">Approved</div>
                    </div>
                    <div className="p-3 bg-rose-50/60 rounded-xl border border-rose-100">
                      <div className="w-7 h-7 rounded-full bg-rose-100 text-rose-700 mx-auto flex items-center justify-center mb-1">
                        <XCircle className="w-3.5 h-3.5" />
                      </div>
                      <div className="text-lg font-black text-rose-900">0</div>
                      <div className="text-[11px] text-rose-700 font-medium">Rejected</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Row 4: Recent Messages (Left) & Quick Actions (Right) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Recent Messages */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-indigo-600" />
                      <span>Recent Messages</span>
                    </h4>
                    <button
                      onClick={() => setActiveSidebar('messages')}
                      className="text-xs text-indigo-700 font-semibold hover:underline cursor-pointer"
                    >
                      View All
                    </button>
                  </div>

                  <div className="py-2 space-y-3 text-xs">
                    <div 
                      onClick={() => setActiveSidebar('messages')}
                      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 hover:text-indigo-700 truncate">Feedback on Q1 Report</div>
                        <div className="text-[11px] text-slate-400">DSAC Reviewer · 2 days ago</div>
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveSidebar('messages')}
                      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 hover:text-indigo-700 truncate">Budget request under review</div>
                        <div className="text-[11px] text-slate-400">DSAC Finance · 4 days ago</div>
                      </div>
                    </div>

                    <div 
                      onClick={() => setActiveSidebar('messages')}
                      className="flex items-start gap-3 p-1.5 rounded-lg hover:bg-slate-50 cursor-pointer transition-colors"
                    >
                      <div className="w-7 h-7 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 font-bold text-xs mt-0.5">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-slate-800 hover:text-indigo-700 truncate">Reminder: Q2 Report due soon</div>
                        <div className="text-[11px] text-slate-400">DSAC Compliance · 5 days ago</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions (2x2 Grid) */}
                <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div className="pb-3 border-b border-slate-100 flex items-center justify-between">
                    <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-indigo-600" />
                      <span>Quick Actions</span>
                    </h4>
                  </div>

                  <div className="grid grid-cols-2 gap-3 py-2">
                    <button
                      onClick={() => setActiveModal('report')}
                      className="p-3 bg-blue-50/60 hover:bg-blue-50 border border-blue-100 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 text-xs group-hover:text-blue-700">Submit Report</div>
                          <div className="text-[10px] text-slate-500">Statutory PoE</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-blue-400 group-hover:text-blue-700 transition-colors shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveModal('support')}
                      className="p-3 bg-amber-50/60 hover:bg-amber-50 border border-amber-100 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                          <HandCoins className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 text-xs group-hover:text-amber-700">Request Support</div>
                          <div className="text-[10px] text-slate-500">Funding / Advice</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:text-amber-700 transition-colors shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveSidebar('kpis')}
                      className="p-3 bg-emerald-50/60 hover:bg-emerald-50 border border-emerald-100 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                          <Target className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 text-xs group-hover:text-emerald-700">Update KPIs</div>
                          <div className="text-[10px] text-slate-500">Progress metrics</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-emerald-400 group-hover:text-emerald-700 transition-colors shrink-0" />
                    </button>

                    <button
                      onClick={() => setActiveModal('uploadPoE')}
                      className="p-3 bg-indigo-50/60 hover:bg-indigo-50 border border-indigo-100 rounded-xl text-left transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                          <UploadCloud className="w-4 h-4" />
                        </div>
                        <div className="truncate">
                          <div className="font-bold text-slate-900 text-xs group-hover:text-indigo-700">Upload Files</div>
                          <div className="text-[10px] text-slate-500">Registers &amp; docs</div>
                        </div>
                      </div>
                      <ArrowRight className="w-3.5 h-3.5 text-indigo-400 group-hover:text-indigo-700 transition-colors shrink-0" />
                    </button>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* ================= VIEW 2: MY ORGANISATION ================= */}
          {activeSidebar === 'funding' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">Apply for Funding</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Submit a structured annual budget request. Approved values remain the baseline used by finance and reporting.
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                  <label className="text-xs font-bold text-slate-700">
                    Financial year
                    <select value={fundingDraft.financialYear} onChange={e => setFundingDraft({ ...fundingDraft, financialYear: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200 bg-slate-50">
                      {portalYearOptions.map(year => <option key={year} value={year.split(' ')[0]}>{year}</option>)}
                    </select>
                  </label>
                  <label className="text-xs font-bold text-slate-700">
                    Programme / category
                    <input value={fundingDraft.programme} onChange={e => setFundingDraft({ ...fundingDraft, programme: e.target.value })} className="mt-1 w-full p-2 rounded-lg border border-slate-200" placeholder="Funded programme" />
                  </label>
                </div>
                <label className="block text-xs font-bold text-slate-700 mt-3">
                  Purpose and summary
                  <textarea value={fundingDraft.purpose} onChange={e => setFundingDraft({ ...fundingDraft, purpose: e.target.value })} rows={3} className="mt-1 w-full p-2 rounded-lg border border-slate-200" placeholder="Explain what the funding will deliver and why it is needed." />
                </label>
                <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="grid grid-cols-[1fr_150px] gap-3 px-3 py-2 bg-slate-50 text-[11px] font-bold text-slate-600">
                    <span>Budget category</span><span>Requested amount (ZAR)</span>
                  </div>
                  {fundingDraft.lines.map((line: { categoryId: string; categoryName: string; amount: number }) => (
                    <div key={line.categoryId} className="grid grid-cols-[1fr_150px] gap-3 items-center px-3 py-2 border-t border-slate-100 text-xs">
                      <span>{line.categoryName}</span>
                      <input type="number" min="0" step="1000" value={line.amount || ''} onChange={e => updateFundingLine(line.categoryId, e.target.value)} className="p-1.5 rounded border border-slate-200 text-right" />
                    </div>
                  ))}
                  <div className="flex justify-between px-3 py-3 border-t border-slate-200 font-black text-sm">
                    <span>Total requested</span><span>{formatZAR(fundingTotal)}</span>
                  </div>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <button onClick={() => setActionSuccess('Funding application draft saved.')} className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 text-xs font-bold">Save as Draft</button>
                  <button onClick={submitFundingApplication} className="px-4 py-2 rounded-lg bg-indigo-700 text-white text-xs font-bold">Submit to DSAC</button>
                </div>
              </div>
            </div>
          )}

          {activeSidebar === 'organisation' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Building className="w-5 h-5 text-indigo-600" />
                      <span>Institutional Profile &amp; Governance Structure</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statutory registration under the Non-Profit Organisations Act and PFMA Section 38.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setActionSuccess('Institutional profile changes saved successfully.');
                      setTimeout(() => setActionSuccess(null), 1500);
                    }}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs"
                  >
                    Save Updates
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Organisation Name</label>
                    <input
                      type="text"
                      value={orgProfile.name}
                      onChange={(e) => setOrgProfile({ ...orgProfile, name: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">NPO Registration Number</label>
                    <input
                      type="text"
                      value={orgProfile.npoNumber}
                      onChange={(e) => setOrgProfile({ ...orgProfile, npoNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">CIPC Company Number</label>
                    <input
                      type="text"
                      value={orgProfile.cipcReg}
                      onChange={(e) => setOrgProfile({ ...orgProfile, cipcReg: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">SARS PBO Tax Exemption #</label>
                    <input
                      type="text"
                      value={orgProfile.pboNumber}
                      onChange={(e) => setOrgProfile({ ...orgProfile, pboNumber: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block font-semibold text-slate-700 mb-1">Physical Address</label>
                    <input
                      type="text"
                      value={orgProfile.address}
                      onChange={(e) => setOrgProfile({ ...orgProfile, address: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Accounting Officer / Admin</label>
                    <input
                      type="text"
                      value={orgProfile.accountingOfficer}
                      onChange={(e) => setOrgProfile({ ...orgProfile, accountingOfficer: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Institutional Email</label>
                    <input
                      type="email"
                      value={orgProfile.officerEmail}
                      onChange={(e) => setOrgProfile({ ...orgProfile, officerEmail: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Board Chairperson</label>
                    <input
                      type="text"
                      value={orgProfile.chairperson}
                      onChange={(e) => setOrgProfile({ ...orgProfile, chairperson: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Board Treasurer</label>
                    <input
                      type="text"
                      value={orgProfile.treasurer}
                      onChange={(e) => setOrgProfile({ ...orgProfile, treasurer: e.target.value })}
                      className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 3: COMPLIANCE CHECKLIST ================= */}
          {activeSidebar === 'compliance' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>Statutory Compliance Matrix (PFMA Act 1 of 1999)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      National Treasury checklist for public funds.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                      yearStats.overdueItems > 0 ? 'bg-rose-100 text-rose-800' : yearStats.complianceStatus === 'Attention Required' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                    }`}>
                      {yearStats.complianceStatus}
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs mt-3">
                  {complianceItems.map((item, i) => (
                    <div key={i} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-bold text-slate-800">{item.title}</div>
                        <div className="text-[11px] text-slate-500">{item.desc}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${item.color}`}>
                          {item.status}
                        </span>
                        <div className="text-[10px] text-slate-400 mt-0.5">{item.date}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 4: TARGETS & KPIS MANAGER ================= */}
          {activeSidebar === 'kpis' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <Target className="w-5 h-5 text-teal-600" />
                      <span>Targets &amp; Key Performance Indicators ({yearStats.fiscalTag})</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      National Treasury indicators. Enter quarterly actuals to update results.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold px-3 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-full">
                      {yearStats.kpiAchievedCount} of {yearStats.kpiTotalCount} Targets Achieved ({yearStats.kpiPercent}%)
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  {entityKPIs.length > 0 ? (
                    entityKPIs.map((kpi) => (
                      <KpiProgressCard
                        key={kpi.id}
                        kpi={kpi}
                        onUpdateActual={(k) => setSelectedKpiForCapture(k)}
                        showQuarterBreakdown={true}
                      />
                    ))
                  ) : (
                    <div className="col-span-2 py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <Target className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No KPIs registered for this entity.</p>
                      <p className="text-xs text-slate-400 mt-1">Institutional targets will appear once approved under Vote 37.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: BUDGET & FINANCIAL UTILIZATION ================= */}
          {activeSidebar === 'budget' && (
            <div className="space-y-4">
              <div className="flex justify-end">
                <button
                  onClick={() => setShowExpenditureModal(true)}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Coins className="w-4 h-4" />
                  <span>Capture Quarterly Expenditure Return</span>
                </button>
              </div>
              <EntityFinancialView
                entityId={entity.id}
                financialYear={yearStats.fiscalTag}
                readOnly={false}
              />
            </div>
          )}

          {/* ================= VIEW 6: SUPPORT REQUESTS ================= */}
          {activeSidebar === 'support' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <HandCoins className="w-5 h-5 text-emerald-600" />
                      <span>Institutional Support &amp; Technical Assistance</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Request financial, technical, or governance support directly from the DSAC Oversight team.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowSupportModal(true)}
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Support Request</span>
                  </button>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  {store.getSupportRequests(entity.id).length > 0 ? (
                    store.getSupportRequests(entity.id).map((req) => {
                      const statusStyles: Record<string, string> = {
                        APPROVED: 'bg-emerald-100 text-emerald-800 border-emerald-300',
                        UNDER_REVIEW: 'bg-amber-100 text-amber-800 border-amber-300',
                        SUBMITTED: 'bg-blue-100 text-blue-800 border-blue-300',
                        REJECTED: 'bg-rose-100 text-rose-800 border-rose-300',
                        DECLINED: 'bg-rose-100 text-rose-800 border-rose-300',
                        MORE_INFORMATION_REQUIRED: 'bg-orange-100 text-orange-800 border-orange-300',
                        COMPLETED: 'bg-teal-100 text-teal-800 border-teal-300',
                      };
                      const currentStatusClass = statusStyles[req.status] || 'bg-slate-100 text-slate-700 border-slate-300';

                      return (
                        <div
                          key={req.id}
                          className="p-4 bg-slate-50/70 border border-slate-200 rounded-xl space-y-2 hover:bg-slate-50 transition-colors"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-black text-slate-900 text-sm">{req.title}</span>
                              <span className="px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800 text-[10px] font-bold">
                                {req.categoryLabel || req.category}
                              </span>
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${currentStatusClass}`}>
                                {req.status.replace('_', ' ')}
                              </span>
                            </div>
                            {req.amountRequested && (
                              <span className="font-bold text-emerald-700 text-xs font-mono">
                                {formatZAR(req.amountRequested)}
                              </span>
                            )}
                          </div>

                          <p className="text-slate-700 leading-relaxed">{req.motivation}</p>

                          {req.expectedOutcome && (
                            <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-slate-600">
                              <span className="font-bold text-slate-800">Expected Outcome: </span>
                              {req.expectedOutcome}
                            </div>
                          )}

                          {req.reviewNotes && (
                            <div className="p-2.5 bg-amber-50 rounded-lg border border-amber-200 text-amber-900">
                              <span className="font-bold">DSAC Oversight Notes: </span>
                              {req.reviewNotes}
                              {req.reviewedByName && (
                                <span className="text-[10px] text-amber-700 block mt-0.5">
                                  Reviewed by {req.reviewedByName}
                                </span>
                              )}
                            </div>
                          )}

                          <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-200/60">
                            <span>Submitted: {new Date(req.createdAt).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short', year: 'numeric' })} • Ref: {req.id}</span>
                            {req.linkedProgramme && <span>Programme: {req.linkedProgramme}</span>}
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="py-8 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <HandCoins className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="font-semibold text-slate-600">No support requests submitted yet.</p>
                      <p className="text-xs text-slate-400 mt-1">Submit assistance requests for funding, technical advisory, or governance support.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 7: REPORTS SUBMISSION & STEPPER ================= */}
          {(activeSidebar === 'submissions' || activeSidebar === 'reports') && (
            <div className="space-y-6">
              {/* Stepper Success Banner */}
              {stepperSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-4 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span>{stepperSuccessMessage}</span>
                </div>
              )}

              {/* Performance Return Ingestion Stepper (Entity Reporting Action) */}
              <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
                  <div>
                    <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-indigo-700" />
                      <span>{entity.shortCode} Performance Return Ingestion Stepper</span>
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Enter quarterly figures, explain variances, and submit for DSAC review.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setStepperStep(1)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        stepperStep === 1
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Step 1 of 2: Indicator Values
                    </button>
                    <button
                      type="button"
                      onClick={() => setStepperStep(2)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
                        stepperStep === 2
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-300 ring-1 ring-emerald-200'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      Step 2 of 2: Evidence &amp; Sign-Off
                    </button>
                  </div>
                </div>

                {/* STEP 1: INDICATOR VALUES */}
                {stepperStep === 1 && (
                  <div className="mt-5 space-y-5">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Reporting Quarter &amp; Financial Year
                        </label>
                        <select
                          value={reportingQuarter}
                          onChange={(e) => setReportingQuarter(e.target.value)}
                          className="w-full text-xs p-2.5 rounded-lg bg-slate-50 border border-slate-300 font-semibold text-slate-800 focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-emerald-600"
                        >
                          {['Q1', 'Q2', 'Q3', 'Q4'].map(q => (
                            <option key={q} value={`${q} (${reportingFyLong} Financial Year)`}>{q} ({reportingFyLong} Financial Year)</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1">
                          Verified Quarterly Operational Expenditure (ZAR)
                        </label>
                        <input 
                          type="number" 
                          value={spentThisQuarter} 
                          onChange={(e) => setSpentThisQuarter(Number(e.target.value))}
                          className="w-full text-xs p-2.5 rounded-lg border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                          placeholder="Amount in ZAR"
                        />
                        <span className="text-[10px] text-slate-500 mt-0.5 block">
                          PFMA Vote 37: Disbursed towards agreed programme outputs.
                        </span>
                      </div>
                    </div>

                    {/* Indicator Inputs */}
                    <div className="space-y-4 pt-3">
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
                        <span>KPI Achievement Entries &amp; Remedial Evidence:</span>
                        <span className="text-[11px] font-medium text-slate-400">
                          {entityKPIs.length} Agreed Trajectories
                        </span>
                      </div>

                      {entityKPIs.length === 0 ? (
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                          No specific indicator trajectories configured for {entity.shortCode}. Using baseline statutory metrics.
                        </div>
                      ) : (
                        entityKPIs.map(kpi => {
                          const state = stepperKpiEntries[kpi.id] || { 
                            actual: kpi.currentValue, 
                            varianceReason: '', 
                            correctiveAction: '' 
                          };

                          return (
                            <div key={kpi.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div>
                                  <div className="font-bold text-slate-900 text-xs">{kpi.name}</div>
                                  <div className="text-[11px] text-slate-500">Programme: {kpi.programmeName} • Unit: {kpi.unitOfMeasure}</div>
                                </div>
                                <div className="text-xs font-mono font-semibold text-slate-700 bg-white px-2.5 py-1 rounded-md border border-slate-200 shrink-0">
                                  Expected Trajectory: {kpi.expectedValue} {kpi.unitOfMeasure}
                                </div>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Verified Actual Achieved
                                  </label>
                                  <input
                                    type="number"
                                    value={state.actual}
                                    onChange={(e) => handleStepperKpiChange(kpi.id, 'actual', Number(e.target.value))}
                                    className="w-full p-2 bg-white rounded-lg border border-slate-300 font-mono text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Variance Explanation (if lag {'>'}10%)
                                  </label>
                                  <input
                                    type="text"
                                    value={state.varianceReason}
                                    placeholder="Reason for delay or over-achievement"
                                    onChange={(e) => handleStepperKpiChange(kpi.id, 'varianceReason', e.target.value)}
                                    className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                  />
                                </div>

                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                                    Proposed Mitigation Action
                                  </label>
                                  <input
                                    type="text"
                                    value={state.correctiveAction}
                                    placeholder="Corrective steps planned for next quarter"
                                    onChange={(e) => handleStepperKpiChange(kpi.id, 'correctiveAction', e.target.value)}
                                    className="w-full p-2 bg-white rounded-lg border border-slate-300 text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span>Submission updates risk and records an audit stamp.</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setStepperStep(2)}
                        className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Continue to Evidence &amp; Sign-Off (Step 2)</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* STEP 2: EVIDENCE & SIGN-OFF */}
                {stepperStep === 2 && (
                  <form onSubmit={handleSubmitStepper} className="mt-5 space-y-5">
                    {/* Portfolio of Evidence Link */}
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">Portfolio of Evidence (PoE) Dossier</h4>
                          <p className="text-[11px] text-slate-500">
                            Attach verified registers, minutes, or vouchers supporting quarterly indicator achievements.
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setActiveModal('uploadPoE')}
                          className="text-xs text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Upload className="w-3.5 h-3.5" />
                          <span>Upload New File</span>
                        </button>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                          Select Linked Verified Document
                        </label>
                        <select
                          value={stepperPoeDocId}
                          onChange={(e) => setStepperPoeDocId(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white border border-slate-300 rounded-lg text-slate-800 focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        >
                          <option value="">-- Select from verified repository ({entityDocuments.length} files available) --</option>
                          {entityDocuments.map(doc => (
                            <option key={doc.id} value={doc.id}>
                              {doc.fileName || doc.title} • {doc.category.replace(/_/g, ' ')} ({doc.approvalStatus})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* Section 38 Accounting Officer Sign-Off */}
                    <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-200 space-y-3">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-700" />
                        <h4 className="font-bold text-slate-900 text-xs">
                          Section 38(1)(j) Accounting Officer Statutory Affirmation
                        </h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        I hereby affirm that the programmatic targets, verified actual figures, and operational expenditure of R {spentThisQuarter.toLocaleString()} reported herein for {reportingQuarter} have been audited in accordance with PFMA Section 38(1)(j) and reflect bona fide delivery outputs for {entity.name}.
                      </p>
                      <div className="flex items-center gap-2 pt-1">
                        <input
                          type="checkbox"
                          id="stepperAffirm"
                          checked={stepperAffirmed}
                          onChange={(e) => setStepperAffirmed(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        />
                        <label htmlFor="stepperAffirm" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                          I formally sign and warrant the accuracy of these figures for submission to DSAC National.
                        </label>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setStepperStep(1)}
                        className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>Back to Indicator Values</span>
                      </button>

                      <div className="flex items-center gap-3">
                        <div className="text-xs text-slate-500 hidden sm:flex items-center gap-1.5">
                          <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>Submission updates risk and records an audit stamp.</span>
                        </div>

                        <button
                          type="submit"
                          disabled={!stepperAffirmed}
                          className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs font-bold shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Submit Performance Return to DSAC</span>
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>

              {/* Submitted Returns & Audit History Section */}
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FileCheck2 className="w-5 h-5 text-indigo-600" />
                      <span>Statutory Return Records &amp; DSAC Audit History</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Historical quarterly performance submissions, review comments, and verified expenditure claims.
                    </p>
                  </div>
                  <span className="text-xs bg-slate-100 text-slate-700 font-bold px-2.5 py-1 rounded-lg border border-slate-200">
                    {entityReports.length} Recorded Submissions
                  </span>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  {entityReports.length === 0 ? (
                    <div className="p-6 text-center text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                      <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p>No quarterly statutory reports recorded yet for {entity.shortCode}.</p>
                    </div>
                  ) : (
                    entityReports.map((rep) => {
                      const isApproved = rep.submissionStatus === 'APPROVED';
                      const isUnderReview = rep.submissionStatus === 'SUBMITTED';
                      const isCorrection = rep.submissionStatus === 'CORRECTION_REQUIRED';

                      return (
                        <div
                          key={rep.id}
                          className={`p-4 rounded-xl border transition-all ${
                            isApproved
                              ? 'bg-emerald-50/60 border-emerald-200'
                              : isCorrection
                              ? 'bg-amber-50/60 border-amber-300'
                              : isUnderReview
                              ? 'bg-blue-50/60 border-blue-200'
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="font-bold text-slate-900 text-sm">
                              {rep.quarter} ({rep.quarter === 'Q1' ? 'Apr - Jun' : rep.quarter === 'Q2' ? 'Jul - Sep' : rep.quarter === 'Q3' ? 'Oct - Dec' : 'Jan - Mar'} {rep.financialYear || '2025/2026'}) Performance Return
                            </span>
                            <span
                              className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] w-fit ${
                                isApproved
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : isCorrection
                                  ? 'bg-amber-100 text-amber-800'
                                  : isUnderReview
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {isApproved ? 'Approved by DSAC' : isCorrection ? 'Correction Required' : isUnderReview ? 'Under DSAC Review' : 'Draft'}
                            </span>
                          </div>
                          <p className="text-slate-600 mt-1.5">
                            {rep.varianceExplanations || `Statutory return claiming expenditure of R ${((rep.fundsSpentThisQuarterZAR || 0) / 1_000_000).toFixed(2)}M.`}
                          </p>

                          {rep.items && rep.items.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                              {rep.items.slice(0, 4).map((it) => (
                                <div key={it.id} className="flex items-center justify-between bg-white/70 px-2 py-1 rounded border border-slate-200/60">
                                  <span className="truncate pr-2 text-slate-700">{it.kpiName}</span>
                                  <span className="font-mono font-bold text-slate-900 shrink-0">
                                    {it.actualAchieved} / {it.targetToDate} {it.unit}
                                  </span>
                                </div>
                              ))}
                            </div>
                          )}

                          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400">
                            <span>Submitted: {rep.submittedAt ? rep.submittedAt.split('T')[0] : 'Current Financial Year'}</span>
                            <button
                              type="button"
                              onClick={() => {
                                setStepperStep(1);
                                setReportingQuarter(`${rep.quarter} (${reportingFyLong} Financial Year)`);
                                if (rep.fundsSpentThisQuarterZAR) {
                                  setSpentThisQuarter(rep.fundsSpentThisQuarterZAR);
                                }
                              }}
                              className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs hover:bg-slate-800 transition-colors cursor-pointer"
                            >
                              Load Into Stepper
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 8: DOCUMENTS & POE ================= */}
          {activeSidebar === 'documents' && (
            <div className="space-y-5">
              {/* Sub-tab toggle */}
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-xl max-w-fit">
                <button
                  onClick={() => setPortalDocView('verification')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                    portalDocView === 'verification'
                      ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-4 h-4 text-indigo-600" />
                  <span>Document Verification</span>
                </button>

                <button
                  onClick={() => setPortalDocView('repository')}
                  className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
                    portalDocView === 'repository'
                      ? 'bg-white text-indigo-900 shadow-xs border border-slate-200'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <FolderLock className="w-4 h-4 text-slate-600" />
                  <span>All Files ({entityDocuments.length})</span>
                </button>
              </div>

              {portalDocView === 'verification' ? (
                <DocumentVerificationDossier
                  entityId={entity.id}
                  quarter={reportQuarter}
                  financialYear={yearStats.fiscalTag}
                  isDSACReviewer={false}
                />
              ) : (
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                  <div>
                    <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                      <FolderLock className="w-5 h-5 text-indigo-600" />
                      <span>                      Evidence Repository</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Files uploaded for DSAC review.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveModal('uploadPoE')}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5 transition-colors"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>Upload Document</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 text-xs mt-3">
                  {entityDocuments.length === 0 ? (
                    <div className="py-8 text-center text-slate-400">
                      <FolderLock className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p>No files uploaded yet.</p>
                      <button
                        onClick={() => setActiveModal('uploadPoE')}
                        className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Upload File
                      </button>
                    </div>
                  ) : (
                    entityDocuments.map((doc) => (
                      <div key={doc.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div className="truncate">
                            <div className="font-semibold text-slate-900 truncate">{doc.fileName || doc.title}</div>
                            <div className="text-[10px] text-slate-400">
                              {doc.category.replace(/_/g, ' ')} • {doc.fileSize || '3.5 MB'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            doc.verificationStatus === 'VERIFIED' || doc.approvalStatus === 'APPROVED' ? 'bg-emerald-100 text-emerald-800' :
                            doc.verificationStatus === 'REJECTED' || doc.approvalStatus === 'REQUIRES_AMENDMENT' ? 'bg-rose-100 text-rose-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {doc.verificationStatus === 'VERIFIED' || doc.approvalStatus === 'APPROVED' ? 'Verified Evidence' :
                             doc.verificationStatus === 'REJECTED' || doc.approvalStatus === 'REQUIRES_AMENDMENT' ? 'Rejected / Task Logged' :
                             'Manual Review Pending'}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {doc.uploadedAt ? doc.uploadedAt.split('T')[0] : '14 Jul 2025'}
                          </span>
                          <button
                            onClick={() => setPreviewDocument(doc)}
                            aria-label={`Preview ${doc.fileName || doc.title}`}
                            title="Preview document"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDownloadDoc(doc.id, doc.fileName || doc.title, doc.title, doc.category)}
                            aria-label={`Download ${doc.fileName || doc.title}`}
                            title="Download official file"
                            className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          {doc.approvalStatus !== 'APPROVED' && (
                            <button
                              onClick={() => handleDeleteDoc(doc.id, doc.title)}
                              title="Archive document"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
              )}
            </div>
          )}

          {/* ================= VIEW 9: MESSAGES ================= */}
          {activeSidebar === 'messages' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-indigo-600" />
                    <span>Official DSAC Oversight Communications Channel</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Direct two-way correspondence between Ubuntu Arts NPO and DSAC Reviewers.
                  </p>
                </div>

                <div className="space-y-3 my-4 max-h-96 overflow-y-auto pr-2">
                  {messagesList.map((m) => (
                    <div
                      key={m.id}
                      className={`p-3 rounded-xl text-xs ${
                        m.isDsac
                          ? 'bg-indigo-50/70 border border-indigo-200 ml-0 mr-12'
                          : 'bg-emerald-50/70 border border-emerald-200 ml-12 mr-0'
                      }`}
                    >
                      <div className="flex items-center justify-between font-bold mb-1">
                        <span className={m.isDsac ? 'text-indigo-950' : 'text-emerald-950'}>
                          {m.sender}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.time}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{m.content}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2 pt-2 border-t border-slate-100">
                  <input
                    type="text"
                    placeholder="Type official inquiry or response..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-600"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* ================= VIEW 10: CALENDAR ================= */}
          {activeSidebar === 'calendar' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span>Statutory Submission Deadlines Calendar ({yearStats.fiscalTag})</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical dates for compliance, reports, and financial bids under Vote 37.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  {complianceItems.filter(item => item.date.startsWith('Due:')).map((item, index) => (
                    <div key={`${item.title}-${index}`} className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between gap-3 font-bold text-slate-900">
                        <span>{item.title}</span>
                        <span className="shrink-0">{item.date.replace('Due: ', '')}</span>
                      </div>
                      <div className="text-slate-600 mt-1">{item.desc}</div>
                      <span className={`inline-block mt-2 px-2 py-0.5 rounded-full text-[10px] font-bold ${item.color}`}>{item.status}</span>
                    </div>
                  ))}
                  {complianceItems.filter(item => item.date.startsWith('Due:')).length === 0 && (
                    <div className="col-span-2 p-6 text-center text-slate-500">No deadlines are currently recorded for this organisation.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 11: HELP & SUPPORT ================= */}
          {activeSidebar === 'help' && (
            <div className="space-y-5">
              <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
                <div className="pb-4 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-indigo-600" />
                    <span>Statutory Helpdesk &amp; Guidelines Directory</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Standard operating procedures, PFMA guidance, and institutional support.
                  </p>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm mb-1">
                      PFMA Act No. 1 of 1999: Section 38 Responsibilities
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Accounting officers and authorized representatives must ensure the institution maintains effective, efficient, and transparent financial management and internal control systems.
                    </p>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 text-sm mb-1">
                      DSAC Oversight Directorate Contact Desk
                    </div>
                    <div className="text-slate-600 space-y-1">
                      <div>Director: Sicelo Sakhile Mkhize (DSAC Oversight)</div>
                      <div>Chief Reviewer: Thandi Mokoena (t.mokoena@dsac.gov.za)</div>
                      <div>Helpline: +27 (0)12 441 3000 • Sechaba House, 202 Madiba St, Pretoria</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer matching image.png */}
        <footer className="mt-auto bg-white border-t border-slate-200 px-6 py-3 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 shrink-0">
          <span className="text-slate-600 font-medium text-center sm:text-left">
            Partnering for a Vibrant, Inclusive and United Cultural and Creative Sector.
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            Ubuntu Arts NPO | Last login: 09 Aug 2025 09:42
          </span>
        </footer>
      </div>

      {/* ================= MODALS ================= */}

      {/* Modal 1: Upload PoE Document */}
      {activeModal === 'uploadPoE' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Upload Evidence File</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUploadDocument} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ubuntu_Arts_Q2_Workshops_Attendance_Register"
                  value={uploadDocTitle}
                  onChange={(e) => setUploadDocTitle(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Document Category</label>
                  <select
                    value={uploadDocCategory}
                    onChange={(e) => setUploadDocCategory(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="PORTFOLIO_OF_EVIDENCE">Quarterly Portfolio of Evidence (PoE)</option>
                    <option value="GOVERNANCE_CHARTER">Governance &amp; Board Resolution</option>
                    <option value="FINANCIAL_REPORT">Audited Financial Statements (AFS)</option>
                    <option value="OPERATIONAL_PLAN">Annual Performance Plan (APP)</option>
                    <option value="ANNUAL_REPORT">Annual Statutory Report</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Selected File Size</label>
                  <div className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                    {selectedUploadFile ? uploadFileSize : 'Choose a file to see its size'}
                  </div>
                </div>
              </div>

              {/* Upload Drop Zone / Input */}
              <div className="p-4 border-2 border-dashed border-indigo-200 rounded-xl bg-indigo-50/40 text-center space-y-2 relative">
                <input
                  type="file"
                  accept=".pdf,.xlsx,.csv,.docx"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedUploadFile(file);
                      setUploadFileName(file.name);
                      if (!uploadDocTitle) setUploadDocTitle(file.name.replace(/\.[^/.]+$/, ""));
                      const mb = (file.size / (1024 * 1024)).toFixed(1);
                      setUploadFileSize(`${mb} MB`);
                    }
                  }}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <UploadCloud className="w-7 h-7 text-indigo-600 mx-auto" />
                <div className="font-bold text-slate-800">
                  {uploadFileName ? uploadFileName : "Click or drag & drop evidence file here"}
                </div>
                <div className="text-[10px] text-slate-500">
                  Supported: PDF, DOCX, XLSX, CSV
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Executive Summary / Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Add a short note about this file..."
                  value={uploadSummary}
                  onChange={(e) => setUploadSummary(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="flex items-start gap-2 pt-1">
                <input
                  type="checkbox"
                  id="section38affirm"
                  checked={section38Confirmed}
                  onChange={(e) => setSection38Confirmed(e.target.checked)}
                  className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="section38affirm" className="text-[11px] text-slate-600 select-none">
                  I confirm this file is accurate and submitted under PFMA Section 38(1)(j).
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setActiveModal(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={!section38Confirmed}
                  className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 disabled:opacity-50 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  Upload &amp; Log to DSAC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {previewDocument && (() => {
        const currentVersion = previewDocument.versions.find(version => version.versionNumber === previewDocument.currentVersion);
        const source = currentVersion?.contentDataUrl;
        const mimeType = currentVersion?.mimeType || 'application/octet-stream';
        const canEmbed = Boolean(source && (mimeType === 'application/pdf' || mimeType.startsWith('image/')));
        return (
          <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-5xl w-full h-[85vh] shadow-2xl border border-slate-200 p-4 flex flex-col">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-sm text-slate-900">{previewDocument.title}</h3>
                  <p className="text-[10px] text-slate-500">{previewDocument.fileName}</p>
                </div>
                <button onClick={() => setPreviewDocument(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex-1 min-h-0 mt-3 rounded-lg bg-slate-50 border border-slate-200 overflow-hidden flex items-center justify-center">
                {canEmbed ? (
                  mimeType === 'application/pdf' ? (
                    <iframe title={`Preview of ${previewDocument.fileName}`} src={source} className="w-full h-full" />
                  ) : (
                    <img src={source} alt={previewDocument.title} className="max-w-full max-h-full object-contain" />
                  )
                ) : (
                  <div className="text-center p-6 text-sm text-slate-600">
                    <FileText className="w-10 h-10 mx-auto mb-2 text-slate-400" />
                    <p>This file type cannot be displayed in the browser.</p>
                    <button
                      onClick={() => handleDownloadDoc(previewDocument.id, previewDocument.fileName || previewDocument.title, previewDocument.title, previewDocument.category)}
                      className="mt-3 px-3 py-2 bg-indigo-700 text-white rounded-lg text-xs font-semibold"
                    >
                      Download original file
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal 2: Submit a Report */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Submit Performance Report</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleReportSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Quarterly Cycle</label>
                  <select
                    value={reportQuarter}
                    onChange={(e) => setReportQuarter(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  >
                    <option value="Q1">Quarter 1 (Apr - Jun 2025)</option>
                    <option value="Q2">Quarter 2 (Jul - Sep 2025)</option>
                    <option value="Q3">Quarter 3 (Oct - Dec 2025)</option>
                    <option value="Q4">Quarter 4 (Jan - Mar 2026)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Expenditure Claimed (ZAR)</label>
                  <input
                    type="number"
                    value={reportExpenditure}
                    onChange={(e) => setReportExpenditure(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg font-bold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Linked Portfolio of Evidence (PoE)</label>
                <select
                  value={reportPoeDocId}
                  onChange={(e) => setReportPoeDocId(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                >
                  <option value="">-- Select uploaded statutory evidence document --</option>
                  {entityDocuments.map(doc => (
                    <option key={doc.id} value={doc.id}>
                      {doc.fileName || doc.title} ({doc.category.replace(/_/g, ' ')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Accounting Officer Declaration</label>
                <textarea
                  rows={2}
                  value={reportDeclaration}
                  onChange={(e) => setReportDeclaration(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-600"
                />
              </div>

              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-900 flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  Submitting this statutory report triggers automated cross-reconciliation with the Department Oversight Dashboard and updates Section 38 risk calculation.
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg font-semibold shadow-xs transition-colors">
                  Sign &amp; Transmit to DSAC
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Shared Support Request Modal */}
      {(showSupportModal || activeModal === 'support') && (
        <SupportRequestModal
          entityId={entity.id}
          entityName={entity.name}
          onClose={() => {
            setShowSupportModal(false);
            setActiveModal(null);
          }}
          onSuccess={() => {
            setShowSupportModal(false);
            setActiveModal(null);
            setActionSuccess('Support Request submitted and dispatched to DSAC Oversight Register.');
          }}
        />
      )}

      {/* Shared Capture KPI Actual Modal */}
      {selectedKpiForCapture && (
        <CaptureKpiActualModal
          kpi={selectedKpiForCapture}
          onClose={() => setSelectedKpiForCapture(null)}
          onSuccess={() => {
            setActionSuccess(`KPI "${selectedKpiForCapture.name}" actual updated and synchronized with DSAC.`);
            setSelectedKpiForCapture(null);
          }}
        />
      )}

      {/* Shared Capture Expenditure Modal */}
      {showExpenditureModal && (
        <CaptureExpenditureModal
          entityId={entity.id}
          entityName={entity.name}
          annualBudget={yearStats.budgetAllocated}
          financialYear={yearStats.fiscalTag}
          onClose={() => setShowExpenditureModal(false)}
          onSuccess={() => {
            setShowExpenditureModal(false);
            setActionSuccess('Quarterly expenditure return certified and transmitted to DSAC.');
          }}
        />
      )}

    </div>
  );
};
