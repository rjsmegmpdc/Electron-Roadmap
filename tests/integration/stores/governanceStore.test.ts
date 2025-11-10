import { renderHook, act, waitFor } from '@testing-library/react';
import { useGovernanceStore } from '../../../app/renderer/stores/governanceStore';

// Mock the Electron API
const mockElectronAPI = {
  governance: {
    getDashboard: jest.fn(),
    getPortfolioHealth: jest.fn(),
    getAllGates: jest.fn(),
    getProjectGates: jest.fn(),
    getOverdueCompliance: jest.fn(),
    getOverdueActions: jest.fn(),
    getActionsByProject: jest.fn(),
    getBenefitsSummary: jest.fn(),
    getROICalculations: jest.fn(),
    getAlignmentSummary: jest.fn(),
    getEscalationSummary: jest.fn(),
    getHeatmapData: jest.fn(),
    getHealthTrend: jest.fn(),
    progressGate: jest.fn(),
    createDecision: jest.fn(),
    createAction: jest.fn(),
    updateAction: jest.fn(),
    deleteAction: jest.fn(),
    createBenefit: jest.fn(),
    updateBenefit: jest.fn(),
    deleteBenefit: jest.fn()
  }
};

(global as any).window = {
  electronAPI: mockElectronAPI
};

describe('Governance Store Integration Tests', () => {
  beforeEach(() => {
    // Reset store state before each test
    const { result } = renderHook(() => useGovernanceStore());
    act(() => {
      result.current.error = null;
      result.current.loading = {};
    });
    jest.clearAllMocks();
  });

  describe('✅ Dashboard Operations', () => {
    test('should load dashboard data successfully', async () => {
      const mockDashboard = {
        portfolio_health: {
          overall_score: 85,
          health_band: 'Good',
          on_time_score: 90,
          budget_score: 80,
          risk_score: 85,
          compliance_score: 85,
          benefits_score: 80,
          project_count: 10,
          calculated_at: '2024-01-15'
        },
        projects_by_gate: [
          { gate_name: 'Ideation', project_count: 3 },
          { gate_name: 'Design', project_count: 4 },
          { gate_name: 'Build', project_count: 3 }
        ],
        overdue_compliance_count: 5,
        overdue_actions_count: 8,
        active_escalations_count: 2,
        benefits_at_risk_count: 3
      };

      mockElectronAPI.governance.getDashboard.mockResolvedValue({
        success: true,
        data: mockDashboard
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadDashboard();
      });

      expect(result.current.dashboard).toEqual(mockDashboard);
      expect(result.current.loading.dashboard).toBe(false);
      expect(result.current.error).toBeNull();
      expect(mockElectronAPI.governance.getDashboard).toHaveBeenCalledTimes(1);
    });

    test('should handle dashboard loading error', async () => {
      const errorMessage = 'Failed to load dashboard';
      mockElectronAPI.governance.getDashboard.mockResolvedValue({
        success: false,
        error: errorMessage
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadDashboard();
      });

      expect(result.current.error).toBe(errorMessage);
      expect(result.current.loading.dashboard).toBe(false);
      expect(result.current.dashboard).toBeNull();
    });

    test('should handle network errors gracefully', async () => {
      mockElectronAPI.governance.getDashboard.mockRejectedValue(
        new Error('Network error')
      );

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadDashboard();
      });

      expect(result.current.error).toContain('Network error');
      expect(result.current.loading.dashboard).toBe(false);
    });
  });

  describe('✅ Portfolio Health Operations', () => {
    test('should load and refresh portfolio health', async () => {
      const mockHealth = {
        overall_score: 75,
        health_band: 'Good',
        on_time_score: 80,
        budget_score: 70,
        risk_score: 75,
        compliance_score: 80,
        benefits_score: 70,
        project_count: 8,
        calculated_at: '2024-01-15'
      };

      mockElectronAPI.governance.getPortfolioHealth.mockResolvedValue({
        success: true,
        data: mockHealth
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadPortfolioHealth();
      });

      expect(result.current.portfolioHealth).toEqual(mockHealth);
      expect(result.current.loading.portfolioHealth).toBe(false);

      // Refresh health
      const updatedHealth = { ...mockHealth, overall_score: 80 };
      mockElectronAPI.governance.getPortfolioHealth.mockResolvedValue({
        success: true,
        data: updatedHealth
      });

      await act(async () => {
        await result.current.refreshPortfolioHealth();
      });

      expect(result.current.portfolioHealth).toEqual(updatedHealth);
    });
  });

  describe('✅ Gate Management', () => {
    test('should load all gates', async () => {
      const mockGates = [
        { id: 1, gate_name: 'Ideation', gate_order: 1, mandatory: true },
        { id: 2, gate_name: 'Design', gate_order: 2, mandatory: true },
        { id: 3, gate_name: 'Build', gate_order: 3, mandatory: true }
      ];

      mockElectronAPI.governance.getAllGates.mockResolvedValue({
        success: true,
        data: mockGates
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadGates();
      });

      expect(result.current.gates).toEqual(mockGates);
      expect(result.current.loading.gates).toBe(false);
    });

    test('should load project gates for specific project', async () => {
      const projectId = 'PROJ-001';
      const mockProjectGates = [
        {
          project_id: projectId,
          gate_id: 2,
          gate_name: 'Design',
          gate_order: 2,
          status: 'in-progress',
          entry_date: '01-01-2024'
        }
      ];

      mockElectronAPI.governance.getProjectGates.mockResolvedValue({
        success: true,
        data: mockProjectGates
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadProjectGates(projectId);
      });

      expect(result.current.currentProjectGates).toEqual(mockProjectGates);
      expect(mockElectronAPI.governance.getProjectGates).toHaveBeenCalledWith(projectId);
    });

    test('should progress gate successfully', async () => {
      const projectId = 'PROJ-001';
      const targetGateId = 3;

      mockElectronAPI.governance.progressGate.mockResolvedValue({
        success: true,
        data: { message: 'Gate progressed successfully' }
      });

      mockElectronAPI.governance.getProjectGates.mockResolvedValue({
        success: true,
        data: [{
          project_id: projectId,
          gate_id: targetGateId,
          status: 'in-progress'
        }]
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.progressProjectGate(projectId, targetGateId);
      });

      expect(mockElectronAPI.governance.progressGate).toHaveBeenCalledWith(projectId, targetGateId);
      expect(mockElectronAPI.governance.getProjectGates).toHaveBeenCalledWith(projectId);
      expect(result.current.error).toBeNull();
    });
  });

  describe('✅ Compliance Operations', () => {
    test('should load overdue compliance items', async () => {
      const mockCompliance = [
        {
          id: 1,
          project_id: 'PROJ-001',
          policy_name: 'Security Policy',
          compliance_status: 'non-compliant',
          due_date: '01-01-2024',
          days_overdue: 15
        },
        {
          id: 2,
          project_id: 'PROJ-002',
          policy_name: 'Data Governance',
          compliance_status: 'non-compliant',
          due_date: '05-01-2024',
          days_overdue: 10
        }
      ];

      mockElectronAPI.governance.getOverdueCompliance.mockResolvedValue({
        success: true,
        data: mockCompliance
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadOverdueCompliance();
      });

      expect(result.current.overdueCompliance).toEqual(mockCompliance);
      expect(result.current.loading.compliance).toBe(false);
    });
  });

  describe('✅ Action Management', () => {
    test('should load overdue actions', async () => {
      const mockActions = [
        {
          id: 1,
          action_title: 'Complete risk assessment',
          priority: 'high',
          due_date: '10-01-2024',
          status: 'open',
          days_overdue: 5
        },
        {
          id: 2,
          action_title: 'Update documentation',
          priority: 'medium',
          due_date: '12-01-2024',
          status: 'in-progress',
          days_overdue: 3
        }
      ];

      mockElectronAPI.governance.getOverdueActions.mockResolvedValue({
        success: true,
        data: mockActions
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadOverdueActions();
      });

      expect(result.current.overdueActions).toEqual(mockActions);
      expect(result.current.loading.actions).toBe(false);
    });

    test('should create new action', async () => {
      const newAction = {
        decision_id: 1,
        action_title: 'New action',
        priority: 'high',
        due_date: '31-12-2024',
        assigned_to: 'John Doe'
      };

      const createdAction = { ...newAction, id: 10 };

      mockElectronAPI.governance.createAction.mockResolvedValue({
        success: true,
        data: createdAction
      });

      const { result } = renderHook(() => useGovernanceStore());

      let returnedAction: any;
      await act(async () => {
        returnedAction = await result.current.createAction(newAction);
      });

      expect(mockElectronAPI.governance.createAction).toHaveBeenCalledWith(newAction);
      expect(returnedAction).toEqual(createdAction);
      expect(result.current.error).toBeNull();
    });

    test('should update existing action', async () => {
      const actionId = 5;
      const updates = {
        status: 'completed',
        completion_notes: 'Action completed successfully'
      };

      mockElectronAPI.governance.updateAction.mockResolvedValue({
        success: true,
        data: { id: actionId, ...updates }
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.updateAction(actionId, updates);
      });

      expect(mockElectronAPI.governance.updateAction).toHaveBeenCalledWith(actionId, updates);
      expect(result.current.error).toBeNull();
    });

    test('should delete action', async () => {
      const actionId = 5;

      mockElectronAPI.governance.deleteAction.mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.deleteAction(actionId);
      });

      expect(mockElectronAPI.governance.deleteAction).toHaveBeenCalledWith(actionId);
      expect(result.current.error).toBeNull();
    });

    test('should load actions by project', async () => {
      const projectId = 'PROJ-001';
      const mockActions = [
        { id: 1, action_title: 'Action 1', project_id: projectId },
        { id: 2, action_title: 'Action 2', project_id: projectId }
      ];

      mockElectronAPI.governance.getActionsByProject.mockResolvedValue({
        success: true,
        data: mockActions
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadActionsByProject(projectId);
      });

      expect(result.current.actionsByProject).toEqual(mockActions);
      expect(mockElectronAPI.governance.getActionsByProject).toHaveBeenCalledWith(projectId);
    });
  });

  describe('✅ Benefits Management', () => {
    test('should load benefits summary', async () => {
      const mockSummary = {
        total_expected_value: 500000,
        total_realized_value: 300000,
        realization_percentage: 60,
        benefits_on_track: 5,
        benefits_at_risk: 2,
        benefits_delayed: 1
      };

      mockElectronAPI.governance.getBenefitsSummary.mockResolvedValue({
        success: true,
        data: mockSummary
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadBenefitsSummary();
      });

      expect(result.current.benefitsSummary).toEqual(mockSummary);
      expect(result.current.loading.benefits).toBe(false);
    });

    test('should load ROI calculations', async () => {
      const mockROI = {
        total_investment: 200000,
        total_benefits: 350000,
        roi_percentage: 75.0,
        payback_period_months: 18,
        npv: 150000
      };

      mockElectronAPI.governance.getROICalculations.mockResolvedValue({
        success: true,
        data: mockROI
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadROICalculations();
      });

      expect(result.current.roiCalculations).toEqual(mockROI);
    });

    test('should create new benefit', async () => {
      const newBenefit = {
        project_id: 'PROJ-001',
        benefit_type: 'financial',
        description: 'Cost savings',
        expected_value: 100000,
        target_date: '31-12-2024'
      };

      const createdBenefit = { ...newBenefit, id: 15 };

      mockElectronAPI.governance.createBenefit.mockResolvedValue({
        success: true,
        data: createdBenefit
      });

      const { result } = renderHook(() => useGovernanceStore());

      let returnedBenefit: any;
      await act(async () => {
        returnedBenefit = await result.current.createBenefit(newBenefit);
      });

      expect(mockElectronAPI.governance.createBenefit).toHaveBeenCalledWith(newBenefit);
      expect(returnedBenefit).toEqual(createdBenefit);
    });

    test('should update benefit', async () => {
      const benefitId = 15;
      const updates = {
        realized_value: 50000,
        realization_status: 'on-track'
      };

      mockElectronAPI.governance.updateBenefit.mockResolvedValue({
        success: true,
        data: { id: benefitId, ...updates }
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.updateBenefit(benefitId, updates);
      });

      expect(mockElectronAPI.governance.updateBenefit).toHaveBeenCalledWith(benefitId, updates);
    });

    test('should delete benefit', async () => {
      const benefitId = 15;

      mockElectronAPI.governance.deleteBenefit.mockResolvedValue({
        success: true
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.deleteBenefit(benefitId);
      });

      expect(mockElectronAPI.governance.deleteBenefit).toHaveBeenCalledWith(benefitId);
    });
  });

  describe('✅ Analytics Operations', () => {
    test('should load heatmap data', async () => {
      const mockHeatmap = [
        { project_id: 'PROJ-001', risk_score: 30, value_score: 80, x: 30, y: 80 },
        { project_id: 'PROJ-002', risk_score: 60, value_score: 50, x: 60, y: 50 }
      ];

      mockElectronAPI.governance.getHeatmapData.mockResolvedValue({
        success: true,
        data: mockHeatmap
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await result.current.loadHeatmapData();
      });

      expect(result.current.heatmapData).toEqual(mockHeatmap);
      expect(result.current.loading.analytics).toBe(false);
    });

    test('should load health trend with different time ranges', async () => {
      const mockTrend = [
        { date: '2024-01-01', overall_score: 75 },
        { date: '2024-01-08', overall_score: 78 },
        { date: '2024-01-15', overall_score: 80 }
      ];

      mockElectronAPI.governance.getHealthTrend.mockResolvedValue({
        success: true,
        data: mockTrend
      });

      const { result } = renderHook(() => useGovernanceStore());

      // Test with 30 days
      await act(async () => {
        await result.current.loadHealthTrend(30);
      });

      expect(result.current.healthTrend).toEqual(mockTrend);
      expect(mockElectronAPI.governance.getHealthTrend).toHaveBeenCalledWith(30);

      // Test with 90 days
      await act(async () => {
        await result.current.loadHealthTrend(90);
      });

      expect(mockElectronAPI.governance.getHealthTrend).toHaveBeenCalledWith(90);
    });
  });

  describe('✅ UI State Management', () => {
    test('should set selected project ID', () => {
      const { result } = renderHook(() => useGovernanceStore());

      act(() => {
        result.current.setSelectedProjectId('PROJ-001');
      });

      expect(result.current.selectedProjectId).toBe('PROJ-001');

      act(() => {
        result.current.setSelectedProjectId(null);
      });

      expect(result.current.selectedProjectId).toBeNull();
    });

    test('should set selected gate ID', () => {
      const { result } = renderHook(() => useGovernanceStore());

      act(() => {
        result.current.setSelectedGateId(3);
      });

      expect(result.current.selectedGateId).toBe(3);
    });

    test('should update filters', () => {
      const { result } = renderHook(() => useGovernanceStore());

      act(() => {
        result.current.setFilters({
          status: 'active',
          priority: 'high',
          dateRange: { start: '01-01-2024', end: '31-12-2024' }
        });
      });

      expect(result.current.filters).toEqual({
        status: 'active',
        priority: 'high',
        dateRange: { start: '01-01-2024', end: '31-12-2024' }
      });
    });

    test('should clear error', () => {
      const { result } = renderHook(() => useGovernanceStore());

      act(() => {
        result.current.error = 'Test error';
      });

      expect(result.current.error).toBe('Test error');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('❌ Error Handling', () => {
    test('should handle concurrent requests gracefully', async () => {
      mockElectronAPI.governance.getDashboard.mockResolvedValue({
        success: true,
        data: { portfolio_health: { overall_score: 80 } }
      });

      mockElectronAPI.governance.getPortfolioHealth.mockResolvedValue({
        success: true,
        data: { overall_score: 80 }
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        await Promise.all([
          result.current.loadDashboard(),
          result.current.loadPortfolioHealth(),
          result.current.loadGates()
        ]);
      });

      expect(result.current.error).toBeNull();
    });

    test('should set loading state correctly during operations', async () => {
      let resolveDashboard: any;
      const dashboardPromise = new Promise((resolve) => {
        resolveDashboard = resolve;
      });

      mockElectronAPI.governance.getDashboard.mockReturnValue(dashboardPromise);

      const { result } = renderHook(() => useGovernanceStore());

      act(() => {
        result.current.loadDashboard();
      });

      // Should be loading
      expect(result.current.loading.dashboard).toBe(true);

      await act(async () => {
        resolveDashboard({ success: true, data: {} });
        await dashboardPromise;
      });

      // Should be done loading
      await waitFor(() => {
        expect(result.current.loading.dashboard).toBe(false);
      });
    });
  });

  describe('⚡ Performance', () => {
    test('should handle rapid successive calls', async () => {
      mockElectronAPI.governance.getPortfolioHealth.mockResolvedValue({
        success: true,
        data: { overall_score: 80 }
      });

      const { result } = renderHook(() => useGovernanceStore());

      await act(async () => {
        const promises = Array.from({ length: 10 }, () =>
          result.current.loadPortfolioHealth()
        );
        await Promise.all(promises);
      });

      // Should complete without errors
      expect(result.current.error).toBeNull();
      expect(result.current.portfolioHealth).toBeTruthy();
    });
  });
});
