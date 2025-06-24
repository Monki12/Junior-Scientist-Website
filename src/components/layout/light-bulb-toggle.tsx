'use client';

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { motion, useAnimation } from 'framer-motion';
import { Lightbulb, LightbulbOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function LightBulbToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const controls = useAnimation();

  useEffect(() => setMounted(true), []);

  const handleToggle = async () => {
    // Animate the pull
    await controls.start({ y: 10, transition: { duration: 0.1, ease: 'easeOut' } });
    
    // Toggle the theme as the animation starts snapping back
    setTheme(theme === 'dark' ? 'light' : 'dark');

    // Animate the snap back with a spring effect
    await controls.start({ y: 0, transition: { type: 'spring', stiffness: 500, damping: 15 } });
  };

  if (!mounted) {
    // Render a placeholder to avoid layout shift and hydration errors
    return <div className="h-12 w-9 rounded-full bg-muted animate-pulse" />;
  }

  const isDark = theme === 'dark';

  return (
    <div
      role="button"
      aria-label={`Toggle to ${isDark ? 'light' : 'dark'} mode`}
      onClick={handleToggle}
      className="relative flex flex-col items-center cursor-pointer select-none group"
      title={`Toggle to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div className={cn(
        "relative w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300",
        isDark ? 'bg-muted text-muted-foreground' : 'bg-yellow-300/80 text-yellow-600'
      )}>
        {isDark ? (
            <LightbulbOff className="h-5 w-5" />
        ) : (
            <Lightbulb className="h-5 w-5" />
        )}
         <div className={cn(
            "absolute inset-0 rounded-full transition-all duration-300",
            !isDark ? 'shadow-[0_0_10px_3px_rgba(252,211,77,0.6)]' : 'shadow-none'
         )}></div>
      </div>
      
      <motion.div
        animate={controls}
        className="relative transform-gpu"
        style={{ originY: 0 }}
      >
        <div className="w-px h-4 bg-muted-foreground/50 group-hover:bg-primary/80 transition-colors" />
        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-muted-foreground group-hover:bg-primary transition-colors" />
      </motion.div>
    </div>
  );
}
