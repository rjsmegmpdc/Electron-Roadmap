/**
 * BenefitsService - calculates ROI, tracks benefits realization
 */

import { DB } from '../../db';
import { ProjectBenefit, ROICalculation, BenefitsVariance } from '../../types/governance';
import { BenefitsRepository } from '../../repositories/governance-repositories';
import { validateBenefitsDates } from '../../validation/governance-validation';

export class BenefitsService {
  private benefitsRepo: BenefitsRepository;

  constructor(private db: DB) {
    this.benefitsRepo = new BenefitsRepository(db);
  }

  /**
   * Calculate ROI for a project
   */
  async calculateProjectROI(projectId: string): Promise<ROICalculation> {
    const benefits = this.benefitsRepo.getByProject(projectId);
    
    const totalExpectedValue = benefits.reduce((sum, b) => sum + (b.expected_value || 0), 0);
    const totalActualValue = benefits.reduce((sum, b) => sum + (b.actual_value || 0), 0);

    // Get project costs (from projects table or financial module)
    const project = this.db.prepare('SELECT budget FROM projects WHERE id = ?').get(projectId) as { budget?: number } | undefined;
    const totalCost = project?.budget || 0;

    const roiPercent = totalCost > 0 ? ((totalExpectedValue - totalCost) / totalCost) * 100 : 0;
    const actualROI = totalCost > 0 ? ((totalActualValue - totalCost) / totalCost) * 100 : 0;

    // Calculate payback period (months)
    const paybackPeriod = totalExpectedValue > 0 ? (totalCost / (totalExpectedValue / 12)) : null;

    return {
      projectId,
      totalCost,
      totalExpectedValue,
      totalActualValue,
      expectedROIPercent: Math.round(roiPercent * 100) / 100,
      actualROIPercent: Math.round(actualROI * 100) / 100,
      paybackPeriodMonths: paybackPeriod ? Math.round(paybackPeriod * 10) / 10 : null,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Calculate benefits variance (expected vs actual)
   */
  async calculateBenefitsVariance(projectId: string): Promise<BenefitsVariance> {
    const benefits = this.benefitsRepo.getByProject(projectId);
    
    const varianceByType: Record<string, { expected: number; actual: number; variance: number }> = {};

    for (const benefit of benefits) {
      const type = benefit.benefit_type;
      if (!varianceByType[type]) {
        varianceByType[type] = { expected: 0, actual: 0, variance: 0 };
      }
      
      varianceByType[type].expected += benefit.expected_value || 0;
      varianceByType[type].actual += benefit.actual_value || 0;
    }

    // Calculate variance percentages
    for (const type in varianceByType) {
      const data = varianceByType[type];
      data.variance = data.expected > 0 ? ((data.actual - data.expected) / data.expected) * 100 : 0;
    }

    const totalExpected = benefits.reduce((sum, b) => sum + (b.expected_value || 0), 0);
    const totalActual = benefits.reduce((sum, b) => sum + (b.actual_value || 0), 0);
    const totalVariance = totalExpected > 0 ? ((totalActual - totalExpected) / totalExpected) * 100 : 0;

    return {
      projectId,
      byType: varianceByType,
      totalExpected,
      totalActual,
      totalVariancePercent: Math.round(totalVariance * 100) / 100,
      realizationRate: totalExpected > 0 ? Math.round((totalActual / totalExpected) * 10000) / 100 : 0
    };
  }

  /**
   * Update benefit realization
   */
  async updateBenefitRealization(
    benefitId: string,
    status: ProjectBenefit['realization_status'],
    actualValue?: number,
    actualDate?: string
  ): Promise<void> {
    const benefit = this.benefitsRepo.getById(benefitId);
    if (!benefit) throw new Error(`Benefit ${benefitId} not found`);

    const updates: Partial<ProjectBenefit> = { realization_status: status };
    if (actualValue !== undefined) updates.actual_value = actualValue;
    if (actualDate) {
      const validation = validateBenefitsDates(benefit.expected_realization_date || null, actualDate);
      if (!validation.valid) throw new Error(validation.message);
      updates.actual_realization_date = actualDate;
    }

    this.benefitsRepo.update(benefitId, updates);

    // Update project-level benefit_realization_status
    this.updateProjectBenefitStatus(benefit.project_id);
  }

  /**
   * Create a new benefit
   */
  async createBenefit(benefit: Omit<ProjectBenefit, 'benefit_id' | 'created_date'>): Promise<string> {
    const validation = validateBenefitsDates(benefit.expected_realization_date || null, benefit.actual_realization_date || null);
    if (!validation.valid) throw new Error(validation.message);

    return this.benefitsRepo.create(benefit);
  }

  /**
   * Get benefits summary for portfolio
   */
  async getPortfolioBenefitsSummary(): Promise<{
    totalExpected: number;
    totalRealized: number;
    atRiskCount: number;
    byType: Record<string, { expected: number; realized: number }>;
  }> {
    const allBenefits = this.db.prepare(`
      SELECT pb.*, p.governance_status
      FROM project_benefits pb
      JOIN projects p ON p.id = pb.project_id
      WHERE p.status NOT IN ('archived')
    `).all() as (ProjectBenefit & { governance_status: string })[];

    const totalExpected = allBenefits.reduce((sum, b) => sum + (b.expected_value || 0), 0);
    const totalRealized = allBenefits.filter(b => b.realization_status === 'full').reduce((sum, b) => sum + (b.actual_value || 0), 0);
    
    const atRiskCount = allBenefits.filter(b => 
      b.realization_status !== 'full' && ['at-risk', 'blocked', 'escalated'].includes(b.governance_status)
    ).length;

    const byType: Record<string, { expected: number; realized: number }> = {};
    for (const benefit of allBenefits) {
      const type = benefit.benefit_type;
      if (!byType[type]) byType[type] = { expected: 0, realized: 0 };
      byType[type].expected += benefit.expected_value || 0;
      if (benefit.realization_status === 'full') {
        byType[type].realized += benefit.actual_value || 0;
      }
    }

    return { totalExpected, totalRealized, atRiskCount, byType };
  }

  // ===== PRIVATE HELPERS =====

  private updateProjectBenefitStatus(projectId: string): void {
    const benefits = this.benefitsRepo.getByProject(projectId);
    if (benefits.length === 0) return;

    const allFull = benefits.every(b => b.realization_status === 'full');
    const anyFull = benefits.some(b => b.realization_status === 'full');
    const anyNone = benefits.some(b => b.realization_status === 'none');

    let status: 'not-yet' | 'partial' | 'full' | 'none' = 'not-yet';
    if (allFull) status = 'full';
    else if (anyFull || anyNone) status = 'partial';
    else if (benefits.every(b => b.realization_status === 'none')) status = 'none';

    this.db.prepare('UPDATE projects SET benefit_realization_status = ? WHERE id = ?').run(status, projectId);
  }
}
