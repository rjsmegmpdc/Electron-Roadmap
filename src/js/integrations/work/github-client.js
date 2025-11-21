/**
 * GitHubClient - GitHub API wrapper for Issues management
 * 
 * Provides methods for creating, updating, and managing GitHub Issues.
 * Includes mockable implementation for unit testing as specified in sub-PRD.
 */

export default class GitHubClient {
  constructor({ token, owner, repo, apiBase = "https://api.github.com" }) {
    if (!token) {
      throw new Error('GitHub token is required');
    }
    if (!owner) {
      throw new Error('GitHub owner is required');
    }
    if (!repo) {
      throw new Error('GitHub repo is required');
    }

    this.token = token;
    this.owner = owner;
    this.repo = repo;
    this.apiBase = apiBase;
    this.mockMode = false; // Can be enabled for testing
    this.mockResponses = {};
  }

  /**
   * Enable mock mode for testing
   * @param {Object} mockResponses - Mock response mappings
   */
  enableMockMode(mockResponses = {}) {
    this.mockMode = true;
    this.mockResponses = mockResponses;
  }

  /**
   * Disable mock mode (use real API)
   */
  disableMockMode() {
    this.mockMode = false;
    this.mockResponses = {};
  }

  /**
   * Create a new GitHub Issue
   * @param {Object} payload - Issue payload with title, body, labels, assignees
   * @returns {Promise<Object>} Created issue with number and url
   */
  async createIssue(payload) {
    if (this.mockMode) {
      return this._mockCreateIssue(payload);
    }

    try {
      const response = await this._makeRequest('POST', '/issues', payload);
      
      return {
        number: response.number,
        url: response.html_url,
        id: response.id,
        state: response.state,
        created_at: response.created_at,
        updated_at: response.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to create GitHub issue: ${error.message}`);
    }
  }

  /**
   * Update an existing GitHub Issue
   * @param {number} number - Issue number
   * @param {Object} payload - Update payload
   * @returns {Promise<Object>} Updated issue
   */
  async updateIssue(number, payload) {
    if (this.mockMode) {
      return this._mockUpdateIssue(number, payload);
    }

    try {
      const response = await this._makeRequest('PATCH', `/issues/${number}`, payload);
      
      return {
        number: response.number,
        url: response.html_url,
        id: response.id,
        state: response.state,
        title: response.title,
        body: response.body,
        labels: response.labels,
        assignees: response.assignees,
        updated_at: response.updated_at
      };
    } catch (error) {
      throw new Error(`Failed to update GitHub issue #${number}: ${error.message}`);
    }
  }

  /**
   * Get a GitHub Issue by number
   * @param {number} number - Issue number
   * @returns {Promise<Object>} Issue object
   */
  async getIssue(number) {
    if (this.mockMode) {
      return this._mockGetIssue(number);
    }

    try {
      const response = await this._makeRequest('GET', `/issues/${number}`);
      
      return {
        number: response.number,
        id: response.id,
        title: response.title,
        body: response.body,
        state: response.state,
        labels: response.labels,
        assignees: response.assignees,
        milestone: response.milestone,
        created_at: response.created_at,
        updated_at: response.updated_at,
        html_url: response.html_url
      };
    } catch (error) {
      throw new Error(`Failed to get GitHub issue #${number}: ${error.message}`);
    }
  }

  /**
   * List all labels in the repository
   * @returns {Promise<Array>} Array of label objects
   */
  async listLabels() {
    if (this.mockMode) {
      return this._mockListLabels();
    }

    try {
      const response = await this._makeRequest('GET', '/labels');
      return response.map(label => ({
        name: label.name,
        color: label.color,
        description: label.description
      }));
    } catch (error) {
      throw new Error(`Failed to list GitHub labels: ${error.message}`);
    }
  }

  /**
   * Ensure required labels exist in repository (idempotent)
   * @param {Array} required - Array of required label definitions
   * @returns {Promise<Array>} Array of ensured labels
   */
  async ensureLabels(required) {
    if (this.mockMode) {
      return this._mockEnsureLabels(required);
    }

    try {
      const existingLabels = await this.listLabels();
      const existingLabelNames = existingLabels.map(label => label.name);
      const ensuredLabels = [];

      for (const labelDef of required) {
        const labelName = typeof labelDef === 'string' ? labelDef : labelDef.name;
        
        if (!existingLabelNames.includes(labelName)) {
          // Create missing label
          const labelPayload = typeof labelDef === 'string' 
            ? { name: labelName, color: this._getDefaultColor(labelName) }
            : labelDef;

          const createdLabel = await this._makeRequest('POST', '/labels', labelPayload);
          ensuredLabels.push({
            name: createdLabel.name,
            color: createdLabel.color,
            description: createdLabel.description,
            created: true
          });
        } else {
          ensuredLabels.push({
            name: labelName,
            created: false
          });
        }
      }

      return ensuredLabels;
    } catch (error) {
      throw new Error(`Failed to ensure GitHub labels: ${error.message}`);
    }
  }

  /**
   * Search issues with filters
   * @param {Object} filters - Search filters
   * @returns {Promise<Array>} Array of matching issues
   */
  async searchIssues(filters = {}) {
    if (this.mockMode) {
      return this._mockSearchIssues(filters);
    }

    try {
      let query = `repo:${this.owner}/${this.repo}`;
      
      if (filters.state) query += ` state:${filters.state}`;
      if (filters.labels) query += ` label:"${filters.labels.join('","')}"`;
      if (filters.assignee) query += ` assignee:${filters.assignee}`;
      if (filters.milestone) query += ` milestone:"${filters.milestone}"`;

      const response = await this._makeRequest('GET', `/search/issues?q=${encodeURIComponent(query)}`);
      
      return response.items.map(issue => ({
        number: issue.number,
        title: issue.title,
        body: issue.body,
        state: issue.state,
        labels: issue.labels,
        assignees: issue.assignees,
        html_url: issue.html_url,
        created_at: issue.created_at,
        updated_at: issue.updated_at
      }));
    } catch (error) {
      throw new Error(`Failed to search GitHub issues: ${error.message}`);
    }
  }

  /**
   * Close an issue
   * @param {number} number - Issue number
   * @returns {Promise<Object>} Closed issue
   */
  async closeIssue(number) {
    return this.updateIssue(number, { state: 'closed' });
  }

  /**
   * Reopen an issue  
   * @param {number} number - Issue number
   * @returns {Promise<Object>} Reopened issue
   */
  async reopenIssue(number) {
    return this.updateIssue(number, { state: 'open' });
  }

  /**
   * Make HTTP request to GitHub API
   * @private
   */
  async _makeRequest(method, path, body = null) {
    const url = `${this.apiBase}/repos/${this.owner}/${this.repo}${path}`;
    
    const options = {
      method,
      headers: {
        'Authorization': `token ${this.token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'RoadmapTool-WorkIntegration/1.0'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}. ${errorData.message || ''}`
      );
    }

    return response.json();
  }

  /**
   * Get default color for label based on type
   * @private
   */
  _getDefaultColor(labelName) {
    if (labelName.startsWith('status:')) return 'fbca04'; // Yellow
    if (labelName.startsWith('priority:')) return 'd93f0b'; // Red
    if (labelName.startsWith('type:')) return '0052cc'; // Blue
    if (labelName.startsWith('size:')) return '5319e7'; // Purple
    if (labelName.startsWith('financial:')) return '0e8a16'; // Green
    return 'c2e0c6'; // Light green default
  }

  /**
   * Mock implementation for createIssue
   * @private
   */
  _mockCreateIssue(payload) {
    const mockIssue = {
      number: this.mockResponses.nextIssueNumber || Math.floor(Math.random() * 1000) + 1,
      url: `https://github.com/${this.owner}/${this.repo}/issues/${this.mockResponses.nextIssueNumber || 123}`,
      id: Math.floor(Math.random() * 100000),
      state: 'open',
      title: payload.title,
      body: payload.body,
      labels: payload.labels || [],
      assignees: payload.assignees || [],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (this.mockResponses.createIssue) {
      return Promise.resolve(this.mockResponses.createIssue);
    }

    return Promise.resolve(mockIssue);
  }

  /**
   * Mock implementation for updateIssue
   * @private
   */
  _mockUpdateIssue(number, payload) {
    const mockIssue = {
      number,
      url: `https://github.com/${this.owner}/${this.repo}/issues/${number}`,
      id: Math.floor(Math.random() * 100000),
      state: payload.state || 'open',
      title: payload.title || 'Mock Issue Title',
      body: payload.body || 'Mock issue body',
      labels: payload.labels || [],
      assignees: payload.assignees || [],
      updated_at: new Date().toISOString()
    };

    if (this.mockResponses.updateIssue) {
      return Promise.resolve(this.mockResponses.updateIssue);
    }

    return Promise.resolve(mockIssue);
  }

  /**
   * Mock implementation for getIssue
   * @private
   */
  _mockGetIssue(number) {
    if (this.mockResponses.getIssue) {
      return Promise.resolve(this.mockResponses.getIssue);
    }

    const mockIssue = {
      number,
      id: Math.floor(Math.random() * 100000),
      title: 'Mock Issue Title',
      body: 'Mock issue body',
      state: 'open',
      labels: [{ name: 'type:epic' }],
      assignees: [],
      milestone: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      html_url: `https://github.com/${this.owner}/${this.repo}/issues/${number}`
    };

    return Promise.resolve(mockIssue);
  }

  /**
   * Mock implementation for listLabels
   * @private
   */
  _mockListLabels() {
    if (this.mockResponses.listLabels) {
      return Promise.resolve(this.mockResponses.listLabels);
    }

    const defaultLabels = [
      { name: 'type:epic', color: '0052cc', description: 'Epic work item' },
      { name: 'type:story', color: '0052cc', description: 'User story work item' },
      { name: 'status:planned', color: 'fbca04', description: 'Planned status' },
      { name: 'priority:P1', color: 'd93f0b', description: 'Highest priority' }
    ];

    return Promise.resolve(defaultLabels);
  }

  /**
   * Mock implementation for ensureLabels
   * @private
   */
  _mockEnsureLabels(required) {
    if (this.mockResponses.ensureLabels) {
      return Promise.resolve(this.mockResponses.ensureLabels);
    }

    const ensuredLabels = required.map(labelDef => ({
      name: typeof labelDef === 'string' ? labelDef : labelDef.name,
      created: Math.random() > 0.5 // Randomly simulate some being created vs existing
    }));

    return Promise.resolve(ensuredLabels);
  }

  /**
   * Mock implementation for searchIssues
   * @private
   */
  _mockSearchIssues(filters) {
    if (this.mockResponses.searchIssues) {
      return Promise.resolve(this.mockResponses.searchIssues);
    }

    const mockIssues = [
      {
        number: 1,
        title: '[Epic] Sample Epic',
        body: 'Mock epic body',
        state: 'open',
        labels: [{ name: 'type:epic' }],
        assignees: [],
        html_url: `https://github.com/${this.owner}/${this.repo}/issues/1`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    return Promise.resolve(mockIssues);
  }
}