const pdfMake = require('pdfmake/build/pdfmake.js');
const pdfFonts = require('pdfmake/build/vfs_fonts');
import { TestPlan } from "@/pages/TestPlans";

// =============================================================================
// 1. CONFIGURATION CONSTANTS AND UTILS
// =============================================================================

// Define a common color palette for professional documents
const COLORS = {
  PRIMARY: '#134e6d', // Dark Teal/Blue
  ACCENT: '#0d9488', // Teal
  DARK_GRAY: '#334155',
  MEDIUM_GRAY: '#64748b',
  LIGHT_GRAY: '#f1f5f9',
  WHITE: '#ffffff',
  BORDER: '#cbd5e1',
};

// Font Setup (keeping the user's original Roboto setup, requires the TTF files)
if (typeof window !== 'undefined' && !(window as any).pdfMake) {
  (window as any).pdfMake = pdfMake;
  (window as any).pdfMake.vfs = pdfFonts.pdfMake.vfs;
  (window as any).pdfMake.fonts = {
    Roboto: {
      normal: 'Roboto-Regular.ttf',
      bold: 'Roboto-Medium.ttf',
      italics: 'Roboto-Italic.ttf',
      bolditalics: 'Roboto-MediumItalic.ttf'
    },
    // Adding a fallback system font
    SystemFont: {
        normal: 'Roboto-Regular.ttf', // Fallback to Roboto
        bold: 'Roboto-Medium.ttf',
        italics: 'Roboto-Italic.ttf',
        bolditalics: 'Roboto-Italic.ttf' // Corrected bolditalics fallback
    }
  };
}

const formatDate = (dateString: string): string => {
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateString || 'N/A';
    }
};


// =============================================================================
// 2. CORE GENERATOR CLASS
// =============================================================================

class TestPlanPdfGenerator {
  private data: TestPlan;

  constructor(data: TestPlan) {
    this.data = data;
    if (typeof window === 'undefined' || !(window as any).pdfMake) {
      throw new Error('PDF generation is only available in the browser.');
    }
  }

  /**
   * Generates the entire pdfmake document definition object.
   */
  private getDocDefinition() {
    return {
      pageSize: 'A4',
      pageMargins: [50, 65, 50, 50], // Tighter margins
      defaultStyle: {
        font: 'Roboto',
        fontSize: 10,
        lineHeight: 1.4,
        color: COLORS.DARK_GRAY,
      },
      header: (currentPage: number) => this.renderHeader(currentPage),
      footer: (currentPage: number, pageCount: number) => this.renderFooter(currentPage, pageCount),
      content: [
        this.renderCoverPage(),
        this.renderTableOfContents(),
        // FIX: Calls to renderSection will now work because the method is defined below
        this.renderSection('1. Document Control', this.renderDocumentControl()),
        this.renderSection('2. Introduction & Objectives', this.renderIntroductionObjectives()),
        this.renderSection('3. Scope Definition', this.renderScopeDefinition()),
        this.renderSection('4. Test Strategy', this.renderTestStrategy()),
        this.renderSection('5. Test Environment & Criteria', this.renderEnvironmentCriteria()),
        this.renderSection('6. Roles & Responsibilities', this.renderRolesResponsibilities()),
        this.renderSection('7. Schedule & Milestones', this.renderSchedule()),
        this.renderSection('8. Risks & Mitigation', this.renderRisks()),
      ].filter(Boolean), // Filter out any null/undefined sections
      styles: this.getStyles(),
    };
  }
  
  /**
   * FIX: Added missing renderSection method to wrap content blocks
   * @param title The section title (e.g., '1. Document Control')
   * @param content The content of the section (array of pdfmake elements)
   * @returns A stack containing the section header and content, followed by a page break.
   */
  private renderSection(title: string, content: any) {
    return {
        stack: [
            { text: title, style: 'sectionHeader' },
            content
        ],
        pageBreak: 'after',
        // Clear page break on the very last section (Risks & Mitigation)
        // Note: For simplicity, we are checking the title index here
        // A more robust check might involve knowing the order in the content array.
        // Since Risks is last, we can make the break conditional if needed, but 'after' is safer
        // since the TOC takes up space before this starts.
    };
  }

  // --- Header/Footer Rendering ---

  private renderHeader(currentPage: number) {
    if (currentPage === 1) return null; // No header on cover page
    return {
      columns: [
        { text: `${this.data.projectName} Test Plan`, fontSize: 9, bold: true, color: COLORS.PRIMARY },
        { text: `Version: ${this.data.version || '1.0'} | ${formatDate(this.data.dateCreated)}`, alignment: 'right', fontSize: 9, color: COLORS.MEDIUM_GRAY }
      ],
      margin: [50, 20, 50, 0]
    };
  }

  private renderFooter(currentPage: number, pageCount: number) {
    if (currentPage === 1) return null; // No footer on cover page
    return {
      canvas: [
        { type: 'line', x1: 50, y1: 10, x2: 545, y2: 10, lineWidth: 1, color: COLORS.ACCENT }
      ],
      text: `Page ${currentPage} of ${pageCount}`,
      alignment: 'center',
      fontSize: 9,
      margin: [0, 15, 0, 0]
    };
  }

  // --- Page Content Renderers ---

  private renderCoverPage() {
    return {
      stack: [
        {
          text: 'TEST PLAN DOCUMENT',
          style: 'coverBadge',
          color: COLORS.WHITE,
          background: COLORS.PRIMARY,
          alignment: 'center',
          margin: [0, 100, 0, 0]
        },
        {
          text: this.data.projectName.toUpperCase(),
          style: 'coverTitle',
          color: COLORS.PRIMARY,
          margin: [0, 10, 0, 10]
        },
        {
          text: `Version ${this.data.version || '1.0'}`,
          style: 'coverSubtitle',
          color: COLORS.ACCENT,
          alignment: 'center',
          margin: [0, 10, 0, 50]
        },
        {
          canvas: [{ type: 'line', x1: 200, y1: 0, x2: 350, y2: 0, lineWidth: 0.5, color: COLORS.BORDER }],
          margin: [0, 0, 0, 30]
        },
        {
          table: {
            widths: ['*', '*'],
            body: [
              [{ text: 'Prepared By:', style: 'label' }, { text: this.data.preparedBy || 'N/A', style: 'coverMeta' }],
              [{ text: 'Date Created:', style: 'label' }, { text: formatDate(this.data.dateCreated), style: 'coverMeta' }],
              [{ text: 'Reviewed By:', style: 'label' }, { text: this.data.reviewedBy || 'N/A', style: 'coverMeta' }],
              [{ text: 'Approval Date:', style: 'label' }, { text: formatDate(this.data.approvalDate), style: 'coverMeta' }]
            ]
          },
          layout: 'noBorders',
          alignment: 'center',
          margin: [100, 0, 100, 0]
        }
      ],
      pageBreak: 'after'
    };
  }
  
  private renderTableOfContents() {
    return { 
        text: 'Table of Contents', 
        style: 'header', 
        toc: { 
            title: { text: 'Table of Contents', style: 'header' } 
        }, 
        margin: [0, 0, 0, 20],
        pageBreak: 'after'
    };
  }

  private renderDocumentControl() {
    return {
      table: {
        headerRows: 1,
        widths: ['25%', '75%'],
        body: [
          [{ text: 'Property', style: 'tableHeader' }, { text: 'Detail', style: 'tableHeader' }],
          [{ text: 'Project Name', style: 'label' }, this.data.projectName],
          [{ text: 'Document Version', style: 'label' }, this.data.version || '1.0'],
          [{ text: 'Prepared By', style: 'label' }, this.data.preparedBy],
          [{ text: 'Date Created', style: 'label' }, formatDate(this.data.dateCreated)],
          [{ text: 'Reviewed By', style: 'label' }, this.data.reviewedBy],
          [{ text: 'Approval Date', style: 'label' }, formatDate(this.data.approvalDate)],
          [{ text: 'Document Status', style: 'label' }, 'Approved'],
        ]
      },
      layout: {
        hLineWidth: () => 1,
        vLineWidth: () => 0.5,
        hLineColor: (i: number, node: any) => (i === 0 || i === node.table.body.length) ? COLORS.PRIMARY : COLORS.BORDER,
        vLineColor: () => COLORS.BORDER,
        fillColor: (i: number) => (i % 2 === 0 && i > 0) ? COLORS.LIGHT_GRAY : null,
      },
      tocItem: 'Document Control', // TOC entry
    };
  }

  private renderIntroductionObjectives() {
    return [
      { text: 'Introduction', style: 'subheader' },
      { text: this.data.introduction || 'No introduction provided.', margin: [0, 0, 0, 15] },
      { text: 'Objectives', style: 'subheader' },
      { text: this.data.objectives || 'No objectives defined.', margin: [0, 0, 0, 15] },
    ];
  }

  private renderScopeDefinition() {
    return [
      { text: 'In Scope', style: 'subheader' },
      { text: this.data.inScope || 'No in-scope items defined.', margin: [0, 0, 0, 10] },
      { text: 'Out of Scope', style: 'subheader' },
      { text: this.data.outOfScope || 'No out-of-scope items defined.', margin: [0, 0, 0, 15] },
    ];
  }
  
  private renderTestStrategy() {
      return [
          { text: 'Test Strategy Overview', style: 'subheader' },
          { text: this.data.testStrategy || 'No test strategy overview provided.', margin: [0, 0, 0, 10] },
          { text: 'Features to be Tested (Test Items)', style: 'subheader' },
          { text: this.data.testItems || 'No test items defined.', margin: [0, 0, 0, 15] }
      ];
  }

  private renderEnvironmentCriteria() {
      return [
          { text: 'Test Environment', style: 'subheader' },
          { text: this.data.testEnvironment || 'Test environment details not specified.', margin: [0, 0, 0, 10] },
          { text: 'Entry Criteria', style: 'subheader' },
          { text: this.data.entryCriteria || 'Entry criteria not specified.', margin: [0, 0, 0, 10] },
          { text: 'Exit Criteria', style: 'subheader' },
          { text: this.data.exitCriteria || 'Exit criteria not specified.', margin: [0, 0, 0, 10] },
          { text: 'Test Deliverables', style: 'subheader' },
          { text: this.data.testDeliverables || 'Test deliverables not specified.', margin: [0, 0, 0, 15] }
      ];
  }
  
  private renderRolesResponsibilities() {
      if (!this.data.roles || this.data.roles.length === 0) return { text: 'No roles and responsibilities defined.', margin: [0, 0, 0, 15] };
      
      const body = [
          [{ text: 'Team Member', style: 'tableHeader' }, { text: 'Role', style: 'tableHeader' }, { text: 'Key Responsibilities', style: 'tableHeader' }],
          ...this.data.roles.map(role => [role.name, role.role, role.responsibilities || 'N/A'])
      ];

      return {
          table: {
              headerRows: 1,
              widths: ['30%', '30%', '40%'],
              body: body
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15]
      };
  }
  
  private renderSchedule() {
      if (!this.data.schedule || this.data.schedule.length === 0) return { text: 'No schedule and milestones defined.', margin: [0, 0, 0, 15] };

      const body = [
          [{ text: 'Task', style: 'tableHeader' }, { text: 'Start Date', style: 'tableHeader' }, { text: 'End Date', style: 'tableHeader' }, { text: 'Owner', style: 'tableHeader' }],
          ...this.data.schedule.map(item => [item.task, formatDate(item.startDate), formatDate(item.endDate), item.owner])
      ];

      return {
          table: {
              headerRows: 1,
              widths: ['*', '15%', '15%', '15%'],
              body: body
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15]
      };
  }
  
  private renderRisks() {
      if (!this.data.risks || this.data.risks.length === 0) return { text: 'No risks and mitigation strategies defined.', margin: [0, 0, 0, 15] };
      
      const body = [
          [{ text: 'Risk Description', style: 'tableHeader' }, { text: 'Impact', style: 'tableHeader' }, { text: 'Mitigation Strategy', style: 'tableHeader' }],
          ...this.data.risks.map(risk => [risk.risk, risk.impact, risk.mitigation || 'N/A'])
      ];

      return {
          table: {
              headerRows: 1,
              widths: ['40%', '15%', '45%'],
              body: body
          },
          layout: 'lightHorizontalLines',
          margin: [0, 0, 0, 15]
      };
  }

  // --- Style Definition ---

  private getStyles() {
    return {
      header: { 
          fontSize: 20, 
          bold: true, 
          margin: [0, 15, 0, 10], 
          color: COLORS.PRIMARY,
          tocStyle: { fontSize: 14, bold: true, color: COLORS.PRIMARY, margin: [0, 10, 0, 5] },
          tocItemStyle: { fontSize: 10, margin: [0, 3, 0, 3] }
      },
      sectionHeader: { 
          fontSize: 16, 
          bold: true, 
          color: COLORS.PRIMARY, 
          margin: [0, 20, 0, 10],
          // Add TOC properties to major sections for automatic Table of Contents generation
          tocItem: true
      },
      subheader: { 
          fontSize: 12, 
          bold: true, 
          color: COLORS.ACCENT, 
          margin: [0, 10, 0, 5] 
      },
      label: { 
          fontSize: 10, 
          bold: true, 
          color: COLORS.MEDIUM_GRAY 
      },
      tableHeader: {
        fontSize: 10,
        bold: true,
        fillColor: COLORS.PRIMARY,
        color: COLORS.WHITE,
        alignment: 'center',
        margin: [0, 5, 0, 5]
      },
      // Cover Page Styles
      coverTitle: {
          fontSize: 30,
          bold: true,
          alignment: 'center',
          margin: [0, 15, 0, 15]
      },
      coverSubtitle: {
          fontSize: 18,
          bold: true,
          alignment: 'center',
      },
      coverBadge: {
          fontSize: 12,
          bold: true,
          margin: [0, 0, 0, 10],
          alignment: 'center',
          // Note: The margin/padding applied to background is handled by pdfmake implicitly
      },
      coverMeta: {
          fontSize: 11,
          alignment: 'center',
          margin: [0, 5, 0, 15]
      }
    };
  }

  /**
   * Public method to generate and download the PDF.
   */
  public async generate(): Promise<void> {
    const docDefinition = this.getDocDefinition();
    
    return new Promise((resolve, reject) => {
      try {
        // Generate and download the PDF
        const pdfDocGenerator = (window as any).pdfMake.createPdf(docDefinition);
        pdfDocGenerator.download(`TestPlan_${this.data.projectName.replace(/ /g, '_') || 'Untitled'}.pdf`, () => {
          resolve();
        });
      } catch (error) {
        console.error('Error generating PDF:', error);
        reject(new Error('Failed to generate PDF'));
      }
    });
  }
}

export const generateTestPlanPDF = async (data: TestPlan): Promise<void> => {
    const generator = new TestPlanPdfGenerator(data);
    return generator.generate();
};