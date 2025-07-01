
'use client';

import React, { useRef, useState, useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import Image from "next/image";

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

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
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
  };

  const handleClick = () => {
    setIsFlipped((prev) => {
      const newState = !prev;
      flipRotation.set(newState ? 180 : 0);
      return newState;
    });
  };

  return (
    <div
      className="tilted-card-figure"
      style={{ perspective: "1000px" }}
    >
      <motion.div
        ref={ref}
        className="tilted-card-flipper"
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
        style={{
          rotateY: flipRotation,
          transformStyle: "preserve-3d",
        }}
        transition={{ duration: 0.7 }}
      >
        <motion.div
          className="tilted-card-face tilted-card-face-front"
          style={{
            rotateX,
            rotateY,
            scale,
            backfaceVisibility: "hidden",
          }}
        >
          <Image
            src={superpowerImage}
            alt={`${superpowerTitle} superpower`}
            className="superpower-main-image"
            width={300}
            height={150}
            data-ai-hint="futuristic technology"
          />
          <Image
            src={superpowerIcon}
            alt={`${superpowerTitle} icon`}
            className="superpower-icon"
            width={70}
            height={70}
            data-ai-hint="icon"
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
    </div>
  );
}
