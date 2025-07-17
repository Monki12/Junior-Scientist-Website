
'use client';

import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { motion, useScroll, useTransform } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowDown, Loader2 } from "lucide-react";
import PageContent from "@/components/landing/page-content";
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const MagnetLines = lazy(() => import('@/components/ui/magnet-lines'));

function BackgroundVisuals() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="absolute inset-0 z-0 overflow-hidden bg-background"></div>;
  }

  // Define colors based on the new design system
  const baseColor = theme === 'dark' ? 'rgba(0, 154, 192, 0.1)' : 'rgba(0, 111, 175, 0.08)'; // Cloisonne/Ocean Blue tones
  const interactiveColor = theme === 'dark' ? 'rgba(0, 204, 188, 0.4)' : 'rgba(0, 204, 188, 0.5)'; // Amazonite
    
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-background">
            <Suspense fallback={<Skeleton className="absolute inset-0" />}>
              <MagnetLines
                className="absolute inset-0 opacity-100"
                baseColor={baseColor}
                interactiveColor={interactiveColor}
                lineWidth="1px"
                lineHeight="4vmin"
                interactionRadius={200}
              />
            </Suspense>
        </div>
    );
}

export default function JuniorScientistHomePage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();
  const heroRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
    layoutEffect: false, 
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);

  const sentence = {
    hidden: { opacity: 1 },
    visible: {
      opacity: 1,
      transition: {
        delayChildren: 0.3,
        staggerChildren: 0.08,
      },
    },
  }

  const letter = {
    hidden: { opacity: 0, y: 50 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        ease: "power3.out",
        duration: 0.6
      }
    },
  }


  useEffect(() => {
    if (!loading && authUser) {
      router.replace('/dashboard');
    }
  }, [loading, authUser, router]);

  if (loading || authUser) {
    return (
      <div className="flex h-screen w-screen items-center justify-center">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center text-foreground -mt-[4rem]">
      <section ref={heroRef} className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <BackgroundVisuals />
        <motion.div style={{ y }} className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
            <Logo className="h-28 w-20 md:h-32 md:w-24 mx-auto mb-4" />
            <motion.h1 
              variants={sentence}
              initial="hidden"
              animate="visible"
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-foreground font-headline"
            >
             {"JUNIOR SCIENTIST".split(" ").map((word, index) => (
                <span key={word + "-" + index} className="inline-block whitespace-nowrap">
                  {word.split("").map((char, charIndex) => (
                    <motion.span key={char + "-" + charIndex} variants={letter} className="inline-block">
                      {char}
                    </motion.span>
                  ))}
                  {index < "JUNIOR SCIENTIST".split(" ").length - 1 && <span>&nbsp;</span>}
                </span>
              ))}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2, ease: "easeOut" }}
              className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Ignite Curiosity, Compete with Brilliance, and Lead the Change Across Realms!
            </motion.p>

          <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.8, delay: 1.5, ease: "back.out(1.2)" }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
              <Button size="lg" asChild>
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/events">Explore Events</Link>
              </Button>
          </motion.div>
          
          <motion.a
              href="#about-us"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 2, ease: "easeOut" }}
              className="absolute bottom-8 text-sm text-muted-foreground flex flex-col items-center justify-center"
          >
              <p className="mb-1">Scroll to learn more</p>
              <ArrowDown className="h-4 w-4 animate-bounce" />
          </motion.a>
        </motion.div>
      </section>

      <PageContent />
    </div>
  );
}
