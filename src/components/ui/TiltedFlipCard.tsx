
'use client';

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Link from 'next/link';

import "./TiltedFlipCard.css";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

interface TiltedFlipCardProps {
    id: number;
    imageSrc?: string;
    altText?: string;
    icon: string | React.ReactNode;
    title: string;
    description: string;
    gradient: string;
    events: Array<{ name: string; link: string; }>;
    tiltAmplitude?: number;
    scaleOnHover?: number;
    showMobileWarning?: boolean;
}

export default function TiltedFlipCard({
  imageSrc,
  altText = "Tilted card image",
  icon,
  title,
  description,
  gradient,
  events,
  tiltAmplitude = 14,
  scaleOnHover = 1.05,
  showMobileWarning = false,
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
    <figure
      ref={ref}
      className="tilted-card-figure"
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      style={{ perspective: "1000px" }}
    >
      <motion.div
        className="tilted-card-flipper"
        style={{
          rotateY: flipRotation,
          transformStyle: "preserve-3d",
        }}
        transition={{ duration: 0.7 }}
      >
        {/* Front Face */}
        <motion.div
          className="tilted-card-face tilted-card-face-front"
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            scale: scale,
          }}
        >
          {imageSrc && (
            <img src={imageSrc} alt={altText} className="absolute inset-0 w-full h-full object-cover rounded-2xl -z-10" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
          )}
          <div className={`glass rounded-2xl p-8 h-full bg-gradient-to-br ${gradient} relative overflow-hidden flex flex-col justify-center items-center text-center`}>
              <div className="absolute top-6 right-6 text-5xl opacity-80">{typeof icon === 'string' ? <img src={icon} alt="" className="w-12 h-12" /> : icon}</div>
              <div className="z-10">
                <h3 className="text-2xl font-headline font-bold text-white mb-6">{title}</h3>
                <p className="text-white/90 text-lg leading-relaxed mb-8">{description}</p>
                <div className="text-white/60 text-sm">Click to see events</div>
              </div>
              <div className="absolute bottom-6 left-1/2 transform -translate-x-1/2">
                <div className="w-12 h-1 bg-white/50 rounded-full animate-pulse"></div>
              </div>
            </div>
        </motion.div>

        {/* Back Face */}
        <div
          className="tilted-card-face tilted-card-face-back"
        >
             <div className="glass rounded-2xl p-8 h-full bg-gradient-to-br from-science-dark to-science-darker border border-science-blue/30 flex flex-col justify-center">
              <h3 className="text-xl font-headline font-bold text-science-blue mb-8 text-center">Related Events</h3>
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                {events.map((event, index) => (
                  <motion.div 
                    key={index}
                    className="p-4 bg-gradient-to-r from-science-blue/20 to-science-purple/20 rounded-lg border border-science-blue/30 hover:border-science-blue/60 transition-all duration-300"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Link 
                      href={event.link}
                      className="text-white hover:text-science-cyan transition-colors duration-300 font-medium block"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {event.name}
                    </Link>
                  </motion.div>
                ))}
                {events.length === 0 && <p className="text-white/70">No events yet. Check back soon!</p>}
              </div>
              <div className="text-white/60 text-sm text-center mt-6">Click to flip back</div>
            </div>
        </div>
      </motion.div>
      {showMobileWarning && (
        <div className="absolute top-4 text-center text-sm block sm:hidden text-white/60">
            This effect is not optimized for mobile. Check on desktop.
        </div>
      )}
    </figure>
  );
}
