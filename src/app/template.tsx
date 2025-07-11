
'use client';

import { motion } from 'framer-motion';

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 30,
        duration: 0.3,
      }}
    >
      {children}
    </motion.div>
  );
}
