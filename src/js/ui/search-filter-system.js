/**
 * Advanced Search and Filter System
 * 
 * Provides comprehensive search and filtering capabilities with real-time results,
 * multiple criteria, fuzzy search, and advanced filtering options.
 */

import { eventBus } from '../event-bus.js';
import { logger } from '../logger.js';
import { configManager } from '../config-manager.js';
import { errorHandler } from '../error-handler.js';
import DateUtils from '../date-utils.js';

export class SearchFilterSystem {
  constructor() {
    this.searchIndex = new Map();
    this.filters = new Map();
    this.savedQueries = new Map();
    this.activeFilters = {};
    this.currentQuery = '';
    this.searchHistory = [];
    this.maxHistorySize = 50;
    
    this.config = {
      fuzzySearchThreshold: configManager.get('search.fuzzyThreshold', 0.7),
      debounceDelay: configManager.get('search.debounceDelay', 300),
      maxResults: configManager.get('search.maxResults', 100),
      highlightMatches: configManager.get('search.highlightMatches', true),
      caseSensitive: configManager.get('search.caseSensitive', false),
      stemming: configManager.get('search.stemming', true)
    };
    
    this.logger = logger.group ? logger.group('SearchFilter') : logger;
    
    this._setupEventListeners();
    this._initializeFilters();
  }

  /**
   * Initialize the search and filter system
   */
  initialize() {
    try {
      this.logger.info('Initializing search and filter system');
      
      // Load saved queries and filters
      this._loadSavedData();
      
      // Setup search debouncing
      this._setupSearchDebouncing();
      
      // Initialize UI components
      this._initializeUI();
      
      this.logger.info('Search and filter system initialized successfully');
      
      eventBus.emit('search:initialized', {
        filtersAvailable: Array.from(this.filters.keys()),
        savedQueries: Array.from(this.savedQueries.keys())
      });
      
    } catch (error) {
      this.logger.error('Failed to initialize search and filter system', { error: error.message });
      errorHandler.handleError(error, 'SearchFilterSystem.initialize');
    }
  }

  /**
   * Index data for searching
   * @param {Array} items - Items to index
   * @param {Object} options - Indexing options
   */
  indexData(items, options = {}) {
    try {
      const startTime = performance.now();
      this.searchIndex.clear();
      
      const indexFields = options.fields || ['id', 'title', 'description'];
      const keyField = options.keyField || 'id';
      
      for (const item of items) {
        const searchableText = this._extractSearchableText(item, indexFields);
        const keywords = this._tokenize(searchableText);
        
        this.searchIndex.set(item[keyField], {
          item,
          searchableText: searchableText.toLowerCase(),
          keywords: keywords,
          lastModified: item.lastModified || new Date().toISOString()
        });
      }
      
      const duration = performance.now() - startTime;
      
      this.logger.debug('Data indexed for search', {
        itemCount: items.length,
        indexSize: this.searchIndex.size,
        duration: `${duration.toFixed(2)}ms`
      });
      
      eventBus.emit('search:indexed', {
        itemCount: items.length,
        duration
      });
      
    } catch (error) {
      this.logger.error('Failed to index data', { error: error.message });
      errorHandler.handleError(error, 'SearchFilterSystem.indexData');
    }
  }

  /**
   * Perform search with filters
   * @param {string} query - Search query
   * @param {Object} filters - Active filters
   * @param {Object} options - Search options
   * @returns {Array} Search results
   */
  search(query = '', filters = {}, options = {}) {
    try {
      const startTime = performance.now();
      
      // Store current search state
      this.currentQuery = query;
      this.activeFilters = { ...filters };
      
      // Add to search history if it's a new query
      if (query.trim() && !this.searchHistory.includes(query.trim())) {
        this.searchHistory.unshift(query.trim());
        if (this.searchHistory.length > this.maxHistorySize) {
          this.searchHistory = this.searchHistory.slice(0, this.maxHistorySize);
        }
      }
      
      let results = [];
      
      // If no query and no filters, return all items (up to max limit)
      if (!query.trim() && Object.keys(filters).length === 0) {
        results = Array.from(this.searchIndex.values())
          .slice(0, this.config.maxResults)
          .map(entry => ({
            item: entry.item,
            score: 1.0,
            matches: []
          }));
      } else {
        // Perform text search if query provided
        if (query.trim()) {
          results = this._performTextSearch(query, options);
        } else {
          results = Array.from(this.searchIndex.values()).map(entry => ({
            item: entry.item,
            score: 1.0,
            matches: []
          }));
        }
        
        // Apply filters
        if (Object.keys(filters).length > 0) {
          results = this._applyFilters(results, filters);
        }
      }
      
      // Sort results by score and relevance
      results = this._sortResults(results, options.sortBy);
      
      // Limit results
      if (results.length > this.config.maxResults) {
        results = results.slice(0, this.config.maxResults);
      }
      
      const duration = performance.now() - startTime;
      
      this.logger.debug('Search completed', {
        query,
        filtersCount: Object.keys(filters).length,
        resultsCount: results.length,
        duration: `${duration.toFixed(2)}ms`
      });
      
      eventBus.emit('search:completed', {
        query,
        filters,
        resultsCount: results.length,
        duration
      });
      
      return results;
      
    } catch (error) {
      this.logger.error('Search failed', { error: error.message, query });
      errorHandler.handleError(error, 'SearchFilterSystem.search', { query });
      return [];
    }
  }

  /**
   * Get search suggestions based on current query
   * @param {string} partialQuery - Partial search query
   * @param {number} limit - Maximum number of suggestions
   * @returns {Array} Search suggestions
   */
  getSuggestions(partialQuery, limit = 10) {
    try {
      if (!partialQuery || partialQuery.length < 2) {
        return this.searchHistory.slice(0, limit).map(query => ({
          type: 'history',
          text: query,
          score: 1.0
        }));
      }
      
      const suggestions = [];
      const query = partialQuery.toLowerCase();
      
      // Add history matches
      for (const historyQuery of this.searchHistory) {
        if (historyQuery.toLowerCase().includes(query)) {
          suggestions.push({
            type: 'history',
            text: historyQuery,
            score: 0.9
          });
        }
      }
      
      // Add keyword suggestions from indexed data
      const keywords = new Set();
      for (const entry of this.searchIndex.values()) {
        for (const keyword of entry.keywords) {
          if (keyword.toLowerCase().includes(query) && keyword.length > 2) {
            keywords.add(keyword);
          }
        }
      }
      
      for (const keyword of keywords) {
        if (suggestions.length >= limit) break;
        
        suggestions.push({
          type: 'keyword',
          text: keyword,
          score: 0.7
        });
      }
      
      // Sort by score and relevance
      suggestions.sort((a, b) => {
        if (a.score !== b.score) return b.score - a.score;
        return a.text.length - b.text.length; // Prefer shorter matches
      });
      
      return suggestions.slice(0, limit);
      
    } catch (error) {
      this.logger.error('Failed to get suggestions', { error: error.message });
      return [];
    }
  }

  /**
   * Register a filter
   * @param {string} name - Filter name
   * @param {Object} config - Filter configuration
   */
  registerFilter(name, config) {
    try {
      const filterConfig = {
        type: config.type || 'text',
        field: config.field || name,
        label: config.label || name,
        options: config.options || [],
        multiple: config.multiple || false,
        validator: config.validator || null,
        transformer: config.transformer || null,
        description: config.description || ''
      };
      
      this.filters.set(name, filterConfig);
      
      this.logger.debug('Filter registered', { name, type: filterConfig.type });
      
      eventBus.emit('search:filter:registered', { name, config: filterConfig });
      
    } catch (error) {
      this.logger.error('Failed to register filter', { error: error.message, name });
    }
  }

  /**
   * Save a search query
   * @param {string} name - Query name
   * @param {Object} queryData - Query configuration
   */
  saveQuery(name, queryData) {
    try {
      const savedQuery = {
        name,
        query: queryData.query || '',
        filters: queryData.filters || {},
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
        useCount: 1
      };
      
      this.savedQueries.set(name, savedQuery);
      this._persistSavedQueries();
      
      this.logger.debug('Query saved', { name });
      
      eventBus.emit('search:query:saved', { name, query: savedQuery });
      
    } catch (error) {
      this.logger.error('Failed to save query', { error: error.message, name });
    }
  }

  /**
   * Load a saved query
   * @param {string} name - Query name
   * @returns {Object|null} Query data
   */
  loadQuery(name) {
    try {
      const query = this.savedQueries.get(name);
      if (query) {
        // Update usage statistics
        query.lastUsed = new Date().toISOString();
        query.useCount = (query.useCount || 0) + 1;
        this._persistSavedQueries();
        
        eventBus.emit('search:query:loaded', { name, query });
        
        return {
          query: query.query,
          filters: query.filters
        };
      }
      return null;
      
    } catch (error) {
      this.logger.error('Failed to load query', { error: error.message, name });
      return null;
    }
  }

  /**
   * Delete a saved query
   * @param {string} name - Query name
   */
  deleteQuery(name) {
    try {
      const deleted = this.savedQueries.delete(name);
      if (deleted) {
        this._persistSavedQueries();
        eventBus.emit('search:query:deleted', { name });
      }
      return deleted;
      
    } catch (error) {
      this.logger.error('Failed to delete query', { error: error.message, name });
      return false;
    }
  }

  /**
   * Get available filters
   * @returns {Array} Available filters
   */
  getAvailableFilters() {
    return Array.from(this.filters.entries()).map(([name, config]) => ({
      name,
      ...config
    }));
  }

  /**
   * Get saved queries
   * @returns {Array} Saved queries
   */
  getSavedQueries() {
    return Array.from(this.savedQueries.entries()).map(([name, query]) => ({
      name,
      ...query
    })).sort((a, b) => new Date(b.lastUsed) - new Date(a.lastUsed));
  }

  /**
   * Clear search history
   */
  clearHistory() {
    this.searchHistory = [];
    this._persistSearchHistory();
    eventBus.emit('search:history:cleared');
  }

  /**
   * Get search statistics
   * @returns {Object} Search statistics
   */
  getSearchStats() {
    return {
      indexedItems: this.searchIndex.size,
      availableFilters: this.filters.size,
      savedQueries: this.savedQueries.size,
      historySize: this.searchHistory.length,
      currentQuery: this.currentQuery,
      activeFiltersCount: Object.keys(this.activeFilters).length
    };
  }

  // Private Methods

  /**
   * Setup event listeners
   * @private
   */
  _setupEventListeners() {
    // Listen for configuration changes
    eventBus.on('config:changed', (event) => {
      if (event.key.startsWith('search.')) {
        this._updateConfig();
      }
    });

    // Listen for data changes to re-index
    eventBus.on('data:changed', (event) => {
      if (event.items) {
        this.indexData(event.items, event.indexOptions);
      }
    });
  }

  /**
   * Initialize default filters
   * @private
   */
  _initializeFilters() {
    // Status filter
    this.registerFilter('status', {
      type: 'select',
      field: 'status',
      label: 'Status',
      multiple: true,
      options: [
        { value: 'not-started', label: 'Not Started' },
        { value: 'in-progress', label: 'In Progress' },
        { value: 'completed', label: 'Completed' },
        { value: 'blocked', label: 'Blocked' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    });

    // Priority filter
    this.registerFilter('priority', {
      type: 'select',
      field: 'priority',
      label: 'Priority',
      multiple: true,
      options: [
        { value: 'low', label: 'Low' },
        { value: 'medium', label: 'Medium' },
        { value: 'high', label: 'High' },
        { value: 'critical', label: 'Critical' }
      ]
    });

    // Date range filter
    this.registerFilter('dateRange', {
      type: 'dateRange',
      field: 'targetDate',
      label: 'Date Range'
    });

    // Assignee filter
    this.registerFilter('assignee', {
      type: 'text',
      field: 'assignee',
      label: 'Assignee'
    });

    // Tags filter
    this.registerFilter('tags', {
      type: 'tags',
      field: 'tags',
      label: 'Tags',
      multiple: true
    });
  }

  /**
   * Load saved data from storage
   * @private
   */
  _loadSavedData() {
    try {
      // Load saved queries
      const savedQueries = localStorage.getItem('roadmap_search_queries');
      if (savedQueries) {
        const queries = JSON.parse(savedQueries);
        for (const [name, query] of Object.entries(queries)) {
          this.savedQueries.set(name, query);
        }
      }

      // Load search history
      const searchHistory = localStorage.getItem('roadmap_search_history');
      if (searchHistory) {
        this.searchHistory = JSON.parse(searchHistory);
      }

    } catch (error) {
      this.logger.error('Failed to load saved data', { error: error.message });
    }
  }

  /**
   * Setup search debouncing
   * @private
   */
  _setupSearchDebouncing() {
    this.debouncedSearch = this._debounce((query, filters, options, callback) => {
      const results = this.search(query, filters, options);
      if (callback) callback(results);
    }, this.config.debounceDelay);
  }

  /**
   * Initialize UI components
   * @private
   */
  _initializeUI() {
    // This would setup the search UI components
    // Implementation would depend on the specific UI framework used
    this.logger.debug('Search UI components initialized');
  }

  /**
   * Extract searchable text from item
   * @private
   */
  _extractSearchableText(item, fields) {
    const textParts = [];
    
    for (const field of fields) {
      const value = this._getNestedValue(item, field);
      if (value !== null && value !== undefined) {
        if (Array.isArray(value)) {
          textParts.push(...value.map(String));
        } else {
          textParts.push(String(value));
        }
      }
    }
    
    return textParts.join(' ');
  }

  /**
   * Tokenize text into searchable keywords
   * @private
   */
  _tokenize(text) {
    const tokens = text
      .toLowerCase()
      .replace(/[^\w\s-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 1);
    
    if (this.config.stemming) {
      return tokens.map(token => this._stem(token));
    }
    
    return tokens;
  }

  /**
   * Simple stemming algorithm
   * @private
   */
  _stem(word) {
    // Simple stemming rules (in production, use a proper stemming library)
    if (word.endsWith('ing')) {
      return word.slice(0, -3);
    }
    if (word.endsWith('ed')) {
      return word.slice(0, -2);
    }
    if (word.endsWith('s')) {
      return word.slice(0, -1);
    }
    return word;
  }

  /**
   * Perform text search
   * @private
   */
  _performTextSearch(query, options) {
    const results = [];
    const searchTerms = this._tokenize(query);
    
    for (const entry of this.searchIndex.values()) {
      const score = this._calculateRelevanceScore(searchTerms, entry, query);
      
      if (score > 0) {
        const matches = this._findMatches(query, entry.searchableText);
        
        results.push({
          item: entry.item,
          score,
          matches,
          searchableText: entry.searchableText
        });
      }
    }
    
    return results;
  }

  /**
   * Calculate relevance score
   * @private
   */
  _calculateRelevanceScore(searchTerms, entry, originalQuery) {
    let score = 0;
    const { keywords, searchableText } = entry;
    
    // Exact phrase match (highest score)
    if (searchableText.includes(originalQuery.toLowerCase())) {
      score += 10;
    }
    
    // Individual term matches
    for (const term of searchTerms) {
      if (keywords.includes(term)) {
        score += 3;
      } else {
        // Fuzzy match
        for (const keyword of keywords) {
          const similarity = this._calculateSimilarity(term, keyword);
          if (similarity > this.config.fuzzySearchThreshold) {
            score += similarity * 2;
          }
        }
      }
    }
    
    // Boost score for matches in title
    if (entry.item.title && entry.item.title.toLowerCase().includes(originalQuery.toLowerCase())) {
      score += 5;
    }
    
    // Boost score for recent items
    if (entry.lastModified) {
      const daysSinceModified = (Date.now() - new Date(entry.lastModified).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceModified < 7) {
        score += 1;
      }
    }
    
    return score;
  }

  /**
   * Calculate string similarity (Levenshtein distance)
   * @private
   */
  _calculateSimilarity(str1, str2) {
    const len1 = str1.length;
    const len2 = str2.length;
    
    if (len1 === 0) return len2 === 0 ? 1 : 0;
    if (len2 === 0) return 0;
    
    const matrix = Array(len1 + 1).fill(null).map(() => Array(len2 + 1).fill(null));
    
    for (let i = 0; i <= len1; i++) matrix[i][0] = i;
    for (let j = 0; j <= len2; j++) matrix[0][j] = j;
    
    for (let i = 1; i <= len1; i++) {
      for (let j = 1; j <= len2; j++) {
        const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }
    
    const maxLength = Math.max(len1, len2);
    return (maxLength - matrix[len1][len2]) / maxLength;
  }

  /**
   * Find text matches for highlighting
   * @private
   */
  _findMatches(query, text) {
    if (!this.config.highlightMatches) {
      return [];
    }
    
    const matches = [];
    const queryLower = query.toLowerCase();
    const textLower = text.toLowerCase();
    
    let index = textLower.indexOf(queryLower);
    while (index !== -1) {
      matches.push({
        start: index,
        end: index + query.length,
        text: text.substring(index, index + query.length)
      });
      index = textLower.indexOf(queryLower, index + 1);
    }
    
    return matches;
  }

  /**
   * Apply filters to results
   * @private
   */
  _applyFilters(results, filters) {
    return results.filter(result => {
      for (const [filterName, filterValue] of Object.entries(filters)) {
        if (!this._applyFilter(result.item, filterName, filterValue)) {
          return false;
        }
      }
      return true;
    });
  }

  /**
   * Apply individual filter
   * @private
   */
  _applyFilter(item, filterName, filterValue) {
    const filterConfig = this.filters.get(filterName);
    if (!filterConfig) {
      return true; // Unknown filter, don't exclude
    }
    
    const itemValue = this._getNestedValue(item, filterConfig.field);
    
    switch (filterConfig.type) {
      case 'select':
        if (filterConfig.multiple) {
          return Array.isArray(filterValue) && filterValue.includes(itemValue);
        }
        return itemValue === filterValue;
        
      case 'text':
        if (!filterValue || !itemValue) return true;
        return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
        
      case 'dateRange':
        return this._applyDateRangeFilter(itemValue, filterValue);
        
      case 'tags':
        if (!Array.isArray(itemValue) || !Array.isArray(filterValue)) return true;
        return filterValue.some(tag => itemValue.includes(tag));
        
      default:
        return true;
    }
  }

  /**
   * Apply date range filter
   * @private
   */
  _applyDateRangeFilter(itemDate, filterValue) {
    if (!itemDate || !filterValue) return true;
    
    const { start, end } = filterValue;
    if (!start && !end) return true;
    
    const itemDateObj = DateUtils.parseNZ(itemDate);
    if (!itemDateObj) return true;
    
    if (start && DateUtils.compareNZ(itemDate, start) < 0) {
      return false;
    }
    
    if (end && DateUtils.compareNZ(itemDate, end) > 0) {
      return false;
    }
    
    return true;
  }

  /**
   * Sort search results
   * @private
   */
  _sortResults(results, sortBy) {
    if (!sortBy) {
      // Default sort by score (descending) then title (ascending)
      return results.sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }
        const titleA = a.item.title || '';
        const titleB = b.item.title || '';
        return titleA.localeCompare(titleB);
      });
    }
    
    return results.sort((a, b) => {
      const valueA = this._getNestedValue(a.item, sortBy.field);
      const valueB = this._getNestedValue(b.item, sortBy.field);
      
      if (valueA === valueB) return 0;
      if (valueA === null || valueA === undefined) return 1;
      if (valueB === null || valueB === undefined) return -1;
      
      const comparison = valueA < valueB ? -1 : 1;
      return sortBy.direction === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Get nested object value by path
   * @private
   */
  _getNestedValue(obj, path) {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : null;
    }, obj);
  }

  /**
   * Persist saved queries to storage
   * @private
   */
  _persistSavedQueries() {
    try {
      const queries = Object.fromEntries(this.savedQueries);
      localStorage.setItem('roadmap_search_queries', JSON.stringify(queries));
    } catch (error) {
      this.logger.error('Failed to persist saved queries', { error: error.message });
    }
  }

  /**
   * Persist search history to storage
   * @private
   */
  _persistSearchHistory() {
    try {
      localStorage.setItem('roadmap_search_history', JSON.stringify(this.searchHistory));
    } catch (error) {
      this.logger.error('Failed to persist search history', { error: error.message });
    }
  }

  /**
   * Debounce function
   * @private
   */
  _debounce(func, delay) {
    let timeoutId;
    return function (...args) {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  /**
   * Update configuration
   * @private
   */
  _updateConfig() {
    this.config.fuzzySearchThreshold = configManager.get('search.fuzzyThreshold', 0.7);
    this.config.debounceDelay = configManager.get('search.debounceDelay', 300);
    this.config.maxResults = configManager.get('search.maxResults', 100);
    this.config.highlightMatches = configManager.get('search.highlightMatches', true);
    this.config.caseSensitive = configManager.get('search.caseSensitive', false);
    this.config.stemming = configManager.get('search.stemming', true);
    
    // Re-setup debouncing with new delay
    this._setupSearchDebouncing();
    
    this.logger.debug('Configuration updated', this.config);
  }
}

// Create and export singleton instance
export const searchFilterSystem = new SearchFilterSystem();

// Auto-initialize
setTimeout(() => {
  searchFilterSystem.initialize();
}, 100);

export default searchFilterSystem;