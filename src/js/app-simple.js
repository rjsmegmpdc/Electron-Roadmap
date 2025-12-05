/**
 * Simple App.js - UI Only Version
 * 
 * This version focuses on immediate UI functionality without complex module dependencies.
 * Perfect for getting the application running quickly.
 */

console.log('🚀 Roadmap Tool v2 - Simple UI Loading...');

// Simple data storage using localStorage
const SimpleStorage = {
  getProjects() {
    try {
      return JSON.parse(localStorage.getItem('roadmap-projects') || '[]');
    } catch {
      return [];
    }
  },
  
  saveProject(project) {
    const projects = this.getProjects();
    project.id = project.id || 'proj-' + Date.now();
    project.status = project.status || 'concept-design';
    projects.push(project);
    localStorage.setItem('roadmap-projects', JSON.stringify(projects));
    return project;
  },
  
  getAllProjects() {
    return this.getProjects();
  }
};

// Initialize UI functionality when DOM is ready
function initializeUI() {
  // Prevent duplicate initialization
  if (window.uiInitialized) {
    console.log('⚠️ UI already initialized, skipping...');
    return;
  }
  window.uiInitialized = true;
  
  console.log('🔧 Initializing UI handlers...');
  
  // Get current page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  console.log('📄 Current page:', currentPage);
  
  // Add a small delay to ensure DOM is fully loaded
  setTimeout(() => {
    // Improved page detection logic
    if (currentPage === 'launchpad.html') {
      initializeLaunchpad();
    } else if (currentPage === 'project-details.html') {
      initializeProjectDetails();
    } else {
      // Default to timeline for most pages (index.html, test pages, demo pages, etc.)
      console.log('📅 Initializing as timeline page:', currentPage);
      initializeTimeline();
    }
    
    // Always try universal button initialization as backup
    setTimeout(() => {
      initializeUniversalButtons();
    }, 200);
  }, 100);
}

// Launchpad navigation handlers
function initializeLaunchpad() {
  console.log('🏠 Initializing launchpad...');
  
  const btnRoadmap = document.getElementById('btn-roadmap');
  const btnDetails = document.getElementById('btn-details');
  const btnTable = document.getElementById('btn-table');
  
  console.log('🔍 Button elements found:', {
    roadmap: !!btnRoadmap,
    details: !!btnDetails,
    table: !!btnTable
  });
  
  if (btnRoadmap) {
    btnRoadmap.addEventListener('click', (e) => {
      console.log('🎯 Timeline button clicked!');
      e.preventDefault();
      window.location.href = 'index.html';
    });
    console.log('✅ Timeline button handler attached');
  }
  
  if (btnDetails) {
    btnDetails.addEventListener('click', (e) => {
      console.log('🎯 Project details button clicked!');
      e.preventDefault();
      window.location.href = 'project-details.html';
    });
    console.log('✅ Project details button handler attached');
  }
  
  if (btnTable) {
    btnTable.addEventListener('click', (e) => {
      console.log('🎯 Table button clicked!');
      e.preventDefault();
      showNotification('Table view coming soon! Use Timeline View or Project Details for now.', 'info');
    });
    console.log('✅ Table button handler attached');
  }
  
  console.log('✅ Launchpad navigation initialized successfully');
}

// Timeline page handlers
function initializeTimeline() {
  console.log('📊 Initializing timeline view...');
  
  const btnAddProject = document.getElementById('btn-add-project');
  const btnExportCSV = document.getElementById('btn-export-csv');
  const btnImportCSV = document.getElementById('btn-import-csv');
  const fileImportCSV = document.getElementById('file-import-csv');
  
  // Zoom control buttons
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnResetZoom = document.getElementById('btn-reset-zoom');
  const btnGoToToday = document.getElementById('btn-go-to-today');
  
  if (btnAddProject) {
    btnAddProject.addEventListener('click', () => {
      console.log('➕ Add project clicked');
      window.location.href = 'project-details.html';
    });
  }
  
  if (btnExportCSV && !btnExportCSV.hasAttribute('data-handler-attached')) {
    btnExportCSV.setAttribute('data-handler-attached', 'true');
    btnExportCSV.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('📤 Export CSV button clicked');
      const projects = SimpleStorage.getAllProjects();
      console.log(`Found ${projects.length} projects for export`);
      exportProjectsCSV(projects);
    });
    console.log('✅ Export CSV handler attached');
  }
  
  // CSV Import functionality
  if (btnImportCSV && !btnImportCSV.hasAttribute('data-handler-attached')) {
    btnImportCSV.setAttribute('data-handler-attached', 'true');
    btnImportCSV.addEventListener('click', (e) => {
      e.preventDefault();
      console.log('📥 Import CSV button clicked');
      if (fileImportCSV) {
        fileImportCSV.click();
      }
    });
    console.log('✅ Import CSV handler attached');
  }
  
  if (fileImportCSV && !fileImportCSV.hasAttribute('data-handler-attached')) {
    fileImportCSV.setAttribute('data-handler-attached', 'true');
    fileImportCSV.addEventListener('change', handleCSVImport);
    console.log('✅ File input handler attached');
  }
  
  // Zoom control handlers
  if (btnZoomIn && !btnZoomIn.hasAttribute('data-handler-attached')) {
    btnZoomIn.setAttribute('data-handler-attached', 'true');
    btnZoomIn.addEventListener('click', () => {
      console.log('🔍 Zoom in clicked');
      timelineZoom('in');
    });
    console.log('✅ Zoom in handler attached');
  }
  
  if (btnZoomOut && !btnZoomOut.hasAttribute('data-handler-attached')) {
    btnZoomOut.setAttribute('data-handler-attached', 'true');
    btnZoomOut.addEventListener('click', () => {
      console.log('🔍 Zoom out clicked');
      timelineZoom('out');
    });
    console.log('✅ Zoom out handler attached');
  }
  
  if (btnResetZoom && !btnResetZoom.hasAttribute('data-handler-attached')) {
    btnResetZoom.setAttribute('data-handler-attached', 'true');
    btnResetZoom.addEventListener('click', () => {
      console.log('🔄 Reset zoom clicked');
      timelineZoom('reset');
    });
    console.log('✅ Reset zoom handler attached');
  }
  
  // Today button handler
  if (btnGoToToday && !btnGoToToday.hasAttribute('data-handler-attached')) {
    btnGoToToday.setAttribute('data-handler-attached', 'true');
    btnGoToToday.addEventListener('click', () => {
      console.log('📅 Go to Today clicked');
      goToToday();
    });
    console.log('✅ Go to Today handler attached');
  }
  
  // Load and display projects
  loadTimelineProjects();
  
  console.log('✅ Timeline view initialized successfully');
}

// Universal button initialization (backup for any page)
function initializeUniversalButtons() {
  console.log('🌐 Initializing universal buttons...');
  
  // Zoom control buttons
  const btnZoomIn = document.getElementById('btn-zoom-in');
  const btnZoomOut = document.getElementById('btn-zoom-out');
  const btnResetZoom = document.getElementById('btn-reset-zoom');
  const btnGoToToday = document.getElementById('btn-go-to-today');
  
  // Only attach if not already attached
  if (btnZoomIn && !btnZoomIn.hasAttribute('data-handler-attached')) {
    btnZoomIn.setAttribute('data-handler-attached', 'true');
    btnZoomIn.addEventListener('click', () => {
      console.log('🔍 Universal: Zoom in clicked');
      if (typeof timelineZoom === 'function') {
        timelineZoom('in');
      } else {
        console.error('❌ timelineZoom function not available');
      }
    });
    console.log('✅ Universal: Zoom in handler attached');
  }
  
  if (btnZoomOut && !btnZoomOut.hasAttribute('data-handler-attached')) {
    btnZoomOut.setAttribute('data-handler-attached', 'true');
    btnZoomOut.addEventListener('click', () => {
      console.log('🔍 Universal: Zoom out clicked');
      if (typeof timelineZoom === 'function') {
        timelineZoom('out');
      } else {
        console.error('❌ timelineZoom function not available');
      }
    });
    console.log('✅ Universal: Zoom out handler attached');
  }
  
  if (btnResetZoom && !btnResetZoom.hasAttribute('data-handler-attached')) {
    btnResetZoom.setAttribute('data-handler-attached', 'true');
    btnResetZoom.addEventListener('click', () => {
      console.log('🔄 Universal: Reset zoom clicked');
      if (typeof timelineZoom === 'function') {
        timelineZoom('reset');
      } else {
        console.error('❌ timelineZoom function not available');
      }
    });
    console.log('✅ Universal: Reset zoom handler attached');
  }
  
  if (btnGoToToday && !btnGoToToday.hasAttribute('data-handler-attached')) {
    btnGoToToday.setAttribute('data-handler-attached', 'true');
    btnGoToToday.addEventListener('click', () => {
      console.log('📅 Universal: Go to Today clicked');
      if (typeof goToToday === 'function') {
        goToToday();
      } else {
        console.error('❌ goToToday function not available');
      }
    });
    console.log('✅ Universal: Go to Today handler attached');
  }
  
  console.log('✅ Universal button initialization complete');
}

// Project details page handlers
function initializeProjectDetails() {
  console.log('📋 Initializing project details...');
  
  const projectForm = document.getElementById('project-form');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabContents = document.querySelectorAll('.tab-content');
  
  // Form submission
  if (projectForm) {
    projectForm.addEventListener('submit', handleProjectFormSubmit);
    console.log('✅ Project form handler attached');
  }
  
  // Date validation setup
  initializeDateValidation();
  
  // Tab switching
  tabButtons.forEach((button, index) => {
    button.addEventListener('click', () => {
      const tabId = button.getAttribute('data-tab');
      console.log('🔄 Switching to tab:', tabId);
      switchTab(tabId, tabButtons, tabContents);
    });
  });
  
  console.log('✅ Project details initialized successfully');
}

// Initialize date validation for project form
function initializeDateValidation() {
  console.log('📅 Initializing date validation...');
  
  const startDateInput = document.getElementById('input-start-date');
  const endDateInput = document.getElementById('input-end-date');
  const startDateError = document.getElementById('err-start-date');
  const endDateError = document.getElementById('err-end-date');
  
  if (!startDateInput || !endDateInput) {
    console.log('⚠️ Date inputs not found, skipping date validation');
    return;
  }
  
  // Set default dates (start: today, end: April 1st next year)
  const today = new Date();
  const april1stNextYear = new Date(today.getFullYear() + 1, 3, 1); // April is month 3 (0-indexed)
  
  if (!startDateInput.value) {
    startDateInput.value = today.toISOString().split('T')[0];
  }
  if (!endDateInput.value) {
    endDateInput.value = april1stNextYear.toISOString().split('T')[0];
  }
  
  // Validation function
  function validateDates() {
    const startDate = new Date(startDateInput.value);
    const endDate = new Date(endDateInput.value);
    
    // Clear previous errors
    if (startDateError) startDateError.textContent = '';
    if (endDateError) endDateError.textContent = '';
    
    let hasError = false;
    
    // Check if dates are valid
    if (startDateInput.value && isNaN(startDate.getTime())) {
      if (startDateError) startDateError.textContent = 'Please enter a valid start date';
      startDateInput.style.borderColor = '#dc3545';
      hasError = true;
    } else {
      startDateInput.style.borderColor = '#e0e0e0';
    }
    
    if (endDateInput.value && isNaN(endDate.getTime())) {
      if (endDateError) endDateError.textContent = 'Please enter a valid end date';
      endDateInput.style.borderColor = '#dc3545';
      hasError = true;
    } else {
      endDateInput.style.borderColor = '#e0e0e0';
    }
    
    // Check date relationship
    if (startDateInput.value && endDateInput.value && !isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
      if (startDate >= endDate) {
        if (endDateError) endDateError.textContent = 'End date must be after start date';
        endDateInput.style.borderColor = '#dc3545';
        startDateInput.style.borderColor = '#dc3545';
        hasError = true;
      } else {
        // Success state
        startDateInput.style.borderColor = '#28a745';
        endDateInput.style.borderColor = '#28a745';
        
        // Show project duration
        const durationMs = endDate - startDate;
        const durationDays = Math.ceil(durationMs / (1000 * 60 * 60 * 24));
        const durationWeeks = Math.ceil(durationDays / 7);
        const durationMonths = Math.ceil(durationDays / 30);
        
        let durationText = `Project duration: ${durationDays} days`;
        if (durationDays > 14) {
          durationText += ` (~${durationWeeks} weeks)`;
        }
        if (durationDays > 60) {
          durationText += ` (~${durationMonths} months)`;
        }
        
        if (endDateError) {
          endDateError.textContent = durationText;
          endDateError.style.color = '#28a745';
        }
      }
    }
    
    return !hasError;
  }
  
  // Add event listeners
  startDateInput.addEventListener('change', validateDates);
  startDateInput.addEventListener('blur', validateDates);
  endDateInput.addEventListener('change', validateDates);
  endDateInput.addEventListener('blur', validateDates);
  
  // Initial validation
  setTimeout(validateDates, 100);
  
  console.log('✅ Date validation initialized');
}

// Universal button initialization (backup for any page)
function showNotification(message, type = 'info') {
  console.log(`📢 Notification (${type}):`, message);
  
  // Remove any existing notifications
  const existingNotifications = document.querySelectorAll('.notification');
  existingNotifications.forEach(n => n.remove());
  
  // Create a simple notification
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  
  // Styling
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
    max-width: 400px;
    word-wrap: break-word;
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
  
  // Auto-remove after 4 seconds
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 4000);
}

function loadTimelineProjects() {
  console.log('📂 Loading timeline projects...');
  
  try {
    const projects = SimpleStorage.getAllProjects();
    console.log(`Found ${projects.length} projects`);
    
    // Debug: log each project in detail
    projects.forEach((project, index) => {
      console.log(`Project ${index + 1}:`, {
        id: project.id,
        title: project.title,
        start_date: project.start_date,
        end_date: project.end_date,
        status: project.status,
        budget_cents: project.budget_cents,
        hasValidDates: !!(project.start_date && project.end_date)
      });
      
      // Extra validation logging
      if (!project.start_date || !project.end_date) {
        console.warn(`⚠️ Project "${project.title}" missing dates:`, {
          start_date: project.start_date,
          end_date: project.end_date
        });
      }
    });
    
    const container = document.getElementById('timeline-container');
    if (!container) {
      console.warn('⚠️ Timeline container not found');
      return;
    }
    
    container.innerHTML = '';
    
    if (projects.length === 0) {
      container.innerHTML = `
        <div style="text-align: center; padding: 40px; color: #666;">
          <h3>No projects found</h3>
          <p>Create your first project to get started!</p>
          <a href="project-details.html" style="color: #007bff; text-decoration: none; font-weight: bold;">Create Project →</a>
        </div>
      `;
      return;
    }
    
    // Use the new timeline renderer instead of simple project cards
    console.log('📅 Switching to timeline view...');
    TimelineRenderer.renderTimeline();
    
    console.log(`📊 Timeline rendered with ${projects.length} projects`);
    showNotification(`Timeline loaded with ${projects.length} projects!`, 'success');
    
  } catch (error) {
    console.error('❌ Failed to load timeline projects:', error);
    showNotification('Failed to load projects: ' + error.message, 'error');
  }
}

function createProjectBar(project) {
  const bar = document.createElement('div');
  bar.className = `project-bar ${project.status || 'concept-design'}`;
  bar.dataset.id = project.id;
  
  bar.style.cssText = `
    background: #f8f9fa;
    border-left: 5px solid #007bff;
    margin: 10px 0;
    padding: 15px;
    border-radius: 5px;
    cursor: pointer;
    transition: all 0.2s ease;
    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  `;
  
  bar.innerHTML = `
    <div class="project-info" style="display: flex; justify-content: space-between; align-items: center;">
      <div>
        <h4 style="margin: 0 0 5px 0; color: #333;">${project.title || 'Untitled Project'}</h4>
        <span style="color: #666; font-size: 0.9em;">
          ${project.start_date || 'No start date'} - ${project.end_date || 'No end date'}
        </span>
      </div>
      <div style="text-align: right;">
        <div style="font-weight: bold; color: #28a745;">
          $${project.budget_cents ? (project.budget_cents / 100).toLocaleString() : '0'}
        </div>
        <div style="font-size: 0.8em; color: #666;">
          ${project.status || 'concept-design'}
        </div>
      </div>
    </div>
  `;
  
  bar.addEventListener('mouseenter', () => {
    bar.style.backgroundColor = '#e9ecef';
    bar.style.transform = 'translateY(-2px)';
    bar.style.boxShadow = '0 4px 8px rgba(0,0,0,0.15)';
  });
  
  bar.addEventListener('mouseleave', () => {
    bar.style.backgroundColor = '#f8f9fa';
    bar.style.transform = 'translateY(0)';
    bar.style.boxShadow = '0 2px 4px rgba(0,0,0,0.1)';
  });
  
  bar.addEventListener('click', () => {
    console.log('🎯 Project bar clicked:', project.id);
    window.location.href = `project-details.html?id=${project.id}`;
  });
  
  return bar;
}

function handleProjectFormSubmit(event) {
  event.preventDefault();
  console.log('📝 Form submitted');
  
  try {
    const formData = {
      title: document.getElementById('input-title')?.value || '',
      start_date: document.getElementById('input-start-date')?.value || '',
      end_date: document.getElementById('input-end-date')?.value || '',
      budget_cents: parseFloat(document.getElementById('input-budget')?.value || '0') * 100,
      financial_treatment: document.getElementById('select-financial-treatment')?.value || 'OPEX'
    };
    
    console.log('📊 Form data:', formData);
    
    // Basic validation
    if (!formData.title) {
      throw new Error('Project title is required');
    }
    
    if (!formData.start_date) {
      throw new Error('Start date is required');
    }
    
    if (!formData.end_date) {
      throw new Error('End date is required');
    }
    
    // Date validation - ensure end date is after start date
    const startDate = new Date(formData.start_date);
    const endDate = new Date(formData.end_date);
    
    if (startDate >= endDate) {
      throw new Error('End date must be after start date');
    }
    
    // Check if dates are valid
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new Error('Please enter valid dates');
    }
    
    const project = SimpleStorage.saveProject(formData);
    console.log('✅ Project saved:', project);
    
    showNotification('Project created successfully!', 'success');
    
    // Clear form
    event.target.reset();
    
    // Optional: redirect to timeline after 2 seconds
    setTimeout(() => {
      if (confirm('Project created! Go to timeline view?')) {
        window.location.href = 'index.html';
      }
    }, 2000);
    
  } catch (error) {
    console.error('❌ Failed to create project:', error);
    showNotification('Failed to create project: ' + error.message, 'error');
  }
}

function switchTab(activeTabId, tabButtons, tabContents) {
  console.log('🔄 Switching to tab:', activeTabId);
  
  // Remove active class from all tabs and contents
  tabButtons.forEach(btn => btn.classList.remove('active'));
  tabContents.forEach(content => content.classList.remove('active'));
  
  // Add active class to selected tab and content
  const activeButton = document.querySelector(`[data-tab="${activeTabId}"]`);
  const activeContent = document.getElementById(`${activeTabId}-tab`);
  
  if (activeButton) {
    activeButton.classList.add('active');
    console.log('✅ Tab button activated:', activeTabId);
  }
  if (activeContent) {
    activeContent.classList.add('active');
    console.log('✅ Tab content activated:', activeTabId);
  }
}

function exportProjectsCSV(projects) {
  console.log('📤 Exporting projects to CSV...');
  
  if (projects.length === 0) {
    showNotification('No projects to export', 'warning');
    return;
  }
  
  try {
    // CSV Headers
    const headers = ['Title', 'Start Date', 'End Date', 'Budget', 'Status', 'Financial Treatment'];
    const csvRows = [headers.join(',')];
    
    console.log(`📄 Creating CSV with ${projects.length} projects...`);
    
    // Add each project as a row
    projects.forEach((project, index) => {
      const row = [
        `"${(project.title || '').replace(/"/g, '""')}"`, // Escape quotes in title
        `"${project.start_date || ''}"`,
        `"${project.end_date || ''}"`,
        project.budget_cents ? (project.budget_cents / 100) : 0,
        `"${project.status || 'concept-design'}"`,
        `"${project.financial_treatment || 'OPEX'}"`
      ];
      csvRows.push(row.join(','));
      console.log(`✅ Added row ${index + 1}: ${project.title}`);
    });
    
    // Create CSV content with proper line breaks
    const csvContent = csvRows.join('\r\n');
    console.log(`📄 CSV Content Preview:`);
    console.log(csvContent.substring(0, 200) + '...');
    
    // Create blob with proper MIME type
    const blob = new Blob([csvContent], { 
      type: 'text/csv;charset=utf-8;' 
    });
    const url = window.URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = 'roadmap-projects-' + new Date().toISOString().split('T')[0] + '.csv';
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    showNotification('Projects exported successfully!', 'success');
    
  } catch (error) {
    console.error('❌ CSV export failed:', error);
    showNotification('Export failed: ' + error.message, 'error');
  }
}

// CSV Import function
function handleCSVImport(event) {
  console.log('📥 Handling CSV import...');
  
  const file = event.target.files[0];
  if (!file) {
    console.log('⚠️ No file selected');
    return;
  }
  
  if (!file.name.toLowerCase().endsWith('.csv')) {
    showNotification('Please select a CSV file', 'error');
    return;
  }
  
  console.log(`📄 Reading CSV file: ${file.name} (${file.size} bytes)`);
  
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const csvContent = e.target.result;
      console.log('📄 CSV content loaded, parsing...');
      
      const projects = parseCSVContent(csvContent);
      if (projects.length === 0) {
        showNotification('No valid projects found in CSV file', 'warning');
        return;
      }
      
      // Ask user for confirmation
      const confirmMessage = `Import ${projects.length} projects from CSV?\n\nThis will add to your existing projects.`;
      if (confirm(confirmMessage)) {
        importProjects(projects);
      } else {
        console.log('❌ CSV import cancelled by user');
      }
      
    } catch (error) {
      console.error('❌ Failed to parse CSV:', error);
      showNotification('Failed to parse CSV file: ' + error.message, 'error');
    }
  };
  
  reader.onerror = function() {
    console.error('❌ Failed to read CSV file');
    showNotification('Failed to read CSV file', 'error');
  };
  
  reader.readAsText(file);
  
  // Reset file input
  event.target.value = '';
}

// Parse CSV content into project objects
function parseCSVContent(csvContent) {
  console.log('🔍 Parsing CSV content...');
  
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim());
  if (lines.length < 2) {
    throw new Error('CSV file must have at least a header row and one data row');
  }
  
  const headerLine = lines[0];
  const headers = headerLine.split(',').map(h => h.trim().replace(/^"|"$/g, ''));
  
  console.log('📄 CSV Headers found:', headers);
  
  // Expected headers
  const expectedHeaders = ['Title', 'Start Date', 'End Date', 'Budget', 'Status', 'Financial Treatment'];
  const headerMap = {};
  
  // Map headers (case-insensitive)
  expectedHeaders.forEach(expected => {
    const foundIndex = headers.findIndex(h => 
      h.toLowerCase().includes(expected.toLowerCase()) || 
      expected.toLowerCase().includes(h.toLowerCase())
    );
    if (foundIndex >= 0) {
      headerMap[expected] = foundIndex;
    }
  });
  
  console.log('🗺 Header mapping:', headerMap);
  
  const projects = [];
  
  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    try {
      const values = parseCSVLine(line);
      console.log(`🔍 Parsing row ${i}:`, values);
      
      const project = {
        title: values[headerMap['Title']] || `Imported Project ${i}`,
        start_date: values[headerMap['Start Date']] || '',
        end_date: values[headerMap['End Date']] || '',
        budget_cents: parseFloat(values[headerMap['Budget']] || '0') * 100,
        status: values[headerMap['Status']] || 'concept-design',
        financial_treatment: values[headerMap['Financial Treatment']] || 'OPEX'
      };
      
      // Clean up the project data
      project.title = project.title.replace(/^"|"$/g, '');
      project.start_date = project.start_date.replace(/^"|"$/g, '');
      project.end_date = project.end_date.replace(/^"|"$/g, '');
      project.status = project.status.replace(/^"|"$/g, '');
      project.financial_treatment = project.financial_treatment.replace(/^"|"$/g, '');
      
      if (project.title) {
        projects.push(project);
        console.log(`✅ Parsed project: ${project.title}`);
      }
      
    } catch (error) {
      console.warn(`⚠️ Failed to parse row ${i}: ${error.message}`);
    }
  }
  
  console.log(`✅ Successfully parsed ${projects.length} projects`);
  return projects;
}

// Simple CSV line parser
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        current += '"';
        i++; // Skip next quote
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // End of field
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  values.push(current);
  
  return values;
}

// Import projects into storage
function importProjects(projects) {
  console.log(`📥 Importing ${projects.length} projects...`);
  
  let importedCount = 0;
  const errors = [];
  
  projects.forEach((project, index) => {
    try {
      SimpleStorage.saveProject(project);
      importedCount++;
      console.log(`✅ Imported project ${index + 1}: ${project.title}`);
    } catch (error) {
      errors.push(`Project ${index + 1}: ${error.message}`);
      console.error(`❌ Failed to import project ${index + 1}:`, error);
    }
  });
  
  // Show results
  if (importedCount > 0) {
    showNotification(`Successfully imported ${importedCount} projects!`, 'success');
    
    // Refresh the timeline display
    setTimeout(() => {
      loadTimelineProjects();
    }, 1000);
  }
  
  if (errors.length > 0) {
    console.warn('⚠️ Import errors:', errors);
    showNotification(`Imported ${importedCount} projects with ${errors.length} errors. Check console for details.`, 'warning');
  }
  
  console.log(`✅ Import complete: ${importedCount} successful, ${errors.length} errors`);
}

// Timeline visualization system
const TimelineRenderer = {
  // Timeline configuration with time-based zoom levels
  config: {
    yearHeaderHeight: 30,  // height of year indicator row
    timelineHeight: 60,    // height of date header
    projectHeight: 50,     // height of each project bar
    projectSpacing: 10,    // spacing between project bars
    todayMarkerWidth: 4,   // width of today marker
    timelineStartYear: 2025, // timeline always starts from January 1st of this year
    rowHeight: 70,         // height of each row (project height + spacing)
    minRows: 3,            // minimum number of rows to display
    maxRows: 10,           // maximum number of rows before adding scroll
    maxVisibleRows: 8      // maximum visible drop zones (includes empty rows)
  },
  
  // Row management system
  rowManager: {
    // Calculate optimal row assignments to minimize overlaps
    assignProjectsToRows(projects) {
      const rows = [];
      const sortedProjects = [...projects].sort((a, b) => {
        const aStart = a.start_date ? new Date(a.start_date) : new Date();
        const bStart = b.start_date ? new Date(b.start_date) : new Date();
        return aStart - bStart;
      });
      
      sortedProjects.forEach(project => {
        // Use existing row assignment if available
        if (typeof project.row === 'number' && project.row >= 0) {
          // Ensure row exists
          while (rows.length <= project.row) {
            rows.push([]);
          }
          rows[project.row].push(project);
        } else {
          // Find best available row
          const assignedRow = this.findBestRow(project, rows);
          project.row = assignedRow;
          rows[assignedRow].push(project);
        }
      });
      
      return { rows, totalRows: rows.length };
    },
    
    // Find the best row for a project (least conflicts)
    findBestRow(project, existingRows) {
      const projectStart = project.start_date ? new Date(project.start_date) : new Date();
      const projectEnd = project.end_date ? new Date(project.end_date) : new Date(projectStart.getTime() + (30 * 24 * 60 * 60 * 1000));
      
      // Try to find a row with no conflicts
      for (let rowIndex = 0; rowIndex < existingRows.length; rowIndex++) {
        const conflicts = this.checkRowConflicts(projectStart, projectEnd, existingRows[rowIndex]);
        if (conflicts === 0) {
          return rowIndex;
        }
      }
      
      // No conflict-free row found, create new row
      existingRows.push([]);
      return existingRows.length - 1;
    },
    
    // Check for date conflicts in a row
    checkRowConflicts(newStart, newEnd, rowProjects) {
      let conflicts = 0;
      
      for (const existingProject of rowProjects) {
        const existingStart = existingProject.start_date ? new Date(existingProject.start_date) : new Date();
        const existingEnd = existingProject.end_date ? new Date(existingProject.end_date) : new Date(existingStart.getTime() + (30 * 24 * 60 * 60 * 1000));
        
        // Check for overlap
        if (newStart < existingEnd && newEnd > existingStart) {
          conflicts++;
        }
      }
      
      return conflicts;
    },
    
    // Move a project to a different row
    moveProjectToRow(projectId, targetRow, allProjects) {
      const project = allProjects.find(p => p.id === projectId);
      if (!project) {
        throw new Error('Project not found');
      }
      
      const oldRow = project.row;
      project.row = targetRow;
      
      console.log(`🔄 Moved project "${project.title}" from row ${oldRow} to row ${targetRow}`);
      
      // Update storage
      this.updateProjectInStorage(project);
      
      return { oldRow, newRow: targetRow, project };
    },
    
    // Update project in localStorage
    updateProjectInStorage(project) {
      const projects = SimpleStorage.getAllProjects();
      const index = projects.findIndex(p => p.id === project.id);
      if (index >= 0) {
        projects[index] = { ...projects[index], ...project };
        localStorage.setItem('roadmap-projects', JSON.stringify(projects));
      }
    },
    
    // Get visual indicators for row drop zones (including empty rows)
    getRowDropZones(containerBounds, totalRows) {
      const zones = [];
      const { rowHeight, maxVisibleRows } = TimelineRenderer.config;
      const headerOffset = TimelineRenderer.config.yearHeaderHeight + TimelineRenderer.config.timelineHeight;
      const effectiveRows = Math.max(totalRows, TimelineRenderer.config.minRows, maxVisibleRows || 6);
      
      for (let rowIndex = 0; rowIndex < effectiveRows; rowIndex++) {
        const y = headerOffset + (rowIndex * rowHeight);
        zones.push({
          rowIndex,
          top: y,
          bottom: y + rowHeight,
          centerY: y + (rowHeight / 2),
          isEmpty: rowIndex >= totalRows
        });
      }
      
      return zones;
    },
    
    // Check for collisions and find optimal position
    findOptimalPosition(projectId, targetRow, newStartDate, newEndDate, allProjects) {
      const projectsInRow = allProjects.filter(p => p.row === targetRow && p.id !== projectId);
      
      // If row is empty, return original position
      if (projectsInRow.length === 0) {
        return { row: targetRow, startDate: newStartDate, endDate: newEndDate };
      }
      
      // Check for conflicts with existing projects in target row
      const hasConflict = projectsInRow.some(existingProject => {
        const existingStart = new Date(existingProject.start_date);
        const existingEnd = new Date(existingProject.end_date);
        return (newStartDate < existingEnd && newEndDate > existingStart);
      });
      
      if (!hasConflict) {
        // No conflict, can place at original position
        return { row: targetRow, startDate: newStartDate, endDate: newEndDate };
      }
      
      // Find alternative positions
      console.log(`⚠️ Conflict detected in row ${targetRow}, finding optimal position...`);
      
      // Strategy 1: Try to find empty space in the same row
      const emptySpace = this.findEmptySpaceInRow(projectsInRow, newStartDate, newEndDate);
      if (emptySpace) {
        console.log(`📍 Found empty space in same row: ${emptySpace.startDate} to ${emptySpace.endDate}`);
        return { row: targetRow, startDate: emptySpace.startDate, endDate: emptySpace.endDate };
      }
      
      // Strategy 2: Find nearest empty row
      const nearestEmptyRow = this.findNearestEmptyRow(targetRow, allProjects);
      if (nearestEmptyRow !== null) {
        console.log(`📍 Moving to nearest empty row: ${nearestEmptyRow}`);
        return { row: nearestEmptyRow, startDate: newStartDate, endDate: newEndDate };
      }
      
      // Strategy 3: Find any row with available space
      const maxRows = TimelineRenderer.config.maxVisibleRows || 8;
      for (let rowIndex = 0; rowIndex < maxRows; rowIndex++) {
        const rowProjects = allProjects.filter(p => p.row === rowIndex && p.id !== projectId);
        if (this.checkRowConflicts(newStartDate, newEndDate, rowProjects) === 0) {
          console.log(`📍 Found available space in row: ${rowIndex}`);
          return { row: rowIndex, startDate: newStartDate, endDate: newEndDate };
        }
      }
      
      // Fallback: Keep original dates but move to a new row
      console.log(`📍 Creating new row for project`);
      return { row: Math.min(allProjects.length, maxRows - 1), startDate: newStartDate, endDate: newEndDate };
    },
    
    // Find empty space within a row
    findEmptySpaceInRow(rowProjects, desiredStart, desiredEnd) {
      if (rowProjects.length === 0) {
        return { startDate: desiredStart, endDate: desiredEnd };
      }
      
      // Sort projects by start date
      const sortedProjects = rowProjects.sort((a, b) => {
        const aStart = new Date(a.start_date);
        const bStart = new Date(b.start_date);
        return aStart - bStart;
      });
      
      const projectDuration = desiredEnd - desiredStart;
      
      // Check space before first project
      const firstProjectStart = new Date(sortedProjects[0].start_date);
      if (desiredEnd <= firstProjectStart) {
        return { startDate: desiredStart, endDate: desiredEnd };
      }
      
      // Check gaps between projects
      for (let i = 0; i < sortedProjects.length - 1; i++) {
        const currentEnd = new Date(sortedProjects[i].end_date);
        const nextStart = new Date(sortedProjects[i + 1].start_date);
        
        if (nextStart - currentEnd >= projectDuration) {
          // Found a gap, position project right after current project ends
          const newStart = new Date(currentEnd.getTime() + (24 * 60 * 60 * 1000)); // Next day
          const newEnd = new Date(newStart.getTime() + projectDuration);
          
          if (newEnd <= nextStart) {
            return { startDate: newStart, endDate: newEnd };
          }
        }
      }
      
      // Check space after last project
      const lastProjectEnd = new Date(sortedProjects[sortedProjects.length - 1].end_date);
      const newStart = new Date(lastProjectEnd.getTime() + (24 * 60 * 60 * 1000)); // Next day
      const newEnd = new Date(newStart.getTime() + projectDuration);
      
      return { startDate: newStart, endDate: newEnd };
    },
    
    // Find the nearest empty row
    findNearestEmptyRow(targetRow, allProjects) {
      const maxRows = TimelineRenderer.config.maxVisibleRows || 8;
      const occupiedRows = new Set(allProjects.map(p => p.row).filter(r => r !== null && r !== undefined));
      
      // Check rows in expanding search pattern from target row
      for (let distance = 1; distance < maxRows; distance++) {
        // Check row above
        const rowAbove = targetRow - distance;
        if (rowAbove >= 0 && !occupiedRows.has(rowAbove)) {
          return rowAbove;
        }
        
        // Check row below
        const rowBelow = targetRow + distance;
        if (rowBelow < maxRows && !occupiedRows.has(rowBelow)) {
          return rowBelow;
        }
      }
      
      return null; // No empty row found
    }
  },
  
  // Time-based zoom levels
  zoomLevels: {
    'overview': {
      name: 'Overview',
      dayWidth: 1, // Very narrow for maximum zoom out
      interval: 365, // Show yearly markers
      format: 'YYYY',
      gridLines: 'year',
      projectStyle: 'dot' // Special flag for dot visualization
    },
    'year': {
      name: 'Year View',
      dayWidth: 3,
      interval: 60, // Show every 2 months for better spacing
      format: 'MMM YYYY',
      gridLines: 'month'
    },
    'quarter': {
      name: 'Quarter View', 
      dayWidth: 4,
      interval: 14, // Show biweekly
      format: 'MMM DD',
      gridLines: 'week'
    },
    'month': {
      name: 'Month View',
      dayWidth: 8,
      interval: 7, // Show weeks
      format: 'MMM DD',
      gridLines: 'week'
    },
    'fortnight': {
      name: 'Fortnight View',
      dayWidth: 20,
      interval: 3, // Show every 3 days
      format: 'ddd MM/DD',
      gridLines: 'day'
    },
    'week': {
      name: 'Week View',
      dayWidth: 40,
      interval: 1, // Show daily
      format: 'ddd MM/DD',
      gridLines: 'day'
    }
  },
  
  // Current zoom level
  currentZoom: 'month', // Default to month view
  
  // Initialize timeline
  init() {
    console.log('📅 Initializing timeline renderer...');
    this.renderTimeline();
  },
  
  // Main timeline rendering function
  renderTimeline() {
    console.log('📅 Rendering timeline...');
    
    const container = document.getElementById('timeline-container');
    const headerContainer = document.querySelector('.timeline-dates');
    
    if (!container || !headerContainer) {
      console.warn('⚠️ Timeline containers not found');
      return;
    }
    
    // Get projects
    const projects = SimpleStorage.getAllProjects();
    console.log(`📅 Rendering ${projects.length} projects on timeline`);
    
    // Clear existing content
    container.innerHTML = '';
    headerContainer.innerHTML = '';
    
    // Calculate timeline bounds (even for empty projects to show timeline)
    const bounds = this.calculateTimelineBounds(projects);
    console.log('📅 Timeline bounds:', bounds);
    
    if (projects.length === 0) {
      // Show timeline headers even with no projects
      this.renderYearHeaders(headerContainer, bounds);
      this.renderDateHeaders(headerContainer, bounds);
      this.renderTodayMarker(container, bounds);
      
      container.innerHTML += `
        <div style="text-align: center; padding: 40px; color: #666; position: relative; top: ${this.config.yearHeaderHeight + this.config.timelineHeight + 20}px;">
          <h3>No projects to display on timeline</h3>
          <p>Create your first project to see it on the timeline!</p>
          <a href="project-details.html" style="color: #007bff; text-decoration: none; font-weight: bold;">Create Project →</a>
        </div>
      `;
      return;
    }
    
    // Create timeline structure - need to set proper width for scrolling
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const totalDays = Math.ceil((bounds.end - bounds.start) / (24 * 60 * 60 * 1000));
    const totalWidth = totalDays * dayWidth;
    
    // Assign projects to rows first to calculate proper height
    const { rows, totalRows } = this.rowManager.assignProjectsToRows(projects);
    
    const timelineWrapper = document.createElement('div');
    timelineWrapper.className = 'timeline-wrapper';
    const effectiveRows = Math.max(totalRows, this.config.minRows, this.config.maxVisibleRows || 6);
    const totalHeight = this.config.yearHeaderHeight + this.config.timelineHeight + (effectiveRows * this.config.rowHeight) + 20;
    timelineWrapper.style.cssText = `
      position: relative;
      overflow: visible;
      width: ${totalWidth}px;
      height: ${totalHeight}px;
      background: #f8f9fa;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    `;
    
    // Render year headers first
    this.renderYearHeaders(headerContainer, bounds);
    
    // Render date headers
    this.renderDateHeaders(headerContainer, bounds);
    
    // Render project bars
    this.renderProjectBars(timelineWrapper, projects, bounds);
    
    // Render row backgrounds for visual separation
    this.renderRowBackgrounds(timelineWrapper, totalRows, bounds);
    
    // Render today marker
    this.renderTodayMarker(timelineWrapper, bounds);
    
    // Add to container
    container.appendChild(timelineWrapper);
    
    // Center on today - ensure it's always in the middle
    this.centerOnToday(timelineWrapper, bounds);
    
    // Add fixed today indicator that's always visible
    this.addFixedTodayIndicator(container);
    
    // Ensure centering works after DOM updates
    this.ensureTodayCentering(timelineWrapper, bounds);
    
    console.log('✅ Timeline rendered successfully');
    
    // Add scroll synchronization between headers and content
    this.addScrollSynchronization();
    
    // Add drag panning functionality
    this.addDragPanning();
  },
  
  // Calculate timeline date bounds
  calculateTimelineBounds(projects) {
    const today = new Date();
    const validProjects = projects.filter(p => p.start_date || p.end_date);
    
    console.log(`📊 Calculating bounds for ${projects.length} projects (${validProjects.length} with dates)`);
    
    // Start from a reasonable point - either configured start year or 2 years before today, whichever is earlier
    const configStartDate = new Date(this.config.timelineStartYear, 0, 1);
    const twoYearsAgoStartDate = new Date(today.getFullYear() - 2, 0, 1); // January 1st, 2 years ago
    const minDate = configStartDate < twoYearsAgoStartDate ? configStartDate : twoYearsAgoStartDate;
    
    console.log('📊 Timeline start options:', {
      configStart: this.config.timelineStartYear,
      twoYearsAgo: today.getFullYear() - 2,
      selectedStart: minDate.getFullYear(),
      today: today.getFullYear()
    });
    
    // Always ensure timeline extends at least 5 years past today's date
    const fiveYearsFromToday = new Date(today.getFullYear() + 5, 11, 31); // December 31st, 5 years from now
    
    let maxDate;
    
    if (projects.length === 0) {
      // No projects - show timeline to 5 years from today
      maxDate = fiveYearsFromToday;
      console.log('📊 No projects, timeline extends to 5 years from today:', fiveYearsFromToday.toISOString().split('T')[0]);
    } else if (validProjects.length === 0) {
      // Projects exist but none with dates - show timeline to 5 years from today
      maxDate = fiveYearsFromToday;
      console.log('📊 No projects with dates, timeline extends to 5 years from today:', fiveYearsFromToday.toISOString().split('T')[0]);
    } else {
      // Find the latest project end date, but ensure minimum of 5 years from today
      maxDate = new Date(this.config.timelineStartYear, 11, 31); // Start with end of start year
      
      validProjects.forEach(project => {
        if (project.end_date) {
          const endDate = new Date(project.end_date);
          if (endDate > maxDate) maxDate = endDate;
        }
        if (project.start_date) {
          const startDate = new Date(project.start_date);
          // Extend timeline if project starts after current max (for ongoing projects without end dates)
          if (startDate > maxDate) maxDate = new Date(startDate.getTime() + (365 * 24 * 60 * 60 * 1000)); // Add 1 year
        }
      });
      
      // CRITICAL: Always ensure timeline extends at least 5 years from today
      if (maxDate < fiveYearsFromToday) {
        maxDate = fiveYearsFromToday;
        console.log('📊 Timeline extended to minimum 5 years from today:', fiveYearsFromToday.toISOString().split('T')[0]);
      }
      
      // Add padding to the end date - more padding for year view
      const currentZoom = this.currentZoom;
      let padding = 60 * 24 * 60 * 60 * 1000; // 60 days default
      
      if (currentZoom === 'year') {
        padding = 6 * 30 * 24 * 60 * 60 * 1000; // 6 months for year view
      } else if (currentZoom === 'quarter') {
        padding = 3 * 30 * 24 * 60 * 60 * 1000; // 3 months for quarter view
      }
      
      maxDate = new Date(maxDate.getTime() + padding);
    }
    
    const totalYears = maxDate.getFullYear() - minDate.getFullYear();
    const totalDays = Math.ceil((maxDate - minDate) / (24 * 60 * 60 * 1000));
    
    console.log(`📅 Timeline bounds calculated:`, {
      startDate: minDate.toISOString().split('T')[0],
      endDate: maxDate.toISOString().split('T')[0], 
      startYear: minDate.getFullYear(),
      endYear: maxDate.getFullYear(),
      totalYears: totalYears,
      totalDays: totalDays,
      yearsFromToday: maxDate.getFullYear() - today.getFullYear(),
      coversRequirement: maxDate.getFullYear() >= (today.getFullYear() + 5) ? '✅ YES' : '❌ NO'
    });
    
    return { start: minDate, end: maxDate, today };
  },
  
  // Render year headers above the date timeline
  renderYearHeaders(container, bounds) {
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const totalDays = Math.ceil((bounds.end - bounds.start) / (24 * 60 * 60 * 1000));
    const totalWidth = totalDays * dayWidth;
    
    console.log(`📅 Rendering year headers for ${this.currentZoom} view`);
    
    // Calculate year boundaries properly
    const startYear = bounds.start.getFullYear();
    const endYear = bounds.end.getFullYear();
    const years = [];
    
    console.log(`📅 Timeline spans from ${startYear} to ${endYear}`);
    
    // Create year info for each year in the timeline
    for (let year = startYear; year <= endYear; year++) {
      // Calculate the start and end dates for this year within the timeline bounds
      const yearStart = new Date(year, 0, 1); // January 1st of the year
      const yearEnd = new Date(year + 1, 0, 1); // January 1st of next year (exclusive end)
      
      // Constrain to timeline bounds
      const effectiveStart = yearStart < bounds.start ? bounds.start : yearStart;
      const effectiveEnd = yearEnd > bounds.end ? bounds.end : yearEnd;
      
      // Calculate pixel positions
      const startDays = Math.ceil((effectiveStart - bounds.start) / (24 * 60 * 60 * 1000));
      const endDays = Math.ceil((effectiveEnd - bounds.start) / (24 * 60 * 60 * 1000));
      
      const startX = startDays * dayWidth;
      const endX = endDays * dayWidth;
      const width = endX - startX;
      
      if (width > 0) {
        years.push({
          year,
          start: startX,
          width,
          yearStart: effectiveStart,
          yearEnd: effectiveEnd
        });
      }
    }
    
    console.log(`📅 Rendering ${years.length} year headers:`, years.map(y => y.year));
    
    // Render year indicators with consistent styling
    years.forEach(yearInfo => {
      const yearHeader = document.createElement('div');
      yearHeader.className = 'year-header';
      yearHeader.style.cssText = `
        position: absolute;
        left: ${yearInfo.start}px;
        top: 0;
        width: ${yearInfo.width}px;
        height: ${this.config.yearHeaderHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 16px;
        font-weight: bold;
        color: #2c3e50;
        background: linear-gradient(to bottom, #ffffff, #f1f3f4);
        border-right: 2px solid #007bff;
        border-bottom: 1px solid #e0e0e0;
        text-shadow: 1px 1px 2px rgba(255,255,255,0.8);
        box-shadow: inset 0 1px 3px rgba(0,0,0,0.1);
      `;
      
      yearHeader.textContent = yearInfo.year.toString();
      
      // Highlight current year with special styling
      const currentYear = new Date().getFullYear();
      if (yearInfo.year === currentYear) {
        yearHeader.style.background = 'linear-gradient(to bottom, #e3f2fd, #bbdefb)';
        yearHeader.style.color = '#1565c0';
        yearHeader.style.fontWeight = '900';
        yearHeader.style.borderRight = '3px solid #1976d2';
      }
      
      container.appendChild(yearHeader);
    });
    
    console.log('✅ Year headers rendered successfully');
  },
  
  // Render date headers
  renderDateHeaders(container, bounds) {
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const totalDays = Math.ceil((bounds.end - bounds.start) / (24 * 60 * 60 * 1000));
    const totalWidth = totalDays * dayWidth;
    
    console.log(`📅 Rendering headers for ${this.currentZoom} view (${zoomConfig.name})`);
    console.log(`📊 Timeline parameters:`, {
      totalDays,
      totalWidth,
      dayWidth,
      interval: zoomConfig.interval,
      format: zoomConfig.format,
      boundsStart: bounds.start.toISOString().split('T')[0],
      boundsEnd: bounds.end.toISOString().split('T')[0]
    });
    
    container.style.cssText = `
      position: relative;
      width: ${totalWidth}px;
      height: ${this.config.yearHeaderHeight + this.config.timelineHeight}px;
      background: linear-gradient(to bottom, #fff, #f8f9fa);
      overflow: hidden;
    `;
    
    // Use zoom-specific configuration
    const interval = zoomConfig.interval;
    const format = zoomConfig.format;
    
    let markerCount = 0;
    
    // Render date markers based on current zoom level
    for (let i = 0; i < totalDays; i += interval) {
      const currentDate = new Date(bounds.start.getTime() + (i * 24 * 60 * 60 * 1000));
      const x = i * dayWidth;
      const markerWidth = dayWidth * interval;
      
      console.log(`📅 Creating date marker ${markerCount + 1}:`, {
        i,
        currentDate: currentDate.toISOString().split('T')[0],
        x,
        markerWidth,
        formattedDate: this.formatDate(currentDate, format)
      });
      
      const dateMarker = document.createElement('div');
      dateMarker.style.cssText = `
        position: absolute;
        left: ${x}px;
        top: ${this.config.yearHeaderHeight}px;
        width: ${markerWidth}px;
        height: ${this.config.timelineHeight}px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: ${this.getHeaderFontSize()}px;
        font-weight: 500;
        color: #333;
        border-right: 1px solid #e0e0e0;
        border-bottom: 2px solid #007bff;
        text-align: center;
        white-space: nowrap;
        overflow: hidden;
      `;
      
      dateMarker.textContent = this.formatDate(currentDate, format);
      container.appendChild(dateMarker);
      markerCount++;
    }
    
    console.log(`📅 Date header rendering complete: ${markerCount} markers created for ${this.currentZoom} view`);
    
    // Add zoom level indicator
    this.addZoomLevelIndicator(container, zoomConfig.name);
  },
  
  // Get appropriate font size for current zoom level
  getHeaderFontSize() {
    const sizes = {
      'overview': 10,
      'year': 11,
      'quarter': 11, 
      'month': 12,
      'fortnight': 12,
      'week': 13
    };
    return sizes[this.currentZoom] || 12;
  },
  
  // Add zoom level indicator to header
  addZoomLevelIndicator(container, zoomName) {
    const indicator = document.createElement('div');
    indicator.style.cssText = `
      position: absolute;
      top: 5px;
      right: 10px;
      background: rgba(0, 123, 255, 0.1);
      color: #007bff;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      z-index: 10;
    `;
    indicator.textContent = zoomName;
    container.appendChild(indicator);
  },
  
  // Render project bars with row-based positioning
  renderProjectBars(container, projects, bounds) {
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    
    console.log(`🎨 Rendering ${projects.length} project bars with row system...`);
    console.log('📊 Timeline bounds:', bounds);
    console.log('🔍 Zoom config:', { name: this.zoomLevels[this.currentZoom].name, dayWidth });
    
    // Assign projects to rows
    const { rows, totalRows } = this.rowManager.assignProjectsToRows(projects);
    console.log(`📋 Row assignment: ${totalRows} rows created`);
    
    // Render row backgrounds first
    this.renderRowBackgrounds(container, totalRows, bounds);
    
    let renderedCount = 0;
    let skippedCount = 0;
    
    // Render projects row by row
    rows.forEach((rowProjects, rowIndex) => {
      console.log(`🎨 Rendering row ${rowIndex} with ${rowProjects.length} projects`);
      
      rowProjects.forEach((project, projectIndexInRow) => {
        console.log(`🎨 Processing project "${project.title}" in row ${rowIndex}`);
        
        // More flexible date handling - render projects even with partial dates
        let startDate, endDate;
        
        if (!project.start_date && !project.end_date) {
          console.warn(`⚠️ Project "${project.title}" has no dates, using defaults`);
          // Use default dates for projects without dates
          startDate = bounds.today;
          endDate = new Date(bounds.today.getTime() + (30 * 24 * 60 * 60 * 1000)); // 30 days from today
        } else {
          startDate = project.start_date ? new Date(project.start_date) : bounds.today;
          endDate = project.end_date ? new Date(project.end_date) : new Date(startDate.getTime() + (30 * 24 * 60 * 60 * 1000));
        }
        
        const startX = Math.floor((startDate - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
        const endX = Math.ceil((endDate - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
        const width = Math.max(endX - startX, dayWidth);
        
        // Calculate Y position based on row
        const y = this.config.yearHeaderHeight + this.config.timelineHeight + (rowIndex * this.config.rowHeight) + 10;
        
        // Detailed logging for positioning
        console.log(`📏 Project "${project.title}" positioning:`, {
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          boundsStart: bounds.start.toISOString().split('T')[0],
          boundsEnd: bounds.end.toISOString().split('T')[0],
          startX,
          endX,
          width,
          y,
          rowIndex,
          projectIndexInRow,
          dayWidth
        });
        
        const projectBar = document.createElement('div');
        projectBar.className = `timeline-project-bar status-${project.status || 'concept-design'}`;
        
        // Check if we're in overview mode for dot visualization
        const isOverviewMode = this.currentZoom === 'overview';
        
        if (isOverviewMode) {
          // Overview mode: render as colored dots
          const centerX = startX + (width / 2);
          const dotSize = 12; // Size of the dot
          const dotY = y + (this.config.projectHeight / 2) - (dotSize / 2);
          
          projectBar.style.cssText = `
            position: absolute;
            left: ${centerX - (dotSize / 2)}px;
            top: ${dotY}px;
            width: ${dotSize}px;
            height: ${dotSize}px;
            background: ${this.getStatusColor(project.status)};
            border-radius: 50%;
            border: 2px solid rgba(255,255,255,0.9);
            box-shadow: 0 2px 6px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.2s ease;
            z-index: 10;
          `;
          
          // Add tooltip for overview mode
          projectBar.title = `${project.title} (${startDate.toISOString().split('T')[0]} - ${endDate.toISOString().split('T')[0]})`;
          
        } else {
          // Normal mode: render as bars
          projectBar.style.cssText = `
            position: absolute;
            left: ${startX}px;
            top: ${y}px;
            width: ${width}px;
            height: ${this.config.projectHeight}px;
            background: ${this.getStatusColor(project.status)};
            border-radius: 6px;
            border: 2px solid rgba(255,255,255,0.8);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            cursor: pointer;
            transition: all 0.2s ease;
            display: flex;
            align-items: center;
            padding: 0 12px;
            box-sizing: border-box;
            overflow: hidden;
          `;
        }
        
        // Add drag handle for moving entire project and row info
        projectBar.setAttribute('data-project-id', project.id);
        projectBar.setAttribute('data-row-index', rowIndex);
        
        let leftHandle, rightHandle, title;
        
        if (!isOverviewMode) {
          // Only add handles and title for non-overview modes
          
          // Left resize handle (start date)
          leftHandle = document.createElement('div');
          leftHandle.className = 'resize-handle left-handle';
          leftHandle.style.cssText = `
            position: absolute;
            left: -3px;
            top: 0;
            width: 6px;
            height: 100%;
            background: rgba(255,255,255,0.8);
            cursor: ew-resize;
            border-radius: 3px 0 0 3px;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 10;
          `;
          
          // Right resize handle (end date)
          rightHandle = document.createElement('div');
          rightHandle.className = 'resize-handle right-handle';
          rightHandle.style.cssText = `
            position: absolute;
            right: -3px;
            top: 0;
            width: 6px;
            height: 100%;
            background: rgba(255,255,255,0.8);
            cursor: ew-resize;
            border-radius: 0 3px 3px 0;
            opacity: 0;
            transition: opacity 0.2s ease;
            z-index: 10;
          `;
          
          // Project title
          title = document.createElement('div');
          title.style.cssText = `
            color: white;
            font-weight: 600;
            font-size: 13px;
            text-shadow: 1px 1px 2px rgba(0,0,0,0.3);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            pointer-events: none;
            position: relative;
            z-index: 5;
          `;
          title.textContent = project.title || 'Untitled Project';
          
          projectBar.appendChild(leftHandle);
          projectBar.appendChild(rightHandle);
          projectBar.appendChild(title);
        }
        
        // Hover effects (different for overview vs normal mode)
        if (isOverviewMode) {
          // Overview mode: simple dot hover effect
          projectBar.addEventListener('mouseenter', () => {
            projectBar.style.transform = 'scale(1.5)';
            projectBar.style.boxShadow = '0 4px 15px rgba(0,0,0,0.3)';
            projectBar.style.zIndex = '20';
          });
          
          projectBar.addEventListener('mouseleave', () => {
            if (!projectBar.classList.contains('dragging')) {
              projectBar.style.transform = 'scale(1)';
              projectBar.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2), 0 0 0 1px rgba(0,0,0,0.1)';
              projectBar.style.zIndex = '10';
            }
          });
        } else {
          // Normal mode: hover effects with drag handles
          projectBar.addEventListener('mouseenter', () => {
            projectBar.style.transform = 'translateY(-2px)';
            projectBar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            projectBar.style.zIndex = '10';
            // Show drag handles on hover
            if (leftHandle) leftHandle.style.opacity = '1';
            if (rightHandle) rightHandle.style.opacity = '1';
          });
          
          projectBar.addEventListener('mouseleave', () => {
            if (!projectBar.classList.contains('dragging')) {
              projectBar.style.transform = 'translateY(0)';
              projectBar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
              projectBar.style.zIndex = '1';
              // Hide drag handles when not hovering
              if (leftHandle) leftHandle.style.opacity = '0';
              if (rightHandle) rightHandle.style.opacity = '0';
            }
          });
        }
        
        // Enhanced drag event listeners with row support (only for non-overview mode)
        if (!isOverviewMode) {
          this.addProjectDragListenersWithRows(projectBar, leftHandle, rightHandle, project, bounds, rowIndex, totalRows);
        }
        
        // Click handler (only if not dragging)
        projectBar.addEventListener('click', (e) => {
          if (!projectBar.classList.contains('was-dragging')) {
            console.log('🎯 Project clicked:', project.title);
            window.location.href = `project-details.html?id=${project.id}`;
          }
          // Reset dragging flag after a short delay
          setTimeout(() => {
            projectBar.classList.remove('was-dragging');
          }, 100);
        });
        
        container.appendChild(projectBar);
        renderedCount++;
        console.log(`✅ Project bar rendered for "${project.title}" at row ${rowIndex}, position (${startX}, ${y}) with width ${width}px`);
      });
    });
    
    console.log(`🎨 Project rendering complete: ${renderedCount} rendered, ${skippedCount} skipped, Total: ${projects.length}`);
  },
  
  // Enhanced row backgrounds with drop zone support
  renderRowBackgrounds(container, totalRows, bounds) {
    const effectiveRows = Math.max(totalRows, this.config.minRows, this.config.maxVisibleRows || 6);
    console.log(`🎨 Rendering ${effectiveRows} row backgrounds (${totalRows} occupied, ${effectiveRows - totalRows} empty drop zones)...`);
    
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const totalDays = Math.ceil((bounds.end - bounds.start) / (24 * 60 * 60 * 1000));
    const totalWidth = totalDays * dayWidth;
    
    // Store row info for drag operations
    container.setAttribute('data-total-rows', effectiveRows);
    
    for (let rowIndex = 0; rowIndex < effectiveRows; rowIndex++) {
      const y = this.config.yearHeaderHeight + this.config.timelineHeight + (rowIndex * this.config.rowHeight);
      const isOccupiedRow = rowIndex < totalRows;
      
      const rowBackground = document.createElement('div');
      rowBackground.className = `row-background ${isOccupiedRow ? 'occupied' : 'empty'}`;
      rowBackground.setAttribute('data-row-index', rowIndex);
      rowBackground.style.cssText = `
        position: absolute;
        left: 0;
        top: ${y}px;
        width: ${totalWidth}px;
        height: ${this.config.rowHeight}px;
        background: ${isOccupiedRow 
          ? (rowIndex % 2 === 0 ? 'rgba(248, 249, 250, 0.4)' : 'rgba(233, 236, 239, 0.4)')
          : (rowIndex % 2 === 0 ? 'rgba(248, 249, 250, 0.2)' : 'rgba(233, 236, 239, 0.2)')
        };
        border-bottom: 1px solid rgba(0, 0, 0, ${isOccupiedRow ? '0.08' : '0.03'});
        border-top: ${rowIndex === 0 ? '1px solid rgba(0, 0, 0, 0.05)' : 'none'};
        z-index: 0;
        transition: background-color 0.2s ease;
      `;
      
      // Add hover effect for empty rows during drag
      rowBackground.addEventListener('mouseenter', () => {
        if (document.querySelector('.timeline-project-bar.dragging')) {
          rowBackground.style.background = 'rgba(0, 123, 255, 0.1)';
          rowBackground.style.borderColor = 'rgba(0, 123, 255, 0.3)';
        }
      });
      
      rowBackground.addEventListener('mouseleave', () => {
        rowBackground.style.background = isOccupiedRow 
          ? (rowIndex % 2 === 0 ? 'rgba(248, 249, 250, 0.4)' : 'rgba(233, 236, 239, 0.4)')
          : (rowIndex % 2 === 0 ? 'rgba(248, 249, 250, 0.2)' : 'rgba(233, 236, 239, 0.2)');
        rowBackground.style.borderColor = `rgba(0, 0, 0, ${isOccupiedRow ? '0.08' : '0.03'})`;
      });
      
      // Enhanced row label with occupancy info
      const rowLabel = document.createElement('div');
      rowLabel.className = `row-label ${isOccupiedRow ? 'occupied' : 'empty'}`;
      rowLabel.style.cssText = `
        position: absolute;
        left: -60px;
        top: ${y + (this.config.rowHeight / 2) - 12}px;
        width: 50px;
        height: 24px;
        background: ${isOccupiedRow ? 'rgba(0, 123, 255, 0.15)' : 'rgba(108, 117, 125, 0.1)'};
        color: ${isOccupiedRow ? '#007bff' : '#6c757d'};
        border-radius: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 10px;
        font-weight: 600;
        z-index: 5;
        border: 1px solid ${isOccupiedRow ? 'rgba(0, 123, 255, 0.2)' : 'rgba(108, 117, 125, 0.15)'};
        transition: all 0.2s ease;
      `;
      rowLabel.textContent = isOccupiedRow ? `Row ${rowIndex + 1}` : `+ Row ${rowIndex + 1}`;
      
      container.appendChild(rowBackground);
      container.appendChild(rowLabel);
    }
    
    console.log(`✅ Row backgrounds rendered: ${totalRows} occupied + ${effectiveRows - totalRows} empty drop zones = ${effectiveRows} total`);
  },
  
  // Render today marker
  renderTodayMarker(container, bounds) {
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const todayX = Math.floor((bounds.today - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
    
    console.log(`📅 Rendering today marker at X: ${todayX}, dayWidth: ${dayWidth}`);
    
    // Main today marker line - make it thicker and more visible
    const todayMarker = document.createElement('div');
    todayMarker.className = 'today-marker';
    todayMarker.style.cssText = `
      position: absolute;
      left: ${todayX}px;
      top: ${this.config.yearHeaderHeight}px;
      width: 4px;
      height: calc(100% - ${this.config.yearHeaderHeight}px);
      background: linear-gradient(to bottom, #dc3545, #c82333);
      z-index: 1000;
      box-shadow: 0 0 12px rgba(220, 53, 69, 0.8), 0 0 4px rgba(220, 53, 69, 1);
      border-radius: 2px;
    `;
    
    // Today label - make it more prominent
    const todayLabel = document.createElement('div');
    todayLabel.style.cssText = `
      position: absolute;
      left: ${todayX - 25}px;
      top: ${this.config.yearHeaderHeight + 5}px;
      background: linear-gradient(45deg, #dc3545, #e74c3c);
      color: white;
      padding: 6px 12px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: bold;
      z-index: 1001;
      box-shadow: 0 3px 8px rgba(0,0,0,0.3), 0 0 0 2px rgba(255,255,255,0.3);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      animation: todayPulse 2s ease-in-out infinite;
      white-space: nowrap;
    `;
    todayLabel.textContent = 'TODAY';
    
    // Add CSS animation for the today label
    if (!document.getElementById('today-animation-style')) {
      const style = document.createElement('style');
      style.id = 'today-animation-style';
      style.textContent = `
        @keyframes todayPulse {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50% { transform: scale(1.05); opacity: 1; }
        }
      `;
      document.head.appendChild(style);
    }
    
    // Add today date below the label
    const todayDate = document.createElement('div');
    todayDate.style.cssText = `
      position: absolute;
      left: ${todayX - 35}px;
      top: ${this.config.yearHeaderHeight + 35}px;
      background: rgba(220, 53, 69, 0.9);
      color: white;
      padding: 4px 8px;
      border-radius: 12px;
      font-size: 10px;
      font-weight: 600;
      z-index: 1001;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      white-space: nowrap;
    `;
    todayDate.textContent = bounds.today.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    });
    
    container.appendChild(todayMarker);
    container.appendChild(todayLabel);
    container.appendChild(todayDate);
    
    console.log('✅ Today marker rendered successfully');
  },
  
  // Center timeline on today
  centerOnToday(container, bounds) {
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const todayX = Math.floor((bounds.today - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
    
    if (!container.parentElement) {
      console.warn('⚠️ Cannot center - no parent container found');
      return;
    }
    
    const containerWidth = container.parentElement.clientWidth;
    const scrollLeft = todayX - (containerWidth / 2);
    
    console.log(`🎯 Centering on today (${this.currentZoom} view):`);
    console.log(`  - Today position: ${todayX}px`);
    console.log(`  - Container width: ${containerWidth}px`);
    console.log(`  - Target scroll: ${scrollLeft}px`);
    console.log(`  - Today date: ${bounds.today.toLocaleDateString()}`);
    
    // Use setTimeout to ensure DOM is fully rendered
    setTimeout(() => {
      if (container.parentElement) {
        const finalScrollLeft = Math.max(0, scrollLeft);
        // Sync both header and content scroll positions
        container.parentElement.scrollLeft = finalScrollLeft;
        
        const headerContainer = document.querySelector('.timeline-header');
        if (headerContainer) {
          headerContainer.scrollLeft = finalScrollLeft;
        }
        
        console.log(`✅ Timeline centered on today (final scroll: ${finalScrollLeft}px)`);
      }
    }, 150);
    
    // Also add a visual indicator in the timeline header
    this.addTodayIndicatorToHeader(bounds);
  },
  
  // Ensure today centering with multiple attempts for reliability
  ensureTodayCentering(container, bounds) {
    const attempts = [100, 300, 500, 1000]; // Multiple timing attempts
    
    attempts.forEach(delay => {
      setTimeout(() => {
        const zoomConfig = this.zoomLevels[this.currentZoom];
        const dayWidth = zoomConfig.dayWidth;
        const todayX = Math.floor((bounds.today - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
        const containerWidth = container.parentElement.clientWidth;
        const scrollLeft = todayX - (containerWidth / 2);
        
        if (container.parentElement) {
          container.parentElement.scrollLeft = Math.max(0, scrollLeft);
          console.log(`🎯 Today re-centered (attempt at ${delay}ms): scrollLeft=${scrollLeft}`);
        }
      }, delay);
    });
    
    // Add resize listener to maintain centering
    this.addResizeListener(container, bounds);
  },
  
  // Add resize listener to maintain today centering
  addResizeListener(container, bounds) {
    // Remove existing listener if any
    if (this.resizeListener) {
      window.removeEventListener('resize', this.resizeListener);
    }
    
    this.resizeListener = () => {
      console.log('🔄 Window resized - re-centering on today');
      setTimeout(() => {
        this.centerOnToday(container, bounds);
      }, 100);
    };
    
    window.addEventListener('resize', this.resizeListener);
  },
  
  // Add today indicator to the header for extra visibility
  addTodayIndicatorToHeader(bounds) {
    const headerContainer = document.querySelector('.timeline-dates');
    if (!headerContainer) return;
    
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    const todayX = Math.floor((bounds.today - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
    
    // Add today indicator in header
    const headerIndicator = document.createElement('div');
    headerIndicator.style.cssText = `
      position: absolute;
      left: ${todayX}px;
      top: ${this.config.yearHeaderHeight}px;
      width: 4px;
      height: ${this.config.timelineHeight}px;
      background: linear-gradient(to bottom, #dc3545, #c82333);
      z-index: 999;
      box-shadow: 0 0 8px rgba(220, 53, 69, 0.6);
      border-radius: 2px;
    `;
    
    headerContainer.appendChild(headerIndicator);
  },
  
  // Add a fixed today indicator that's always visible in the center
  addFixedTodayIndicator(container) {
    // Remove any existing fixed indicator
    const existingIndicator = document.getElementById('fixed-today-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    const fixedIndicator = document.createElement('div');
    fixedIndicator.id = 'fixed-today-indicator';
    fixedIndicator.style.cssText = `
      position: fixed;
      left: 50%;
      top: 20px;
      transform: translateX(-50%);
      background: linear-gradient(45deg, #dc3545, #e74c3c);
      color: white;
      padding: 8px 16px;
      border-radius: 25px;
      font-size: 14px;
      font-weight: bold;
      z-index: 2000;
      box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.3);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      animation: fixedTodayPulse 3s ease-in-out infinite;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    const today = new Date();
    fixedIndicator.innerHTML = `
      <div style="text-align: center;">
        <div style="font-size: 12px; margin-bottom: 2px;">TODAY</div>
        <div style="font-size: 11px; opacity: 0.9;">${today.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })}</div>
      </div>
    `;
    
    // Add CSS animation for the fixed indicator
    if (!document.getElementById('fixed-today-animation-style')) {
      const style = document.createElement('style');
      style.id = 'fixed-today-animation-style';
      style.textContent = `
        @keyframes fixedTodayPulse {
          0%, 100% { 
            transform: translateX(-50%) scale(1); 
            box-shadow: 0 4px 12px rgba(0,0,0,0.3), 0 0 0 3px rgba(255,255,255,0.3);
          }
          50% { 
            transform: translateX(-50%) scale(1.05); 
            box-shadow: 0 6px 16px rgba(0,0,0,0.4), 0 0 0 4px rgba(255,255,255,0.4);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(fixedIndicator);
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
      if (fixedIndicator && fixedIndicator.parentNode) {
        fixedIndicator.style.opacity = '0';
        fixedIndicator.style.transition = 'opacity 1s ease';
        setTimeout(() => {
          if (fixedIndicator && fixedIndicator.parentNode) {
            fixedIndicator.remove();
          }
        }, 1000);
      }
    }, 5000);
    
    console.log('✅ Fixed today indicator added');
  },
  
  // Add drag listeners for project manipulation
  addProjectDragListeners(projectBar, leftHandle, rightHandle, project, bounds) {
    let isDragging = false;
    let dragType = null; // 'move', 'resize-left', 'resize-right'
    let dragStartX = 0;
    let dragStartLeft = 0;
    let dragStartWidth = 0;
    let originalProject = null;
    
    // Helper function to get day width for current zoom
    const getDayWidth = () => {
      const zoomConfig = this.zoomLevels[this.currentZoom];
      return zoomConfig.dayWidth;
    };
    
    // Helper function to convert pixels to date
    const pixelToDate = (pixelX) => {
      const dayWidth = getDayWidth();
      const dayOffset = Math.round(pixelX / dayWidth);
      return new Date(bounds.start.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
    };
    
    // Helper function to format date for input
    const formatDateForInput = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Left handle (resize start date)
    leftHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = true;
      dragType = 'resize-left';
      dragStartX = e.clientX;
      dragStartLeft = parseInt(projectBar.style.left || 0);
      dragStartWidth = parseInt(projectBar.style.width || 0);
      originalProject = { ...project };
      
      console.log('🔄 Starting left resize drag for:', project.title);
      
      projectBar.classList.add('dragging');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });
    
    // Right handle (resize end date)
    rightHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = true;
      dragType = 'resize-right';
      dragStartX = e.clientX;
      dragStartLeft = parseInt(projectBar.style.left || 0);
      dragStartWidth = parseInt(projectBar.style.width || 0);
      originalProject = { ...project };
      
      console.log('🔄 Starting right resize drag for:', project.title);
      
      projectBar.classList.add('dragging');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    });
    
    // Project bar (move entire project)
    projectBar.addEventListener('mousedown', (e) => {
      // Only start drag if not clicking on handles
      if (e.target === leftHandle || e.target === rightHandle) {
        return;
      }
      
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = true;
      dragType = 'move';
      dragStartX = e.clientX;
      dragStartLeft = parseInt(projectBar.style.left || 0);
      originalProject = { ...project };
      
      console.log('🔄 Starting move drag for:', project.title);
      
      projectBar.classList.add('dragging');
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
    });
    
    // Auto-scroll variables
    let autoScrollInterval = null;
    const SCROLL_ZONE_WIDTH = 100; // pixels from edge to start auto-scroll
    const SCROLL_SPEED_MAX = 20; // maximum scroll speed per frame
    const SCROLL_ACCELERATION = 1.5; // speed multiplier based on distance from edge
    
    // Show auto-scroll visual indicators
    const showAutoScrollIndicators = (direction) => {
      // Remove existing indicators
      removeAutoScrollIndicators();
      
      const timelineContainer = document.getElementById('timeline-container');
      if (!timelineContainer) return;
      
      const indicator = document.createElement('div');
      indicator.id = 'auto-scroll-indicator';
      indicator.style.cssText = `
        position: fixed;
        top: 50%;
        transform: translateY(-50%);
        background: rgba(220, 53, 69, 0.9);
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        z-index: 10001;
        pointer-events: none;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        animation: autoScrollPulse 0.5s ease-in-out infinite alternate;
      `;
      
      if (direction === 'left') {
        indicator.style.left = '20px';
        indicator.innerHTML = '◀️ Auto-scroll Left';
      } else {
        indicator.style.right = '20px';
        indicator.innerHTML = 'Auto-scroll Right ▶️';
      }
      
      // Add animation styles if not already present
      if (!document.getElementById('auto-scroll-animation-style')) {
        const style = document.createElement('style');
        style.id = 'auto-scroll-animation-style';
        style.textContent = `
          @keyframes autoScrollPulse {
            0% { opacity: 0.7; transform: translateY(-50%) scale(1); }
            100% { opacity: 1; transform: translateY(-50%) scale(1.05); }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(indicator);
    };
    
    // Remove auto-scroll visual indicators
    const removeAutoScrollIndicators = () => {
      const existing = document.getElementById('auto-scroll-indicator');
      if (existing) {
        existing.remove();
      }
    };
    
    // Auto-scroll function
    const handleAutoScroll = (mouseX, containerRect) => {
      const timelineContainer = document.getElementById('timeline-container');
      const headerContainer = document.querySelector('.timeline-header');
      
      if (!timelineContainer) return;
      
      const leftEdge = containerRect.left;
      const rightEdge = containerRect.right;
      const containerWidth = containerRect.width;
      
      let scrollSpeed = 0;
      let shouldScroll = false;
      let scrollDirection = null;
      
      // Check if mouse is near left edge
      if (mouseX < leftEdge + SCROLL_ZONE_WIDTH) {
        const distanceFromEdge = (leftEdge + SCROLL_ZONE_WIDTH) - mouseX;
        const speedFactor = Math.min(distanceFromEdge / SCROLL_ZONE_WIDTH, 1);
        scrollSpeed = -SCROLL_SPEED_MAX * speedFactor * SCROLL_ACCELERATION;
        shouldScroll = true;
        scrollDirection = 'left';
        
      // Check if mouse is near right edge
      } else if (mouseX > rightEdge - SCROLL_ZONE_WIDTH) {
        const distanceFromEdge = mouseX - (rightEdge - SCROLL_ZONE_WIDTH);
        const speedFactor = Math.min(distanceFromEdge / SCROLL_ZONE_WIDTH, 1);
        scrollSpeed = SCROLL_SPEED_MAX * speedFactor * SCROLL_ACCELERATION;
        shouldScroll = true;
        scrollDirection = 'right';
      }
      
      if (shouldScroll && Math.abs(scrollSpeed) > 1) {
        // Show visual indicator
        showAutoScrollIndicators(scrollDirection);
        
        // Apply scroll to both containers
        const currentScrollLeft = timelineContainer.scrollLeft;
        const newScrollLeft = Math.max(0, currentScrollLeft + scrollSpeed);
        
        timelineContainer.scrollLeft = newScrollLeft;
        if (headerContainer) {
          headerContainer.scrollLeft = newScrollLeft;
        }
        
        // Adjust drag position to account for scrolling
        dragStartX += scrollSpeed; // Compensate for the scroll movement
        
        console.log(`🔄 Auto-scroll ${scrollDirection}: speed=${scrollSpeed.toFixed(1)}, newScroll=${newScrollLeft}`);
      } else {
        // Remove indicators if not scrolling
        removeAutoScrollIndicators();
      }
    };
    
    // Start auto-scroll when needed
    const startAutoScroll = (mouseX, containerRect) => {
      // Clear any existing interval
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
      
      autoScrollInterval = setInterval(() => {
        handleAutoScroll(mouseX, containerRect);
      }, 16); // ~60fps
    };
    
    // Stop auto-scroll
    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
      // Remove visual indicators
      removeAutoScrollIndicators();
    };
    
    // Mouse move handler
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      const deltaX = e.clientX - dragStartX;
      const dayWidth = getDayWidth();
      
      // Get timeline container bounds for auto-scroll
      const timelineContainer = document.getElementById('timeline-container');
      if (timelineContainer) {
        const containerRect = timelineContainer.getBoundingClientRect();
        
        // Check if we should auto-scroll
        const mouseX = e.clientX;
        if ((mouseX < containerRect.left + SCROLL_ZONE_WIDTH) || 
            (mouseX > containerRect.right - SCROLL_ZONE_WIDTH)) {
          // Start auto-scroll
          handleAutoScroll(mouseX, containerRect);
        }
      }
      
      if (dragType === 'resize-left') {
        // Resize from left (change start date)
        const newLeft = dragStartLeft + deltaX;
        const newWidth = dragStartWidth - deltaX;
        
        if (newWidth >= dayWidth) { // Minimum 1 day width
          projectBar.style.left = newLeft + 'px';
          projectBar.style.width = newWidth + 'px';
          
          // Calculate and show new start date
          const newStartDate = pixelToDate(newLeft);
          this.showDragFeedback(projectBar, `Start: ${formatDateForInput(newStartDate)}`, 'resize-left');
        }
        
      } else if (dragType === 'resize-right') {
        // Resize from right (change end date)
        const newWidth = dragStartWidth + deltaX;
        
        if (newWidth >= dayWidth) { // Minimum 1 day width
          projectBar.style.width = newWidth + 'px';
          
          // Calculate and show new end date
          const newEndPixel = dragStartLeft + newWidth;
          const newEndDate = pixelToDate(newEndPixel);
          this.showDragFeedback(projectBar, `End: ${formatDateForInput(newEndDate)}`, 'resize-right');
        }
        
      } else if (dragType === 'move') {
        // Move entire project
        const newLeft = dragStartLeft + deltaX;
        projectBar.style.left = newLeft + 'px';
        
        // Calculate and show new dates
        const newStartDate = pixelToDate(newLeft);
        const projectDurationDays = Math.round(parseInt(projectBar.style.width) / dayWidth);
        const newEndDate = new Date(newStartDate.getTime() + (projectDurationDays * 24 * 60 * 60 * 1000));
        
        this.showDragFeedback(projectBar, `${formatDateForInput(newStartDate)} to ${formatDateForInput(newEndDate)}`, 'move');
      }
      
      // Visual feedback
      projectBar.style.opacity = '0.8';
      projectBar.style.transform = 'translateY(-2px)';
    };
    
    // Mouse up handler
    const handleMouseUp = (e) => {
      if (!isDragging) return;
      
      console.log('✅ Ending drag for:', project.title, 'Type:', dragType);
      
      // Calculate final dates
      const finalLeft = parseInt(projectBar.style.left);
      const finalWidth = parseInt(projectBar.style.width);
      const dayWidth = getDayWidth();
      
      let newStartDate, newEndDate;
      
      if (dragType === 'resize-left') {
        newStartDate = pixelToDate(finalLeft);
        const endPixel = finalLeft + finalWidth;
        newEndDate = pixelToDate(endPixel);
      } else if (dragType === 'resize-right') {
        newStartDate = pixelToDate(finalLeft);
        const endPixel = finalLeft + finalWidth;
        newEndDate = pixelToDate(endPixel);
      } else if (dragType === 'move') {
        newStartDate = pixelToDate(finalLeft);
        const projectDurationDays = Math.round(finalWidth / dayWidth);
        newEndDate = new Date(newStartDate.getTime() + (projectDurationDays * 24 * 60 * 60 * 1000));
      }
      
      // Update project data
      if (newStartDate && newEndDate && newStartDate < newEndDate) {
        this.updateProjectDates(project.id, newStartDate, newEndDate);
        console.log(`📅 Updated ${project.title}: ${formatDateForInput(newStartDate)} to ${formatDateForInput(newEndDate)}`);
        
        showNotification(`📅 Updated ${project.title} dates`, 'success');
      } else {
        // Invalid dates, revert
        console.warn('⚠️ Invalid dates, reverting changes');
        this.revertProjectPosition(projectBar, originalProject, bounds);
        showNotification('Invalid date range, changes reverted', 'warning');
      }
      
      // Cleanup
      isDragging = false;
      dragType = null;
      projectBar.classList.remove('dragging');
      projectBar.classList.add('was-dragging');
      projectBar.style.opacity = '1';
      projectBar.style.transform = 'translateY(0)';
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Stop auto-scroll
      stopAutoScroll();
      
      this.hideDragFeedback();
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Store cleanup function
    projectBar._cleanupDragListeners = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      // Stop any active auto-scroll
      stopAutoScroll();
    };
  },
  
  // Enhanced drag feedback with smooth animations
  showDragFeedback(projectBar, message, dragType) {
    let feedback = document.getElementById('drag-feedback');
    if (!feedback) {
      feedback = document.createElement('div');
      feedback.id = 'drag-feedback';
      document.body.appendChild(feedback);
      
      // Add smooth entrance animation
      feedback.style.animation = 'dragFeedbackIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)';
    }
    
    const rect = projectBar.getBoundingClientRect();
    const offsetY = dragType === 'row-move' ? -50 : -40; // Different offset for row moves
    
    feedback.style.cssText = `
      position: fixed;
      left: ${rect.left + rect.width / 2}px;
      top: ${rect.top + offsetY}px;
      transform: translateX(-50%);
      background: ${dragType === 'row-move' ? 'rgba(0, 123, 255, 0.95)' : 'rgba(0, 0, 0, 0.9)'};
      color: white;
      padding: 8px 12px;
      border-radius: 20px;
      font-size: 13px;
      font-weight: 600;
      z-index: 10001;
      pointer-events: none;
      white-space: nowrap;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      backdrop-filter: blur(4px);
      transition: all 0.1s ease;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    // Add smooth feedback animation if not already added
    if (!document.getElementById('drag-feedback-animation')) {
      const style = document.createElement('style');
      style.id = 'drag-feedback-animation';
      style.textContent = `
        @keyframes dragFeedbackIn {
          0% {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.8);
          }
          100% {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }
        
        @keyframes dragFeedbackPulse {
          0%, 100% {
            transform: translateX(-50%) scale(1);
          }
          50% {
            transform: translateX(-50%) scale(1.05);
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    const typeIcons = {
      'resize-left': '◀️',
      'resize-right': '▶️',
      'move': '↔️',
      'row-move': '↕️'
    };
    
    feedback.textContent = `${typeIcons[dragType] || '📋'} ${message}`;
    
    // Add pulse animation for row moves
    if (dragType === 'row-move') {
      feedback.style.animation = 'dragFeedbackPulse 1s ease-in-out infinite';
    } else {
      feedback.style.animation = 'none';
    }
  },
  
  // Hide drag feedback
  hideDragFeedback() {
    const feedback = document.getElementById('drag-feedback');
    if (feedback) {
      feedback.remove();
    }
  },
  
  // Update project dates in storage
  updateProjectDates(projectId, newStartDate, newEndDate) {
    const projects = SimpleStorage.getAllProjects();
    const projectIndex = projects.findIndex(p => p.id === projectId);
    
    if (projectIndex >= 0) {
      projects[projectIndex].start_date = newStartDate.toISOString().split('T')[0];
      projects[projectIndex].end_date = newEndDate.toISOString().split('T')[0];
      
      localStorage.setItem('roadmap-projects', JSON.stringify(projects));
      console.log('💾 Project dates saved to storage');
    }
  },
  
  // Revert project to original position
  revertProjectPosition(projectBar, originalProject, bounds) {
    const zoomConfig = this.zoomLevels[this.currentZoom];
    const dayWidth = zoomConfig.dayWidth;
    
    const startDate = new Date(originalProject.start_date);
    const endDate = new Date(originalProject.end_date);
    
    const startX = Math.floor((startDate - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
    const endX = Math.ceil((endDate - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
    const width = Math.max(endX - startX, dayWidth);
    
    projectBar.style.left = startX + 'px';
    projectBar.style.width = width + 'px';
  },
  
  // Enhanced drag listeners with row support
  addProjectDragListenersWithRows(projectBar, leftHandle, rightHandle, project, bounds, currentRowIndex, totalRows) {
    let isDragging = false;
    let dragType = null; // 'move', 'resize-left', 'resize-right', 'row-move'
    let dragStartX = 0;
    let dragStartY = 0;
    let dragStartLeft = 0;
    let dragStartWidth = 0;
    let originalProject = null;
    let originalRowIndex = currentRowIndex;
    
    // Helper function to get day width for current zoom
    const getDayWidth = () => {
      const zoomConfig = this.zoomLevels[this.currentZoom];
      return zoomConfig.dayWidth;
    };
    
    // Helper function to convert pixels to date
    const pixelToDate = (pixelX) => {
      const dayWidth = getDayWidth();
      const dayOffset = Math.round(pixelX / dayWidth);
      return new Date(bounds.start.getTime() + (dayOffset * 24 * 60 * 60 * 1000));
    };
    
    // Helper function to format date for input
    const formatDateForInput = (date) => {
      return date.toISOString().split('T')[0];
    };
    
    // Enhanced helper function to determine target row based on mouse Y position
    const getTargetRow = (mouseY) => {
      const timelineContainer = document.getElementById('timeline-container');
      if (!timelineContainer) return currentRowIndex;
      
      const containerRect = timelineContainer.getBoundingClientRect();
      const relativeY = mouseY - containerRect.top;
      const headerOffset = this.config.yearHeaderHeight + this.config.timelineHeight;
      
      if (relativeY < headerOffset) {
        return 0; // Above timeline, put in first row
      }
      
      const rowY = relativeY - headerOffset;
      const targetRow = Math.floor(rowY / this.config.rowHeight);
      
      // Support all available drop zones (including empty rows)
      const maxAvailableRows = Math.max(totalRows, this.config.minRows, this.config.maxVisibleRows || 6);
      return Math.max(0, Math.min(targetRow, maxAvailableRows - 1));
    };
    
    // Visual row indicator
    const showRowIndicator = (targetRow) => {
      // Remove existing indicator
      const existing = document.getElementById('row-drop-indicator');
      if (existing) existing.remove();
      
      const timelineContainer = document.getElementById('timeline-container');
      if (!timelineContainer) return;
      
      const indicator = document.createElement('div');
      indicator.id = 'row-drop-indicator';
      
      const y = this.config.yearHeaderHeight + this.config.timelineHeight + (targetRow * this.config.rowHeight);
      
      indicator.style.cssText = `
        position: absolute;
        left: 0;
        top: ${y}px;
        width: 100%;
        height: ${this.config.rowHeight}px;
        background: rgba(0, 123, 255, 0.2);
        border: 2px dashed #007bff;
        border-radius: 4px;
        z-index: 100;
        pointer-events: none;
        animation: rowHighlight 1s ease-in-out infinite alternate;
      `;
      
      // Add animation if not exists
      if (!document.getElementById('row-highlight-animation')) {
        const style = document.createElement('style');
        style.id = 'row-highlight-animation';
        style.textContent = `
          @keyframes rowHighlight {
            0% { opacity: 0.3; }
            100% { opacity: 0.7; }
          }
        `;
        document.head.appendChild(style);
      }
      
      const wrapper = timelineContainer.querySelector('.timeline-wrapper');
      if (wrapper) {
        wrapper.appendChild(indicator);
      }
    };
    
    const hideRowIndicator = () => {
      const existing = document.getElementById('row-drop-indicator');
      if (existing) existing.remove();
    };
    
    // Auto-scroll variables
    let autoScrollInterval = null;
    const SCROLL_ZONE_WIDTH = 100; // pixels from edge to start auto-scroll
    const SCROLL_SPEED_MAX = 15; // maximum scroll speed per frame
    const SCROLL_ACCELERATION = 1.2; // speed multiplier based on distance from edge
    
    // Auto-scroll function for smooth edge scrolling
    const handleAutoScroll = (mouseX, containerRect) => {
      const timelineContainer = document.getElementById('timeline-container');
      const headerContainer = document.querySelector('.timeline-header');
      
      if (!timelineContainer) return;
      
      const leftEdge = containerRect.left;
      const rightEdge = containerRect.right;
      
      let scrollSpeed = 0;
      let shouldScroll = false;
      
      // Check if mouse is near left edge
      if (mouseX < leftEdge + SCROLL_ZONE_WIDTH) {
        const distanceFromEdge = (leftEdge + SCROLL_ZONE_WIDTH) - mouseX;
        const speedFactor = Math.min(distanceFromEdge / SCROLL_ZONE_WIDTH, 1);
        scrollSpeed = -SCROLL_SPEED_MAX * speedFactor * SCROLL_ACCELERATION;
        shouldScroll = true;
        
      // Check if mouse is near right edge
      } else if (mouseX > rightEdge - SCROLL_ZONE_WIDTH) {
        const distanceFromEdge = mouseX - (rightEdge - SCROLL_ZONE_WIDTH);
        const speedFactor = Math.min(distanceFromEdge / SCROLL_ZONE_WIDTH, 1);
        scrollSpeed = SCROLL_SPEED_MAX * speedFactor * SCROLL_ACCELERATION;
        shouldScroll = true;
      }
      
      if (shouldScroll && Math.abs(scrollSpeed) > 1) {
        // Apply smooth scroll to both containers
        const currentScrollLeft = timelineContainer.scrollLeft;
        const newScrollLeft = Math.max(0, currentScrollLeft + scrollSpeed);
        
        timelineContainer.scrollLeft = newScrollLeft;
        if (headerContainer) {
          headerContainer.scrollLeft = newScrollLeft;
        }
        
        // Adjust drag start position to compensate for scrolling
        dragStartX += scrollSpeed;
      }
    };
    
    // Start auto-scroll when needed
    const startAutoScroll = (mouseX, containerRect) => {
      // Clear any existing interval
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
      }
      
      autoScrollInterval = setInterval(() => {
        // Use current mouse position for smooth scrolling
        handleAutoScroll(mouseX, containerRect);
      }, 16); // ~60fps
    };
    
    // Stop auto-scroll
    const stopAutoScroll = () => {
      if (autoScrollInterval) {
        clearInterval(autoScrollInterval);
        autoScrollInterval = null;
      }
    };
    
    // Left handle (resize start date)
    leftHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = true;
      dragType = 'resize-left';
      dragStartX = e.clientX;
      dragStartLeft = parseInt(projectBar.style.left || 0);
      dragStartWidth = parseInt(projectBar.style.width || 0);
      originalProject = { ...project };
      
      console.log('🔄 Starting left resize drag for:', project.title);
      
      projectBar.classList.add('dragging');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      // Immediate visual feedback for smooth start
      projectBar.style.transition = 'none';
      projectBar.style.zIndex = '1000';
      projectBar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      projectBar.style.transform = 'translateY(-1px)';
    });
    
    // Right handle (resize end date)
    rightHandle.addEventListener('mousedown', (e) => {
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = true;
      dragType = 'resize-right';
      dragStartX = e.clientX;
      dragStartLeft = parseInt(projectBar.style.left || 0);
      dragStartWidth = parseInt(projectBar.style.width || 0);
      originalProject = { ...project };
      
      console.log('🔄 Starting right resize drag for:', project.title);
      
      projectBar.classList.add('dragging');
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
      
      // Immediate visual feedback for smooth start
      projectBar.style.transition = 'none';
      projectBar.style.zIndex = '1000';
      projectBar.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
      projectBar.style.transform = 'translateY(-1px)';
    });
    
    // Project bar (move entire project, including between rows)
    projectBar.addEventListener('mousedown', (e) => {
      // Only start drag if not clicking on handles
      if (e.target === leftHandle || e.target === rightHandle) {
        return;
      }
      
      e.stopPropagation();
      e.preventDefault();
      
      isDragging = true;
      dragType = 'move';
      dragStartX = e.clientX;
      dragStartY = e.clientY;
      dragStartLeft = parseInt(projectBar.style.left || 0);
      originalProject = { ...project };
      originalRowIndex = currentRowIndex;
      
      console.log('🔄 Starting move drag for:', project.title, 'from row', currentRowIndex);
      
      projectBar.classList.add('dragging');
      document.body.style.cursor = 'grabbing';
      document.body.style.userSelect = 'none';
      
      // Immediate visual feedback for smooth start
      projectBar.style.transition = 'none';
      projectBar.style.zIndex = '1000';
      projectBar.style.boxShadow = '0 6px 16px rgba(0,0,0,0.25)';
      projectBar.style.transform = 'scale(1.02) translateY(-2px)';
    });
    
    // Mouse move handler with enhanced smoothness and visual feedback
    const handleMouseMove = (e) => {
      if (!isDragging) return;
      
      e.preventDefault(); // Prevent text selection and other default behaviors
      
      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;
      const dayWidth = getDayWidth();
      
      // Enhanced smooth visual feedback during drag
      requestAnimationFrame(() => {
        if (dragType === 'resize-left') {
          // Resize from left (change start date) - smooth resizing
          const newLeft = Math.max(0, dragStartLeft + deltaX);
          const newWidth = Math.max(dayWidth, dragStartWidth - deltaX);
          
          // Apply changes immediately for smooth feedback
          projectBar.style.left = newLeft + 'px';
          projectBar.style.width = newWidth + 'px';
          projectBar.style.transition = 'none'; // Disable transitions during drag
          
          // Enhanced visual feedback
          projectBar.style.opacity = '0.85';
          projectBar.style.transform = 'scale(1.02) translateY(-3px)';
          projectBar.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
          projectBar.style.zIndex = '1000';
          
          // Calculate and show new start date with smooth feedback
          const newStartDate = pixelToDate(newLeft);
          this.showDragFeedback(projectBar, `📅 Start: ${formatDateForInput(newStartDate)}`, 'resize-left');
          
        } else if (dragType === 'resize-right') {
          // Resize from right (change end date) - smooth resizing
          const newWidth = Math.max(dayWidth, dragStartWidth + deltaX);
          
          // Apply changes immediately for smooth feedback
          projectBar.style.width = newWidth + 'px';
          projectBar.style.transition = 'none';
          
          // Enhanced visual feedback
          projectBar.style.opacity = '0.85';
          projectBar.style.transform = 'scale(1.02) translateY(-3px)';
          projectBar.style.boxShadow = '0 8px 20px rgba(0,0,0,0.25)';
          projectBar.style.zIndex = '1000';
          
          // Calculate and show new end date with smooth feedback
          const newEndPixel = dragStartLeft + newWidth;
          const newEndDate = pixelToDate(newEndPixel);
          this.showDragFeedback(projectBar, `📅 End: ${formatDateForInput(newEndDate)}`, 'resize-right');
          
        } else if (dragType === 'move' || dragType === 'row-move') {
          // Move entire project with smooth following of mouse cursor
          const newLeft = Math.max(0, dragStartLeft + deltaX);
          
          // Get target row for smooth row transitions
          const targetRow = getTargetRow(e.clientY);
          let newTop;
          
          // Smooth row transition - project follows mouse vertically
          if (Math.abs(deltaY) > 10 && targetRow !== currentRowIndex) {
            // Smoothly transition between rows
            const currentRowY = this.config.yearHeaderHeight + this.config.timelineHeight + (currentRowIndex * this.config.rowHeight) + 10;
            const targetRowY = this.config.yearHeaderHeight + this.config.timelineHeight + (targetRow * this.config.rowHeight) + 10;
            
            // Interpolate between current and target row based on vertical mouse movement
            const verticalProgress = Math.min(Math.abs(deltaY) / 50, 1); // Smooth transition over 50px
            newTop = currentRowY + (targetRowY - currentRowY) * verticalProgress;
            
            // Show row indicator for visual feedback
            showRowIndicator(targetRow);
            
            // Update drag type to row-move for proper handling
            if (dragType !== 'row-move') {
              dragType = 'row-move';
              console.log(`🔄 Switching to row-move mode - target row: ${targetRow}`);
            }
          } else {
            // Stay in current row
            newTop = this.config.yearHeaderHeight + this.config.timelineHeight + (currentRowIndex * this.config.rowHeight) + 10;
            hideRowIndicator();
            if (dragType === 'row-move' && targetRow === currentRowIndex) {
              dragType = 'move';
            }
          }
          
          // Apply smooth visual changes immediately
          projectBar.style.left = newLeft + 'px';
          projectBar.style.top = newTop + 'px';
          projectBar.style.transition = 'none';
          
          // Enhanced visual feedback for move operations
          projectBar.style.opacity = '0.9';
          projectBar.style.transform = 'scale(1.05) translateZ(0)';
          projectBar.style.boxShadow = '0 12px 30px rgba(0,0,0,0.3)';
          projectBar.style.zIndex = '1000';
          projectBar.style.border = '3px solid rgba(255,255,255,0.8)';
          
          // Calculate and show date feedback
          const newStartDate = pixelToDate(newLeft);
          const projectDurationDays = Math.round(parseInt(projectBar.style.width) / dayWidth);
          const newEndDate = new Date(newStartDate.getTime() + (projectDurationDays * 24 * 60 * 60 * 1000));
          
          if (dragType === 'row-move') {
            this.showDragFeedback(projectBar, `🔄 Row ${targetRow + 1}: ${formatDateForInput(newStartDate)} → ${formatDateForInput(newEndDate)}`, 'row-move');
          } else {
            this.showDragFeedback(projectBar, `📅 ${formatDateForInput(newStartDate)} → ${formatDateForInput(newEndDate)}`, 'move');
          }
        }
        
        // Handle auto-scroll for smooth edge scrolling
        const timelineContainer = document.getElementById('timeline-container');
        if (timelineContainer) {
          const containerRect = timelineContainer.getBoundingClientRect();
          const mouseX = e.clientX;
          
          // Enhanced smooth auto-scroll at edges
          if ((mouseX < containerRect.left + 100) || (mouseX > containerRect.right - 100)) {
            // Start auto-scroll with smooth acceleration
            if (!autoScrollInterval) {
              startAutoScroll(mouseX, containerRect);
            }
            handleAutoScroll(mouseX, containerRect);
          } else {
            // Stop auto-scroll when not near edges
            stopAutoScroll();
          }
        }
      });
    };
    
    // Mouse up handler with row support
    const handleMouseUp = (e) => {
      if (!isDragging) return;
      
      console.log('✅ Ending drag for:', project.title, 'Type:', dragType);
      
      // Calculate final position
      const finalLeft = parseInt(projectBar.style.left);
      const finalWidth = parseInt(projectBar.style.width);
      const dayWidth = getDayWidth();
      const targetRow = getTargetRow(e.clientY);
      
      let newStartDate, newEndDate;
      let rowChanged = false;
      
      if (dragType === 'resize-left') {
        newStartDate = pixelToDate(finalLeft);
        const endPixel = finalLeft + finalWidth;
        newEndDate = pixelToDate(endPixel);
      } else if (dragType === 'resize-right') {
        newStartDate = pixelToDate(finalLeft);
        const endPixel = finalLeft + finalWidth;
        newEndDate = pixelToDate(endPixel);
      } else if (dragType === 'move' || dragType === 'row-move') {
        newStartDate = pixelToDate(finalLeft);
        const projectDurationDays = Math.round(finalWidth / dayWidth);
        newEndDate = new Date(newStartDate.getTime() + (projectDurationDays * 24 * 60 * 60 * 1000));
        
        // Check if row changed and handle collision detection
        if (dragType === 'row-move' && targetRow !== originalRowIndex) {
          rowChanged = true;
          
          // Use collision detection and auto-snap to find optimal position
          try {
            const allProjects = SimpleStorage.getAllProjects();
            const optimalPosition = this.rowManager.findOptimalPosition(
              project.id, targetRow, newStartDate, newEndDate, allProjects
            );
            
            // Update project with optimal position
            if (optimalPosition.row !== targetRow || 
                optimalPosition.startDate.getTime() !== newStartDate.getTime() || 
                optimalPosition.endDate.getTime() !== newEndDate.getTime()) {
              
              console.log(`🎨 Auto-snap: Original target row ${targetRow}, optimal row ${optimalPosition.row}`);
              
              // Update dates if they were adjusted
              if (optimalPosition.startDate.getTime() !== newStartDate.getTime() || 
                  optimalPosition.endDate.getTime() !== newEndDate.getTime()) {
                newStartDate = optimalPosition.startDate;
                newEndDate = optimalPosition.endDate;
                console.log(`📍 Auto-snap dates: ${newStartDate.toISOString().split('T')[0]} to ${newEndDate.toISOString().split('T')[0]}`);
              }
              
              targetRow = optimalPosition.row;
            }
            
            // Move project to optimal row
            this.rowManager.moveProjectToRow(project.id, targetRow, allProjects);
            console.log(`🔄 Project moved from row ${originalRowIndex} to row ${targetRow} with collision avoidance`);
          } catch (error) {
            console.error('❌ Error moving project with collision detection:', error);
            rowChanged = false;
          }
        }
      }
      
      // Update project data
      if (newStartDate && newEndDate && newStartDate < newEndDate) {
        this.updateProjectDates(project.id, newStartDate, newEndDate);
        console.log(`📅 Updated ${project.title}: ${formatDateForInput(newStartDate)} to ${formatDateForInput(newEndDate)}`);
        
        let message = `📅 Updated ${project.title} dates`;
        if (rowChanged) {
          if (targetRow !== originalRowIndex) {
            message = `🔄 Moved ${project.title} to Row ${targetRow + 1}`;
          }
          
          // Add auto-snap indicator if dates were adjusted
          const originalDuration = project.end_date && project.start_date 
            ? new Date(project.end_date) - new Date(project.start_date)
            : newEndDate - newStartDate;
          const newDuration = newEndDate - newStartDate;
          
          if (Math.abs(originalDuration - newDuration) > 24 * 60 * 60 * 1000) { // More than 1 day difference
            message += ` 🎨 (Auto-snapped to avoid conflicts)`;
          }
        }
        showNotification(message, 'success');
        
        // Re-render timeline if row changed
        if (rowChanged) {
          setTimeout(() => {
            this.renderTimeline();
          }, 100);
        }
      } else {
        // Invalid dates, revert
        console.warn('⚠️ Invalid dates, reverting changes');
        this.revertProjectPosition(projectBar, originalProject, bounds);
        showNotification('Invalid date range, changes reverted', 'warning');
      }
      
      // Smooth cleanup with transitions
      isDragging = false;
      dragType = null;
      projectBar.classList.remove('dragging');
      projectBar.classList.add('was-dragging');
      
      // Smooth transition back to normal state
      projectBar.style.transition = 'all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94)';
      projectBar.style.opacity = '1';
      projectBar.style.transform = 'scale(1) translateY(0) translateZ(0)';
      projectBar.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
      projectBar.style.zIndex = '1';
      projectBar.style.border = '2px solid rgba(255,255,255,0.8)';
      
      // Reset cursor and selection
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      
      // Clean up transitions after animation completes
      setTimeout(() => {
        if (projectBar) {
          projectBar.style.transition = '';
        }
      }, 300);
      
      // Hide row indicator
      hideRowIndicator();
      
      this.hideDragFeedback();
    };
    
    // Add global event listeners
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Store cleanup function
    projectBar._cleanupDragListeners = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      hideRowIndicator();
    };
  },
  
  // Add temporary navigation indicator during today navigation
  addTodayNavigationIndicator() {
    // Remove any existing navigation indicator
    const existingIndicator = document.getElementById('today-navigation-indicator');
    if (existingIndicator) {
      existingIndicator.remove();
    }
    
    const navIndicator = document.createElement('div');
    navIndicator.id = 'today-navigation-indicator';
    navIndicator.style.cssText = `
      position: fixed;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background: rgba(220, 53, 69, 0.95);
      color: white;
      padding: 16px 24px;
      border-radius: 30px;
      font-size: 16px;
      font-weight: bold;
      z-index: 3000;
      box-shadow: 0 8px 24px rgba(0,0,0,0.3), 0 0 0 4px rgba(255,255,255,0.2);
      text-shadow: 1px 1px 2px rgba(0,0,0,0.5);
      animation: todayNavigationPulse 0.8s ease-in-out infinite;
      pointer-events: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    `;
    
    navIndicator.innerHTML = `
      <div style="display: flex; align-items: center; gap: 8px;">
        <span style="font-size: 18px;">📅</span>
        <span>Navigating to Today</span>
      </div>
    `;
    
    // Add CSS animation for the navigation indicator
    if (!document.getElementById('today-navigation-animation-style')) {
      const style = document.createElement('style');
      style.id = 'today-navigation-animation-style';
      style.textContent = `
        @keyframes todayNavigationPulse {
          0%, 100% { 
            transform: translate(-50%, -50%) scale(1); 
            opacity: 0.9;
          }
          50% { 
            transform: translate(-50%, -50%) scale(1.05); 
            opacity: 1;
          }
        }
      `;
      document.head.appendChild(style);
    }
    
    document.body.appendChild(navIndicator);
    
    // Auto-hide after animation completes
    setTimeout(() => {
      if (navIndicator && navIndicator.parentNode) {
        navIndicator.style.opacity = '0';
        navIndicator.style.transition = 'opacity 0.3s ease';
        setTimeout(() => {
          if (navIndicator && navIndicator.parentNode) {
            navIndicator.remove();
          }
        }, 300);
      }
    }, 800);
    
    console.log('✅ Today navigation indicator added');
  },
  
  // Get status color
  getStatusColor(status) {
    const colors = {
      'concept-design': '#6f42c1',
      'solution-design': '#007bff', 
      'engineering': '#28a745',
      'uat': '#ffc107',
      'release': '#dc3545'
    };
    return colors[status] || colors['concept-design'];
  },
  
  // Format date
  formatDate(date, format) {
    const options = {
      'MMM YYYY': { month: 'short', year: 'numeric' },
      'MMM DD': { month: 'short', day: '2-digit' },
      'ddd MM/DD': { weekday: 'short', month: '2-digit', day: '2-digit' },
      'MM/DD': { month: '2-digit', day: '2-digit' },
      'DD': { day: '2-digit' }
    };
    
    return date.toLocaleDateString('en-US', options[format] || options['MMM DD']);
  },
  
  // Add scroll synchronization between headers and timeline content
  addScrollSynchronization() {
    const headerContainer = document.querySelector('.timeline-header');
    const timelineContainer = document.getElementById('timeline-container');
    
    if (!headerContainer || !timelineContainer) {
      console.warn('⚠️ Cannot add scroll sync - containers not found');
      return;
    }
    
    // Clean up existing listeners to prevent duplicates
    this.cleanupScrollSync();
    this.cleanupDragPanning();
    
    console.log('🔁 Adding scroll synchronization between headers and timeline');
    
    // Create scroll sync function
    this.scrollSyncListener = (event) => {
      const isHeaderScroll = event.target === headerContainer;
      const isContentScroll = event.target === timelineContainer || event.target.closest('.timeline-wrapper');
      
      // Sync header scroll with content scroll
      if (isContentScroll && !this.isSyncing) {
        this.isSyncing = true;
        const scrollLeft = timelineContainer.scrollLeft || event.target.scrollLeft;
        headerContainer.scrollLeft = scrollLeft;
        setTimeout(() => { this.isSyncing = false; }, 10);
      }
      
      // Sync content scroll with header scroll  
      if (isHeaderScroll && !this.isSyncing) {
        this.isSyncing = true;
        timelineContainer.scrollLeft = headerContainer.scrollLeft;
        setTimeout(() => { this.isSyncing = false; }, 10);
      }
    };
    
    // Add scroll listeners
    timelineContainer.addEventListener('scroll', this.scrollSyncListener, { passive: true });
    headerContainer.addEventListener('scroll', this.scrollSyncListener, { passive: true });
    
    // Also handle wheel events for better scroll experience
    this.wheelHandler = (event) => {
      // Allow horizontal scrolling on timeline containers
      if (event.deltaX !== 0 || (event.shiftKey && event.deltaY !== 0)) {
        event.preventDefault();
        const scrollAmount = event.deltaX || event.deltaY;
        const currentScrollLeft = timelineContainer.scrollLeft;
        const newScrollLeft = Math.max(0, currentScrollLeft + scrollAmount);
        
        timelineContainer.scrollLeft = newScrollLeft;
        headerContainer.scrollLeft = newScrollLeft;
      }
    };
    
    timelineContainer.addEventListener('wheel', this.wheelHandler, { passive: false });
    headerContainer.addEventListener('wheel', this.wheelHandler, { passive: false });
    
    console.log('✅ Scroll synchronization enabled');
  },
  
  // Clean up scroll synchronization listeners
  cleanupScrollSync() {
    const headerContainer = document.querySelector('.timeline-header');
    const timelineContainer = document.getElementById('timeline-container');
    
    if (this.scrollSyncListener && headerContainer && timelineContainer) {
      timelineContainer.removeEventListener('scroll', this.scrollSyncListener);
      headerContainer.removeEventListener('scroll', this.scrollSyncListener);
      timelineContainer.removeEventListener('wheel', this.wheelHandler);
      headerContainer.removeEventListener('wheel', this.wheelHandler);
      console.log('🧽 Cleaned up scroll sync listeners');
    }
  },
  
  // Clean up drag panning listeners
  cleanupDragPanning() {
    if (this.dragPanListeners) {
      const headerContainer = document.querySelector('.timeline-header');
      const timelineContainer = document.getElementById('timeline-container');
      const timelineWrapper = document.querySelector('.timeline-wrapper');
      
      if (headerContainer && timelineContainer) {
        headerContainer.removeEventListener('mousedown', this.dragPanListeners.headerMouseDown);
        timelineContainer.removeEventListener('mousedown', this.dragPanListeners.timelineMouseDown);
        if (timelineWrapper) {
          timelineWrapper.removeEventListener('mousedown', this.dragPanListeners.timelineMouseDown);
        }
        document.removeEventListener('mousemove', this.dragPanListeners.documentMouseMove);
        document.removeEventListener('mouseup', this.dragPanListeners.documentMouseUp);
        console.log('🧽 Cleaned up drag pan listeners');
      }
      this.dragPanListeners = null;
    }
  },
  
  // Add drag panning functionality for intuitive timeline navigation
  addDragPanning() {
    const headerContainer = document.querySelector('.timeline-header');
    const timelineContainer = document.getElementById('timeline-container');
    const timelineWrapper = document.querySelector('.timeline-wrapper');
    
    if (!headerContainer || !timelineContainer) {
      console.warn('⚠️ Cannot add drag panning - containers not found:', {
        headerContainer: !!headerContainer,
        timelineContainer: !!timelineContainer,
        timelineWrapper: !!timelineWrapper
      });
      return;
    }
    
    console.log('🔄 Adding drag panning functionality...');
    
    // Add draggable class for cursor styling
    headerContainer.classList.add('draggable');
    timelineContainer.classList.add('draggable');
    if (timelineWrapper) {
      timelineWrapper.classList.add('draggable');
    }
    
    // Drag state tracking
    let isDragging = false;
    let dragStartX = 0;
    let dragStartScrollLeft = 0;
    let dragTarget = null;
    let lastMoveX = 0;
    let lastMoveTime = 0;
    let velocity = 0;
    
    // Mouse down handler
    const handleMouseDown = (event) => {
      // Only start drag on empty areas, not on interactive elements
      if (event.target.closest('.project-bar') || 
          event.target.closest('button') || 
          event.target.closest('a') ||
          event.target.closest('.drag-handle') ||
          event.target.closest('.resize-handle') ||
          event.target.closest('.today-marker') ||
          event.target.closest('.year-header') ||
          event.target.hasAttribute('draggable') ||
          event.target.style.cursor === 'move' ||
          event.target.style.cursor === 'grab' ||
          event.target.style.cursor === 'grabbing' ||
          event.target.style.cursor === 'ew-resize') {
        console.log('⚠️ Drag blocked - clicked on interactive element:', event.target);
        return;
      }
      
      // Initialize drag state
      isDragging = true;
      dragStartX = event.clientX;
      dragStartScrollLeft = timelineContainer.scrollLeft;
      dragTarget = event.currentTarget;
      lastMoveX = event.clientX;
      lastMoveTime = Date.now();
      
      // Add dragging visual state
      headerContainer.classList.add('dragging');
      timelineContainer.classList.add('dragging');
      if (timelineWrapper) {
        timelineWrapper.classList.add('dragging');
      }
      document.body.style.cursor = 'grabbing';
      
      // Prevent text selection and default behaviors
      event.preventDefault();
      event.stopPropagation();
      
      console.log('🔄 Started drag panning from X:', dragStartX, 'ScrollLeft:', dragStartScrollLeft);
    };
    
    // Mouse move handler - provides real-time canvas movement
    const handleMouseMove = (event) => {
      if (!isDragging) return;
      
      event.preventDefault();
      
      // Track velocity for potential momentum
      const currentTime = Date.now();
      const currentX = event.clientX;
      
      if (lastMoveTime > 0) {
        const timeDiff = currentTime - lastMoveTime;
        const distance = currentX - lastMoveX;
        velocity = timeDiff > 0 ? distance / timeDiff : 0;
      }
      
      lastMoveX = currentX;
      lastMoveTime = currentTime;
      
      // Calculate drag distance - inverted for natural movement
      const dragDistance = event.clientX - dragStartX;
      const newScrollLeft = Math.max(0, dragStartScrollLeft - dragDistance);
      
      // Apply scroll immediately to both containers for real-time movement
      timelineContainer.scrollLeft = newScrollLeft;
      headerContainer.scrollLeft = newScrollLeft;
    };
    
    // Mouse up handler
    const handleMouseUp = (event) => {
      if (!isDragging) return;
      
      isDragging = false;
      dragTarget = null;
      
      // Remove dragging visual state
      headerContainer.classList.remove('dragging');
      timelineContainer.classList.remove('dragging');
      if (timelineWrapper) {
        timelineWrapper.classList.remove('dragging');
      }
      document.body.style.cursor = '';
      
      console.log('🔄 Ended drag panning at X:', event.clientX, 'Final ScrollLeft:', timelineContainer.scrollLeft);
    };
    
    // Add event listeners with error handling
    try {
      headerContainer.addEventListener('mousedown', handleMouseDown);
      timelineContainer.addEventListener('mousedown', handleMouseDown);
      if (timelineWrapper) {
        timelineWrapper.addEventListener('mousedown', handleMouseDown);
      }
      
      // Use document-level listeners for mouse move and up to handle dragging outside containers
      document.addEventListener('mousemove', handleMouseMove, { passive: false });
      document.addEventListener('mouseup', handleMouseUp);
      
      console.log('✅ Drag panning event listeners attached successfully');
    } catch (error) {
      console.error('❌ Error attaching drag panning listeners:', error);
      return;
    }
    
    // Store references for cleanup if needed
    this.dragPanListeners = {
      headerMouseDown: handleMouseDown,
      timelineMouseDown: handleMouseDown,
      documentMouseMove: handleMouseMove,
      documentMouseUp: handleMouseUp
    };
    
    console.log('✅ Drag panning enabled - click and drag to pan timeline');
  }
};

// Timeline zoom function with time-based levels
function timelineZoom(action) {
  console.log(`🔍 Timeline zoom: ${action}`);
  
  // Define zoom order from most zoomed out to most zoomed in
  const zoomOrder = ['overview', 'year', 'quarter', 'month', 'fortnight', 'week'];
  const currentIndex = zoomOrder.indexOf(TimelineRenderer.currentZoom);
  
  let newZoom = TimelineRenderer.currentZoom;
  
  switch (action) {
    case 'in':
      // Zoom in = move to more detailed view (toward 'week')
      if (currentIndex < zoomOrder.length - 1) {
        newZoom = zoomOrder[currentIndex + 1];
      }
      break;
    case 'out':
      // Zoom out = move to broader view (toward 'year')
      if (currentIndex > 0) {
        newZoom = zoomOrder[currentIndex - 1];
      }
      break;
    case 'reset':
      // Reset to default month view
      newZoom = 'month';
      break;
  }
  
  if (newZoom !== TimelineRenderer.currentZoom) {
    const oldZoom = TimelineRenderer.currentZoom;
    
    // Calculate Today's position for centering
    const projects = SimpleStorage.getAllProjects();
    const bounds = TimelineRenderer.calculateTimelineBounds(projects);
    const today = bounds.today;
    
    console.log(`🔍 Zoom changed: ${oldZoom} → ${newZoom} - centering on Today`);
    
    // Apply new zoom level
    TimelineRenderer.currentZoom = newZoom;
    
    // Re-render timeline with new zoom level
    TimelineRenderer.renderTimeline();
    
    // Center on Today after render completes - multiple attempts for reliability
    const centerOnTodayAfterZoom = () => {
      const timelineContainer = document.getElementById('timeline-container');
      if (timelineContainer && timelineContainer.clientWidth > 0) {
        // Calculate Today's pixel position in new zoom level
        const newZoomConfig = TimelineRenderer.zoomLevels[newZoom];
        const dayWidth = newZoomConfig.dayWidth;
        const todayX = Math.floor((today - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
        
        // Center Today in the viewport
        const containerWidth = timelineContainer.clientWidth;
        const centerScrollLeft = Math.max(0, todayX - (containerWidth / 2));
        
        // Apply centered scroll position
        timelineContainer.scrollLeft = centerScrollLeft;
        const headerContainer = document.querySelector('.timeline-header');
        if (headerContainer) {
          headerContainer.scrollLeft = centerScrollLeft;
        }
        
        console.log(`🔍 Centered on Today: todayX=${todayX}px, centerScroll=${centerScrollLeft}px, zoom=${newZoom}, containerWidth=${containerWidth}px`);
        
        // Show zoom confirmation with Today centering
        const zoomConfig = TimelineRenderer.zoomLevels[newZoom];
        const zoomMessage = newZoom === 'overview' ? 
          `🌍 ${zoomConfig.name} - All Years Visible` : 
          `🔍 ${zoomConfig.name} - Centered on Today`;
        showNotification(zoomMessage, 'info');
        
        return true; // Success
      }
      return false; // Container not ready
    };
    
    // Try centering with multiple timing attempts
    const attempts = [100, 200, 300];
    attempts.forEach((delay, index) => {
      setTimeout(() => {
        if (!centerOnTodayAfterZoom() && index === attempts.length - 1) {
          console.warn('⚠️ Failed to center on Today after zoom - container not ready');
        }
      }, delay);
    });
    
    // Zoom level notification handled in the centering logic above
  } else {
    // At zoom limit
    const limitMessage = action === 'in' ? 'Maximum zoom level (Week View)' : 'Minimum zoom level (Overview)';
    console.log(`⚠️ ${limitMessage}`);
    showNotification(limitMessage, 'warning');
  }
}

// Go to Today function - smoothly animates timeline to center on today
function goToToday() {
  console.log('📅 Navigating to today...');
  
  const projects = SimpleStorage.getAllProjects();
  if (projects.length === 0) {
    showNotification('No projects to display on timeline', 'warning');
    return;
  }
  
  // Calculate timeline bounds
  const today = new Date();
  const bounds = TimelineRenderer.calculateTimelineBounds(projects);
  
  // Get timeline container
  const container = document.querySelector('.timeline-wrapper');
  if (!container) {
    console.warn('⚠️ Timeline container not found for today navigation');
    return;
  }
  
  // Calculate today position
  const zoomConfig = TimelineRenderer.zoomLevels[TimelineRenderer.currentZoom];
  const dayWidth = zoomConfig.dayWidth;
  const todayX = Math.floor((bounds.today - bounds.start) / (24 * 60 * 60 * 1000)) * dayWidth;
  const containerWidth = container.parentElement.clientWidth;
  const targetScrollLeft = Math.max(0, todayX - (containerWidth / 2));
  
  console.log(`🎯 Animating to today position: ${todayX}px (scroll to: ${targetScrollLeft}px)`);
  
  // Smooth scroll animation
  const scrollContainer = container.parentElement;
  const startScrollLeft = scrollContainer.scrollLeft;
  const scrollDistance = targetScrollLeft - startScrollLeft;
  const duration = 800; // 800ms animation
  const startTime = performance.now();
  
  // Add temporary visual indicator
  TimelineRenderer.addTodayNavigationIndicator();
  
  function animateScroll(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    
    // Easing function (ease-out)
    const easeOut = 1 - Math.pow(1 - progress, 3);
    
    const newScrollLeft = startScrollLeft + (scrollDistance * easeOut);
    scrollContainer.scrollLeft = newScrollLeft;
    
    // Also sync header scroll position
    const headerContainer = document.querySelector('.timeline-header');
    if (headerContainer) {
      headerContainer.scrollLeft = newScrollLeft;
    }
    
    if (progress < 1) {
      requestAnimationFrame(animateScroll);
    } else {
      console.log('✅ Today navigation animation complete');
      showNotification('📅 Centered on Today!', 'success');
    }
  }
  
  requestAnimationFrame(animateScroll);
}

// Global exposure for debugging
window.RoadmapApp = {
  SimpleStorage,
  showNotification,
  loadTimelineProjects,
  exportProjectsCSV
};

// Initialize when DOM is ready
console.log('⏳ Setting up DOM ready listener...');

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    console.log('📖 DOM Content Loaded - Initializing...');
    initializeUI();
  });
} else {
  console.log('📖 DOM Already Ready - Initializing immediately...');
  initializeUI();
}

// Single backup initialization to prevent duplicates
setTimeout(() => {
  if (!window.roadmapInitialized) {
    console.log('🔄 Backup initialization running...');
    window.roadmapInitialized = true;
    initializeUI();
  }
}, 500);

console.log('🎉 Simple App.js loaded successfully!');