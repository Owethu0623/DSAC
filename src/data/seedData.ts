import { 
  PublicEntity, 
  KPIRecord, 
  QuarterlyReport, 
  ReportItem, 
  CorrectiveTask, 
  RiskAlert,
  KPIStatus,
  ReportStatus
} from '../types';

/**
 * Generates sector-aligned, mathematically consistent KPIs for all 32 public entities and NPOs.
 */
export function generateOfficialKpis(entities: PublicEntity[]): KPIRecord[] {
  const allKpis: KPIRecord[] = [];

  entities.forEach(entity => {
    const code = entity.shortCode.toUpperCase();
    const cluster = entity.cluster;
    const bM = Math.max(1, entity.budgetAllocationZAR / 1_000_000);
    const compliance = entity.overallComplianceScore;
    const isGood = compliance >= 75;
    const isMedium = compliance >= 60 && compliance < 75;

    // Performance modifier for actuals
    const perfMod = isGood ? 1.02 : isMedium ? 0.84 : 0.58;

    if (code === 'SAHRA') {
      allKpis.push(
        {
          id: 'kpi-sahra-1',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Heritage Resources Identification & Protection',
          name: 'National Heritage Sites Assessed and Graded',
          description: 'Number of identified national heritage landmarks formally audited, mapped into the SAHRIS register, and gazetted.',
          unitOfMeasure: 'Sites audited',
          baseline: 42,
          annualTarget: 60,
          q1Target: 15,
          q1Actual: 16,
          q2Target: 15,
          q2Actual: 14,
          q3Target: 15,
          q3Actual: 8,
          q4Target: 15,
          currentValue: 38,
          expectedValue: 45,
          percentageAchieved: 63.3,
          status: 'AT_RISK',
          historicalPerformance: [
            { year: '2022/2023', target: 50, achieved: 48 },
            { year: '2023/2024', target: 55, achieved: 52 },
            { year: '2024/2025', target: 58, achieved: 56 },
          ],
        },
        {
          id: 'kpi-sahra-2',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Public Awareness & Heritage Education',
          name: 'Community Heritage Outreach Workshops Conducted',
          description: 'Interactive preservation workshops conducted with traditional councils, youth forums, and local municipalities.',
          unitOfMeasure: 'Workshops',
          baseline: 30,
          annualTarget: 40,
          q1Target: 10,
          q1Actual: 12,
          q2Target: 10,
          q2Actual: 10,
          q3Target: 10,
          q3Actual: 11,
          q4Target: 10,
          currentValue: 33,
          expectedValue: 30,
          percentageAchieved: 82.5,
          status: 'ON_TRACK',
          historicalPerformance: [
            { year: '2022/2023', target: 30, achieved: 32 },
            { year: '2023/2024', target: 35, achieved: 36 },
            { year: '2024/2025', target: 38, achieved: 39 },
          ],
        }
      );
      return;
    }

    if (code === 'NAC') {
      allKpis.push(
        {
          id: 'kpi-nac-1',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Arts Organisation & Practitioner Grant Funding',
          name: 'Grassroots Community Arts Practitioners Funded',
          description: 'Direct disbursements of project grants to verified emerging South African artists across all 9 provinces.',
          unitOfMeasure: 'Artists Funded',
          baseline: 1200,
          annualTarget: 1800,
          q1Target: 450,
          q1Actual: 380,
          q2Target: 450,
          q2Actual: 310,
          q3Target: 450,
          q3Actual: 240,
          q4Target: 450,
          currentValue: 930,
          expectedValue: 1350,
          percentageAchieved: 51.7,
          status: 'AT_RISK',
          historicalPerformance: [
            { year: '2022/2023', target: 1500, achieved: 1320 },
            { year: '2023/2024', target: 1600, achieved: 1410 },
            { year: '2024/2025', target: 1700, achieved: 1490 },
          ],
        },
        {
          id: 'kpi-nac-2',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Institutional Governance & Capacity Building',
          name: 'Arts Organisations Capacity Building Sessions',
          description: 'Compliance and financial administration workshops provided to beneficiary NGOs.',
          unitOfMeasure: 'Sessions',
          baseline: 24,
          annualTarget: 36,
          q1Target: 9,
          q1Actual: 9,
          q2Target: 9,
          q2Actual: 8,
          q3Target: 9,
          q3Actual: 6,
          q4Target: 9,
          currentValue: 23,
          expectedValue: 27,
          percentageAchieved: 63.9,
          status: 'AT_RISK',
          historicalPerformance: [
            { year: '2022/2023', target: 30, achieved: 28 },
            { year: '2023/2024', target: 32, achieved: 30 },
            { year: '2024/2025', target: 34, achieved: 31 },
          ],
        }
      );
      return;
    }

    if (code === 'BSA') {
      allKpis.push(
        {
          id: 'kpi-bsa-1',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Sport Development & Professional Boxing Governance',
          name: 'Sanctioned Boxing Tournaments Held with Medical Compliance',
          description: 'Professional and development boxing tournaments sanctioned with full ringside medical and anti-doping clearance.',
          unitOfMeasure: 'Tournaments',
          baseline: 65,
          annualTarget: 80,
          q1Target: 20,
          q1Actual: 11,
          q2Target: 20,
          q2Actual: 13,
          q3Target: 20,
          q3Actual: 8,
          q4Target: 20,
          currentValue: 32,
          expectedValue: 60,
          percentageAchieved: 40.0,
          status: 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: 70, achieved: 58 },
            { year: '2023/2024', target: 75, achieved: 61 },
            { year: '2024/2025', target: 78, achieved: 59 },
          ],
        },
        {
          id: 'kpi-bsa-2',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Boxer Welfare & Capacity Building',
          name: 'Licensed Boxers and Ring Officials Trained',
          description: 'Accredited referee, judge, ring doctor and athlete safeguarding certification workshops.',
          unitOfMeasure: 'Officials/Boxers',
          baseline: 120,
          annualTarget: 200,
          q1Target: 50,
          q1Actual: 30,
          q2Target: 50,
          q2Actual: 32,
          q3Target: 50,
          q3Actual: 22,
          q4Target: 50,
          currentValue: 84,
          expectedValue: 150,
          percentageAchieved: 42.0,
          status: 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: 150, achieved: 130 },
            { year: '2023/2024', target: 175, achieved: 142 },
            { year: '2024/2025', target: 190, achieved: 148 },
          ],
        }
      );
      return;
    }

    if (code === 'NFVF') {
      allKpis.push(
        {
          id: 'kpi-nfvf-1',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Local Content Production & Industry Incubation',
          name: 'Indigenous Language Feature Films & Documentaries Funded',
          description: 'Production slate financing for South African local language cinematic stories creating high youth employment.',
          unitOfMeasure: 'Films Funded',
          baseline: 35,
          annualTarget: 50,
          q1Target: 12,
          q1Actual: 14,
          q2Target: 12,
          q2Actual: 13,
          q3Target: 13,
          q3Actual: 14,
          q4Target: 13,
          currentValue: 41,
          expectedValue: 37,
          percentageAchieved: 82.0,
          status: 'ON_TRACK',
          historicalPerformance: [
            { year: '2022/2023', target: 40, achieved: 42 },
            { year: '2023/2024', target: 45, achieved: 46 },
            { year: '2024/2025', target: 48, achieved: 49 },
          ],
        },
        {
          id: 'kpi-nfvf-2',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Film Skills Development & Market Access',
          name: 'Emerging Filmmakers Placed in Production Internships',
          description: 'Youth and historically disadvantaged trainees placed with certified production companies.',
          unitOfMeasure: 'Interns',
          baseline: 140,
          annualTarget: 220,
          q1Target: 55,
          q1Actual: 60,
          q2Target: 55,
          q2Actual: 58,
          q3Target: 55,
          q3Actual: 56,
          q4Target: 55,
          currentValue: 174,
          expectedValue: 165,
          percentageAchieved: 79.1,
          status: 'ON_TRACK',
          historicalPerformance: [
            { year: '2022/2023', target: 180, achieved: 175 },
            { year: '2023/2024', target: 200, achieved: 204 },
            { year: '2024/2025', target: 210, achieved: 215 },
          ],
        }
      );
      return;
    }

    if (code === 'DMSA') {
      allKpis.push(
        {
          id: 'kpi-dmsa-1',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Heritage Preservation & Public Access',
          name: 'Digitised Historical Museum Artefacts Publicly Accessible',
          description: 'High-resolution archival scans and metadata catalogued in the National Heritage Digital Archive.',
          unitOfMeasure: 'Artefacts Digitised',
          baseline: 4500,
          annualTarget: 6000,
          q1Target: 1500,
          q1Actual: 1580,
          q2Target: 1500,
          q2Actual: 1510,
          q3Target: 1500,
          q3Actual: 1490,
          q4Target: 1500,
          currentValue: 4580,
          expectedValue: 4500,
          percentageAchieved: 76.3,
          status: 'ON_TRACK',
          historicalPerformance: [
            { year: '2022/2023', target: 4000, achieved: 3950 },
            { year: '2023/2024', target: 5000, achieved: 5120 },
            { year: '2024/2025', target: 5500, achieved: 5640 },
          ],
        },
        {
          id: 'kpi-dmsa-2',
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Museum Education & School Visits',
          name: 'Learners and Public Visitors Participating in Museum Tours',
          description: 'Curated curriculum-linked tours for schools and heritage month attendees.',
          unitOfMeasure: 'Visitors',
          baseline: 65000,
          annualTarget: 90000,
          q1Target: 22500,
          q1Actual: 24100,
          q2Target: 22500,
          q2Actual: 23200,
          q3Target: 22500,
          q3Actual: 22800,
          q4Target: 22500,
          currentValue: 70100,
          expectedValue: 67500,
          percentageAchieved: 77.9,
          status: 'ON_TRACK',
          historicalPerformance: [
            { year: '2022/2023', target: 75000, achieved: 78000 },
            { year: '2023/2024', target: 82000, achieved: 85000 },
            { year: '2024/2025', target: 88000, achieved: 89500 },
          ],
        }
      );
      return;
    }

    // Generic Cluster Builders
    if (cluster === 'Heritage & Museums') {
      const annualVisitors = Math.round(bM * 1100);
      const qVis = Math.round(annualVisitors / 4);
      const q1A = Math.round(qVis * (perfMod > 0.9 ? 1.04 : 0.88));
      const q2A = Math.round(qVis * (perfMod > 0.9 ? 1.01 : 0.82));
      const q3A = Math.round(qVis * (perfMod > 0.9 ? 0.98 : 0.72));
      const curVis = q1A + q2A + q3A;
      const expVis = qVis * 3;
      const pctVis = Math.min(100, Math.round((curVis / annualVisitors) * 1000) / 10);

      allKpis.push(
        {
          id: `kpi-${entity.id}-1`,
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Heritage Preservation & Public Education',
          name: 'Public Museum Exhibitions & Educational Footfall',
          description: 'Physical and guided educational visitors accessing permanent and touring museum collections.',
          unitOfMeasure: 'Visitors',
          baseline: Math.round(annualVisitors * 0.7),
          annualTarget: annualVisitors,
          q1Target: qVis,
          q1Actual: q1A,
          q2Target: qVis,
          q2Actual: q2A,
          q3Target: qVis,
          q3Actual: q3A,
          q4Target: qVis,
          currentValue: curVis,
          expectedValue: expVis,
          percentageAchieved: pctVis,
          status: curVis >= expVis * 0.9 ? 'ON_TRACK' : curVis >= expVis * 0.7 ? 'AT_RISK' : 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: Math.round(annualVisitors * 0.8), achieved: Math.round(annualVisitors * 0.78) },
            { year: '2023/2024', target: Math.round(annualVisitors * 0.9), achieved: Math.round(annualVisitors * 0.88) },
            { year: '2024/2025', target: annualVisitors, achieved: Math.round(annualVisitors * 0.94) },
          ],
        },
        {
          id: `kpi-${entity.id}-2`,
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Collections Management & Digitisation',
          name: 'Archival Artefacts and Records Conserved & Digitised',
          description: 'Cataloguing and archival preservation onto the national heritage register.',
          unitOfMeasure: 'Artefacts/Records',
          baseline: 400,
          annualTarget: 800,
          q1Target: 200,
          q1Actual: Math.round(200 * (perfMod > 0.9 ? 1.05 : 0.85)),
          q2Target: 200,
          q2Actual: Math.round(200 * (perfMod > 0.9 ? 1.02 : 0.8)),
          q3Target: 200,
          q3Actual: Math.round(200 * (perfMod > 0.9 ? 0.97 : 0.75)),
          q4Target: 200,
          currentValue: Math.round(600 * perfMod),
          expectedValue: 600,
          percentageAchieved: Math.min(100, Math.round(((600 * perfMod) / 800) * 1000) / 10),
          status: perfMod >= 0.9 ? 'ON_TRACK' : perfMod >= 0.7 ? 'AT_RISK' : 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: 600, achieved: 580 },
            { year: '2023/2024', target: 700, achieved: 690 },
            { year: '2024/2025', target: 750, achieved: 760 },
          ],
        }
      );
      return;
    }

    if (cluster === 'Performing Arts & Theatres') {
      const annualProds = Math.max(16, Math.round(bM * 0.35));
      const qP = Math.round(annualProds / 4);
      const q1A = Math.round(qP * (perfMod > 0.9 ? 1.08 : 0.85));
      const q2A = Math.round(qP * (perfMod > 0.9 ? 1.02 : 0.8));
      const q3A = Math.round(qP * (perfMod > 0.9 ? 0.96 : 0.7));
      const curP = q1A + q2A + q3A;
      const expP = qP * 3;

      allKpis.push(
        {
          id: `kpi-${entity.id}-1`,
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Artistic Excellence & Public Staging',
          name: 'Curated Stage Productions & Cultural Seasons',
          description: 'Professional drama, dance, musical and indigenous storytelling productions staged for public audiences.',
          unitOfMeasure: 'Productions',
          baseline: Math.round(annualProds * 0.75),
          annualTarget: annualProds,
          q1Target: qP,
          q1Actual: q1A,
          q2Target: qP,
          q2Actual: q2A,
          q3Target: qP,
          q3Actual: q3A,
          q4Target: qP,
          currentValue: curP,
          expectedValue: expP,
          percentageAchieved: Math.min(100, Math.round((curP / annualProds) * 1000) / 10),
          status: curP >= expP * 0.9 ? 'ON_TRACK' : curP >= expP * 0.7 ? 'AT_RISK' : 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: Math.round(annualProds * 0.8), achieved: Math.round(annualProds * 0.82) },
            { year: '2023/2024', target: Math.round(annualProds * 0.9), achieved: Math.round(annualProds * 0.88) },
            { year: '2024/2025', target: annualProds, achieved: Math.round(annualProds * 0.95) },
          ],
        },
        {
          id: `kpi-${entity.id}-2`,
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Audience Development & Community Outreach',
          name: 'Community Theatre Masterclasses & Youth Workshops Conducted',
          description: 'Outreach workshops delivered in townships and rural communities to develop emerging theatre practitioners.',
          unitOfMeasure: 'Workshops',
          baseline: 24,
          annualTarget: 40,
          q1Target: 10,
          q1Actual: Math.round(10 * (perfMod > 0.9 ? 1.1 : 0.8)),
          q2Target: 10,
          q2Actual: Math.round(10 * (perfMod > 0.9 ? 1.0 : 0.8)),
          q3Target: 10,
          q3Actual: Math.round(10 * (perfMod > 0.9 ? 0.95 : 0.7)),
          q4Target: 10,
          currentValue: Math.round(30 * perfMod),
          expectedValue: 30,
          percentageAchieved: Math.min(100, Math.round(((30 * perfMod) / 40) * 1000) / 10),
          status: perfMod >= 0.9 ? 'ON_TRACK' : perfMod >= 0.7 ? 'AT_RISK' : 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: 30, achieved: 32 },
            { year: '2023/2024', target: 35, achieved: 36 },
            { year: '2024/2025', target: 38, achieved: 39 },
          ],
        }
      );
      return;
    }

    if (cluster === 'Sport & Recreation') {
      allKpis.push(
        {
          id: `kpi-${entity.id}-1`,
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Sport Integrity & Athlete Welfare',
          name: 'Mandatory Anti-Doping & Medical Clearance Audits Conducted',
          description: 'Official inspections and doping control samples conducted across national sports competitions.',
          unitOfMeasure: 'Audits/Samples',
          baseline: 350,
          annualTarget: 500,
          q1Target: 125,
          q1Actual: Math.round(125 * (perfMod > 0.9 ? 1.04 : 0.8)),
          q2Target: 125,
          q2Actual: Math.round(125 * (perfMod > 0.9 ? 1.02 : 0.75)),
          q3Target: 125,
          q3Actual: Math.round(125 * (perfMod > 0.9 ? 0.98 : 0.65)),
          q4Target: 125,
          currentValue: Math.round(375 * perfMod),
          expectedValue: 375,
          percentageAchieved: Math.min(100, Math.round(((375 * perfMod) / 500) * 1000) / 10),
          status: perfMod >= 0.9 ? 'ON_TRACK' : perfMod >= 0.7 ? 'AT_RISK' : 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: 400, achieved: 390 },
            { year: '2023/2024', target: 450, achieved: 460 },
            { year: '2024/2025', target: 480, achieved: 495 },
          ],
        }
      );
      return;
    }

    if (cluster === 'Language & Literature' || cluster === 'Languages, Literature & Libraries') {
      allKpis.push(
        {
          id: `kpi-${entity.id}-1`,
          entityId: entity.id,
          entityName: entity.name,
          programmeName: 'Linguistic Diversity & Human Language Technologies',
          name: 'Indigenous Language Terminology Lists & Dictionaries Verified',
          description: 'Official national terminology sets and literary translations gazetted across the 12 official languages.',
          unitOfMeasure: 'Terminology Sets',
          baseline: 15,
          annualTarget: 24,
          q1Target: 6,
          q1Actual: Math.round(6 * (perfMod > 0.9 ? 1.05 : 0.85)),
          q2Target: 6,
          q2Actual: Math.round(6 * (perfMod > 0.9 ? 1.0 : 0.8)),
          q3Target: 6,
          q3Actual: Math.round(6 * (perfMod > 0.9 ? 0.95 : 0.75)),
          q4Target: 6,
          currentValue: Math.round(18 * perfMod),
          expectedValue: 18,
          percentageAchieved: Math.min(100, Math.round(((18 * perfMod) / 24) * 1000) / 10),
          status: perfMod >= 0.9 ? 'ON_TRACK' : perfMod >= 0.7 ? 'AT_RISK' : 'MISSED',
          historicalPerformance: [
            { year: '2022/2023', target: 18, achieved: 19 },
            { year: '2023/2024', target: 20, achieved: 22 },
            { year: '2024/2025', target: 22, achieved: 23 },
          ],
        }
      );
      return;
    }

    // Default / Subsidized Cultural NPOs
    const targetBeneficiaries = entity.jobStats.creativeSectorPractitionersSupported || 600;
    const qB = Math.round(targetBeneficiaries / 4);
    const q1A = Math.round(qB * (perfMod > 0.9 ? 1.05 : 0.85));
    const q2A = Math.round(qB * (perfMod > 0.9 ? 1.02 : 0.8));
    const q3A = Math.round(qB * (perfMod > 0.9 ? 0.96 : 0.7));
    const curB = q1A + q2A + q3A;
    const expB = qB * 3;

    allKpis.push(
      {
        id: `kpi-${entity.id}-1`,
        entityId: entity.id,
        entityName: entity.name,
        programmeName: 'Community Cultural Subvention & Beneficiary Support',
        name: 'Grassroots Arts Beneficiaries and Practitioners Supported',
        description: 'Direct grant and subvention beneficiaries participating in community arts programmes, masterclasses, and bursaries.',
        unitOfMeasure: 'Beneficiaries',
        baseline: Math.round(targetBeneficiaries * 0.7),
        annualTarget: targetBeneficiaries,
        q1Target: qB,
        q1Actual: q1A,
        q2Target: qB,
        q2Actual: q2A,
        q3Target: qB,
        q3Actual: q3A,
        q4Target: qB,
        currentValue: curB,
        expectedValue: expB,
        percentageAchieved: Math.min(100, Math.round((curB / targetBeneficiaries) * 1000) / 10),
        status: curB >= expB * 0.9 ? 'ON_TRACK' : curB >= expB * 0.7 ? 'AT_RISK' : 'MISSED',
        historicalPerformance: [
          { year: '2022/2023', target: Math.round(targetBeneficiaries * 0.8), achieved: Math.round(targetBeneficiaries * 0.82) },
          { year: '2023/2024', target: Math.round(targetBeneficiaries * 0.9), achieved: Math.round(targetBeneficiaries * 0.89) },
          { year: '2024/2025', target: targetBeneficiaries, achieved: Math.round(targetBeneficiaries * 0.93) },
        ],
      },
      {
        id: `kpi-${entity.id}-2`,
        entityId: entity.id,
        entityName: entity.name,
        programmeName: 'Job Creation & Youth Economic Stimulus',
        name: 'Youth Jobs and Work Opportunities Created (Presidential Stimulus)',
        description: 'EPWP and presidential stimulus temporary and permanent work contracts created for unemployed youth.',
        unitOfMeasure: 'Jobs Created',
        baseline: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.7),
        annualTarget: entity.jobStats.targetJobsAnnual || 100,
        q1Target: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25),
        q1Actual: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25 * (perfMod > 0.9 ? 1.05 : 0.8)),
        q2Target: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25),
        q2Actual: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25 * (perfMod > 0.9 ? 1.0 : 0.75)),
        q3Target: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25),
        q3Actual: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25 * (perfMod > 0.9 ? 0.95 : 0.7)),
        q4Target: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.25),
        currentValue: entity.jobStats.youthJobsCreated || Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.75 * perfMod),
        expectedValue: Math.round((entity.jobStats.targetJobsAnnual || 100) * 0.75),
        percentageAchieved: Math.min(100, Math.round(((entity.jobStats.youthJobsCreated || 75) / (entity.jobStats.targetJobsAnnual || 100)) * 1000) / 10),
        status: perfMod >= 0.9 ? 'ON_TRACK' : perfMod >= 0.7 ? 'AT_RISK' : 'MISSED',
        historicalPerformance: [
          { year: '2022/2023', target: 80, achieved: 78 },
          { year: '2023/2024', target: 90, achieved: 92 },
          { year: '2024/2025', target: 100, achieved: 96 },
        ],
      }
    );
  });

  return allKpis;
}

/**
 * Generates official quarterly reports for all 32 entities, strictly reconciling
 * with each entity's expenditure, transferred amount, and KPI performance.
 */
export function generateOfficialReports(entities: PublicEntity[], kpis: KPIRecord[]): QuarterlyReport[] {
  const reports: QuarterlyReport[] = [];

  entities.forEach(entity => {
    const entityKpis = kpis.filter(k => k.entityId === entity.id);
    const code = entity.shortCode.toUpperCase();
    const totalExp = entity.reportedExpenditureZAR;
    const transferred = entity.transferredAmountZAR;

    // Split expenditure across Q1, Q2, Q3 so the sum equals entity.reportedExpenditureZAR
    const q1Spend = Math.round(totalExp * 0.35);
    const q2Spend = Math.round(totalExp * 0.35);
    const q3Spend = totalExp - (q1Spend + q2Spend);

    // Q1 Report (Fully Verified & Approved)
    const q1Items: ReportItem[] = entityKpis.map(k => ({
      id: `item-${k.id}-q1`,
      kpiId: k.id,
      kpiName: k.name,
      targetToDate: k.q1Target,
      actualAchieved: k.q1Actual || k.q1Target,
      unit: k.unitOfMeasure,
      status: (k.q1Actual || k.q1Target) >= k.q1Target ? 'ON_TRACK' : 'AT_RISK',
      variancePercentage: k.q1Target > 0 ? Math.round((((k.q1Actual || k.q1Target) - k.q1Target) / k.q1Target) * 1000) / 10 : 0,
      varianceReason: 'Completed in accordance with scheduled Q1 operational milestones.',
    }));

    reports.push({
      id: `rep-${entity.id}-q1`,
      entityId: entity.id,
      entityName: entity.name,
      financialYear: '2025/2026',
      quarter: 'Q1',
      submissionStatus: 'APPROVED',
      dueDate: '2025-07-31T23:59:59.000Z',
      submittedAt: '2025-07-25T14:30:00.000Z',
      submittedBy: entity.reportingOfficerName || entity.headOfEntity,
      submittedByName: entity.reportingOfficerName || entity.headOfEntity,
      reviewedAt: '2025-08-05T10:00:00.000Z',
      reviewedBy: 'Sicelo Sakhile Mkhize (DSAC Admin)',
      reviewedByName: 'Sicelo Sakhile Mkhize (DSAC Admin)',
      reviewNotes: 'Q1 Performance Return verified against approved vote. Zero non-compliance findings.',
      fundsSpentThisQuarterZAR: q1Spend,
      totalFundsReceivedToDateZAR: Math.round(transferred * 0.33),
      items: q1Items,
      accountingOfficerDeclaration: true,
    });

    // Q2 Report (Fully Verified & Approved)
    const q2Items: ReportItem[] = entityKpis.map(k => ({
      id: `item-${k.id}-q2`,
      kpiId: k.id,
      kpiName: k.name,
      targetToDate: k.q1Target + k.q2Target,
      actualAchieved: (k.q1Actual || k.q1Target) + (k.q2Actual || k.q2Target),
      unit: k.unitOfMeasure,
      status: ((k.q1Actual || k.q1Target) + (k.q2Actual || k.q2Target)) >= (k.q1Target + k.q2Target) ? 'ON_TRACK' : 'AT_RISK',
      variancePercentage: (k.q1Target + k.q2Target) > 0 
        ? Math.round(((((k.q1Actual || k.q1Target) + (k.q2Actual || k.q2Target)) - (k.q1Target + k.q2Target)) / (k.q1Target + k.q2Target)) * 1000) / 10 
        : 0,
      varianceReason: 'Portfolio of Evidence reconciled with audited expenditure vouchers.',
    }));

    reports.push({
      id: `rep-${entity.id}-q2`,
      entityId: entity.id,
      entityName: entity.name,
      financialYear: '2025/2026',
      quarter: 'Q2',
      submissionStatus: 'APPROVED',
      dueDate: '2025-10-31T23:59:59.000Z',
      submittedAt: '2025-10-28T11:15:00.000Z',
      submittedBy: entity.reportingOfficerName || entity.headOfEntity,
      submittedByName: entity.reportingOfficerName || entity.headOfEntity,
      reviewedAt: '2025-11-04T15:20:00.000Z',
      reviewedBy: 'Sicelo Sakhile Mkhize (DSAC Admin)',
      reviewedByName: 'Sicelo Sakhile Mkhize (DSAC Admin)',
      reviewNotes: 'Section 38 compliance certificate attached and confirmed in order.',
      fundsSpentThisQuarterZAR: q2Spend,
      totalFundsReceivedToDateZAR: Math.round(transferred * 0.67),
      items: q2Items,
      accountingOfficerDeclaration: true,
    });

    // Q3 Report (Current Active Period)
    let q3Status: ReportStatus = 'APPROVED';
    let q3SubmittedAt: string | undefined = '2026-04-20T10:00:00.000Z';
    let q3ReviewedAt: string | undefined = '2026-04-25T14:00:00.000Z';
    let q3Reviewer: string | undefined = 'Sicelo Sakhile Mkhize (DSAC Admin)';
    let q3Notes: string | undefined = 'Performance target milestones confirmed. Good institutional governance.';
    let q3RejectionReason: string | undefined = undefined;

    if (code === 'SAHRA') {
      q3Status = 'CORRECTION_REQUIRED';
      q3SubmittedAt = '2026-04-28T14:32:00.000Z';
      q3ReviewedAt = '2026-05-02T10:15:00.000Z';
      q3Reviewer = 'Sicelo Sakhile Mkhize (DSAC Admin)';
      q3Notes = 'Q3 Heritage Sites Assessed target achieved only 8 of 15 expected. Variance exceeds 15% statutory threshold without an attached Board-approved recovery plan. Portfolio of Evidence for provincial site visits in the Eastern Cape is missing required field verification stamps.';
      q3RejectionReason = 'Under-performance on KPI-1 and incomplete Portfolio of Evidence for Eastern Cape sites.';
    } else if (code === 'BSA') {
      q3Status = 'OVERDUE';
      q3SubmittedAt = undefined;
      q3ReviewedAt = undefined;
      q3Reviewer = undefined;
      q3Notes = 'Statutory deadline missed. Administrative dispute and board governance challenges cited.';
      q3RejectionReason = 'Statutory deadline missed. Notice of non-compliance issued.';
    } else if (code === 'NAC') {
      q3Status = 'OVERDUE';
      q3SubmittedAt = undefined;
      q3ReviewedAt = undefined;
      q3Reviewer = undefined;
      q3Notes = 'Statutory deadline missed. Grant disbursement reconciliation backlog.';
      q3RejectionReason = 'Statutory deadline missed. Section 38 letter dispatched.';
    } else if (code === 'PACOFS') {
      q3Status = 'CORRECTION_REQUIRED';
      q3SubmittedAt = '2026-04-29T16:40:00.000Z';
      q3ReviewedAt = '2026-05-02T14:30:00.000Z';
      q3Reviewer = 'Sicelo Sakhile Mkhize (DSAC Admin)';
      q3Notes = '3 unresolved AGSA asset register findings on fixed theatre assets and lease accounting schedules. Management remediation plan and updated physical inventory log required.';
      q3RejectionReason = 'Deficient fixed theatre asset register reconciliation and unresolved Auditor-General findings.';
    } else if (code === 'TPC') {
      q3Status = 'UNDER_REVIEW';
      q3SubmittedAt = '2026-04-29T16:40:00.000Z';
      q3ReviewedAt = undefined;
      q3Reviewer = undefined;
      q3Notes = 'Under technical review by DSAC Public Entities Directorate.';
    } else if (entity.overallComplianceScore < 70) {
      q3Status = 'RESUBMITTED';
      q3SubmittedAt = '2026-05-03T09:10:00.000Z';
      q3ReviewedAt = undefined;
      q3Reviewer = undefined;
      q3Notes = 'Resubmitted with revised asset registers and procurement logs.';
    }

    const q3Items: ReportItem[] = entityKpis.map(k => {
      const exp = k.expectedValue;
      const act = k.currentValue;
      const variance = exp > 0 ? Math.round(((act - exp) / exp) * 1000) / 10 : 0;
      return {
        id: `item-${k.id}-q3`,
        kpiId: k.id,
        kpiName: k.name,
        targetToDate: exp,
        actualAchieved: act,
        unit: k.unitOfMeasure,
        status: act >= exp * 0.9 ? 'ON_TRACK' : act >= exp * 0.7 ? 'AT_RISK' : 'MISSED',
        variancePercentage: variance,
        varianceReason: variance < 0 ? 'Operational backlog and field logistics encountered in rural service points.' : 'Milestones achieved ahead of schedule.',
        correctiveAction: variance < 0 ? 'Recovery action plan initiated to clear variance in Q4.' : undefined,
      };
    });

    reports.push({
      id: `rep-${entity.id}-q3`,
      entityId: entity.id,
      entityName: entity.name,
      financialYear: '2025/2026',
      quarter: 'Q3',
      submissionStatus: q3Status,
      dueDate: '2026-04-30T23:59:59.000Z',
      submittedAt: q3SubmittedAt,
      submittedBy: q3SubmittedAt ? (entity.reportingOfficerName || entity.headOfEntity) : undefined,
      submittedByName: q3SubmittedAt ? (entity.reportingOfficerName || entity.headOfEntity) : undefined,
      reviewedAt: q3ReviewedAt,
      reviewedBy: q3Reviewer,
      reviewedByName: q3Reviewer,
      reviewNotes: q3Notes,
      rejectionReason: q3RejectionReason,
      fundsSpentThisQuarterZAR: q3Spend,
      totalFundsReceivedToDateZAR: transferred,
      items: q3Items,
      accountingOfficerDeclaration: q3SubmittedAt ? true : false,
    });
  });

  return reports;
}
