import React, { useState, useMemo, useEffect } from 'react';
import { useAppStore } from '../state/store';

interface InfoPaneProps {
  activeModule: string;
  moduleInfo: ModuleInfo;
  onNavigate?: (moduleId: string) => void;
}

export interface ModuleInfo {
  title: string;
  description: string;
  features?: string[];
  shortcuts?: Array<{ key: string; description: string }>;
  tips?: string[];
  stats?: Array<{ label: string; value: string | number }>;
  documentation?: string;
  lastUpdated?: string;
  version?: string;
  status?: 'stable' | 'beta' | 'experimental';
}

export const InfoPane: React.FC<InfoPaneProps> = ({ activeModule, moduleInfo, onNavigate }) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
  const { getProjectsAsArray, projects } = useAppStore();
  const [adoConfigs, setAdoConfigs] = useState<any[]>([]);
  const [tokenExpiry, setTokenExpiry] = useState<any>(null);
  
  // Load ADO configurations and token expiry
  useEffect(() => {
    const loadADOStatus = async () => {
      try {
        const result = await window.electronAPI.getADOConfigurationsWithExpiry();
        if (result.success && result.configurations) {
          setAdoConfigs(result.configurations);
          // Get the first enabled configuration with token
          const primaryConfig = result.configurations.find((c: any) => c.is_enabled && c.pat_token_expiry_date);
          if (primaryConfig?.tokenExpiry) {
            setTokenExpiry(primaryConfig.tokenExpiry);
          }
        }
      } catch (error) {
        console.error('Failed to load ADO status:', error);
      }
    };
    loadADOStatus();
  }, [activeModule]);
  
  // Calculate dynamic project statistics
  const projectStats = useMemo(() => {
    const projects = getProjectsAsArray();
    const totalProjects = projects.length;
    
    // Count projects by status
    const statusCounts = projects.reduce((acc, project) => {
      const status = project.status || 'unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count projects by lane
    const laneCounts = projects.reduce((acc, project) => {
      const lane = project.lane || 'Unassigned';
      acc[lane] = (acc[lane] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Count projects by financial treatment
    const financialTreatment = projects.reduce((acc, project) => {
      const treatment = project.financial_treatment || 'Unknown';
      acc[treatment] = (acc[treatment] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    // Calculate total budget
    const totalBudget = projects.reduce((sum, project) => {
      return sum + (project.budget_nzd || 0);
    }, 0);
    
    // Calculate budgets by financial treatment
    const capexBudget = projects
      .filter(p => p.financial_treatment === 'CAPEX')
      .reduce((sum, p) => sum + (p.budget_nzd || 0), 0);
    
    const opexBudget = projects
      .filter(p => p.financial_treatment === 'OPEX')
      .reduce((sum, p) => sum + (p.budget_nzd || 0), 0);
    
    // Calculate budgets by status
    const activeBudget = projects
      .filter(p => p.status === 'in-progress')
      .reduce((sum, p) => sum + (p.budget_nzd || 0), 0);
    
    const committedBudget = projects
      .filter(p => ['planned', 'in-progress'].includes(p.status))
      .reduce((sum, p) => sum + (p.budget_nzd || 0), 0);
    
    // Count unique PMs
    const uniquePMs = new Set(projects.map(p => p.pm_name).filter(Boolean)).size;
    
    // Calculate timeline metrics
    const today = new Date();
    const parseDate = (dateStr: string): Date => {
      const [day, month, year] = dateStr.split('-').map(Number);
      return new Date(year, month - 1, day);
    };
    
    const projectsStartingSoon = projects.filter(p => {
      if (!p.start_date || p.status !== 'planned') return false;
      const startDate = parseDate(p.start_date);
      const daysUntilStart = Math.ceil((startDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilStart > 0 && daysUntilStart <= 30;
    }).length;
    
    const projectsEndingSoon = projects.filter(p => {
      if (!p.end_date || !['in-progress', 'planned'].includes(p.status)) return false;
      const endDate = parseDate(p.end_date);
      const daysUntilEnd = Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return daysUntilEnd > 0 && daysUntilEnd <= 30;
    }).length;
    
    const overdueProjects = projects.filter(p => {
      if (!p.end_date || !['in-progress', 'planned'].includes(p.status)) return false;
      const endDate = parseDate(p.end_date);
      return endDate < today;
    }).length;
    
    // Calculate completion rate
    const completedCount = statusCounts['done'] || 0;
    const nonArchivedProjects = projects.filter(p => p.status !== 'archived').length;
    const completionRate = nonArchivedProjects > 0 
      ? Math.round((completedCount / nonArchivedProjects) * 100)
      : 0;
    
    // Calculate average project duration (for completed projects)
    const completedProjectsWithDates = projects.filter(p => 
      p.status === 'done' && p.start_date && p.end_date
    );
    
    let avgDuration = 0;
    if (completedProjectsWithDates.length > 0) {
      const totalDays = completedProjectsWithDates.reduce((sum, p) => {
        const start = parseDate(p.start_date);
        const end = parseDate(p.end_date);
        const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDuration = Math.round(totalDays / completedProjectsWithDates.length);
    }
    
    // Format budget in millions/thousands
    const formatBudget = (amount: number): string => {
      if (amount >= 1000000) {
        return `$${(amount / 1000000).toFixed(1)}M`;
      } else if (amount >= 1000) {
        return `$${(amount / 1000).toFixed(0)}k`;
      } else {
        return `$${amount.toFixed(0)}`;
      }
    };
    
    return {
      totalProjects: totalProjects.toString(),
      activeProjects: (statusCounts['in-progress'] || 0).toString(),
      completedProjects: (statusCounts['done'] || 0).toString(),
      plannedProjects: (statusCounts['planned'] || 0).toString(),
      blockedProjects: (statusCounts['blocked'] || 0).toString(),
      archivedProjects: (statusCounts['archived'] || 0).toString(),
      totalBudget: formatBudget(totalBudget),
      avgBudget: totalProjects > 0 ? formatBudget(totalBudget / totalProjects) : '$0',
      uniqueLanes: Object.keys(laneCounts).length.toString(),
      topLane: Object.keys(laneCounts).length > 0 ? 
        Object.entries(laneCounts).sort(([,a], [,b]) => b - a)[0][0] : 'None',
      // New statistics
      capexCount: (financialTreatment['CAPEX'] || 0).toString(),
      opexCount: (financialTreatment['OPEX'] || 0).toString(),
      capexBudget: formatBudget(capexBudget),
      opexBudget: formatBudget(opexBudget),
      activeBudget: formatBudget(activeBudget),
      committedBudget: formatBudget(committedBudget),
      uniquePMs: uniquePMs.toString(),
      avgProjectsPerPM: uniquePMs > 0 ? (totalProjects / uniquePMs).toFixed(1) : '0',
      projectsStartingSoon: projectsStartingSoon.toString(),
      projectsEndingSoon: projectsEndingSoon.toString(),
      overdueProjects: overdueProjects.toString(),
      completionRate: `${completionRate}%`,
      avgDuration: avgDuration > 0 ? `${avgDuration}d` : 'N/A'
    };
  }, [projects, getProjectsAsArray]);
  
  // Override module info with dynamic stats for projects and dashboard modules
  const enhancedModuleInfo = useMemo(() => {
    if (activeModule === 'projects') {
      return {
        ...moduleInfo,
        stats: [
          { label: 'Total Projects', value: projectStats.totalProjects },
          { label: 'Active', value: projectStats.activeProjects },
          { label: 'Completed', value: projectStats.completedProjects },
          { label: 'Planned', value: projectStats.plannedProjects },
          { label: 'Blocked', value: projectStats.blockedProjects },
          { label: 'Overdue', value: projectStats.overdueProjects },
          { label: 'Completion Rate', value: projectStats.completionRate },
          { label: 'Starting Soon (30d)', value: projectStats.projectsStartingSoon },
          { label: 'Ending Soon (30d)', value: projectStats.projectsEndingSoon },
          { label: 'Avg Duration', value: projectStats.avgDuration },
          { label: 'Unique Lanes', value: projectStats.uniqueLanes },
          { label: 'Top Lane', value: projectStats.topLane },
          { label: 'Project Managers', value: projectStats.uniquePMs },
          { label: 'Avg Projects/PM', value: projectStats.avgProjectsPerPM },
          { label: 'Total Budget', value: projectStats.totalBudget },
          { label: 'Committed Budget', value: projectStats.committedBudget },
          { label: 'Active Budget', value: projectStats.activeBudget },
          { label: 'Avg Budget', value: projectStats.avgBudget },
          { label: 'CAPEX Projects', value: projectStats.capexCount },
          { label: 'CAPEX Budget', value: projectStats.capexBudget },
          { label: 'OPEX Projects', value: projectStats.opexCount },
          { label: 'OPEX Budget', value: projectStats.opexBudget }
        ],
        lastUpdated: new Date().toLocaleDateString()
      };
    } else if (activeModule === 'dashboard') {
      return {
        ...moduleInfo,
        stats: [
          { label: 'Modules', value: '12' },
          { label: 'Total Projects', value: projectStats.totalProjects },
          { label: 'Active', value: projectStats.activeProjects },
          { label: 'Completed', value: projectStats.completedProjects },
          { label: 'Blocked', value: projectStats.blockedProjects },
          { label: 'Overdue', value: projectStats.overdueProjects },
          { label: 'Completion Rate', value: projectStats.completionRate },
          { label: 'Starting Soon (30d)', value: projectStats.projectsStartingSoon },
          { label: 'Ending Soon (30d)', value: projectStats.projectsEndingSoon },
          { label: 'Total Budget', value: projectStats.totalBudget },
          { label: 'Committed Budget', value: projectStats.committedBudget },
          { label: 'CAPEX Budget', value: projectStats.capexBudget },
          { label: 'OPEX Budget', value: projectStats.opexBudget },
          { label: 'Project Managers', value: projectStats.uniquePMs }
        ],
        lastUpdated: new Date().toLocaleDateString()
      };
    }
    return moduleInfo;
  }, [activeModule, moduleInfo, projectStats, projects]);

  const toggleSection = (sectionId: string) => {
    const newCollapsed = new Set(collapsedSections);
    if (newCollapsed.has(sectionId)) {
      newCollapsed.delete(sectionId);
    } else {
      newCollapsed.add(sectionId);
    }
    setCollapsedSections(newCollapsed);
  };

  const InfoSection: React.FC<{
    id: string;
    title: string;
    icon: string;
    children: React.ReactNode;
    collapsible?: boolean;
  }> = ({ id, title, icon, children, collapsible = true }) => {
    const isCollapsed = collapsedSections.has(id);
    
    return (
      <div className="info-section">
        <div 
          className="info-section-title"
          onClick={() => collapsible && toggleSection(id)}
          style={{ 
            cursor: collapsible ? 'pointer' : 'default',
            userSelect: 'none'
          }}
        >
          <span>{icon}</span>
          <span>{title}</span>
          {collapsible && (
            <span style={{ marginLeft: 'auto', fontSize: '12px' }}>
              {isCollapsed ? '▶' : '▼'}
            </span>
          )}
        </div>
        {(!collapsible || !isCollapsed) && (
          <div className="info-section-content">
            {children}
          </div>
        )}
      </div>
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'stable': return '#28a745';
      case 'beta': return '#ffc107';
      case 'experimental': return '#dc3545';
      default: return '#6c757d';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'stable': return '✅';
      case 'beta': return '🚧';
      case 'experimental': return '⚗️';
      default: return '📋';
    }
  };

  return (
    <div className="dashboard-info">
      <div className="info-header">
        <h3 className="info-title">{enhancedModuleInfo.title}</h3>
        {enhancedModuleInfo.status && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            marginTop: '8px',
            fontSize: '12px',
            color: getStatusColor(enhancedModuleInfo.status),
            fontWeight: '500'
          }}>
            <span>{getStatusIcon(enhancedModuleInfo.status)}</span>
            <span style={{ textTransform: 'capitalize' }}>{enhancedModuleInfo.status}</span>
            {enhancedModuleInfo.version && (
              <span style={{ color: '#7f8c8d', marginLeft: '8px' }}>
                v{enhancedModuleInfo.version}
              </span>
            )}
          </div>
        )}
        
        {/* ADO Token Expiry Display */}
        {tokenExpiry && (
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            borderRadius: '6px',
            backgroundColor: tokenExpiry.isExpired 
              ? '#fff5f5' 
              : tokenExpiry.willExpireSoon 
              ? '#fffbf0' 
              : '#f0f8ff',
            border: `1px solid ${tokenExpiry.isExpired 
              ? '#dc3545' 
              : tokenExpiry.willExpireSoon 
              ? '#ffc107' 
              : '#90caf9'}`,
            display: 'flex',
            flexDirection: 'column',
            gap: '4px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              fontSize: '11px',
              fontWeight: '600',
              color: tokenExpiry.isExpired 
                ? '#dc3545' 
                : tokenExpiry.willExpireSoon 
                ? '#f57c00' 
                : '#1976d2'
            }}>
              <span>🔗</span>
              <span>ADO Token Status</span>
              {tokenExpiry.isExpired && <span>⚠️</span>}
              {!tokenExpiry.isExpired && tokenExpiry.willExpireSoon && <span>⚠️</span>}
            </div>
            <div style={{
              fontSize: '10px',
              color: tokenExpiry.isExpired 
                ? '#c62828' 
                : tokenExpiry.willExpireSoon 
                ? '#e65100' 
                : '#5a6c7d',
              fontWeight: tokenExpiry.isExpired || tokenExpiry.willExpireSoon ? '600' : 'normal'
            }}>
              {tokenExpiry.isExpired 
                ? `❌ Expired ${Math.abs(tokenExpiry.daysUntilExpiry)} day${Math.abs(tokenExpiry.daysUntilExpiry) !== 1 ? 's' : ''} ago` 
                : tokenExpiry.willExpireSoon
                ? `⏳ Expires in ${tokenExpiry.daysUntilExpiry} day${tokenExpiry.daysUntilExpiry !== 1 ? 's' : ''}`
                : `✅ Valid until ${tokenExpiry.expiryDate}`}
            </div>
          </div>
        )}
      </div>

      <div className="info-content">
        {/* Quick Actions Section */}
        <InfoSection id="actions" title="Quick Actions" icon="⚡">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button 
              className="btn primary"
              style={{ 
                fontSize: '12px',
                padding: '8px 12px',
                width: '100%',
                justifyContent: 'center'
              }}
              onClick={() => onNavigate?.('quick-task')}
            >
              ⚡ Quick Task
            </button>
            
            {/* Renew Token Button with Expiry Display */}
            <button 
              className="btn secondary"
              style={{ 
                fontSize: '12px',
                padding: '8px 12px',
                width: '100%',
                justifyContent: 'center',
                position: 'relative',
                borderColor: tokenExpiry?.isExpired ? '#dc3545' : tokenExpiry?.willExpireSoon ? '#ffc107' : undefined,
                backgroundColor: tokenExpiry?.isExpired ? '#fff5f5' : tokenExpiry?.willExpireSoon ? '#fffbf0' : undefined
              }}
              onClick={() => onNavigate?.('ado-config')}
              title={tokenExpiry?.expiryDate ? `Token expires: ${tokenExpiry.expiryDate}` : 'Manage ADO Integration'}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔗</span>
                  <span>Renew Token</span>
                  {tokenExpiry?.isExpired && <span style={{ color: '#dc3545' }}>⚠️</span>}
                  {!tokenExpiry?.isExpired && tokenExpiry?.willExpireSoon && <span style={{ color: '#ffc107' }}>⚠️</span>}
                </div>
                {tokenExpiry?.expiryDate && (
                  <div style={{ 
                    fontSize: '10px', 
                    color: tokenExpiry.isExpired ? '#dc3545' : tokenExpiry.willExpireSoon ? '#f57c00' : '#7f8c8d',
                    fontWeight: tokenExpiry.isExpired || tokenExpiry.willExpireSoon ? '600' : 'normal'
                  }}>
                    {tokenExpiry.isExpired 
                      ? `Expired ${Math.abs(tokenExpiry.daysUntilExpiry)} days ago` 
                      : tokenExpiry.willExpireSoon
                      ? `Expires in ${tokenExpiry.daysUntilExpiry} day${tokenExpiry.daysUntilExpiry !== 1 ? 's' : ''}`
                      : `Expires: ${tokenExpiry.expiryDate}`}
                  </div>
                )}
              </div>
            </button>
            
            <button 
              className="btn secondary"
              style={{ 
                fontSize: '12px',
                padding: '6px 12px',
                width: '100%',
                justifyContent: 'center'
              }}
              onClick={() => console.log('Refresh module:', activeModule)}
            >
              🔄 Refresh Module
            </button>
            <button 
              className="btn secondary"
              style={{ 
                fontSize: '12px',
                padding: '6px 12px',
                width: '100%',
                justifyContent: 'center'
              }}
              onClick={() => onNavigate?.('export-import')}
            >
              📤 Export Data
            </button>
          </div>
        </InfoSection>

        {/* Statistics Section */}
        {enhancedModuleInfo.stats && enhancedModuleInfo.stats.length > 0 && (
          <InfoSection id="stats" title="Statistics" icon="📊">
            <div className="stats-grid">
              {enhancedModuleInfo.stats.map((stat, index) => (
                <div key={index} className="stat-item">
                  <div className="stat-number">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Shortcuts Section */}
        {enhancedModuleInfo.shortcuts && enhancedModuleInfo.shortcuts.length > 0 && (
          <InfoSection id="shortcuts" title="Keyboard Shortcuts" icon="⌨️">
            <div style={{ fontSize: '12px' }}>
              {enhancedModuleInfo.shortcuts.map((shortcut, index) => (
                <div 
                  key={index}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '6px 0',
                    borderBottom: index < enhancedModuleInfo.shortcuts!.length - 1 ? '1px solid #f1f3f4' : 'none'
                  }}
                >
                  <span style={{ color: '#5a6c7d' }}>{shortcut.description}</span>
                  <code style={{
                    background: '#f8f9fa',
                    padding: '2px 6px',
                    borderRadius: '3px',
                    fontSize: '11px',
                    color: '#2c3e50',
                    fontWeight: '500'
                  }}>
                    {shortcut.key}
                  </code>
                </div>
              ))}
            </div>
          </InfoSection>
        )}

        {/* Documentation Section */}
        {enhancedModuleInfo.documentation && (
          <InfoSection id="documentation" title="Documentation" icon="📚">
            <div style={{ 
              fontSize: '12px',
              lineHeight: 1.6,
              whiteSpace: 'pre-line'
            }}>
              {enhancedModuleInfo.documentation}
            </div>
          </InfoSection>
        )}
      </div>
    </div>
  );
};