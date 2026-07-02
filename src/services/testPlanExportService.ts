import { TestPlan } from '@/pages/TestPlans';

// Service for exporting test plans to different formats
export const testPlanExportService = {
  // Generate PDF using browser's print functionality
  async exportToPDF(testPlan: TestPlan): Promise<void> {
    const content = this.generateHTMLContent(testPlan);
    
    // Create a new window with the content
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      throw new Error('Unable to open print window. Please check your popup blocker.');
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${testPlan.name || testPlan.projectName} - Test Plan</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              text-align: center;
              border-bottom: 2px solid #333;
              padding-bottom: 20px;
              margin-bottom: 30px;
            }
            .section {
              margin-bottom: 25px;
              page-break-inside: avoid;
            }
            .section-title {
              font-size: 18px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
              border-bottom: 1px solid #e5e7eb;
              padding-bottom: 5px;
            }
            .info-grid {
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              margin-bottom: 10px;
            }
            .info-label {
              font-weight: bold;
              color: #6b7280;
              font-size: 12px;
              text-transform: uppercase;
            }
            .info-value {
              margin-top: 2px;
            }
            .role-item {
              border-left: 4px solid #3b82f6;
              padding-left: 15px;
              margin-bottom: 15px;
            }
            .schedule-item {
              background-color: #f9fafb;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 10px;
            }
            .risk-item {
              border: 1px solid #fecaca;
              background-color: #fef2f2;
              padding: 15px;
              border-radius: 5px;
              margin-bottom: 15px;
            }
            .member-badge {
              display: inline-block;
              background-color: #e5e7eb;
              padding: 4px 8px;
              border-radius: 4px;
              margin: 2px;
              font-size: 12px;
            }
            @media print {
              body { margin: 0; }
              .no-print { display: none; }
            }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  },

  // Generate Word document (simplified HTML format)
  async exportToWord(testPlan: TestPlan): Promise<void> {
    const content = this.generateHTMLContent(testPlan);
    const htmlContent = `
      <!DOCTYPE html>
      <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
        <head>
          <meta charset='utf-8'>
          <title>${testPlan.name || testPlan.projectName} - Test Plan</title>
          <!--[if gte mso 9]>
          <xml>
            <w:WordDocument>
              <w:View>Print</w:View>
              <w:Zoom>90</w:Zoom>
              <w:DoNotPromptForConvert/>
              <w:DoNotShowInsertionsAndDeletions/>
            </w:WordDocument>
          </xml>
          <![endif]-->
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; }
            .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 30px; }
            .section { margin-bottom: 25px; }
            .section-title { font-size: 18px; font-weight: bold; color: #2563eb; margin-bottom: 10px; }
            .info-grid { margin-bottom: 20px; }
            .info-item { margin-bottom: 10px; }
            .info-label { font-weight: bold; color: #6b7280; }
          </style>
        </head>
        <body>
          ${content}
        </body>
      </html>
    `;

    const blob = new Blob([htmlContent], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${testPlan.name || testPlan.projectName}_TestPlan.doc`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Generate HTML content for the test plan
  generateHTMLContent(testPlan: TestPlan): string {
    const formatDate = (dateString: string) => {
      if (!dateString || dateString === '[Pending Approval]') return 'Pending';
      return new Date(dateString).toLocaleDateString();
    };

    return `
      <div class="header">
        <h1>${testPlan.name || testPlan.projectName}</h1>
        <h2>Test Plan Document</h2>
        <p>Version: ${testPlan.version || '1.0'} | Status: ${testPlan.status || 'Draft'}</p>
      </div>

      <div class="section">
        <div class="section-title">Document Information</div>
        <div class="info-grid">
          <div class="info-item">
            <div class="info-label">Prepared By</div>
            <div class="info-value">${testPlan.preparedBy || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Date Created</div>
            <div class="info-value">${formatDate(testPlan.dateCreated)}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Reviewed By</div>
            <div class="info-value">${testPlan.reviewedBy || (testPlan as any).approvedBy || 'N/A'}</div>
          </div>
          <div class="info-item">
            <div class="info-label">Approval Date</div>
            <div class="info-value">${formatDate(testPlan.approvalDate)}</div>
          </div>
          ${testPlan.createdAt ? `
          <div class="info-item">
            <div class="info-label">Created At</div>
            <div class="info-value">${formatDate(testPlan.createdAt)}</div>
          </div>
          ` : ''}
          ${testPlan.updatedAt ? `
          <div class="info-item">
            <div class="info-label">Last Updated</div>
            <div class="info-value">${formatDate(testPlan.updatedAt)}</div>
          </div>
          ` : ''}
          ${(testPlan as any).effectiveDate ? `
          <div class="info-item">
            <div class="info-label">Effective Date</div>
            <div class="info-value">${formatDate((testPlan as any).effectiveDate)}</div>
          </div>
          ` : ''}
        </div>
      </div>

      ${testPlan.introduction ? `
        <div class="section">
          <div class="section-title">1. Introduction</div>
          <p>${testPlan.introduction.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.objectives ? `
        <div class="section">
          <div class="section-title">2. Objectives</div>
          <p>${testPlan.objectives.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.inScope || testPlan.outOfScope ? `
        <div class="section">
          <div class="section-title">3. Scope</div>
          ${testPlan.inScope ? `
            <h4>In Scope:</h4>
            <p>${testPlan.inScope.replace(/\n/g, '<br>')}</p>
          ` : ''}
          ${testPlan.outOfScope ? `
            <h4>Out of Scope:</h4>
            <p>${testPlan.outOfScope.replace(/\n/g, '<br>')}</p>
          ` : ''}
        </div>
      ` : ''}

      ${testPlan.testStrategy ? `
        <div class="section">
          <div class="section-title">4. Test Strategy</div>
          <p>${testPlan.testStrategy.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.testApproach ? `
        <div class="section">
          <div class="section-title">Test Approach</div>
          <p>${(testPlan as any).testApproach.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.testEnvironment || (testPlan as any).environmentalNeeds ? `
        <div class="section">
          <div class="section-title">5. Test Environment</div>
          <p>${(testPlan.testEnvironment || (testPlan as any).environmentalNeeds || '').replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${(testPlan as any).responsibilities ? `
        <div class="section">
          <div class="section-title">Responsibilities</div>
          <p>${(testPlan as any).responsibilities.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${(testPlan as any).trainingNeeds ? `
        <div class="section">
          <div class="section-title">Training Needs</div>
          <p>${(testPlan as any).trainingNeeds.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${(testPlan as any).assumptions ? `
        <div class="section">
          <div class="section-title">Assumptions</div>
          <p>${(testPlan as any).assumptions.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${(testPlan as any).approvals ? `
        <div class="section">
          <div class="section-title">Approvals</div>
          <p>${(testPlan as any).approvals.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.entryCriteria || testPlan.exitCriteria ? `
        <div class="section">
          <div class="section-title">6. Entry and Exit Criteria</div>
          ${testPlan.entryCriteria ? `
            <h4>Entry Criteria:</h4>
            <p>${testPlan.entryCriteria.replace(/\n/g, '<br>')}</p>
          ` : ''}
          ${testPlan.exitCriteria ? `
            <h4>Exit Criteria:</h4>
            <p>${testPlan.exitCriteria.replace(/\n/g, '<br>')}</p>
          ` : ''}
        </div>
      ` : ''}

      ${testPlan.testDeliverables ? `
        <div class="section">
          <div class="section-title">7. Test Deliverables</div>
          <p>${testPlan.testDeliverables.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.testItems ? `
        <div class="section">
          <div class="section-title">Test Items</div>
          <p>${testPlan.testItems.replace(/\n/g, '<br>')}</p>
        </div>
      ` : ''}

      ${testPlan.roles && testPlan.roles.length > 0 ? `
        <div class="section">
          <div class="section-title">8. Roles and Responsibilities</div>
          ${testPlan.roles.map(role => `
            <div class="role-item">
              <strong>${role.name}</strong> - <em>${role.role}</em><br>
              ${role.responsibilities}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${testPlan.schedule && testPlan.schedule.length > 0 ? `
        <div class="section">
          <div class="section-title">9. Schedule</div>
          ${testPlan.schedule.map(item => `
            <div class="schedule-item">
              <strong>${item.task}</strong><br>
              <strong>Owner:</strong> ${item.owner}<br>
              <strong>Duration:</strong> ${formatDate(item.startDate)} - ${formatDate(item.endDate)}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${testPlan.risks && testPlan.risks.length > 0 ? `
        <div class="section">
          <div class="section-title">10. Risks and Mitigation</div>
          ${testPlan.risks.map(risk => `
            <div class="risk-item">
              <strong>Risk:</strong> ${risk.risk}<br>
              <strong>Impact:</strong> ${risk.impact}<br>
              <strong>Mitigation:</strong> ${risk.mitigation}
            </div>
          `).join('')}
        </div>
      ` : ''}

      ${testPlan.members && testPlan.members.length > 0 ? `
        <div class="section">
          <div class="section-title">11. Team Members</div>
          <p>
            ${testPlan.members.map(member => `<span class="member-badge">${member}</span>`).join(' ')}
          </p>
        </div>
      ` : ''}
    `;
  }
};