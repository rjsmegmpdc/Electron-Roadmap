import React, { useMemo } from 'react';

export interface TimelineGridProps {
  width: number;
  height: number;
  cellWidth: number;
  rowHeight: number;
  startDate: Date;
  endDate: Date;
  timeScale: 'day' | 'week' | 'month';
  scrollTop?: number;
  scrollLeft?: number;
  className?: string;
}

interface GridCell {
  x: number;
  date: Date;
  label: string;
  isHeader: boolean;
  isMajor: boolean;
}

export const TimelineGrid: React.FC<TimelineGridProps> = ({
  width,
  height,
  cellWidth,
  rowHeight,
  startDate,
  endDate,
  timeScale,
  scrollTop = 0,
  scrollLeft = 0,
  className = ''
}) => {
  // Calculate grid cells and their properties
  const gridCells = useMemo(() => {
    const cells: GridCell[] = [];
    const cellMs = timeScale === 'day' ? 24 * 60 * 60 * 1000 :
                   timeScale === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                   30 * 24 * 60 * 60 * 1000; // Approximate month

    let currentDate = new Date(startDate);
    let x = 0;

    while (currentDate < endDate && x < width) {
      const isHeader = timeScale === 'day' ? 
        (currentDate.getDay() === 1) : // Monday for day scale
        timeScale === 'week' ? 
          (currentDate.getDate() <= 7 && currentDate.getDate() > 0) : // First week of month
          (currentDate.getDate() === 1); // First day of month

      const isMajor = timeScale === 'day' ? 
        (currentDate.getDate() === 1) : // First day of month
        timeScale === 'week' ? 
          (currentDate.getDate() === 1) : // First day of month
          (currentDate.getMonth() === 0); // January

      cells.push({
        x,
        date: new Date(currentDate),
        label: formatGridLabel(currentDate, timeScale, isHeader, isMajor),
        isHeader,
        isMajor
      });

      // Advance to next time unit
      currentDate = new Date(currentDate.getTime() + cellMs);
      x += cellWidth;
    }

    return cells;
  }, [startDate, endDate, timeScale, cellWidth, width]);

  // Format labels for different time scales
  function formatGridLabel(date: Date, scale: 'day' | 'week' | 'month', isHeader: boolean, isMajor: boolean): string {
    const options: Intl.DateTimeFormatOptions = { timeZone: 'UTC' };

    if (scale === 'day') {
      if (isMajor) {
        return date.toLocaleDateString('en-US', { ...options, month: 'short', year: 'numeric' });
      } else if (isHeader) {
        return date.toLocaleDateString('en-US', { ...options, day: 'numeric' });
      } else {
        return date.getDate().toString();
      }
    } else if (scale === 'week') {
      if (isMajor) {
        return date.toLocaleDateString('en-US', { ...options, month: 'short', year: 'numeric' });
      } else if (isHeader) {
        const weekNum = getWeekNumber(date);
        return `W${weekNum}`;
      } else {
        return '';
      }
    } else { // month
      if (isMajor) {
        return date.getFullYear().toString();
      } else {
        return date.toLocaleDateString('en-US', { ...options, month: 'short' });
      }
    }
  }

  // Get week number for a given date
  function getWeekNumber(date: Date): number {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - startOfYear.getTime()) / 86400000;
    return Math.ceil((pastDaysOfYear + startOfYear.getDay() + 1) / 7);
  }

  // Calculate visible cells for performance optimization
  const visibleCells = useMemo(() => {
    const leftBound = scrollLeft - cellWidth;
    const rightBound = scrollLeft + (typeof window !== 'undefined' ? window.innerWidth : 1200);
    
    return gridCells.filter(cell => 
      cell.x >= leftBound && cell.x <= rightBound
    );
  }, [gridCells, scrollLeft, cellWidth]);

  return (
    <div 
      className={`absolute inset-0 pointer-events-none ${className}`}
      data-testid="timeline-grid"
    >
      {/* Vertical grid lines */}
      <div className="absolute inset-0">
        {visibleCells.map((cell, index) => (
          <div
            key={`grid-line-${index}`}
            className={`absolute top-0 border-l ${
              cell.isMajor ? 'border-gray-400' : 
              cell.isHeader ? 'border-gray-300' : 
              'border-gray-200'
            }`}
            style={{
              left: cell.x,
              height: height
            }}
          />
        ))}
      </div>

      {/* Horizontal grid lines */}
      <div className="absolute inset-0">
        {Array.from({ length: Math.ceil(height / rowHeight) }).map((_, rowIndex) => (
          <div
            key={`row-line-${rowIndex}`}
            className="absolute left-0 border-t border-gray-200"
            style={{
              top: rowIndex * rowHeight,
              width: width,
              opacity: rowIndex % 2 === 0 ? 0.5 : 0.3
            }}
          />
        ))}
      </div>

      {/* Time labels header */}
      <div 
        className="absolute top-0 left-0 h-12 bg-white border-b border-gray-300 z-10"
        style={{ width }}
      >
        {/* Major time labels */}
        <div className="relative h-6 border-b border-gray-200">
          {visibleCells
            .filter(cell => cell.isMajor)
            .map((cell, index) => (
              <div
                key={`major-label-${index}`}
                className="absolute top-0 px-2 text-xs font-semibold text-gray-800 bg-gray-50"
                style={{
                  left: cell.x,
                  height: '24px',
                  lineHeight: '24px'
                }}
              >
                {cell.label}
              </div>
            ))
          }
        </div>

        {/* Minor time labels */}
        <div className="relative h-6">
          {visibleCells
            .filter(cell => cell.isHeader || !cell.isMajor)
            .map((cell, index) => (
              <div
                key={`minor-label-${index}`}
                className="absolute top-0 px-1 text-xs text-gray-600"
                style={{
                  left: cell.x,
                  height: '24px',
                  lineHeight: '24px',
                  minWidth: cellWidth
                }}
              >
                {!cell.isMajor ? cell.label : ''}
              </div>
            ))
          }
        </div>
      </div>

      {/* Today indicator */}
      <TodayIndicator
        startDate={startDate}
        endDate={endDate}
        cellWidth={cellWidth}
        timeScale={timeScale}
        height={height}
      />

      {/* Weekend highlighting for day scale */}
      {timeScale === 'day' && (
        <WeekendHighlight
          cells={visibleCells}
          cellWidth={cellWidth}
          height={height}
        />
      )}
    </div>
  );
};

// Component to show today indicator
const TodayIndicator: React.FC<{
  startDate: Date;
  endDate: Date;
  cellWidth: number;
  timeScale: 'day' | 'week' | 'month';
  height: number;
}> = ({ startDate, endDate, cellWidth, timeScale, height }) => {
  const today = new Date();
  
  // Only show if today is within the visible range
  if (today < startDate || today > endDate) {
    return null;
  }

  // Calculate position
  const cellMs = timeScale === 'day' ? 24 * 60 * 60 * 1000 :
                 timeScale === 'week' ? 7 * 24 * 60 * 60 * 1000 :
                 30 * 24 * 60 * 60 * 1000;

  const msFromStart = today.getTime() - startDate.getTime();
  const x = (msFromStart / cellMs) * cellWidth;

  return (
    <div
      className="absolute top-12 border-l-2 border-red-500 z-20 pointer-events-none"
      style={{
        left: x,
        height: height - 48 // Subtract header height
      }}
      data-testid="today-indicator"
    >
      {/* Today label */}
      <div className="absolute top-0 -left-6 bg-red-500 text-white text-xs px-2 py-1 rounded">
        Today
      </div>
    </div>
  );
};

// Component to highlight weekends
const WeekendHighlight: React.FC<{
  cells: GridCell[];
  cellWidth: number;
  height: number;
}> = ({ cells, cellWidth, height }) => {
  const weekendCells = cells.filter(cell => {
    const dayOfWeek = cell.date.getDay();
    return dayOfWeek === 0 || dayOfWeek === 6; // Sunday or Saturday
  });

  return (
    <>
      {weekendCells.map((cell, index) => (
        <div
          key={`weekend-${index}`}
          className="absolute top-12 bg-gray-100 bg-opacity-50 pointer-events-none"
          style={{
            left: cell.x,
            width: cellWidth,
            height: height - 48 // Subtract header height
          }}
          data-testid={`weekend-highlight-${index}`}
        />
      ))}
    </>
  );
};

export default TimelineGrid;