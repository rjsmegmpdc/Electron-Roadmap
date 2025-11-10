/**
 * GovernanceReportingService - generates reports and exports
 */

import { DB } from '../../db';
import { GovernanceReport, ReportExportFormat } from '../../types/governance';

export class GovernanceReportingService {
  constructor(private db: DB) {}

  /**
   * Generate executive summary report
   */
  async generateExecutiveSummary(dateRange?: { start: string; end: string }): Promise<GovernanceReport> {
    const portfolioHealth = this.db.prepare(`
      SELECT governance_status, COUNT(*) as count
      FROM projects
      WHERE status NOT IN ('archived')
      ${dateRange ? `AND created_at BETWEEN ? AND ?` : ''}
      GROUP BY governance_status
    `).all(...(dateRange ? [dateRange.start, dateRange.end] : [])) as any[];

    const gateDistribution = this.db.prepare(`
      SELECT g.gate_name, COUNT(DISTINCT p.id) as count
      FROM projects p
      JOIN governance_gates g ON g.gate_id = p.current_gate_id
      WHERE p.status NOT IN ('archived')
      GROUP BY g.gate_id
      ORDER BY g.sequence_order
    `).all() as any[];

    const complianceStatus = this.db.prepare(`
      SELECT compliance_status, COUNT(*) as count
      FROM policy_compliance pc
      JOIN projects p ON p.id = pc.project_id
      WHERE p.status NOT IN ('archived')
      GROUP BY compliance_status
    `).all() as any[];

    const escalations = this.db.prepare(`
      SELECT escalation_level, COUNT(*) as count
      FROM escalations
      WHERE resolution_status != 'resolved'
      GROUP BY escalation_level
    `).all() as any[];

    const benefits = this.db.prepare(`
      SELECT 
        SUM(expected_value) as totalExpected,
        SUM(actual_value) as totalRealized
      FROM project_benefits pb
      JOIN projects p ON p.id = pb.project_id
      WHERE p.status NOT IN ('archived')
    `).get() as { totalExpected: number; totalRealized: number };

    return {
      reportType: 'executive-summary',
      generatedAt: new Date().toISOString(),
      dateRange,
      data: {
        portfolioHealth,
        gateDistribution,
        complianceStatus,
        escalations,
        benefits
      }
    };
  }

  /**
   * Generate project-specific governance report
   */
  async generateProjectReport(projectId: string): Promise<GovernanceReport> {
    const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!project) throw new Error(`Project ${projectId} not found`);

    const gates = this.db.prepare(`
      SELECT pg.*, g.gate_name
      FROM project_gates pg
      JOIN governance_gates g ON g.gate_id = pg.gate_id
      WHERE pg.project_id = ?
      ORDER BY g.sequence_order
    `).all(projectId) as any[];

    const compliance = this.db.prepare(`
      SELECT pc.*, gp.policy_name
      FROM policy_compliance pc
      JOIN governance_policies gp ON gp.policy_id = pc.policy_id
      WHERE pc.project_id = ?
    `).all(projectId) as any[];

    const decisions = this.db.prepare(`
      SELECT * FROM governance_decisions WHERE project_id = ? ORDER BY decision_date DESC
    `).all(projectId) as any[];

    const actions = this.db.prepare(`
      SELECT * FROM governance_actions WHERE project_id = ? ORDER BY due_date ASC
    `).all(projectId) as any[];

    const benefits = this.db.prepare(`
      SELECT * FROM project_benefits WHERE project_id = ?
    `).all(projectId) as any[];

    const escalations = this.db.prepare(`
      SELECT * FROM escalations WHERE project_id = ? ORDER BY raised_date DESC
    `).all(projectId) as any[];

    return {
      reportType: 'project-governance',
      generatedAt: new Date().toISOString(),
      projectId,
      projectName: project.name,
      data: {
        project,
        gates,
        compliance,
        decisions,
        actions,
        benefits,
        escalations
      }
    };
  }

  /**
   * Generate compliance audit report
   */
  async generateComplianceAuditReport(policyId?: string): Promise<GovernanceReport> {
    let query = `
      SELECT 
        pc.*,
        gp.policy_name,
        p.name as project_name,
        p.governance_status
      FROM policy_compliance pc
      JOIN governance_policies gp ON gp.policy_id = pc.policy_id
      JOIN projects p ON p.id = pc.project_id
      WHERE p.status NOT IN ('archived')
    `;

    const params: any[] = [];
    if (policyId) {
      query += ' AND pc.policy_id = ?';
      params.push(policyId);
    }

    query += ' ORDER BY pc.compliance_status, pc.due_date';

    const compliance = this.db.prepare(query).all(...params) as any[];

    const waivers = this.db.prepare(`
      SELECT pw.*, pc.project_id, gp.policy_name
      FROM policy_waivers pw
      JOIN policy_compliance pc ON pc.compliance_id = pw.compliance_id
      JOIN governance_policies gp ON gp.policy_id = pc.policy_id
      ${policyId ? 'WHERE pc.policy_id = ?' : ''}
      ORDER BY pw.requested_date DESC
    `).all(...(policyId ? [policyId] : [])) as any[];

    const summary = {
      total: compliance.length,
      compliant: compliance.filter(c => c.compliance_status === 'compliant').length,
      nonCompliant: compliance.filter(c => c.compliance_status === 'non-compliant').length,
      overdue: compliance.filter(c => c.compliance_status === 'overdue').length,
      waived: compliance.filter(c => c.compliance_status === 'waived').length
    };

    return {
      reportType: 'compliance-audit',
      generatedAt: new Date().toISOString(),
      data: {
        summary,
        compliance,
        waivers
      }
    };
  }

  /**
   * Export report to specified format
   */
  async exportReport(report: GovernanceReport, format: ReportExportFormat): Promise<{ data: string; mimeType: string }> {
    switch (format) {
      case 'json':
        return {
          data: JSON.stringify(report, null, 2),
          mimeType: 'application/json'
        };
      
      case 'csv':
        return {
          data: this.convertToCSV(report),
          mimeType: 'text/csv'
        };
      
      case 'html':
        return {
          data: this.convertToHTML(report),
          mimeType: 'text/html'
        };
      
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  // ===== PRIVATE HELPERS =====

  private convertToCSV(report: GovernanceReport): string {
    // Simplified CSV export - would be more sophisticated in production
    const lines: string[] = [];
    lines.push(`Report Type,${report.reportType}`);
    lines.push(`Generated At,${report.generatedAt}`);
    lines.push('');
    
    // Add data rows based on report type
    if (report.reportType === 'executive-summary') {
      lines.push('Portfolio Health');
      lines.push('Status,Count');
      for (const item of report.data.portfolioHealth || []) {
        lines.push(`${item.governance_status},${item.count}`);
      }
    }

    return lines.join('\n');
  }

  private convertToHTML(report: GovernanceReport): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Governance Report - ${report.reportType}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    h1 { color: #333; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    .metadata { color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>Governance Report: ${report.reportType}</h1>
  <div class="metadata">
    <p>Generated: ${new Date(report.generatedAt).toLocaleString()}</p>
    ${report.projectName ? `<p>Project: ${report.projectName}</p>` : ''}
  </div>
  <div id="content">
    <pre>${JSON.stringify(report.data, null, 2)}</pre>
  </div>
</body>
</html>
    `.trim();
  }
}
