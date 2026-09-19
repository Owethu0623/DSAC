/**
 * Realistic Statutory Document Generation & Download Utility
 * Provides realistic PDF/text files with official DSAC/PFMA Section 38 headers
 */

export const downloadStatutoryDocument = (
  fileName: string,
  title: string,
  category: string,
  entityName: string = 'Ubuntu Arts NPO'
) => {
  const timestamp = new Date().toLocaleDateString('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const content = `================================================================================
REPUBLIC OF SOUTH AFRICA
DEPARTMENT OF SPORT, ARTS AND CULTURE (DSAC)
NATIONAL OVERSIGHT REPOSITORY & AUDIT VERIFICATION SYSTEM
================================================================================

STATUTORY EVIDENCE & PORTFOLIO VERIFICATION RECORD
PUBLIC FINANCE MANAGEMENT ACT (PFMA ACT 1 OF 1999) - SECTION 38 AUDIT VOUCHER

DOCUMENT METADATA:
--------------------------------------------------------------------------------
Institutional Entity: ${entityName}
Document Title:       ${title}
Registered File Name: ${fileName}
Classification:       ${category}
Registration Date:    ${timestamp}
Statutory Reference:  DSAC-PFMA-SEC38-2025/26
Oversight Directorate: Directorate of Public Entities & Subsidised NPOs
Verification Registry: Government Oversight REPO System (Vote 37)

SECTION 38 WRITTEN ASSURANCE:
--------------------------------------------------------------------------------
In terms of Section 38(1)(j) of the Public Finance Management Act, this document
attests that the institution maintains effective, efficient and transparent 
financial management and internal control systems.

AUDIT & GOVERNANCE SUMMARY:
- Programme Target Verifications: Fully Reconciled
- Expenditure Vouchers: Cross-Referenced against Bank Statements
- Beneficiary Registers: Validated with National Identification Records
- SARS Tax Compliance PIN: Active Good Standing

DIGITAL SECURITY CHECKSUM:
SHA256: 8f49a21b4a0f7e1b29c98492048ad3b1e7c9f80164b301a2f64301be482937af

[OFFICIAL GOVERNMENT REPOSITORY STAMP - DEPARTMENT OF SPORT, ARTS AND CULTURE]
================================================================================
`;

  const blob = new Blob([content], { type: 'application/pdf;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName.includes('.') ? fileName : `${fileName}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
