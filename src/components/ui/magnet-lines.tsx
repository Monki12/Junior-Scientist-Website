
'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { cn } from '@/lib/utils';

// Helper function to calculate angle between two points
const calculateAngle = (x1: number, y1: number, x2: number, y2: number) => {
  const deltaX = x2 - x1;
  const deltaY = y2 - y1;
  return (Math.atan2(deltaY, deltaX) * 180) / Math.PI;
};

// Memoized Line component to prevent re-renders unless its specific props change
const Line = memo(function Line({
  x,
  y,
  mouseX,
  mouseY,
  baseAngle,
  lineColor,
  lineWidth,
  lineHeight,
}: {
  x: number;
  y: number;
  mouseX: number | null;
  mouseY: number | null;
  baseAngle: number;
  lineColor: string;
  lineWidth: string;
  lineHeight: string;
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const [angle, setAngle] = useState(baseAngle);

  useEffect(() => {
    if (mouseX === null || mouseY === null) {
      setAngle(baseAngle);
      return;
    }

    const rect = lineRef.current?.getBoundingClientRect();
    if (rect) {
      const lineX = rect.left + rect.width / 2;
      const lineY = rect.top + rect.height / 2;
      const newAngle = calculateAngle(lineX, lineY, mouseX, mouseY);
      setAngle(newAngle);
    }
  }, [mouseX, mouseY, baseAngle]);

  return (
    <div
      ref={lineRef}
      className="absolute"
      style={{
        top: `${y}%`,
        left: `${x}%`,
        width: lineHeight,
        height: lineWidth,
        backgroundColor: lineColor,
        transform: `translate(-50%, -50%) rotate(${angle}deg)`,
        transformOrigin: 'center',
        transition: 'transform 0.2s ease-out',
        willChange: 'transform',
      }}
    />
  );
});

// Main MagnetLines component
export default function MagnetLines({
  rows = 15,
  columns = 15,
  containerSize = '100%',
  lineColor = '#efefef',
  lineWidth = '0.15vmin',
  lineHeight = '4vmin',
  baseAngle = -20,
  className,
  style,
}: {
  rows?: number;
  columns?: number;
  containerSize?: string;
  lineColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number | null; y: number | null }>({ x: null, y: null });
  const mouseMoveEventRef = useRef<MouseEvent | null>(null);

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      mouseMoveEventRef.current = event;
    };

    const handleMouseLeave = () => {
      mouseMoveEventRef.current = null;
      setMousePosition({ x: null, y: null });
    };

    const updatePosition = () => {
      if (mouseMoveEventRef.current) {
        setMousePosition({
          x: mouseMoveEventRef.current.clientX,
          y: mouseMoveEventRef.current.clientY,
        });
      }
      animationFrameId = requestAnimationFrame(updatePosition);
    };

    let animationFrameId = requestAnimationFrame(updatePosition);
    const currentContainer = containerRef.current;

    window.addEventListener('mousemove', handleMouseMove);
    currentContainer?.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handleMouseMove);
      currentContainer?.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const grid = Array.from({ length: rows }, (_, rowIndex) =>
    Array.from({ length: columns }, (_, colIndex) => {
      const x = (colIndex / (columns - 1)) * 100;
      const y = (rowIndex / (rows - 1)) * 100;
      return { x, y, id: `${rowIndex}-${colIndex}` };
    })
  ).flat();

  return (
    <div
      ref={containerRef}
      className={cn("relative", className)}
      style={{ ...style, width: containerSize, height: containerSize }}
    >
      {grid.map(({ x, y, id }) => (
        <Line
          key={id}
          x={x}
          y={y}
          mouseX={mousePosition.x}
          mouseY={mousePosition.y}
          baseAngle={baseAngle}
          lineColor={lineColor}
          lineWidth={lineWidth}
          lineHeight={lineHeight}
        />
      ))}
    </div>
  );
};
