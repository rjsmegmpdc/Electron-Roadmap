/**
 * Integration tests for Strategic Layer
 * 
 * Tests the complete end-to-end flow from Vision → Goals → Initiatives → Epics → GitHub sync
 * as specified in PRD2.md
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import StrategicLayerManager from '../../../src/js/strategic/strategic-layer-manager.js';
import StrategicDashboard from '../../../src/js/strategic/strategic-dashboard.js';
import { MockWorkIntegration } from '../../../src/js/integrations/work/work-integration.js';
import ProjectManager from '../../../src/js/project-manager.js';

describe('Strategic Layer Integration Tests', () => {
  let strategicManager;
  let dashboard;
  let workIntegration;
  let projectManager;
  let mockPersistence;
  let mockDataPM;

  beforeEach(async () => {
    // Mock persistence
    mockPersistence = {
      data: {},
      async load() { return this.data; },
      async save(data) { this.data = { ...data }; }
    };

    // Mock data persistence manager
    mockDataPM = {
      data: { projects: [], tasks: [] },
      loadProjects() { return this.data.projects; },
      saveProjects(projects) { this.data.projects = projects; },
      loadTasks() { return this.data.tasks; },
      saveTasks(tasks) { this.data.tasks = tasks; }
    };

    // Initialize managers
    strategicManager = new StrategicLayerManager({ 
      persistence: mockPersistence 
    });
    dashboard = new StrategicDashboard(strategicManager);
    workIntegration = new MockWorkIntegration({
      templatesPath: './tests/fixtures/work/zip-mirror'
    });
    await workIntegration.initialize();
    
    projectManager = new ProjectManager(mockDataPM);
  });

  afterEach(() => {
    // Cleanup
    strategicManager = null;
    dashboard = null;
    workIntegration = null;
    projectManager = null;
  });

  describe('End-to-End Strategic Flow', () => {
    it('should complete full Vision → Goals → Initiatives → Epics → GitHub sync flow', async () => {
      // ===== STEP 1: Create Vision (Top Level) =====
      const visionData = {
        title: 'Reimagine IT Support as Conversations, not Tickets',
        description: 'Transform how we deliver IT support by moving from traditional ticket-based system to conversation-driven approach',
        timeframe: 'FY25-FY27',
        owner: 'CTO',
        status: 'active',
        start_date: '01/07/2024',
        target_date: '30/06/2027',
        strategic_priority: 'high',
        business_value: 'Improve user experience and reduce support costs by 40%'
      };

      const vision = await strategicManager.createVision(visionData, 'test.user@company.com');
      
      expect(vision).toBeDefined();
      expect(vision.id).toMatch(/^vision/);
      expect(vision.title).toBe(visionData.title);
      expect(vision.status).toBe('active');

      // Add success criteria to vision
      vision.addSuccessCriteria('Reduce helpdesk tickets by 60% by FY27');
      vision.addSuccessCriteria('Achieve 90% user satisfaction with new conversation approach');
      vision.addSuccessCriteria('Deploy solution across all business units');

      // Add KPIs to vision
      vision.addKPI({
        name: 'Helpdesk Ticket Reduction',
        target: 60,
        current: 0,
        unit: '%',
        measurement_frequency: 'monthly',
        owner: 'Support Manager'
      });

      // ===== STEP 2: Create Goal under Vision =====
      const goalData = {
        vision_id: vision.id,
        title: 'Reduce inbound Helpdesk tickets by 60% by FY27',
        description: 'Implement conversation-driven support to significantly reduce traditional helpdesk ticket volume',
        objective: 'Transform support delivery model to be more proactive and user-friendly',
        owner: 'Support Manager',
        status: 'active',
        start_date: '01/08/2024',
        target_date: '30/06/2027',
        category: 'operational',
        priority: 'high'
      };

      const goal = await strategicManager.createGoal(goalData, 'test.user@company.com');
      
      expect(goal).toBeDefined();
      expect(goal.id).toMatch(/^goal/);
      expect(goal.vision_id).toBe(vision.id);
      expect(goal.title).toBe(goalData.title);

      // Add success metrics and milestones to goal
      goal.addSuccessMetric({
        name: 'Monthly Ticket Reduction',
        target: 60,
        current: 5,
        unit: '%'
      });

      goal.addMilestone({
        name: 'Pilot Program Launch',
        description: 'Launch conversation system with 3 pilot teams',
        target_date: '15/12/2024',
        owner: 'Implementation Lead'
      });

      // ===== STEP 3: Create Initiative under Goal =====
      const initiativeData = {
        goal_id: goal.id,
        title: 'Tickets → Conversations Transformation',
        description: 'Implement new conversation-driven support platform with AI assistance and knowledge base integration',
        business_case: 'Replace legacy ticketing system with modern conversation platform to improve user experience and reduce costs',
        owner: 'Digital Transformation Lead',
        status: 'active',
        start_date: '01/09/2024',
        target_date: '30/04/2025',
        category: 'transformation',
        priority: 'high',
        budget: 500000,
        currency: 'NZD',
        team_size: 8,
        // Enable GitHub sync
        github_sync: true,
        github_label: 'tickets-to-conversations',
        // Enable ADO sync 
        ado_sync: true,
        ado_area_path: 'Digital Transformation\\IT Support'
      };

      const initiative = await strategicManager.createInitiative(initiativeData, 'test.user@company.com');
      
      expect(initiative).toBeDefined();
      expect(initiative.id).toMatch(/^init/);
      expect(initiative.goal_id).toBe(goal.id);
      expect(initiative.github_sync).toBe(true);
      expect(initiative.ado_sync).toBe(true);

      // Add success criteria and milestones
      initiative.addSuccessCriteria('Deploy conversation platform to all support teams');
      initiative.addSuccessCriteria('Integrate with existing knowledge base');
      initiative.addSuccessCriteria('Train 50+ support staff on new platform');

      initiative.addMilestone({
        name: 'Platform Selection Complete',
        target_date: '30/09/2024',
        status: 'completed',
        owner: 'Architecture Team'
      });

      initiative.addMilestone({
        name: 'Development Complete',
        target_date: '28/02/2025',
        status: 'in-progress',
        owner: 'Dev Team'
      });

      // ===== STEP 4: Create Epic (Project) linked to Initiative =====
      const projectData = {
        title: 'Build Teams App for Conversations',
        description: 'Develop Microsoft Teams app that enables conversation-driven IT support',
        start_date: '15/09/2024',
        end_date: '15/01/2025',
        budget_cents: 15000000, // $150k NZD
        financial_treatment: 'CAPEX',
        status: 'engineering',
        priority: 'P1',
        initiative_id: initiative.id, // Link to initiative
        tasks: [],
        resources: [],
        forecasts: []
      };

      const project = projectManager.createProject(projectData);
      
      expect(project).toBeDefined();
      expect(project.initiative_id).toBe(initiative.id);
      expect(project.title).toBe(projectData.title);

      // ===== STEP 5: Test GitHub Sync Integration =====
      
      // Test that initiative sync config is available
      const githubSyncConfig = initiative.getGitHubSyncConfig();
      expect(githubSyncConfig).toBeDefined();
      expect(githubSyncConfig.enabled).toBe(true);
      expect(githubSyncConfig.label).toBe('initiative:tickets-to-conversations');
      expect(githubSyncConfig.metadata.rt_initiative_id).toBe(initiative.id);

      // Test Work Integration mapping
      const issuePayload = workIntegration.mappingConfig.mapProjectToIssue(project, {
        initiativeId: initiative.id,
        initiativeLabel: initiative.github_label
      });

      expect(issuePayload.labels).toContain(`initiative:${initiative.id}`);
      expect(issuePayload.labels).toContain('initiative:tickets-to-conversations');
      expect(issuePayload.labels).toContain('type:epic');
      expect(issuePayload.labels).toContain('financial:capex');

      // Simulate push to GitHub
      const pushResult = await workIntegration.pushToADO(project, {
        userId: 'test.user@company.com',
        renderTemplates: true,
        initiativeId: initiative.id
      });

      expect(pushResult.success).toBe(true);
      expect(pushResult.entityType).toBe('project');
      expect(pushResult.adoWorkItemType).toBe('Epic');

      // ===== STEP 6: Test Strategic Hierarchy Retrieval =====
      
      const hierarchy = strategicManager.getHierarchy(vision.id);
      
      expect(hierarchy).toBeDefined();
      expect(hierarchy.title).toBe(vision.title);
      expect(hierarchy.goals).toHaveLength(1);
      expect(hierarchy.goals[0].id).toBe(goal.id);
      expect(hierarchy.goals[0].initiatives).toHaveLength(1);
      expect(hierarchy.goals[0].initiatives[0].id).toBe(initiative.id);

      // ===== STEP 7: Test Dashboard Reporting =====
      
      const executiveSummary = dashboard.getExecutiveSummary();
      
      expect(executiveSummary.overview.totalVisions).toBe(1);
      expect(executiveSummary.overview.totalGoals).toBe(1);
      expect(executiveSummary.overview.totalInitiatives).toBe(1);
      expect(executiveSummary.overview.overallHealth).toBeDefined();

      const visionHealthReport = dashboard.getVisionHealthReport(vision.id);
      expect(visionHealthReport.reports).toHaveLength(1);
      expect(visionHealthReport.reports[0].vision.id).toBe(vision.id);
      expect(visionHealthReport.reports[0].goals.total).toBe(1);

      const initiativeProgressReport = dashboard.getInitiativeProgressReport({
        goal_id: goal.id
      });
      expect(initiativeProgressReport.reports).toHaveLength(1);
      expect(initiativeProgressReport.reports[0].initiative.id).toBe(initiative.id);
      expect(initiativeProgressReport.reports[0].sync.githubEnabled).toBe(true);

      // ===== STEP 8: Test Strategic Alignment =====
      
      const alignmentReport = dashboard.getStrategicAlignmentReport();
      expect(alignmentReport.visionCount).toBe(1);
      expect(alignmentReport.alignmentData[0].vision.id).toBe(vision.id);
      expect(alignmentReport.alignmentData[0].totalInitiatives).toBe(1);
      expect(alignmentReport.overallAlignment).toBeGreaterThan(0);

      // ===== STEP 9: Test Traceability =====
      
      // Projects linked to initiative
      const linkedProjects = projectManager.getProjectsByInitiative(initiative.id);
      expect(linkedProjects).toHaveLength(1);
      expect(linkedProjects[0].id).toBe(project.id);

      // Initiative sync status
      expect(initiative.github_sync).toBe(true);
      expect(initiative.ado_sync).toBe(true);

      // Work integration can extract initiative ID
      const extractedIds = workIntegration.mappingConfig.extractInitiativeId([
        'type:epic',
        `initiative:${initiative.id}`,
        'priority:P1'
      ]);
      expect(extractedIds).toBe(initiative.id);
    });

    it('should handle multiple visions with cross-cutting initiatives', async () => {
      // Create Vision 1: IT Support Transformation
      const vision1 = await strategicManager.createVision({
        title: 'Reimagine IT Support as Conversations',
        description: 'Transform IT support delivery',
        owner: 'CTO',
        status: 'active',
        strategic_priority: 'high'
      }, 'test.user@company.com');

      // Create Vision 2: Digital Employee Experience
      const vision2 = await strategicManager.createVision({
        title: 'Enhance Digital Employee Experience',
        description: 'Modernize employee digital tools and processes',
        owner: 'CHRO',
        status: 'active',
        strategic_priority: 'medium'
      }, 'test.user@company.com');

      // Create Goals for each vision
      const goal1 = await strategicManager.createGoal({
        vision_id: vision1.id,
        title: 'Reduce helpdesk tickets by 60%',
        description: 'Implement conversation-driven support',
        category: 'operational'
      }, 'test.user@company.com');

      const goal2 = await strategicManager.createGoal({
        vision_id: vision2.id,
        title: 'Improve employee digital satisfaction',
        description: 'Modernize employee-facing systems',
        category: 'customer'
      }, 'test.user@company.com');

      // Create Initiative that supports both goals (cross-cutting)
      const crossCuttingInitiative = await strategicManager.createInitiative({
        goal_id: goal1.id, // Primary goal
        title: 'Microsoft Teams Integration Platform',
        description: 'Build unified Teams platform for both support and employee services',
        category: 'transformation',
        github_sync: true,
        github_label: 'teams-integration'
      }, 'test.user@company.com');

      // Test dashboard shows proper metrics
      const dashboardData = strategicManager.getDashboardData();
      expect(dashboardData.summary.visions).toBe(2);
      expect(dashboardData.summary.goals).toBe(2);
      expect(dashboardData.summary.initiatives).toBe(1);
      expect(dashboardData.summary.syncEnabled.github).toBe(1);

      // Test strategic alignment shows both visions
      const alignmentReport = dashboard.getStrategicAlignmentReport();
      expect(alignmentReport.visionCount).toBe(2);
      expect(alignmentReport.alignmentData).toHaveLength(2);
    });

    it('should track initiative progress and health over time', async () => {
      // Create complete hierarchy
      const vision = await strategicManager.createVision({
        title: 'Test Vision',
        description: 'Test vision for progress tracking',
        status: 'active'
      }, 'test.user@company.com');

      const goal = await strategicManager.createGoal({
        vision_id: vision.id,
        title: 'Test Goal',
        description: 'Test goal for progress tracking',
        status: 'active'
      }, 'test.user@company.com');

      const initiative = await strategicManager.createInitiative({
        goal_id: goal.id,
        title: 'Test Initiative',
        description: 'Test initiative for progress tracking',
        status: 'active',
        budget: 100000,
        spent: 25000
      }, 'test.user@company.com');

      // Add milestones and track progress
      initiative.addMilestone({
        name: 'Phase 1 Complete',
        target_date: '30/12/2024',
        status: 'completed'
      });

      initiative.addMilestone({
        name: 'Phase 2 In Progress', 
        target_date: '28/02/2025',
        status: 'in-progress'
      });

      initiative.addMilestone({
        name: 'Phase 3 Planned',
        target_date: '30/04/2025',
        status: 'planned'
      });

      // Add success criteria
      initiative.addSuccessCriteria('Complete system integration');
      initiative.markCriteriaAchieved(initiative.success_criteria[0].id);

      // Test progress calculation
      const progress = initiative.getProgress();
      expect(progress).toBeGreaterThan(0);
      expect(progress).toBeLessThanOrEqual(100);

      // Test health status
      const health = initiative.getHealthStatus();
      expect(health.status).toBeOneOf(['green', 'amber', 'red']);
      expect(health.score).toBeGreaterThanOrEqual(0);
      expect(health.score).toBeLessThanOrEqual(100);
      expect(health.progress).toBe(progress);

      // Test financial health (25% budget utilization should be healthy)
      expect(health.score).toBeGreaterThan(70); // Should be healthy with 25% spend rate

      // Test dashboard reporting
      const progressReport = dashboard.getInitiativeProgressReport({
        goal_id: goal.id
      });

      const initReport = progressReport.reports[0];
      expect(initReport.progress.percentage).toBe(progress);
      expect(initReport.financial.utilization).toBe(25);
      expect(initReport.progress.milestones.completed).toBe(1);
      expect(initReport.progress.milestones.total).toBe(3);
    });

    it('should export strategic data for compliance and reporting', async () => {
      // Create sample strategic structure
      const vision = await strategicManager.createVision({
        title: 'Export Test Vision',
        description: 'Vision for testing data export',
        status: 'active',
        owner: 'Test Owner'
      }, 'export.user@company.com');

      const goal = await strategicManager.createGoal({
        vision_id: vision.id,
        title: 'Export Test Goal',
        description: 'Goal for testing export',
        status: 'active'
      }, 'export.user@company.com');

      const initiative = await strategicManager.createInitiative({
        goal_id: goal.id,
        title: 'Export Test Initiative',
        description: 'Initiative for testing export',
        status: 'active',
        github_sync: true
      }, 'export.user@company.com');

      // Test strategic manager export
      const fullExport = strategicManager.exportData();
      
      expect(fullExport.version).toBe('1.0');
      expect(fullExport.data.visions).toHaveLength(1);
      expect(fullExport.data.goals).toHaveLength(1);
      expect(fullExport.data.initiatives).toHaveLength(1);
      expect(fullExport.summary).toBeDefined();
      expect(fullExport.exported_at).toBeDefined();

      // Test dashboard exports
      const executiveExport = dashboard.exportDashboardData('executive', 'json');
      expect(executiveExport.reportType).toBe('executive');
      expect(executiveExport.data.overview.totalVisions).toBe(1);

      const summaryExport = dashboard.exportDashboardData('executive', 'summary');
      expect(summaryExport.reportType).toBe('executive');
      expect(summaryExport.keyMetrics.totalVisions).toBe(1);
      expect(summaryExport.generatedAt).toBeDefined();

      // Test KPI dashboard export
      vision.addKPI({
        name: 'Test KPI',
        target: 100,
        current: 75,
        unit: 'units'
      });

      const kpiExport = dashboard.exportDashboardData('kpi-dashboard', 'json');
      expect(kpiExport.data.totalKPIs).toBe(1);
      expect(kpiExport.data.summary.onTrack).toBeGreaterThan(0);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle orphaned entities gracefully', async () => {
      // Try to create goal without valid vision
      await expect(strategicManager.createGoal({
        vision_id: 'non-existent-vision',
        title: 'Orphaned Goal',
        description: 'This should fail'
      }, 'test.user@company.com')).rejects.toThrow();

      // Try to create initiative without valid goal  
      await expect(strategicManager.createInitiative({
        goal_id: 'non-existent-goal',
        title: 'Orphaned Initiative',
        description: 'This should fail'
      }, 'test.user@company.com')).rejects.toThrow();
    });

    it('should handle cascade deletions properly', async () => {
      // Create hierarchy
      const vision = await strategicManager.createVision({
        title: 'Cascade Test Vision',
        status: 'draft'
      }, 'test.user@company.com');

      const goal = await strategicManager.createGoal({
        vision_id: vision.id,
        title: 'Cascade Test Goal',
        status: 'draft'
      }, 'test.user@company.com');

      const initiative = await strategicManager.createInitiative({
        goal_id: goal.id,
        title: 'Cascade Test Initiative',
        status: 'planning'
      }, 'test.user@company.com');

      // Delete vision should cascade
      const deletionResult = await strategicManager.deleteVision(vision.id, 'test.user@company.com');
      
      expect(deletionResult.deleted).toBe(true);
      expect(deletionResult.cascadeDeleted.goals).toBe(1);
      expect(deletionResult.cascadeDeleted.initiatives).toBe(1);

      // Verify entities are gone
      expect(strategicManager.getVision(vision.id)).toBeNull();
      expect(strategicManager.getGoal(goal.id)).toBeNull();
      expect(strategicManager.getInitiative(initiative.id)).toBeNull();
    });

    it('should validate date formats and business rules', async () => {
      // Invalid date format should fail
      await expect(strategicManager.createVision({
        title: 'Date Test Vision',
        start_date: '2024-01-15', // Wrong format, should be dd/mm/yyyy
        target_date: '15/06/2024'
      }, 'test.user@company.com')).rejects.toThrow(/NZ format/);

      // End date before start date should fail  
      await expect(strategicManager.createVision({
        title: 'Date Test Vision',
        start_date: '15/06/2024',
        target_date: '01/01/2024' // Before start date
      }, 'test.user@company.com')).rejects.toThrow(/after start date/);
    });

    it('should handle sync configuration errors gracefully', async () => {
      const initiative = await strategicManager.createInitiative({
        goal_id: (await strategicManager.createGoal({
          vision_id: (await strategicManager.createVision({
            title: 'Sync Test Vision'
          }, 'test.user@company.com')).id,
          title: 'Sync Test Goal'
        }, 'test.user@company.com')).id,
        title: 'Sync Test Initiative',
        github_sync: false,
        ado_sync: false
      }, 'test.user@company.com');

      // Should return null configs when sync disabled
      expect(initiative.getGitHubSyncConfig()).toBeNull();
      expect(initiative.getADOSyncConfig()).toBeNull();

      // Enable sync and check configs are available
      await strategicManager.updateInitiative(initiative.id, {
        github_sync: true,
        github_label: 'test-sync',
        ado_sync: true,
        ado_area_path: 'Test\\Area'
      }, 'test.user@company.com');

      const updatedInitiative = strategicManager.getInitiative(initiative.id);
      expect(updatedInitiative.getGitHubSyncConfig()).toBeDefined();
      expect(updatedInitiative.getADOSyncConfig()).toBeDefined();
    });
  });
});