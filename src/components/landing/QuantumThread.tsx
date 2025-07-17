
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform } from 'framer-motion';

// --- IMPORTANT ---
// This is a placeholder path. For a truly organic and Awwwards-level effect,
// you should generate your own winding path in an SVG editor like Figma,
// Illustrator, or Inkscape, and paste the 'd' attribute string here.
// The viewBox and path coordinates should be adjusted to match your design.
// This example path is long enough to demonstrate the drawing effect.
const QUANTUM_PATH_DATA = "M 50 0 C 80 150, 20 300, 50 450 S 80 600, 50 750 C 20 900, 80 1050, 50 1200 S 20 1350, 50 1500 C 80 1650, 20 1800, 50 1950 S 20 2100, 50 2250 C 80 2400, 20 2550, 50 2700 S 80 2850, 50 3000 S 20 3150, 50 3300 C 80 3450, 20 3600, 50 3750";

const QuantumThread: React.FC = () => {
    const pathRef = useRef<SVGPathElement>(null);
    const [pathLength, setPathLength] = useState(0);

    // Calculate the total length of the SVG path once it's rendered
    useEffect(() => {
        if (pathRef.current) {
            // A brief delay can sometimes help ensure the DOM is fully ready
            setTimeout(() => {
                if (pathRef.current) {
                    setPathLength(pathRef.current.getTotalLength());
                }
            }, 100);
        }
    }, []);

    const { scrollYProgress } = useScroll();

    // Map scroll progress (0-1) to stroke-dashoffset (pathLength to 0)
    const draw = useTransform(scrollYProgress, [0, 0.95], [pathLength, 0]); // Stop drawing slightly before the end

    const colorAmazonite = "#00CCBC";
    const colorMediumAquamarine = "#60F3AB";

    return (
        <div
            className="quantum-thread-wrapper"
            style={{
                position: 'fixed',
                top: 0,
                right: '5vw', // Positioned 5% from the right edge
                height: '100vh',
                width: '100px', // Width for the SVG to live in
                zIndex: 10,
                pointerEvents: 'none',
                overflow: 'visible',
            }}
        >
            <motion.svg
                viewBox={`0 0 100 3800`} // ViewBox should be sized to contain your path data
                preserveAspectRatio="xMidYMax"
                style={{
                    filter: `drop-shadow(0px 0px 6px ${colorAmazonite}) drop-shadow(0px 0px 3px ${colorMediumAquamarine})`,
                    height: '100vh',
                    width: '100px', // Match the wrapper width
                    overflow: 'visible',
                }}
            >
                <defs>
                    <linearGradient id="threadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={colorAmazonite} />
                        <stop offset="100%" stopColor={colorMediumAquamarine} />
                    </linearGradient>
                </defs>

                {/* Path that gets drawn */}
                <motion.path
                    ref={pathRef}
                    d={QUANTUM_PATH_DATA}
                    stroke="url(#threadGradient)"
                    strokeWidth="4"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{
                        strokeDasharray: pathLength,
                        strokeDashoffset: draw,
                    }}
                />
            </motion.svg>
        </div>
    );
};

export default QuantumThread;
