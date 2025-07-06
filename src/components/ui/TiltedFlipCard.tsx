'use client';

import React, { useRef, useState, useEffect } from "react";
import Link from 'next/link';
import { cn } from "@/lib/utils";

import "./TiltedFlipCard.css";

interface TiltedFlipCardProps {
    className?: string;
    icon: string;
    iconClassName?: string;
    title: string;
    description: string;
    events: Array<{ name: string; link: string; }>;
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

  const handleClick = () => {
    setIsFlipped(!isFlipped);
  };

  return (
    <div
      className={cn("superpower-card", className, isFlipped && "flipped")}
      onClick={handleClick}
    >
      <div className="card-inner">
        {/* Front Face */}
        <div className="card-front">
            <div className="card-icon-wrapper">
              <img src={icon} alt={`${title} icon`} className={iconClassName} />
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
                <>
                {events.map((event, index) => (
                    <p key={index} className="event-item">
                    <Link href={event.link} onClick={(e) => e.stopPropagation()}>{event.name}</Link>
                    </p>
                ))}
                </>
            ) : <p className="event-item">No events yet. Check back soon!</p> }
          </div>
          <span className="click-to-action-back">Click to flip back</span>
        </div>
      </div>
    </div>
  );
}
