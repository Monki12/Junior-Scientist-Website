
'use client';

import { useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import './TiltedCard.css';

const springValues = {
  damping: 30,
  stiffness: 100,
  mass: 2,
};

interface TiltedCardProps {
  icon: React.ReactNode;
  superpowerTitle: string;
  superpowerDescription: string;
  backContent: React.ReactNode;
  containerHeight?: string;
  containerWidth?: string;
  onClick?: () => void;
}

export default function TiltedCard({
  icon,
  superpowerTitle,
  superpowerDescription,
  backContent,
  containerHeight = "380px",
  containerWidth = "300px",
  onClick = () => {},
}: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [isFlipped, setIsFlipped] = useState(false);

  // Framer Motion spring values for rotation
  const scale = useSpring(1, springValues);

  // Handle the click to flip the card
  const handleClick = () => {
    setIsFlipped(!isFlipped);
    onClick();
  };
  
  const handleMouseEnter = () => {
    scale.set(1.05);
  };

  const handleMouseLeave = () => {
    scale.set(1);
  };

  return (
    <figure
      ref={ref}
      className="tilted-card-figure"
      style={{
        height: containerHeight,
        width: containerWidth,
        perspective: "2000px",
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      <motion.div
        className="tilted-card-inner"
        style={{
          scale,
        }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ...springValues }}
      >
        {/* Front of the Card */}
        <div className="tilted-card-face tilted-card-face-front">
          {icon}
          <h3 className="tilted-card-title-superpower">{superpowerTitle}</h3>
          <p className="tilted-card-description-superpower">{superpowerDescription}</p>
        </div>

        {/* Back of the Card */}
        <div className="tilted-card-face tilted-card-face-back">
          <h4 className="tilted-card-back-title">Related Events:</h4>
          <div className="tilted-card-back-content">
            {backContent}
          </div>
        </div>
      </motion.div>
    </figure>
  );
}
