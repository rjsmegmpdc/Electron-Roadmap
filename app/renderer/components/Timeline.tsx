import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { TimelineBar } from './TimelineBar';
import { TimelineGrid } from './TimelineGrid';
import { DependencyOverlay } from './DependencyOverlay';
import type { Task } from '../stores/taskDependencyStore';
import type { Project } from '../state/store';

export interface TimelineItem {
  id: string;
  type: 'project' | 'task';
  title: string;
  start_date: string; // DD-MM-YYYY format
  end_date: string;   // DD-MM-YYYY format
  parentId?: string;  // For tasks, this is the project_id
  status?: string;
  effort_hours?: number;
  assigned_resources?: string[];
  level: number;      // Nesting level for display hierarchy
  expanded?: boolean; // For project rows with tasks
}

export interface TimelineDependency {
  id: string;
  fromId: string;
  toId: string;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
}

export interface TimelineProps {
  items: TimelineItem[];
  dependencies?: TimelineDependency[];
  startDate?: Date;
  endDate?: Date;
  onItemMove?: (itemId: string, newStartDate: Date, newEndDate: Date) => void;
  onItemResize?: (itemId: string, newStartDate: Date, newEndDate: Date) => void;
  onItemClick?: (item: TimelineItem) => void;
  onItemDoubleClick?: (item: TimelineItem) => void;
  onDependencyCreate?: (fromId: string, toId: string) => void;
  onDependencyDelete?: (dependencyId: string) => void;
  showGrid?: boolean;
  showDependencies?: boolean;
  allowDragAndDrop?: boolean;
  allowResize?: boolean;
  className?: string;
  height?: number;
  rowHeight?: number;
  gridCellWidth?: number;
  timeScale?: 'day' | 'week' | 'month';
  viewMode?: 'compact' | 'detailed';
}

const DEFAULT_ROW_HEIGHT = 40;
const DEFAULT_GRID_CELL_WIDTH = 30;
const DEFAULT_HEIGHT = 600;

export const Timeline: React.FC<TimelineProps> = ({
  items,
  dependencies = [],
  startDate,
  endDate,
  onItemMove,
  onItemResize,
  onItemClick,
  onItemDoubleClick,
  onDependencyCreate,
  onDependencyDelete,
  showGrid = true,
  showDependencies = true,
  allowDragAndDrop = false,
  allowResize = false,
  className = '',
  height = DEFAULT_HEIGHT,
  rowHeight = DEFAULT_ROW_HEIGHT,
  gridCellWidth = DEFAULT_GRID_CELL_WIDTH,
  timeScale = 'week',
  viewMode = 'compact'
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragItem, setDragItem] = useState<string | null>(null);
  const [linkingMode, setLinkingMode] = useState<{
    active: boolean;
    fromId?: string;
  }>({ active: false });

  // Calculate timeline bounds
  const timelineBounds = useMemo(() => {
    if (!items.length) {
      const now = new Date();
      return {
        start: startDate || new Date(now.getFullYear(), 0, 1),
        end: endDate || new Date(now.getFullYear(), 11, 31)
      };
    }

    let minDate = startDate;
    let maxDate = endDate;

    if (!minDate || !maxDate) {
      items.forEach(item => {
        try {
          // Convert DD-MM-YYYY to Date
          const [startDay, startMonth, startYear] = item.start_date.split('-').map(Number);
          const [endDay, endMonth, endYear] = item.end_date.split('-').map(Number);
          
          const itemStart = new Date(startYear, startMonth - 1, startDay);
          const itemEnd = new Date(endYear, endMonth - 1, endDay);

          if (!minDate || itemStart < minDate) {
            minDate = itemStart;
          }
          if (!maxDate || itemEnd > maxDate) {
            maxDate = itemEnd;
          }
        } catch (error) {
          console.warn('Invalid date format for item:', item.id);
        }
      });
    }

    // Add padding to timeline bounds
    const paddingMs = timeScale === 'day' ? 7 * 24 * 60 * 60 * 1000 : // 1 week
                      timeScale === 'week' ? 4 * 7 * 24 * 60 * 60 * 1000 : // 1 month
                      30 * 24 * 60 * 60 * 1000; // 1 month

    return {
      start: new Date((minDate?.getTime() || Date.now()) - paddingMs),
      end: new Date((maxDate?.getTime() || Date.now()) + paddingMs)
    };
  }, [items, startDate, endDate, timeScale]);

  // Calculate grid configuration
  const gridConfig = useMemo(() => {
    const totalMs = timelineBounds.end.getTime() - timelineBounds.start.getTime();
    const cellMs = timeScale === 'day' ? 24 * 60 * 60 * 1000 :
                   timeScale === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                   30 * 24 * 60 * 60 * 1000;
    
    const totalCells = Math.ceil(totalMs / cellMs);
    const totalWidth = totalCells * gridCellWidth;

    return {
      totalCells,
      cellMs,
      totalWidth,
      cellWidth: gridCellWidth
    };
  }, [timelineBounds, timeScale, gridCellWidth]);

  // Update container width on resize
  useEffect(() => {
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth);
      }
    };

    updateWidth();
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  // Handle scrolling
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const target = event.target as HTMLDivElement;
    setScrollTop(target.scrollTop);
    setScrollLeft(target.scrollLeft);
  }, []);

  // Convert date to pixel position
  const dateToPixel = useCallback((date: Date): number => {
    const ms = date.getTime() - timelineBounds.start.getTime();
    return (ms / gridConfig.cellMs) * gridConfig.cellWidth;
  }, [timelineBounds, gridConfig]);

  // Convert pixel position to date
  const pixelToDate = useCallback((pixel: number): Date => {
    const ms = (pixel / gridConfig.cellWidth) * gridConfig.cellMs;
    return new Date(timelineBounds.start.getTime() + ms);
  }, [timelineBounds, gridConfig]);

  // Handle item drag start
  const handleDragStart = useCallback((itemId: string, event: React.MouseEvent) => {
    if (!allowDragAndDrop) return;
    
    event.preventDefault();
    setIsDragging(true);
    setDragItem(itemId);
  }, [allowDragAndDrop]);

  // Handle item drag end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    setDragItem(null);
  }, []);

  // Handle mouse move during drag
  const handleMouseMove = useCallback((event: React.MouseEvent) => {
    if (!isDragging || !dragItem || !onItemMove) return;

    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = event.clientX - rect.left + scrollLeft;
    const newDate = pixelToDate(x);
    
    // Find the item being dragged
    const item = items.find(i => i.id === dragItem);
    if (!item) return;

    // Calculate duration
    const originalStart = new Date(item.start_date.split('-').reverse().join('-'));
    const originalEnd = new Date(item.end_date.split('-').reverse().join('-'));
    const duration = originalEnd.getTime() - originalStart.getTime();
    
    const newEndDate = new Date(newDate.getTime() + duration);
    onItemMove(dragItem, newDate, newEndDate);
  }, [isDragging, dragItem, onItemMove, scrollLeft, pixelToDate, items]);

  // Handle linking mode
  const handleItemLinkClick = useCallback((itemId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (linkingMode.active && linkingMode.fromId && linkingMode.fromId !== itemId) {
      // Complete the link
      onDependencyCreate?.(linkingMode.fromId, itemId);
      setLinkingMode({ active: false });
    } else {
      // Start linking mode
      setLinkingMode({ active: true, fromId: itemId });
    }
  }, [linkingMode, onDependencyCreate]);

  // Cancel linking mode on escape
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLinkingMode({ active: false });
      }
    };

    if (linkingMode.active) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [linkingMode.active]);

  // Calculate row positions
  const rowPositions = useMemo(() => {
    const positions: Record<string, { y: number; height: number }> = {};
    let currentY = 0;

    items.forEach(item => {
      const itemRowHeight = viewMode === 'detailed' ? rowHeight * 1.5 : rowHeight;
      positions[item.id] = {
        y: currentY,
        height: itemRowHeight
      };
      currentY += itemRowHeight + 2; // 2px gap between rows
    });

    return positions;
  }, [items, rowHeight, viewMode]);

  const totalContentHeight = Object.values(rowPositions).reduce(
    (max, pos) => Math.max(max, pos.y + pos.height), 
    0
  ) + 20; // Extra padding

  return (
    <div 
      ref={containerRef}
      className={`timeline-container relative border border-gray-300 rounded-lg overflow-hidden ${className}`}
      style={{ height }}
      data-testid="timeline-container"
    >
      {/* Header */}
      <div className="timeline-header bg-gray-50 border-b border-gray-300 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <h3 className="font-semibold text-gray-900">Timeline</h3>
          <div className="flex items-center space-x-2">
            <label className="text-sm text-gray-600">
              Scale:
              <select
                value={timeScale}
                onChange={(e) => {/* Handle time scale change */}}
                className="ml-2 text-sm border border-gray-300 rounded px-2 py-1"
                data-testid="time-scale-select"
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
              </select>
            </label>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {linkingMode.active && (
            <div className="flex items-center space-x-2 text-blue-600">
              <span className="text-sm">Click target item to create dependency</span>
              <button
                onClick={() => setLinkingMode({ active: false })}
                className="text-red-600 hover:text-red-800"
                data-testid="cancel-linking-button"
              >
                Cancel
              </button>
            </div>
          )}
          
          <button
            onClick={() => setLinkingMode({ active: !linkingMode.active })}
            className={`px-3 py-1 text-sm rounded ${
              linkingMode.active 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            data-testid="link-mode-button"
          >
            Link
          </button>
        </div>
      </div>

      {/* Main timeline area */}
      <div 
        className="timeline-main relative overflow-auto"
        style={{ height: height - 60 }} // Subtract header height
        onScroll={handleScroll}
        onMouseMove={handleMouseMove}
        onMouseUp={handleDragEnd}
      >
        {/* Background grid */}
        {showGrid && (
          <TimelineGrid
            width={gridConfig.totalWidth}
            height={totalContentHeight}
            cellWidth={gridConfig.cellWidth}
            rowHeight={rowHeight}
            startDate={timelineBounds.start}
            endDate={timelineBounds.end}
            timeScale={timeScale}
            scrollTop={scrollTop}
            scrollLeft={scrollLeft}
          />
        )}

        {/* Timeline bars */}
        <div className="absolute inset-0">
          {items.map(item => {
            const position = rowPositions[item.id];
            if (!position) return null;

            return (
              <TimelineBar
                key={item.id}
                item={item}
                x={dateToPixel(new Date(item.start_date.split('-').reverse().join('-')))}
                y={position.y}
                width={Math.max(
                  10, // Minimum width
                  dateToPixel(new Date(item.end_date.split('-').reverse().join('-'))) - 
                  dateToPixel(new Date(item.start_date.split('-').reverse().join('-')))
                )}
                height={position.height}
                onClick={onItemClick}
                onDoubleClick={onItemDoubleClick}
                onDragStart={allowDragAndDrop ? handleDragStart : undefined}
                onLinkClick={onDependencyCreate ? handleItemLinkClick : undefined}
                isDragging={dragItem === item.id}
                isLinkingMode={linkingMode.active}
                isLinkingTarget={linkingMode.active && linkingMode.fromId !== item.id}
                allowResize={allowResize}
                viewMode={viewMode}
              />
            );
          })}
        </div>

        {/* Dependency overlay */}
        {showDependencies && dependencies.length > 0 && (
          <DependencyOverlay
            dependencies={dependencies}
            items={items}
            rowPositions={rowPositions}
            dateToPixel={dateToPixel}
            onDependencyClick={onDependencyDelete}
            scrollTop={scrollTop}
            scrollLeft={scrollLeft}
          />
        )}

        {/* Empty state */}
        {items.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4M8 7h8M8 7H6a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V9a2 2 0 00-2-2h-2" />
              </svg>
              <p className="text-lg font-medium">No timeline items</p>
              <p className="text-sm">Add projects or tasks to see them on the timeline</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Timeline;