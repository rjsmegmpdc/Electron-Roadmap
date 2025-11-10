/**
 * DecisionLogService - records decisions and tracks associated actions
 */

import { DB } from '../../db';
import { GovernanceDecision, GovernanceAction, ActionDependency } from '../../types/governance';
import { DecisionRepository, ActionRepository } from '../../repositories/governance-repositories';
import { validateActionDates } from '../../validation/governance-validation';

export class DecisionLogService {
  private decisionRepo: DecisionRepository;
  private actionRepo: ActionRepository;

  constructor(private db: DB) {
    this.decisionRepo = new DecisionRepository(db);
    this.actionRepo = new ActionRepository(db);
  }

  /**
   * Record a new governance decision with optional actions
   */
  async recordDecision(
    decision: Omit<GovernanceDecision, 'decision_id' | 'decision_date'>,
    actions?: Array<Omit<GovernanceAction, 'action_id' | 'created_date'>>
  ): Promise<string> {
    const decisionId = await this.db.transaction(() => {
      const decId = this.decisionRepo.create(decision);
      
      if (actions && actions.length > 0) {
        for (const action of actions) {
          this.createAction({ ...action, decision_id: decId });
        }
      }

      return decId;
    })();

    return decisionId;
  }

  /**
   * Create an action (potentially with dependencies)
   */
  createAction(action: Omit<GovernanceAction, 'action_id' | 'created_date'>): string {
    const validation = validateActionDates(action.due_date || null, action.completed_date || null);
    if (!validation.valid) throw new Error(validation.message);

    return this.actionRepo.create(action);
  }

  /**
   * Update action status
   */
  async updateActionStatus(actionId: string, status: GovernanceAction['action_status'], completedBy?: string): Promise<void> {
    const action = this.actionRepo.getById(actionId);
    if (!action) throw new Error(`Action ${actionId} not found`);

    const updates: Partial<GovernanceAction> = { action_status: status };
    
    if (status === 'completed' || status === 'cancelled') {
      updates.completed_date = new Date().toISOString();
      if (completedBy) {
        this.db.prepare('UPDATE governance_actions SET completed_by = ? WHERE action_id = ?').run(completedBy, actionId);
      }
    }

    this.actionRepo.update(actionId, updates);

    // Check if all dependencies are met for blocked actions
    if (status === 'completed') {
      this.checkDependentActions(actionId);
    }
  }

  /**
   * Add action dependency
   */
  async addActionDependency(actionId: string, dependsOnActionId: string): Promise<void> {
    // Validate no circular dependencies
    if (this.hasCircularDependency(actionId, dependsOnActionId)) {
      throw new Error('Circular dependency detected');
    }

    this.db.prepare(
      'INSERT INTO action_dependencies (action_id, depends_on_action_id) VALUES (?, ?)'
    ).run(actionId, dependsOnActionId);

    // Update action to blocked if dependency not complete
    const dependency = this.actionRepo.getById(dependsOnActionId);
    if (dependency && dependency.action_status !== 'completed') {
      this.actionRepo.update(actionId, { action_status: 'blocked' });
    }
  }

  /**
   * Get actions by project with full details
   */
  async getProjectActions(projectId: string): Promise<GovernanceAction[]> {
    return this.actionRepo.getByProject(projectId);
  }

  /**
   * Get overdue actions
   */
  async getOverdueActions(): Promise<GovernanceAction[]> {
    const now = new Date().toISOString();
    return this.db.prepare(`
      SELECT * FROM governance_actions
      WHERE action_status IN ('pending', 'in-progress', 'blocked')
      AND due_date IS NOT NULL
      AND due_date < ?
      ORDER BY due_date ASC
    `).all(now) as GovernanceAction[];
  }

  // ===== PRIVATE HELPERS =====

  private checkDependentActions(completedActionId: string): void {
    const dependents = this.db.prepare(`
      SELECT DISTINCT action_id FROM action_dependencies WHERE depends_on_action_id = ?
    `).all(completedActionId) as { action_id: string }[];

    for (const dep of dependents) {
      // Check if all dependencies are now complete
      const allDeps = this.db.prepare(`
        SELECT da.action_id, ga.action_status
        FROM action_dependencies ad
        JOIN governance_actions ga ON ga.action_id = ad.depends_on_action_id
        WHERE ad.action_id = ?
      `).all(dep.action_id) as { action_id: string; action_status: string }[];

      const allComplete = allDeps.every(d => d.action_status === 'completed');
      if (allComplete) {
        this.actionRepo.update(dep.action_id, { action_status: 'pending' });
      }
    }
  }

  private hasCircularDependency(actionId: string, dependsOnActionId: string): boolean {
    // BFS to detect cycle
    const visited = new Set<string>();
    const queue = [dependsOnActionId];

    while (queue.length > 0) {
      const current = queue.shift()!;
      if (current === actionId) return true;
      if (visited.has(current)) continue;
      visited.add(current);

      const deps = this.db.prepare(
        'SELECT depends_on_action_id FROM action_dependencies WHERE action_id = ?'
      ).all(current) as { depends_on_action_id: string }[];

      queue.push(...deps.map(d => d.depends_on_action_id));
    }

    return false;
  }
}
