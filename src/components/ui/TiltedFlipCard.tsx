
'use client';

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from 'next/link';

import "./TiltedCard.css";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

interface TiltedFlipCardProps {
    id: number;
    icon: string;
    title: string;
    description: string;
    gradient: string;
    events: Array<{ name: string; link: string; }>;
    tiltAmplitude?: number;
    scaleOnHover?: number;
}

export default function TiltedFlipCard({
  id,
  icon,
  title,
  description,
  gradient,
  events,
  tiltAmplitude = 10,
  scaleOnHover = 1.05,
}: TiltedFlipCardProps) {
  const ref = useRef<HTMLElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const rotateX = useSpring(useMotionValue(0), springValues);
  const rotateY = useSpring(useMotionValue(0), springValues);
  const scale = useSpring(1, springValues);

  const flipRotation = useSpring(0, {
    damping: 25,
    stiffness: 80,
    mass: 1.5,
  });
  
  const [glowColor, setGlowColor] = useState('transparent');

  useEffect(() => {
    // Extract color from gradient for the glow
    const colorMatch = gradient.match(/from-\[(#[0-9a-fA-F]{6})\]/);
    if (colorMatch && colorMatch[1]) {
        const hex = colorMatch[1];
        // Convert hex to rgba for glow
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        setGlowColor(`rgba(${r}, ${g}, ${b}, 0.4)`);
    }

  }, [gradient]);

  useEffect(() => {
    if (isFlipped) {
      rotateX.set(0);
      rotateY.set(0);
      scale.set(1);
    } else if (!isHovered) {
      rotateX.set(0);
      rotateY.set(0);
      scale.set(1);
    }
  }, [isFlipped, isHovered, rotateX, rotateY, scale]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    if (!ref.current || isFlipped) return;

    const rect = ref.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left - rect.width / 2;
    const offsetY = e.clientY - rect.top - rect.height / 2;

    const rotationX = (offsetY / (rect.height / 2)) * -tiltAmplitude;
    const rotationY = (offsetX / (rect.width / 2)) * tiltAmplitude;

    rotateX.set(rotationX);
    rotateY.set(rotationY);
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    if (isFlipped) return;
    scale.set(scaleOnHover);
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    if (isFlipped) return;
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleClick = () => {
    setIsFlipped((prev) => {
      const newState = !prev;
      if (newState) {
        flipRotation.set(180);
      } else {
        flipRotation.set(0);
      }
      return newState;
    });
  };

  return (
    <motion.figure
      ref={ref}
      className="tilted-card-figure"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{
        perspective: "1000px",
        scale: scale,
        rotateX: rotateX,
        rotateY: rotateY,
      }}
      transition={{
        scale: springValues,
        rotateX: springValues,
        rotateY: springValues,
      }}
    >
      <div className="card-glow" style={{'--glow-color': glowColor} as React.CSSProperties}></div>
      <motion.div
        className="tilted-card-flipper"
        style={{
          rotateY: flipRotation,
          transformStyle: "preserve-3d",
        }}
        transition={{ duration: 0.7 }}
      >
        {/* Front Face */}
        <div className="tilted-card-face tilted-card-face-front">
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 dark:opacity-100`}></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
            <img src={icon} alt={`${title} icon`} className="superpower-icon" />
            <h3 className="superpower-title-front">{title}</h3>
            <p className="superpower-description-front">{description}</p>
            <span className="flip-hint mt-auto">Click to see events</span>
          </div>
        </div>

        {/* Back Face */}
        <div
          className="tilted-card-face tilted-card-face-back"
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-20 dark:opacity-100`}></div>
          <div className="relative z-10 flex flex-col items-center justify-center h-full">
              <h4 className="superpower-back-title">Related Events:</h4>
              <div className="superpower-back-content">
                {events.length > 0 ? (
                  <ul>
                    {events.map((event, index) => (
                      <li key={index}>
                        <Link href={event.link} onClick={(e) => e.stopPropagation()}>{event.name}</Link>
                      </li>
                    ))}
                  </ul>
                ) : <p>No events yet. Check back soon!</p> }
              </div>
              <span className="flip-back-hint mt-auto">Click to flip back</span>
          </div>
        </div>
      </motion.div>
    </motion.figure>
  );
}
