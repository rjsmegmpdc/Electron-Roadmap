/**
 * AzureDevOpsClient - REST API wrapper for Azure DevOps work items
 * 
 * Handles all ADO REST API interactions for work items with authentication,
 * error handling, and request/response mapping.
 */

export default class AzureDevOpsClient {
  constructor({ organization, project, pat, baseUrl, version = '6.1' }) {
    if (!organization) {
      throw new Error('Organization is required');
    }
    if (!project) {
      throw new Error('Project is required');
    }
    if (!pat && !process.env.ADO_PAT) {
      throw new Error('Personal Access Token (PAT) is required');
    }

    this.organization = organization;
    this.project = project;
    this.pat = pat || process.env.ADO_PAT;
    this.baseUrl = baseUrl || `https://dev.azure.com/${organization}`;
    this.apiVersion = version;
    
    // Build common headers
    this.headers = {
      'Content-Type': 'application/json-patch+json',
      'Authorization': `Basic ${Buffer.from(`:${this.pat}`).toString('base64')}`
    };

    this.workItemsUrl = `${this.baseUrl}/${project}/_apis/wit/workitems`;
    this.queriesUrl = `${this.baseUrl}/${project}/_apis/wit/wiql`;
  }

  /**
   * Create a new work item in ADO
   * @param {string} workItemType - Type (Epic, User Story, Task, etc.)
   * @param {Object} fields - Work item fields
   * @returns {Promise<Object>} Created work item
   */
  async createWorkItem(workItemType, fields) {
    try {
      // Convert fields object to ADO patch format
      const patchDocument = this._buildPatchDocument(fields, 'add');
      
      const url = `${this.workItemsUrl}/$${workItemType}?api-version=${this.apiVersion}`;
      
      const response = await this._makeRequest('POST', url, patchDocument);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ADO API error: ${error.message || response.statusText}`);
      }

      const workItem = await response.json();
      
      return {
        id: workItem.id,
        rev: workItem.rev,
        url: workItem.url,
        fields: workItem.fields,
        workItemType: workItem.fields['System.WorkItemType'],
        state: workItem.fields['System.State'],
        title: workItem.fields['System.Title']
      };

    } catch (error) {
      throw new Error(`Failed to create work item: ${error.message}`);
    }
  }

  /**
   * Get work item by ID
   * @param {number} workItemId - Work item ID
   * @param {Array} fields - Specific fields to retrieve (optional)
   * @returns {Promise<Object>} Work item details
   */
  async getWorkItem(workItemId, fields = null) {
    try {
      let url = `${this.workItemsUrl}/${workItemId}?api-version=${this.apiVersion}`;
      
      if (fields && fields.length > 0) {
        url += `&fields=${fields.join(',')}`;
      }

      const response = await this._makeRequest('GET', url);
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`Work item ${workItemId} not found`);
        }
        const error = await response.json();
        throw new Error(`ADO API error: ${error.message || response.statusText}`);
      }

      const workItem = await response.json();
      
      return {
        id: workItem.id,
        rev: workItem.rev,
        url: workItem.url,
        fields: workItem.fields,
        relations: workItem.relations || [],
        workItemType: workItem.fields['System.WorkItemType'],
        state: workItem.fields['System.State'],
        title: workItem.fields['System.Title'],
        lastModified: workItem.fields['System.ChangedDate']
      };

    } catch (error) {
      throw new Error(`Failed to get work item: ${error.message}`);
    }
  }

  /**
   * Update work item fields
   * @param {number} workItemId - Work item ID
   * @param {Object} fields - Fields to update
   * @returns {Promise<Object>} Updated work item
   */
  async updateWorkItem(workItemId, fields) {
    try {
      const patchDocument = this._buildPatchDocument(fields, 'replace');
      
      const url = `${this.workItemsUrl}/${workItemId}?api-version=${this.apiVersion}`;
      
      const response = await this._makeRequest('PATCH', url, patchDocument);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ADO API error: ${error.message || response.statusText}`);
      }

      const workItem = await response.json();
      
      return {
        id: workItem.id,
        rev: workItem.rev,
        url: workItem.url,
        fields: workItem.fields,
        workItemType: workItem.fields['System.WorkItemType'],
        state: workItem.fields['System.State'],
        title: workItem.fields['System.Title']
      };

    } catch (error) {
      throw new Error(`Failed to update work item: ${error.message}`);
    }
  }

  /**
   * Query work items using WIQL
   * @param {string} wiql - Work Item Query Language string
   * @returns {Promise<Array>} Array of work item IDs matching query
   */
  async queryWorkItems(wiql) {
    try {
      const queryBody = { query: wiql };
      
      const response = await this._makeRequest('POST', `${this.queriesUrl}?api-version=${this.apiVersion}`, queryBody);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ADO Query API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      // Extract work item IDs from query result
      const workItemIds = result.workItems?.map(item => item.id) || [];
      
      return {
        workItemIds,
        queryType: result.queryType,
        columns: result.columns || []
      };

    } catch (error) {
      throw new Error(`Failed to query work items: ${error.message}`);
    }
  }

  /**
   * Get multiple work items by IDs
   * @param {Array<number>} workItemIds - Array of work item IDs
   * @param {Array} fields - Specific fields to retrieve (optional)
   * @returns {Promise<Array>} Array of work items
   */
  async getWorkItems(workItemIds, fields = null) {
    try {
      if (!workItemIds || workItemIds.length === 0) {
        return [];
      }

      const idsParam = workItemIds.join(',');
      let url = `${this.workItemsUrl}?ids=${idsParam}&api-version=${this.apiVersion}`;
      
      if (fields && fields.length > 0) {
        url += `&fields=${fields.join(',')}`;
      }

      const response = await this._makeRequest('GET', url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ADO API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      return result.value?.map(workItem => ({
        id: workItem.id,
        rev: workItem.rev,
        url: workItem.url,
        fields: workItem.fields,
        workItemType: workItem.fields['System.WorkItemType'],
        state: workItem.fields['System.State'],
        title: workItem.fields['System.Title'],
        lastModified: workItem.fields['System.ChangedDate']
      })) || [];

    } catch (error) {
      throw new Error(`Failed to get work items: ${error.message}`);
    }
  }

  /**
   * Find work items by RT project/task ID
   * @param {string} rtProjectId - RT project ID
   * @param {string} rtTaskId - RT task ID (optional)
   * @returns {Promise<Array>} Matching work items
   */
  async findWorkItemsByRTId(rtProjectId, rtTaskId = null) {
    try {
      let wiql = `
        SELECT [System.Id], [System.Title], [System.State], [System.WorkItemType]
        FROM WorkItems
        WHERE [Custom.RTProjectId] = '${rtProjectId}'
      `;
      
      if (rtTaskId) {
        wiql += ` AND [Custom.RTTaskId] = '${rtTaskId}'`;
      }
      
      wiql += ` ORDER BY [System.Id] DESC`;

      const queryResult = await this.queryWorkItems(wiql);
      
      if (queryResult.workItemIds.length === 0) {
        return [];
      }

      const workItems = await this.getWorkItems(queryResult.workItemIds);
      return workItems;

    } catch (error) {
      throw new Error(`Failed to find work items by RT ID: ${error.message}`);
    }
  }

  /**
   * Delete work item (move to recycle bin)
   * @param {number} workItemId - Work item ID
   * @returns {Promise<boolean>} Success status
   */
  async deleteWorkItem(workItemId) {
    try {
      const url = `${this.workItemsUrl}/${workItemId}?api-version=${this.apiVersion}`;
      
      const response = await this._makeRequest('DELETE', url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ADO API error: ${error.message || response.statusText}`);
      }

      return true;

    } catch (error) {
      throw new Error(`Failed to delete work item: ${error.message}`);
    }
  }

  /**
   * Get available work item types for the project
   * @returns {Promise<Array>} Array of work item types
   */
  async getWorkItemTypes() {
    try {
      const url = `${this.baseUrl}/${this.project}/_apis/wit/workitemtypes?api-version=${this.apiVersion}`;
      
      const response = await this._makeRequest('GET', url);
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(`ADO API error: ${error.message || response.statusText}`);
      }

      const result = await response.json();
      
      return result.value?.map(type => ({
        name: type.name,
        referenceName: type.referenceName,
        description: type.description,
        color: type.color,
        icon: type.icon
      })) || [];

    } catch (error) {
      throw new Error(`Failed to get work item types: ${error.message}`);
    }
  }

  /**
   * Test connection to ADO
   * @returns {Promise<boolean>} Connection status
   */
  async testConnection() {
    try {
      const url = `${this.baseUrl}/${this.project}/_apis/wit/workitemtypes?api-version=${this.apiVersion}`;
      
      const response = await this._makeRequest('GET', url);
      
      return response.ok;

    } catch (error) {
      return false;
    }
  }

  /**
   * Build ADO patch document from fields object
   * @private
   */
  _buildPatchDocument(fields, operation = 'add') {
    const patchDocument = [];

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
      patchDocument.push({
        op: operation,
        path: `/fields/${fieldName}`,
        value: fieldValue
      });
    }

    return patchDocument;
  }

  /**
   * Make HTTP request to ADO API
   * @private
   */
  async _makeRequest(method, url, body = null) {
    const options = {
      method,
      headers: this.headers
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, options);
      return response;
    } catch (error) {
      throw new Error(`Network error: ${error.message}`);
    }
  }
}

/**
 * Mock ADO client for unit testing
 */
export class MockAzureDevOpsClient extends AzureDevOpsClient {
  constructor(options = {}) {
    super({
      organization: 'mock-org',
      project: 'mock-project',
      pat: 'mock-pat',
      ...options
    });
    
    this.mockData = {
      workItems: new Map(),
      nextId: 1000
    };
    
    // Pre-populate with sample data
    this._setupMockData();
  }

  async createWorkItem(workItemType, fields) {
    const workItem = {
      id: this.mockData.nextId++,
      rev: 1,
      url: `https://dev.azure.com/mock-org/mock-project/_workitems/edit/${this.mockData.nextId}`,
      fields: {
        'System.WorkItemType': workItemType,
        'System.State': 'New',
        'System.CreatedDate': new Date().toISOString(),
        'System.ChangedDate': new Date().toISOString(),
        ...fields
      }
    };

    this.mockData.workItems.set(workItem.id, workItem);

    return {
      id: workItem.id,
      rev: workItem.rev,
      url: workItem.url,
      fields: workItem.fields,
      workItemType: workItem.fields['System.WorkItemType'],
      state: workItem.fields['System.State'],
      title: workItem.fields['System.Title']
    };
  }

  async getWorkItem(workItemId) {
    const workItem = this.mockData.workItems.get(workItemId);
    
    if (!workItem) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    return {
      id: workItem.id,
      rev: workItem.rev,
      url: workItem.url,
      fields: workItem.fields,
      relations: workItem.relations || [],
      workItemType: workItem.fields['System.WorkItemType'],
      state: workItem.fields['System.State'],
      title: workItem.fields['System.Title'],
      lastModified: workItem.fields['System.ChangedDate']
    };
  }

  async updateWorkItem(workItemId, fields) {
    const workItem = this.mockData.workItems.get(workItemId);
    
    if (!workItem) {
      throw new Error(`Work item ${workItemId} not found`);
    }

    // Update fields
    Object.assign(workItem.fields, fields);
    workItem.fields['System.ChangedDate'] = new Date().toISOString();
    workItem.rev++;

    return {
      id: workItem.id,
      rev: workItem.rev,
      url: workItem.url,
      fields: workItem.fields,
      workItemType: workItem.fields['System.WorkItemType'],
      state: workItem.fields['System.State'],
      title: workItem.fields['System.Title']
    };
  }

  async findWorkItemsByRTId(rtProjectId, rtTaskId = null) {
    const matches = [];
    
    for (const workItem of this.mockData.workItems.values()) {
      const projectIdMatch = workItem.fields['Custom.RTProjectId'] === rtProjectId;
      const taskIdMatch = !rtTaskId || workItem.fields['Custom.RTTaskId'] === rtTaskId;
      
      if (projectIdMatch && taskIdMatch) {
        matches.push({
          id: workItem.id,
          rev: workItem.rev,
          url: workItem.url,
          fields: workItem.fields,
          workItemType: workItem.fields['System.WorkItemType'],
          state: workItem.fields['System.State'],
          title: workItem.fields['System.Title'],
          lastModified: workItem.fields['System.ChangedDate']
        });
      }
    }

    return matches;
  }

  async testConnection() {
    return true;
  }

  _setupMockData() {
    // Add sample work items for testing
    const sampleWorkItem = {
      id: 1001,
      rev: 1,
      url: 'https://dev.azure.com/mock-org/mock-project/_workitems/edit/1001',
      fields: {
        'System.WorkItemType': 'Epic',
        'System.Title': '[Epic] Sample RT Project',
        'System.State': 'New',
        'System.Description': 'Sample project synced from RT',
        'Custom.RTProjectId': 'rt-project-123',
        'Microsoft.VSTS.Common.Priority': 2,
        'System.Tags': 'roadmap-tool',
        'System.CreatedDate': new Date().toISOString(),
        'System.ChangedDate': new Date().toISOString()
      }
    };

    this.mockData.workItems.set(1001, sampleWorkItem);
  }
}