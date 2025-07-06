'use client';

import React, { useRef, useState } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import './TiltedFlipCard.css';

// Spring values for smooth animations
const springConfig = {
  damping: 30,
  stiffness: 150,
  mass: 1.5,
};

interface TiltedFlipCardProps {
  className?: string;
  icon: string;
  iconClassName?: string;
  title: string;
  description: string;
  events: Array<{ name: string; link: string }>;
}

export default function TiltedFlipCard({
  className,
  icon,
  iconClassName,
  title,
  description,
  events,
}: TiltedFlipCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(0, springConfig);
  const rotateY = useSpring(0, springConfig);
  const scale = useSpring(1, springConfig);

  const rotateAmplitude = 8;
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
    rotateX.set(0);
    rotateY.set(0);
    scale.set(1);
  };

  return (
    <motion.div
      ref={cardRef}
      className={cn("superpower-card", className)}
      style={{
        rotateX,
        rotateY,
        scale,
        perspective: '1000px',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleFlip}
    >
      <motion.div
        className="card-inner"
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.5, ease: 'easeInOut' }}
      >
        {/* Front Face */}
        <div className="card-front">
          <div className="card-icon-wrapper">
            <img src={icon} alt={`${title} Icon`} className={cn('icon', iconClassName)} />
          </div>
          <h3 className="card-title">{title}</h3>
          <p className="card-description">{description}</p>
          <span className="click-to-action">Click to see events</span>
        </div>

        {/* Back Face */}
        <div className="card-back">
          <h4 className="related-events-title">Related Events:</h4>
          <div className="event-list">
            {events.length > 0 ? (
              events.map((event, index) => (
                <p key={index} className="event-item">
                  <Link href={event.link} onClick={(e) => e.stopPropagation()}>{event.name}</Link>
                </p>
              ))
            ) : <p className="event-item">No events yet. Check back soon!</p>}
          </div>
          <span className="click-to-action-back">Click to flip back</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
