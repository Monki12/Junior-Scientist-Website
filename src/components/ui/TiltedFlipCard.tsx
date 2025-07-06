'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';

// Spring values for smooth animations
const springConfig = {
  damping: 20, // Reduced damping for quicker stop
  stiffness: 250, // Increased stiffness for faster movement
  mass: 1, // Reduced mass for lighter, more agile feel
};

interface TiltedFlipCardProps {
  title: string;
  description: string;
  events: Array<{
    name: string;
    link: string;
  }>;
  iconSrc: string;
  category: 'thinker' | 'brainiac' | 'strategist' | 'innovator';
  themeMode: 'light' | 'dark';
}

const getCategoryStyles = (
  category: string,
  themeMode: 'light' | 'dark'
) => {
  const styles: {
    bgColor: string;
    iconFill: string;
    iconFilter?: string; // For dark mode glow
  } = {
    bgColor: '',
    iconFill: '',
  };

  if (themeMode === 'light') {
    switch (category) {
      case 'thinker':
        styles.bgColor = 'bg-card-thinker-light'; // Use Tailwind class
        styles.iconFill = 'var(--icon-thinker-light)'; // Use CSS variable for SVG fill
        break;
      case 'brainiac':
        styles.bgColor = 'bg-card-brainiac-light';
        styles.iconFill = 'var(--icon-brainiac-light)';
        break;
      case 'strategist':
        styles.bgColor = 'bg-card-strategist-light';
        styles.iconFill = 'var(--icon-strategist-light)';
        break;
      case 'innovator':
        styles.bgColor = 'bg-card-innovator-light';
        styles.iconFill = 'var(--icon-innovator-light)';
        break;
      default:
        styles.bgColor = 'bg-white';
        styles.iconFill = '#000000';
    }
  } else {
    // Dark mode
    styles.bgColor = 'bg-card-dark-bg'; // Consistent dark background
    switch (category) {
      case 'thinker':
        styles.iconFill = 'var(--icon-thinker-dark)';
        styles.iconFilter = 'drop-shadow(0 0 8px #6A6AF070)'; // Blue glow
        break;
      case 'brainiac':
        styles.iconFill = 'var(--icon-brainiac-dark)';
        styles.iconFilter = 'drop-shadow(0 0 8px #AFE15270)'; // Green glow
        break;
      case 'strategist':
        styles.iconFill = 'var(--icon-strategist-dark)';
        styles.iconFilter = 'drop-shadow(0 0 8px #F0AD4E70)'; // Orange glow
        break;
      case 'innovator':
        styles.iconFill = 'var(--icon-innovator-dark)';
        styles.iconFilter = 'drop-shadow(0 0 8px #EA5C9F70)'; // Pink glow
        break;
      default:
        styles.iconFill = '#FFFFFF';
        styles.iconFilter = 'none';
    }
  }
  return styles;
};

const TiltedFlipCard = ({
  title,
  description,
  events,
  iconSrc,
  category,
  themeMode,
}: TiltedFlipCardProps) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Framer Motion values for tilt effect
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  // Constants for tilt amplitude
  const rotateAmplitude = 18; // Increased from 10/15 to 18 for a more noticeable tilt. Experiment with 15-25.
  const scaleOnHover = 1.03; // Slight scale, adjust as desired.

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2; // X distance from center
    const offsetY = e.clientY - rect.top - rect.height / 2; // Y distance from center

    // Calculate rotation based on mouse position relative to card center
    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
    scale.set(scaleOnHover); // Scale up on hover
  };

  const handleMouseLeave = () => {
    // Reset all motion values to their initial state (flat, no scale)
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  // Get dynamic styles based on category and themeMode
  const { bgColor, iconFill, iconFilter } = getCategoryStyles(
    category,
    themeMode
  );

  // Determine text colors based on theme, as before
  const titleColor =
    themeMode === 'light'
      ? 'text-text-light-primary'
      : 'text-text-dark-primary';
  const descriptionColor =
    themeMode === 'light'
      ? 'text-text-light-secondary'
      : 'text-text-dark-secondary';
  const clickActionColor =
    themeMode === 'light' ? 'text-gray-500' : 'text-gray-400';
  const eventItemColor =
    themeMode === 'light' ? 'text-event-item-light' : 'text-event-item-dark';
  const eventLinkHoverColor =
    themeMode === 'light'
      ? 'hover:text-event-link-hover-light'
      : 'hover:text-event-link-hover-dark';

  // Icon Wrapper and Shadows
  const iconBgColor = themeMode === 'light' ? 'bg-white/80' : 'bg-white/5';
  const iconShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';
  const cardShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';

  return (
    <div className="w-full max-w-sm sm:w-[314px] h-[376px] mx-auto sm:mx-4 [perspective:1000px]">
      <motion.div
        ref={cardRef}
        className={`relative w-full h-full [transform-style:preserve-3d] cursor-pointer rounded-2xl ${cardShadow}`}
        style={{
          rotateX,
          rotateY,
          scale,
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
      >
        {/* Inner container for the actual flip effect */}
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: 'easeInOut' }}
        >
          {/* Front of card */}
          <div
            className={`absolute inset-0 [backface-visibility:hidden] ${bgColor} rounded-2xl p-8 flex flex-col justify-between items-center text-center`}
          >
            <div
              className={`relative ${iconBgColor} ${iconShadow} rounded-full p-4 flex justify-center items-center`}
              style={{ width: '80px', height: '80px' }}
            >
              <img
                src={iconSrc}
                alt={`${title} Icon`}
                className="w-10 h-10"
                style={{
                  fill: iconFill,
                  filter: iconFilter,
                }}
              />
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${titleColor}`}>{title}</h3>
            <p
              className={`text-lg leading-relaxed mb-4 flex-grow ${descriptionColor}`}
            >
              {description}
            </p>
            <div className={`text-sm ${clickActionColor}`}>
              Click to see events
            </div>
          </div>

          {/* Back of card */}
          <div
            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${bgColor} rounded-2xl p-8 flex flex-col justify-between`}
          >
            <h3 className={`text-xl font-bold mb-6 text-center ${titleColor}`}>
              Related Events
            </h3>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {events.map((event, index) => (
                <motion.div
                  key={index}
                  className={`p-4 rounded-lg border transition-all duration-300 ${
                    themeMode === 'light'
                      ? 'bg-gray-100 border-gray-300 hover:border-gray-500'
                      : 'bg-white/10 border-white/20 hover:border-white/50'
                  }`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={event.link}
                    className={`font-medium block ${eventItemColor} ${eventLinkHoverColor}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.name}
                  </Link>
                </motion.div>
              ))}
            </div>
            <div className={`text-sm text-center mt-6 ${clickActionColor}`}>
              Click to flip back
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TiltedFlipCard;
