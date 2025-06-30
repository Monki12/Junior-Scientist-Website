
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import MagnetLines from "@/components/ui/magnet-lines";
import { motion } from "framer-motion";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowDown, Loader2 } from "lucide-react";
import PageContent from "@/components/landing/page-content";

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
    <div className="flex flex-col items-center text-foreground -mt-[6.5rem] md:-mt-[5rem]">
      {/* Hero Section */}
      <section className="relative w-full h-screen flex items-center justify-center overflow-hidden bg-background">
        {/* Magnetic Lines Background */}
        <div className="absolute inset-0 z-0 opacity-20 dark:opacity-30">
          <MagnetLines
            rows={20}
            columns={20}
            containerSize="100%"
            lineColor="hsl(var(--primary))"
            lineWidth="0.1vmin"
            lineHeight="5vmin"
            baseAngle={-20}
          />
        </div>

        {/* Gradient Overlay */}
        <div className="absolute inset-0 z-10 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 pointer-events-none" />

        {/* Central Branding Content */}
        <div className="relative z-20 flex flex-col items-center justify-center h-full text-center px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <Logo className="h-28 w-20 md:h-32 md:w-24 mx-auto mb-4" />
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight text-primary font-headline" style={{ textShadow: '0 0 15px hsla(var(--primary-foreground), 0.5), 0 0 25px hsla(var(--accent), 0.3)' }}>
              JUNIOR SCIENTIST
            </h1>
            <p className="mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover, register, and manage your event participation seamlessly. Let the journey begin!
            </p>
          </motion.div>

          <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.5, ease: "easeOut" }}
              className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
               <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft transition-transform hover:scale-105 px-10 py-3 text-lg rounded-lg">
                <Link href="/signup">Get Started</Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="text-primary border-primary/50 hover:bg-primary/5 hover:border-primary shadow-soft transition-transform hover:scale-105 px-10 py-3 text-lg rounded-lg">
                <Link href="/events">Explore Events</Link>
              </Button>
          </motion.div>
          
          <motion.a
              href="#categories"
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
