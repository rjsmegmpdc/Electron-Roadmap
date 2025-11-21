/**
 * Application Constants
 * 
 * This file contains all application-wide constants, configuration values,
 * and enumeration definitions used across the Roadmap-Electron application.
 */

import type { Priority, ValueArea, EpicSizing, RiskLevel, WorkItemState, DependencyType } from '../types';

// Application Info
export const APP_INFO = {
  name: 'Roadmap-Electron',
  version: '1.0.0',
  author: 'Development Team',
  description: 'Project roadmap and epic/feature management tool'
} as const;

// API Configuration
export const API_CONFIG = {
  timeout: 10000,
  retryAttempts: 3,
  retryDelay: 1000
} as const;

// Date Formats
export const DATE_FORMATS = {
  NZ: 'DD-MM-YYYY',
  ISO: 'YYYY-MM-DDTHH:MM:SS.SSSZ',
  DISPLAY: 'DD MMM YYYY',
  SHORT: 'DD/MM/YY'
} as const;

// Status Options
export const STATUS_OPTIONS = [
  { value: 'planned', label: 'Planned', color: '#6b7280' },
  { value: 'in-progress', label: 'In Progress', color: '#3b82f6' },
  { value: 'blocked', label: 'Blocked', color: '#ef4444' },
  { value: 'done', label: 'Done', color: '#10b981' },
  { value: 'archived', label: 'Archived', color: '#9ca3af' }
] as const;

// Priority Options
export const PRIORITY_OPTIONS = [
  { value: 1, label: '1 - Critical (Drop everything)', color: '#dc2626' },
  { value: 2, label: '2 - High Priority (Plan immediately)', color: '#ea580c' },
  { value: 3, label: '3 - Medium Priority (Plan for next iteration)', color: '#ca8a04' },
  { value: 4, label: '4 - Low Priority (Backlog)', color: '#65a30d' }
] as const;

// Value Area Options
export const VALUE_AREA_OPTIONS = [
  { value: 'Business', label: 'Business', description: 'Features that directly impact business value' },
  { value: 'Architectural', label: 'Architectural', description: 'Technical improvements and infrastructure' }
] as const;

// Epic Sizing Options
export const EPIC_SIZING_OPTIONS = [
  { value: 'XS', label: 'XS (1-2 weeks)', effort: '1-2 weeks', points: 1 },
  { value: 'S', label: 'S (3-4 weeks)', effort: '3-4 weeks', points: 3 },
  { value: 'M', label: 'M (5-8 weeks)', effort: '5-8 weeks', points: 8 },
  { value: 'L', label: 'L (9-12 weeks)', effort: '9-12 weeks', points: 13 },
  { value: 'XL', label: 'XL (13+ weeks)', effort: '13+ weeks', points: 21 }
] as const;

// Risk Level Options
export const RISK_LEVEL_OPTIONS = [
  { value: 'Low', label: 'Low', color: '#10b981', description: 'Minimal risk to delivery' },
  { value: 'Medium', label: 'Medium', color: '#f59e0b', description: 'Some risk factors present' },
  { value: 'High', label: 'High', color: '#ef4444', description: 'Significant risk to delivery' },
  { value: 'Critical', label: 'Critical', color: '#dc2626', description: 'Major risk requiring immediate attention' }
] as const;

// Work Item State Options
export const WORK_ITEM_STATE_OPTIONS = [
  { value: 'New', label: 'New', color: '#6b7280' },
  { value: 'Active', label: 'Active', color: '#3b82f6' },
  { value: 'Resolved', label: 'Resolved', color: '#10b981' },
  { value: 'Closed', label: 'Closed', color: '#059669' },
  { value: 'Removed', label: 'Removed', color: '#9ca3af' }
] as const;

// Dependency Type Options
export const DEPENDENCY_TYPE_OPTIONS = [
  { value: 'Hard', label: 'Hard (Blocking)', description: 'Must be completed before dependent work can start' },
  { value: 'Soft', label: 'Soft (Coordination)', description: 'Should be coordinated but not strictly blocking' }
] as const;

// Financial Treatment Options
export const FINANCIAL_TREATMENT_OPTIONS = [
  { value: 'CAPEX', label: 'CAPEX', description: 'Capital Expenditure' },
  { value: 'OPEX', label: 'OPEX', description: 'Operating Expenditure' }
] as const;

// Team Member Options (from ADO overlay)
export const TEAM_MEMBERS = [
  {
    id: 'yash.yash',
    value: 'Yash.Yash@one.nz',
    label: 'Yash Yash (Yash.Yash@one.nz)',
    displayName: 'Yash Yash',
    email: 'Yash.Yash@one.nz'
  },
  {
    id: 'farhan.sarfraz',
    value: 'Farhan.Sarfraz@one.nz',
    label: 'Farhan Sarfraz (Farhan.Sarfraz@one.nz)',
    displayName: 'Farhan Sarfraz',
    email: 'Farhan.Sarfraz@one.nz'
  },
  {
    id: 'ashish.shivhare',
    value: 'Ashish.Shivhare@one.nz',
    label: 'Ashish Shivhare (Ashish.Shivhare@one.nz)',
    displayName: 'Ashish Shivhare',
    email: 'Ashish.Shivhare@one.nz'
  },
  {
    id: 'adrian.albuquerque',
    value: 'Adrian.Albuquerque@one.nz',
    label: 'Adrian Albuquerque (Adrian.Albuquerque@one.nz)',
    displayName: 'Adrian Albuquerque',
    email: 'Adrian.Albuquerque@one.nz'
  },
  {
    id: 'sanjeev.lokavarapu',
    value: 'Sanjeev.Lokavarapu@one.nz',
    label: 'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)',
    displayName: 'Sanjeev Lokavarapu',
    email: 'Sanjeev.Lokavarapu@one.nz'
  }
] as const;

// Default Area Paths
export const DEFAULT_AREA_PATHS = [
  'IT\\BTE Tribe',
  'IT\\BTE Tribe\\Integration and DevOps Tooling',
  'IT\\BTE Tribe\\Platform Engineering'
] as const;

// Default Iteration Paths
export const DEFAULT_ITERATIONS = [
  'IT\\Sprint\\FY26\\Q1',
  'IT\\Sprint\\FY26\\Q1\\Sprint 1',
  'IT\\Sprint\\FY26\\Q1\\Sprint 2',
  'IT\\Sprint\\FY26\\Q1\\Sprint 3'
] as const;

// ADO Field Mappings
export const ADO_FIELD_MAPPINGS = {
  // System Fields
  TITLE: 'System.Title',
  DESCRIPTION: 'System.Description',
  STATE: 'System.State',
  ASSIGNED_TO: 'System.AssignedTo',
  AREA_PATH: 'System.AreaPath',
  ITERATION_PATH: 'System.IterationPath',
  TAGS: 'System.Tags',
  
  // Microsoft VSTS Fields
  PRIORITY: 'Microsoft.VSTS.Common.Priority',
  VALUE_AREA: 'Microsoft.VSTS.Common.ValueArea',
  ACCEPTANCE_CRITERIA: 'Microsoft.VSTS.Common.AcceptanceCriteria',
  TARGET_DATE: 'Microsoft.VSTS.Scheduling.TargetDate',
  START_DATE: 'Microsoft.VSTS.Scheduling.StartDate',
  
  // Custom Fields
  EPIC_SIZING: 'Custom.EpicSizing',
  EPIC_OWNER: 'Custom.EpicOwner',
  PRODUCT_OWNER: 'Custom.ProductOwner',
  DELIVERY_LEAD: 'Custom.DeliveryLead',
  TECH_LEAD: 'Custom.TechLead',
  BUSINESS_OWNER: 'Custom.BusinessOwner',
  PROCESS_OWNER: 'Custom.ProcessOwner',
  PLATFORM_OWNER: 'Custom.PlatformOwner',
  PLANNED_START_DATE: 'Custom.PlannedStartDate',
  PLANNED_DELIVERY_DATE: 'Custom.PlannedDeliveryDate',
  OUTCOMES: 'Custom.Outcomes',
  LEADING_INDICATORS: 'Custom.LeadingIndicators',
  EPIC_ACCEPTANCE_CRITERIA: 'Custom.EpicAcceptanceCriteria',
  OUT_OF_SCOPE: 'Custom.OutofScope',
  NONFUNCTIONAL_REQUIREMENTS: 'Custom.NonfunctionalRequirements'
} as const;

// UI Constants
export const UI_CONSTANTS = {
  SIDEBAR_WIDTH: 250,
  HEADER_HEIGHT: 60,
  FOOTER_HEIGHT: 40,
  TIMELINE_ZOOM_MIN: 0.5,
  TIMELINE_ZOOM_MAX: 10,
  ANIMATION_DURATION: 200,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300
} as const;

// Test Suite Categories
export const TEST_CATEGORIES = [
  { id: 'security', name: 'Security Tests', icon: '🔒', color: '#dc2626' },
  { id: 'integration', name: 'Integration Tests', icon: '🔗', color: '#ea580c' },
  { id: 'performance', name: 'Performance Tests', icon: '⚡', color: '#ca8a04' },
  { id: 'unit', name: 'Unit Tests', icon: '🧪', color: '#059669' },
  { id: 'e2e', name: 'End-to-End Tests', icon: '🎯', color: '#7c3aed' }
] as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  EPIC_FEATURE_DEFAULTS: 'epicFeatureDefaults',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'theme',
  SIDEBAR_STATE: 'sidebarState',
  LAST_SELECTED_PROJECT: 'lastSelectedProject',
  ZOOM_LEVEL: 'zoomLevel'
} as const;

// Validation Constants
export const VALIDATION = {
  MIN_TITLE_LENGTH: 3,
  MAX_TITLE_LENGTH: 255,
  MAX_DESCRIPTION_LENGTH: 5000,
  MIN_BUDGET: 0,
  MAX_BUDGET: 10000000,
  MIN_EFFORT_HOURS: 0,
  MAX_EFFORT_HOURS: 10000,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PROJECT_ID_REGEX: /^[A-Z0-9_-]+$/i
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  GENERIC: 'An unexpected error occurred. Please try again.',
  NETWORK: 'Network error. Please check your connection and try again.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION: 'Please check your input and try again.',
  STORAGE: 'Failed to save data. Please try again.',
  LOAD: 'Failed to load data. Please refresh and try again.'
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  SAVE: 'Changes saved successfully',
  CREATE: 'Item created successfully',
  UPDATE: 'Item updated successfully',
  DELETE: 'Item deleted successfully',
  SYNC: 'Synchronization completed successfully',
  EXPORT: 'Data exported successfully',
  IMPORT: 'Data imported successfully'
} as const;

// Theme Constants
export const THEME_COLORS = {
  PRIMARY: '#4f46e5',
  PRIMARY_HOVER: '#4338ca',
  SECONDARY: '#6b7280',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  ERROR: '#ef4444',
  INFO: '#3b82f6'
} as const;

// Default Configuration Values
export const DEFAULT_CONFIG = {
  EPIC_FEATURE_DEFAULTS: {
    priority: '2',
    valueArea: 'Business' as ValueArea,
    areaPath: 'IT\\BTE Tribe',
    iterationPath: 'IT\\Sprint\\FY26\\Q1',
    epic: {
      epicSizing: 'M' as EpicSizing,
      risk: 'Medium' as RiskLevel,
      epicOwner: '',
      deliveryLead: '',
      techLead: '',
      businessOwner: '',
      processOwner: '',
      platformOwner: '',
      tags: ''
    },
    feature: {
      productOwner: '',
      deliveryLead: '',
      techLead: '',
      businessOwner: '',
      processOwner: '',
      platformOwner: '',
      tags: ''
    },
    activeIterations: DEFAULT_ITERATIONS.slice(),
    customAreaPaths: DEFAULT_AREA_PATHS.slice()
  }
} as const;

// Export utility functions for working with constants
export const getStatusColor = (status: string) => 
  STATUS_OPTIONS.find(opt => opt.value === status)?.color || '#6b7280';

export const getPriorityColor = (priority: Priority) => 
  PRIORITY_OPTIONS.find(opt => opt.value === priority)?.color || '#6b7280';

export const getRiskColor = (risk: RiskLevel) => 
  RISK_LEVEL_OPTIONS.find(opt => opt.value === risk)?.color || '#6b7280';

export const getTeamMemberByEmail = (email: string) => 
  TEAM_MEMBERS.find(member => member.email === email);

export const getEpicSizingPoints = (sizing: EpicSizing) => 
  EPIC_SIZING_OPTIONS.find(opt => opt.value === sizing)?.points || 1;