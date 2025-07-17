
'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';

// Spring values for smooth animations
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

const getCategoryStyles = (
  category: string,
  themeMode: 'light' | 'dark'
) => {
  const styles: {
    bgColor: string;
    iconFilter?: string;
    titleColor: string;
    descriptionColor: string;
    actionColor: string;
    eventLinkColor: string;
    eventLinkHoverColor: string;
    eventBgColor: string;
    eventBorderColor: string;
  } = {
    bgColor: '',
    titleColor: themeMode === 'light' ? 'text-gray-800' : 'text-gray-50',
    descriptionColor: themeMode === 'light' ? 'text-gray-600' : 'text-gray-300',
    actionColor: themeMode === 'light' ? 'text-gray-500' : 'text-gray-400',
    eventLinkColor: themeMode === 'light' ? 'text-gray-700' : 'text-gray-100',
    eventLinkHoverColor: '',
    eventBgColor: '',
    eventBorderColor: '',
  };

  if (themeMode === 'light') {
    switch (category) {
      case 'strategist':
        styles.bgColor = 'bg-blue-100';
        styles.eventLinkHoverColor = 'hover:text-blue-600';
        styles.eventBgColor = 'bg-blue-50';
        styles.eventBorderColor = 'border-blue-200';
        break;
      case 'brainiac':
        styles.bgColor = 'bg-purple-100';
        styles.eventLinkHoverColor = 'hover:text-purple-600';
        styles.eventBgColor = 'bg-purple-50';
        styles.eventBorderColor = 'border-purple-200';
        break;
      case 'thinker':
        styles.bgColor = 'bg-pink-100';
        styles.eventLinkHoverColor = 'hover:text-pink-600';
        styles.eventBgColor = 'bg-pink-50';
        styles.eventBorderColor = 'border-pink-200';
        break;
      case 'innovator':
        styles.bgColor = 'bg-orange-100';
        styles.eventLinkHoverColor = 'hover:text-orange-600';
        styles.eventBgColor = 'bg-orange-50';
        styles.eventBorderColor = 'border-orange-200';
        break;
      default:
        styles.bgColor = 'bg-white';
    }
  } else { // Dark mode
    // Apply a subtle blue gradient to all cards in dark mode for uniformity
    styles.bgColor = 'bg-gradient-to-b from-[rgba(0,111,175,0.2)] to-[rgba(0,111,175,0.4)]';
    styles.eventBgColor = 'bg-white/5';
    styles.eventBorderColor = 'border-white/10';

    switch (category) {
      case 'strategist':
        styles.iconFilter = 'drop-shadow(0 0 8px #0471A670)';
        styles.eventLinkHoverColor = 'hover:text-blue-300';
        break;
      case 'brainiac':
        styles.iconFilter = 'drop-shadow(0 0 8px #C287E870)';
        styles.eventLinkHoverColor = 'hover:text-purple-300';
        break;
      case 'thinker':
        styles.iconFilter = 'drop-shadow(0 0 8px #dd557e70)';
        styles.eventLinkHoverColor = 'hover:text-pink-300';
        break;
      case 'innovator':
        styles.iconFilter = 'drop-shadow(0 0 8px #FF855270)';
        styles.eventLinkHoverColor = 'hover:text-orange-300';
        break;
      default:
        styles.bgColor = 'bg-gray-800';
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
    if (isFlipped) return;
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    if(!isFlipped) {
      rotateX.set(0);
      rotateY.set(0);
      scale.set(1.0);
    }
  };

  const styles = getCategoryStyles(
    category,
    themeMode
  );

  const iconBgColor = themeMode === 'light' ? 'bg-white/80' : 'bg-white/5';
  const iconShadow = themeMode === 'light' ? 'shadow-md' : 'shadow-lg';
  const cardShadow = themeMode === 'light' ? 'shadow-soft' : 'shadow-md-soft';

  return (
    <div className="w-full max-w-sm sm:w-[calc(50%-1rem)] lg:w-[calc(25%-1.5rem)] h-96 mx-auto [perspective:1000px]">
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
          transition={{ duration: 0.5, ease: 'easeInOut' }}
        >
          {/* Front of card */}
          <div
            className={`absolute inset-0 [backface-visibility:hidden] ${styles.bgColor} rounded-2xl p-8 flex flex-col justify-between items-center text-center`}
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
                  filter: styles.iconFilter,
                }}
              />
            </div>
            <h3 className={`text-2xl font-bold mb-4 ${styles.titleColor}`}>{title}</h3>
            <p
              className={`text-lg leading-relaxed mb-4 flex-grow ${styles.descriptionColor}`}
            >
              {description}
            </p>
            <div className={`text-sm ${styles.actionColor}`}>
              Click to see events
            </div>
          </div>

          {/* Back of card */}
          <div
            className={`absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] ${styles.bgColor} rounded-2xl p-8 flex flex-col justify-between`}
          >
            <h3 className={`text-xl font-bold mb-6 text-center ${styles.titleColor}`}>
              Related Events
            </h3>
            <div className="space-y-4 flex-1 flex flex-col justify-center">
              {events.length > 0 ? (
                events.map((event, index) => (
                  <motion.div
                    key={index}
                    className={`p-3 rounded-lg border transition-all duration-300 ${styles.eventBgColor} ${styles.eventBorderColor}`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link
                      href={event.link}
                      className={`font-medium block ${styles.eventLinkColor} ${styles.eventLinkHoverColor}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.name}
                    </Link>
                  </motion.div>
                ))
              ) : (
                <p className={styles.descriptionColor}>No events listed yet.</p>
              )}
            </div>
            <div className={`text-sm text-center mt-6 ${styles.actionColor}`}>
              Click to flip back
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TiltedFlipCard;
