
'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { motion, useScroll, useTransform } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowDown, Loader2 } from "lucide-react";
import PageContent from "@/components/landing/page-content";

function BackgroundVisuals() {
    return (
        <div className="absolute inset-0 z-0 overflow-hidden bg-background">
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.15 }}
                transition={{ duration: 2 }}
                className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-primary via-background to-background"
            />
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: '-100%' }}
                transition={{ duration: 30, repeat: Infinity, repeatType: 'mirror', ease: 'linear' }}
                className="absolute top-0 left-1/4 w-1/2 h-[200%] bg-gradient-to-b from-transparent via-accent/5 to-transparent"
            />
        </div>
    );
}

export default function JuniorScientistHomePage() {
  const { authUser, loading } = useAuth();
  const router = useRouter();

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
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
        <BackgroundVisuals />
        <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Logo className="h-28 w-20 md:h-32 md:w-24 mx-auto mb-4" />
            <h1 
              className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary font-headline" 
              style={{ filter: 'drop-shadow(0 0 15px hsl(var(--primary) / 0.5))' }}
            >
              JUNIOR SCIENTIST
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Ignite Curiosity, Compete with Brilliance, and Lead the Change Across Realms!
            </p>
          </motion.div>

          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
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
              transition={{ duration: 0.8, delay: 1, ease: "easeOut" }}
              className="absolute bottom-8 text-sm text-muted-foreground flex flex-col items-center justify-center"
          >
              <p className="mb-1">Scroll to learn more</p>
              <ArrowDown className="h-4 w-4 animate-bounce" />
          </motion.a>
        </div>
      </section>

      <PageContent />
    </div>
  );
}
