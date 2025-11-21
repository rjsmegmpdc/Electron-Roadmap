# Roadmap-Tool v2 - User Help Documentation

## 📖 Table of Contents

1. [Getting Started](#getting-started)
2. [Project Management](#project-management)
3. [Resource Management](#resource-management)
4. [Task Management](#task-management)
5. [Interactive Dashboards](#interactive-dashboards)
6. [Analytics & Tracking](#analytics--tracking)
7. [Data Visualization](#data-visualization)
8. [Real-time Features](#real-time-features)
9. [Data Export](#data-export)
10. [Configuration](#configuration)
11. [Troubleshooting](#troubleshooting)

---

## 🚀 Getting Started

### System Requirements
- **Browser**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript**: ES2020+ support required
- **WebSocket**: For real-time features
- **Storage**: 10MB+ available local storage

### Quick Setup
```html
<!DOCTYPE html>
<html>
<head>
    <title>Roadmap Tool</title>
    <link rel="stylesheet" href="src/css/styles.css">
</head>
<body>
    <div id="app"></div>
    <script type="module" src="src/js/app.js"></script>
</body>
</html>
```

### First Steps
1. **Initialize the System** - Load the application
2. **Create Your First Project** - Set up project basics
3. **Add Resources** - Define team members and contractors
4. **Create Tasks** - Break down project into manageable tasks
5. **Build Dashboard** - Visualize your data

---

## 🏗️ Project Management

### Creating Projects

#### Required Information
- **Title**: Project name (e.g., "Office 365 Migration")
- **Start Date**: DD-MM-YYYY format (e.g., "01-06-2024")
- **End Date**: DD-MM-YYYY format (must be after start date)
- **Budget**: Amount in cents (e.g., 500000 = $5,000)
- **Financial Treatment**: CAPEX, OPEX, or MIXED

#### Optional Information
- **Description**: Detailed project description
- **Lane**: office365, euc, compliance, or other
- **PM Name**: Project manager name
- **Status**: Project lifecycle status

### Project Statuses & Gates

The system enforces progression gates between statuses:

1. **Concept Design** → **Solution Design**
   - Requires: Budget > $0
   - Purpose: Ensure project is financially viable

2. **Solution Design** → **Engineering**
   - Requires: At least 1 task created
   - Purpose: Ensure project is properly planned

3. **Engineering** → **UAT**
   - Requires: At least 1 forecast created
   - Purpose: Ensure timeline is estimated

4. **UAT** → **Release**
   - Requires: All tasks completed
   - Purpose: Ensure project is ready for release

### Example Usage
```javascript
// Create a new project
const project = projectManager.createProject({
  title: "Cloud Migration Phase 1",
  start_date: "01-07-2024",
  end_date: "31-12-2024",
  budget_cents: 150000000, // $1.5M
  financial_treatment: "CAPEX",
  lane: "office365",
  pm_name: "John Smith"
});

// Update project status
projectManager.updateProject(project.id, {
  status: "solution-design"
});
```

---

## 👥 Resource Management

### Resource Types

#### Internal Resources
- **Company employees**
- **No hourly rate required**
- **Examples**: Developers, Architects, Project Managers
- **Cost**: Handled outside system

#### Contractor Resources
- **External individuals/consultants**
- **Require hourly rate** (in cents)
- **Examples**: Specialists, Temporary developers
- **Cost**: Calculated based on hours × rate

#### Vendor Resources
- **External service providers**
- **Require hourly rate** for cost calculations
- **Examples**: Support services, Training providers
- **Cost**: Calculated based on hours × rate

### Resource Management Operations

#### Adding Resources
```javascript
// Add internal resource
const developer = resourceManager.createResource("proj-001", {
  name: "Sarah Johnson",
  type: "internal",
  allocation: 0.8 // 80% allocation
});

// Add contractor with rate
const specialist = resourceManager.createResource("proj-001", {
  name: "Mike Expert",
  type: "contractor",
  allocation: 0.5, // 50% allocation
  rate_per_hour: 15000 // $150/hour
});
```

#### Resource Analysis
```javascript
// Check if resource is overallocated
const totalAllocation = resourceManager.getTotalResourceAllocation("res-001");
const isOverallocated = resourceManager.isResourceOverallocated("res-001");

// Calculate costs
const cost = resourceManager.calculateResourceCost(resource, 40); // 40 hours
console.log(`Total cost: $${cost / 100}`);
```

### Allocation Guidelines
- **0.0 to 1.0**: Allocation percentage (e.g., 0.8 = 80%)
- **Total allocation**: Across all projects should not exceed 1.0
- **Overallocation detection**: System warns when total > 1.0

---

## ✅ Task Management

### Task Creation

#### Required Fields
- **Title**: Task name/description
- **Start Date**: DD-MM-YYYY format
- **End Date**: DD-MM-YYYY format (must be after start date)
- **Effort Hours**: Estimated effort (≥ 0)

#### Optional Fields
- **Status**: planned, in-progress, completed (default: planned)
- **Assigned Resources**: Array of resource IDs

### Task Lifecycle

#### Status Progression
1. **Planned**: Task is scheduled but not started
2. **In Progress**: Task is currently being worked on
3. **Completed**: Task is finished

#### Progress Tracking
- **Project Progress**: Calculated as (completed_hours / total_hours) × 100
- **Only completed tasks** count toward progress
- **Real-time updates** when task status changes

### Example Usage
```javascript
// Create a task
const task = taskManager.createTask("proj-001", {
  title: "API Development",
  start_date: "01-06-2025",
  end_date: "30-06-2025",
  effort_hours: 120,
  assigned_resources: ["res-dev-001", "res-dev-002"]
});

// Update task status
taskManager.updateTask(task.id, {
  status: "in-progress"
});

// Calculate project progress
const progress = taskManager.calculateProjectProgress("proj-001");
console.log(`${progress.progress}% complete`);
```

---

## 📊 Interactive Dashboards

### Creating Dashboards

#### Basic Dashboard Setup
```javascript
// Create a new dashboard
const dashboard = dashboardSystem.createDashboard({
  title: "Project Overview",
  container: document.getElementById("dashboard-container"),
  theme: "default",
  gridSize: 12,
  rowHeight: 100
});
```

#### Dashboard Configuration
- **Grid Size**: Number of columns (usually 12)
- **Row Height**: Height of each grid row in pixels
- **Theme**: Visual appearance (default, dark, custom)
- **Responsive**: Automatic layout adjustment for different screen sizes

### Widget Management

#### Widget Types
1. **Chart Widget**: Interactive charts and graphs
2. **Metric Widget**: Key performance indicators
3. **Text Widget**: Static or dynamic text content
4. **Table Widget**: Tabular data display
5. **IFrame Widget**: External content embedding
6. **Image Widget**: Static images or dynamic image content
7. **Custom Widget**: User-defined custom widgets

#### Adding Widgets
```javascript
// Add a chart widget
const chartWidget = dashboardSystem.addWidget(dashboard, {
  type: "chart",
  title: "Project Progress",
  x: 0, y: 0,        // Grid position
  width: 6, height: 4, // Grid size
  config: {
    chartType: "line",
    dataSource: "project-progress"
  }
});

// Add a metric widget
const metricWidget = dashboardSystem.addWidget(dashboard, {
  type: "metric",
  title: "Budget Utilization",
  x: 6, y: 0,
  width: 3, height: 2,
  config: {
    value: "${budget_used}",
    format: "currency",
    trend: "up"
  }
});
```

### Layout Management

#### Drag and Drop
- **Enable Editing**: `dashboard.enterEditMode()`
- **Drag Widgets**: Click and drag to reposition
- **Resize Widgets**: Drag corners/edges to resize
- **Delete Widgets**: Use delete button or keyboard shortcut

#### Responsive Breakpoints
- **XS**: 480px - Mobile phones
- **SM**: 768px - Tablets portrait
- **MD**: 992px - Tablets landscape
- **LG**: 1200px - Desktop
- **XL**: 1600px - Large desktop

### Theme Customization
```javascript
// Apply custom theme
dashboardSystem.applyTheme(dashboard, {
  name: "custom-dark",
  colors: {
    primary: "#007bff",
    secondary: "#6c757d",
    background: "#1a1a1a",
    surface: "#2d2d2d",
    text: "#ffffff"
  },
  fonts: {
    primary: "Arial, sans-serif",
    secondary: "Roboto, sans-serif"
  }
});
```

---

## 📈 Analytics & Tracking

### Event Tracking

#### Automatic Tracking
The system automatically tracks:
- **Page Views**: Route changes and navigation
- **User Interactions**: Clicks, form submissions, widget interactions
- **Performance Metrics**: Page load times, memory usage
- **Errors**: JavaScript errors and system issues

#### Custom Event Tracking
```javascript
// Track custom events
analyticsEngine.track("project", "created", {
  projectId: "proj-001",
  projectType: "migration",
  budget: 1500000
});

// Track user interactions
analyticsEngine.trackInteraction("button", "dashboard-create", {
  section: "dashboard",
  action: "create-dashboard"
});

// Track performance metrics
analyticsEngine.trackPerformance("api-call", {
  endpoint: "/projects",
  duration: 245,
  success: true
});
```

### Session Management

#### Session Features
- **Automatic session creation** on first page load
- **Session persistence** across page reloads
- **Device fingerprinting** for user identification
- **Session timeout** after period of inactivity

#### Session Data
```javascript
// Get current session
const session = analyticsEngine.getCurrentSession();
console.log({
  id: session.id,
  startTime: session.startTime,
  userId: session.userId,
  pageViews: session.pageViews,
  interactions: session.interactions
});
```

### Report Generation

#### Built-in Reports
1. **User Activity Report**: Interaction patterns and engagement
2. **Performance Report**: System performance metrics
3. **Error Report**: Error tracking and analysis
4. **Session Report**: User session analysis

#### Custom Reports
```javascript
// Generate custom report
const report = analyticsEngine.generateReport("custom-project-metrics", {
  dateRange: {
    start: "01-01-2024",
    end: "31-12-2024"
  },
  metrics: ["project_creation", "task_completion", "resource_utilization"],
  groupBy: "month"
});
```

---

## 🎨 Data Visualization

### Chart Types

#### Basic Charts
1. **Line Charts**: Time series data, trends
2. **Bar Charts**: Comparisons, categorical data
3. **Pie Charts**: Proportional data, percentages
4. **Scatter Plots**: Correlation analysis
5. **Timeline Charts**: Gantt charts, project timelines

#### Advanced Visualizations
1. **Heatmaps**: Density and correlation visualization
2. **Treemaps**: Hierarchical data with size encoding
3. **Network Diagrams**: Relationships and connections
4. **Calendar Views**: Time-based event visualization
5. **Sankey Diagrams**: Flow and process visualization
6. **Sunburst Charts**: Hierarchical data with drill-down

### Creating Visualizations

#### Basic Chart Creation
```javascript
// Create a line chart
const lineChart = chartEngine.createChart({
  type: "line",
  container: document.getElementById("chart-container"),
  data: [
    { x: "Jan", y: 100 },
    { x: "Feb", y: 150 },
    { x: "Mar", y: 120 }
  ],
  config: {
    responsive: true,
    animations: true,
    colors: ["#007bff", "#28a745"]
  }
});
```

#### Advanced Visualization
```javascript
// Create a treemap
const treemap = dataExportTools.createTreemap({
  data: hierarchicalData,
  width: 800,
  height: 600,
  colorScale: d3.scaleOrdinal(d3.schemeCategory10)
});
```

### Interactive Features

#### Chart Interactions
- **Zoom**: Mouse wheel or pinch gestures
- **Pan**: Click and drag to move around
- **Tooltips**: Hover for detailed information
- **Selection**: Click to select data points
- **Drill-down**: Click to explore sub-categories

#### Customization Options
```javascript
// Chart configuration
const chartConfig = {
  responsive: true,
  maintainAspectRatio: false,
  animations: {
    duration: 1000,
    easing: "easeInOutQuart"
  },
  tooltips: {
    enabled: true,
    format: "currency"
  },
  zoom: {
    enabled: true,
    mode: "xy"
  }
};
```

---

## ⚡ Real-time Features

### WebSocket Connection

#### Connection Setup
```javascript
// Connect to WebSocket server
const connected = await realtimeStreaming.connect("ws://localhost:8080");
if (connected) {
  console.log("Connected to real-time server");
}
```

#### Connection Management
- **Automatic reconnection** with exponential backoff
- **Heartbeat monitoring** to detect connection issues
- **Connection status tracking** and notifications
- **Performance monitoring** for latency and throughput

### Data Subscriptions

#### Channel-based Subscriptions
```javascript
// Subscribe to chart updates
const chartSub = realtimeStreaming.subscribeToChart(myChart, "live-data", {
  incremental: true,
  maxDataPoints: 100,
  throttle: 1000 // Update max once per second
});

// Subscribe to dashboard widget updates
const widgetSub = realtimeStreaming.subscribeToWidget(myWidget, "metrics", {
  filter: (data) => data.value > 0,
  transform: (data) => ({ ...data, formatted: formatValue(data.value) })
});
```

#### Subscription Options
- **Filter**: Server-side or client-side data filtering
- **Transform**: Data transformation before delivery
- **Throttle**: Rate limiting for high-frequency updates
- **Buffer**: Batch multiple updates together
- **Incremental**: Add new data points vs. replace all data

### Performance Optimization

#### Automatic Optimizations
- **Update batching** to reduce rendering overhead
- **Data buffering** for efficient processing
- **Throttling** to prevent overwhelming the UI
- **Pause/resume** during page visibility changes

#### Manual Control
```javascript
// Get connection status and performance metrics
const status = realtimeStreaming.getStatus();
console.log({
  connected: status.isConnected,
  subscriptions: status.subscriptionsCount,
  averageLatency: status.performance.averageLatency,
  messageRate: status.performance.averageMessageRate
});

// Clear buffers if needed
realtimeStreaming.clearBuffers();
```

---

## 📤 Data Export

### Export Formats

#### Supported Formats
1. **JSON**: Structured data export
2. **CSV**: Spreadsheet-compatible format
3. **XML**: Structured markup export
4. **PDF**: Formatted document export

#### Chart Exports
- **PNG**: Raster image format
- **SVG**: Vector graphics format
- **PDF**: Document format with charts

### Export Operations

#### Data Export
```javascript
// Export project data as JSON
const jsonData = await dataExportTools.exportData(projects, "json");

// Export as CSV for spreadsheet
const csvData = await dataExportTools.exportData(projects, "csv", {
  fields: ["title", "start_date", "end_date", "budget_cents"],
  headers: ["Project Name", "Start Date", "End Date", "Budget"]
});

// Download exported file
dataExportTools.downloadFile(csvData, "projects.csv", "text/csv");
```

#### Batch Export
```javascript
// Export multiple datasets
const exports = await dataExportTools.batchExport([
  { data: projects, format: "json", filename: "projects.json" },
  { data: resources, format: "csv", filename: "resources.csv" },
  { data: tasks, format: "xml", filename: "tasks.xml" }
]);
```

### Visualization Export

#### Chart Export
```javascript
// Export chart as PNG
const chartImage = await dataExportTools.exportChart(chart, "png", {
  width: 1200,
  height: 800,
  quality: 0.9
});

// Export multiple charts as PDF
const pdfReport = await dataExportTools.exportMultipleCharts([chart1, chart2], "pdf", {
  title: "Project Dashboard Report",
  orientation: "landscape"
});
```

---

## ⚙️ Configuration

### System Configuration

#### Basic Settings
```javascript
// Configure dashboard system
configManager.set("dashboard.gridSize", 12);
configManager.set("dashboard.rowHeight", 100);
configManager.set("dashboard.animations", true);
configManager.set("dashboard.autoSave", true);

// Configure analytics
configManager.set("analytics.enabled", true);
configManager.set("analytics.sessionTimeout", 1800000); // 30 minutes
configManager.set("analytics.trackPerformance", true);

// Configure real-time streaming
configManager.set("streaming.enabled", true);
configManager.set("streaming.wsUrl", "ws://localhost:8080");
configManager.set("streaming.reconnectInterval", 5000);
configManager.set("streaming.maxReconnectAttempts", 10);
```

#### Performance Tuning
```javascript
// Optimize for performance
configManager.set("streaming.bufferSize", 1000);
configManager.set("streaming.updateInterval", 100);
configManager.set("streaming.batchSize", 50);
configManager.set("dashboard.lazyLoading", true);
configManager.set("charts.hardwareAcceleration", true);
```

### User Preferences

#### Display Settings
```javascript
// Set user preferences
configManager.setUserPreference("theme", "dark");
configManager.setUserPreference("dateFormat", "DD-MM-YYYY");
configManager.setUserPreference("currency", "USD");
configManager.setUserPreference("timezone", "Pacific/Auckland");
```

### Environment Configuration

#### Development vs Production
```javascript
// Development settings
if (process.env.NODE_ENV === "development") {
  configManager.set("debug.enabled", true);
  configManager.set("debug.level", "debug");
  configManager.set("analytics.trackErrors", false);
}

// Production settings
if (process.env.NODE_ENV === "production") {
  configManager.set("debug.enabled", false);
  configManager.set("analytics.trackErrors", true);
  configManager.set("performance.optimization", true);
}
```

---

## 🔧 Troubleshooting

### Common Issues

#### Dashboard Not Loading
**Symptoms**: Dashboard appears blank or widgets don't render
**Solutions**:
1. Check browser console for JavaScript errors
2. Verify container element exists in DOM
3. Ensure all CSS files are loaded
4. Check network connectivity for external resources

```javascript
// Debug dashboard initialization
dashboardSystem.initialize();
console.log("Dashboards:", dashboardSystem.dashboards.size);
console.log("Widgets:", dashboardSystem.widgets.size);
```

#### Real-time Connection Issues
**Symptoms**: Live updates not working, connection errors
**Solutions**:
1. Verify WebSocket server is running
2. Check firewall/proxy settings
3. Confirm WebSocket URL is correct
4. Monitor connection status

```javascript
// Debug WebSocket connection
const status = realtimeStreaming.getStatus();
console.log("Connected:", status.isConnected);
console.log("Connection attempts:", status.connectionAttempts);
console.log("Last error:", status.lastError);
```

#### Performance Issues
**Symptoms**: Slow rendering, high memory usage, lag
**Solutions**:
1. Reduce chart animation duration
2. Limit number of data points displayed
3. Enable data buffering for real-time updates
4. Use pagination for large datasets

```javascript
// Performance optimization
configManager.set("charts.animationDuration", 500);
configManager.set("dashboard.maxWidgets", 20);
configManager.set("streaming.throttleUpdates", true);
```

#### Data Export Failures
**Symptoms**: Export downloads fail or produce corrupt files
**Solutions**:
1. Check browser download permissions
2. Verify data format is valid
3. Ensure sufficient memory for large exports
4. Try smaller data sets first

```javascript
// Debug export process
try {
  const data = await dataExportTools.exportData(projects, "json");
  console.log("Export successful:", data.length, "bytes");
} catch (error) {
  console.error("Export failed:", error.message);
}
```

### Debugging Tools

#### Console Commands
```javascript
// Check system status
window.RoadmapTool = {
  getSystemStatus: () => ({
    dashboards: dashboardSystem.getStatus(),
    analytics: analyticsEngine.getStatus(),
    streaming: realtimeStreaming.getStatus(),
    config: configManager.getAll()
  }),
  
  clearData: () => {
    localStorage.clear();
    console.log("All data cleared");
  },
  
  resetConfig: () => {
    configManager.reset();
    console.log("Configuration reset to defaults");
  }
};
```

#### Performance Monitoring
```javascript
// Monitor performance metrics
setInterval(() => {
  const performance = analyticsEngine.getPerformanceMetrics();
  console.log("Performance:", {
    memoryUsage: performance.memory,
    renderTime: performance.averageRenderTime,
    apiLatency: performance.averageApiLatency
  });
}, 10000); // Every 10 seconds
```

### Browser Compatibility

#### Supported Features by Browser
- **Chrome 80+**: Full feature support
- **Firefox 75+**: Full feature support
- **Safari 13+**: Limited WebGL support
- **Edge 80+**: Full feature support
- **Mobile browsers**: Limited drag-and-drop support

#### Feature Detection
```javascript
// Check feature availability
const features = {
  webSockets: typeof WebSocket !== "undefined",
  webGL: !!document.createElement("canvas").getContext("webgl"),
  localStorage: typeof Storage !== "undefined",
  dragDrop: "draggable" in document.createElement("div")
};

console.log("Supported features:", features);
```

---

## 📞 Support & Resources

### Getting Help
- **GitHub Issues**: Report bugs and request features
- **Documentation**: Comprehensive guides and API reference
- **Examples**: Sample implementations and use cases
- **Community**: User forums and discussions

### Best Practices
1. **Regular Backups**: Export configurations and data regularly
2. **Performance Monitoring**: Monitor system metrics and optimize as needed
3. **Update Management**: Keep system updated with latest versions
4. **Security**: Follow security best practices for data handling
5. **Testing**: Test configurations before deploying to production

### Advanced Usage
For advanced customization and extension, refer to:
- **API Documentation**: Complete method and parameter reference
- **Plugin Development**: Creating custom widgets and extensions
- **Integration Guide**: Connecting with external systems
- **Performance Tuning**: Optimization strategies for large deployments