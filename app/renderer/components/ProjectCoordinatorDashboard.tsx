import React, { useState, useEffect } from 'react';
import { ImportManager } from './ImportManager';

interface TabProps {
  id: string;
  label: string;
  icon: string;
}

export const ProjectCoordinatorDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [importCounts, setImportCounts] = useState({
    timesheets: 0,
    actuals: 0,
    labourRates: 0
  });

  useEffect(() => {
    loadImportCounts();
  }, []);

  const loadImportCounts = async () => {
    try {
      if (window.electronAPI?.coordinator?.getImportCounts) {
        const counts = await window.electronAPI.coordinator.getImportCounts();
        setImportCounts(counts);
      }
    } catch (error) {
      console.error('Failed to load import counts:', error);
    }
  };

  const tabs: TabProps[] = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'imports', label: 'Import Data', icon: '📥' },
    { id: 'resources', label: 'Resources', icon: '👥' },
    { id: 'capacity', label: 'Capacity', icon: '⚡' },
    { id: 'variances', label: 'Variances', icon: '⚠️' },
    { id: 'financials', label: 'Financials', icon: '💰' },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return renderOverview();
      case 'imports':
        return <ImportManager onImportComplete={loadImportCounts} />;
      case 'resources':
        return renderResourcesTab();
      case 'capacity':
        return renderCapacityTab();
      case 'variances':
        return renderVariancesTab();
      case 'financials':
        return renderFinancialsTab();
      default:
        return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="coordinator-overview">
      <h2>Project Coordinator Overview</h2>
      
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">📄</div>
          <div className="stat-content">
            <div className="stat-label">Timesheet Records</div>
            <div className="stat-value">{importCounts.timesheets.toLocaleString()}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💵</div>
          <div className="stat-content">
            <div className="stat-label">Actual Cost Records</div>
            <div className="stat-value">{importCounts.actuals.toLocaleString()}</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">💲</div>
          <div className="stat-content">
            <div className="stat-label">Labour Rates</div>
            <div className="stat-value">{importCounts.labourRates}</div>
          </div>
        </div>
      </div>

      <div className="coordinator-info">
        <h3>Available Features</h3>
        <ul className="feature-list">
          <li>
            <strong>Import Data:</strong> Import timesheets, actuals from SAP, and labour rates
          </li>
          <li>
            <strong>Resources:</strong> Manage FTE, SOW contractors, and external squads
          </li>
          <li>
            <strong>Capacity:</strong> Track resource commitments and availability
          </li>
          <li>
            <strong>Variances:</strong> Monitor allocation, capacity, schedule, and cost variances
          </li>
          <li>
            <strong>Financials:</strong> View P&L, project budgets, and financial reports
          </li>
        </ul>
      </div>

      <div className="quick-actions">
        <h3>Quick Actions</h3>
        <div className="action-buttons">
          <button 
            className="btn btn-primary"
            onClick={() => setActiveTab('imports')}
          >
            📥 Import Data
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('capacity')}
          >
            ⚡ View Capacity
          </button>
          <button 
            className="btn btn-secondary"
            onClick={() => setActiveTab('variances')}
          >
            ⚠️ Check Variances
          </button>
        </div>
      </div>
    </div>
  );

  const renderResourcesTab = () => (
    <div className="resources-tab">
      <h2>Resource Management</h2>
      <p className="coming-soon">🚧 Resource management UI coming soon</p>
      <div className="info-box">
        <p>This will allow you to:</p>
        <ul>
          <li>View and manage financial resources (FTE, SOW, External Squad)</li>
          <li>Set resource commitments (hours per day/week/fortnight)</li>
          <li>Link resources to ADO identities</li>
          <li>Allocate resources to Features</li>
        </ul>
      </div>
    </div>
  );

  const renderCapacityTab = () => (
    <div className="capacity-tab">
      <h2>Capacity Planning</h2>
      <p className="coming-soon">🚧 Capacity dashboard coming soon</p>
      <div className="info-box">
        <p>This will show:</p>
        <ul>
          <li>Total capacity vs allocated hours per resource</li>
          <li>Utilization percentages</li>
          <li>Over-commitment warnings</li>
          <li>Available capacity for new work</li>
        </ul>
      </div>
    </div>
  );

  const renderVariancesTab = () => (
    <div className="variances-tab">
      <h2>Variance Detection</h2>
      <p className="coming-soon">🚧 Variance dashboard coming soon</p>
      <div className="info-box">
        <p>This will detect:</p>
        <ul>
          <li>⚠️ Timesheets without allocations (unauthorized work)</li>
          <li>📊 Allocation variances (hours vs forecast)</li>
          <li>🚨 Capacity exceeded (over-committed resources)</li>
          <li>📅 Schedule variances (milestone delays)</li>
          <li>💰 Cost variances (budget overruns)</li>
        </ul>
      </div>
    </div>
  );

  const renderFinancialsTab = () => (
    <div className="financials-tab">
      <h2>Financial Reports</h2>
      <p className="coming-soon">🚧 Financial reporting coming soon</p>
      <div className="info-box">
        <p>This will provide:</p>
        <ul>
          <li>Project P&L (Profit & Loss)</li>
          <li>Forecast vs Actual cost tracking</li>
          <li>CAPEX vs OPEX breakdown</li>
          <li>Workstream-level financial details</li>
          <li>Export to Excel for further analysis</li>
        </ul>
      </div>
    </div>
  );

  return (
    <div className="project-coordinator-dashboard">
      <div className="coordinator-header">
        <h1>💰 Project Coordinator</h1>
        <p className="subtitle">Financial tracking, resource management, and variance analysis</p>
      </div>

      <div className="coordinator-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="tab-icon">{tab.icon}</span>
            <span className="tab-label">{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="coordinator-content">
        {renderTabContent()}
      </div>

      <style>{`
        .project-coordinator-dashboard {
          padding: 20px;
          max-width: 1400px;
          margin: 0 auto;
        }

        .coordinator-header {
          margin-bottom: 30px;
        }

        .coordinator-header h1 {
          font-size: 2rem;
          margin: 0 0 8px 0;
          color: var(--text-primary, #1a1a1a);
        }

        .subtitle {
          color: var(--text-secondary, #666);
          margin: 0;
          font-size: 1rem;
        }

        .coordinator-tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
          border-bottom: 2px solid var(--border-color, #e0e0e0);
          padding-bottom: 0;
        }

        .tab-button {
          background: none;
          border: none;
          padding: 12px 20px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          color: var(--text-secondary, #666);
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          position: relative;
          top: 2px;
        }

        .tab-button:hover {
          color: var(--primary-color, #2563eb);
          background: var(--hover-bg, #f3f4f6);
        }

        .tab-button.active {
          color: var(--primary-color, #2563eb);
          border-bottom-color: var(--primary-color, #2563eb);
          font-weight: 600;
        }

        .tab-icon {
          font-size: 1.2rem;
        }

        .coordinator-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .coordinator-overview h2 {
          margin-top: 0;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin: 24px 0;
        }

        .stat-card {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 20px;
          background: var(--bg-secondary, #f9fafb);
          border-radius: 8px;
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-content {
          flex: 1;
        }

        .stat-label {
          font-size: 0.875rem;
          color: var(--text-secondary, #666);
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 1.75rem;
          font-weight: 700;
          color: var(--text-primary, #1a1a1a);
        }

        .coordinator-info,
        .quick-actions {
          margin-top: 32px;
        }

        .coordinator-info h3,
        .quick-actions h3 {
          font-size: 1.25rem;
          margin-bottom: 16px;
          color: var(--text-primary, #1a1a1a);
        }

        .feature-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }

        .feature-list li {
          padding: 12px 0;
          border-bottom: 1px solid var(--border-color, #e5e7eb);
        }

        .feature-list li:last-child {
          border-bottom: none;
        }

        .action-buttons {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 0.95rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: inline-flex;
          align-items: center;
          gap: 8px;
        }

        .btn-primary {
          background: var(--primary-color, #2563eb);
          color: white;
        }

        .btn-primary:hover {
          background: var(--primary-hover, #1d4ed8);
        }

        .btn-secondary {
          background: var(--bg-secondary, #f3f4f6);
          color: var(--text-primary, #1a1a1a);
          border: 1px solid var(--border-color, #e5e7eb);
        }

        .btn-secondary:hover {
          background: var(--hover-bg, #e5e7eb);
        }

        .coming-soon {
          font-size: 1.25rem;
          color: var(--text-secondary, #666);
          text-align: center;
          padding: 40px 20px;
        }

        .info-box {
          background: var(--bg-info, #eff6ff);
          border: 1px solid var(--border-info, #bfdbfe);
          border-radius: 8px;
          padding: 20px;
          margin-top: 20px;
        }

        .info-box p {
          margin: 0 0 12px 0;
          font-weight: 600;
          color: var(--text-primary, #1a1a1a);
        }

        .info-box ul {
          margin: 0;
          padding-left: 24px;
        }

        .info-box li {
          margin: 8px 0;
          color: var(--text-secondary, #4b5563);
        }
      `}</style>
    </div>
  );
};
