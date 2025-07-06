
'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';

// Spring values for smooth, quick animations
const springConfig = {
  damping: 20,
  stiffness: 250,
  mass: 1,
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

const getCategoryStyles = (category: string, themeMode: 'light' | 'dark') => {
  const styles: {
    bgColor: string;
    iconFill: string;
    iconFilter?: string;
  } = {
    bgColor: '',
    iconFill: '',
  };

  if (themeMode === 'light') {
    switch (category) {
      case 'thinker':
        styles.bgColor = 'bg-card-thinker-light';
        styles.iconFill = '#6A6AF0';
        break;
      case 'brainiac':
        styles.bgColor = 'bg-card-brainiac-light';
        styles.iconFill = '#ADD8E6';
        break;
      case 'strategist':
        styles.bgColor = 'bg-card-strategist-light';
        styles.iconFill = '#FFD700';
        break;
      case 'innovator':
        styles.bgColor = 'bg-card-innovator-light';
        styles.iconFill = '#FF69B4';
        break;
      default:
        styles.bgColor = 'bg-white';
        styles.iconFill = '#000000';
    }
  } else { // Dark mode
    styles.bgColor = 'bg-card-dark';
    switch (category) {
      case 'thinker':
        styles.iconFill = '#6A6AF0';
        styles.iconFilter = 'drop-shadow(0 0 8px rgba(106, 106, 240, 0.7))';
        break;
      case 'brainiac':
        styles.iconFill = '#AFE152';
        styles.iconFilter = 'drop-shadow(0 0 8px rgba(175, 225, 82, 0.7))';
        break;
      case 'strategist':
        styles.iconFill = '#F0AD4E';
        styles.iconFilter = 'drop-shadow(0 0 8px rgba(240, 173, 78, 0.7))';
        break;
      case 'innovator':
        styles.iconFill = '#EA5C9F';
        styles.iconFilter = 'drop-shadow(0 0 8px rgba(234, 92, 159, 0.7))';
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

  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  const rotateAmplitude = 15;
  const scaleOnHover = 1.03;

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cardRef.current || isFlipped) return;

    const rect = cardRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -rotateAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * rotateAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
    scale.set(scaleOnHover);
  };

  const handleMouseLeave = () => {
    if (isFlipped) return;
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    handleMouseLeave(); // Reset tilt when flipping
  };

  const { bgColor, iconFilter } = getCategoryStyles(category, themeMode);
  const titleColor = themeMode === 'light' ? 'text-text-light-primary' : 'text-text-dark-primary';
  const descriptionColor = themeMode === 'light' ? 'text-text-light-secondary' : 'text-text-dark-secondary';
  const clickActionColor = themeMode === 'light' ? 'text-gray-500' : 'text-gray-400';
  const eventLinkHoverColor = themeMode === 'light' ? 'hover:text-blue-600' : 'hover:text-blue-400';
  const iconBgColor = themeMode === 'light' ? 'bg-white/80' : 'bg-white/5';
  const iconShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';
  const cardShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';

  return (
    <div className="w-80 h-96 [perspective:1000px]">
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
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          {/* Front of card */}
          <div className={`absolute inset-0 [backface-visibility:hidden] ${bgColor} rounded-2xl p-8 flex flex-col justify-between items-center text-center`}>
            <div className={`relative ${iconBgColor} ${iconShadow} rounded-full p-4 flex justify-center items-center`} style={{ width: '80px', height: '80px' }}>
                <img
                  src={iconSrc}
                  alt={`${title} Icon`}
                  className="w-10 h-10"
                  style={{ filter: iconFilter }}
                />
            </div>
            <div className="flex flex-col items-center flex-grow justify-center">
              <h3 className={`text-2xl font-bold mb-2 ${titleColor}`}>{title}</h3>
              <p className={`text-base leading-relaxed ${descriptionColor}`}>{description}</p>
            </div>
            <div className={`text-sm mt-auto ${clickActionColor}`}>Click to see events</div>
          </div>

          {/* Back of card */}
          <div className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${bgColor} rounded-2xl p-8 flex flex-col justify-between`}>
            <h3 className={`text-xl font-bold text-center ${titleColor}`}>Related Events</h3>
            <div className="space-y-3 flex-1 flex flex-col justify-center">
              {events.length > 0 ? events.map((event, index) => (
                <motion.div
                  key={index}
                  className={`p-3 rounded-lg border transition-all duration-300 ${themeMode === 'light' ? 'bg-black/5 border-black/10 hover:border-black/20' : 'bg-white/10 border-white/20 hover:border-white/50'}`}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Link
                    href={event.link}
                    className={`font-medium block ${descriptionColor} ${eventLinkHoverColor}`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    {event.name}
                  </Link>
                </motion.div>
              )) : <p className={`text-sm ${descriptionColor}`}>No events listed yet.</p>}
            </div>
            <div className={`text-sm text-center mt-4 ${clickActionColor}`}>Click to flip back</div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TiltedFlipCard;
