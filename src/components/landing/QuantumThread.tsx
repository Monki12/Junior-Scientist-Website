
'use client';

import { motion, useScroll, useSpring } from 'framer-motion';

export default function QuantumThread() {
  const { scrollYProgress } = useScroll();

  // Use spring for a smoother, more organic feel to the scroll progress
  const scaleY = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  return (
    <>
      <motion.div
        className="fixed top-0 left-8 w-1 bg-gradient-to-b from-accent to-primary rounded-full origin-top"
        style={{ scaleY }}
      />
    </>
  );
}
