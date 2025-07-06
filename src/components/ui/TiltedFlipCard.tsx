
'use client';

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from 'next/link';
import { cn } from "@/lib/utils";

import "./TiltedFlipCard.css";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

interface TiltedFlipCardProps {
    className?: string;
    icon: string;
    title: string;
    description: string;
    events: Array<{ name: string; link: string; }>;
    tiltAmplitude?: number;
    scaleOnHover?: number;
}

export default function TiltedFlipCard({
  className,
  icon,
  title,
  description,
  events,
  tiltAmplitude = 15,
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
      className={cn("tilted-card-figure", className)}
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
      <motion.div
        className={cn("tilted-card-flipper", isFlipped && "flipped")}
        style={{
          rotateY: flipRotation,
          transformStyle: "preserve-3d",
        }}
        transition={{ duration: 0.7 }}
      >
        {/* Front Face */}
        <div className="tilted-card-face tilted-card-face-front">
            <div className="card-icon-wrapper">
              <img src={icon} alt={`${title} icon`} />
            </div>
            <h3 className="superpower-title-front">{title}</h3>
            <p className="superpower-description-front">{description}</p>
            <span className="click-to-action">Click to see events</span>
        </div>

        {/* Back Face */}
        <div className="tilted-card-face tilted-card-face-back">
          <h4 className="related-events-title">Related Events:</h4>
          <div className="event-list">
            {events.length > 0 ? (
                <>
                {events.map((event, index) => (
                    <p key={index} className="event-item">
                    <Link href={event.link} onClick={(e) => e.stopPropagation()}>{event.name}</Link>
                    </p>
                ))}
                </>
            ) : <p className="event-item">No events yet. Check back soon!</p> }
          </div>
          <span className="click-to-action-back mt-auto">Click to flip back</span>
        </div>
      </motion.div>
    </motion.figure>
  );
}
