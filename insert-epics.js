const Database = require('better-sqlite3');
const path = require('path');
const os = require('os');

// Find the database
const dbPath = path.join(os.homedir(), 'AppData', 'Roaming', 'Electron', 'roadmap.db');
console.log('Opening database at:', dbPath);

const db = new Database(dbPath);

// Insert Epics
console.log('Inserting epics...');
const insertEpic = db.prepare(`
  INSERT OR REPLACE INTO epics (
    id, project_id, title, description, state, effort, business_value, time_criticality,
    start_date_iso, end_date_iso, start_date_nz, end_date_nz,
    assigned_to, area_path, iteration_path, risk, value_area, sort_order,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const epics = [
  {
    id: 'EPIC-CM2-PLATFORM-SEC',
    project_id: 'PROJ-1762388020575-3S4ZN',
    title: '[Platform] | Security as Code Implementation',
    description: 'Implement comprehensive security scanning and compliance tools',
    state: 'Active',
    effort: 25,
    business_value: 85,
    time_criticality: 2,
    start_date_iso: '2025-01-15T00:00:00.000Z',
    end_date_iso: '2025-06-30T00:00:00.000Z',
    start_date_nz: '15-01-2025',
    end_date_nz: '30-06-2025',
    assigned_to: 'Yash Yash (Yash.Yash@one.nz)',
    area_path: 'IT\\BTE Tribe',
    iteration_path: 'IT\\Sprint\\FY26\\Q1',
    risk: 'Medium',
    value_area: 'Architectural',
    sort_order: 1
  },
  {
    id: 'EPIC-CM2-INTEGRATION-API',
    project_id: 'PROJ-1762388020575-3S4ZN',
    title: '[Integration] | API Gateway Modernization',
    description: 'Modernize API gateway infrastructure for better performance',
    state: 'New',
    effort: 15,
    business_value: 70,
    time_criticality: 3,
    start_date_iso: '2025-02-01T00:00:00.000Z',
    end_date_iso: '2025-05-15T00:00:00.000Z',
    start_date_nz: '01-02-2025',
    end_date_nz: '15-05-2025',
    assigned_to: 'Farhan Sarfraz (Farhan.Sarfraz@one.nz)',
    area_path: 'IT\\BTE Tribe',
    iteration_path: 'IT\\Sprint\\FY26\\Q1',
    risk: 'Low',
    value_area: 'Business',
    sort_order: 2
  }
];

epics.forEach(epic => {
  insertEpic.run(
    epic.id, epic.project_id, epic.title, epic.description, epic.state,
    epic.effort, epic.business_value, epic.time_criticality,
    epic.start_date_iso, epic.end_date_iso, epic.start_date_nz, epic.end_date_nz,
    epic.assigned_to, epic.area_path, epic.iteration_path, epic.risk, epic.value_area, epic.sort_order
  );
  console.log('Inserted epic:', epic.title);
});

// Insert Features
console.log('\nInserting features...');
const insertFeature = db.prepare(`
  INSERT OR REPLACE INTO features (
    id, epic_id, project_id, title, description, state, effort, business_value, time_criticality,
    start_date_iso, end_date_iso, start_date_nz, end_date_nz,
    assigned_to, area_path, iteration_path, risk, value_area, sort_order,
    created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
`);

const features = [
  {
    id: 'FEAT-CM2-STATIC-ANALYSIS',
    epic_id: 'EPIC-CM2-PLATFORM-SEC',
    project_id: 'PROJ-1762388020575-3S4ZN',
    title: 'Static Code Analysis Integration',
    description: 'Integrate SonarQube for static code analysis',
    state: 'Active',
    effort: 8,
    business_value: 75,
    time_criticality: 2,
    start_date_iso: '2025-01-15T00:00:00.000Z',
    end_date_iso: '2025-02-28T00:00:00.000Z',
    start_date_nz: '15-01-2025',
    end_date_nz: '28-02-2025',
    assigned_to: 'Ashish Shivhare (Ashish.Shivhare@one.nz)',
    area_path: 'IT\\BTE Tribe\\Integration and DevOps Tooling',
    iteration_path: 'IT\\Sprint\\FY26\\Q1\\Sprint 1',
    risk: 'Low',
    value_area: 'Architectural',
    sort_order: 1
  },
  {
    id: 'FEAT-CM2-CONTAINER-SEC',
    epic_id: 'EPIC-CM2-PLATFORM-SEC',
    project_id: 'PROJ-1762388020575-3S4ZN',
    title: 'Container Security Scanning',
    description: 'Implement Twistlock for container security scanning',
    state: 'New',
    effort: 5,
    business_value: 80,
    time_criticality: 1,
    start_date_iso: '2025-03-01T00:00:00.000Z',
    end_date_iso: '2025-03-31T00:00:00.000Z',
    start_date_nz: '01-03-2025',
    end_date_nz: '31-03-2025',
    assigned_to: 'Adrian Albuquerque (Adrian.Albuquerque@one.nz)',
    area_path: 'IT\\BTE Tribe\\Integration and DevOps Tooling',
    iteration_path: 'IT\\Sprint\\FY26\\Q1\\Sprint 2',
    risk: 'Medium',
    value_area: 'Architectural',
    sort_order: 2
  },
  {
    id: 'FEAT-CM2-API-RATE-LIMIT',
    epic_id: 'EPIC-CM2-INTEGRATION-API',
    project_id: 'PROJ-1762388020575-3S4ZN',
    title: 'API Rate Limiting',
    description: 'Implement rate limiting for API endpoints',
    state: 'New',
    effort: 3,
    business_value: 60,
    time_criticality: 3,
    start_date_iso: '2025-02-15T00:00:00.000Z',
    end_date_iso: '2025-03-15T00:00:00.000Z',
    start_date_nz: '15-02-2025',
    end_date_nz: '15-03-2025',
    assigned_to: 'Sanjeev Lokavarapu (Sanjeev.Lokavarapu@one.nz)',
    area_path: 'IT\\BTE Tribe\\Integration and DevOps Tooling',
    iteration_path: 'IT\\Sprint\\FY26\\Q1\\Sprint 2',
    risk: 'Low',
    value_area: 'Business',
    sort_order: 1
  }
];

features.forEach(feature => {
  insertFeature.run(
    feature.id, feature.epic_id, feature.project_id, feature.title, feature.description, feature.state,
    feature.effort, feature.business_value, feature.time_criticality,
    feature.start_date_iso, feature.end_date_iso, feature.start_date_nz, feature.end_date_nz,
    feature.assigned_to, feature.area_path, feature.iteration_path, feature.risk, feature.value_area, feature.sort_order
  );
  console.log('Inserted feature:', feature.title);
});

// Verify inserts
console.log('\nVerifying data...');
const epicCount = db.prepare('SELECT COUNT(*) as count FROM epics WHERE project_id = ?').get('PROJ-1762388020575-3S4ZN');
const featureCount = db.prepare('SELECT COUNT(*) as count FROM features WHERE project_id = ?').get('PROJ-1762388020575-3S4ZN');

console.log(`\nTotal epics for Cloud Migration 2: ${epicCount.count}`);
console.log(`Total features for Cloud Migration 2: ${featureCount.count}`);

console.log('\n✅ Data inserted successfully!');

db.close();
