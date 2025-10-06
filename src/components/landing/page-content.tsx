
'use client';

import React, { useEffect, useState, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  ShieldCheck,
  BookOpen,
  Users2,
  Phone,
  Mail,
  Instagram,
  Facebook,
  Twitter,
  MessageSquare,
  Zap,
  Trophy,
  Loader2,
} from 'lucide-react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubEvent } from '@/types';
import {
  motion,
  useInView,
  animate,
  useScroll,
  useTransform,
} from 'framer-motion';
import TiltedFlipCard from '@/components/ui/TiltedFlipCard';
import { useTheme } from 'next-themes';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';

interface AnimatedNumberProps {
  to: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedNumber({ to, suffix = '', prefix = '' }: AnimatedNumberProps) {
  const ref = useRef<HTMLParagraphElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  useEffect(() => {
    if (isInView && ref.current) {
      animate(0, to, {
        duration: 2,
        onUpdate(value) {
          if (ref.current) {
            ref.current.textContent =
              prefix + Math.floor(value).toLocaleString() + suffix;
          }
        },
      });
    }
  }, [isInView, to, suffix, prefix]);

  return (
    <p ref={ref} className="text-4xl lg:text-5xl font-bold text-primary">
      {prefix}0{suffix}
    </p>
  );
}

const AnimatedContent = ({
  children,
  direction = 'up',
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  direction?: 'up' | 'left' | 'right';
  className?: string;
  delay?: number;
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });

  const variants = {
    hidden: {
      opacity: 0,
      x: direction === 'left' ? -50 : direction === 'right' ? 50 : 0,
      y: direction === 'up' ? 20 : 0,
    },
    visible: {
      opacity: 1,
      x: 0,
      y: 0,
    },
  };

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={variants}
      initial="hidden"
      animate={isInView ? 'visible' : 'hidden'}
      transition={{ duration: 0.8, delay, ease: 'easeOut' }}
    >
      {children}
    </motion.div>
  );
};

function GallerySection() {
  const galleryImages = [
    {
      src: '/images/img0.jpg',
      alt: 'Science fair project',
      dataAiHint: 'science fair',
    },
    {
      src: '/images/img1.jpg',
      alt: 'Girl uses a microscope',
      dataAiHint: 'student microscope',
    },
    {
      src: '/images/img2.jpg',
      alt: 'chemistry experiment',
      dataAiHint: 'student experiment',
    },
    {
      src: '/images/img3.jpg',
      alt: 'Robot at a STEM camp',
      dataAiHint: 'student robot',
    },
    
  ];

  return (
    <section className="w-full py-12 md:py-20">
       <AnimatedContent>
        <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 text-foreground">
          Moments of Brilliance
        </h2>
        <p className="text-lg text-muted-foreground text-center mt-2 max-w-xl mx-auto mb-12">
          Explore our vibrant community in action. Scroll horizontally to see more.
        </p>
      </AnimatedContent>
      <div className="relative">
        <ScrollArea className="w-full whitespace-nowrap rounded-lg">
          <div className="flex w-max space-x-4 p-4">
            {galleryImages.map((image, index) => (
              <figure key={index} className="shrink-0">
                <div className="overflow-hidden rounded-lg w-80 h-96 relative shadow-lg">
                  <Image
                    src={image.src}
                    alt={image.alt}
                    fill
                    style={{ objectFit: 'cover' }}
                    data-ai-hint={image.dataAiHint}
                    className="transition-transform duration-300 ease-in-out hover:scale-105"
                  />
                </div>
              </figure>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </section>
  );
}

function SuperpowerSectionSkeleton() {
  return (
     <section id="superpowers" className="w-full py-12 md:py-20">
      <div className="container mx-auto px-4">
        <AnimatedContent>
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
            What's Your Superpower?
          </h2>
          <p className="text-lg text-muted-foreground text-center mt-2 max-w-xl mx-auto mb-16">
            Discover events tailored to your unique interests and unlock your
            true potential.
          </p>
        </AnimatedContent>
        <div className="flex flex-wrap justify-center items-stretch gap-y-8 gap-x-4 px-4 mx-auto max-w-screen-xl lg:max-w-[1400px]">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="w-full max-w-sm sm:w-[calc(50%-1rem)] lg:w-[calc(25%-0.75rem)] h-96 mx-auto bg-muted/50 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function PageContent() {
  const [events, setEvents] = useState<SubEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const missionSectionRef = useRef<HTMLDivElement>(null);
  
  const { scrollYProgress } = useScroll({
    target: missionSectionRef,
    offset: ['start end', 'end start']
  });
  
  const imageY = useTransform(scrollYProgress, [0, 1], ['-15%', '15%']);

  useEffect(() => {
    // This effect runs once on component mount.
    setMounted(true);
    const fetchEvents = async () => {
      setLoading(true);
      try {
        const eventsCollection = collection(db, 'subEvents');
        const eventSnapshot = await getDocs(query(eventsCollection));
        const eventsList = eventSnapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as SubEvent)
        );
        setEvents(eventsList);
      } catch (error) {
        console.error('Error fetching events for landing page:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const getEventsForCategory = (categoryName: string) => {
    return events
      .filter(event => event.superpowerCategory === categoryName)
      .map(event => ({
        name: event.title,
        link: `/events/${event.slug}`
      }))
      .slice(0, 2); // Show a maximum of 2 events per card
  };

  const thinkerEvents = getEventsForCategory("The Thinker");
  const brainiacEvents = getEventsForCategory("The Brainiac");
  const strategistEvents = getEventsForCategory("The Strategist");
  const innovatorEvents = getEventsForCategory("The Innovator");

  const perks = [
    {
      icon: <ShieldCheck />,
      title: 'Safe Campus Environment',
      description:
        'Ensuring a secure and supportive atmosphere for all participants.',
    },
    {
      icon: <BookOpen />,
      title: 'Real Learning Beyond Textbooks',
      description:
        'Practical application of knowledge and development of critical skills.',
    },
    {
      icon: <Users2 />,
      title: 'Organized Supervision & Verified Volunteers',
      description:
        'Dedicated team to guide and assist students throughout the event.',
    },
  ];
  
  if (!mounted) {
    return (
      <div className="space-y-24 md:space-y-32 bg-background z-10 relative w-full overflow-x-hidden">
        {/* Render skeletons or placeholders for sections */}
        <section id="about-us" className="w-full py-12 md:py-20 scroll-mt-20">
            <div className="container h-96 animate-pulse bg-muted/20 rounded-lg"></div>
        </section>
        <section id="stats" className="w-full py-12 md:py-20 bg-card/50">
            <div className="container h-48 animate-pulse"></div>
        </section>
        <SuperpowerSectionSkeleton />
      </div>
    );
  }

  return (
    <div className="space-y-24 md:space-y-32 bg-background z-10 relative w-full overflow-x-hidden">
      <section
        id="about-us"
        ref={missionSectionRef}
        className="w-full py-12 md:py-20 scroll-mt-20"
      >
        <div className="container mx-auto px-4">
          <AnimatedContent>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 text-foreground">
              About Junior Scientist
            </h2>
          </AnimatedContent>

          <div className="space-y-12 md:space-y-16">
            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <AnimatedContent
                direction="left"
                className="space-y-4 text-lg text-muted-foreground"
              >
                <p>
                  At Junior Scientist, we are passionate about fostering
                  curiosity and innovation in young minds.
                </p>
              </AnimatedContent>
              <AnimatedContent direction="right">
                <div className="relative aspect-video rounded-xl shadow-md-soft overflow-hidden">
                  <motion.div style={{y: imageY}} className="absolute inset-0">
                     <Image
                        src="/images/img2.jpg"
                        alt="Students collaborating on a science project"
                        data-ai-hint="students collaborating"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-xl"
                      />
                   </motion.div>
                </div>
              </AnimatedContent>
            </div>

            <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
              <AnimatedContent
                direction="right"
                className="space-y-4 text-lg text-muted-foreground md:order-2"
              >
                <p>
                  Our mission is to provide an engaging platform where students
                  can explore scientific principles, critical thinking, and
                  problem-solving through hands-on experiences and competitive
                  events. We believe in nurturing the next generation of
                  innovators and leaders by creating an environment that is not
                  only challenging but also supportive and fun.
                </p>
              </AnimatedContent>
              <AnimatedContent direction="left" className="md:order-1">
                <div className="relative aspect-video rounded-xl shadow-md-soft overflow-hidden">
                   <motion.div style={{y: imageY}} className="absolute inset-0">
                     <Image
                        src="/images/img0.jpg"
                        alt="Abstract technology visualization"
                        data-ai-hint="data visualization"
                        fill
                        style={{ objectFit: 'cover' }}
                        className="rounded-xl"
                      />
                   </motion.div>
                </div>
              </AnimatedContent>
            </div>

            <AnimatedContent className="text-center">
              <div className="space-y-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                <p>
                  Join us in fostering the bright minds of tomorrow, where every
                  experiment is a step towards discovery.
                </p>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </section>

      <section id="stats" className="w-full py-12 md:py-20 bg-card/50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <AnimatedContent delay={0}>
              <div className="p-6">
                <Users2 className="h-12 w-12 text-primary mx-auto mb-4" />
                <AnimatedNumber to={100} suffix="+" />
                <p className="text-muted-foreground mt-2">Partner Schools</p>
              </div>
            </AnimatedContent>
            <AnimatedContent delay={0.2}>
              <div className="p-6">
                <Trophy className="h-12 w-12 text-primary mx-auto mb-4" />
                <AnimatedNumber to={100000} prefix="₹" suffix="+" />
                <p className="text-muted-foreground mt-2">Worth of Prizes</p>
              </div>
            </AnimatedContent>
            <AnimatedContent delay={0.4}>
              <div className="p-6">
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <AnimatedNumber to={2000} suffix="+" />
                <p className="text-muted-foreground mt-2">
                  Participation
                </p>
              </div>
            </AnimatedContent>
          </div>
        </div>
      </section>

      <section
        id="why-choose-us"
        className="w-full py-12 md:py-20"
      >
        <div className="container mx-auto px-4">
          <AnimatedContent>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-foreground">
              Why Choose Junior Scientist?
            </h2>
          </AnimatedContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {perks.map((perk, i) => (
              <AnimatedContent key={perk.title} delay={i * 0.2}>
                <Card className="bg-gradient-to-b from-[rgba(0,111,175,0.4)] to-[rgba(0,111,175,0.6)] dark:from-[rgba(0,111,175,0.2)] dark:to-[rgba(0,111,175,0.4)] shadow-soft dark:shadow-primary/10 hover:shadow-md-soft transition-all duration-300 p-8 text-center rounded-2xl border border-border/30 hover:border-primary/50 hover:-translate-y-2 h-full">
                  {React.cloneElement(perk.icon, {
                    className:
                      'h-10 w-10 text-primary mx-auto mb-4',
                  })}
                  <h3 className="text-xl font-bold mt-4 mb-2 text-foreground">
                    {perk.title}
                  </h3>
                  <p className="text-base text-muted-foreground">
                    {perk.description}
                  </p>
                </Card>
              </AnimatedContent>
            ))}
          </div>
        </div>
      </section>

      <section id="superpowers" className="w-full py-12 md:py-20">
        <div className="container mx-auto px-4">
          <AnimatedContent>
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-4 text-foreground">
              What's Your Superpower?
            </h2>
            <p className="text-lg text-muted-foreground text-center mt-2 max-w-xl mx-auto mb-16">
              Discover events tailored to your unique interests and unlock your
              true potential.
            </p>
          </AnimatedContent>
          {loading ? (
             <SuperpowerSectionSkeleton />
          ) : (
            <div className="flex flex-wrap justify-center items-stretch gap-y-8 gap-x-4 px-4 mx-auto max-w-screen-xl lg:max-w-[1400px]">
              <TiltedFlipCard
                title="The Thinker"
                description="Excel in debating, global affairs, and public speaking? Born diplomat!"
                events={thinkerEvents}
                iconSrc="https://img.icons8.com/fluency/96/brain.png"
                category="thinker"
                themeMode={theme === 'dark' ? 'dark' : 'light'}
              />
              <TiltedFlipCard
                title="The Brainiac"
                description="Obsessed with facts, quizzes, and science puzzles? You see the patterns others miss."
                events={brainiacEvents}
                iconSrc="https://img.icons8.com/fluency/96/puzzle.png"
                category="brainiac"
                themeMode={theme === 'dark' ? 'dark' : 'light'}
              />
              <TiltedFlipCard
                title="The Strategist"
                description="Enjoy solving math riddles and cracking logic games? Master of numbers and patterns."
                events={strategistEvents}
                iconSrc="https://img.icons8.com/fluency/96/rocket.png"
                category="strategist"
                themeMode={theme === 'dark' ? 'dark' : 'light'}
              />
              <TiltedFlipCard
                title="The Innovator"
                description="Love to design, build, and bring new ideas to life? Future tech pioneer!"
                events={innovatorEvents}
                iconSrc="https://img.icons8.com/fluency/96/light-on.png"
                category="innovator"
                themeMode={theme === 'dark' ? 'dark' : 'light'}
              />
            </div>
          )}
        </div>
      </section>

      <GallerySection />

      <section className="w-full py-12 md:py-20">
        <div className="container mx-auto px-4 text-center">
          <AnimatedContent>
            <div className="relative">
              <MessageSquare className="h-12 w-12 text-primary opacity-20 absolute -top-4 left-1/2 -translate-x-1/2" />
              <p className="text-2xl md:text-3xl font-medium italic max-w-4xl mx-auto text-foreground relative z-10 pt-8">
                "We empower students to explore their potential and shape the
                future through engaging events."
              </p>
              <p className="text-lg text-muted-foreground mt-4">
                - The Junior Scientist Team
              </p>
            </div>
          </AnimatedContent>
        </div>
      </section>

      <section
        id="contact-us"
        className="w-full py-12 md:py-20 bg-card/50 scroll-mt-20"
      >
        <div className="container mx-auto px-4 text-center">
          <AnimatedContent>
            <h2 className="text-3xl md:text-4xl font-bold mb-6 text-foreground">
              Get in Touch
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Have questions or want to partner with us? We'd love to hear from
              you!
            </p>
          </AnimatedContent>
          <AnimatedContent
            delay={0.2}
            className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8"
          >
            <Button size="lg" variant="outline" asChild>
              <a href="mailto:contact@juniorscientist.events">
                <Mail className="mr-2 h-5 w-5" /> Email Us
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a
                href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Users2 className="mr-2 h-5 w-5" /> Join WhatsApp Group
              </a>
            </Button>
          </AnimatedContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-10">
            <AnimatedContent delay={0.4}>
              <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
                <h4 className="font-semibold text-md text-foreground">
                  Support: Ayush
                </h4>
                <a
                  href="tel:+919022887167"
                  className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                >
                  <Phone className="h-4 w-4 mr-2" /> +91 90228 87167
                </a>
              </Card>
            </AnimatedContent>
            <AnimatedContent delay={0.5}>
              <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
                <h4 className="font-semibold text-md text-foreground">
                  Partnerships: Aditi
                </h4>
                <a
                  href="tel:+918010214560"
                  className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"
                >
                  <Phone className="h-4 w-4 mr-2" /> +91 80102 14560
                </a>
              </Card>
            </AnimatedContent>
          </div>
          <AnimatedContent
            delay={0.6}
            className="flex justify-center space-x-6"
          >
            <Link
              href="#"
              aria-label="Facebook"
              className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"
            >
              <Facebook size={28} />
            </Link>
            <Link
              href="#"
              aria-label="Instagram"
              className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"
            >
              <Instagram size={28} />
            </Link>
            <Link
              href="#"
              aria-label="Twitter"
              className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"
            >
              <Twitter size={28} />
            </Link>
          </AnimatedContent>
        </div>
      </section>
    </div>
  );
}
