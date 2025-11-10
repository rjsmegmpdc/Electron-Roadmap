import React, { useState, useRef, useCallback } from 'react';
import type { TimelineItem } from './Timeline';

export interface TimelineBarProps {
  item: TimelineItem;
  x: number;
  y: number;
  width: number;
  height: number;
  onClick?: (item: TimelineItem) => void;
  onDoubleClick?: (item: TimelineItem) => void;
  onDragStart?: (itemId: string, event: React.MouseEvent) => void;
  onLinkClick?: (itemId: string, event: React.MouseEvent) => void;
  isDragging?: boolean;
  isLinkingMode?: boolean;
  isLinkingTarget?: boolean;
  allowResize?: boolean;
  viewMode?: 'compact' | 'detailed';
  className?: string;
}

const STATUS_COLORS = {
  project: {
    'active': 'bg-blue-500 border-blue-600',
    'completed': 'bg-green-500 border-green-600',
    'on-hold': 'bg-yellow-500 border-yellow-600',
    'cancelled': 'bg-red-500 border-red-600',
    default: 'bg-blue-500 border-blue-600'
  },
  task: {
    'planned': 'bg-blue-400 border-blue-500',
    'in-progress': 'bg-yellow-400 border-yellow-500',
    'blocked': 'bg-red-400 border-red-500',
    'done': 'bg-green-400 border-green-500',
    'archived': 'bg-gray-400 border-gray-500',
    default: 'bg-blue-400 border-blue-500'
  }
} as const;

const PROGRESS_COLORS = {
  project: {
    'active': 'bg-blue-600',
    'completed': 'bg-green-600',
    'on-hold': 'bg-yellow-600',
    'cancelled': 'bg-red-600',
    default: 'bg-blue-600'
  },
  task: {
    'planned': 'bg-blue-500',
    'in-progress': 'bg-yellow-500',
    'blocked': 'bg-red-500',
    'done': 'bg-green-500',
    'archived': 'bg-gray-500',
    default: 'bg-blue-500'
  }
} as const;

export const TimelineBar: React.FC<TimelineBarProps> = ({
  item,
  x,
  y,
  width,
  height,
  onClick,
  onDoubleClick,
  onDragStart,
  onLinkClick,
  isDragging = false,
  isLinkingMode = false,
  isLinkingTarget = false,
  allowResize = false,
  viewMode = 'compact',
  className = ''
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeHandle, setResizeHandle] = useState<'left' | 'right' | null>(null);
  const barRef = useRef<HTMLDivElement>(null);

  // Get appropriate colors based on item type and status
  const colorClass = STATUS_COLORS[item.type][item.status as keyof typeof STATUS_COLORS[typeof item.type]] || 
                     STATUS_COLORS[item.type].default;
  
  const progressColorClass = PROGRESS_COLORS[item.type][item.status as keyof typeof PROGRESS_COLORS[typeof item.type]] || 
                            PROGRESS_COLORS[item.type].default;

  // Calculate progress percentage for partially completed items
  const getProgressPercentage = (): number => {
    if (item.status === 'done' || item.status === 'completed') return 100;
    if (item.status === 'in-progress' && item.type === 'task') {
      // For tasks, we could calculate based on current date vs timeline
      const now = new Date();
      const start = new Date(item.start_date.split('-').reverse().join('-'));
      const end = new Date(item.end_date.split('-').reverse().join('-'));
      
      if (now <= start) return 0;
      if (now >= end) return 100;
      
      const total = end.getTime() - start.getTime();
      const elapsed = now.getTime() - start.getTime();
      return Math.min(100, Math.max(0, (elapsed / total) * 100));
    }
    return 0;
  };

  const progressPercentage = getProgressPercentage();

  // Handle click events
  const handleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (isLinkingMode && onLinkClick) {
      onLinkClick(item.id, event);
    } else if (onClick) {
      onClick(item);
    }
  }, [onClick, onLinkClick, item, isLinkingMode]);

  const handleDoubleClick = useCallback((event: React.MouseEvent) => {
    event.stopPropagation();
    if (!isLinkingMode && onDoubleClick) {
      onDoubleClick(item);
    }
  }, [onDoubleClick, item, isLinkingMode]);

  // Handle drag events
  const handleMouseDown = useCallback((event: React.MouseEvent) => {
    if (isLinkingMode || !onDragStart) return;
    
    event.preventDefault();
    onDragStart(item.id, event);
  }, [onDragStart, item.id, isLinkingMode]);

  // Handle resize events
  const handleResizeStart = useCallback((handle: 'left' | 'right', event: React.MouseEvent) => {
    if (!allowResize) return;
    
    event.stopPropagation();
    event.preventDefault();
    
    setIsResizing(true);
    setResizeHandle(handle);
  }, [allowResize]);

  // Determine styling classes
  const getBarClasses = () => {
    const baseClasses = [
      'absolute',
      'rounded-sm',
      'border',
      'cursor-pointer',
      'transition-all',
      'duration-200',
      'shadow-sm',
      colorClass
    ];

    if (isDragging) {
      baseClasses.push('opacity-50', 'z-10');
    } else if (isHovered) {
      baseClasses.push('shadow-md', 'z-20');
    }

    if (isLinkingMode) {
      if (isLinkingTarget) {
        baseClasses.push('ring-2', 'ring-blue-400', 'ring-opacity-50');
      } else {
        baseClasses.push('cursor-crosshair');
      }
    }

    return baseClasses.join(' ');
  };

  // Format text for display
  const getDisplayText = () => {
    if (viewMode === 'compact' || width < 80) {
      return item.title.length > 15 ? `${item.title.slice(0, 15)}...` : item.title;
    }
    return item.title;
  };

  // Show effort hours for tasks in detailed mode
  const showEffortHours = viewMode === 'detailed' && item.type === 'task' && item.effort_hours;
  const showResources = viewMode === 'detailed' && item.assigned_resources && item.assigned_resources.length > 0;

  return (
    <div
      ref={barRef}
      className={`${getBarClasses()} ${className}`}
      style={{
        left: x,
        top: y,
        width: Math.max(width, 10), // Minimum width
        height,
        zIndex: isDragging ? 10 : isHovered ? 5 : 1
      }}
      onClick={handleClick}
      onDoubleClick={handleDoubleClick}
      onMouseDown={handleMouseDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      data-testid={`timeline-bar-${item.id}`}
      title={`${item.title} (${item.start_date} - ${item.end_date})`}
    >
      {/* Progress indicator for in-progress items */}
      {progressPercentage > 0 && progressPercentage < 100 && (
        <div
          className={`absolute top-0 left-0 h-full rounded-sm ${progressColorClass}`}
          style={{ width: `${progressPercentage}%` }}
        />
      )}

      {/* Main content */}
      <div className="relative h-full flex items-center px-2 text-white text-sm font-medium overflow-hidden">
        {/* Icon based on type */}
        <div className="flex-shrink-0 mr-2">
          {item.type === 'project' ? (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M3 4a1 1 0 011-1h4a1 1 0 010 2H6.414l2.293 2.293a1 1 0 11-1.414 1.414L5 6.414V8a1 1 0 01-2 0V4zm9 1a1 1 0 010-2h4a1 1 0 011 1v4a1 1 0 01-2 0V6.414l-2.293 2.293a1 1 0 11-1.414-1.414L13.586 5H12z" clipRule="evenodd" />
            </svg>
          )}
        </div>

        {/* Text content */}
        <div className="flex-1 min-w-0">
          <div className="truncate text-xs font-medium">
            {getDisplayText()}
          </div>
          
          {viewMode === 'detailed' && height > 30 && (
            <div className="flex items-center space-x-2 text-xs opacity-90 mt-1">
              {showEffortHours && (
                <span className="truncate">
                  {item.effort_hours}h
                </span>
              )}
              {showResources && (
                <span className="truncate">
                  {item.assigned_resources![0]}{item.assigned_resources!.length > 1 ? ` +${item.assigned_resources!.length - 1}` : ''}
                </span>
              )}
            </div>
          )}
        </div>

        {/* Link button in linking mode */}
        {isLinkingMode && (
          <div className="flex-shrink-0 ml-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Resize handles */}
      {allowResize && isHovered && !isDragging && !isLinkingMode && (
        <>
          {/* Left resize handle */}
          <div
            className="absolute left-0 top-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-white hover:bg-opacity-20"
            onMouseDown={(e) => handleResizeStart('left', e)}
            data-testid={`resize-handle-left-${item.id}`}
          />
          
          {/* Right resize handle */}
          <div
            className="absolute right-0 top-0 w-2 h-full cursor-ew-resize bg-transparent hover:bg-white hover:bg-opacity-20"
            onMouseDown={(e) => handleResizeStart('right', e)}
            data-testid={`resize-handle-right-${item.id}`}
          />
        </>
      )}

      {/* Status indicator dot */}
      {viewMode === 'detailed' && height > 25 && (
        <div
          className={`absolute top-1 right-1 w-2 h-2 rounded-full ${
            item.status === 'done' || item.status === 'completed' ? 'bg-green-300' :
            item.status === 'blocked' ? 'bg-red-300' :
            item.status === 'in-progress' ? 'bg-yellow-300' :
            'bg-blue-300'
          }`}
          data-testid={`status-indicator-${item.id}`}
        />
      )}
    </div>
  );
};

export default TimelineBar;