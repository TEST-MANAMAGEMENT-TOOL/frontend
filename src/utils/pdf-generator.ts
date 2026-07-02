// =============================================================================
// UPDATED PDF GENERATOR CODE (Fixing TypeScript Errors)
// =============================================================================

import jsPDF, { GState } from 'jspdf';
import autoTable, { Styles, FontStyle } from 'jspdf-autotable'; // <-- FIX: Imports FontStyle and Styles from jspdf-autotable
// Assuming these types are available in your project environment
import { QaReport } from '@/types/qa-report'; 
import { TestPlan } from '@/pages/TestPlans'; 

// =============================================================================
// FILE 1: PDF CONFIGURATION AND TYPES (pdf-config.ts)
// =============================================================================

export type RGBColor = [number, number, number]; 

export interface PDFMargins {
  left: number;
  right: number;
  top: number;
  bottom: number;
}

export interface PDFColors {
  primary: RGBColor;
  secondary: RGBColor;
  accent: RGBColor;
  success: RGBColor;
  warning: RGBColor;
  danger: RGBColor;
  darkGray: RGBColor;
  mediumGray: RGBColor;
  lightGray: RGBColor;
  border: RGBColor;
  headerBg: RGBColor;
  white: RGBColor;
}

export interface KeyValueItem {
  label: string;
  value: string;
  highlight?: boolean;
  color?: RGBColor;
}

export interface MetricCard {
  label: string;
  value: string;
  color: RGBColor;
  icon?: string;
}

export const PDF_CONFIG = {
  margins: {
    left: 20,
    right: 20,
    top: 25,
    bottom: 25
  } as PDFMargins,
  
  colors: {
    primary: [13, 71, 161] as RGBColor,
    secondary: [25, 118, 210] as RGBColor,
    accent: [0, 150, 136] as RGBColor,
    success: [46, 125, 50] as RGBColor,
    warning: [237, 108, 2] as RGBColor,
    danger: [211, 47, 47] as RGBColor,
    darkGray: [33, 33, 33] as RGBColor,
    mediumGray: [97, 97, 97] as RGBColor,
    lightGray: [245, 245, 245] as RGBColor,
    border: [224, 224, 224] as RGBColor,
    headerBg: [250, 250, 250] as RGBColor,
    white: [255, 255, 255] as RGBColor
  } as PDFColors,
  
  fonts: {
    title: 24,
    subtitle: 16,
    heading: 18,
    subheading: 13,
    body: 10,
    small: 9,
    tiny: 8,
    tableHeader: 10
  },
  
  layout: {
    pageWidth: 210,
    pageHeight: 297,
    cardHeight: 35,
    cardWidth: 85,
    cardGap: 10,
    sectionSpacing: 22,
    lineSpacing: 7,
    paragraphSpacing: 10
  },
  
  styling: {
    borderRadius: 4,
    lineWidth: 0.5,
    shadowOffset: 0.5
  }
} as const;

export const TABLE_STYLES = {
    base: (fontSize: number = PDF_CONFIG.fonts.body): Partial<Styles> => ({
        fontSize,
        cellPadding: 5,
        lineColor: PDF_CONFIG.colors.border,
        lineWidth: 0.3,
        textColor: PDF_CONFIG.colors.darkGray,
        overflow: 'linebreak' as 'linebreak',
        halign: 'left' as 'left',
        valign: 'middle' as 'middle'
    }),
    header: (): Partial<Styles> => ({
        fillColor: PDF_CONFIG.colors.primary,
        textColor: PDF_CONFIG.colors.white,
        fontStyle: 'bold' as FontStyle,
        fontSize: PDF_CONFIG.fonts.tableHeader,
        halign: 'center' as 'center',
        valign: 'middle' as 'middle',
        cellPadding: 6
    }),
    alternateRow: (): Partial<Styles> => ({
        fillColor: PDF_CONFIG.colors.lightGray
    })
} as const;

// =============================================================================
// FILE 2: UTILITY FUNCTIONS (pdf-utils.ts)
// =============================================================================

const getRagStatusColor = (status: string): RGBColor => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'green') return PDF_CONFIG.colors.success;
  if (statusLower === 'amber' || statusLower === 'yellow') return PDF_CONFIG.colors.warning;
  if (statusLower === 'red') return PDF_CONFIG.colors.danger;
  return PDF_CONFIG.colors.mediumGray;
};

const getSeverityColor = (severity: string): RGBColor => {
  const severityLower = severity.toLowerCase();
  if (severityLower === 'critical' || severityLower === 'high') return PDF_CONFIG.colors.danger;
  if (severityLower === 'major' || severityLower === 'medium') return PDF_CONFIG.colors.warning;
  if (severityLower === 'minor' || severityLower === 'low') return PDF_CONFIG.colors.accent;
  return PDF_CONFIG.colors.mediumGray;
};

const getPassRateColor = (passRate: number): RGBColor => {
  if (passRate >= 90) return PDF_CONFIG.colors.success;
  if (passRate >= 75) return PDF_CONFIG.colors.warning;
  return PDF_CONFIG.colors.danger;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return dateString;
  }
};

const calculateDuration = (startDate: string, endDate: string): string => {
  try {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '1d';
    if (diffDays < 7) return `${diffDays}d`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}w`;
    return `${Math.ceil(diffDays / 30)}m`;
  } catch {
    return 'N/A';
  }
};

const calculatePercentage = (value: number, total: number): string => {
  if (total === 0) return '0.0%';
  return `${((value / total) * 100).toFixed(1)}%`;
};

const calculateDefectDensity = (report: QaReport): string => {
  const totalDefects = report.defectsDistribution.total;
  const totalTestCases = report.testCaseExecution.totalTestCases;
  const density = totalTestCases > 0 ? (totalDefects / totalTestCases * 100) : 0;
  return `${density.toFixed(1)}%`;
};

const generateFilename = (type: string, projectName: string, version?: string): string => {
  const sanitizedName = projectName.replace(/[^a-zA-Z0-9]/g, '_');
  const timestamp = new Date().toISOString().split('T')[0];
  const versionStr = version ? `_v${version}` : '';
  return `${type}_${sanitizedName}${versionStr}_${timestamp}.pdf`;
};

const getRagStatusDescription = (status: string): string => {
  const statusLower = status.toLowerCase();
  if (statusLower === 'green') return 'indicating the project is on track with all quality metrics meeting expectations';
  if (statusLower === 'amber' || statusLower === 'yellow') return 'indicating some concerns requiring attention to meet quality objectives';
  if (statusLower === 'red') return 'indicating significant issues requiring immediate action and management intervention';
  return 'with status under review';
};

const getQualityAssessment = (passRate: number): string => {
  if (passRate >= 95) return 'excellent';
  if (passRate >= 85) return 'good';
  if (passRate >= 70) return 'satisfactory';
  return 'needs improvement in';
};

// =============================================================================
// FILE 3: CORE PDF GENERATOR CLASS (pdf-generator.ts)
// =============================================================================

export class PDFGenerator {
  private doc: jsPDF;
  private currentY: number;

  constructor() {
    this.doc = new jsPDF('p', 'mm', 'a4'); 
    this.currentY = PDF_CONFIG.margins.top;
  }

  public getDoc(): jsPDF {
    return this.doc;
  }

  // --- Page Management ---

  private addNewPage(): void {
    this.doc.addPage();
    this.currentY = PDF_CONFIG.margins.top;
  }

  private checkPageBreak(requiredSpace: number = PDF_CONFIG.layout.sectionSpacing * 2): void {
    const pageBottom = PDF_CONFIG.layout.pageHeight - PDF_CONFIG.margins.bottom;
    if (this.currentY + requiredSpace > pageBottom) {
      this.addNewPage();
    }
  }

  // --- Public Generation Methods ---

  public generateQaReport(report: QaReport): void {
    // Determine version safely, assuming it might be missing from the provided type
    const reportVersion = (report as any).version || '1.0'; 
    
    // 1. Cover Page
    this.renderQaReportCover(report);

    // 2. Content Pages
    this.addNewPage();
    
    this.currentY = this.renderExecutiveSummary(report);
    
    this.checkPageBreak(80);
    this.currentY = this.renderProjectInformation(report);
    
    this.checkPageBreak(120);
    this.currentY = this.renderQualityMetrics(report);
    
    this.checkPageBreak(100);
    this.currentY = this.renderTestExecution(report);
    
    this.checkPageBreak(100);
    this.currentY = this.renderDefectsAnalysis(report); // FIX: Removed 'doc' argument
    
    this.checkPageBreak(100);
    this.currentY = this.renderDefectStatus(report);
    
    if ((report as any).bugDetails && (report as any).bugDetails.length > 0) {
      this.checkPageBreak(60);
      this.currentY = this.renderBugDetails((report as any).bugDetails);
    }

    // 3. Finalization (applies to all pages)
    this.addDocumentFooter('QA Report', report.projectName, reportVersion); // FIX: Use safe version
    const filename = generateFilename('QA_Report', report.projectName, reportVersion); // FIX: Use safe version
    this.doc.save(filename);
  }

  public generateTestPlan(data: TestPlan): void {
    // 1. Cover Page
    this.renderTestPlanCover(data);
    
    // 2. Content Pages (forcing new page for structure)
    this.addNewPage(); this.renderTableOfContents();
    this.addNewPage(); this.renderDocumentControl(data);
    this.addNewPage(); this.renderIntroductionSection(data);
    this.addNewPage(); this.renderScopeSection(data);
    this.addNewPage(); this.renderTestStrategy(data);
    this.addNewPage(); this.renderEnvironmentCriteria(data);
    this.addNewPage(); this.renderRolesResponsibilities(data);
    this.addNewPage(); this.renderSchedule(data);
    this.addNewPage(); this.renderRisks(data);

    // 3. Finalization
    this.addDocumentFooter('Test Plan', data.projectName, `v${data.version}`);
    const filename = generateFilename('Test_Plan', data.projectName, data.version);
    this.doc.save(filename);
  }

  // =============================================================================
  // PRIVATE RENDERING METHODS - QA REPORT
  // =============================================================================

  private renderQaReportCover(report: QaReport): void {
    const doc = this.doc;
    const { colors, layout, styling } = PDF_CONFIG;

    const gradientSteps = 20;
    doc.setGState(doc.GState({ opacity: 0.8 }));
    for (let i = 0; i < gradientSteps; i++) {
        const opacity = 1 - (i / gradientSteps) * 0.3;
        const [r, g, b] = colors.primary;
        doc.setFillColor(r, g, b);
        doc.setGState(doc.GState({ opacity }));
        doc.rect(0, i * (layout.pageHeight / gradientSteps), layout.pageWidth, layout.pageHeight / gradientSteps, 'F');
    }
    doc.setGState(doc.GState({ opacity: 1 }));
    
    const containerX = 25;
    const containerY = 70;
    const containerWidth = 160;
    const containerHeight = 150;
    
    doc.setFillColor(0, 0, 0);
    doc.setGState(doc.GState({ opacity: 0.15 }));
    doc.roundedRect(containerX + 2, containerY + 2, containerWidth, containerHeight, styling.borderRadius, styling.borderRadius, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    
    doc.setFillColor(...colors.white);
    doc.roundedRect(containerX, containerY, containerWidth, containerHeight, styling.borderRadius, styling.borderRadius, 'F');
    
    doc.setFillColor(...colors.accent);
    doc.rect(containerX, containerY, 8, containerHeight, 'F');
    
    doc.setFillColor(...colors.primary);
    doc.roundedRect(containerX + 20, containerY + 15, 120, 12, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text('QUALITY ASSURANCE REPORT', 105, containerY + 22, { align: 'center' });
    
    doc.setFontSize(20);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    const titleLines = doc.splitTextToSize(report.reportTitle, 140);
    doc.text(titleLines, 105, containerY + 45, { align: 'center' });
    
    doc.setFontSize(14);
    doc.setTextColor(...colors.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(report.projectName, 105, containerY + 70, { align: 'center' });
    
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(0.5);
    doc.line(containerX + 40, containerY + 80, containerX + containerWidth - 40, containerY + 80);
    
    const ragColor = getRagStatusColor(report.ragStatus);
    doc.setFillColor(...ragColor);
    doc.roundedRect(containerX + 55, containerY + 95, 50, 18, 4, 4, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text(`RAG: ${report.ragStatus.toUpperCase()}`, 105, containerY + 106, { align: 'center' });
    
    doc.setFontSize(9);
    doc.setTextColor(...colors.mediumGray);
    doc.setFont('helvetica', 'normal');
    doc.text(`Report Period: ${formatDate(report.startDate)} - ${formatDate(report.endDate)}`, 105, containerY + 130, { align: 'center' });
    doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, 105, containerY + 140, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.mediumGray);
    doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', 105, 270, { align: 'center' });
  }

  private renderExecutiveSummary(report: QaReport): number {
    let y = this.renderSectionHeader('Executive Summary');
    const doc = this.doc;
    
    const passRate = report.testCaseExecution.passRate;
    const executionRate = report.testCaseExecution.executionRate;
    const totalDefects = report.defectsDistribution.total;
    const criticalDefects = report.defectsDistribution.critical;
    
    const summary = `This comprehensive Quality Assurance report presents a detailed analysis of testing activities for ${report.projectName} within ${report.cohort}. The project has achieved a **${passRate}%** test pass rate with **${executionRate}%** execution coverage, indicating ${getQualityAssessment(passRate)} quality standards.

During the testing cycle from ${formatDate(report.startDate)} to ${formatDate(report.endDate)}, the team executed ${report.testCaseExecution.testCasesExecuted} test cases out of ${report.testCaseExecution.totalTestCases} planned tests. A total of ${totalDefects} defects were identified across all severity levels, with ${criticalDefects} critical issues requiring immediate attention.

The project currently maintains a **${report.ragStatus.toUpperCase()} RAG status**, ${getRagStatusDescription(report.ragStatus)}.`;
    
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setTextColor(...PDF_CONFIG.colors.darkGray);
    doc.setFont('helvetica', 'normal');
    
    const maxWidth = PDF_CONFIG.layout.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;
    const lines = doc.splitTextToSize(summary, maxWidth);
    
    doc.setFillColor(...PDF_CONFIG.colors.lightGray);
    doc.roundedRect(PDF_CONFIG.margins.left - 5, y - 3, maxWidth + 10, lines.length * PDF_CONFIG.layout.lineSpacing + 10, 3, 3, 'F');
    
    doc.text(lines, PDF_CONFIG.margins.left, y + 2, { lineHeightFactor: 1.2 });
    
    return y + (lines.length * PDF_CONFIG.layout.lineSpacing * 1.2) + 25;
  }

  private renderProjectInformation(report: QaReport): number {
    let y = this.renderSectionHeader('Project Information');
    
    const projectInfo: KeyValueItem[] = [
      { label: 'Project Section', value: report.projectSection },
      { label: 'Cohort', value: report.cohort },
      { label: 'Project Name', value: report.projectName },
      { label: 'Testing Period', value: `${formatDate(report.startDate)} - ${formatDate(report.endDate)}` },
      { label: 'RAG Status', value: report.ragStatus.toUpperCase(), highlight: true, color: getRagStatusColor(report.ragStatus) },
      { label: 'Report Version', value: (report as any).version || 'v1.0' } // FIX: Use safe version access
    ];
    
    return this.renderKeyValueGrid(projectInfo, y);
  }

  private renderQualityMetrics(report: QaReport): number {
    let y = this.renderSectionHeader('Quality Metrics Dashboard');
    
    const metrics: MetricCard[] = [
      { 
        label: 'Test Execution Rate', 
        value: calculatePercentage(report.testCaseExecution.testCasesExecuted, report.testCaseExecution.totalTestCases), 
        color: PDF_CONFIG.colors.primary 
      },
      { 
        label: 'Test Pass Rate', 
        value: `${report.testCaseExecution.passRate}%`, 
        color: getPassRateColor(report.testCaseExecution.passRate) 
      },
      { 
        label: 'Defect Density', 
        value: calculateDefectDensity(report), 
        color: PDF_CONFIG.colors.secondary 
      },
      { 
        label: 'Critical Defects', 
        value: report.defectsDistribution.critical.toString(), 
        color: PDF_CONFIG.colors.danger 
      }
    ];
    
    return this.renderMetricCards(metrics, y);
  }

  private renderTestExecution(report: QaReport): number {
    let y = this.renderSectionHeader('Test Execution Summary');
    const doc = this.doc;
    const execution = report.testCaseExecution;

    const tableData = [
      ['Total Test Cases', execution.totalTestCases.toString(), '100.0%'],
      ['Executed', execution.testCasesExecuted.toString(), calculatePercentage(execution.testCasesExecuted, execution.totalTestCases)],
      ['Passed', execution.passedTestCases.toString(), calculatePercentage(execution.passedTestCases, execution.totalTestCases)],
      ['Failed', execution.failedTestCases.toString(), calculatePercentage(execution.failedTestCases, execution.totalTestCases)],
      ['Blocked', execution.blockedTestCases.toString(), calculatePercentage(execution.blockedTestCases, execution.totalTestCases)],
      ['Skipped', execution.skippedTestCases.toString(), calculatePercentage(execution.skippedTestCases, execution.totalTestCases)]
    ];
    
    autoTable(doc, {
      startY: y,
      head: [['Metric', 'Count', 'Percentage']],
      body: tableData,
      theme: 'grid',
      styles: TABLE_STYLES.base(),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' as FontStyle },
        1: { cellWidth: 40, halign: 'center' },
        2: { cellWidth: 40, halign: 'center' }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right }
    });
    
    this.currentY = (doc as any).lastAutoTable.finalY;
    return this.currentY + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderDefectsAnalysis(report: QaReport): number { // FIX: Removed 'doc' argument
    let y = this.renderSectionHeader('Defects Distribution Analysis');
    const dist = report.defectsDistribution;
    
    const tableData = [
      ['Critical', dist.critical.toString(), calculatePercentage(dist.critical, dist.total), 'Immediate Action Required'],
      ['Major', dist.major.toString(), calculatePercentage(dist.major, dist.total), 'High Priority Fix'],
      ['Medium', dist.medium.toString(), calculatePercentage(dist.medium, dist.total), 'Scheduled Resolution'],
      ['Low', dist.low.toString(), calculatePercentage(dist.low, dist.total), 'Backlog Item'],
      ['Total', dist.total.toString(), '100.0%', '']
    ];
    
    autoTable(this.doc, {
      startY: y,
      head: [['Severity', 'Count', 'Distribution', 'Action Priority']],
      body: tableData,
      theme: 'grid',
      styles: TABLE_STYLES.base(),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 35, fontStyle: 'bold' as FontStyle },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 35, halign: 'center' },
        3: { cellWidth: 'auto' }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right },
      didParseCell: (data) => {
        if (data.row.index === tableData.length - 1 && data.section === 'body') {
          data.cell.styles.fontStyle = 'bold' as FontStyle;
          data.cell.styles.fillColor = PDF_CONFIG.colors.lightGray;
        }
      }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
    return this.currentY + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderDefectStatus(report: QaReport): number {
    let y = this.renderSectionHeader('Defect Status Matrix');
    const status = report.defectStatus;

    const tableData = [
      ['Open', status.openCritical, status.openMajor, status.openMedium, status.openLow],
      ['In Progress', status.assignedCritical, status.assignedMajor, status.assignedMedium, status.assignedLow],
      ['Resolved', status.verifiedCritical, status.verifiedMajor, status.verifiedMedium, status.verifiedLow],
      ['Rejected', status.rejectedCritical, status.rejectedMajor, status.rejectedMedium, status.rejectedLow]
    ];
    
    autoTable(this.doc, {
      startY: y,
      head: [['Status', 'Critical', 'Major', 'Medium', 'Low']],
      body: tableData,
      theme: 'grid',
      styles: TABLE_STYLES.base(),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 40, fontStyle: 'bold' as FontStyle },
        1: { cellWidth: 30, halign: 'center' },
        2: { cellWidth: 30, halign: 'center' },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right }
    });
    
    this.currentY = (this.doc as any).lastAutoTable.finalY;
    return this.currentY + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderBugDetails(bugs: any[]): number {
    let y = this.renderSectionHeader('Critical Bug Details');
    const doc = this.doc;
    
    bugs.forEach((bug, index) => {
      this.checkPageBreak(65); 
      y = this.currentY;

      const cardX = PDF_CONFIG.margins.left;
      const cardWidth = PDF_CONFIG.layout.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right;
      const cardHeight = 55;
      
      doc.setFillColor(0, 0, 0);
      doc.setGState(doc.GState({ opacity: 0.1 }));
      doc.roundedRect(cardX + 1.5, y + 1.5, cardWidth, cardHeight, 4, 4, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      
      doc.setFillColor(...PDF_CONFIG.colors.white);
      doc.setDrawColor(...PDF_CONFIG.colors.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(cardX, y, cardWidth, cardHeight, 4, 4, 'FD');
      
      const severityColor = getSeverityColor(bug.severity);
      doc.setFillColor(...severityColor);
      doc.rect(cardX, y, 5, cardHeight, 'F');
      
      doc.setFillColor(...PDF_CONFIG.colors.headerBg);
      doc.roundedRect(cardX, y, cardWidth, 12, 4, 4, 'F');
      
      doc.setFontSize(10);
      doc.setTextColor(...PDF_CONFIG.colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(`BUG-${bug.bugId}`, cardX + 8, y + 8);
      
      doc.setTextColor(...PDF_CONFIG.colors.darkGray);
      const titleText = doc.splitTextToSize(bug.title, cardWidth - 50);
      doc.text(titleText[0], cardX + 35, y + 8);
      
      let metaY = y + 18;
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      
      doc.setFont('helvetica', 'bold');
      doc.text('Severity:', cardX + 8, metaY);
      doc.text('Priority:', cardX + 8, metaY + 6);
      doc.text('Status:', cardX + 8, metaY + 12);
      
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...severityColor);
      doc.text(bug.severity, cardX + 30, metaY);
      doc.setTextColor(...PDF_CONFIG.colors.darkGray);
      doc.text(bug.priority, cardX + 30, metaY + 6);
      doc.text(bug.status, cardX + 30, metaY + 12);

      doc.setFont('helvetica', 'bold');
      doc.text('Steps:', cardX + cardWidth / 2, metaY);
      doc.setFont('helvetica', 'normal');
      
      const stepsText = bug.stepsToProduce.substring(0, 150) + (bug.stepsToProduce.length > 150 ? '...' : '');
      const stepsLines = doc.splitTextToSize(stepsText, cardWidth / 2 - 10);
      doc.text(stepsLines, cardX + cardWidth / 2, metaY + 5);
      
      this.currentY = y + cardHeight + 8;
    });
    
    return this.currentY;
  }

  // =============================================================================
  // PRIVATE RENDERING METHODS - TEST PLAN
  // =============================================================================

  private renderTestPlanCover(data: TestPlan): void {
    const doc = this.doc;
    const { colors, layout } = PDF_CONFIG;

    doc.setFillColor(...colors.primary);
    doc.rect(0, 0, layout.pageWidth, layout.pageHeight, 'F'); 
    
    const containerX = 30;
    const containerY = 80;
    const containerWidth = 150;
    const containerHeight = 140;
    
    doc.setFillColor(0, 0, 0);
    doc.setGState(doc.GState({ opacity: 0.2 }));
    doc.roundedRect(containerX + 3, containerY + 3, containerWidth, containerHeight, 8, 8, 'F');
    doc.setGState(doc.GState({ opacity: 1 }));
    
    doc.setFillColor(...colors.white);
    doc.roundedRect(containerX, containerY, containerWidth, containerHeight, 8, 8, 'F');
    
    doc.setFillColor(...colors.accent);
    doc.rect(containerX, containerY, containerWidth, 5, 'F');
    
    doc.setFillColor(...colors.primary);
    doc.roundedRect(containerX + 25, containerY + 20, 100, 14, 4, 4, 'F');
    doc.setFontSize(12);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text('TEST PLAN DOCUMENT', 105, containerY + 29, { align: 'center' });
    
    doc.setFontSize(22);
    doc.setTextColor(...colors.primary);
    doc.setFont('helvetica', 'bold');
    const projectLines = doc.splitTextToSize(data.projectName, 130);
    doc.text(projectLines, 105, containerY + 55, { align: 'center' });
    
    doc.setFillColor(...colors.accent);
    doc.roundedRect(containerX + 50, containerY + 80, 50, 12, 3, 3, 'F');
    doc.setFontSize(10);
    doc.setTextColor(...colors.white);
    doc.text(`Version ${data.version}`, 105, containerY + 87, { align: 'center' });
    
    doc.setDrawColor(...colors.border);
    doc.setLineWidth(1);
    doc.line(containerX + 30, containerY + 100, containerX + containerWidth - 30, containerY + 100);
    
    doc.setFontSize(10);
    doc.setTextColor(...colors.darkGray);
    doc.setFont('helvetica', 'normal');
    doc.text(`Prepared by: ${data.preparedBy}`, 105, containerY + 115, { align: 'center' });
    doc.text(`Date: ${formatDate(data.dateCreated)}`, 105, containerY + 125, { align: 'center' });
    doc.text(`Reviewed by: ${data.reviewedBy}`, 105, containerY + 135, { align: 'center' });
    
    doc.setFillColor(...colors.success);
    doc.roundedRect(containerX + 45, containerY + 150, 60, 10, 3, 3, 'F');
    doc.setFontSize(8);
    doc.setTextColor(...colors.white);
    doc.setFont('helvetica', 'bold');
    doc.text('APPROVED FOR USE', 105, containerY + 157, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(...colors.white);
    doc.text('CONFIDENTIAL - FOR INTERNAL USE ONLY', 105, 275, { align: 'center' });
  }

  private renderTableOfContents(): void {
    const doc = this.doc;
    const { margins, colors, fonts } = PDF_CONFIG;

    const sections = [
      { title: 'Document Control', page: 3 },
      { title: '1. Introduction & Objectives', page: 4 },
      { title: '2. Scope Definition', page: 5 },
      { title: '3. Test Strategy', page: 6 },
      { title: '4. Test Environment & Criteria', page: 7 },
      { title: '5. Roles & Responsibilities', page: 8 },
      { title: '6. Schedule & Milestones', page: 9 },
      { title: '7. Risks & Mitigation', page: 10 }
    ];
    
    let y = this.renderSectionHeader('Table of Contents');
    y += 10;
    
    sections.forEach((section, index) => {
      doc.setFillColor(...colors.primary);
      doc.circle(margins.left + 3, y - 2, 4, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...colors.white);
      doc.setFont('helvetica', 'bold');
      doc.text((index + 1).toString(), margins.left + 3, y, { align: 'center' });
      
      doc.setFontSize(fonts.body);
      doc.setTextColor(...colors.darkGray);
      doc.setFont('helvetica', 'normal');
      doc.text(section.title, margins.left + 12, y);
      
      doc.setTextColor(...colors.mediumGray);
      const lineStart = margins.left + 15 + doc.getTextWidth(section.title);
      const lineEnd = 178;
      const dotCharWidth = doc.getTextWidth('.');
      const spaceWidth = doc.getTextWidth(' ');
      
      let currentX = lineStart + 1;
      let dotLine = '';
      while (currentX < lineEnd) {
          dotLine += '. ';
          currentX += dotCharWidth + spaceWidth;
      }

      doc.text(dotLine, lineStart, y);
      
      doc.setFontSize(fonts.body);
      doc.setTextColor(...colors.primary);
      doc.setFont('helvetica', 'bold');
      doc.text(section.page.toString(), 185, y);
      
      y += 10;
    });
    this.currentY = y;
  }

  private renderDocumentControl(data: TestPlan): void {
    let y = this.renderSectionHeader('Document Control');
    const controlData = [
      ['Project Name', data.projectName],
      ['Document Version', data.version],
      ['Prepared By', data.preparedBy],
      ['Date Created', formatDate(data.dateCreated)],
      ['Reviewed By', data.reviewedBy],
      ['Approval Date', formatDate(data.approvalDate)],
      ['Document Status', 'Approved'],
      ['Classification', 'Confidential']
    ];
    
    autoTable(this.doc, {
      startY: y,
      head: [['Document Information', 'Details']],
      body: controlData,
      theme: 'grid',
      styles: TABLE_STYLES.base(),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 70, fontStyle: 'bold' as FontStyle },
        1: { cellWidth: 'auto' }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right }
    });
    this.currentY = (this.doc as any).lastAutoTable.finalY + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderIntroductionSection(data: TestPlan): void {
    this.currentY = this.renderSectionHeader('1. Introduction & Objectives');
    this.currentY = this.renderContentBlock('Introduction', data.introduction, this.currentY);
    this.currentY = this.renderContentBlock('Objectives', data.objectives, this.currentY);
  }

  private renderScopeSection(data: TestPlan): void {
    this.currentY = this.renderSectionHeader('2. Scope Definition');
    this.currentY = this.renderContentBlock('In Scope', data.inScope, this.currentY);
    this.currentY = this.renderContentBlock('Out of Scope', data.outOfScope, this.currentY);
  }

  private renderTestStrategy(data: TestPlan): void {
    this.currentY = this.renderSectionHeader('3. Test Strategy');
    this.currentY = this.renderContentBlock('Test Strategy Overview', data.testStrategy, this.currentY);
    this.currentY = this.renderContentBlock('Features to be Tested', data.testItems, this.currentY);
  }

  private renderEnvironmentCriteria(data: TestPlan): void {
    this.currentY = this.renderSectionHeader('4. Test Environment & Criteria');
    this.currentY = this.renderContentBlock('Test Environment', data.testEnvironment, this.currentY);
    this.currentY = this.renderContentBlock('Entry Criteria', data.entryCriteria, this.currentY);
    this.currentY = this.renderContentBlock('Exit Criteria', data.exitCriteria, this.currentY);
    this.currentY = this.renderContentBlock('Test Deliverables', data.testDeliverables, this.currentY);
  }

  private renderRolesResponsibilities(data: TestPlan): void {
    let y = this.renderSectionHeader('5. Roles & Responsibilities');
    
    autoTable(this.doc, {
      startY: y,
      head: [['Team Member', 'Role', 'Key Responsibilities']],
      body: data.roles.map(role => [role.name, role.role, role.responsibilities]),
      theme: 'grid',
      styles: TABLE_STYLES.base(PDF_CONFIG.fonts.small),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 45, fontStyle: 'bold' as FontStyle },
        1: { cellWidth: 40 },
        2: { cellWidth: 'auto' }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right }
    });
    this.currentY = (this.doc as any).lastAutoTable.finalY + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderSchedule(data: TestPlan): void {
    let y = this.renderSectionHeader('6. Schedule & Milestones');
    
    autoTable(this.doc, {
      startY: y,
      head: [['Phase/Task', 'Start Date', 'End Date', 'Duration', 'Owner', 'Status']],
      body: data.schedule.map(item => [
        item.task,
        formatDate(item.startDate),
        formatDate(item.endDate),
        calculateDuration(item.startDate, item.endDate),
        item.owner,
        'Planned'
      ]),
      theme: 'grid',
      styles: TABLE_STYLES.base(PDF_CONFIG.fonts.small),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 55 },
        1: { cellWidth: 28 },
        2: { cellWidth: 28 },
        3: { cellWidth: 20, halign: 'center' },
        4: { cellWidth: 30 },
        5: { cellWidth: 25, halign: 'center' }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right }
    });
    this.currentY = (this.doc as any).lastAutoTable.finalY + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderRisks(data: TestPlan): void {
    let y = this.renderSectionHeader('7. Risks & Mitigation');
    
    autoTable(this.doc, {
      startY: y,
      head: [['Risk Description', 'Impact', 'Probability', 'Mitigation Strategy', 'Owner']],
      body: data.risks.map(risk => [
        risk.risk,
        risk.impact,
        'Medium',
        risk.mitigation,
        'Project Manager'
      ]),
      theme: 'grid',
      styles: TABLE_STYLES.base(PDF_CONFIG.fonts.small),
      headStyles: TABLE_STYLES.header(),
      alternateRowStyles: TABLE_STYLES.alternateRow(),
      columnStyles: {
        0: { cellWidth: 50 },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 25, halign: 'center' },
        3: { cellWidth: 55 },
        4: { cellWidth: 30 }
      },
      margin: { left: PDF_CONFIG.margins.left, right: PDF_CONFIG.margins.right }
    });
    this.currentY = (this.doc as any).lastAutoTable.finalY + PDF_CONFIG.layout.sectionSpacing;
  }

  // =============================================================================
  // REUSABLE UI COMPONENTS (Internal Helpers)
  // =============================================================================

  private renderSectionHeader(title: string): number {
    const doc = this.doc;
    const y = this.currentY;
    
    doc.setFillColor(...PDF_CONFIG.colors.headerBg);
    doc.rect(PDF_CONFIG.margins.left - 5, y - 3, PDF_CONFIG.layout.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right + 10, 14, 'F');
    
    doc.setFillColor(...PDF_CONFIG.colors.accent);
    doc.rect(PDF_CONFIG.margins.left - 5, y - 3, 5, 14, 'F');
    
    doc.setFontSize(PDF_CONFIG.fonts.heading);
    doc.setTextColor(...PDF_CONFIG.colors.primary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, PDF_CONFIG.margins.left + 3, y + 5);
    
    doc.setDrawColor(...PDF_CONFIG.colors.accent);
    doc.setLineWidth(0.8);
    doc.line(PDF_CONFIG.margins.left + 3, y + 8, PDF_CONFIG.margins.left + doc.getTextWidth(title) + 5, y + 8);
    
    return y + PDF_CONFIG.layout.sectionSpacing;
  }

  private renderKeyValueGrid(items: KeyValueItem[], yPos: number): number {
    const doc = this.doc;
    const col1X = PDF_CONFIG.margins.left;
    const col2X = 110;
    const colWidth = 85;
    let currentY = yPos;
    
    doc.setFontSize(PDF_CONFIG.fonts.body);
    
    items.forEach((item, index) => {
      const isCol1 = index % 2 === 0;
      const xPos = isCol1 ? col1X : col2X;
      
      if (index % 4 < 2) {
        doc.setFillColor(...PDF_CONFIG.colors.lightGray);
        doc.roundedRect(xPos - 2, currentY - 5, colWidth + 5, 12, 2, 2, 'F');
      }
      
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PDF_CONFIG.colors.darkGray);
      doc.text(`${item.label}:`, xPos, currentY);
      
      doc.setFont('helvetica', 'normal');
      if (item.highlight && item.color) {
        doc.setTextColor(...item.color);
        doc.setFont('helvetica', 'bold');
      } else if (item.highlight) {
        doc.setTextColor(...PDF_CONFIG.colors.accent);
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(...PDF_CONFIG.colors.mediumGray);
      }
      
      const valueX = xPos + 45;
      const maxValueWidth = colWidth - 45;
      const valueLines = doc.splitTextToSize(item.value, maxValueWidth);
      doc.text(valueLines[0], valueX, currentY);
      
      if (!isCol1 || index === items.length - 1) {
        currentY += PDF_CONFIG.layout.lineSpacing + 3;
      }
    });
    
    return currentY + PDF_CONFIG.layout.paragraphSpacing;
  }

  private renderMetricCards(metrics: MetricCard[], yPos: number): number {
    const doc = this.doc;
    const cardsPerRow = 2;
    const { cardWidth, cardHeight, cardGap } = PDF_CONFIG.layout;
    const startX = PDF_CONFIG.margins.left;
    let y = yPos;
    
    metrics.forEach((metric, index) => {
      const rowIndex = Math.floor(index / cardsPerRow);
      const colIndex = index % cardsPerRow;
      const xPos = startX + (colIndex * (cardWidth + cardGap));
      const cardY = y + (rowIndex * (cardHeight + 10));
      
      doc.setFillColor(0, 0, 0);
      doc.setGState(doc.GState({ opacity: 0.1 }));
      doc.roundedRect(xPos + 1.5, cardY + 1.5, cardWidth, cardHeight, 4, 4, 'F');
      doc.setGState(doc.GState({ opacity: 1 }));
      
      doc.setFillColor(...PDF_CONFIG.colors.white);
      doc.setDrawColor(...PDF_CONFIG.colors.border);
      doc.setLineWidth(0.5);
      doc.roundedRect(xPos, cardY, cardWidth, cardHeight, 4, 4, 'FD');
      
      doc.setFillColor(...metric.color);
      doc.roundedRect(xPos, cardY, cardWidth, 10, 4, 4, 'F');
      
      doc.setFontSize(18);
      doc.setTextColor(...metric.color);
      doc.setFont('helvetica', 'bold');
      doc.text(metric.value, xPos + cardWidth / 2, cardY + 23, { align: 'center' });
      
      doc.setFontSize(9);
      doc.setTextColor(...PDF_CONFIG.colors.mediumGray);
      doc.setFont('helvetica', 'normal');
      doc.text(metric.label.toUpperCase(), xPos + cardWidth / 2, cardY + 31, { align: 'center' });
    });
    
    const totalRows = Math.ceil(metrics.length / cardsPerRow);
    return y + (totalRows * (cardHeight + 10)) + PDF_CONFIG.layout.paragraphSpacing;
  }

  private renderContentBlock(title: string, content: string, yPos: number): number {
    const doc = this.doc;
    let y = yPos;
    
    doc.setFillColor(...PDF_CONFIG.colors.accent);
    doc.circle(PDF_CONFIG.margins.left + 2, y - 2, 2.5, 'F');
    
    doc.setFontSize(PDF_CONFIG.fonts.subheading);
    doc.setTextColor(...PDF_CONFIG.colors.secondary);
    doc.setFont('helvetica', 'bold');
    doc.text(title, PDF_CONFIG.margins.left + 8, y);
    
    y += 8;
    
    doc.setFontSize(PDF_CONFIG.fonts.body);
    doc.setTextColor(...PDF_CONFIG.colors.darkGray);
    doc.setFont('helvetica', 'normal');
    
    const maxWidth = PDF_CONFIG.layout.pageWidth - PDF_CONFIG.margins.left - PDF_CONFIG.margins.right - 5;
    const lines = doc.splitTextToSize(content, maxWidth);
    
    doc.setFillColor(...PDF_CONFIG.colors.lightGray);
    doc.roundedRect(PDF_CONFIG.margins.left, y - 3, maxWidth + 5, lines.length * PDF_CONFIG.layout.lineSpacing + 8, 3, 3, 'F');
    
    doc.text(lines, PDF_CONFIG.margins.left + 3, y + 2, { lineHeightFactor: 1.2 });
    
    return y + (lines.length * PDF_CONFIG.layout.lineSpacing * 1.2) + PDF_CONFIG.layout.sectionSpacing;
  }

  private addDocumentFooter(docType: string, projectName: string, version: string): void {
    const doc = this.doc;
    const pageCount = doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      doc.setFillColor(...PDF_CONFIG.colors.headerBg);
      doc.rect(0, 282, 210, 15, 'F');
      
      doc.setDrawColor(...PDF_CONFIG.colors.accent);
      doc.setLineWidth(1);
      doc.line(0, 282, 210, 282);
      
      doc.setFontSize(8);
      doc.setTextColor(...PDF_CONFIG.colors.mediumGray);
      doc.setFont('helvetica', 'normal');
      
      doc.text(`${docType} - ${projectName}`, PDF_CONFIG.margins.left, 290);
      
      doc.setFont('helvetica', 'bold');
      doc.text(`Page ${i} of ${pageCount}`, 105, 290, { align: 'center' });
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${version} | ${new Date().toLocaleDateString()}`, 190, 290, { align: 'right' });
    }
  }
}

// =============================================================================
// MAIN EXPORT FUNCTIONS (Entry Point)
// =============================================================================

export const generateQaReportPdf = (report: QaReport): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generateQaReport(report);
};

export const generateTestPlanPDF = (data: TestPlan): void => {
  const pdfGenerator = new PDFGenerator();
  pdfGenerator.generateTestPlan(data);
};