/**
 * Governance Store - State management for governance module
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

// Type imports (these would be properly typed from governance types)
type GovernanceStatus = 'on-track' | 'at-risk' | 'blocked' | 'escalated';
type GateStatus = 'not-started' | 'in-progress' | 'completed' | 'skipped';
type ComplianceStatus = 'not-started' | 'in-progress' | 'compliant' | 'non-compliant' | 'waived' | 'overdue';
type ActionStatus = 'pending' | 'in-progress' | 'completed' | 'cancelled' | 'blocked';
type BenefitRealizationStatus = 'not-yet' | 'partial' | 'full' | 'none';

interface PortfolioHealthScore {
  totalScore: number;
  components: {
    onTimeScore: number;
    budgetScore: number;
    riskScore: number;
    complianceScore: number;
    benefitsScore: number;
  };
  scoreBand: {
    label: string;
    color: string;
  };
  calculatedAt: string;
}

interface PortfolioDashboard {
  healthScore: PortfolioHealthScore;
  projectsByGate: Record<string, { gateName: string; count: number; projects: string[] }>;
  overdueCompliance: { count: number; severity: string; items: any[] };
  openActions: {
    total: number;
    overdue: number;
    dueThisWeek: number;
    byPriority: Record<string, number>;
  };
  recentDecisions: any[];
  escalatedItems: number;
  benefitsAtRisk: number;
}

interface GovernanceState {
  // Dashboard Data
  dashboard: PortfolioDashboard | null;
  portfolioHealth: PortfolioHealthScore | null;
  
  // Gates
  gates: any[];
  currentProjectGates: Record<string, any>; // projectId -> gate info
  
  // Compliance
  complianceItems: any[];
  overdueCompliance: any[];
  waivers: any[];
  
  // Decisions & Actions
  decisions: any[];
  actions: any[];
  overdueActions: any[];
  actionsByProject: Record<string, any[]>;
  
  // Benefits
  benefits: any[];
  benefitsSummary: {
    totalExpected: number;
    totalRealized: number;
    atRiskCount: number;
    byType: Record<string, { expected: number; realized: number }>;
  } | null;
  roiCalculations: Record<string, any>; // projectId -> ROI data
  
  // Strategic Alignment
  initiatives: any[];
  alignmentSummary: {
    averageScore: number;
    byInitiative: Record<string, any>;
    unaligned: number;
  } | null;
  alignmentScores: Record<string, any>; // projectId -> alignment score
  
  // Escalations
  escalations: any[];
  escalationSummary: {
    total: number;
    byLevel: Record<number, number>;
    byType: Record<string, number>;
    avgResolutionHours: number;
  } | null;
  
  // Analytics
  heatmapData: any[] | null;
  healthTrend: any[] | null;
  gateAnalytics: any | null;
  complianceAnalytics: any | null;
  
  // Reports
  currentReport: any | null;
  
  // UI State
  loading: {
    dashboard: boolean;
    gates: boolean;
    compliance: boolean;
    decisions: boolean;
    benefits: boolean;
    alignment: boolean;
    escalations: boolean;
    analytics: boolean;
    reports: boolean;
  };
  
  error: string | null;
  selectedProjectId: string | null;
  selectedGateId: string | null;
  selectedInitiativeId: string | null;
  
  // Filters
  filters: {
    status?: GovernanceStatus;
    gateId?: string;
    initiativeId?: string;
  };
}

interface GovernanceActions {
  // Dashboard
  fetchDashboard: () => Promise<void>;
  fetchPortfolioHealth: () => Promise<void>;
  refreshMetrics: () => Promise<void>;
  
  // Gates
  fetchGates: () => Promise<void>;
  tryAutoProgress: (projectId: string) => Promise<{ progressed: boolean; newGateId?: string; reason?: string }>;
  checkGateReadiness: (projectId: string, gateId: string) => Promise<{ valid: boolean; message?: string }>;
  
  // Compliance
  fetchCompliance: (projectId?: string) => Promise<void>;
  initializeCompliance: (projectId: string) => Promise<void>;
  updateComplianceStatus: (complianceId: string, status: ComplianceStatus, evidence?: string, assessedBy?: string) => Promise<void>;
  createWaiver: (waiver: any) => Promise<string>;
  processOverdueCompliance: () => Promise<void>;
  
  // Decisions & Actions
  fetchDecisions: (projectId?: string) => Promise<void>;
  fetchActions: (projectId?: string) => Promise<void>;
  fetchOverdueActions: () => Promise<void>;
  recordDecision: (decision: any, actions?: any[]) => Promise<string>;
  createAction: (action: any) => Promise<string>;
  updateActionStatus: (actionId: string, status: ActionStatus, completedBy?: string) => Promise<void>;
  addActionDependency: (actionId: string, dependsOnActionId: string) => Promise<void>;
  
  // Benefits
  fetchBenefits: (projectId?: string) => Promise<void>;
  fetchBenefitsSummary: () => Promise<void>;
  calculateROI: (projectId: string) => Promise<any>;
  calculateBenefitsVariance: (projectId: string) => Promise<any>;
  updateBenefitRealization: (benefitId: string, status: BenefitRealizationStatus, actualValue?: number, actualDate?: string) => Promise<void>;
  createBenefit: (benefit: any) => Promise<string>;
  
  // Strategic Alignment
  fetchInitiatives: () => Promise<void>;
  fetchAlignmentSummary: () => Promise<void>;
  calculateAlignmentScore: (projectId: string) => Promise<any>;
  linkProjectToInitiative: (projectId: string, initiativeId: string) => Promise<void>;
  fetchProjectsByInitiative: (initiativeId: string) => Promise<any[]>;
  
  // Escalations
  fetchEscalations: (projectId?: string) => Promise<void>;
  fetchEscalationSummary: () => Promise<void>;
  createEscalation: (escalation: any) => Promise<string>;
  resolveEscalation: (escalationId: string, resolution: string, resolvedBy: string) => Promise<void>;
  processAutoEscalations: () => Promise<void>;
  
  // Analytics
  generateHeatmap: (filters?: any) => Promise<void>;
  fetchHealthTrend: (days?: number) => Promise<void>;
  fetchGateAnalytics: () => Promise<void>;
  fetchComplianceAnalytics: () => Promise<void>;
  
  // Reports
  generateExecutiveSummary: (dateRange?: { start: string; end: string }) => Promise<any>;
  generateProjectReport: (projectId: string) => Promise<any>;
  generateComplianceAuditReport: (policyId?: string) => Promise<any>;
  exportReport: (report: any, format: 'json' | 'csv' | 'html') => Promise<{ data: string; mimeType: string }>;
  
  // UI Actions
  setSelectedProject: (projectId: string | null) => void;
  setSelectedGate: (gateId: string | null) => void;
  setSelectedInitiative: (initiativeId: string | null) => void;
  setFilters: (filters: Partial<GovernanceState['filters']>) => void;
  clearFilters: () => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  
  // Utility
  reset: () => void;
}

const initialState: GovernanceState = {
  dashboard: null,
  portfolioHealth: null,
  gates: [],
  currentProjectGates: {},
  complianceItems: [],
  overdueCompliance: [],
  waivers: [],
  decisions: [],
  actions: [],
  overdueActions: [],
  actionsByProject: {},
  benefits: [],
  benefitsSummary: null,
  roiCalculations: {},
  initiatives: [],
  alignmentSummary: null,
  alignmentScores: {},
  escalations: [],
  escalationSummary: null,
  heatmapData: null,
  healthTrend: null,
  gateAnalytics: null,
  complianceAnalytics: null,
  currentReport: null,
  loading: {
    dashboard: false,
    gates: false,
    compliance: false,
    decisions: false,
    benefits: false,
    alignment: false,
    escalations: false,
    analytics: false,
    reports: false,
  },
  error: null,
  selectedProjectId: null,
  selectedGateId: null,
  selectedInitiativeId: null,
  filters: {},
};

export const useGovernanceStore = create<GovernanceState & GovernanceActions>()(
  subscribeWithSelector((set, get) => ({
    ...initialState,
    
    // ===== DASHBOARD =====
    fetchDashboard: async () => {
      set((state) => ({ loading: { ...state.loading, dashboard: true }, error: null }));
      try {
        const response = await window.electronAPI.governance.getDashboard();
        if (response.success && response.data) {
          set((state) => ({
            dashboard: response.data,
            portfolioHealth: response.data.healthScore,
            loading: { ...state.loading, dashboard: false },
          }));
        } else {
          set((state) => ({
            error: response.error || 'Failed to fetch dashboard',
            loading: { ...state.loading, dashboard: false },
          }));
        }
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch dashboard',
          loading: { ...state.loading, dashboard: false },
        }));
      }
    },
    
    fetchPortfolioHealth: async () => {
      set((state) => ({ loading: { ...state.loading, dashboard: true }, error: null }));
      try {
        const response = await window.electronAPI.governance.getPortfolioHealth();
        if (response.success && response.data) {
          set((state) => ({
            portfolioHealth: response.data,
            loading: { ...state.loading, dashboard: false },
          }));
        } else {
          set((state) => ({
            error: response.error || 'Failed to fetch portfolio health',
            loading: { ...state.loading, dashboard: false },
          }));
        }
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch portfolio health',
          loading: { ...state.loading, dashboard: false },
        }));
      }
    },
    
    refreshMetrics: async () => {
      try {
        await window.electronAPI.governance.refreshMetrics();
        await get().fetchDashboard();
      } catch (error: any) {
        set({ error: error.message || 'Failed to refresh metrics' });
      }
    },
    
    // ===== GATES =====
    fetchGates: async () => {
      set((state) => ({ loading: { ...state.loading, gates: true }, error: null }));
      try {
        // Gates are fetched as part of dashboard or via direct DB query
        // This is a placeholder for future implementation
        set((state) => ({ loading: { ...state.loading, gates: false } }));
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch gates',
          loading: { ...state.loading, gates: false },
        }));
      }
    },
    
    tryAutoProgress: async (projectId: string) => {
      try {
        const response = await window.electronAPI.governance.tryAutoProgress(projectId);
        if (response.success && response.data) {
          // Refresh dashboard to reflect changes
          await get().fetchDashboard();
          return response.data;
        }
        return { progressed: false, reason: response.error || 'Failed to auto-progress' };
      } catch (error: any) {
        return { progressed: false, reason: error.message || 'Failed to auto-progress' };
      }
    },
    
    checkGateReadiness: async (projectId: string, gateId: string) => {
      try {
        const response = await window.electronAPI.governance.checkGateReadiness(projectId, gateId);
        if (response.success && response.data) {
          return response.data;
        }
        return { valid: false, message: response.error || 'Failed to check gate readiness' };
      } catch (error: any) {
        return { valid: false, message: error.message || 'Failed to check gate readiness' };
      }
    },
    
    // ===== COMPLIANCE =====
    fetchCompliance: async (projectId?: string) => {
      set((state) => ({ loading: { ...state.loading, compliance: true }, error: null }));
      try {
        // Compliance would be fetched via DB query or specific endpoint
        set((state) => ({ loading: { ...state.loading, compliance: false } }));
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch compliance',
          loading: { ...state.loading, compliance: false },
        }));
      }
    },
    
    initializeCompliance: async (projectId: string) => {
      try {
        const response = await window.electronAPI.governance.initializeCompliance(projectId);
        if (response.success) {
          await get().fetchCompliance(projectId);
        } else {
          throw new Error(response.error || 'Failed to initialize compliance');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    updateComplianceStatus: async (complianceId: string, status: ComplianceStatus, evidence?: string, assessedBy?: string) => {
      try {
        const response = await window.electronAPI.governance.updateComplianceStatus(complianceId, status, evidence, assessedBy);
        if (response.success) {
          await get().fetchDashboard();
        } else {
          throw new Error(response.error || 'Failed to update compliance status');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    createWaiver: async (waiver: any) => {
      try {
        const response = await window.electronAPI.governance.createWaiver(waiver);
        if (response.success && response.data) {
          await get().fetchDashboard();
          return response.data;
        }
        throw new Error(response.error || 'Failed to create waiver');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    processOverdueCompliance: async () => {
      try {
        await window.electronAPI.governance.processOverdueCompliance();
        await get().fetchDashboard();
      } catch (error: any) {
        set({ error: error.message || 'Failed to process overdue compliance' });
      }
    },
    
    // ===== DECISIONS & ACTIONS =====
    fetchDecisions: async (projectId?: string) => {
      set((state) => ({ loading: { ...state.loading, decisions: true }, error: null }));
      try {
        // Would fetch decisions here
        set((state) => ({ loading: { ...state.loading, decisions: false } }));
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch decisions',
          loading: { ...state.loading, decisions: false },
        }));
      }
    },
    
    fetchActions: async (projectId?: string) => {
      set((state) => ({ loading: { ...state.loading, decisions: true }, error: null }));
      try {
        if (projectId) {
          const response = await window.electronAPI.governance.getProjectActions(projectId);
          if (response.success && response.data) {
            set((state) => ({
              actionsByProject: { ...state.actionsByProject, [projectId]: response.data },
              loading: { ...state.loading, decisions: false },
            }));
          }
        }
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch actions',
          loading: { ...state.loading, decisions: false },
        }));
      }
    },
    
    fetchOverdueActions: async () => {
      try {
        const response = await window.electronAPI.governance.getOverdueActions();
        if (response.success && response.data) {
          set({ overdueActions: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch overdue actions' });
      }
    },
    
    recordDecision: async (decision: any, actions?: any[]) => {
      try {
        const response = await window.electronAPI.governance.recordDecision(decision, actions);
        if (response.success && response.data) {
          await get().fetchDashboard();
          return response.data;
        }
        throw new Error(response.error || 'Failed to record decision');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    createAction: async (action: any) => {
      try {
        const response = await window.electronAPI.governance.createAction(action);
        if (response.success && response.data) {
          if (action.project_id) {
            await get().fetchActions(action.project_id);
          }
          return response.data;
        }
        throw new Error(response.error || 'Failed to create action');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    updateActionStatus: async (actionId: string, status: ActionStatus, completedBy?: string) => {
      try {
        const response = await window.electronAPI.governance.updateActionStatus(actionId, status, completedBy);
        if (response.success) {
          await get().fetchDashboard();
        } else {
          throw new Error(response.error || 'Failed to update action status');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    addActionDependency: async (actionId: string, dependsOnActionId: string) => {
      try {
        const response = await window.electronAPI.governance.addActionDependency(actionId, dependsOnActionId);
        if (!response.success) {
          throw new Error(response.error || 'Failed to add action dependency');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    // ===== BENEFITS =====
    fetchBenefits: async (projectId?: string) => {
      set((state) => ({ loading: { ...state.loading, benefits: true }, error: null }));
      try {
        // Would fetch benefits here
        set((state) => ({ loading: { ...state.loading, benefits: false } }));
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch benefits',
          loading: { ...state.loading, benefits: false },
        }));
      }
    },
    
    fetchBenefitsSummary: async () => {
      try {
        const response = await window.electronAPI.governance.getPortfolioBenefitsSummary();
        if (response.success && response.data) {
          set({ benefitsSummary: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch benefits summary' });
      }
    },
    
    calculateROI: async (projectId: string) => {
      try {
        const response = await window.electronAPI.governance.calculateROI(projectId);
        if (response.success && response.data) {
          set((state) => ({
            roiCalculations: { ...state.roiCalculations, [projectId]: response.data },
          }));
          return response.data;
        }
        throw new Error(response.error || 'Failed to calculate ROI');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    calculateBenefitsVariance: async (projectId: string) => {
      try {
        const response = await window.electronAPI.governance.calculateBenefitsVariance(projectId);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to calculate benefits variance');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    updateBenefitRealization: async (benefitId: string, status: BenefitRealizationStatus, actualValue?: number, actualDate?: string) => {
      try {
        const response = await window.electronAPI.governance.updateBenefitRealization(benefitId, status, actualValue, actualDate);
        if (response.success) {
          await get().fetchBenefitsSummary();
        } else {
          throw new Error(response.error || 'Failed to update benefit realization');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    createBenefit: async (benefit: any) => {
      try {
        const response = await window.electronAPI.governance.createBenefit(benefit);
        if (response.success && response.data) {
          await get().fetchBenefitsSummary();
          return response.data;
        }
        throw new Error(response.error || 'Failed to create benefit');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    // ===== STRATEGIC ALIGNMENT =====
    fetchInitiatives: async () => {
      set((state) => ({ loading: { ...state.loading, alignment: true }, error: null }));
      try {
        // Would fetch initiatives here
        set((state) => ({ loading: { ...state.loading, alignment: false } }));
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch initiatives',
          loading: { ...state.loading, alignment: false },
        }));
      }
    },
    
    fetchAlignmentSummary: async () => {
      try {
        const response = await window.electronAPI.governance.getPortfolioAlignmentSummary();
        if (response.success && response.data) {
          set({ alignmentSummary: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch alignment summary' });
      }
    },
    
    calculateAlignmentScore: async (projectId: string) => {
      try {
        const response = await window.electronAPI.governance.calculateAlignmentScore(projectId);
        if (response.success && response.data) {
          set((state) => ({
            alignmentScores: { ...state.alignmentScores, [projectId]: response.data },
          }));
          return response.data;
        }
        throw new Error(response.error || 'Failed to calculate alignment score');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    linkProjectToInitiative: async (projectId: string, initiativeId: string) => {
      try {
        const response = await window.electronAPI.governance.linkProjectToInitiative(projectId, initiativeId);
        if (response.success) {
          await get().calculateAlignmentScore(projectId);
        } else {
          throw new Error(response.error || 'Failed to link project to initiative');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    fetchProjectsByInitiative: async (initiativeId: string) => {
      try {
        const response = await window.electronAPI.governance.getProjectsByInitiative(initiativeId);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to fetch projects by initiative');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    // ===== ESCALATIONS =====
    fetchEscalations: async (projectId?: string) => {
      set((state) => ({ loading: { ...state.loading, escalations: true }, error: null }));
      try {
        // Would fetch escalations here
        set((state) => ({ loading: { ...state.loading, escalations: false } }));
      } catch (error: any) {
        set((state) => ({
          error: error.message || 'Failed to fetch escalations',
          loading: { ...state.loading, escalations: false },
        }));
      }
    },
    
    fetchEscalationSummary: async () => {
      try {
        const response = await window.electronAPI.governance.getEscalationSummary();
        if (response.success && response.data) {
          set({ escalationSummary: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch escalation summary' });
      }
    },
    
    createEscalation: async (escalation: any) => {
      try {
        const response = await window.electronAPI.governance.createEscalation(escalation);
        if (response.success && response.data) {
          await get().fetchDashboard();
          return response.data;
        }
        throw new Error(response.error || 'Failed to create escalation');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    resolveEscalation: async (escalationId: string, resolution: string, resolvedBy: string) => {
      try {
        const response = await window.electronAPI.governance.resolveEscalation(escalationId, resolution, resolvedBy);
        if (response.success) {
          await get().fetchDashboard();
        } else {
          throw new Error(response.error || 'Failed to resolve escalation');
        }
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    processAutoEscalations: async () => {
      try {
        await window.electronAPI.governance.processAutoEscalations();
        await get().fetchDashboard();
      } catch (error: any) {
        set({ error: error.message || 'Failed to process auto-escalations' });
      }
    },
    
    // ===== ANALYTICS =====
    generateHeatmap: async (filters?: any) => {
      set((state) => ({ loading: { ...state.loading, analytics: true }, error: null }));
      try {
        const response = await window.electronAPI.governance.generateHeatmap(filters);
        if (response.success && response.data) {
          set((state) => ({
            heatmapData: response.data,
            loading: { ...state.loading, analytics: false },
          }));
        } else {
          throw new Error(response.error || 'Failed to generate heatmap');
        }
      } catch (error: any) {
        set((state) => ({
          error: error.message,
          loading: { ...state.loading, analytics: false },
        }));
      }
    },
    
    fetchHealthTrend: async (days: number = 90) => {
      try {
        const response = await window.electronAPI.governance.getHealthTrend(days);
        if (response.success && response.data) {
          set({ healthTrend: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch health trend' });
      }
    },
    
    fetchGateAnalytics: async () => {
      try {
        const response = await window.electronAPI.governance.getGateProgressionAnalytics();
        if (response.success && response.data) {
          set({ gateAnalytics: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch gate analytics' });
      }
    },
    
    fetchComplianceAnalytics: async () => {
      try {
        const response = await window.electronAPI.governance.getComplianceAnalytics();
        if (response.success && response.data) {
          set({ complianceAnalytics: response.data });
        }
      } catch (error: any) {
        set({ error: error.message || 'Failed to fetch compliance analytics' });
      }
    },
    
    // ===== REPORTS =====
    generateExecutiveSummary: async (dateRange?: { start: string; end: string }) => {
      set((state) => ({ loading: { ...state.loading, reports: true }, error: null }));
      try {
        const response = await window.electronAPI.governance.generateExecutiveSummary(dateRange);
        if (response.success && response.data) {
          set((state) => ({
            currentReport: response.data,
            loading: { ...state.loading, reports: false },
          }));
          return response.data;
        }
        throw new Error(response.error || 'Failed to generate executive summary');
      } catch (error: any) {
        set((state) => ({
          error: error.message,
          loading: { ...state.loading, reports: false },
        }));
        throw error;
      }
    },
    
    generateProjectReport: async (projectId: string) => {
      set((state) => ({ loading: { ...state.loading, reports: true }, error: null }));
      try {
        const response = await window.electronAPI.governance.generateProjectReport(projectId);
        if (response.success && response.data) {
          set((state) => ({
            currentReport: response.data,
            loading: { ...state.loading, reports: false },
          }));
          return response.data;
        }
        throw new Error(response.error || 'Failed to generate project report');
      } catch (error: any) {
        set((state) => ({
          error: error.message,
          loading: { ...state.loading, reports: false },
        }));
        throw error;
      }
    },
    
    generateComplianceAuditReport: async (policyId?: string) => {
      set((state) => ({ loading: { ...state.loading, reports: true }, error: null }));
      try {
        const response = await window.electronAPI.governance.generateComplianceAuditReport(policyId);
        if (response.success && response.data) {
          set((state) => ({
            currentReport: response.data,
            loading: { ...state.loading, reports: false },
          }));
          return response.data;
        }
        throw new Error(response.error || 'Failed to generate compliance audit report');
      } catch (error: any) {
        set((state) => ({
          error: error.message,
          loading: { ...state.loading, reports: false },
        }));
        throw error;
      }
    },
    
    exportReport: async (report: any, format: 'json' | 'csv' | 'html') => {
      try {
        const response = await window.electronAPI.governance.exportReport(report, format);
        if (response.success && response.data) {
          return response.data;
        }
        throw new Error(response.error || 'Failed to export report');
      } catch (error: any) {
        set({ error: error.message });
        throw error;
      }
    },
    
    // ===== UI ACTIONS =====
    setSelectedProject: (projectId: string | null) => set({ selectedProjectId: projectId }),
    setSelectedGate: (gateId: string | null) => set({ selectedGateId: gateId }),
    setSelectedInitiative: (initiativeId: string | null) => set({ selectedInitiativeId: initiativeId }),
    setFilters: (filters: Partial<GovernanceState['filters']>) => 
      set((state) => ({ filters: { ...state.filters, ...filters } })),
    clearFilters: () => set({ filters: {} }),
    setError: (error: string | null) => set({ error }),
    clearError: () => set({ error: null }),
    
    // ===== UTILITY =====
    reset: () => set(initialState),
  }))
);

console.log('Governance store initialized');
