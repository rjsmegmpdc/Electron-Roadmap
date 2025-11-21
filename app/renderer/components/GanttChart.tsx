import React, { useMemo, useState } from 'react';
import { useAppStore, type Project } from '../state/store';

interface GanttChartProps {
  projects?: Project[];
  showLegend?: boolean;
  height?: number;
}

type ZoomLevel = 'week' | 'fortnight' | 'month' | 'quarter' | 'year';

export const GanttChart: React.FC<GanttChartProps> = ({
  projects,
  showLegend = true,
  height
}) => {
  const storeProjects = useAppStore(state => state.projects);
  const showProjectDetail = useAppStore(state => state.showProjectDetail);
  const [hoveredProjectId, setHoveredProjectId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<ZoomLevel>('month');
  const [settingsEndDate, setSettingsEndDate] = useState<string | null>(null);
  const [statusFilters, setStatusFilters] = useState<Record<string, boolean>>({
    planned: true,
    'in-progress': true,
    blocked: true,
    done: true,
    archived: false // Archived deselected by default
  });
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rowsScrollContainerRef = React.useRef<HTMLDivElement>(null);
  const ganttContainerRef = React.useRef<HTMLDivElement>(null);

  // Right-click drag to scroll
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [scrollStartLeft, setScrollStartLeft] = useState(0);

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only handle right mouse button (button 2)
    if (e.button === 2) {
      e.preventDefault();
      setIsDragging(true);
      setDragStartX(e.clientX);
      if (rowsScrollContainerRef.current) {
        setScrollStartLeft(rowsScrollContainerRef.current.scrollLeft);
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartX;
    const newScrollLeft = scrollStartLeft - deltaX;
    
    // Update scroll position
    if (rowsScrollContainerRef.current) {
      rowsScrollContainerRef.current.scrollLeft = newScrollLeft;
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Prevent context menu on right-click
  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  React.useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  // Load settings end date from localStorage
  React.useEffect(() => {
    const loadSettings = () => {
      try {
        const settings = localStorage.getItem('appSettings');
        console.log('GanttChart: Loading settings from localStorage:', settings);
        if (settings) {
          const parsed = JSON.parse(settings);
          console.log('GanttChart: Parsed settings:', parsed);
          if (parsed.timelineEndDate) {
            console.log('GanttChart: Setting timeline end date to:', parsed.timelineEndDate);
            setSettingsEndDate(parsed.timelineEndDate);
          } else {
            console.log('GanttChart: No timelineEndDate in settings, clearing');
            setSettingsEndDate(null);
          }
        } else {
          console.log('GanttChart: No settings found in localStorage');
          setSettingsEndDate(null);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };
    
    // Load on mount
    loadSettings();
    
    // Listen for storage events from other tabs/windows
    window.addEventListener('storage', loadSettings);
    
    // Custom event for same-window updates
    window.addEventListener('settingsUpdated', loadSettings);
    
    return () => {
      window.removeEventListener('storage', loadSettings);
      window.removeEventListener('settingsUpdated', loadSettings);
    };
  }, []);

  // Reset scroll position when zoom level changes
  React.useEffect(() => {
    if (rowsScrollContainerRef.current) {
      rowsScrollContainerRef.current.scrollLeft = 0;
    }
  }, [zoomLevel]);

  // Helper to get NZ financial year start (April 1) for a given date
  const getNZFYStart = (date: Date): Date => {
    const year = date.getFullYear();
    const fyStart = new Date(year, 3, 1); // April 1st of same year
    if (date < fyStart) {
      // If date is before April 1, FY started in previous year
      return new Date(year - 1, 3, 1);
    }
    return fyStart;
  };

  // Get time period labels based on zoom level
  const getTimeLabels = (minDate: Date, maxDate: Date): Array<{ date: Date; label: string; daysInPeriod: number }> => {
    const labels: Array<{ date: Date; label: string; daysInPeriod: number }> = [];
    const current = new Date(minDate.getTime()); // Create from timestamp to preserve UTC
    current.setUTCHours(0, 0, 0, 0);

    switch (zoomLevel) {
      case 'week': {
        // Start from Monday of current week
        const dayOfWeek = current.getDay();
        const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
        current.setDate(diff);
        
        while (current <= maxDate) {
          const weekEnd = new Date(current);
          weekEnd.setDate(weekEnd.getDate() + 6);
          labels.push({
            date: new Date(current),
            label: `W${Math.ceil((current.getDate()) / 7)} ${current.toLocaleDateString('en-US', { month: 'short' })}`,
            daysInPeriod: 7
          });
          current.setDate(current.getDate() + 7);
        }
        break;
      }

      case 'fortnight': {
        // Start from day 1 of min month
        current.setDate(1);
        while (current <= maxDate) {
          labels.push({
            date: new Date(current),
            label: `F${Math.ceil(current.getDate() / 14)} ${current.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })}`,
            daysInPeriod: 14
          });
          current.setDate(current.getDate() + 14);
        }
        break;
      }

      case 'month': {
        let iterationCount = 0;
        const maxIterations = 200; // Safety limit
        while (current <= maxDate && iterationCount < maxIterations) {
          iterationCount++;
          // Calculate days in this month using UTC
          const monthStart = new Date(current.getTime());
          monthStart.setUTCDate(1);
          const monthEnd = new Date(monthStart.getTime());
          monthEnd.setUTCMonth(monthEnd.getUTCMonth() + 1);
          monthEnd.setUTCDate(0);
          const daysInMonth = monthEnd.getUTCDate();
          
          labels.push({
            date: new Date(current.getTime()),
            label: current.toLocaleDateString('en-US', { month: 'short', year: '2-digit', timeZone: 'UTC' }),
            daysInPeriod: daysInMonth
          });
          current.setUTCMonth(current.getUTCMonth() + 1);
          current.setUTCDate(1);
        }
        break;
      }

      case 'quarter': {
        while (current <= maxDate) {
          const quarter = Math.floor(current.getMonth() / 3) + 1;
          const quarterStart = new Date(current);
          quarterStart.setMonth((Math.floor(quarterStart.getMonth() / 3) * 3));
          quarterStart.setDate(1);
          const quarterEnd = new Date(quarterStart);
          quarterEnd.setMonth(quarterEnd.getMonth() + 3);
          quarterEnd.setDate(0);
          const daysInQuarter = Math.round((quarterEnd.getTime() - quarterStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          labels.push({
            date: new Date(current),
            label: `Q${quarter} ${current.getFullYear()}`,
            daysInPeriod: daysInQuarter
          });
          current.setMonth(current.getMonth() + 3);
          current.setDate(1);
        }
        break;
      }

      case 'year': {
        // NZ Financial Year: April 1 to March 31
        let fyStart = getNZFYStart(current);
        while (fyStart <= maxDate) {
          const fyEnd = new Date(fyStart.getFullYear() + 1, 2, 31);
          const daysInFY = Math.round((fyEnd.getTime() - fyStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
          
          labels.push({
            date: new Date(fyStart),
            label: `FY${fyStart.getFullYear()}/${(fyStart.getFullYear() + 1).toString().slice(-2)}`,
            daysInPeriod: daysInFY
          });
          fyStart = new Date(fyStart.getFullYear() + 1, 3, 1);
        }
        break;
      }
    }

    return labels;
  };

  const parseDate = (dateStr: string): Date => {
    const [day, month, year] = dateStr.split('-').map(Number);
    // Use UTC to avoid timezone offset issues
    return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  };

  const projectData = useMemo(() => {
    const items = projects || Object.values(storeProjects);
    
    const timeline = items
      .filter(p => p.start_date && p.end_date)
      .map(p => {
        const startDate = parseDate(p.start_date);
        const endDate = parseDate(p.end_date);
        const duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        
        return {
          ...p,
          startDate,
          endDate,
          duration
        };
      });

    if (timeline.length === 0) {
      // Return undefined to signal no data yet - component will show "no projects" message
      return { timeline: [], minDate: new Date(), maxDate: new Date() };
    }

    // Get project date range from ALL projects (not just filtered ones)
    // This ensures timeline extends correctly regardless of status filters
    const allEndDates = timeline.map(p => p.endDate);
    const allStartDates = timeline.map(p => p.startDate);
    const projectMinDate = new Date(Math.min(...allStartDates.map(d => d.getTime())));
    const projectMaxDate = new Date(Math.max(...allEndDates.map(d => d.getTime())));
    
    // Set min and max dates
    const minDate = new Date(projectMinDate);
    let maxDate: Date;
    
    // Read settings synchronously to avoid race condition with useState
    let currentSettingsEndDate: string | null = null;
    try {
      const settings = localStorage.getItem('appSettings');
      if (settings) {
        const parsed = JSON.parse(settings);
        if (parsed.timelineEndDate) {
          currentSettingsEndDate = parsed.timelineEndDate;
        }
      }
    } catch (error) {
      console.error('Failed to read settings in projectData:', error);
    }
    
    // Check if there's a settings end date override
    console.log('GanttChart projectData: currentSettingsEndDate =', currentSettingsEndDate, '(state was:', settingsEndDate, ')');
    if (currentSettingsEndDate) {
      try {
        maxDate = parseDate(currentSettingsEndDate);
        console.log('GanttChart projectData: Using settings end date:', maxDate.toISOString());
      } catch (error) {
        console.error('Invalid settings end date, using auto calculation:', error);
        maxDate = new Date(projectMaxDate);
        maxDate.setUTCMonth(maxDate.getUTCMonth() + 12);
        console.log('GanttChart projectData: Using auto calculation (error):', maxDate.toISOString());
      }
    } else {
      // Default: Add 12 months to the max date to extend timeline past last project
      maxDate = new Date(projectMaxDate);
      maxDate.setUTCMonth(maxDate.getUTCMonth() + 12);
      console.log('GanttChart projectData: Using auto calculation (no settings):', maxDate.toISOString());
    }
    
    // Align to boundaries based on zoom level
    if (zoomLevel === 'month') {
      // Start at the 1st of the month containing the earliest project
      minDate.setUTCDate(1);
      minDate.setUTCHours(0, 0, 0, 0);
      
      // End at the last day of the month containing the extended date
      const endMonth = maxDate.getUTCMonth();
      const endYear = maxDate.getUTCFullYear();
      maxDate.setUTCFullYear(endYear);
      maxDate.setUTCMonth(endMonth + 1);
      maxDate.setUTCDate(0); // Last day of previous month
      maxDate.setUTCHours(23, 59, 59, 999);
    }

    console.log('GanttChart projectData: FINAL minDate=', minDate.toISOString(), 'maxDate=', maxDate.toISOString());
    return { timeline, minDate, maxDate };
  }, [projects, storeProjects, zoomLevel, settingsEndDate]);

  // Allocate rows based on overlapping projects (recalculate on zoom change)
  const allocatedRows = useMemo(() => {
    const filtered = projectData.timeline.filter(p => statusFilters[p.status]);
    
    // Sort by start date then end date
    const sorted = [...filtered].sort((a, b) => {
      if (a.startDate.getTime() !== b.startDate.getTime()) {
        return a.startDate.getTime() - b.startDate.getTime();
      }
      return b.endDate.getTime() - a.endDate.getTime();
    });

    // Allocate rows based on time overlaps
    const rows: Array<Array<typeof sorted[0]>> = [];
    
    for (const project of sorted) {
      let placed = false;
      
      // Try to place in existing rows
      for (const row of rows) {
        // Check if this project overlaps with any in this row
        const hasOverlap = row.some(existing => {
          // Projects overlap if one starts before the other ends
          return project.startDate < existing.endDate && project.endDate > existing.startDate;
        });
        
        if (!hasOverlap) {
          row.push(project);
          placed = true;
          break;
        }
      }
      
      // If not placed, create new row
      if (!placed) {
        rows.push([project]);
      }
    }

    // Create a map of project ID to row number
    const projectToRow: Record<string, number> = {};
    rows.forEach((row, rowIdx) => {
      row.forEach(project => {
        projectToRow[project.id] = rowIdx;
      });
    });

    return { rows, projectToRow, maxRows: rows.length };
  }, [projectData.timeline, statusFilters, zoomLevel]);

  // Sort projects for display by their allocated row
  const sortedProjects = useMemo(() => {
    return projectData.timeline
      .filter(p => statusFilters[p.status])
      .sort((a, b) => {
        const rowA = allocatedRows.projectToRow[a.id] ?? 0;
        const rowB = allocatedRows.projectToRow[b.id] ?? 0;
        if (rowA !== rowB) return rowA - rowB;
        return a.startDate.getTime() - b.startDate.getTime();
      });
  }, [projectData.timeline, statusFilters, allocatedRows]);

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'planned': return '#3498DB';
      case 'in-progress': return '#F39C12';
      case 'blocked': return '#E74C3C';
      case 'done': return '#27AE60';
      case 'archived': return '#95A5A6';
      default: return '#34495E';
    }
  };

  // Pixel-based timeline system
  const getPixelsPerDay = (): number => {
    switch (zoomLevel) {
      case 'week': return 20; // 20px per day
      case 'fortnight': return 10; // 10px per day
      case 'month': return 4; // 4px per day
      case 'quarter': return 2; // 2px per day
      case 'year': return 1; // 1px per day
      default: return 4;
    }
  };

  const getDaysDifference = (date1: Date, date2: Date): number => {
    return Math.round((date1.getTime() - date2.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getTotalTimelineWidth = (): number => {
    const totalDays = getDaysDifference(projectData.maxDate, projectData.minDate);
    return totalDays * getPixelsPerDay();
  };

  const calculatePositionPx = (date: Date): number => {
    const dayOffset = getDaysDifference(date, projectData.minDate);
    return Math.max(0, dayOffset * getPixelsPerDay());
  };

  const calculateWidthPx = (startDate: Date, endDate: Date): number => {
    const durationDays = getDaysDifference(endDate, startDate);
    return Math.max(1, durationDays * getPixelsPerDay()); // Minimum 1px width
  };


  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  };

  // Memoize timeLabels to recalculate when zoom level changes
  const timeLabels = useMemo(() => {
    console.log('GanttChart timeLabels: Calling getTimeLabels with minDate=', projectData.minDate.toISOString(), 'maxDate=', projectData.maxDate.toISOString());
    const labels = getTimeLabels(projectData.minDate, projectData.maxDate);
    console.log('GanttChart timeLabels: Generated', labels.length, 'labels. First:', labels[0]?.label, 'Last:', labels[labels.length - 1]?.label);
    return labels;
  }, [projectData.minDate, projectData.maxDate, zoomLevel]);

  if (projectData.timeline.length === 0) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...(height ? { height: `${height}px` } : { flex: 1, minHeight: 0 }),
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        color: 'var(--text-muted)',
        fontSize: 'var(--font-size-md)'
      }}>
        📊 No projects with dates to display
      </div>
    );
  }

  const ROW_HEIGHT = 50; // pixels per row

  const ZoomButton: React.FC<{ level: ZoomLevel; label: string }> = ({ level, label }) => (
    <button
      onClick={() => setZoomLevel(level)}
      style={{
        padding: '4px 12px',
        fontSize: 'var(--font-size-xs)',
        fontWeight: zoomLevel === level ? '600' : '500',
        color: zoomLevel === level ? 'var(--text-primary)' : 'var(--text-secondary)',
        backgroundColor: zoomLevel === level ? 'var(--bg-hover)' : 'transparent',
        border: `1px solid ${zoomLevel === level ? 'var(--border-color-dark)' : 'var(--border-color)'}`,
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        transition: 'var(--transition-colors)',
      }}
      onMouseEnter={(e) => {
        if (zoomLevel !== level) {
          e.currentTarget.style.backgroundColor = 'var(--bg-secondary)';
        }
      }}
      onMouseLeave={(e) => {
        if (zoomLevel !== level) {
          e.currentTarget.style.backgroundColor = 'transparent';
        }
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      ref={ganttContainerRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        ...(isFullscreen ? {
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          zIndex: 1000,
          borderRadius: 0,
          border: 'none'
        } : height ? { height: `${height}px` } : { flex: 1, minHeight: 0 }),
        backgroundColor: 'var(--bg-primary)',
        ...(isFullscreen ? {} : { borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)' }),
        overflow: 'hidden'
      }}
    >
      {/* Legend and Controls - Sticky at Top */}
      {showLegend && (
        <>
          {/* Status Filters Row */}
          <div style={{
            padding: 'var(--spacing-md)',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            gap: 'var(--spacing-md)',
            flexWrap: 'wrap',
            fontSize: 'var(--font-size-xs)',
            flexShrink: 0,
            position: 'sticky',
            top: 0,
            zIndex: 10,
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', gap: 'var(--spacing-md)', flexWrap: 'wrap', alignItems: 'center' }}>
              {['planned', 'in-progress', 'blocked', 'done', 'archived'].map(status => (
                <label key={status} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}>
                  <input
                    type="checkbox"
                    checked={statusFilters[status]}
                    onChange={(e) => {
                      setStatusFilters(prev => ({
                        ...prev,
                        [status]: e.target.checked
                      }));
                    }}
                    style={{
                      cursor: 'pointer',
                      width: '16px',
                      height: '16px',
                      accentColor: getStatusColor(status)
                    }}
                  />
                  <span style={{ color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                    {status}
                  </span>
                </label>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => {
                  setStatusFilters({
                    planned: true,
                    'in-progress': true,
                    blocked: true,
                    done: true,
                    archived: false
                  });
                }}
                title="Reset filters to default"
                style={{
                  padding: '6px 8px',
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition-colors)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--border-color-dark)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                🔄
              </button>
              <button
                onClick={() => setIsFullscreen(!isFullscreen)}
                title={isFullscreen ? 'Exit fullscreen' : 'Expand to fullscreen'}
                style={{
                  padding: '6px 8px',
                  fontSize: '16px',
                  color: 'var(--text-secondary)',
                  backgroundColor: 'var(--bg-primary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  transition: 'var(--transition-colors)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '32px',
                  minHeight: '32px'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-hover)';
                  e.currentTarget.style.borderColor = 'var(--border-color-dark)';
                  e.currentTarget.style.color = 'var(--text-primary)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-primary)';
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.color = 'var(--text-secondary)';
                }}
              >
                {isFullscreen ? '⏹' : '⛶'}
              </button>
            </div>
          </div>

          {/* Zoom Controls Row */}
          <div style={{
            padding: 'var(--spacing-sm) var(--spacing-md)',
            borderBottom: '1px solid var(--border-color)',
            backgroundColor: 'var(--bg-secondary)',
            display: 'flex',
            gap: 'var(--spacing-sm)',
            flexShrink: 0,
            position: 'sticky',
            top: '44px',
            zIndex: 9,
            alignItems: 'center'
          }}>
            <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-secondary)', marginRight: 'var(--spacing-sm)' }}>
              Timeline View:
            </span>
            <ZoomButton level="week" label="Week" />
            <ZoomButton level="fortnight" label="Fortnight" />
            <ZoomButton level="month" label="Month" />
            <ZoomButton level="quarter" label="Quarter" />
            <ZoomButton level="year" label="FY Year" />
          </div>
        </>
      )}

      {/* Main scrollable container for timeline and bars */}
      <div
        ref={rowsScrollContainerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onContextMenu={handleContextMenu}
        style={{
          flex: 1,
          overflowX: 'auto',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          position: 'relative'
        }}
      >
        {/* Timeline Header - Sticky at top */}
        <div style={{
          display: 'flex',
          borderBottom: '1px solid var(--border-color)',
          backgroundColor: 'var(--bg-secondary)',
          flexShrink: 0,
          height: '60px',
          position: 'sticky',
          top: 0,
          zIndex: 5
        }}>
          {/* Project Names Column */}
          <div style={{
            width: '250px',
            padding: 'var(--spacing-md)',
            borderRight: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            fontWeight: '600',
            color: 'var(--text-primary)',
            fontSize: 'var(--font-size-sm)',
            flexShrink: 0,
            position: 'sticky',
            left: 0,
            backgroundColor: 'var(--bg-secondary)',
            zIndex: 6
          }}>
            Project
          </div>

          {/* Timeline Header Content */}
          <div style={{
            flex: 1,
            display: 'flex',
            position: 'relative',
            backgroundColor: 'var(--bg-secondary)'
          }}>
            <div style={{
              display: 'flex',
              minWidth: `${getTotalTimelineWidth()}px`
            }}>
              {timeLabels.map((period, idx) => {
                const periodWidth = (period.daysInPeriod || 30) * getPixelsPerDay();
                return (
                  <div
                    key={idx}
                    style={{
                      width: `${periodWidth}px`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRight: idx < timeLabels.length - 1 ? '1px solid var(--border-color-light)' : 'none',
                      padding: 'var(--spacing-sm)',
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      fontWeight: '500',
                      flexShrink: 0
                    }}
                  >
                    {period.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Project Rows */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: `${allocatedRows.maxRows * ROW_HEIGHT}px`
        }}>
          {sortedProjects.map((project, idx) => {
            return (
              <div
                key={project.id}
                onClick={() => showProjectDetail(project.id)}
                style={{
                  display: 'flex',
                  height: `${ROW_HEIGHT}px`,
                  backgroundColor: 'transparent',
                  transition: 'background-color 0.2s ease',
                  flexShrink: 0,
                  cursor: 'pointer'
                }}
                onMouseEnter={() => setHoveredProjectId(project.id)}
                onMouseLeave={() => setHoveredProjectId(null)}
              >
                {/* Project Name */}
                <div style={{
                  width: '250px',
                  padding: 'var(--spacing-sm) var(--spacing-md)',
                  borderRight: '1px solid var(--border-color)',
                  display: 'flex',
                  alignItems: 'center',
                  flexShrink: 0,
                  overflow: 'hidden',
                  position: 'sticky',
                  left: 0,
                  backgroundColor: hoveredProjectId === project.id ? 'var(--bg-hover)' : 'var(--bg-primary)',
                  zIndex: 4,
                  borderBottom: '1px solid var(--border-color-light)',
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.05)'
                }}>
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1px',
                    width: '100%',
                    overflow: 'hidden'
                  }}>
                    <div 
                      style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        color: 'var(--text-primary)',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        lineHeight: '1.2'
                      }}
                      title={project.title}
                    >
                      {project.title}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--text-secondary)',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      lineHeight: '1.2'
                    }}>
                      {project.pm_name || 'N/A'}
                    </div>
                  </div>
                </div>

                {/* Project Bar */}
                <div style={{
                  position: 'relative',
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  minWidth: `${getTotalTimelineWidth()}px`,
                  padding: 'var(--spacing-sm)',
                  backgroundColor: hoveredProjectId === project.id ? 'var(--bg-hover)' : 'var(--bg-primary)',
                  borderBottom: '1px solid var(--border-color-light)'
                }}>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      showProjectDetail(project.id);
                    }}
                    style={{
                      position: 'absolute',
                      left: `${calculatePositionPx(project.startDate)}px`,
                      width: `${calculateWidthPx(project.startDate, project.endDate)}px`,
                      height: '24px',
                      backgroundColor: getStatusColor(project.status),
                      borderRadius: 'var(--radius-sm)',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      opacity: hoveredProjectId === project.id ? 1 : 0.8,
                      transform: hoveredProjectId === project.id ? 'scaleY(1.1) translateY(-50%)' : 'translateY(-50%)',
                      transformOrigin: 'center',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '0 var(--spacing-sm)',
                      color: 'white',
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: '600',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      boxShadow: hoveredProjectId === project.id ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                      minWidth: '40px',
                      top: '50%'
                    }}
                    title={`${project.title} (${formatDate(project.startDate)} - ${formatDate(project.endDate)})`}
                  >
                    {project.duration > 0 && <span>{project.duration}d</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
