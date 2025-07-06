
'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';

const springConfig = {
  damping: 20,    // Reduced damping for quicker stop
  stiffness: 250, // Increased stiffness for faster movement
  mass: 1,        // Reduced mass for lighter, more agile feel
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
    iconStyle: React.CSSProperties;
  } = {
    bgColor: '',
    iconStyle: {},
  };

  if (themeMode === 'light') {
    switch (category) {
      case 'thinker':
        styles.bgColor = 'bg-card-thinker-light';
        styles.iconStyle = { fill: 'var(--icon-thinker-light)' };
        break;
      case 'brainiac':
        styles.bgColor = 'bg-card-brainiac-light';
        styles.iconStyle = { fill: 'var(--icon-brainiac-light)' };
        break;
      case 'strategist':
        styles.bgColor = 'bg-card-strategist-light';
        styles.iconStyle = { fill: 'var(--icon-strategist-light)' };
        break;
      case 'innovator':
        styles.bgColor = 'bg-card-innovator-light';
        styles.iconStyle = { fill: 'var(--icon-innovator-light)' };
        break;
      default:
        styles.bgColor = 'bg-white';
        styles.iconStyle = { fill: '#000000' };
    }
  } else { // Dark mode
    styles.bgColor = 'bg-card-dark-bg'; // Consistent dark background
    switch (category) {
      case 'thinker':
        styles.iconStyle = { fill: 'var(--icon-thinker-dark)', filter: 'drop-shadow(0 0 8px #6A6AF070)' };
        break;
      case 'brainiac':
        styles.iconStyle = { fill: 'var(--icon-brainiac-dark)', filter: 'drop-shadow(0 0 8px #AFE15270)' };
        break;
      case 'strategist':
        styles.iconStyle = { fill: 'var(--icon-strategist-dark)', filter: 'drop-shadow(0 0 8px #F0AD4E70)' };
        break;
      case 'innovator':
        styles.iconStyle = { fill: 'var(--icon-innovator-dark)', filter: 'drop-shadow(0 0 8px #EA5C9F70)' };
        break;
      default:
        styles.iconStyle = { fill: '#FFFFFF', filter: 'none' };
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

  const rotateAmplitude = 18;
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
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    handleMouseLeave(); // Reset tilt when flipping
  };

  const { bgColor, iconStyle } = getCategoryStyles(category, themeMode);

  const titleColor = themeMode === 'light' ? 'text-text-light-primary' : 'text-text-dark-primary';
  const descriptionColor = themeMode === 'light' ? 'text-text-light-secondary' : 'text-text-dark-secondary';
  const clickActionColor = themeMode === 'light' ? 'text-gray-500' : 'text-gray-400';
  const eventItemColor = themeMode === 'light' ? 'text-event-item-light' : 'text-event-item-dark';
  const eventLinkHoverColor = themeMode === 'light' ? 'hover:text-event-link-hover-light' : 'hover:text-event-link-hover-dark';
  
  const iconBgColor = themeMode === 'light' ? 'bg-white/80' : 'bg-white/5';
  const iconShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';
  const cardShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';

  return (
    <div className="w-full max-w-sm sm:w-80 h-96 mx-auto sm:mx-4 [perspective:1000px]">
      <motion.div
        ref={cardRef}
        className={`relative w-full h-full [transform-style:preserve-3d] cursor-pointer rounded-2xl ${cardShadow}`}
        style={{ rotateX, rotateY, scale }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleFlip}
      >
        <motion.div
          className="relative w-full h-full [transform-style:preserve-3d]"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
        >
          {/* Front of card */}
          <div className={`absolute inset-0 [backface-visibility:hidden] ${bgColor} rounded-2xl p-8 flex flex-col justify-between items-center text-center`}>
            <div className={`relative ${iconBgColor} ${iconShadow} rounded-full p-4 flex justify-center items-center`} style={{ width: '80px', height: '80px' }}>
              <img
                src={iconSrc}
                alt={`${title} Icon`}
                className="w-10 h-10"
                style={iconStyle}
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
                    className={`font-medium block ${eventItemColor} ${eventLinkHoverColor}`}
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
