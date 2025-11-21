/**
 * Governance Module Information for InfoPane integration
 */

export interface ModuleInfo {
  id: string;
  title: string;
  description: string;
  icon: string;
  features?: string[];
  relatedModules?: string[];
  documentation?: string;
}

export const governanceModuleInfo: Record<string, ModuleInfo> = {
  'governance-dashboard': {
    id: 'governance-dashboard',
    title: 'Portfolio Governance Dashboard',
    description: 'Executive-level portfolio health monitoring with real-time metrics, stage gate tracking, and compliance alerts.',
    icon: '🎯',
    features: [
      'Portfolio Health Score (5-component weighted)',
      'Projects distribution across stage gates',
      'Compliance alerts with severity levels',
      'Open actions tracking by priority',
      'Active escalations monitoring',
      'Benefits at risk indicators',
      'Recent governance decisions timeline'
    ],
    relatedModules: ['governance-analytics', 'projects', 'coordinator'],
    documentation: '/docs/governance/dashboard'
  },
  'governance-analytics': {
    id: 'governance-analytics',
    title: 'Portfolio Analytics',
    description: 'Advanced portfolio analytics with risk vs value heatmap, health trends, gate progression metrics, and compliance analytics.',
    icon: '📊',
    features: [
      'Risk vs Value Heatmap visualization',
      'Portfolio health trend analysis (30/90/180 days)',
      'Gate progression analytics (avg days, stuck projects)',
      'Compliance rate by policy breakdown',
      'Top violators identification',
      'Status-based filtering',
      'Exportable charts and reports'
    ],
    relatedModules: ['governance-dashboard', 'projects'],
    documentation: '/docs/governance/analytics'
  }
};

/**
 * Get governance module info by ID
 */
export const getGovernanceModuleInfo = (moduleId: string): ModuleInfo | null => {
  return governanceModuleInfo[moduleId] || null;
};

/**
 * Get all governance modules
 */
export const getAllGovernanceModules = (): ModuleInfo[] => {
  return Object.values(governanceModuleInfo);
};
