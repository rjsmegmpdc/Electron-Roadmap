/**
 * Governance IPC Handlers
 * Exposes governance services to the renderer process
 */

import { ipcMain } from 'electron';
import type { DB } from '../db';
import {
  GovernanceService,
  StageGateService,
  ComplianceService,
  DecisionLogService,
  BenefitsService,
  StrategicAlignmentService,
  EscalationService,
  PortfolioAnalyticsService,
  GovernanceReportingService
} from '../services/governance';

export class GovernanceIpcHandlers {
  private governanceService: GovernanceService;
  private stageGateService: StageGateService;
  private complianceService: ComplianceService;
  private decisionLogService: DecisionLogService;
  private benefitsService: BenefitsService;
  private strategicAlignmentService: StrategicAlignmentService;
  private escalationService: EscalationService;
  private portfolioAnalyticsService: PortfolioAnalyticsService;
  private reportingService: GovernanceReportingService;

  constructor(db: DB) {
    this.governanceService = new GovernanceService(db);
    this.stageGateService = new StageGateService(db);
    this.complianceService = new ComplianceService(db);
    this.decisionLogService = new DecisionLogService(db);
    this.benefitsService = new BenefitsService(db);
    this.strategicAlignmentService = new StrategicAlignmentService(db);
    this.escalationService = new EscalationService(db);
    this.portfolioAnalyticsService = new PortfolioAnalyticsService(db);
    this.reportingService = new GovernanceReportingService(db);

    this.registerHandlers();
  }

  private registerHandlers() {
    // ===== GOVERNANCE SERVICE =====
    ipcMain.handle('governance:getPortfolioHealth', async () => {
      try {
        const result = await this.governanceService.calculatePortfolioHealthScore();
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getDashboard', async () => {
      try {
        const result = await this.governanceService.getPortfolioDashboardData();
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:refreshMetrics', async () => {
      try {
        await this.governanceService.refreshPortfolioMetrics();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== STAGE GATE SERVICE =====
    ipcMain.handle('governance:tryAutoProgress', async (_event, projectId: string) => {
      try {
        const result = await this.stageGateService.tryAutoProgress(projectId);
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:checkGateReadiness', async (_event, projectId: string, gateId: string) => {
      try {
        const result = this.stageGateService.isReadyForNextGate(projectId, gateId);
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== COMPLIANCE SERVICE =====
    ipcMain.handle('governance:initializeCompliance', async (_event, projectId: string) => {
      try {
        await this.complianceService.initializeProjectCompliance(projectId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:updateComplianceStatus', async (_event, complianceId: string, status: string, evidence?: string, assessedBy?: string) => {
      try {
        await this.complianceService.updateComplianceStatus(complianceId, status as any, evidence, assessedBy);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:createWaiver', async (_event, waiver: any) => {
      try {
        const waiverId = await this.complianceService.createWaiver(waiver);
        return { success: true, data: waiverId };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:processOverdueCompliance', async () => {
      try {
        await this.complianceService.processOverdueCompliance();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== DECISION LOG SERVICE =====
    ipcMain.handle('governance:recordDecision', async (_event, decision: any, actions?: any[]) => {
      try {
        const decisionId = await this.decisionLogService.recordDecision(decision, actions);
        return { success: true, data: decisionId };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:createAction', async (_event, action: any) => {
      try {
        const actionId = this.decisionLogService.createAction(action);
        return { success: true, data: actionId };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:updateActionStatus', async (_event, actionId: string, status: string, completedBy?: string) => {
      try {
        await this.decisionLogService.updateActionStatus(actionId, status as any, completedBy);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:addActionDependency', async (_event, actionId: string, dependsOnActionId: string) => {
      try {
        await this.decisionLogService.addActionDependency(actionId, dependsOnActionId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getProjectActions', async (_event, projectId: string) => {
      try {
        const actions = await this.decisionLogService.getProjectActions(projectId);
        return { success: true, data: actions };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getOverdueActions', async () => {
      try {
        const actions = await this.decisionLogService.getOverdueActions();
        return { success: true, data: actions };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== BENEFITS SERVICE =====
    ipcMain.handle('governance:calculateROI', async (_event, projectId: string) => {
      try {
        const roi = await this.benefitsService.calculateProjectROI(projectId);
        return { success: true, data: roi };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:calculateBenefitsVariance', async (_event, projectId: string) => {
      try {
        const variance = await this.benefitsService.calculateBenefitsVariance(projectId);
        return { success: true, data: variance };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:updateBenefitRealization', async (_event, benefitId: string, status: string, actualValue?: number, actualDate?: string) => {
      try {
        await this.benefitsService.updateBenefitRealization(benefitId, status as any, actualValue, actualDate);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:createBenefit', async (_event, benefit: any) => {
      try {
        const benefitId = await this.benefitsService.createBenefit(benefit);
        return { success: true, data: benefitId };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getPortfolioBenefitsSummary', async () => {
      try {
        const summary = await this.benefitsService.getPortfolioBenefitsSummary();
        return { success: true, data: summary };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== STRATEGIC ALIGNMENT SERVICE =====
    ipcMain.handle('governance:calculateAlignmentScore', async (_event, projectId: string) => {
      try {
        const score = await this.strategicAlignmentService.calculateAlignmentScore(projectId);
        return { success: true, data: score };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:linkProjectToInitiative', async (_event, projectId: string, initiativeId: string) => {
      try {
        await this.strategicAlignmentService.linkProjectToInitiative(projectId, initiativeId);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getProjectsByInitiative', async (_event, initiativeId: string) => {
      try {
        const projects = await this.strategicAlignmentService.getProjectsByInitiative(initiativeId);
        return { success: true, data: projects };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getPortfolioAlignmentSummary', async () => {
      try {
        const summary = await this.strategicAlignmentService.getPortfolioAlignmentSummary();
        return { success: true, data: summary };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== ESCALATION SERVICE =====
    ipcMain.handle('governance:createEscalation', async (_event, escalation: any) => {
      try {
        const escalationId = await this.escalationService.createEscalation(escalation);
        return { success: true, data: escalationId };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:resolveEscalation', async (_event, escalationId: string, resolution: string, resolvedBy: string) => {
      try {
        await this.escalationService.resolveEscalation(escalationId, resolution, resolvedBy);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:processAutoEscalations', async () => {
      try {
        await this.escalationService.processAutoEscalations();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getEscalationSummary', async () => {
      try {
        const summary = await this.escalationService.getPortfolioEscalationSummary();
        return { success: true, data: summary };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== PORTFOLIO ANALYTICS SERVICE =====
    ipcMain.handle('governance:generateHeatmap', async (_event, filters?: any) => {
      try {
        const heatmap = await this.portfolioAnalyticsService.generatePortfolioHeatmap(filters);
        return { success: true, data: heatmap };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getHealthTrend', async (_event, days: number = 90) => {
      try {
        const trend = await this.portfolioAnalyticsService.getPortfolioHealthTrend(days);
        return { success: true, data: trend };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getGateProgressionAnalytics', async () => {
      try {
        const analytics = await this.portfolioAnalyticsService.getGateProgressionAnalytics();
        return { success: true, data: analytics };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:getComplianceAnalytics', async () => {
      try {
        const analytics = await this.portfolioAnalyticsService.getComplianceAnalytics();
        return { success: true, data: analytics };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // ===== REPORTING SERVICE =====
    ipcMain.handle('governance:generateExecutiveSummary', async (_event, dateRange?: { start: string; end: string }) => {
      try {
        const report = await this.reportingService.generateExecutiveSummary(dateRange);
        return { success: true, data: report };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:generateProjectReport', async (_event, projectId: string) => {
      try {
        const report = await this.reportingService.generateProjectReport(projectId);
        return { success: true, data: report };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:generateComplianceAuditReport', async (_event, policyId?: string) => {
      try {
        const report = await this.reportingService.generateComplianceAuditReport(policyId);
        return { success: true, data: report };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle('governance:exportReport', async (_event, report: any, format: string) => {
      try {
        const exported = await this.reportingService.exportReport(report, format as any);
        return { success: true, data: exported };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  cleanup() {
    // Remove all registered handlers
    ipcMain.removeHandler('governance:getPortfolioHealth');
    ipcMain.removeHandler('governance:getDashboard');
    ipcMain.removeHandler('governance:refreshMetrics');
    ipcMain.removeHandler('governance:tryAutoProgress');
    ipcMain.removeHandler('governance:checkGateReadiness');
    ipcMain.removeHandler('governance:initializeCompliance');
    ipcMain.removeHandler('governance:updateComplianceStatus');
    ipcMain.removeHandler('governance:createWaiver');
    ipcMain.removeHandler('governance:processOverdueCompliance');
    ipcMain.removeHandler('governance:recordDecision');
    ipcMain.removeHandler('governance:createAction');
    ipcMain.removeHandler('governance:updateActionStatus');
    ipcMain.removeHandler('governance:addActionDependency');
    ipcMain.removeHandler('governance:getProjectActions');
    ipcMain.removeHandler('governance:getOverdueActions');
    ipcMain.removeHandler('governance:calculateROI');
    ipcMain.removeHandler('governance:calculateBenefitsVariance');
    ipcMain.removeHandler('governance:updateBenefitRealization');
    ipcMain.removeHandler('governance:createBenefit');
    ipcMain.removeHandler('governance:getPortfolioBenefitsSummary');
    ipcMain.removeHandler('governance:calculateAlignmentScore');
    ipcMain.removeHandler('governance:linkProjectToInitiative');
    ipcMain.removeHandler('governance:getProjectsByInitiative');
    ipcMain.removeHandler('governance:getPortfolioAlignmentSummary');
    ipcMain.removeHandler('governance:createEscalation');
    ipcMain.removeHandler('governance:resolveEscalation');
    ipcMain.removeHandler('governance:processAutoEscalations');
    ipcMain.removeHandler('governance:getEscalationSummary');
    ipcMain.removeHandler('governance:generateHeatmap');
    ipcMain.removeHandler('governance:getHealthTrend');
    ipcMain.removeHandler('governance:getGateProgressionAnalytics');
    ipcMain.removeHandler('governance:getComplianceAnalytics');
    ipcMain.removeHandler('governance:generateExecutiveSummary');
    ipcMain.removeHandler('governance:generateProjectReport');
    ipcMain.removeHandler('governance:generateComplianceAuditReport');
    ipcMain.removeHandler('governance:exportReport');
  }
}
