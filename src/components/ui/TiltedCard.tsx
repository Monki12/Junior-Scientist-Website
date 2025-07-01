
'use client';

import { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import Image from "next/image";

import "./TiltedCard.css";

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

interface TiltedCardProps {
  superpowerImage: string;
  superpowerIcon: React.ReactNode;
  superpowerTitle: string;
  superpowerDescription: string;
  backContent: React.ReactNode;
  tiltAmplitude?: number;
  scaleOnHover?: number;
}

export default function TiltedCard({
  superpowerImage,
  superpowerIcon,
  superpowerTitle,
  superpowerDescription,
  backContent,
  tiltAmplitude = 10,
  scaleOnHover = 1.05,
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  const rotateX = useSpring(0, springValues);
  const rotateY = useSpring(0, springValues);
  const scale = useSpring(1, springValues);
  const flipRotation = useSpring(0, springValues);

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
    if (isFlipped) return;
    scale.set(scaleOnHover);
  };

  const handleMouseLeave = () => {
    if (isFlipped) return;
    scale.set(1);
    rotateX.set(0);
    rotateY.set(0);
  };

  const handleClick = () => {
    setIsFlipped((prev) => {
      const newState = !prev;
      if (newState) {
        rotateX.set(0);
        rotateY.set(0);
        scale.set(1);
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
      style={{ scale }}
    >
      <motion.div
        className="tilted-card-inner-container"
        style={{
            rotateY: flipRotation,
        }}
        transition={{ duration: 0.6 }}
      >
        {/* Front Face of the Card */}
        <motion.div
          className="tilted-card-face tilted-card-face-front"
          style={{ rotateX, rotateY }}
        >
          <Image
            src={superpowerImage}
            alt={`${superpowerTitle} superpower`}
            className="superpower-main-image"
            width={300}
            height={150}
            data-ai-hint="futuristic technology"
          />
          <div className="superpower-icon">
            {superpowerIcon}
          </div>
          <h3 className="superpower-title-front">{superpowerTitle}</h3>
          <p className="superpower-description-front">{superpowerDescription}</p>
        </motion.div>

        {/* Back Face of the Card */}
        <div className="tilted-card-face tilted-card-face-back">
          <h4 className="superpower-back-title">Related Events:</h4>
          <div className="superpower-back-content">
            {backContent}
          </div>
        </div>
      </motion.div>
    </motion.figure>
  );
}
