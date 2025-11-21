/**
 * StrategicAlignmentService - calculates strategic alignment scores
 */

import { DB } from '../../db';
import { StrategicInitiative, AlignmentScoreBreakdown } from '../../types/governance';
import { InitiativeRepository } from '../../repositories/governance-repositories';

export class StrategicAlignmentService {
  private initiativeRepo: InitiativeRepository;

  constructor(private db: DB) {
    this.initiativeRepo = new InitiativeRepository(db);
  }

  /**
   * Calculate strategic alignment score (0-100)
   * 40% direct linkage, 30% value contribution, 30% timeline alignment
   */
  async calculateAlignmentScore(projectId: string): Promise<AlignmentScoreBreakdown> {
    const project = this.db.prepare('SELECT * FROM projects WHERE id = ?').get(projectId) as any;
    if (!project) throw new Error(`Project ${projectId} not found`);

    const linkageScore = this.calculateLinkageScore(project);
    const valueScore = this.calculateValueContributionScore(project);
    const timelineScore = this.calculateTimelineAlignmentScore(project);

    const totalScore = Math.round(
      (linkageScore * 0.40) +
      (valueScore * 0.30) +
      (timelineScore * 0.30)
    );

    // Update project table
    this.db.prepare('UPDATE projects SET strategic_alignment_score = ? WHERE id = ?').run(totalScore, projectId);

    return {
      projectId,
      totalScore,
      linkageScore,
      valueScore,
      timelineScore,
      calculatedAt: new Date().toISOString()
    };
  }

  /**
   * Link project to strategic initiative
   */
  async linkProjectToInitiative(projectId: string, initiativeId: string): Promise<void> {
    const initiative = this.initiativeRepo.getById(initiativeId);
    if (!initiative) throw new Error(`Initiative ${initiativeId} not found`);

    this.db.prepare('UPDATE projects SET strategic_initiative_id = ? WHERE id = ?').run(initiativeId, projectId);
    
    // Recalculate alignment score
    await this.calculateAlignmentScore(projectId);
  }

  /**
   * Get projects by initiative
   */
  async getProjectsByInitiative(initiativeId: string): Promise<any[]> {
    return this.db.prepare('SELECT * FROM projects WHERE strategic_initiative_id = ?').all(initiativeId) as any[];
  }

  /**
   * Get portfolio alignment summary
   */
  async getPortfolioAlignmentSummary(): Promise<{
    averageScore: number;
    byInitiative: Record<string, { initiative: string; projectCount: number; avgScore: number }>;
    unaligned: number;
  }> {
    const projects = this.db.prepare('SELECT id, strategic_initiative_id, strategic_alignment_score FROM projects WHERE status NOT IN (?)').all('archived') as any[];

    const totalScore = projects.reduce((sum, p) => sum + (p.strategic_alignment_score || 0), 0);
    const averageScore = projects.length > 0 ? Math.round(totalScore / projects.length) : 0;

    const unaligned = projects.filter(p => !p.strategic_initiative_id).length;

    const byInitiative: Record<string, { initiative: string; projectCount: number; avgScore: number }> = {};
    const initiatives = this.initiativeRepo.getActive();

    for (const initiative of initiatives) {
      const linkedProjects = projects.filter(p => p.strategic_initiative_id === initiative.initiative_id);
      const avgScore = linkedProjects.length > 0
        ? Math.round(linkedProjects.reduce((sum, p) => sum + (p.strategic_alignment_score || 0), 0) / linkedProjects.length)
        : 0;

      byInitiative[initiative.initiative_id] = {
        initiative: initiative.initiative_name,
        projectCount: linkedProjects.length,
        avgScore
      };
    }

    return { averageScore, byInitiative, unaligned };
  }

  // ===== PRIVATE CALCULATION METHODS =====

  private calculateLinkageScore(project: any): number {
    // 100 points if directly linked to active strategic initiative
    if (project.strategic_initiative_id) {
      const initiative = this.initiativeRepo.getById(project.strategic_initiative_id);
      if (initiative && initiative.status === 'active') return 100;
      if (initiative && initiative.status === 'planning') return 75;
      return 50; // linked but initiative completed/cancelled
    }
    return 0; // no linkage
  }

  private calculateValueContributionScore(project: any): number {
    // Based on benefits realization and business value
    const benefits = this.db.prepare('SELECT * FROM project_benefits WHERE project_id = ?').all(project.id) as any[];
    
    if (benefits.length === 0) return 50; // no benefits tracked = average score

    const totalExpected = benefits.reduce((sum, b) => sum + (b.expected_value || 0), 0);
    const totalRealized = benefits.reduce((sum, b) => sum + (b.actual_value || 0), 0);

    // Score based on expected value magnitude and realization
    let score = 0;
    if (totalExpected > 1000000) score = 100; // high value
    else if (totalExpected > 500000) score = 80;
    else if (totalExpected > 100000) score = 60;
    else score = 40;

    // Adjust for realization
    if (totalRealized > 0) {
      const realizationRate = totalRealized / totalExpected;
      score = score * realizationRate;
    }

    return Math.round(score);
  }

  private calculateTimelineAlignmentScore(project: any): number {
    // Score based on how well project timeline aligns with strategic planning cycles
    if (!project.strategic_initiative_id) return 50; // neutral if unlinked

    const initiative = this.initiativeRepo.getById(project.strategic_initiative_id);
    if (!initiative) return 50;

    const projectStart = new Date(project.start_date_iso);
    const projectEnd = new Date(project.end_date_iso);
    const initiativeStart = new Date(initiative.start_date);
    const initiativeEnd = new Date(initiative.target_end_date);

    // Perfect alignment: project fully within initiative timeline
    if (projectStart >= initiativeStart && projectEnd <= initiativeEnd) return 100;

    // Partial overlap
    const overlapDays = this.calculateOverlapDays(projectStart, projectEnd, initiativeStart, initiativeEnd);
    const projectDuration = (projectEnd.getTime() - projectStart.getTime()) / (1000 * 60 * 60 * 24);
    
    if (projectDuration === 0) return 50;
    const overlapPercent = (overlapDays / projectDuration) * 100;
    
    return Math.round(Math.min(100, overlapPercent));
  }

  private calculateOverlapDays(start1: Date, end1: Date, start2: Date, end2: Date): number {
    const overlapStart = start1 > start2 ? start1 : start2;
    const overlapEnd = end1 < end2 ? end1 : end2;
    
    if (overlapStart > overlapEnd) return 0;
    
    return (overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24);
  }
}
