/**
 * app.js - Bootstrap and Dependency Injection
 * 
 * Creates all module instances with proper dependency injection
 * and exposes the main PRDIntegration orchestrator globally.
 * 
 * This follows the PRD pattern for dependency management.
 */

import DateUtils from './date-utils.js';
import DataPersistenceManager from './data-persistence-manager.js';
import ProjectManager from './project-manager.js';
import TaskManager from './task-manager.js';
import ResourceManager from './resource-manager.js';
import FinancialManager from './financial-manager.js';
import ForecastingEngine from './forecasting-engine.js';
import CSVManager from './csv-manager.js';
import PRDIntegration from './prd-integration.js';

// Initialize all dependencies in correct order
const dataPM = new DataPersistenceManager();
const projectManager = new ProjectManager(dataPM);
const resourceManager = new ResourceManager(projectManager);
const taskManager = new TaskManager(projectManager, resourceManager);
const financialManager = new FinancialManager(projectManager, resourceManager, taskManager);
const forecastingEngine = new ForecastingEngine(projectManager, taskManager, resourceManager, financialManager);
const csvManager = new CSVManager();

// Create main orchestrator
const prdIntegration = new PRDIntegration({
  dataPM,
  projectManager, 
  taskManager,
  resourceManager,
  financialManager,
  forecastingEngine,
  csvManager
});

// Expose globally as per PRD requirements
if (typeof window !== 'undefined') {
  window.prdIntegration = prdIntegration;
  
  // Also expose individual managers for direct access if needed
  window.roadmapManagers = {
    dataPM,
    projectManager,
    taskManager, 
    resourceManager,
    financialManager,
    forecastingEngine,
    csvManager,
    dateUtils: DateUtils
  };
}

// Initialize UI functionality when DOM is ready
function initializeUI() {
  console.log('Initializing UI handlers...');
  
  // Initialize based on current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  switch (currentPage) {
    case 'launchpad.html':
      initializeLaunchpad();
      break;
    case 'index.html':
      initializeTimeline();
      break;
    case 'project-details.html':
      initializeProjectDetails();
      break;
    default:
      console.log('Unknown page:', currentPage);
      initializeLaunchpad(); // fallback
  }
}

// Launchpad navigation handlers
function initializeLaunchpad() {
  console.log('Initializing launchpad...');
  
  const btnRoadmap = document.getElementById('btn-roadmap');
  const btnDetails = document.getElementById('btn-details');
  const btnRoadmap = document.getElementById('btn-roadmap');
  const btnDetails = document.getElementById('btn-details');
  const btnTable = document.getElementById('btn-table');
  
  if (btnRoadmap) {
    btnRoadmap.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Navigating to timeline view...');
      window.location.href = 'index.html';
    });
    console.log('Timeline button handler attached');
  }
  
  if (btnDetails) {
    btnDetails.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Navigating to project details...');
      window.location.href = 'project-details.html';
    });
    console.log('Project details button handler attached');
  }
  
  if (btnTable) {
    btnTable.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Table view not yet implemented');
      showNotification('Table view coming soon! Use Timeline View or Project Details for now.', 'info');
    });
    console.log('Table button handler attached');
  }
  
  console.log('Launchpad navigation initialized successfully');
}

// Timeline page handlers
function initializeTimeline() {
  console.log('Initializing timeline view...');
  
  const btnAddProject = document.getElementById('btn-add-project');
  const btnExportCSV = document.getElementById('btn-export-csv');
  const btnImportCSV = document.getElementById('btn-import-csv');
  const fileImportCSV = document.getElementById('file-import-csv');
  
  if (btnAddProject) {
    btnAddProject.addEventListener('click', () => {
      console.log('Add project clicked');
      window.location.href = 'project-details.html';
    });
  }
  
  if (btnExportCSV && window.roadmapManagers) {
    btnExportCSV.addEventListener('click', async () => {
      try {
        const projects = window.roadmapManagers.projectManager.listProjects();
        const csvData = window.roadmapManagers.csvManager.exportProjectsToCSV(projects);
        downloadCSV(csvData, 'projects-export.csv');
        showNotification('Projects exported successfully!', 'success');
      } catch (error) {
        console.error('Export failed:', error);
        showNotification('Export failed: ' + error.message, 'error');
      }
    });
  }
  
  if (btnImportCSV && fileImportCSV) {
    btnImportCSV.addEventListener('click', () => {
      fileImportCSV.click();
    });
    
    fileImportCSV.addEventListener('change', handleCSVImport);
  }
  
  // Load and render existing projects
  loadTimelineProjects();
  
  console.log('Timeline view initialized successfully');
}

// Project details page handlers
function initializeProjectDetails() {
  console.log('Initializing project details...');
  
  const projectForm = document.getElementById('project-form');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Form submission
  if (projectForm) {
    projectForm.addEventListener('submit', handleProjectFormSubmit);
  }
  
  // Tab switching
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      switchTab(tabId, tabButtons, tabContents);
    });
  });
  
  console.log('Project details initialized successfully');
}

// Helper functions
function showNotification(message, type = 'info') {
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 5px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    animation: slideIn 0.3s ease-out;
  `;
  
  switch (type) {
    case 'success':
      notification.style.backgroundColor = '#28a745';
      break;
    case 'error':
      notification.style.backgroundColor = '#dc3545';
      break;
    case 'warning':
      notification.style.backgroundColor = '#ffc107';
      notification.style.color = '#212529';
      break;
    default:
      notification.style.backgroundColor = '#17a2b8';
  }
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    notification.remove();
  }, 3000);
}

function downloadCSV(csvData, filename) {
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.setAttribute('hidden', '');
  a.setAttribute('href', url);
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function handleCSVImport(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const csvData = e.target.result;
      if (window.roadmapManagers) {
        const projects = window.roadmapManagers.csvManager.parseProjectsFromCSV(csvData);
        // Import projects
        projects.forEach(projectData => {
          try {
            window.roadmapManagers.projectManager.createProject(projectData);
          } catch (error) {
            console.warn('Failed to import project:', error.message);
          }
        });
        showNotification(`Imported ${projects.length} projects successfully!`, 'success');
        // Reload timeline if we're on that page
        if (window.location.pathname.includes('index.html')) {
          loadTimelineProjects();
        }
      }
    } catch (error) {
      console.error('Import failed:', error);
      showNotification('Import failed: ' + error.message, 'error');
    }
  };
  reader.readAsText(file);
}

function loadTimelineProjects() {
  if (!window.roadmapManagers) {
    console.warn('Roadmap managers not available yet');
    return;
  }
  
  try {
    const projects = window.roadmapManagers.projectManager.listProjects();
    console.log(`Loaded ${projects.length} projects for timeline`);
    
    const container = document.getElementById('timeline-container');
    if (container) {
      container.innerHTML = '';
      
      if (projects.length === 0) {
        container.innerHTML = '<p class="no-projects">No projects found. <a href="project-details.html">Create your first project</a></p>';
        return;
      }
      
      projects.forEach(project => {
        const projectBar = createProjectBar(project);
        container.appendChild(projectBar);
      });
    }
  } catch (error) {
    console.error('Failed to load timeline projects:', error);
  }
}

function createProjectBar(project) {
  const bar = document.createElement('div');
  bar.className = `project-bar ${project.status}`;
  bar.dataset.id = project.id;
  bar.innerHTML = `
    <div class="project-info">
      <h4>${project.title}</h4>
      <span class="project-dates">${project.start_date} - ${project.end_date}</span>
      <span class="project-budget">$${(project.budget_cents / 100).toLocaleString()}</span>
    </div>
  `;
  
  bar.addEventListener('click', () => {
    window.location.href = `project-details.html?id=${project.id}`;
  });
  
  return bar;
}

function handleProjectFormSubmit(event) {
  event.preventDefault();
  
  if (!window.roadmapManagers) {
    showNotification('System not ready. Please refresh the page.', 'error');
    return;
  }
  
  try {
    const formData = {
      title: document.getElementById('input-title').value,
      start_date: document.getElementById('input-start-date').value,
      end_date: document.getElementById('input-end-date').value,
      budget_cents: parseInt(document.getElementById('input-budget').value.replace(/[^0-9]/g, '')) * 100,
      financial_treatment: document.getElementById('select-financial-treatment').value
    };
    
    const project = window.roadmapManagers.projectManager.createProject(formData);
    showNotification('Project created successfully!', 'success');
    
    // Clear form
    event.target.reset();
    
  } catch (error) {
    console.error('Failed to create project:', error);
    showNotification('Failed to create project: ' + error.message, 'error');
  }
}

function switchTab(activeTabId, tabButtons, tabContents) {
  // Remove active class from all tabs and contents
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to selected tab and content
  const activeButton = document.querySelector(`[data-tab="${activeTabId}"]`);
  const activeContent = document.getElementById(`${activeTabId}-tab`);
  
  if (activeButton) activeButton.classList.add('active');
  if (activeContent) activeContent.classList.add('active');
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUI);
  } else {
    initializeUI();
  }
}

// Export for module usage
export default prdIntegration;
export {
  dataPM,
  projectManager,
  taskManager,
  resourceManager, 
  financialManager,
  forecastingEngine,
  csvManager,
  DateUtils
};
