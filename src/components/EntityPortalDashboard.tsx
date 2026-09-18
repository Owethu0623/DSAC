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
  Paperclip
} from 'lucide-react';
import { store } from '../services/store';
import { FinancialQuarter } from '../types';
import { normalizeFinancialYear, normalizeQuarter } from '../services/calculationEngine';
import { UbuntuArtsLogo } from './UbuntuArtsLogo';
import { downloadStatutoryDocument } from '../services/downloadHelper';
import { DocumentVerificationDossier } from './DocumentVerificationDossier';
import { EntityFinancialView } from './features/EntityFinancialView';
import { EntityVisualAnalytics } from './features/EntityVisualAnalytics';

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
  const [, setTick] = useState(0);
  useEffect(() => {
    return store.subscribe(() => setTick(t => t + 1));
  }, []);

  const [activeSidebar, setActiveSidebar] = useState<string>('overview');
  const [selectedYear, setSelectedYear] = useState<string>('2025/26 Financial Year');
  const [selectedQuarter, setSelectedQuarter] = useState<FinancialQuarter | 'FULL_YEAR'>('Q3');
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  // Modals
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Resolve current entity from store
  const [selectedEntityId, setSelectedEntityId] = useState<string>(() => {
    return entityId || store.currentUser?.entityId || 'ent-sahra';
  });

  useEffect(() => {
    if (entityId) {
      setSelectedEntityId(entityId);
    }
  }, [entityId]);

  const entity = store.entities.find(e => e.id === selectedEntityId) || store.entities.find(e => e.id === 'ent-sahra') || store.entities[0];
  const entityKPIs = store.kpis.filter(k => k.entityId === entity.id);
  const entityDocuments = store.documents.filter(d => d.entityId === entity.id);
  const entityReports = store.reports.filter(r => r.entityId === entity.id);

  // Performance Return Ingestion Stepper State (Entity Side)
  const [stepperStep, setStepperStep] = useState<1 | 2>(1);
  const [reportingQuarter, setReportingQuarter] = useState<string>('Q3 (2025/2026 Financial Year)');
  const [spentThisQuarter, setSpentThisQuarter] = useState<number>(entity.shortCode === 'SAHRA' ? 24800000 : 1200000);
  const [stepperKpiEntries, setStepperKpiEntries] = useState<Record<string, { actual: number; varianceReason: string; correctiveAction: string }>>({});
  const [stepperPoeDocId, setStepperPoeDocId] = useState<string>('');
  const [stepperAffirmed, setStepperAffirmed] = useState<boolean>(true);
  const [stepperSuccessMessage, setStepperSuccessMessage] = useState<string | null>(null);

  // Sync spentThisQuarter and KPI entries whenever entity changes
  useEffect(() => {
    setSpentThisQuarter(entity.shortCode === 'SAHRA' ? 24800000 : 1200000);
    const initialEntries: Record<string, { actual: number; varianceReason: string; correctiveAction: string }> = {};
    entityKPIs.forEach(k => {
      const defaultActual = entity.shortCode === 'SAHRA' && k.name.includes('Sites') ? 38 :
                            entity.shortCode === 'SAHRA' && k.name.includes('Workshops') ? 33 :
                            k.currentValue;
      initialEntries[k.id] = {
        actual: defaultActual,
        varianceReason: defaultActual < k.expectedValue ? 'Reason for delay or over-achievement' : '',
        correctiveAction: defaultActual < k.expectedValue ? 'Corrective steps planned for next quarter' : '',
      };
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
    const updatedItems = entityKPIs.map(kpi => {
      const entry = stepperKpiEntries[kpi.id] || { actual: kpi.currentValue, varianceReason: '', correctiveAction: '' };
      const target = kpi.expectedValue;
      const actual = Number(entry.actual) || 0;
      const variance = target > 0 ? Math.round(((actual - target) / target) * 1000) / 10 : 0;
      return {
        id: `item-${kpi.id}-${Date.now()}`,
        kpiId: kpi.id,
        kpiName: kpi.name,
        targetToDate: target,
        actualAchieved: actual,
        unit: kpi.unitOfMeasure,
        status: (actual >= target ? 'ON_TRACK' : actual >= target * 0.8 ? 'AT_RISK' : 'MISSED') as any,
        variancePercentage: variance,
        varianceReason: entry.varianceReason || 'Documented in Portfolio of Evidence.',
        correctiveAction: entry.correctiveAction || 'Corrective steps planned for next quarter.',
      };
    });

    const quarterCode = (reportingQuarter.includes('Q3') ? 'Q3' : reportingQuarter.includes('Q2') ? 'Q2' : reportingQuarter.includes('Q1') ? 'Q1' : 'Q4') as any;
    const existingReport = entityReports.find(r => r.quarter === quarterCode);

    if (existingReport) {
      store.submitReport(existingReport.id, updatedItems, spentThisQuarter);
    } else {
      store.submitQuarterlyReport({
        entityId: entity.id,
        quarter: quarterCode,
        financialYear: '2025/2026',
        expenditureClaimedZAR: spentThisQuarter,
        declarationNotes: `Q3 statutory performance return submitted with verified figures and Section 38(1)(j) sign-off.`,
        poeDocId: stepperPoeDocId || entityDocuments[0]?.id,
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
  const [uploadFileSize, setUploadFileSize] = useState('4.2 MB');
  const [uploadSummary, setUploadSummary] = useState('');
  const [section38Confirmed, setSection38Confirmed] = useState(true);

  // File selection & drag-and-drop helper
  const handleFileSelected = (file: File) => {
    setUploadFileName(file.name);
    const cleanName = file.name.replace(/\.[^/.]+$/, "");
    if (!uploadDocTitle || uploadDocTitle === 'Section 38 Portfolio Evidence') {
      setUploadDocTitle(cleanName);
    }
    const bytes = file.size;
    const formattedSize = bytes < 1000000 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
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
  const [reportQuarter, setReportQuarter] = useState<'Q1' | 'Q2' | 'Q3' | 'Q4'>('Q2');
  const [reportExpenditure, setReportExpenditure] = useState('1200000');
  const [reportPoeDocId, setReportPoeDocId] = useState('');
  const [reportDeclaration, setReportDeclaration] = useState('I hereby affirm that the programmatic targets and expenditure reported reflect verified records in accordance with PFMA Section 38.');

  // Form states for interactive sub-views
  const [supportType, setSupportType] = useState('Financial Support');
  const [supportAmount, setSupportAmount] = useState('150000');
  const [supportMotivation, setSupportMotivation] = useState('Funding for provincial community arts roadshow workshops');

  const [newMessage, setNewMessage] = useState('');
  const [messagesList, setMessagesList] = useState([
    {
      id: 1,
      sender: 'Thandi Mokoena (DSAC Oversight Reviewer)',
      time: 'Today, 09:15',
      content: 'Good morning Lerato. We have verified your Q1 Portfolio of Evidence. Please ensure the Q2 Youth Arts workshop attendance register includes ID numbers for PFMA Section 38 compliance.',
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

  // Organisation Profile State - Statutory identifiers are strictly final
  const [orgProfile, setOrgProfile] = useState({
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
  });

  // KPI actuals state for interactive updating
  const [kpiActuals, setKpiActuals] = useState({
    programmes: 12,
    youth: 850,
    practitioners: 95,
    schools: 28,
    exhibitions: 8,
    trainings: 14,
    femaleLed: 68,
    accessibility: 88,
  });

  // Dynamic Year & Quarter Based Stats strictly synchronized with Department Dashboard
  const yearStats = useMemo(() => {
    const normYear = selectedYear.includes('2024') ? '2024/25' :
                     selectedYear.includes('2023') ? '2023/24' :
                     selectedYear.includes('2026') ? '2026/27' : '2025/26';

    const isAudited = normYear === '2024/25' || normYear === '2023/24';
    const fin = store.getEntityFinancialSummary(entity.id, normYear, selectedQuarter);
    const perf = store.getEntityPerformanceSummary(entity.id, normYear, selectedQuarter);

    return {
      yearLabel: `${normYear} Financial Year`,
      fiscalTag: normYear,
      quarterLabel: selectedQuarter === 'FULL_YEAR' ? 'Full Year' : selectedQuarter,
      budgetAllocated: fin.approvedAmount,
      transferred: isAudited ? fin.approvedAmount : (entity.transferredAmountZAR || fin.approvedAmount),
      expenditure: fin.ytdActual,
      utilPercent: fin.utilisationPercent,
      remaining: Math.max(0, fin.remainingBudget),
      complianceStatus: 'On Track',
      complianceScore: isAudited ? 100 : (entity.overallComplianceScore || 88),
      upcomingDueDates: isAudited ? 0 : 2,
      overdueItems: isAudited ? 0 : 1,
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
      auditOutcome: isAudited ? 'Clean Audit (Unqualified)' : (entity.auditOutcome || 'Clean Audit'),
      badge: isAudited ? 'Audited & Closed' : 'Active Financial Year',
    };
  }, [selectedYear, selectedQuarter, entity]);

  const currentUser = store.currentUser || {
    name: 'Lerato Phiri',
    role: 'ENTITY_OFFICER',
    designation: 'Organisation Admin',
    email: 'l.phiri@ubuntuarts.org.za',
    entityName: 'Ubuntu Arts NPO',
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = uploadDocTitle.trim() || uploadFileName.replace(/\.[^/.]+$/, "") || 'Section 38 Portfolio Evidence';
    const finalFileName = uploadFileName.trim() || `${finalTitle.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
    const numBytes = Math.round((parseFloat(uploadFileSize) || 3.5) * 1024 * 1024);

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
        file: {
          name: finalFileName,
          size: numBytes,
          type: 'application/pdf',
        },
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
    setUploadSummary('');
    setTimeout(() => setActionSuccess(null), 4000);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const spentAmount = parseFloat(reportExpenditure) || 1200000;
    store.submitQuarterlyReport({
      entityId: entity.id,
      quarter: reportQuarter,
      financialYear: yearStats.fiscalTag,
      expenditureClaimedZAR: spentAmount,
      declarationNotes: reportDeclaration,
      poeDocId: reportPoeDocId || entityDocuments[0]?.id,
    });

    setActionSuccess(`Quarter ${reportQuarter} Statutory Performance Report submitted to DSAC with expenditure of R ${(spentAmount / 1_000_000).toFixed(2)}M.`);
    setActiveModal(null);
    setTimeout(() => setActionSuccess(null), 3500);
  };

  const handleSaveKpiActuals = () => {
    if (entity) {
      entity.jobStats = {
        ...entity.jobStats,
        youthJobsCreated: kpiActuals.youth,
        youthEmployed: kpiActuals.youth,
        creativeSectorPractitionersSupported: kpiActuals.practitioners,
      };
      const totalRatio = (
        (kpiActuals.programmes / 15) +
        (kpiActuals.youth / 1000) +
        (kpiActuals.practitioners / 120) +
        (kpiActuals.schools / 40)
      ) / 4;
      entity.overallComplianceScore = Math.min(100, Math.round(75 + totalRatio * 25));
      store.recalculateEntityRisk(entity.id);
      store.persistAll();
    }
    setActionSuccess('Quarterly KPI actuals updated, risk recalculated, and synchronized with DSAC.');
    setTimeout(() => setActionSuccess(null), 2500);
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

  const handleDownloadDoc = (fileName: string, title: string, category: string) => {
    downloadStatutoryDocument(fileName, title, category, entity.name);
    setActionSuccess(`Downloaded authentic copy of "${fileName}".`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const handleDeleteDoc = (docId: string, title: string) => {
    store.deleteEntityDocument(docId);
    setActionSuccess(`Archived document "${title}".`);
    setTimeout(() => setActionSuccess(null), 2500);
  };

  const sidebarItems = [
    { id: 'overview', label: 'Overview', icon: Building },
    { id: 'organisation', label: 'My Organisation', icon: Building },
    { id: 'compliance', label: 'Compliance', icon: ShieldCheck },
    { id: 'kpis', label: 'Targets & KPIs', icon: Target },
    { id: 'budget', label: 'Budget & Utilization', icon: Coins },
    { id: 'support', label: 'Support Requests', icon: HandCoins },
    { id: 'submissions', label: 'Reports Submission', icon: FileText },
    { id: 'documents', label: 'Documents', icon: FolderLock },
    { id: 'messages', label: 'Messages', icon: MessageSquare },
    { id: 'calendar', label: 'Calendar', icon: Calendar, badge: 2 },
    { id: 'help', label: 'Help & Support', icon: HelpCircle },
  ];

  const handleSupportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setActionSuccess('Support Request submitted successfully to DSAC Oversight Directorate.');
    setTimeout(() => {
      setActionSuccess(null);
      setActiveModal(null);
    }, 1500);
  };

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
                onChange={(e) => setSelectedEntityId(e.target.value)}
                className="text-xs bg-slate-50 hover:bg-slate-100 border border-slate-300 rounded-lg px-2.5 py-1.5 font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500 focus:outline-hidden cursor-pointer"
                title="Select Reporting Entity"
              >
                {store.entities.map(e => (
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
                      Portal Notifications &amp; Alerts
                    </span>
                    <span className="text-[10px] text-slate-400 font-normal">Real-Time Sync</span>
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
                          <span>Section 38 Statutory Repository</span>
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
                        Quarter 2 Performance Report Due
                      </div>
                      <div className="text-[10px] text-amber-700 mt-0.5">
                        Statutory submission deadline: 15 Oct 2025 (in 18 days). PoE register required.
                      </div>
                    </div>

                    <div 
                      onClick={() => { setActiveSidebar('budget'); setShowNotifications(false); }}
                      className="p-2.5 bg-emerald-50/80 hover:bg-emerald-100/60 rounded-lg border border-emerald-200 text-emerald-900 cursor-pointer transition-colors"
                    >
                      <div className="font-bold text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        Tranche 2 Disbursed: R 1 700 000
                      </div>
                      <div className="text-[10px] text-emerald-700 mt-0.5">
                        Funds cleared into Standard Bank account under Vote 40 BAS allocation.
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
                      if (newYr.includes('2024') || newYr.includes('2023')) {
                        setSelectedQuarter('FULL_YEAR');
                      }
                    }}
                    className="text-xs font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-hidden cursor-pointer"
                  >
                    <option>2025/26 Financial Year</option>
                    <option>2024/25 Financial Year</option>
                    <option>2023/24 Financial Year</option>
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

              {/* Visual Analytics: Performance Status & Budget Utilisation Pie Charts */}
              <EntityVisualAnalytics
                entityId={entity.id}
                financialYear={
                  selectedYear.includes('2026') ? '2026/27' :
                  selectedYear.includes('2024') ? '2024/25' :
                  selectedYear.includes('2023') ? '2023/24' :
                  '2025/26'
                }
                initialQuarter={selectedQuarter}
                selectedQuarter={selectedQuarter}
                onQuarterChange={(q) => setSelectedQuarter(q)}
                showQuarterSelector={true}
                showYearSelector={true}
                onYearChange={(newYear) => {
                  if (newYear.includes('2024')) setSelectedYear('2024/25 Financial Year');
                  else if (newYear.includes('2023')) setSelectedYear('2023/24 Financial Year');
                  else if (newYear.includes('2026')) setSelectedYear('2026/27 Financial Year');
                  else setSelectedYear('2025/26 Financial Year');
                }}
              />

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
                      National Treasury statutory compliance checklist for public funds recipients.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full font-bold text-xs">
                      100% On Track
                    </span>
                  </div>
                </div>

                <div className="divide-y divide-slate-100 text-xs mt-3">
                  {[
                    {
                      title: 'PFMA Section 38 Compliance Certificate',
                      desc: 'Written assurance of effective, efficient and transparent financial systems',
                      status: 'Verified',
                      date: 'Exp: 31 Mar 2026',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'SARS Tax Compliance Pin (TCS)',
                      desc: 'Active Good Standing verified via SARS eFiling system',
                      status: 'Active',
                      date: 'Exp: 14 Nov 2025',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'Annual Audited Financial Statements (AFS)',
                      desc: 'Audited by independent registered auditor (Clean Audit opinion)',
                      status: 'Approved',
                      date: 'Submitted 31 Jul 2025',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'B-BBEE Sworn Affidavit / Certificate',
                      desc: 'Level 1 Contributor with 100% Black Ownership verification',
                      status: 'Valid',
                      date: 'Exp: 10 Jan 2026',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                    {
                      title: 'Protection of Personal Information Act (POPIA)',
                      desc: 'Registered Information Officer with the Information Regulator',
                      status: 'Registered',
                      date: 'Active',
                      color: 'bg-indigo-100 text-indigo-800',
                    },
                    {
                      title: 'Quarter 1 Performance Report & PoE',
                      desc: 'Validated and accepted by DSAC Oversight Desk',
                      status: 'Approved',
                      date: '15 Jul 2025',
                      color: 'bg-emerald-100 text-emerald-800',
                    },
                  ].map((item, i) => (
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
                      <span>Targets &amp; Key Performance Indicators (2025/26)</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Input quarterly actuals and compute performance achievement rates.
                    </p>
                  </div>
                  <button
                    onClick={handleSaveKpiActuals}
                    className="px-4 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                  >
                    Save &amp; Submit Actuals
                  </button>
                </div>

                <div className="space-y-4 mt-4 text-xs">
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">1. Community arts programmes implemented</span>
                      <span className="text-xs font-bold text-teal-700">Target: 15 programmes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.programmes}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, programmes: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.programmes / 15) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">2. Youth participants trained in creative arts</span>
                      <span className="text-xs font-bold text-teal-700">Target: 1 000 participants</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.youth}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, youth: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.youth / 1000) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">3. Creative sector practitioners supported</span>
                      <span className="text-xs font-bold text-teal-700">Target: 120 practitioners</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.practitioners}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, practitioners: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.practitioners / 120) * 100)}%)</span>
                    </div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-slate-900">4. Arts education workshops in community schools</span>
                      <span className="text-xs font-bold text-teal-700">Target: 40 workshops</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        value={kpiActuals.schools}
                        onChange={(e) => setKpiActuals({ ...kpiActuals, schools: parseInt(e.target.value) || 0 })}
                        className="w-28 p-2 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                      />
                      <span className="text-slate-500">Achieved to date ({Math.round((kpiActuals.schools / 40) * 100)}%)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 5: BUDGET & FINANCIAL UTILIZATION ================= */}
          {activeSidebar === 'budget' && (
            <EntityFinancialView
              entityId={entity.id}
              financialYear={selectedYear.includes('2024') ? '2024/25' : selectedYear.includes('2025') ? '2025/26' : '2026/27'}
              readOnly={false}
            />
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
                    onClick={() => setActiveModal('support')}
                    className="px-4 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs rounded-lg shadow-xs flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create New Request</span>
                  </button>
                </div>

                <div className="space-y-3 mt-4 text-xs">
                  <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">Provincial Arts Showcase Support</span>
                        <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-bold">
                          Under Review
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        Financial grant request of R 150 000 for rural community outreach workshops in Limpopo &amp; Mpumalanga.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Submitted: 10 Sep 2025 • Reference: REQ-2025-084</div>
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900">M&amp;E Technical Advisory &amp; PoE Verification</span>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          Approved &amp; Scheduled
                        </span>
                      </div>
                      <div className="text-slate-600 mt-1">
                        Technical support from DSAC M&amp;E specialist to audit attendance registers and compliance tools.
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">Approved by: Thandi Mokoena • Date: 28 Aug 2025</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ================= VIEW 7: REPORTS SUBMISSION & STEPPER ================= */}
          {activeSidebar === 'submissions' && (
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
                      Enter verified quarterly figures, document variance justifications, and submit for DSAC National sign-off.
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
                          <option value="Q3 (2025/2026 Financial Year)">Q3 (2025/2026 Financial Year)</option>
                          <option value="Q2 (2025/2026 Financial Year)">Q2 (2025/2026 Financial Year)</option>
                          <option value="Q1 (2025/2026 Financial Year)">Q1 (2025/2026 Financial Year)</option>
                          <option value="Q4 (2025/2026 Financial Year)">Q4 (2025/2026 Financial Year)</option>
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
                          placeholder="e.g. 24800000"
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
                        <span>Submission triggers automated risk recalculation and immutable audit stamp.</span>
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
                          <span>Submission triggers automated risk recalculation and immutable audit stamp.</span>
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
                            {rep.varianceExplanations || `Statutory return claiming expenditure of R ${((rep.fundsSpentThisQuarterZAR || 24800000) / 1_000_000).toFixed(2)}M.`}
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
                                setReportingQuarter(`${rep.quarter} (2025/2026 Financial Year)`);
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
                  <span>Section 38 Statutory Verification Dossier</span>
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
                  <span>All Uploaded Files &amp; Archive ({entityDocuments.length})</span>
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
                      <span>Portfolio of Evidence &amp; Governance Repository</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Statutory evidence documents uploaded under Section 38 audit verification.
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
                      <p>No statutory evidence documents uploaded yet.</p>
                      <button
                        onClick={() => setActiveModal('uploadPoE')}
                        className="mt-2 px-3 py-1 bg-indigo-50 text-indigo-700 font-bold rounded-lg hover:bg-indigo-100 transition-colors"
                      >
                        Upload Section 38 Document
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
                            onClick={() => handleDownloadDoc(doc.fileName || doc.title, doc.title, doc.category)}
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
                    <span>Statutory Submission Deadlines Calendar (FY 2025/26)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Critical dates for compliance, reports, and financial bids under Vote 37.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 text-xs">
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200">
                    <div className="flex items-center justify-between font-bold text-amber-900">
                      <span>Quarter 2 Performance Report</span>
                      <span>15 Oct 2025</span>
                    </div>
                    <div className="text-amber-800 mt-1">18 days remaining. Upload all Q2 attendance registers and signed PoE.</div>
                  </div>

                  <div className="p-4 bg-blue-50 rounded-xl border border-blue-200">
                    <div className="flex items-center justify-between font-bold text-blue-900">
                      <span>Mid-Year Financial Statement</span>
                      <span>30 Oct 2025</span>
                    </div>
                    <div className="text-blue-800 mt-1">Reconciliation of R 3.2M expenditure and general ledger extract.</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>2026/27 Strategic Plan Update</span>
                      <span>30 Nov 2025</span>
                    </div>
                    <div className="text-slate-600 mt-1">Statutory MTEF planning window for the upcoming fiscal cycle.</div>
                  </div>

                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>Quarter 3 Performance Report</span>
                      <span>15 Jan 2026</span>
                    </div>
                    <div className="text-slate-600 mt-1">Submissions for October to December activities and holiday arts festival.</div>
                  </div>
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
                      <div>Director: Sicelo Sakhile Mkhize (sakhilesicelo94@gmail.com)</div>
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
                <span>Upload Verified Statutory Document &amp; PoE</span>
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
                  <label className="block font-semibold text-slate-700 mb-1">Simulated File Size</label>
                  <select
                    value={uploadFileSize}
                    onChange={(e) => setUploadFileSize(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="2.4 MB">2.4 MB (Standard PDF)</option>
                    <option value="4.2 MB">4.2 MB (Comprehensive PoE)</option>
                    <option value="6.8 MB">6.8 MB (Audited Statements)</option>
                    <option value="850 KB">850 KB (Certificate / Pin)</option>
                  </select>
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
                  Supported formats: PDF registers, signed resolutions, financial statements
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Executive Summary / Audit Notes</label>
                <textarea
                  rows={2}
                  placeholder="Summary of participant verification, Section 38 audit trail, and vouchers attached..."
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
                  I affirm that this statutory evidence is submitted in compliance with Section 38(1)(j) of the PFMA and represents verified institutional activities.
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

      {/* Modal 2: Submit a Report */}
      {activeModal === 'report' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Submit Statutory Performance Report</span>
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

      {/* Modal 3: Request Support */}
      {activeModal === 'support' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 p-5 space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <HandCoins className="w-4 h-4 text-emerald-600" />
                <span>Submit Institutional Support Request</span>
              </h3>
              <button onClick={() => setActiveModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSupportSubmit} className="space-y-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Support Category</label>
                <select
                  value={supportType}
                  onChange={(e) => setSupportType(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                >
                  <option>Financial Support (Top-up grant)</option>
                  <option>Technical Advisory &amp; M&amp;E Assistance</option>
                  <option>Governance &amp; Audit Compliance Help</option>
                  <option>Equipment &amp; Venue Support</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estimated Value / Amount (ZAR)</label>
                <input
                  type="number"
                  value={supportAmount}
                  onChange={(e) => setSupportAmount(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivation / Justification</label>
                <textarea
                  rows={3}
                  value={supportMotivation}
                  onChange={(e) => setSupportMotivation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setActiveModal(null)} className="px-3 py-1.5 border rounded-lg text-slate-600">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-1.5 bg-emerald-700 text-white rounded-lg font-semibold">
                  Transmit Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
