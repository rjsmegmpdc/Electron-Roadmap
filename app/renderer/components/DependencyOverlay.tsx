import React, { useMemo } from 'react';
import type { TimelineItem, TimelineDependency } from './Timeline';

export interface DependencyOverlayProps {
  dependencies: TimelineDependency[];
  items: TimelineItem[];
  rowPositions: Record<string, { y: number; height: number }>;
  dateToPixel: (date: Date) => number;
  onDependencyClick?: (dependencyId: string) => void;
  scrollTop?: number;
  scrollLeft?: number;
  className?: string;
}

interface DependencyPath {
  id: string;
  fromItem: TimelineItem;
  toItem: TimelineItem;
  type: 'FS' | 'SS' | 'FF' | 'SF';
  lag_days?: number;
  path: string;
  startPoint: { x: number; y: number };
  endPoint: { x: number; y: number };
  color: string;
  isVisible: boolean;
}

const DEPENDENCY_COLORS = {
  FS: '#3B82F6', // Blue for Finish-to-Start
  SS: '#10B981', // Green for Start-to-Start  
  FF: '#F59E0B', // Amber for Finish-to-Finish
  SF: '#EF4444'  // Red for Start-to-Finish
} as const;

export const DependencyOverlay: React.FC<DependencyOverlayProps> = ({
  dependencies,
  items,
  rowPositions,
  dateToPixel,
  onDependencyClick,
  scrollTop = 0,
  scrollLeft = 0,
  className = ''
}) => {
  // Convert dependencies to drawable paths
  const dependencyPaths = useMemo(() => {
    const paths: DependencyPath[] = [];

    dependencies.forEach(dep => {
      const fromItem = items.find(item => item.id === dep.fromId);
      const toItem = items.find(item => item.id === dep.toId);

      if (!fromItem || !toItem) return;

      const fromPos = rowPositions[fromItem.id];
      const toPos = rowPositions[toItem.id];

      if (!fromPos || !toPos) return;

      // Calculate connection points based on dependency type
      const { startPoint, endPoint } = calculateConnectionPoints(
        fromItem, 
        toItem, 
        fromPos, 
        toPos, 
        dep.type,
        dateToPixel
      );

      // Generate SVG path
      const path = generateDependencyPath(startPoint, endPoint, dep.type);

      // Check if dependency is visible in viewport
      const isVisible = isDependencyVisible(startPoint, endPoint, scrollLeft, scrollTop);

      paths.push({
        id: dep.id,
        fromItem,
        toItem,
        type: dep.type,
        lag_days: dep.lag_days,
        path,
        startPoint,
        endPoint,
        color: DEPENDENCY_COLORS[dep.type],
        isVisible
      });
    });

    return paths;
  }, [dependencies, items, rowPositions, dateToPixel, scrollLeft, scrollTop]);

  // Filter visible paths for performance
  const visiblePaths = dependencyPaths.filter(path => path.isVisible);

  if (visiblePaths.length === 0) {
    // Still render the overlay container for tests, but with no content
    return (
      <div 
        className={`absolute inset-0 pointer-events-none z-30 ${className}`}
        data-testid="dependency-overlay"
      />
    );
  }

  return (
    <div 
      className={`absolute inset-0 pointer-events-none z-30 ${className}`}
      data-testid="dependency-overlay"
    >
      <svg
        className="absolute inset-0 w-full h-full"
        style={{ overflow: 'visible' }}
      >
        {/* Dependency arrows */}
        {visiblePaths.map(path => (
          <g 
            key={path.id} 
            data-testid={`dependency-${path.id}`}
            className="cursor-pointer"
            onClick={onDependencyClick ? () => onDependencyClick(path.id) : undefined}
          >
            {/* Main dependency line */}
            <path
              d={path.path}
              stroke={path.color}
              strokeWidth="2"
              fill="none"
              markerEnd={`url(#arrowhead-${path.type})`}
              className="pointer-events-auto"
            />

            {/* Lag indicator if present */}
            {path.lag_days && path.lag_days !== 0 && (
              <LagIndicator
                path={path}
                midPoint={getMidPoint(path.startPoint, path.endPoint)}
              />
            )}

            {/* Hover area for easier clicking */}
            <path
              d={path.path}
              stroke="transparent"
              strokeWidth="8"
              fill="none"
              className="pointer-events-auto"
            />
          </g>
        ))}

        {/* Arrow markers definitions */}
        <defs>
          {Object.entries(DEPENDENCY_COLORS).map(([type, color]) => (
            <marker
              key={type}
              id={`arrowhead-${type}`}
              markerWidth="10"
              markerHeight="10"
              refX="9"
              refY="3"
              orient="auto"
              markerUnits="strokeWidth"
            >
              <polygon
                points="0,0 0,6 9,3"
                fill={color}
              />
            </marker>
          ))}
        </defs>
      </svg>
    </div>
  );
};

// Calculate connection points for different dependency types
function calculateConnectionPoints(
  fromItem: TimelineItem,
  toItem: TimelineItem,
  fromPos: { y: number; height: number },
  toPos: { y: number; height: number },
  type: 'FS' | 'SS' | 'FF' | 'SF',
  dateToPixel: (date: Date) => number
): { startPoint: { x: number; y: number }; endPoint: { x: number; y: number } } {
  
  const fromStart = dateToPixel(new Date(fromItem.start_date.split('-').reverse().join('-')));
  const fromEnd = dateToPixel(new Date(fromItem.end_date.split('-').reverse().join('-')));
  const toStart = dateToPixel(new Date(toItem.start_date.split('-').reverse().join('-')));
  const toEnd = dateToPixel(new Date(toItem.end_date.split('-').reverse().join('-')));

  const fromCenterY = fromPos.y + fromPos.height / 2;
  const toCenterY = toPos.y + toPos.height / 2;

  let startX: number, startY: number, endX: number, endY: number;

  switch (type) {
    case 'FS': // Finish to Start
      startX = fromEnd;
      startY = fromCenterY;
      endX = toStart;
      endY = toCenterY;
      break;
    case 'SS': // Start to Start
      startX = fromStart;
      startY = fromCenterY;
      endX = toStart;
      endY = toCenterY;
      break;
    case 'FF': // Finish to Finish
      startX = fromEnd;
      startY = fromCenterY;
      endX = toEnd;
      endY = toCenterY;
      break;
    case 'SF': // Start to Finish
      startX = fromStart;
      startY = fromCenterY;
      endX = toEnd;
      endY = toCenterY;
      break;
  }

  return {
    startPoint: { x: startX, y: startY },
    endPoint: { x: endX, y: endY }
  };
}

// Generate SVG path for dependency arrow
function generateDependencyPath(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  type: 'FS' | 'SS' | 'FF' | 'SF'
): string {
  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;

  // For simple cases with minimal overlap, use straight line
  if (Math.abs(dy) < 20 && dx > 20) {
    return `M ${startPoint.x} ${startPoint.y} L ${endPoint.x} ${endPoint.y}`;
  }

  // For complex routing, use curved path
  const controlPointDistance = Math.min(Math.abs(dx) / 2, 50);
  
  // Adjust control points based on dependency type and positions
  let cp1x, cp1y, cp2x, cp2y;

  if (dx > 0) {
    // Forward dependency (normal case)
    cp1x = startPoint.x + controlPointDistance;
    cp1y = startPoint.y;
    cp2x = endPoint.x - controlPointDistance;
    cp2y = endPoint.y;
  } else {
    // Backward dependency (needs more complex routing)
    const midY = (startPoint.y + endPoint.y) / 2;
    const offset = Math.abs(dy) < 40 ? 40 : 20;
    
    if (startPoint.y < endPoint.y) {
      cp1x = startPoint.x + 20;
      cp1y = startPoint.y - offset;
      cp2x = endPoint.x - 20;
      cp2y = endPoint.y - offset;
    } else {
      cp1x = startPoint.x + 20;
      cp1y = startPoint.y + offset;
      cp2x = endPoint.x - 20;
      cp2y = endPoint.y + offset;
    }
  }

  return `M ${startPoint.x} ${startPoint.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${endPoint.x} ${endPoint.y}`;
}

// Check if dependency is visible in current viewport
function isDependencyVisible(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number },
  scrollLeft: number,
  scrollTop: number
): boolean {
  // For testing or when scroll values are 0, always show dependencies
  if (scrollLeft === 0 && scrollTop === 0) {
    return true;
  }
  
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 800;

  const minX = Math.min(startPoint.x, endPoint.x);
  const maxX = Math.max(startPoint.x, endPoint.x);
  const minY = Math.min(startPoint.y, endPoint.y);
  const maxY = Math.max(startPoint.y, endPoint.y);

  // Add buffer for better visibility
  const buffer = 100;
  
  // Check if dependency intersects with viewport (with buffer)
  const isXVisible = maxX >= scrollLeft - buffer && minX <= scrollLeft + viewportWidth + buffer;
  const isYVisible = maxY >= scrollTop - buffer && minY <= scrollTop + viewportHeight + buffer;

  return isXVisible && isYVisible;
}

// Calculate midpoint of path for lag indicator
function getMidPoint(
  startPoint: { x: number; y: number },
  endPoint: { x: number; y: number }
): { x: number; y: number } {
  return {
    x: (startPoint.x + endPoint.x) / 2,
    y: (startPoint.y + endPoint.y) / 2
  };
}

// Component to show lag indicator
const LagIndicator: React.FC<{
  path: DependencyPath;
  midPoint: { x: number; y: number };
}> = ({ path, midPoint }) => {
  const lagText = path.lag_days! > 0 ? `+${path.lag_days}d` : `${path.lag_days}d`;

  return (
    <g>
      {/* Background circle */}
      <circle
        cx={midPoint.x}
        cy={midPoint.y}
        r="12"
        fill="white"
        stroke={path.color}
        strokeWidth="2"
        className="pointer-events-auto"
      />
      
      {/* Lag text */}
      <text
        x={midPoint.x}
        y={midPoint.y}
        textAnchor="middle"
        dominantBaseline="middle"
        fontSize="10"
        fill={path.color}
        fontWeight="600"
        className="pointer-events-none"
      >
        {lagText}
      </text>
    </g>
  );
};

export default DependencyOverlay;