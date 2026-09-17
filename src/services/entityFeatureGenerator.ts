import { PublicEntity, KPIRecord, QuarterlyReport, RiskLevel, AuditOutcome } from '../types';

export interface EntityFeatureDossier {
  entity: PublicEntity;
  compliance: {
    score: number;
    status: 'Compliant' | 'Remediation' | 'Intervention Required';
    auditOutcome: AuditOutcome;
    auditYear: string;
    auditFindingTitle: string;
    auditFindingDetails: string;
    validatedCount: number;
    totalChecklistItems: number;
    checklist: Array<{
      label: string;
      status: 'Compliant' | 'Verified' | 'Submitted' | 'Overdue' | 'Under Review';
      date: string;
      category: string;
    }>;
  };
  performance: {
    deliveryRate: number;
    kpis: Array<{
      id: string;
      name: string;
      programme: string;
      description: string;
      baseline: number;
      annualTarget: number;
      unit: string;
      q1Target: number;
      q1Actual: number;
      q2Target: number;
      q2Actual: number;
      q3Target: number;
      q3Actual: number;
      q4Target: number;
      currentValue: number;
      percentageAchieved: number;
      status: 'ON_TRACK' | 'AT_RISK' | 'MISSED' | 'COMPLETED';
      varianceExplanation: string;
      correctiveAction: string;
    }>;
    mtsfJobsTotal: number;
    targetJobsTotal: number;
    youthJobs: number;
    practitionersSupported: number;
  };
  funding: {
    approvedBudgetZAR: number;
    transferredAmountZAR: number;
    transferredPercent: number;
    reportedExpenditureZAR: number;
    balancePendingZAR: number;
    utilizationRate: number; // expenditure / transferred
    burnRate: number; // expenditure / approved
    tranches: Array<{
      quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
      percentage: number;
      amountZAR: number;
      status: 'DISBURSED' | 'RECONCILED' | 'PENDING_GATE';
      disbursedDate: string;
      notes: string;
    }>;
    decemberStatutoryBudget: {
      currentYearSubmission: {
        submittedDate: string;
        status: string;
        q1TrancheZAR: number;
        q2TrancheZAR: number;
        q3TrancheZAR: number;
        q4TrancheZAR: number;
        totalZAR: number;
      };
      followingYearSubmission: {
        submittedDate: string;
        status: string;
        projectedBudgetZAR: number;
        mtefTablingStatus: string;
      };
    };
  };
  reports: {
    quarterlySubmissions: Array<{
      quarter: 'Q1' | 'Q2' | 'Q3' | 'Q4';
      year: string;
      status: 'APPROVED' | 'VERIFIED' | 'UNDER_REVIEW' | 'CORRECTION_REQUIRED' | 'OVERDUE' | 'SCHEDULED';
      submittedDate?: string;
      submittedBy: string;
      reviewer: string;
      poeStatus: 'Verified with stamped PoE' | 'Under DSAC Review' | 'Correction Required' | 'Overdue - No Evidence';
      fundsSpentZAR: number;
    }>;
    statutoryDecemberBudgetDossier: {
      title: string;
      mandateRef: string;
      currentYearStatus: string;
      followingYearStatus: string;
      accountingOfficerSignoff: string;
      parliamentaryTablingDate: string;
    };
  };
  risks: {
    level: RiskLevel;
    score: number;
    headline: string;
    reason: string;
    contributingFactors: string[];
    governanceImplications: string;
    recommendedAction: string;
    interventionStatus: string;
  };
  leadership: {
    ceo: string;
    reportingOfficer: string;
    email: string;
    demographics: PublicEntity['demographics'];
    jobStats: PublicEntity['jobStats'];
  };
}

// Custom sector-specific KPI templates for each institution type
function getSectorKPIs(entity: PublicEntity) {
  const code = entity.shortCode.toUpperCase();
  const cluster = entity.cluster;
  const budgetMillions = entity.budgetAllocationZAR / 1_000_000;

  // 1. HERITAGE & MUSEUMS
  if (cluster === 'Heritage & Museums') {
    if (code === 'SAHRA') {
      return [
        {
          id: 'kpi-sahra-1',
          name: 'National Heritage Sites Assessed & Graded',
          programme: 'Heritage Resources Identification & Protection',
          description: 'Official inspection and inclusion of national heritage landmarks onto the SAHRIS register.',
          baseline: 42,
          annualTarget: 60,
          unit: 'Sites',
          q1Target: 15,
          q1Actual: 16,
          q2Target: 15,
          q2Actual: 14,
          q3Target: 15,
          q3Actual: 8,
          q4Target: 15,
          currentValue: 38,
          percentageAchieved: 63.3,
          status: 'AT_RISK' as const,
          varianceExplanation: 'Inclement weather and provincial access delays in Sarah Baartman district.',
          correctiveAction: 'Contracted additional freelance heritage surveyors to clear backlog in Q4.',
        },
        {
          id: 'kpi-sahra-2',
          name: 'Community Heritage Outreach Workshops',
          programme: 'Public Awareness & Heritage Education',
          description: 'Preservation workshops conducted with traditional councils and local municipalities.',
          baseline: 30,
          annualTarget: 40,
          unit: 'Workshops',
          q1Target: 10,
          q1Actual: 12,
          q2Target: 10,
          q2Actual: 10,
          q3Target: 10,
          q3Actual: 11,
          q4Target: 10,
          currentValue: 33,
          percentageAchieved: 82.5,
          status: 'ON_TRACK' as const,
          varianceExplanation: 'Target on track across Eastern Cape and Limpopo educational forums.',
          correctiveAction: 'Maintain current cadence.',
        },
      ];
    }
    // Generic museum profile (DMSA, Iziko, Freedom Park, RIM, Nelson Mandela, etc.)
    const annualVis = Math.round(budgetMillions * 1200);
    const qVis = Math.round(annualVis / 4);
    return [
      {
        id: `kpi-${entity.id}-1`,
        name: 'Public Museum Exhibitions & Educational Footfall',
        programme: 'Public Heritage Access & Curation',
        description: 'Physical and guided educational visitors accessing permanent and touring museum collections.',
        baseline: Math.round(annualVis * 0.75),
        annualTarget: annualVis,
        unit: 'Visitors',
        q1Target: qVis,
        q1Actual: Math.round(qVis * (entity.overallComplianceScore >= 75 ? 1.05 : 0.85)),
        q2Target: qVis,
        q2Actual: Math.round(qVis * (entity.overallComplianceScore >= 75 ? 1.02 : 0.82)),
        q3Target: qVis,
        q3Actual: Math.round(qVis * (entity.overallComplianceScore >= 75 ? 0.98 : 0.75)),
        q4Target: qVis,
        currentValue: Math.round(annualVis * (entity.overallComplianceScore >= 75 ? 0.76 : 0.61)),
        percentageAchieved: entity.overallComplianceScore >= 75 ? 76.0 : 61.0,
        status: (entity.overallComplianceScore >= 75 ? 'ON_TRACK' : 'AT_RISK') as 'ON_TRACK' | 'AT_RISK',
        varianceExplanation: entity.overallComplianceScore >= 75 ? 'Strong school holiday touring attendance.' : 'Public transit delays affected guided learner tours.',
        correctiveAction: 'Expanded digital virtual museum tours and subsidized school bus access.',
      },
      {
        id: `kpi-${entity.id}-2`,
        name: 'Historical Artefacts Conserved & Digitised',
        programme: 'Curatorial Collections Management',
        description: 'Archival preservation and metadata registration on the National Heritage Database.',
        baseline: 800,
        annualTarget: 1200,
        unit: 'Artefacts',
        q1Target: 300,
        q1Actual: 320,
        q2Target: 300,
        q2Actual: 310,
        q3Target: 300,
        q3Actual: 295,
        q4Target: 300,
        currentValue: 925,
        percentageAchieved: 77.1,
        status: 'ON_TRACK' as const,
        varianceExplanation: 'Digitisation laboratory operating at peak throughput.',
        correctiveAction: 'Maintain current quarterly schedule.',
      },
    ];
  }

  // 2. PERFORMING ARTS & THEATRES (State Theatre, Playhouse, Artscape, Market Theatre, PACOFS)
  if (cluster === 'Performing Arts & Theatres') {
    const annualProds = Math.max(16, Math.round(budgetMillions * 0.35));
    const qProds = Math.round(annualProds / 4);
    return [
      {
        id: `kpi-${entity.id}-1`,
        name: 'Curated Stage Productions & Cultural Seasons',
        programme: 'Artistic Excellence & Public Theatre Curation',
        description: 'Professional drama, dance, opera, musical and indigenous storytelling productions staged.',
        baseline: Math.round(annualProds * 0.8),
        annualTarget: annualProds,
        unit: 'Productions',
        q1Target: qProds,
        q1Actual: Math.round(qProds * 1.1),
        q2Target: qProds,
        q2Actual: qProds,
        q3Target: qProds,
        q3Actual: Math.round(qProds * (entity.overallComplianceScore >= 70 ? 0.95 : 0.7)),
        q4Target: qProds,
        currentValue: Math.round(annualProds * 0.74),
        percentageAchieved: 74.0,
        status: (entity.overallComplianceScore >= 70 ? 'ON_TRACK' : 'AT_RISK') as 'ON_TRACK' | 'AT_RISK',
        varianceExplanation: 'Festivals season maintained strong ticket sales; rural outreach transport required subsidy.',
        correctiveAction: 'Re-staged popular community plays to fulfill audience development milestones.',
      },
      {
        id: `kpi-${entity.id}-2`,
        name: 'Emerging Playwrights & Youth Practitioners Trained',
        programme: 'Sector Incubation & Skills Development',
        description: 'Masterclasses in directing, stage management, lighting, and performance writing.',
        baseline: 150,
        annualTarget: 250,
        unit: 'Artists Trained',
        q1Target: 60,
        q1Actual: 68,
        q2Target: 60,
        q2Actual: 65,
        q3Target: 65,
        q3Actual: 62,
        q4Target: 65,
        currentValue: 195,
        percentageAchieved: 78.0,
        status: 'ON_TRACK' as const,
        varianceExplanation: 'Partnerships with provincial colleges exceeded enrollment targets.',
        correctiveAction: 'Maintain current workshop schedule.',
      },
    ];
  }

  // 3. CREATIVE INDUSTRIES & FILM (NFVF, NAC)
  if (cluster === 'Creative Industries & Film') {
    if (code === 'NFVF') {
      return [
        {
          id: 'kpi-nfvf-1',
          name: 'Indigenous Language Feature Films & Documentaries Funded',
          programme: 'Film Slate Financing & Local Content',
          description: 'Production financing for South African local language cinematic productions creating jobs.',
          baseline: 35,
          annualTarget: 50,
          unit: 'Films Funded',
          q1Target: 12,
          q1Actual: 14,
          q2Target: 12,
          q2Actual: 13,
          q3Target: 13,
          q3Actual: 14,
          q4Target: 13,
          currentValue: 41,
          percentageAchieved: 82.0,
          status: 'ON_TRACK' as const,
          varianceExplanation: 'Co-funding partnership with provincial film commissions accelerated approvals.',
          correctiveAction: 'Maintain current project slate disbursements.',
        },
        {
          id: 'kpi-nfvf-2',
          name: 'Youth Screenwriters & Directors Incubated',
          programme: 'Skills Development & Transformation',
          description: 'Intensive script-writing labs and post-production mentorship for youth practitioners.',
          baseline: 80,
          annualTarget: 120,
          unit: 'Youth Creatives',
          q1Target: 30,
          q1Actual: 32,
          q2Target: 30,
          q2Actual: 30,
          q3Target: 30,
          q3Actual: 34,
          q4Target: 30,
          currentValue: 96,
          percentageAchieved: 80.0,
          status: 'ON_TRACK' as const,
          varianceExplanation: 'National youth film challenge attracted strong participation across 9 provinces.',
          correctiveAction: 'Deliver masterclasses at regional film festivals.',
        },
      ];
    }
    // NAC
    return [
      {
        id: 'kpi-nac-1',
        name: 'Grassroots Community Arts Practitioners Funded',
        programme: 'Practitioner Grant Funding & Sector Relief',
        description: 'Direct grant disbursements to emerging South African artists across all 9 provinces.',
        baseline: 1200,
        annualTarget: 1800,
        unit: 'Artists Funded',
        q1Target: 450,
        q1Actual: 380,
        q2Target: 450,
        q2Actual: 310,
        q3Target: 450,
        q3Actual: 240,
        q4Target: 450,
        currentValue: 930,
        percentageAchieved: 51.7,
        status: 'AT_RISK' as const,
        varianceExplanation: 'Grant portal verification backlogs and delayed bank confirmation letters.',
        correctiveAction: 'Convene dedicated adjudication panels to clear backlog within 30 days.',
      },
      {
        id: 'kpi-nac-2',
        name: 'Provincial Arts Organisations Grant Compliance Audited',
        programme: 'Governance & Grant Assurance',
        description: 'Rigorous compliance auditing of funded non-profit arts centres and federations.',
        baseline: 120,
        annualTarget: 180,
        unit: 'Audits',
        q1Target: 45,
        q1Actual: 40,
        q2Target: 45,
        q2Actual: 38,
        q3Target: 45,
        q3Actual: 32,
        q4Target: 45,
        currentValue: 110,
        percentageAchieved: 61.1,
        status: 'AT_RISK' as const,
        varianceExplanation: 'Capacity constraints in internal audit and compliance unit.',
        correctiveAction: 'Outsource compliance verifications to provincial panel of auditors.',
      },
    ];
  }

  // 4. SPORT & RECREATION (BSA, SAIDS)
  if (cluster === 'Sport & Recreation') {
    if (code === 'BSA') {
      return [
        {
          id: 'kpi-bsa-1',
          name: 'Sanctioned Boxing Tournaments with Medical Compliance',
          programme: 'Sport Development & Professional Boxing Governance',
          description: 'Professional and development boxing tournaments sanctioned with full ringside medical clearance.',
          baseline: 65,
          annualTarget: 80,
          unit: 'Tournaments',
          q1Target: 20,
          q1Actual: 11,
          q2Target: 20,
          q2Actual: 13,
          q3Target: 20,
          q3Actual: 8,
          q4Target: 20,
          currentValue: 32,
          percentageAchieved: 40.0,
          status: 'MISSED' as const,
          varianceExplanation: 'Promoter licensing disputes and delayed medical practitioner appointments.',
          correctiveAction: 'Ministerial intervention team convened to stabilize promoter compliance.',
        },
        {
          id: 'kpi-bsa-2',
          name: 'Boxer Anti-Doping & Wellness Screenings',
          programme: 'Boxer Safety & Regulatory Integrity',
          description: 'Mandatory neurological and cardiovascular screenings before sanctioned bouts.',
          baseline: 300,
          annualTarget: 450,
          unit: 'Screenings',
          q1Target: 110,
          q1Actual: 85,
          q2Target: 110,
          q2Actual: 90,
          q3Target: 115,
          q3Actual: 72,
          q4Target: 115,
          currentValue: 247,
          percentageAchieved: 54.9,
          status: 'AT_RISK' as const,
          varianceExplanation: 'Budget redirected to legal compliance costs.',
          correctiveAction: 'Partner with provincial sports medicine councils for subsidized clinics.',
        },
      ];
    }
    // SAIDS / others
    return [
      {
        id: `kpi-${entity.id}-1`,
        name: 'National Anti-Doping Tests & Substance Audits',
        programme: 'Clean Sport Integrity & WADA Compliance',
        description: 'In-competition and out-of-competition testing of athletes across national federations.',
        baseline: 1800,
        annualTarget: 2400,
        unit: 'Tests',
        q1Target: 600,
        q1Actual: 620,
        q2Target: 600,
        q2Actual: 615,
        q3Target: 600,
        q3Actual: 595,
        q4Target: 600,
        currentValue: 1830,
        percentageAchieved: 76.3,
        status: 'ON_TRACK' as const,
        varianceExplanation: 'High-throughput lab processing meeting WADA gold accreditation standards.',
        correctiveAction: 'Maintain current test schedule.',
      },
      {
        id: `kpi-${entity.id}-2`,
        name: 'Clean Sport Anti-Doping Workshops for High Schools & Federations',
        programme: 'Athlete Education & Prevention',
        description: 'Values-based education workshops warning youth athletes of prohibited substances.',
        baseline: 80,
        annualTarget: 120,
        unit: 'Workshops',
        q1Target: 30,
        q1Actual: 33,
        q2Target: 30,
        q2Actual: 31,
        q3Target: 30,
        q3Actual: 30,
        q4Target: 30,
        currentValue: 94,
        percentageAchieved: 78.3,
        status: 'ON_TRACK' as const,
        varianceExplanation: 'Expanded digital webinars alongside in-person camps.',
        correctiveAction: 'Maintain school sports calendar coordination.',
      },
    ];
  }

  // 5. LANGUAGES, LITERATURE & LIBRARIES (PanSALB, NLSA, SALB)
  if (cluster.includes('Language') || cluster.includes('Libraries') || code === 'PANSALB') {
    return [
      {
        id: `kpi-${entity.id}-1`,
        name: 'Official Indigenous Language Terminologies & Dictionaries Developed',
        programme: 'Multilingualism & National Lexicography',
        description: 'Standardization and publishing of technical terminology across all 11 official languages and SASL.',
        baseline: 4500,
        annualTarget: 6000,
        unit: 'Terminologies',
        q1Target: 1500,
        q1Actual: 1540,
        q2Target: 1500,
        q2Actual: 1510,
        q3Target: 1500,
        q3Actual: 1480,
        q4Target: 1500,
        currentValue: 4530,
        percentageAchieved: 75.5,
        status: 'ON_TRACK' as const,
        varianceExplanation: 'National Lexicography Units meeting gazetted publishing deadlines.',
        correctiveAction: 'Maintain digital portal rollout on schedule.',
      },
      {
        id: `kpi-${entity.id}-2`,
        name: 'Public Service Language Policy Audits Conducted',
        programme: 'Language Rights Protection & Compliance',
        description: 'Monitoring of government departments compliance with Use of Official Languages Act.',
        baseline: 40,
        annualTarget: 60,
        unit: 'Audits',
        q1Target: 15,
        q1Actual: 14,
        q2Target: 15,
        q2Actual: 16,
        q3Target: 15,
        q3Actual: 13,
        q4Target: 15,
        currentValue: 43,
        percentageAchieved: 71.7,
        status: 'ON_TRACK' as const,
        varianceExplanation: 'Three provincial health departments requested extension to submit language audits.',
        correctiveAction: 'Finalize provincial reporting before end of Q4.',
      },
    ];
  }

  // 6. SUBSIDIZED CULTURAL NPOS (Ubuntu Arts, BASA, SACO, ACT, SAMRO Foundation, Blind SA)
  const npoBeneficiaries = Math.round(budgetMillions * 180);
  const qBeneficiaries = Math.round(npoBeneficiaries / 4);
  return [
    {
      id: `kpi-${entity.id}-1`,
      name: 'Community Cultural Projects & Grassroots Beneficiaries Supported',
      programme: 'Community Arts Development & Civic Impact',
      description: 'Township, rural, and vulnerable community arts touring and practitioner development sessions.',
      baseline: Math.round(npoBeneficiaries * 0.75),
      annualTarget: npoBeneficiaries,
      unit: 'Beneficiaries',
      q1Target: qBeneficiaries,
      q1Actual: Math.round(qBeneficiaries * 1.05),
      q2Target: qBeneficiaries,
      q2Actual: Math.round(qBeneficiaries * 1.02),
      q3Target: qBeneficiaries,
      q3Actual: Math.round(qBeneficiaries * 0.96),
      q4Target: qBeneficiaries,
      currentValue: Math.round(npoBeneficiaries * 0.76),
      percentageAchieved: 76.0,
      status: 'ON_TRACK' as const,
      varianceExplanation: 'Rural touring schedule delivered strong community engagement.',
      correctiveAction: 'Ensure all venue expenditure vouchers are submitted for tranche reconciliation.',
    },
    {
      id: `kpi-${entity.id}-2`,
      name: 'Youth Creative Mentorships & Masterclasses',
      programme: 'Youth Capacity & Creative Livelihoods',
      description: 'Structured skills-building workshops with certified industry professionals.',
      baseline: 120,
      annualTarget: 180,
      unit: 'Youth Artists',
      q1Target: 45,
      q1Actual: 48,
      q2Target: 45,
      q2Actual: 46,
      q3Target: 45,
      q3Actual: 44,
      q4Target: 45,
      currentValue: 138,
      percentageAchieved: 76.7,
      status: 'ON_TRACK' as const,
      varianceExplanation: 'High completion rate across digital and in-person modules.',
      correctiveAction: 'Maintain current training cadence.',
    },
  ];
}

// Generate the complete, high-fidelity dossier for ANY of the 32 entities
export function generateEntityFeatureDossier(entity: PublicEntity): EntityFeatureDossier {
  const budget = entity.budgetAllocationZAR;
  const transferred = entity.transferredAmountZAR || Math.round(budget * 0.75);
  const expenditure = entity.reportedExpenditureZAR || Math.round(transferred * 0.88);
  const balancePending = budget - transferred;
  const utilization = transferred > 0 ? Math.round((expenditure / transferred) * 100) : 0;
  const burnRate = budget > 0 ? Math.round((expenditure / budget) * 100) : 0;

  // Tranches (25% each quarter)
  const quarterAmount = Math.round(budget / 4);

  // Compliance calculations
  const isHighRisk = entity.riskLevel === 'HIGH' || entity.riskLevel === 'CRITICAL';
  const isCleanAudit = entity.auditOutcome === 'CLEAN_AUDIT';
  const complianceStatus: 'Compliant' | 'Remediation' | 'Intervention Required' = 
    entity.overallComplianceScore >= 80 ? 'Compliant' :
    entity.overallComplianceScore >= 65 ? 'Remediation' : 'Intervention Required';

  const auditFindingDetails = isCleanAudit
    ? 'The Auditor-General of South Africa (AGSA) issued a CLEAN AUDIT OPINION. Financial statements are free of material misstatements, with zero non-compliance findings on supply chain or predetermined objectives.'
    : entity.auditOutcome === 'UNQUALIFIED_WITH_FINDINGS'
    ? 'AGSA issued an UNQUALIFIED OPINION WITH FINDINGS. Financial statements are fairly presented; findings noted on non-compliance with supply chain management regulations and asset register reconciliation.'
    : entity.auditOutcome === 'QUALIFIED'
    ? 'AGSA issued a QUALIFIED AUDIT OPINION. Material misstatements identified in revenue recognition, irregular expenditure tracking, or incomplete verification registers.'
    : 'AGSA issued a DISCLAIMER AUDIT OPINION. Insufficient appropriate audit evidence provided to form an audit opinion; urgent ministerial governance intervention active.';

  // Mandatory statutory checklist items
  const checklist = [
    {
      label: 'PFMA Section 38(1)(j) Written Assurance Certificate on File',
      status: entity.overallComplianceScore >= 65 ? ('Compliant' as const) : ('Overdue' as const),
      date: '15 Jan 2025',
      category: 'Governance'
    },
    {
      label: 'Annual Performance Plan (APP) 2024/25 Tabled in Parliament',
      status: 'Compliant' as const,
      date: '12 Mar 2024',
      category: 'Strategic'
    },
    {
      label: 'Current Year Budget Submitted December into 4 Quarters (25% each)',
      status: 'Compliant' as const,
      date: '15 Dec 2023',
      category: 'PFMA Budget'
    },
    {
      label: 'Following Year Budget Submitted December (MTEF Tabling)',
      status: 'Compliant' as const,
      date: '12 Dec 2024',
      category: 'PFMA Budget'
    },
    {
      label: 'Q1 Statutory Quarterly Performance Report Verified (with PoE)',
      status: 'Verified' as const,
      date: '30 Jul 2024',
      category: 'Reporting'
    },
    {
      label: 'Q2 Statutory Quarterly Performance Report Verified (with PoE)',
      status: 'Verified' as const,
      date: '31 Oct 2024',
      category: 'Reporting'
    },
    {
      label: 'Q3 Statutory Quarterly Performance Report PoE Check',
      status: isHighRisk ? ('Overdue' as const) : ('Submitted' as const),
      date: '31 Jan 2025',
      category: 'Reporting'
    },
    {
      label: 'Audited Annual Financial Statements (AFS) Gazetted',
      status: entity.auditOutcome !== 'DISCLAIMER' ? ('Submitted' as const) : ('Overdue' as const),
      date: '30 Sep 2024',
      category: 'Financial'
    },
    {
      label: 'SARS Tax Compliance Status (TCS PIN in Good Standing)',
      status: 'Verified' as const,
      date: 'Valid Pin: 02849XJ',
      category: 'Statutory'
    },
    {
      label: 'B-BBEE Transformation Certificate (Level 1 / 2 Verified)',
      status: 'Compliant' as const,
      date: 'Level 1 Verified',
      category: 'Statutory'
    }
  ];

  const validatedCount = checklist.filter(c => c.status === 'Compliant' || c.status === 'Verified' || c.status === 'Submitted').length;

  // Specific risk reason & contributing factors
  const riskHeadline = isHighRisk 
    ? `${entity.shortCode}: Governance & Delivery Trajectory Alert (${entity.riskLevel} Risk)`
    : `${entity.shortCode}: Stable Compliance Profile (Low Risk)`;

  const riskReason = isHighRisk
    ? `${entity.name} exhibits significant target trajectory variance and audit findings. ${entity.overdueReportsCount > 0 ? `${entity.overdueReportsCount} statutory reporting deadline(s) currently overdue.` : 'Financial burn rate misaligned with target achievement.'}`
    : `${entity.name} demonstrates robust internal controls with high target delivery rates and timely quarterly submissions.`;

  const contributingFactors = isHighRisk
    ? [
        `Historical AGSA opinion: ${entity.auditOutcome.replace(/_/g, ' ')}`,
        `Expenditure rate (${utilization}%) vs target achievement lag creates PFMA compliance exposure`,
        entity.overdueReportsCount > 0 ? `${entity.overdueReportsCount} statutory quarterly report(s) outstanding` : 'Portfolio of Evidence requires enhanced provincial audit verification',
        'Executive vacancy or restructuring underway affecting quarterly throughput'
      ]
    : [
        'Unqualified audit opinion maintained across successive financial years',
        'Timely submission of all PFMA Section 38(1)(j) assurances and quarterly returns',
        'Expenditure aligned with approved 4-quarter tranche schedule',
        'Clean Portfolio of Evidence (PoE) with independent verifier stamps'
      ];

  const recommendedAction = isHighRisk
    ? 'Convene DSAC Executive oversight review with Accounting Officer, withhold Q4 tranche release pending in-person governance remediation, and mandate immediate recovery schedule.'
    : 'Maintain standard quarterly monitoring cycle and clear Q4 tranche for statutory transfer disbursement.';

  const kpis = getSectorKPIs(entity);
  const avgAchievement = kpis.reduce((acc, k) => acc + k.percentageAchieved, 0) / (kpis.length || 1);

  return {
    entity,
    compliance: {
      score: entity.overallComplianceScore,
      status: complianceStatus,
      auditOutcome: entity.auditOutcome,
      auditYear: entity.auditYear || '2024/2025',
      auditFindingTitle: entity.auditOutcome.replace(/_/g, ' '),
      auditFindingDetails,
      validatedCount,
      totalChecklistItems: checklist.length,
      checklist
    },
    performance: {
      deliveryRate: Math.round(avgAchievement),
      kpis,
      mtsfJobsTotal: entity.jobStats.permanentJobs + entity.jobStats.temporaryJobs,
      targetJobsTotal: entity.jobStats.targetJobsAnnual || 500,
      youthJobs: entity.jobStats.youthJobsCreated,
      practitionersSupported: entity.jobStats.creativeSectorPractitionersSupported
    },
    funding: {
      approvedBudgetZAR: budget,
      transferredAmountZAR: transferred,
      transferredPercent: 75,
      reportedExpenditureZAR: expenditure,
      balancePendingZAR: balancePending,
      utilizationRate: utilization,
      burnRate,
      tranches: [
        {
          quarter: 'Q1',
          percentage: 25,
          amountZAR: quarterAmount,
          status: 'RECONCILED',
          disbursedDate: '15 Apr 2025',
          notes: 'Disbursed and reconciled against Q1 expenditure report.'
        },
        {
          quarter: 'Q2',
          percentage: 25,
          amountZAR: quarterAmount,
          status: 'RECONCILED',
          disbursedDate: '18 Jul 2025',
          notes: 'Disbursed and reconciled against Q2 audited performance report.'
        },
        {
          quarter: 'Q3',
          percentage: 25,
          amountZAR: quarterAmount,
          status: 'DISBURSED',
          disbursedDate: '20 Oct 2025',
          notes: 'Disbursed; interim Q3 expenditure returns under DSAC audit verification.'
        },
        {
          quarter: 'Q4',
          percentage: 25,
          amountZAR: quarterAmount,
          status: 'PENDING_GATE',
          disbursedDate: 'Pending Jan 2026',
          notes: 'Statutory gate: Subject to PFMA Section 38(1)(j) compliance signoff and Q3 report approval.'
        }
      ],
      decemberStatutoryBudget: {
        currentYearSubmission: {
          submittedDate: '15 Dec 2023',
          status: 'Approved by National Treasury & DSAC Minister',
          q1TrancheZAR: quarterAmount,
          q2TrancheZAR: quarterAmount,
          q3TrancheZAR: quarterAmount,
          q4TrancheZAR: quarterAmount,
          totalZAR: budget
        },
        followingYearSubmission: {
          submittedDate: '12 Dec 2024',
          status: 'Tabled in Parliament (MTEF Vote 37 Estimates)',
          projectedBudgetZAR: Math.round(budget * 1.045), // 4.5% statutory escalation
          mtefTablingStatus: 'Gazetted & Approved'
        }
      }
    },
    reports: {
      quarterlySubmissions: [
        {
          quarter: 'Q1',
          year: '2024/25',
          status: 'APPROVED',
          submittedDate: '28 Jul 2024',
          submittedBy: entity.reportingOfficerName,
          reviewer: 'Sicelo Sakhile Mkhize (DSAC Admin)',
          poeStatus: 'Verified with stamped PoE',
          fundsSpentZAR: Math.round(quarterAmount * 0.92)
        },
        {
          quarter: 'Q2',
          year: '2024/25',
          status: 'APPROVED',
          submittedDate: '29 Oct 2024',
          submittedBy: entity.reportingOfficerName,
          reviewer: 'Sicelo Sakhile Mkhize (DSAC Admin)',
          poeStatus: 'Verified with stamped PoE',
          fundsSpentZAR: Math.round(quarterAmount * 0.89)
        },
        {
          quarter: 'Q3',
          year: '2024/25',
          status: isHighRisk ? 'OVERDUE' : 'UNDER_REVIEW',
          submittedDate: isHighRisk ? undefined : '28 Jan 2025',
          submittedBy: entity.reportingOfficerName,
          reviewer: 'DSAC Oversight Directorate',
          poeStatus: isHighRisk ? 'Overdue - No Evidence' : 'Under DSAC Review',
          fundsSpentZAR: Math.round(quarterAmount * 0.82)
        },
        {
          quarter: 'Q4',
          year: '2024/25',
          status: 'SCHEDULED',
          submittedBy: entity.reportingOfficerName,
          reviewer: 'DSAC Oversight Directorate',
          poeStatus: 'Under DSAC Review',
          fundsSpentZAR: 0
        }
      ],
      statutoryDecemberBudgetDossier: {
        title: `${entity.name} - Statutory December Budget Submissions (PFMA Sec 38)`,
        mandateRef: 'PFMA Section 38(1)(j) & Treasury Regulation 21.1',
        currentYearStatus: 'Current Year 4-Quarter Partition Submitted December (100% Compliant)',
        followingYearStatus: 'Following Year MTEF Projection Submitted December (Tabled in Parliament)',
        accountingOfficerSignoff: `${entity.headOfEntity} (Signed & Sealed)`,
        parliamentaryTablingDate: '12 Dec 2024'
      }
    },
    risks: {
      level: entity.riskLevel,
      score: entity.riskScore,
      headline: riskHeadline,
      reason: riskReason,
      contributingFactors,
      governanceImplications: isHighRisk
        ? 'Heightened risk of AGSA finding recurrence and parliamentary SCOPA inquiry. Section 38(1)(j) compliance notice mandated.'
        : 'Entity maintains green governance rating; ongoing risk monitoring active.',
      recommendedAction,
      interventionStatus: isHighRisk ? 'Ministerial Escalation / Remediation Action Plan' : 'Routine Oversight Monitoring'
    },
    leadership: {
      ceo: entity.headOfEntity,
      reportingOfficer: entity.reportingOfficerName,
      email: entity.contactEmail,
      demographics: entity.demographics,
      jobStats: entity.jobStats
    }
  };
}
