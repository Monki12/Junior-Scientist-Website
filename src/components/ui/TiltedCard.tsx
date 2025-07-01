
'use client';

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

import "./TiltedCard.css";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

export default function TiltedCard({
  superpowerImage,
  superpowerIcon,
  superpowerTitle,
  superpowerDescription,
  backContent,
  tiltAmplitude = 14,
  scaleOnHover = 1.05,
}: {
  superpowerImage: string;
  superpowerIcon: string;
  superpowerTitle: string;
  superpowerDescription: string;
  backContent: React.ReactNode;
  tiltAmplitude?: number;
  scaleOnHover?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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
        <motion.div
          className="tilted-card-face tilted-card-face-front"
          style={{
            rotateX: rotateX,
            rotateY: rotateY,
            scale: scale,
            backfaceVisibility: "hidden",
          }}
          transition={{
            scale: springValues,
            rotateX: springValues,
            rotateY: springValues,
          }}
        >
          <img
            src={superpowerImage}
            alt={`${superpowerTitle} superpower`}
            className="superpower-main-image"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/300x150.png'; }}
          />
          <img
            src={superpowerIcon}
            alt={`${superpowerTitle} icon`}
            className="superpower-icon"
            onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/70x70.png'; }}
          />
          <h3 className="superpower-title-front">{superpowerTitle}</h3>
          <p className="superpower-description-front">{superpowerDescription}</p>
        </motion.div>

        <div
          className="tilted-card-face tilted-card-face-back"
          style={{
            transform: "rotateY(180deg)",
            backfaceVisibility: "hidden",
          }}
        >
          <h4 className="superpower-back-title">Related Events:</h4>
          <div className="superpower-back-content">{backContent}</div>
          <span className="flip-back-hint">Click to flip back</span>
        </div>
      </motion.div>
    </figure>
  );
}
