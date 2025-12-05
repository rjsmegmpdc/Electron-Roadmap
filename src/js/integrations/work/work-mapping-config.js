/**
 * WorkMappingConfig - Maps Roadmap Tool data to GitHub Issues format
 * 
 * Handles mapping between RT project/task data and GitHub issue structures,
 * including status, priority, and label mappings as defined in sub-PRD.
 */

export default class WorkMappingConfig {
  constructor() {
    this.defaultMappings = this._getDefaultMappings();
  }

  /**
   * Get default status, priority, and label mappings
   * @returns {Object} Default mappings configuration
   */
  getDefaultMappings() {
    return JSON.parse(JSON.stringify(this.defaultMappings)); // Deep copy
  }

  /**
   * Map RT Project to GitHub Issue payload
   * @param {Object} project - RT Project object
   * @param {Object} options - Additional mapping options
   * @returns {Object} GitHub Issue payload fields
   */
  mapProjectToIssue(project, options = {}) {
    const workItemType = options.workItemType || 'epic';
    
    // Generate labels for the project
    const labels = [];
    
    // Add type label
    labels.push(`type:${workItemType}`);
    
    // Add status labels based on project status
    const statusLabels = this.mapStatusRTtoGH(project.status, 'project');
    labels.push(...statusLabels);
    
    // Add priority if specified
    if (project.priority || options.priority) {
      const priorityLabel = this.mapPriorityRTtoGH(project.priority || options.priority);
      if (priorityLabel) {
        labels.push(priorityLabel);
      }
    }

    // Add financial treatment as label
    if (project.financial_treatment) {
      labels.push(`financial:${project.financial_treatment.toLowerCase()}`);
    }

    // Add initiative label if project is linked to initiative
    if (project.initiative_id || options.initiativeId) {
      const initiativeId = project.initiative_id || options.initiativeId;
      labels.push(`initiative:${initiativeId}`);
    }
    
    // Add initiative label based on title/slug if configured
    if (options.initiativeLabel) {
      labels.push(`initiative:${options.initiativeLabel}`);
    }

    // Add default labels for this work item type
    const defaultLabels = this.defaultMappings.defaults.labels[workItemType] || [];
    labels.push(...defaultLabels);

    // Remove duplicates
    const uniqueLabels = [...new Set(labels)];

    // Generate assignees
    const assignees = options.assignees || 
                     this.defaultMappings.defaults.assignees[workItemType] || 
                     [];

    // Build the base payload
    const payload = {
      title: options.title || `[${workItemType.charAt(0).toUpperCase() + workItemType.slice(1)}] ${project.title}`,
      body: options.body || this._generateProjectBody(project, workItemType),
      labels: uniqueLabels,
      assignees: Array.isArray(assignees) ? assignees : [assignees].filter(Boolean)
    };

    // Add milestone if strategy is configured
    if (this.defaultMappings.defaults.milestoneStrategy !== 'none' && options.milestone) {
      payload.milestone = options.milestone;
    }

    return payload;
  }

  /**
   * Map RT Task to GitHub Issue payload
   * @param {Object} task - RT Task object
   * @param {Object} project - RT Project object (parent)
   * @param {Object} options - Additional mapping options
   * @returns {Object} GitHub Issue payload fields
   */
  mapTaskToIssue(task, project, options = {}) {
    const workItemType = options.workItemType || 'userstory';
    
    // Generate labels for the task
    const labels = [];
    
    // Add type label
    labels.push(`type:${workItemType === 'userstory' ? 'story' : workItemType}`);
    
    // Add status labels based on task status
    const statusLabels = this.mapStatusRTtoGH(task.status, 'task');
    labels.push(...statusLabels);
    
    // Add priority
    if (task.priority || options.priority) {
      const priorityLabel = this.mapPriorityRTtoGH(task.priority || options.priority);
      if (priorityLabel) {
        labels.push(priorityLabel);
      }
    }

    // Add effort size labels based on hours
    if (task.effort_hours) {
      const sizeLabel = this._mapEffortToSize(task.effort_hours);
      if (sizeLabel) {
        labels.push(sizeLabel);
      }
    }

    // Add parent project context
    if (project) {
      labels.push(`project:${project.id}`);
      
      // Inherit some project characteristics
      if (project.financial_treatment) {
        labels.push(`financial:${project.financial_treatment.toLowerCase()}`);
      }
      
      // Inherit initiative context from parent project
      if (project.initiative_id) {
        labels.push(`initiative:${project.initiative_id}`);
      }
    }
    
    // Add direct initiative label if task is linked
    if (task.initiative_id || options.initiativeId) {
      const initiativeId = task.initiative_id || options.initiativeId;
      labels.push(`initiative:${initiativeId}`);
    }

    // Add default labels for this work item type
    const defaultLabels = this.defaultMappings.defaults.labels[workItemType] || [];
    labels.push(...defaultLabels);

    // Remove duplicates
    const uniqueLabels = [...new Set(labels)];

    // Generate assignees - prefer task assignees, fall back to project or defaults
    let assignees = options.assignees;
    if (!assignees && task.assigned_resources && task.assigned_resources.length > 0) {
      // Map resource names to GitHub usernames (would need lookup table in real implementation)
      assignees = task.assigned_resources.map(resourceId => `resource-${resourceId}`);
    }
    if (!assignees) {
      assignees = this.defaultMappings.defaults.assignees[workItemType] || [];
    }

    // Build the payload
    const payload = {
      title: options.title || `[${workItemType === 'userstory' ? 'Story' : 'Task'}] ${task.title}`,
      body: options.body || this._generateTaskBody(task, project, workItemType),
      labels: uniqueLabels,
      assignees: Array.isArray(assignees) ? assignees : [assignees].filter(Boolean)
    };

    // Add milestone based on project timeline
    if (this.defaultMappings.defaults.milestoneStrategy !== 'none' && project) {
      payload.milestone = this._generateMilestone(project, task);
    }

    return payload;
  }

  /**
   * Map RT status to GitHub labels
   * @param {string} status - RT status value
   * @param {string} entityType - 'project' or 'task'
   * @returns {Array} Array of GitHub label strings
   */
  mapStatusRTtoGH(status, entityType = 'project') {
    if (!status) return [];

    const mappingKey = entityType === 'project' ? 'statusProject' : 'statusTask';
    const statusMapping = this.defaultMappings[mappingKey];
    
    return statusMapping[status] || [`status:${status}`];
  }

  /**
   * Map RT priority to GitHub priority label
   * @param {string} priority - RT priority value (P1, P2, P3, P4)
   * @returns {string|null} GitHub priority label or null
   */
  mapPriorityRTtoGH(priority) {
    if (!priority) return null;

    // Handle both direct priority values and priority labels
    if (priority.startsWith('priority:')) {
      return priority; // Already in correct format
    }

    // Map direct priority values
    const priorityMapping = this.defaultMappings.priority;
    return priorityMapping[priority] || `priority:${priority}`;
  }

  /**
   * Map GitHub labels back to RT status
   * @param {Array} labels - Array of GitHub label objects or strings
   * @param {string} entityType - 'project' or 'task'
   * @returns {string|null} RT status value or null
   */
  mapStatusGHtoRT(labels, entityType = 'project') {
    if (!labels || !Array.isArray(labels)) return null;

    // Extract label names
    const labelNames = labels.map(label => 
      typeof label === 'string' ? label : label.name
    );

    // Find status labels
    const statusLabels = labelNames.filter(name => name.startsWith('status:'));
    if (statusLabels.length === 0) return null;

    const statusLabel = statusLabels[0]; // Take first status label
    const mappingKey = entityType === 'project' ? 'statusProject' : 'statusTask';
    const statusMapping = this.defaultMappings[mappingKey];

    // Reverse lookup in mapping
    for (const [rtStatus, ghLabels] of Object.entries(statusMapping)) {
      if (ghLabels.includes(statusLabel)) {
        return rtStatus;
      }
    }

    // Fallback: extract from label
    return statusLabel.replace('status:', '');
  }

  /**
   * Map GitHub priority label back to RT priority
   * @param {Array} labels - Array of GitHub label objects or strings
   * @returns {string|null} RT priority value or null
   */
  mapPriorityGHtoRT(labels) {
    if (!labels || !Array.isArray(labels)) return null;

    // Extract label names
    const labelNames = labels.map(label => 
      typeof label === 'string' ? label : label.name
    );

    // Find priority labels
    const priorityLabels = labelNames.filter(name => name.startsWith('priority:'));
    if (priorityLabels.length === 0) return null;

    const priorityLabel = priorityLabels[0]; // Take first priority label
    
    // Extract priority value from label
    return priorityLabel.replace('priority:', '');
  }

  /**
   * Extract initiative ID from GitHub labels
   * @param {Array} labels - Array of GitHub label objects or strings
   * @returns {string|null} Initiative ID or null
   */
  extractInitiativeId(labels) {
    if (!labels || !Array.isArray(labels)) return null;

    // Extract label names
    const labelNames = labels.map(label => 
      typeof label === 'string' ? label : label.name
    );

    // Find initiative labels
    const initiativeLabels = labelNames.filter(name => name.startsWith('initiative:'));
    if (initiativeLabels.length === 0) return null;

    const initiativeLabel = initiativeLabels[0]; // Take first initiative label
    
    // Extract initiative ID from label
    return initiativeLabel.replace('initiative:', '');
  }

  /**
   * Get RT IDs from GitHub issue frontmatter or body
   * @param {string} body - GitHub issue body content
   * @returns {Object} RT IDs extracted from frontmatter
   */
  extractRTIds(body) {
    const ids = {};

    // Parse frontmatter if present
    const frontmatterMatch = body.match(/^---\n(.*?)\n---/s);
    if (frontmatterMatch) {
      const frontmatter = frontmatterMatch[1];
      
      // Extract RT project ID
      const projectIdMatch = frontmatter.match(/rt_project_id:\s*([^\n]+)/);
      if (projectIdMatch) {
        ids.rt_project_id = projectIdMatch[1].trim();
      }

      // Extract RT task ID
      const taskIdMatch = frontmatter.match(/rt_task_id:\s*([^\n]+)/);
      if (taskIdMatch) {
        ids.rt_task_id = taskIdMatch[1].trim();
      }
      
      // Extract RT initiative ID
      const initiativeIdMatch = frontmatter.match(/rt_initiative_id:\s*([^\n]+)/);
      if (initiativeIdMatch) {
        ids.rt_initiative_id = initiativeIdMatch[1].trim();
      }
    }

    return ids;
  }

  /**
   * Generate default mappings configuration
   * @private
   */
  _getDefaultMappings() {
    return {
      statusProject: {
        'concept-design': ['status:concept'],
        'solution-design': ['status:design'],
        'engineering': ['status:eng'],
        'uat': ['status:uat'],
        'release': ['status:release']
      },
      statusTask: {
        'planned': ['status:planned'],
        'in-progress': ['status:in-progress'],
        'blocked': ['status:blocked'],
        'completed': ['status:completed'],
        'on-hold': ['status:on-hold']
      },
      priority: {
        'P1': 'priority:P1',
        'P2': 'priority:P2',
        'P3': 'priority:P3',
        'P4': 'priority:P4'
      },
      defaults: {
        assignees: {
          epic: ['example-user'],
          feature: ['example-user'],
          userstory: [],
          task: [],
          issue: []
        },
        labels: {
          epic: ['type:epic'],
          feature: ['type:feature'],
          userstory: ['type:story'],
          task: ['type:task'],
          issue: ['type:issue']
        },
        milestoneStrategy: 'none' // 'none', 'project-timeline', 'sprint-based'
      }
    };
  }

  /**
   * Generate basic body content for project-based work items
   * @private
   */
  _generateProjectBody(project, workItemType) {
    const sections = [];

    if (workItemType === 'epic') {
      sections.push('## Problem');
      sections.push(project.description || 'Project description here.');
      sections.push('');
      sections.push('## Outcome');
      sections.push('- Define clear measurable outcome.');
      sections.push('');
      sections.push('## Scope');
      sections.push('- In: ...');
      sections.push('- Out: ...');
    } else if (workItemType === 'feature') {
      sections.push('## Context');
      sections.push(project.description || 'Project context here.');
      sections.push('');
      sections.push('## Feature Description');
      sections.push('Feature details here.');
    }

    sections.push('');
    sections.push('## Acceptance Criteria');
    sections.push('- AC1: ...');
    sections.push('- AC2: ...');

    return sections.join('\n');
  }

  /**
   * Generate basic body content for task-based work items
   * @private
   */
  _generateTaskBody(task, project, workItemType) {
    const sections = [];

    if (workItemType === 'userstory') {
      sections.push('## As a');
      sections.push('User');
      sections.push('');
      sections.push('## I want');
      sections.push('To accomplish something');
      sections.push('');
      sections.push('## So that');
      sections.push('I can achieve my goal');
    } else if (workItemType === 'task') {
      sections.push('## Description');
      sections.push(task.description || 'Task description here.');
      sections.push('');
      sections.push('## Implementation Details');
      sections.push('- Step 1: ...');
      sections.push('- Step 2: ...');
    }

    sections.push('');
    sections.push('## Acceptance Criteria');
    sections.push('- Given ...');
    sections.push('- When ...');
    sections.push('- Then ...');

    return sections.join('\n');
  }

  /**
   * Map effort hours to size labels
   * @private
   */
  _mapEffortToSize(hours) {
    if (hours <= 4) return 'size:XS';
    if (hours <= 8) return 'size:S';
    if (hours <= 16) return 'size:M';
    if (hours <= 32) return 'size:L';
    return 'size:XL';
  }

  /**
   * Generate milestone based on project timeline
   * @private
   */
  _generateMilestone(project, task) {
    if (project.status === 'release') return 'Released';
    if (project.status === 'uat') return 'UAT';
    if (project.status === 'engineering') return 'In Development';
    return 'Backlog';
  }
}