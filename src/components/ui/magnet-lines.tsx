
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
  baseColor,
  interactiveColor,
  lineWidth,
  lineHeight,
  interactionRadius,
}: {
  x: number;
  y: number;
  mouseX: number | null;
  mouseY: number | null;
  baseAngle: number;
  baseColor: string;
  interactiveColor: string;
  lineWidth: string;
  lineHeight: string;
  interactionRadius: number;
}) {
  const lineRef = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({
    transform: `translate(-50%, -50%) rotate(${baseAngle}deg) scale(1)`,
    backgroundColor: baseColor,
    boxShadow: 'none',
  });

  useEffect(() => {
    if (mouseX === null || mouseY === null) {
      setStyle({
        transform: `translate(-50%, -50%) rotate(${baseAngle}deg) scale(1)`,
        backgroundColor: baseColor,
        boxShadow: 'none',
      });
      return;
    }

    const rect = lineRef.current?.getBoundingClientRect();
    if (rect) {
      const lineX = rect.left + rect.width / 2;
      const lineY = rect.top + rect.height / 2;
      
      const distance = Math.sqrt(Math.pow(lineX - mouseX, 2) + Math.pow(lineY - mouseY, 2));
      const proximity = Math.max(0, 1 - distance / interactionRadius);

      if (proximity > 0) {
        const newAngle = calculateAngle(lineX, lineY, mouseX, mouseY);
        setStyle({
          transform: `translate(-50%, -50%) rotate(${newAngle}deg) scale(${1 + proximity * 0.5})`,
          backgroundColor: interactiveColor,
          boxShadow: `0 0 ${proximity * 15}px ${interactiveColor}`,
        });
      } else {
         setStyle({
          transform: `translate(-50%, -50%) rotate(${baseAngle}deg) scale(1)`,
          backgroundColor: baseColor,
          boxShadow: 'none',
        });
      }
    }
  }, [mouseX, mouseY, baseAngle, baseColor, interactiveColor, interactionRadius]);

  return (
    <div
      ref={lineRef}
      className="absolute"
      style={{
        top: `${y}%`,
        left: `${x}%`,
        width: lineHeight,
        height: lineWidth,
        transition: 'transform 0.2s ease-out, background-color 0.2s ease-out, box-shadow 0.2s ease-out',
        willChange: 'transform, background-color, box-shadow',
        transformOrigin: 'center',
        ...style,
      }}
    />
  );
});

// Main MagnetLines component
export default function MagnetLines({
  rows = 15,
  columns = 15,
  containerSize = '100%',
  baseColor = 'rgba(168, 0, 255, 0.15)', // Default subtle purple
  interactiveColor = 'rgba(74, 0, 255, 0.8)', // Default electric blue
  lineWidth = '1px',
  lineHeight = '4vmin',
  baseAngle = -20,
  interactionRadius = 200,
  className,
  style,
}: {
  rows?: number;
  columns?: number;
  containerSize?: string;
  baseColor?: string;
  interactiveColor?: string;
  lineWidth?: string;
  lineHeight?: string;
  baseAngle?: number;
  interactionRadius?: number;
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
          baseColor={baseColor}
          interactiveColor={interactiveColor}
          lineWidth={lineWidth}
          lineHeight={lineHeight}
          interactionRadius={interactionRadius}
        />
      ))}
    </div>
  );
};
