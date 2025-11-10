-- Insert Epics for Cloud Migration 2 project
INSERT OR REPLACE INTO epics (
  id, project_id, title, description, state, effort, business_value, time_criticality,
  start_date_iso, end_date_iso, start_date_nz, end_date_nz,
  assigned_to, area_path, iteration_path, risk, value_area, sort_order,
  created_at, updated_at
) VALUES 
(
  'EPIC-CM2-PLATFORM-SEC',
  'PROJ-1762388020575-3S4ZN',
  '[Platform] | Security as Code Implementation',
  'Implement comprehensive security scanning and compliance tools',
  'Active',
  25,
  85,
  2,
  '2025-01-15T00:00:00.000Z',
  '2025-06-30T00:00:00.000Z',
  '15-01-2025',
  '30-06-2025',
  'Yash Yash (Yash.Yash@one.nz)',
  'IT\\BTE Tribe',
  'IT\\Sprint\\FY26\\Q1',
  'Medium',
  'Architectural',
  1,
  datetime('now'),
  datetime('now')
),
(
  'EPIC-CM2-INTEGRATION-API',
  'PROJ-1762388020575-3S4ZN',
  '[Integration] | API Gateway Modernization',
  'Modernize API gateway infrastructure for better performance',
  'New',
  15,
  70,
  3,
  '2025-02-01T00:00:00.000Z',
  '2025-05-15T00:00:00.000Z',
  '01-02-2025',
  '15-05-2025',
  'Farhan Sarfraz (Farhan.Sarfraz@one.nz)',
  'IT\\BTE Tribe',
  'IT\\Sprint\\FY26\\Q1',
  'Low',
  'Business',
  2,
  datetime('now'),
  datetime('now')
);

-- Insert Features for the Security as Code epic
INSERT OR REPLACE INTO features (
  id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
  start_date_iso, end_date_iso, start_date_nz, end_date_nz,
  assigned_to, area_path, iteration_path, risk, value_area, sort_order,
  created_at, updated_at
) VALUES 
(
  'FEAT-CM2-STATIC-ANALYSIS',
  'EPIC-CM2-PLATFORM-SEC',
  'PROJ-1762388020575-3S4ZN',
  'Static Code Analysis Integration',
  'Integrate SonarQube for static code analysis',
  'Active',
  8,
  75,
  2,
  '2025-01-15T00:00:00.000Z',
  '2025-02-28T00:00:00.000Z',
  '15-01-2025',
  '28-02-2025',
  'Ashish Shivhare (Ashish.Shivhare@one.nz)',
  'IT\\BTE Tribe\\Integration and DevOps Tooling',
  'IT\\Sprint\\FY26\\Q1\\Sprint 1',
  'Low',
  'Architectural',
  1,
  datetime('now'),
  datetime('now')
),
(
  'FEAT-CM2-CONTAINER-SEC',
  'EPIC-CM2-PLATFORM-SEC',
  'PROJ-1762388020575-3S4ZN',
  'Container Security Scanning',
  'Implement Twistlock for container security scanning',
  'New',
  5,
  80,
  1,
  '2025-03-01T00:00:00.000Z',
  '2025-03-31T00:00:00.000Z',
  '01-03-2025',
  '31-03-2025',
  'Adrian Albuquerque (Adrian.Albuquerque@one.nz)',
  'IT\\BTE Tribe\\Integration and DevOps Tooling',
  'IT\\Sprint\\FY26\\Q1\\Sprint 2',
  'Medium',
  'Architectural',
  2,
  datetime('now'),
  datetime('now')
);

-- Insert Feature for the API Gateway epic
INSERT OR REPLACE INTO features (
  id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
  start_date_iso, end_date_iso, start_date_nz, end_date_nz,
  assigned_to, area_path, iteration_path, risk, value_area, sort_order,
  created_at, updated_at
) VALUES 
(
  'FEAT-CM2-API-RATE-LIMIT',
  'EPIC-CM2-INTEGRATION-API',
  'PROJ-1762388020575-3S4ZN',
  'API Rate Limiting',
  'Implement rate limiting for API endpoints',
  'New',
  3,
  60,
  3,
  '2025-02-15T00:00:00.000Z',
  '2025-03-15T00:00:00.000Z',
  '15-02-2025',
  '15-03-2025',
  'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)',
  'IT\\BTE Tribe\\Integration and DevOps Tooling',
  'IT\\Sprint\\FY26\\Q1\\Sprint 2',
  'Low',
  'Business',
  1,
  datetime('now'),
  datetime('now')
);
