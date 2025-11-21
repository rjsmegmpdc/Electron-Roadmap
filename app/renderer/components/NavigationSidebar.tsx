import React from 'react';

export interface MenuItem {
  id: string;
  title: string;
  icon: string;
  badge?: string;
  category?: string;
}

interface NavigationSidebarProps {
  activeItem: string;
  onItemSelect: (itemId: string) => void;
}

export const NavigationSidebar: React.FC<NavigationSidebarProps> = ({
  activeItem,
  onItemSelect
}) => {
  const menuItems: MenuItem[] = [
    // Main Dashboard
    {
      id: 'dashboard',
      title: 'Dashboard',
      icon: '🏠',
      category: 'main'
    },
    
    // Project Management
    {
      id: 'projects',
      title: 'Projects',
      icon: '📋',
      category: 'projects'
    },
    {
      id: 'quick-task',
      title: 'Quick Task',
      icon: '⚡',
      category: 'projects'
    },
    {
      id: 'epic-features',
      title: 'Epics & Features',
      icon: '🎯',
      category: 'projects'
    },
    {
      id: 'calendar',
      title: 'Calendar',
      icon: '📅',
      category: 'projects'
    },
    
    // Governance
    {
      id: 'governance-dashboard',
      title: 'Governance Dashboard',
      icon: '🎯',
      category: 'governance'
    },
    {
      id: 'governance-analytics',
      title: 'Portfolio Analytics',
      icon: '📊',
      category: 'governance'
    },
    
    // Financial Management
    {
      id: 'coordinator',
      title: 'Project Coordinator',
      icon: '💰',
      category: 'finance'
    },
    {
      id: 'resources',
      title: 'Resource Management',
      icon: '👥',
      category: 'finance'
    },
    
    // Development Tools
    {
      id: 'tests',
      title: 'Tests',
      icon: '🧪',
      category: 'development'
    },
    {
      id: 'components',
      title: 'Components',
      icon: '🧩',
      category: 'development'
    },
    {
      id: 'services',
      title: 'Services',
      icon: '⚙️',
      category: 'development'
    },
    
    // Configuration
    {
      id: 'ado-config',
      title: 'ADO Integration',
      icon: '🔗',
      category: 'config'
    },
    {
      id: 'config',
      title: 'Epic/Feature Defaults',
      icon: '🎨',
      category: 'config'
    },
    {
      id: 'settings',
      title: 'Settings',
      icon: '⚙️',
      category: 'config'
    },
    
    // Documentation & Help
    {
      id: 'guides',
      title: 'Guides',
      icon: '📚',
      category: 'help'
    },
    {
      id: 'documentation',
      title: 'Documentation',
      icon: '📖',
      category: 'help'
    }
  ];

  const getCategoryTitle = (category: string) => {
    switch (category) {
      case 'main': return 'Main';
      case 'projects': return 'Project Management';
      case 'governance': return 'Portfolio Governance';
      case 'finance': return 'Financial Management';
      case 'development': return 'Development Tools';
      case 'config': return 'Configuration';
      case 'help': return 'Help & Documentation';
      default: return 'Other';
    }
  };

  const groupedItems = menuItems.reduce((acc, item) => {
    const category = item.category || 'other';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(item);
    return acc;
  }, {} as Record<string, MenuItem[]>);

  const categoryOrder = ['main', 'projects', 'governance', 'finance', 'development', 'config', 'help'];

  return (
    <div className="app-sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">R</div>
        <h2 className="app-title">Roadmap Tool</h2>
      </div>
      
      <nav className="sidebar-navigation">
        {categoryOrder.map(category => {
          const items = groupedItems[category];
          if (!items || items.length === 0) return null;
          
          return (
            <div key={category} className="sidebar-section">
              {category !== 'main' && (
                <div className="sidebar-section-title">
                  {getCategoryTitle(category)}
                </div>
              )}
              
              <ul className="sidebar-nav">
                {items.map(item => (
                  <li key={item.id} className="sidebar-nav-item">
                    <button
                      className={`sidebar-nav-link ${activeItem === item.id ? 'active' : ''}`}
                      onClick={() => onItemSelect(item.id)}
                      title={item.title}
                    >
                      <span className="nav-icon">{item.icon}</span>
                      <span className="nav-text">{item.title}</span>
                      {item.badge && (
                        <span className="nav-item-badge">{item.badge}</span>
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>
      
      <div className="sidebar-footer system-actions">
        <button 
          className="sidebar-nav-link"
          onClick={() => console.log('Logout clicked')}
        >
          <span className="nav-icon">🚪</span>
          <span className="nav-text">Log out</span>
        </button>
      </div>
    </div>
  );
};