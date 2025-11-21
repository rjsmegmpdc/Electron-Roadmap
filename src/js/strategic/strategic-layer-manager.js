/**
 * StrategicLayerManager - Main manager for Vision, Goal, and Initiative persistence
 * 
 * Extends the existing persistence model to handle strategic entities with
 * proper hierarchy relationships and NZ date format support.
 */

import Vision from './vision.js';
import Goal from './goal.js';
import Initiative from './initiative.js';
import { formatDateNZ, parseDateNZ } from '../utils/date-utils.js';

export default class StrategicLayerManager {
  constructor({ persistence, eventEmitter } = {}) {
    this.persistence = persistence;
    this.eventEmitter = eventEmitter;
    
    // In-memory stores
    this.visions = new Map();
    this.goals = new Map();
    this.initiatives = new Map();
    
    // Hierarchy indices for efficient lookups
    this.goalsByVision = new Map(); // vision_id -> Set of goal_ids
    this.initiativesByGoal = new Map(); // goal_id -> Set of initiative_ids
    
    // Initialize from persistence
    this._loadFromPersistence();
  }

  /**
   * Load strategic entities from persistence
   * @private
   */
  async _loadFromPersistence() {
    if (!this.persistence) {
      return;
    }

    try {
      const data = await this.persistence.load();
      
      // Load visions
      if (data.visions && Array.isArray(data.visions)) {
        data.visions.forEach(visionData => {
          try {
            const vision = Vision.fromJSON(visionData);
            this.visions.set(vision.id, vision);
          } catch (error) {
            console.warn(`Failed to load vision ${visionData.id}:`, error.message);
          }
        });
      }
      
      // Load goals
      if (data.goals && Array.isArray(data.goals)) {
        data.goals.forEach(goalData => {
          try {
            const goal = Goal.fromJSON(goalData);
            this.goals.set(goal.id, goal);
            this._addToHierarchy('goal', goal);
          } catch (error) {
            console.warn(`Failed to load goal ${goalData.id}:`, error.message);
          }
        });
      }
      
      // Load initiatives
      if (data.initiatives && Array.isArray(data.initiatives)) {
        data.initiatives.forEach(initiativeData => {
          try {
            const initiative = Initiative.fromJSON(initiativeData);
            this.initiatives.set(initiative.id, initiative);
            this._addToHierarchy('initiative', initiative);
          } catch (error) {
            console.warn(`Failed to load initiative ${initiativeData.id}:`, error.message);
          }
        });
      }
      
      this._emitEvent('strategic-layer-loaded', {
        visions: this.visions.size,
        goals: this.goals.size,
        initiatives: this.initiatives.size
      });
      
    } catch (error) {
      console.error('Failed to load strategic layer data:', error);
      throw new Error(`Strategic layer load failed: ${error.message}`);
    }
  }

  /**
   * Save strategic entities to persistence
   * @private
   */
  async _saveToPersistence() {
    if (!this.persistence) {
      return;
    }

    try {
      // Get existing data to preserve other entities
      const existingData = await this.persistence.load();
      
      // Update strategic arrays
      const updatedData = {
        ...existingData,
        visions: Array.from(this.visions.values()).map(v => v.toJSON()),
        goals: Array.from(this.goals.values()).map(g => g.toJSON()),
        initiatives: Array.from(this.initiatives.values()).map(i => i.toJSON())
      };
      
      await this.persistence.save(updatedData);
      
    } catch (error) {
      console.error('Failed to save strategic layer data:', error);
      throw new Error(`Strategic layer save failed: ${error.message}`);
    }
  }

  /**
   * Add entity to hierarchy indices
   * @private
   */
  _addToHierarchy(entityType, entity) {
    if (entityType === 'goal' && entity.vision_id) {
      if (!this.goalsByVision.has(entity.vision_id)) {
        this.goalsByVision.set(entity.vision_id, new Set());
      }
      this.goalsByVision.get(entity.vision_id).add(entity.id);
    }
    
    if (entityType === 'initiative' && entity.goal_id) {
      if (!this.initiativesByGoal.has(entity.goal_id)) {
        this.initiativesByGoal.set(entity.goal_id, new Set());
      }
      this.initiativesByGoal.get(entity.goal_id).add(entity.id);
    }
  }

  /**
   * Remove entity from hierarchy indices
   * @private
   */
  _removeFromHierarchy(entityType, entity) {
    if (entityType === 'goal' && entity.vision_id) {
      const goalSet = this.goalsByVision.get(entity.vision_id);
      if (goalSet) {
        goalSet.delete(entity.id);
        if (goalSet.size === 0) {
          this.goalsByVision.delete(entity.vision_id);
        }
      }
    }
    
    if (entityType === 'initiative' && entity.goal_id) {
      const initiativeSet = this.initiativesByGoal.get(entity.goal_id);
      if (initiativeSet) {
        initiativeSet.delete(entity.id);
        if (initiativeSet.size === 0) {
          this.initiativesByGoal.delete(entity.goal_id);
        }
      }
    }
  }

  /**
   * Emit event if event emitter available
   * @private
   */
  _emitEvent(eventName, data) {
    if (this.eventEmitter) {
      this.eventEmitter.emit(eventName, data);
    }
  }

  // =================
  // VISION METHODS
  // =================

  /**
   * Create a new vision
   * @param {Object} visionData - Vision data
   * @param {string} userId - User creating the vision
   * @returns {Promise<Vision>} Created vision
   */
  async createVision(visionData, userId = '') {
    const vision = new Vision({
      ...visionData,
      created_by: userId,
      updated_by: userId
    });

    this.visions.set(vision.id, vision);
    await this._saveToPersistence();
    
    this._emitEvent('vision-created', { vision: vision.getSummary(), userId });
    
    return vision;
  }

  /**
   * Get vision by ID
   * @param {string} visionId - Vision ID
   * @returns {Vision|null} Vision or null if not found
   */
  getVision(visionId) {
    return this.visions.get(visionId) || null;
  }

  /**
   * Get all visions
   * @param {Object} filters - Filter options
   * @returns {Array<Vision>} Array of visions
   */
  getVisions(filters = {}) {
    let visions = Array.from(this.visions.values());

    // Apply filters
    if (filters.status) {
      visions = visions.filter(v => v.status === filters.status);
    }
    
    if (filters.owner) {
      visions = visions.filter(v => v.owner === filters.owner);
    }
    
    if (filters.strategic_priority) {
      visions = visions.filter(v => v.strategic_priority === filters.strategic_priority);
    }

    // Sort by creation date (newest first) by default
    visions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return visions;
  }

  /**
   * Update vision
   * @param {string} visionId - Vision ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User making the update
   * @returns {Promise<Vision>} Updated vision
   */
  async updateVision(visionId, updates, userId = '') {
    const vision = this.visions.get(visionId);
    if (!vision) {
      throw new Error(`Vision ${visionId} not found`);
    }

    vision.update(updates, userId);
    await this._saveToPersistence();
    
    this._emitEvent('vision-updated', { vision: vision.getSummary(), userId });
    
    return vision;
  }

  /**
   * Delete vision (and cascade to goals/initiatives)
   * @param {string} visionId - Vision ID
   * @param {string} userId - User deleting the vision
   * @returns {Promise<Object>} Deletion summary
   */
  async deleteVision(visionId, userId = '') {
    const vision = this.visions.get(visionId);
    if (!vision) {
      throw new Error(`Vision ${visionId} not found`);
    }

    // Get cascading deletions
    const relatedGoals = this.getGoalsByVision(visionId);
    const relatedInitiatives = [];
    
    relatedGoals.forEach(goal => {
      const initiatives = this.getInitiativesByGoal(goal.id);
      relatedInitiatives.push(...initiatives);
    });

    // Delete in reverse hierarchy order
    for (const initiative of relatedInitiatives) {
      await this.deleteInitiative(initiative.id, userId);
    }
    
    for (const goal of relatedGoals) {
      await this.deleteGoal(goal.id, userId);
    }

    // Delete the vision
    this.visions.delete(visionId);
    await this._saveToPersistence();
    
    this._emitEvent('vision-deleted', { 
      visionId, 
      cascadeDeleted: {
        goals: relatedGoals.length,
        initiatives: relatedInitiatives.length
      },
      userId 
    });

    return {
      deleted: true,
      cascadeDeleted: {
        goals: relatedGoals.length,
        initiatives: relatedInitiatives.length
      }
    };
  }

  // =================
  // GOAL METHODS
  // =================

  /**
   * Create a new goal
   * @param {Object} goalData - Goal data
   * @param {string} userId - User creating the goal
   * @returns {Promise<Goal>} Created goal
   */
  async createGoal(goalData, userId = '') {
    // Validate vision exists
    if (goalData.vision_id && !this.visions.has(goalData.vision_id)) {
      throw new Error(`Vision ${goalData.vision_id} not found`);
    }

    const goal = new Goal({
      ...goalData,
      created_by: userId,
      updated_by: userId
    });

    this.goals.set(goal.id, goal);
    this._addToHierarchy('goal', goal);
    await this._saveToPersistence();
    
    this._emitEvent('goal-created', { goal: goal.getSummary(), userId });
    
    return goal;
  }

  /**
   * Get goal by ID
   * @param {string} goalId - Goal ID
   * @returns {Goal|null} Goal or null if not found
   */
  getGoal(goalId) {
    return this.goals.get(goalId) || null;
  }

  /**
   * Get all goals
   * @param {Object} filters - Filter options
   * @returns {Array<Goal>} Array of goals
   */
  getGoals(filters = {}) {
    let goals = Array.from(this.goals.values());

    // Apply filters
    if (filters.vision_id) {
      goals = goals.filter(g => g.vision_id === filters.vision_id);
    }
    
    if (filters.status) {
      goals = goals.filter(g => g.status === filters.status);
    }
    
    if (filters.owner) {
      goals = goals.filter(g => g.owner === filters.owner);
    }
    
    if (filters.category) {
      goals = goals.filter(g => g.category === filters.category);
    }
    
    if (filters.priority) {
      goals = goals.filter(g => g.priority === filters.priority);
    }

    // Sort by creation date (newest first) by default
    goals.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return goals;
  }

  /**
   * Get goals by vision
   * @param {string} visionId - Vision ID
   * @returns {Array<Goal>} Array of goals for the vision
   */
  getGoalsByVision(visionId) {
    const goalIds = this.goalsByVision.get(visionId) || new Set();
    return Array.from(goalIds).map(id => this.goals.get(id)).filter(Boolean);
  }

  /**
   * Update goal
   * @param {string} goalId - Goal ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User making the update
   * @returns {Promise<Goal>} Updated goal
   */
  async updateGoal(goalId, updates, userId = '') {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    // If vision_id is changing, validate new vision exists
    if (updates.vision_id && updates.vision_id !== goal.vision_id) {
      if (!this.visions.has(updates.vision_id)) {
        throw new Error(`Vision ${updates.vision_id} not found`);
      }
      
      // Update hierarchy
      this._removeFromHierarchy('goal', goal);
      goal.update(updates, userId);
      this._addToHierarchy('goal', goal);
    } else {
      goal.update(updates, userId);
    }

    await this._saveToPersistence();
    
    this._emitEvent('goal-updated', { goal: goal.getSummary(), userId });
    
    return goal;
  }

  /**
   * Delete goal (and cascade to initiatives)
   * @param {string} goalId - Goal ID
   * @param {string} userId - User deleting the goal
   * @returns {Promise<Object>} Deletion summary
   */
  async deleteGoal(goalId, userId = '') {
    const goal = this.goals.get(goalId);
    if (!goal) {
      throw new Error(`Goal ${goalId} not found`);
    }

    // Get cascading deletions
    const relatedInitiatives = this.getInitiativesByGoal(goalId);
    
    // Delete related initiatives
    for (const initiative of relatedInitiatives) {
      await this.deleteInitiative(initiative.id, userId);
    }

    // Delete the goal
    this._removeFromHierarchy('goal', goal);
    this.goals.delete(goalId);
    await this._saveToPersistence();
    
    this._emitEvent('goal-deleted', { 
      goalId, 
      cascadeDeleted: { initiatives: relatedInitiatives.length },
      userId 
    });

    return {
      deleted: true,
      cascadeDeleted: { initiatives: relatedInitiatives.length }
    };
  }

  // =================
  // INITIATIVE METHODS
  // =================

  /**
   * Create a new initiative
   * @param {Object} initiativeData - Initiative data
   * @param {string} userId - User creating the initiative
   * @returns {Promise<Initiative>} Created initiative
   */
  async createInitiative(initiativeData, userId = '') {
    // Validate goal exists
    if (initiativeData.goal_id && !this.goals.has(initiativeData.goal_id)) {
      throw new Error(`Goal ${initiativeData.goal_id} not found`);
    }

    const initiative = new Initiative({
      ...initiativeData,
      created_by: userId,
      updated_by: userId
    });

    this.initiatives.set(initiative.id, initiative);
    this._addToHierarchy('initiative', initiative);
    await this._saveToPersistence();
    
    this._emitEvent('initiative-created', { initiative: initiative.getSummary(), userId });
    
    return initiative;
  }

  /**
   * Get initiative by ID
   * @param {string} initiativeId - Initiative ID
   * @returns {Initiative|null} Initiative or null if not found
   */
  getInitiative(initiativeId) {
    return this.initiatives.get(initiativeId) || null;
  }

  /**
   * Get all initiatives
   * @param {Object} filters - Filter options
   * @returns {Array<Initiative>} Array of initiatives
   */
  getInitiatives(filters = {}) {
    let initiatives = Array.from(this.initiatives.values());

    // Apply filters
    if (filters.goal_id) {
      initiatives = initiatives.filter(i => i.goal_id === filters.goal_id);
    }
    
    if (filters.status) {
      initiatives = initiatives.filter(i => i.status === filters.status);
    }
    
    if (filters.owner) {
      initiatives = initiatives.filter(i => i.owner === filters.owner);
    }
    
    if (filters.category) {
      initiatives = initiatives.filter(i => i.category === filters.category);
    }
    
    if (filters.priority) {
      initiatives = initiatives.filter(i => i.priority === filters.priority);
    }
    
    if (filters.github_sync !== undefined) {
      initiatives = initiatives.filter(i => i.github_sync === filters.github_sync);
    }
    
    if (filters.ado_sync !== undefined) {
      initiatives = initiatives.filter(i => i.ado_sync === filters.ado_sync);
    }

    // Sort by creation date (newest first) by default
    initiatives.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    return initiatives;
  }

  /**
   * Get initiatives by goal
   * @param {string} goalId - Goal ID
   * @returns {Array<Initiative>} Array of initiatives for the goal
   */
  getInitiativesByGoal(goalId) {
    const initiativeIds = this.initiativesByGoal.get(goalId) || new Set();
    return Array.from(initiativeIds).map(id => this.initiatives.get(id)).filter(Boolean);
  }

  /**
   * Get initiatives enabled for GitHub sync
   * @returns {Array<Initiative>} Array of GitHub-enabled initiatives
   */
  getGitHubSyncEnabledInitiatives() {
    return Array.from(this.initiatives.values()).filter(i => i.github_sync);
  }

  /**
   * Get initiatives enabled for ADO sync
   * @returns {Array<Initiative>} Array of ADO-enabled initiatives
   */
  getADOSyncEnabledInitiatives() {
    return Array.from(this.initiatives.values()).filter(i => i.ado_sync);
  }

  /**
   * Update initiative
   * @param {string} initiativeId - Initiative ID
   * @param {Object} updates - Updates to apply
   * @param {string} userId - User making the update
   * @returns {Promise<Initiative>} Updated initiative
   */
  async updateInitiative(initiativeId, updates, userId = '') {
    const initiative = this.initiatives.get(initiativeId);
    if (!initiative) {
      throw new Error(`Initiative ${initiativeId} not found`);
    }

    // If goal_id is changing, validate new goal exists
    if (updates.goal_id && updates.goal_id !== initiative.goal_id) {
      if (!this.goals.has(updates.goal_id)) {
        throw new Error(`Goal ${updates.goal_id} not found`);
      }
      
      // Update hierarchy
      this._removeFromHierarchy('initiative', initiative);
      initiative.update(updates, userId);
      this._addToHierarchy('initiative', initiative);
    } else {
      initiative.update(updates, userId);
    }

    await this._saveToPersistence();
    
    this._emitEvent('initiative-updated', { initiative: initiative.getSummary(), userId });
    
    return initiative;
  }

  /**
   * Delete initiative
   * @param {string} initiativeId - Initiative ID
   * @param {string} userId - User deleting the initiative
   * @returns {Promise<Object>} Deletion summary
   */
  async deleteInitiative(initiativeId, userId = '') {
    const initiative = this.initiatives.get(initiativeId);
    if (!initiative) {
      throw new Error(`Initiative ${initiativeId} not found`);
    }

    // Remove from hierarchy
    this._removeFromHierarchy('initiative', initiative);
    this.initiatives.delete(initiativeId);
    await this._saveToPersistence();
    
    this._emitEvent('initiative-deleted', { initiativeId, userId });

    return { deleted: true };
  }

  // =================
  // HIERARCHY & ANALYTICS
  // =================

  /**
   * Get full hierarchy starting from a vision
   * @param {string} visionId - Vision ID
   * @returns {Object} Complete hierarchy tree
   */
  getHierarchy(visionId) {
    const vision = this.visions.get(visionId);
    if (!vision) {
      return null;
    }

    const goals = this.getGoalsByVision(visionId).map(goal => {
      const initiatives = this.getInitiativesByGoal(goal.id).map(initiative => ({
        ...initiative.getSummary(),
        health: initiative.getHealthStatus()
      }));
      
      return {
        ...goal.getSummary(),
        health: goal.getHealthStatus(),
        initiatives
      };
    });

    return {
      ...vision.getSummary(),
      health: vision.getHealthStatus(),
      goals
    };
  }

  /**
   * Get strategic dashboard data
   * @returns {Object} Dashboard statistics and health
   */
  getDashboardData() {
    const visions = Array.from(this.visions.values());
    const goals = Array.from(this.goals.values());
    const initiatives = Array.from(this.initiatives.values());

    // Calculate health distribution
    const getHealthDistribution = (entities) => {
      const distribution = { green: 0, amber: 0, red: 0 };
      entities.forEach(entity => {
        const health = entity.getHealthStatus().status;
        distribution[health] = (distribution[health] || 0) + 1;
      });
      return distribution;
    };

    return {
      summary: {
        visions: visions.length,
        goals: goals.length,
        initiatives: initiatives.length,
        syncEnabled: {
          github: initiatives.filter(i => i.github_sync).length,
          ado: initiatives.filter(i => i.ado_sync).length
        }
      },
      health: {
        visions: getHealthDistribution(visions),
        goals: getHealthDistribution(goals),
        initiatives: getHealthDistribution(initiatives)
      },
      progress: {
        visions: visions.reduce((sum, v) => sum + v.getProgress(), 0) / Math.max(visions.length, 1),
        goals: goals.reduce((sum, g) => sum + g.getProgress(), 0) / Math.max(goals.length, 1),
        initiatives: initiatives.reduce((sum, i) => sum + i.getProgress(), 0) / Math.max(initiatives.length, 1)
      },
      recentActivity: {
        createdThisWeek: this._getRecentlyCreated(7),
        updatedThisWeek: this._getRecentlyUpdated(7)
      }
    };
  }

  /**
   * Get recently created entities
   * @private
   */
  _getRecentlyCreated(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const allEntities = [
      ...Array.from(this.visions.values()).map(v => ({ type: 'vision', entity: v })),
      ...Array.from(this.goals.values()).map(g => ({ type: 'goal', entity: g })),
      ...Array.from(this.initiatives.values()).map(i => ({ type: 'initiative', entity: i }))
    ];

    return allEntities.filter(item => new Date(item.entity.created_at) >= cutoff);
  }

  /**
   * Get recently updated entities
   * @private
   */
  _getRecentlyUpdated(days) {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    const allEntities = [
      ...Array.from(this.visions.values()).map(v => ({ type: 'vision', entity: v })),
      ...Array.from(this.goals.values()).map(g => ({ type: 'goal', entity: g })),
      ...Array.from(this.initiatives.values()).map(i => ({ type: 'initiative', entity: i }))
    ];

    return allEntities.filter(item => new Date(item.entity.updated_at) >= cutoff);
  }

  /**
   * Export all strategic data to JSON
   * @returns {Object} Complete strategic data export
   */
  exportData() {
    return {
      exported_at: new Date().toISOString(),
      version: '1.0',
      data: {
        visions: Array.from(this.visions.values()).map(v => v.toJSON()),
        goals: Array.from(this.goals.values()).map(g => g.toJSON()),
        initiatives: Array.from(this.initiatives.values()).map(i => i.toJSON())
      },
      summary: this.getDashboardData()
    };
  }
}