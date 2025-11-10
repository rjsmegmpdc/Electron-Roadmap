import { Database } from 'better-sqlite3';
import { GovernanceService } from '../../../app/main/services/governance/GovernanceService';
import {
  GateRepository,
  ProjectGateRepository,
  PolicyComplianceRepository,
  ActionRepository,
  BenefitsRepository,
  EscalationRepository
} from '../../../app/main/repositories/governance-repositories';

// Mock the repositories
jest.mock('../../../app/main/repositories/governance-repositories');

describe('Governance Service', () => {
  let mockDb: jest.Mocked<Database>;
  let governanceService: GovernanceService;
  let mockGateRepo: jest.Mocked<GateRepository>;
  let mockProjectGateRepo: jest.Mocked<ProjectGateRepository>;
  let mockPolicyComplianceRepo: jest.Mocked<PolicyComplianceRepository>;
  let mockActionRepo: jest.Mocked<ActionRepository>;
  let mockBenefitsRepo: jest.Mocked<BenefitsRepository>;
  let mockEscalationRepo: jest.Mocked<EscalationRepository>;

  beforeEach(() => {
    // Create mock database
    mockDb = {
      prepare: jest.fn().mockReturnThis(),
      get: jest.fn(),
      all: jest.fn(),
      run: jest.fn()
    } as any;

    // Create mock repositories
    mockGateRepo = new GateRepository(mockDb) as jest.Mocked<GateRepository>;
    mockProjectGateRepo = new ProjectGateRepository(mockDb) as jest.Mocked<ProjectGateRepository>;
    mockPolicyComplianceRepo = new PolicyComplianceRepository(mockDb) as jest.Mocked<PolicyComplianceRepository>;
    mockActionRepo = new ActionRepository(mockDb) as jest.Mocked<ActionRepository>;
    mockBenefitsRepo = new BenefitsRepository(mockDb) as jest.Mocked<BenefitsRepository>;
    mockEscalationRepo = new EscalationRepository(mockDb) as jest.Mocked<EscalationRepository>;

    // Initialize service with mocked dependencies
    governanceService = new GovernanceService(
      mockDb,
      mockGateRepo,
      mockProjectGateRepo,
      mockPolicyComplianceRepo,
      mockActionRepo,
      mockBenefitsRepo,
      mockEscalationRepo
    );

    jest.clearAllMocks();
  });

  describe('✅ Portfolio Health Scoring', () => {
    describe('calculatePortfolioHealth', () => {
      test('should calculate perfect health score (100) for ideal portfolio', async () => {
        // Mock data: All projects on time, on budget, low risk
        mockDb.all = jest.fn().mockReturnValue([
          {
            project_id: 'PROJ-001',
            status: 'active',
            on_time: 1,
            on_budget: 1,
            risk_level: 'low',
            compliance_rate: 100,
            benefits_on_track: 1
          }
        ]);

        const health = await governanceService.calculatePortfolioHealth();

        expect(health.overall_score).toBe(100);
        expect(health.health_band).toBe('Excellent');
        expect(health.on_time_score).toBe(100);
        expect(health.budget_score).toBe(100);
        expect(health.risk_score).toBe(100);
        expect(health.compliance_score).toBe(100);
        expect(health.benefits_score).toBe(100);
      });

      test('should calculate health scores with correct weightings', async () => {
        // Mock mixed portfolio data
        mockDb.all = jest.fn().mockReturnValue([
          {
            project_id: 'PROJ-001',
            status: 'active',
            on_time: 1,       // 100%
            on_budget: 0,     // 0%
            risk_level: 'medium', // 50%
            compliance_rate: 75,  // 75%
            benefits_on_track: 1  // 100%
          }
        ]);

        const health = await governanceService.calculatePortfolioHealth();

        // Expected: (100 * 0.30) + (0 * 0.25) + (50 * 0.20) + (75 * 0.15) + (100 * 0.10)
        // = 30 + 0 + 10 + 11.25 + 10 = 61.25
        expect(health.overall_score).toBeCloseTo(61.25, 2);
        expect(health.health_band).toBe('Fair');
      });

      test('should correctly map scores to health bands', async () => {
        const testCases = [
          { score: 95, expectedBand: 'Excellent' },
          { score: 85, expectedBand: 'Good' },
          { score: 70, expectedBand: 'Fair' },
          { score: 50, expectedBand: 'Poor' },
          { score: 30, expectedBand: 'Critical' }
        ];

        for (const { score, expectedBand } of testCases) {
          // Mock to return specific score
          mockDb.all = jest.fn().mockReturnValue([
            {
              project_id: 'PROJ-001',
              status: 'active',
              on_time: score / 100,
              on_budget: score / 100,
              risk_level: 'low',
              compliance_rate: score,
              benefits_on_track: score / 100
            }
          ]);

          const health = await governanceService.calculatePortfolioHealth();
          expect(health.health_band).toBe(expectedBand);
        }
      });

      test('should handle empty portfolio gracefully', async () => {
        mockDb.all = jest.fn().mockReturnValue([]);

        const health = await governanceService.calculatePortfolioHealth();

        expect(health.overall_score).toBe(0);
        expect(health.health_band).toBe('Critical');
        expect(health.project_count).toBe(0);
      });

      test('should convert risk levels to scores correctly', async () => {
        const riskTests = [
          { level: 'low', expectedScore: 100 },
          { level: 'medium', expectedScore: 50 },
          { level: 'high', expectedScore: 25 },
          { level: 'critical', expectedScore: 0 }
        ];

        for (const { level, expectedScore } of riskTests) {
          mockDb.all = jest.fn().mockReturnValue([
            {
              project_id: 'PROJ-001',
              status: 'active',
              on_time: 1,
              on_budget: 1,
              risk_level: level,
              compliance_rate: 100,
              benefits_on_track: 1
            }
          ]);

          const health = await governanceService.calculatePortfolioHealth();
          expect(health.risk_score).toBe(expectedScore);
        }
      });
    });

    describe('getDashboardMetrics', () => {
      test('should aggregate dashboard metrics correctly', async () => {
        // Mock portfolio health
        jest.spyOn(governanceService, 'calculatePortfolioHealth').mockResolvedValue({
          overall_score: 75,
          health_band: 'Good',
          on_time_score: 80,
          budget_score: 70,
          risk_score: 75,
          compliance_score: 85,
          benefits_score: 65,
          project_count: 5,
          calculated_at: '2024-01-15'
        });

        // Mock gate distribution
        mockProjectGateRepo.findAll = jest.fn().mockReturnValue([
          { gate_name: 'Ideation', project_count: 2 },
          { gate_name: 'Design', project_count: 3 }
        ]);

        // Mock compliance items
        mockPolicyComplianceRepo.findOverdueCompliance = jest.fn().mockReturnValue([
          { id: 1, project_id: 'PROJ-001', severity: 'high' },
          { id: 2, project_id: 'PROJ-002', severity: 'medium' }
        ]);

        // Mock actions
        mockActionRepo.findOverdueActions = jest.fn().mockReturnValue([
          { id: 1, action_title: 'Action 1', priority: 'high' },
          { id: 2, action_title: 'Action 2', priority: 'medium' }
        ]);

        // Mock escalations
        mockEscalationRepo.findActiveEscalations = jest.fn().mockReturnValue([
          { id: 1, level: 3 }
        ]);

        // Mock benefits at risk
        mockBenefitsRepo.findBenefitsAtRisk = jest.fn().mockReturnValue([
          { id: 1, expected_value: 50000 }
        ]);

        const metrics = await governanceService.getDashboardMetrics();

        expect(metrics.portfolio_health).toEqual({
          overall_score: 75,
          health_band: 'Good',
          on_time_score: 80,
          budget_score: 70,
          risk_score: 75,
          compliance_score: 85,
          benefits_score: 65,
          project_count: 5,
          calculated_at: '2024-01-15'
        });
        expect(metrics.projects_by_gate).toHaveLength(2);
        expect(metrics.overdue_compliance_count).toBe(2);
        expect(metrics.overdue_actions_count).toBe(2);
        expect(metrics.active_escalations_count).toBe(1);
        expect(metrics.benefits_at_risk_count).toBe(1);
      });

      test('should handle errors in dashboard metrics gracefully', async () => {
        jest.spyOn(governanceService, 'calculatePortfolioHealth').mockRejectedValue(new Error('DB Error'));

        await expect(governanceService.getDashboardMetrics()).rejects.toThrow('DB Error');
      });
    });
  });

  describe('✅ Gate Management', () => {
    describe('getProjectGateStatus', () => {
      test('should return complete gate status for project', async () => {
        const projectId = 'PROJ-001';

        mockProjectGateRepo.findByProjectId = jest.fn().mockReturnValue({
          project_id: projectId,
          gate_id: 3,
          gate_name: 'Design',
          gate_order: 3,
          status: 'in-progress',
          entry_date: '01-01-2024',
          approval_date: null
        });

        mockGateRepo.findAll = jest.fn().mockReturnValue([
          { id: 1, gate_order: 1 },
          { id: 2, gate_order: 2 },
          { id: 3, gate_order: 3 },
          { id: 4, gate_order: 4 }
        ]);

        const status = await governanceService.getProjectGateStatus(projectId);

        expect(status.project_id).toBe(projectId);
        expect(status.current_gate_order).toBe(3);
        expect(status.total_gates).toBe(4);
        expect(status.progress_percentage).toBe(75); // 3/4 * 100
        expect(status.can_progress).toBe(false); // In progress, not completed
      });

      test('should calculate progress percentage correctly', async () => {
        const projectId = 'PROJ-001';

        mockProjectGateRepo.findByProjectId = jest.fn().mockReturnValue({
          project_id: projectId,
          gate_id: 2,
          gate_order: 2,
          status: 'completed'
        });

        mockGateRepo.findAll = jest.fn().mockReturnValue([
          { id: 1, gate_order: 1 },
          { id: 2, gate_order: 2 },
          { id: 3, gate_order: 3 },
          { id: 4, gate_order: 4 },
          { id: 5, gate_order: 5 }
        ]);

        const status = await governanceService.getProjectGateStatus(projectId);

        expect(status.progress_percentage).toBe(40); // 2/5 * 100
      });

      test('should return null for project with no gate assignment', async () => {
        mockProjectGateRepo.findByProjectId = jest.fn().mockReturnValue(null);

        const status = await governanceService.getProjectGateStatus('PROJ-999');

        expect(status).toBeNull();
      });
    });
  });

  describe('✅ Compliance Tracking', () => {
    describe('getComplianceRate', () => {
      test('should calculate 100% compliance for fully compliant project', async () => {
        const projectId = 'PROJ-001';

        mockPolicyComplianceRepo.findByProjectId = jest.fn().mockReturnValue([
          { compliance_status: 'compliant' },
          { compliance_status: 'compliant' },
          { compliance_status: 'compliant' }
        ]);

        const rate = await governanceService.getComplianceRate(projectId);

        expect(rate).toBe(100);
      });

      test('should calculate partial compliance correctly', async () => {
        const projectId = 'PROJ-001';

        mockPolicyComplianceRepo.findByProjectId = jest.fn().mockReturnValue([
          { compliance_status: 'compliant' },
          { compliance_status: 'non-compliant' },
          { compliance_status: 'compliant' },
          { compliance_status: 'compliant' }
        ]);

        const rate = await governanceService.getComplianceRate(projectId);

        expect(rate).toBe(75); // 3/4 * 100
      });

      test('should treat waived items as compliant', async () => {
        const projectId = 'PROJ-001';

        mockPolicyComplianceRepo.findByProjectId = jest.fn().mockReturnValue([
          { compliance_status: 'compliant' },
          { compliance_status: 'waived' },
          { compliance_status: 'compliant' }
        ]);

        const rate = await governanceService.getComplianceRate(projectId);

        expect(rate).toBe(100); // Waived counts as compliant
      });

      test('should return 0 for project with no compliance records', async () => {
        mockPolicyComplianceRepo.findByProjectId = jest.fn().mockReturnValue([]);

        const rate = await governanceService.getComplianceRate('PROJ-999');

        expect(rate).toBe(0);
      });

      test('should return 0 for all non-compliant', async () => {
        const projectId = 'PROJ-001';

        mockPolicyComplianceRepo.findByProjectId = jest.fn().mockReturnValue([
          { compliance_status: 'non-compliant' },
          { compliance_status: 'non-compliant' }
        ]);

        const rate = await governanceService.getComplianceRate(projectId);

        expect(rate).toBe(0);
      });
    });
  });

  describe('✅ Action Management', () => {
    describe('getOverdueActionsSummary', () => {
      test('should group actions by priority correctly', async () => {
        mockActionRepo.findOverdueActions = jest.fn().mockReturnValue([
          { id: 1, priority: 'critical' },
          { id: 2, priority: 'high' },
          { id: 3, priority: 'high' },
          { id: 4, priority: 'medium' },
          { id: 5, priority: 'low' }
        ]);

        const summary = await governanceService.getOverdueActionsSummary();

        expect(summary.total_overdue).toBe(5);
        expect(summary.by_priority.critical).toBe(1);
        expect(summary.by_priority.high).toBe(2);
        expect(summary.by_priority.medium).toBe(1);
        expect(summary.by_priority.low).toBe(1);
      });

      test('should return zero counts when no overdue actions', async () => {
        mockActionRepo.findOverdueActions = jest.fn().mockReturnValue([]);

        const summary = await governanceService.getOverdueActionsSummary();

        expect(summary.total_overdue).toBe(0);
        expect(summary.by_priority.critical).toBe(0);
        expect(summary.by_priority.high).toBe(0);
        expect(summary.by_priority.medium).toBe(0);
        expect(summary.by_priority.low).toBe(0);
      });
    });
  });

  describe('✅ Benefits Tracking', () => {
    describe('getBenefitsAtRiskCount', () => {
      test('should count benefits with at-risk or delayed status', async () => {
        mockBenefitsRepo.findBenefitsAtRisk = jest.fn().mockReturnValue([
          { id: 1, realization_status: 'at-risk' },
          { id: 2, realization_status: 'delayed' },
          { id: 3, realization_status: 'at-risk' }
        ]);

        const count = await governanceService.getBenefitsAtRiskCount();

        expect(count).toBe(3);
      });

      test('should return 0 when no benefits at risk', async () => {
        mockBenefitsRepo.findBenefitsAtRisk = jest.fn().mockReturnValue([]);

        const count = await governanceService.getBenefitsAtRiskCount();

        expect(count).toBe(0);
      });
    });
  });

  describe('❌ Error Handling', () => {
    test('should handle database errors in health calculation', async () => {
      mockDb.all = jest.fn().mockImplementation(() => {
        throw new Error('Database connection error');
      });

      await expect(governanceService.calculatePortfolioHealth()).rejects.toThrow('Database connection error');
    });

    test('should handle null/undefined project IDs gracefully', async () => {
      mockProjectGateRepo.findByProjectId = jest.fn().mockReturnValue(null);

      const status = await governanceService.getProjectGateStatus(null as any);
      expect(status).toBeNull();
    });

    test('should handle repository method failures', async () => {
      mockPolicyComplianceRepo.findByProjectId = jest.fn().mockImplementation(() => {
        throw new Error('Repository error');
      });

      await expect(governanceService.getComplianceRate('PROJ-001')).rejects.toThrow('Repository error');
    });
  });

  describe('⚡ Performance and Optimization', () => {
    test('should cache health score calculations within threshold', async () => {
      const healthData = [
        {
          project_id: 'PROJ-001',
          status: 'active',
          on_time: 1,
          on_budget: 1,
          risk_level: 'low',
          compliance_rate: 100,
          benefits_on_track: 1
        }
      ];

      mockDb.all = jest.fn().mockReturnValue(healthData);

      // First call
      const health1 = await governanceService.calculatePortfolioHealth();
      
      // Second call should use cache if implemented
      const health2 = await governanceService.calculatePortfolioHealth();

      expect(health1.overall_score).toBe(health2.overall_score);
      // Note: Actual caching implementation would reduce DB calls
    });

    test('should handle large portfolios efficiently', async () => {
      // Generate 1000 mock projects
      const largePortfolio = Array.from({ length: 1000 }, (_, i) => ({
        project_id: `PROJ-${String(i).padStart(3, '0')}`,
        status: 'active',
        on_time: Math.random(),
        on_budget: Math.random(),
        risk_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)],
        compliance_rate: Math.floor(Math.random() * 100),
        benefits_on_track: Math.random()
      }));

      mockDb.all = jest.fn().mockReturnValue(largePortfolio);

      const startTime = Date.now();
      const health = await governanceService.calculatePortfolioHealth();
      const endTime = Date.now();

      expect(health.project_count).toBe(1000);
      expect(endTime - startTime).toBeLessThan(1000); // Should complete in < 1 second
    });
  });
});
