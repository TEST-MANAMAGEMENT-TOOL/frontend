import { PdfTestPlanData } from "@/types/test-plan";
import {
  TDocumentDefinitions,
  TFontDictionary,
  Content,
  Alignment,
  Style,
  Margins,
} from 'pdfmake/interfaces';

const COLORS = {
  PRIMARY: '#134e6d',
  ACCENT: '#0d9488',
  DARK_GRAY: '#334155',
  MEDIUM_GRAY: '#64748b',
  LIGHT_GRAY: '#f1f5f9',
  WHITE: '#ffffff',
  BORDER: '#cbd5e1',
};

const loadPdfMake = async (): Promise<any> => {
  if (typeof window === 'undefined') {
    throw new Error('PDF generation is only available in the browser');
  }

  const pdfMakeModule = await import('pdfmake/build/pdfmake');
  const pdfFontsModule = await import('pdfmake/build/vfs_fonts');

  const pdfMake = pdfMakeModule.default;
  const vfs = (pdfFontsModule as any).default?.pdfMake?.vfs;
  if (vfs) {
    (pdfMake as any).vfs = vfs;
  }

  (pdfMake as any).fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    }
  } as TFontDictionary;

  return pdfMake;
};

const formatDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return dateString || 'N/A';
  }
};

class TestPlanPdfGenerator {
  private data: PdfTestPlanData;

  constructor(data: PdfTestPlanData) {
    this.data = data;
  }

  private getDocDefinition(): TDocumentDefinitions {
    return {
      pageSize: 'A4',
      pageMargins: [50, 65, 50, 50],
      defaultStyle: {
        font: 'Roboto',
        fontSize: 12,
        lineHeight: 1.4,
        color: COLORS.DARK_GRAY,
      },
      header: (currentPage: number, pageCount: number) => this.renderHeader(currentPage, pageCount),
      footer: (currentPage: number, pageCount: number) => this.renderFooter(currentPage, pageCount),
      content: [
        this.renderCoverPage(),
        this.renderTableOfContents(),
        this.renderSection('1. Document Control', this.renderDocumentControl(), 'Document Control'),
        this.renderSection('2. Introduction & Objectives', this.renderIntroductionObjectives(), 'Introduction & Objectives'),
        this.renderSection('3. Scope Definition', this.renderScopeDefinition(), 'Scope Definition'),
        this.renderSection('4. Test Strategy', this.renderTestStrategy(), 'Test Strategy'),
        this.renderSection('5. Test Environment & Criteria', this.renderEnvironmentCriteria(), 'Test Environment & Criteria'),
        this.renderSection('6. Roles & Responsibilities', this.renderRolesResponsibilities(), 'Roles & Responsibilities'),
        this.renderSection('7. Schedule & Milestones', this.renderSchedule(), 'Schedule & Milestones'),
        this.renderSection('8. Risks & Mitigation', this.renderRisks(), 'Risks & Mitigation'),
      ].filter(Boolean) as Content[],
      styles: this.getStyles(),
    };
  }

  private renderSection(title: string, content: Content | Content[], _tocTitle?: string): Content {
    return {
      stack: [
        { text: title, style: 'sectionHeader', tocItem: true },
        content,
      ],
      pageBreak: 'after',
    };
  }

  private renderHeader(currentPage: number, pageCount: number): Content | null {
    if (currentPage === 1) return null;
    return {
      columns: [
        { text: `${this.data.projectName || 'Test Plan'}`, fontSize: 9, bold: true, color: COLORS.PRIMARY },
        {
          text: `Version: ${this.data.version || '1.0'} | ${formatDate(this.data.dateCreated)}`,
          alignment: 'right' as Alignment,
          fontSize: 9,
          color: COLORS.MEDIUM_GRAY,
        },
      ],
      margin: [50, 20, 50, 0] as Margins,
    };
  }

  private renderFooter(currentPage: number, pageCount: number): Content | null {
    if (currentPage === 1) return null;
    return {
      stack: [
        { canvas: [{ type: 'line', x1: 50, y1: 10, x2: 545, y2: 10, lineWidth: 1, lineColor: COLORS.ACCENT }] },
        { text: `Page ${currentPage} of ${pageCount}`, alignment: 'center' as Alignment, fontSize: 9, margin: [0, 15, 0, 0] as Margins },
      ],
    };
  }

  private renderCoverPage(): Content {
    const projectName = (this.data.projectName || this.data.name || this.data.title || 'Untitled Project').toString();

    return {
      stack: [
        {
          text: 'TEST PLAN DOCUMENT',
          style: 'coverBadge',
          color: COLORS.WHITE,
          background: COLORS.PRIMARY,
          alignment: 'center',
          margin: [0, 100, 0, 0] as Margins,
        },
        {
          text: projectName.toUpperCase(),
          style: 'coverTitle',
          color: COLORS.PRIMARY,
          margin: [0, 10, 0, 10] as Margins,
        },
        {
          text: `Version ${this.data.version || '1.0'}`,
          style: 'coverSubtitle',
          color: COLORS.ACCENT,
          alignment: 'center',
          margin: [0, 10, 0, 50] as Margins,
        },
        { canvas: [{ type: 'line', x1: 200, y1: 0, x2: 350, y2: 0, lineWidth: 0.5, lineColor: COLORS.BORDER }], margin: [0, 0, 0, 30] as Margins },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [{ text: 'Prepared By:', style: 'label' }, { text: this.data.preparedBy || 'N/A', style: 'coverMeta' }],
              [{ text: 'Date Created:', style: 'label' }, { text: formatDate(this.data.dateCreated || new Date().toISOString()), style: 'coverMeta' }],
              [{ text: 'Reviewed By:', style: 'label' }, { text: this.data.reviewedBy || 'N/A', style: 'coverMeta' }],
              [{ text: 'Approval Date:', style: 'label' }, { text: formatDate(this.data.approvalDate || ''), style: 'coverMeta' }],
            ],
          },
          layout: 'noBorders',
          alignment: 'center',
          margin: [100, 0, 100, 0] as Margins,
        },
      ],
      pageBreak: 'after',
    };
  }

  private renderTableOfContents(): Content {
    return {
      stack: [
        { text: 'Table of Contents', style: 'header' },
        {
          toc: {
            title: { text: 'Table of Contents', style: 'header' },
          },
        },
      ],
      margin: [0, 0, 0, 20] as Margins,
      pageBreak: 'after',
    };
  }

  private renderDocumentControl(): Content {
    const safe = (value: any, fallback = 'N/A') => (value != null ? value : fallback);

    return {
      table: {
        headerRows: 1,
        widths: ['25%', '75%'],
        body: [
          [{ text: 'Property', style: 'tableHeader' }, { text: 'Detail', style: 'tableHeader' }],
          ['Project Name', safe(this.data.projectName || this.data.name || this.data.title)],
          ['Document Version', safe(this.data.version, '1.0')],
          ['Prepared By', safe(this.data.preparedBy || this.data.createdBy)],
          ['Date Created', formatDate(safe(this.data.dateCreated || this.data.createdAt, new Date().toISOString()))],
          ['Reviewed By', safe(this.data.reviewedBy)],
          ['Approval Date', formatDate(safe(this.data.approvalDate, ''))],
          ['Document Status', this.data.approvalDate ? 'Approved' : 'Draft'],
        ].filter((row) => row[1] !== ''),
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0.5,
        hLineColor: (i, node) => (i === 0 || i === node.table.body.length) ? COLORS.PRIMARY : COLORS.BORDER,
        vLineColor: () => COLORS.BORDER,
        fillColor: (i) => (i % 2 === 0 && i > 0) ? COLORS.LIGHT_GRAY : null,
      },
    };
  }

  private renderIntroductionObjectives(): Content[] {
    return [
      { text: 'Introduction', style: 'subheader' },
      { text: this.data.introduction || 'No introduction provided.', margin: [0, 0, 0, 15] as Margins },
      { text: 'Objectives', style: 'subheader' },
      { text: this.data.objectives || 'No objectives defined.', margin: [0, 0, 0, 15] as Margins },
    ];
  }

  private renderScopeDefinition(): Content[] {
    return [
      { text: 'In Scope', style: 'subheader' },
      { text: this.data.inScope || 'No in-scope items defined.', margin: [0, 0, 0, 10] as Margins },
      { text: 'Out of Scope', style: 'subheader' },
      { text: this.data.outOfScope || 'No out-of-scope items defined.', margin: [0, 0, 0, 15] as Margins },
    ];
  }

  private renderTestStrategy(): Content[] {
    return [
      { text: 'Test Strategy Overview', style: 'subheader' },
      { text: this.data.testStrategy || 'No test strategy overview provided.', margin: [0, 0, 0, 10] as Margins },
      { text: 'Features to be Tested (Test Items)', style: 'subheader' },
      { text: this.data.testItems || 'No test items defined.', margin: [0, 0, 0, 15] as Margins },
    ];
  }

  private renderEnvironmentCriteria(): Content[] {
    return [
      { text: 'Test Environment', style: 'subheader' },
      { text: this.data.testEnvironment || 'Test environment details not specified.', margin: [0, 0, 0, 10] as Margins },
      { text: 'Entry Criteria', style: 'subheader' },
      { text: this.data.entryCriteria || 'Entry criteria not specified.', margin: [0, 0, 0, 10] as Margins },
      { text: 'Exit Criteria', style: 'subheader' },
      { text: this.data.exitCriteria || 'Exit criteria not specified.', margin: [0, 0, 0, 10] as Margins },
      { text: 'Test Deliverables', style: 'subheader' },
      { text: this.data.testDeliverables || 'Test deliverables not specified.', margin: [0, 0, 0, 15] as Margins },
    ];
  }

  private renderRolesResponsibilities(): Content {
    if (!this.data.roles?.length) return { text: 'No roles and responsibilities defined.', margin: [0, 0, 0, 15] as Margins };

    const body = [
      [{ text: 'Team Member', style: 'tableHeader' }, { text: 'Role', style: 'tableHeader' }, { text: 'Key Responsibilities', style: 'tableHeader' }],
      ...this.data.roles.map((r) => [r.name, r.role, r.responsibilities || 'N/A']),
    ];

    return {
      table: {
        headerRows: 1,
        widths: ['30%', '30%', '40%'],
        body,
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15] as Margins,
    };
  }

  private renderSchedule(): Content {
    if (!this.data.schedule?.length) return { text: 'No schedule and milestones defined.', margin: [0, 0, 0, 15] as Margins };

    const body = [
      [{ text: 'Task', style: 'tableHeader' }, { text: 'Start Date', style: 'tableHeader' }, { text: 'End Date', style: 'tableHeader' }, { text: 'Owner', style: 'tableHeader' }],
      ...this.data.schedule.map((s) => [s.task, formatDate(s.startDate), formatDate(s.endDate), s.owner]),
    ];

    return {
      table: {
        headerRows: 1,
        widths: ['*', '15%', '15%', '15%'],
        body,
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15] as Margins,
    };
  }

  private renderRisks(): Content {
    if (!this.data.risks?.length) return { text: 'No risks and mitigation strategies defined.', margin: [0, 0, 0, 15] as Margins };

    const body = [
      [{ text: 'Risk Description', style: 'tableHeader' }, { text: 'Impact', style: 'tableHeader' }, { text: 'Mitigation Strategy', style: 'tableHeader' }],
      ...this.data.risks.map((r) => [r.risk, r.impact, r.mitigation || 'N/A']),
    ];

    return {
      table: {
        headerRows: 1,
        widths: ['40%', '15%', '45%'],
        body,
      },
      layout: 'lightHorizontalLines',
      margin: [0, 0, 0, 15] as Margins,
    };
  }

  private getStyles(): Record<string, Style> {
    return {
      header: {
        fontSize: 20,
        bold: true,
        margin: [0, 15, 0, 10] as Margins,
        color: COLORS.PRIMARY,
      },
      sectionHeader: {
        fontSize: 16,
        bold: true,
        color: COLORS.PRIMARY,
        margin: [0, 20, 0, 10] as Margins,
      },
      subheader: {
        fontSize: 12,
        bold: true,
        color: COLORS.ACCENT,
        margin: [0, 10, 0, 5] as Margins,
      },
      label: {
        fontSize: 12,
        bold: true,
        color: COLORS.MEDIUM_GRAY,
      },
      tableHeader: {
        fontSize: 12,
        bold: true,
        fillColor: COLORS.PRIMARY,
        color: COLORS.WHITE,
        alignment: 'center' as Alignment,
        margin: [0, 5, 0, 5] as Margins,
      },
      coverTitle: {
        fontSize: 30,
        bold: true,
        alignment: 'center' as Alignment,
        margin: [0, 15, 0, 15] as Margins,
      },
      coverSubtitle: {
        fontSize: 18,
        bold: true,
        alignment: 'center' as Alignment,
      },
      coverBadge: {
        fontSize: 12,
        bold: true,
        margin: [0, 0, 0, 10] as Margins,
        alignment: 'center' as Alignment,
      },
      coverMeta: {
        fontSize: 12,
        alignment: 'center' as Alignment,
        margin: [0, 5, 0, 15] as Margins,
      },
    };
  }

  public async generate(): Promise<void> {
    try {
      const pdfMake = await loadPdfMake();
      const docDefinition = this.getDocDefinition();

      const fileName = (this.data.projectName || this.data.name || this.data.title || 'Untitled_Project')
        .toString()
        .replace(/[^\w\s-]/g, '_')
        .replace(/\s+/g, '_')
        .substring(0, 100);

      const pdfDoc = (pdfMake as any).createPdf(docDefinition);
      pdfDoc.download(`TestPlan_${fileName}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw new Error('Failed to generate PDF');
    }
  }

  public async preview(): Promise<void> {
    try {
      const pdfMake = await loadPdfMake();
      const docDefinition = this.getDocDefinition();

      const pdfDoc = (pdfMake as any).createPdf(docDefinition);
      pdfDoc.getBlob((blob: Blob) => {
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 60_000);
      });
    } catch (error) {
      console.error('Error previewing PDF:', error);
      throw new Error('Failed to preview PDF');
    }
  }
}

export const generateTestPlanPDF = async (data: PdfTestPlanData): Promise<void> => {
  const generator = new TestPlanPdfGenerator(data);
  return generator.generate();
};

export const previewTestPlanPDF = async (data: PdfTestPlanData): Promise<void> => {
  const generator = new TestPlanPdfGenerator(data);
  return generator.preview();
};