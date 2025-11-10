/**
 * Governance Dashboard - Portfolio health and key metrics overview
 */

import React, { useEffect } from 'react';
import { useGovernanceStore } from '../stores/governanceStore';
import '../styles/governance.css';

export const GovernanceDashboard: React.FC = () => {
  const {
    dashboard,
    portfolioHealth,
    loading,
    error,
    fetchDashboard,
    refreshMetrics,
    clearError
  } = useGovernanceStore();

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleRefresh = async () => {
    await refreshMetrics();
  };

  if (loading.dashboard) {
    return (
      <div className="governance-dashboard loading">
        <div className="loading-spinner">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="governance-dashboard error">
        <div className="error-message">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button onClick={() => { clearError(); fetchDashboard(); }}>Retry</button>
        </div>
      </div>
    );
  }

  if (!dashboard || !portfolioHealth) {
    return (
      <div className="governance-dashboard empty">
        <p>No dashboard data available</p>
        <button onClick={fetchDashboard}>Load Dashboard</button>
      </div>
    );
  }

  return (
    <div className="governance-dashboard">
      <div className="dashboard-header">
        <h1>Portfolio Governance Dashboard</h1>
        <button className="refresh-button" onClick={handleRefresh}>
          Refresh Metrics
        </button>
      </div>

      {/* Portfolio Health Score */}
      <section className="health-score-section">
        <h2>Portfolio Health Score</h2>
        <div className="health-score-card">
          <div className="score-main">
            <div className={`score-value score-${portfolioHealth.scoreBand.color}`}>
              {portfolioHealth.totalScore}
            </div>
            <div className="score-band">{portfolioHealth.scoreBand.label}</div>
          </div>
          <div className="score-components">
            <div className="component">
              <span className="label">On-Time Delivery</span>
              <span className="value">{portfolioHealth.components.onTimeScore}%</span>
            </div>
            <div className="component">
              <span className="label">Budget Performance</span>
              <span className="value">{portfolioHealth.components.budgetScore}%</span>
            </div>
            <div className="component">
              <span className="label">Risk Management</span>
              <span className="value">{portfolioHealth.components.riskScore}%</span>
            </div>
            <div className="component">
              <span className="label">Compliance</span>
              <span className="value">{portfolioHealth.components.complianceScore}%</span>
            </div>
            <div className="component">
              <span className="label">Benefits Realization</span>
              <span className="value">{portfolioHealth.components.benefitsScore}%</span>
            </div>
          </div>
          <div className="calculated-at">
            Calculated: {new Date(portfolioHealth.calculatedAt).toLocaleString()}
          </div>
        </div>
      </section>

      {/* Projects by Gate */}
      <section className="projects-by-gate-section">
        <h2>Projects by Stage Gate</h2>
        <div className="gate-distribution">
          {Object.entries(dashboard.projectsByGate).map(([gateId, gateInfo]) => (
            <div key={gateId} className="gate-card">
              <div className="gate-name">{gateInfo.gateName}</div>
              <div className="gate-count">{gateInfo.count}</div>
              <div className="gate-projects">projects</div>
            </div>
          ))}
        </div>
      </section>

      <div className="dashboard-grid">
        {/* Compliance Alerts */}
        <section className="compliance-alerts-section">
          <h2>Compliance Alerts</h2>
          <div className={`alert-card alert-${dashboard.overdueCompliance.severity}`}>
            <div className="alert-count">{dashboard.overdueCompliance.count}</div>
            <div className="alert-label">Overdue Items</div>
            <div className="alert-severity">Severity: {dashboard.overdueCompliance.severity}</div>
          </div>
        </section>

        {/* Open Actions */}
        <section className="open-actions-section">
          <h2>Open Actions</h2>
          <div className="actions-summary">
            <div className="action-stat">
              <span className="stat-label">Total Open</span>
              <span className="stat-value">{dashboard.openActions.total}</span>
            </div>
            <div className="action-stat critical">
              <span className="stat-label">Overdue</span>
              <span className="stat-value">{dashboard.openActions.overdue}</span>
            </div>
            <div className="action-stat warning">
              <span className="stat-label">Due This Week</span>
              <span className="stat-value">{dashboard.openActions.dueThisWeek}</span>
            </div>
          </div>
          <div className="actions-by-priority">
            <h3>By Priority</h3>
            <div className="priority-breakdown">
              <div className="priority-item">
                <span>Critical</span>
                <span>{dashboard.openActions.byPriority.critical || 0}</span>
              </div>
              <div className="priority-item">
                <span>High</span>
                <span>{dashboard.openActions.byPriority.high || 0}</span>
              </div>
              <div className="priority-item">
                <span>Medium</span>
                <span>{dashboard.openActions.byPriority.medium || 0}</span>
              </div>
              <div className="priority-item">
                <span>Low</span>
                <span>{dashboard.openActions.byPriority.low || 0}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Escalations */}
        <section className="escalations-section">
          <h2>Active Escalations</h2>
          <div className="escalation-count">
            <div className="count-value">{dashboard.escalatedItems}</div>
            <div className="count-label">Projects Escalated</div>
          </div>
        </section>

        {/* Benefits at Risk */}
        <section className="benefits-risk-section">
          <h2>Benefits at Risk</h2>
          <div className="risk-count">
            <div className="count-value">{dashboard.benefitsAtRisk}</div>
            <div className="count-label">Benefits at Risk</div>
          </div>
        </section>
      </div>

      {/* Recent Decisions */}
      <section className="recent-decisions-section">
        <h2>Recent Governance Decisions</h2>
        {dashboard.recentDecisions.length > 0 ? (
          <div className="decisions-list">
            {dashboard.recentDecisions.map((decision, index) => (
              <div key={index} className="decision-item">
                <div className="decision-type">{decision.decision_type}</div>
                <div className="decision-summary">{decision.decision_summary}</div>
                <div className="decision-date">
                  {new Date(decision.decision_date).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="no-data">No recent decisions</p>
        )}
      </section>
    </div>
  );
};
