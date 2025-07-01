
'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShieldCheck, BookOpen, Users2, Phone, Mail, Instagram, Facebook, Twitter, Sparkles, Zap, Trophy, MessageSquare, Brain, Puzzle, Bot, Info, Loader2, Lightbulb, Rocket } from 'lucide-react';
import { useEffect, useState, useRef } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { SubEvent } from '@/types';
import { motion, useInView, animate } from 'framer-motion';
import TiltedCard from '@/components/ui/TiltedCard';

interface Superpower {
    id: number;
    icon: React.ReactNode;
    title: string;
    description: string;
    mainImage: string;
    events: { title: string; slug: string }[];
}

const baseSuperpowerCategories: Omit<Superpower, 'events'>[] = [
  {
    id: 1,
    icon: <MessageSquare className="h-8 w-8" />,
    title: 'The Thinker',
    description: 'Excel in debating, global affairs, and public speaking? Born diplomat!',
    mainImage: 'https://placehold.co/300x150.png',
  },
  {
    id: 2,
    icon: <Brain className="h-8 w-8" />,
    title: 'The Brainiac',
    description: 'Obsessed with facts, quizzes, and science puzzles? You see the patterns others miss.',
    mainImage: 'https://placehold.co/300x150.png',
  },
  {
    id: 3,
    icon: <Puzzle className="h-8 w-8" />,
    title: 'The Strategist',
    description: 'Enjoy solving math riddles and cracking logic games? Master of numbers and patterns.',
    mainImage: 'https://placehold.co/300x150.png',
  },
  {
    id: 4,
    icon: <Bot className="h-8 w-8" />,
    title: 'The Innovator',
    description: 'Love to design, build, and bring new ideas to life? Future tech pioneer!',
    mainImage: 'https://placehold.co/300x150.png',
  },
];

const perks = [
  {
    icon: <ShieldCheck className="h-10 w-10 text-accent" />,
    title: 'Safe Campus Environment',
    description: 'Ensuring a secure and supportive atmosphere for all participants.',
  },
  {
    icon: <BookOpen className="h-10 w-10 text-accent" />,
    title: 'Real Learning Beyond Textbooks',
    description: 'Practical application of knowledge and development of critical skills.',
  },
  {
    icon: <Users2 className="h-10 w-10 text-accent" />,
    title: 'Organized Supervision & Verified Volunteers',
    description: 'Dedicated team to guide and assist students throughout the event.',
  },
];

function AnimatedNumber({ to, suffix = '', prefix = '' }: { to: number, suffix?: string, prefix?: string }) {
    const ref = useRef<HTMLParagraphElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    useEffect(() => {
        if (isInView && ref.current) {
            animate(0, to, {
                duration: 2,
                onUpdate(value) {
                    if (ref.current) {
                        ref.current.textContent = prefix + Math.floor(value).toLocaleString() + suffix;
                    }
                },
            });
        }
    }, [isInView, to, suffix, prefix]);

    return <p ref={ref} className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary" style={{ filter: 'drop-shadow(0 0 10px hsl(var(--primary) / 0.5))' }} >{prefix}0{suffix}</p>;
}


// Helper component for animated content reveals on scroll
const AnimatedContent = ({ children, direction = 'up', className }: { children: React.ReactNode, direction?: 'up' | 'left' | 'right', className?: string }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

  const variants = {
    hidden: { 
      opacity: 0, 
      x: direction === 'left' ? -100 : direction === 'right' ? 100 : 0,
      y: direction === 'up' ? 50 : 0,
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
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};


export default function PageContent() {
    const [events, setEvents] = useState<SubEvent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvents = async () => {
            setLoading(true);
            try {
                const eventsCollection = collection(db, 'subEvents');
                const eventSnapshot = await getDocs(query(eventsCollection, limit(10)));
                const eventsList = eventSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SubEvent));
                setEvents(eventsList);
            } catch (error) {
                console.error("Error fetching events for landing page:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvents();
    }, []);

    const superpowers: Superpower[] = baseSuperpowerCategories.map(category => ({
        ...category,
        events: events
            .filter(event => event.superpowerCategory === category.title)
            .map(e => ({ title: e.title, slug: e.slug })),
    }));


    const sectionVariants = {
        hidden: { opacity: 0, y: 50 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };
    
    const galleryImages = [
        { src: 'https://placehold.co/600x400.png', alt: 'Robotics Challenge 2024', dataAiHint: 'robotics competition' },
        { src: 'https://placehold.co/600x400.png', alt: 'Science Fair Project', dataAiHint: 'science fair project' },
        { src: 'https://placehold.co/600x400.png', alt: 'Students Coding', dataAiHint: 'students coding' },
        { src: 'https://placehold.co/600x400.png', alt: 'Debate Championship', dataAiHint: 'public speaking' },
        { src: 'https://placehold.co/600x400.png', alt: 'Mathamaze Finals', dataAiHint: 'mathematics puzzle' },
    ];


    return (
        <div className="space-y-24 md:space-y-32 bg-background z-10 relative w-full overflow-x-hidden">
            
            <section id="about-us" className="w-full py-12 md:py-20 scroll-mt-20">
                <div className="container mx-auto px-4">
                    <AnimatedContent direction="up">
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">
                            About Junior Scientist
                        </h2>
                    </AnimatedContent>
                    
                    <div className="space-y-16 md:space-y-24">
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <AnimatedContent direction="left" className="space-y-4 text-lg text-muted-foreground">
                                <p>At Junior Scientist, we are passionate about fostering curiosity and innovation in young minds.</p>
                            </AnimatedContent>
                            <AnimatedContent direction="right">
                                <div className="relative aspect-video rounded-xl shadow-2xl shadow-primary/20">
                                    <Image
                                        src="https://i.ibb.co/C07F81B/collaboration.jpg"
                                        alt="Students collaborating on a science project"
                                        data-ai-hint="students collaborating"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="rounded-xl"
                                    />
                                </div>
                            </AnimatedContent>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <AnimatedContent direction="right" className="space-y-4 text-lg text-muted-foreground order-1 md:order-2">
                                <p>Our mission is to provide an engaging platform where students can explore scientific principles, critical thinking, and problem-solving through hands-on experiences and competitive events. We believe in nurturing the next generation of innovators and leaders by creating an environment that is not only challenging but also supportive and fun.</p>
                            </AnimatedContent>
                             <AnimatedContent direction="left" className="order-2 md:order-1">
                                <div className="relative aspect-video rounded-xl shadow-2xl shadow-primary/20">
                                    <Image
                                        src="https://i.ibb.co/q1zR2x9/abstract-tech.jpg"
                                        alt="Abstract technology visualization"
                                        data-ai-hint="abstract technology"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="rounded-xl"
                                    />
                                </div>
                            </AnimatedContent>
                        </div>
                        
                        <div className="text-center">
                            <AnimatedContent direction="up" className="space-y-4 text-lg text-muted-foreground max-w-3xl mx-auto">
                                 <p>Join us in fostering the bright minds of tomorrow, where every experiment is a step towards discovery.</p>
                            </AnimatedContent>
                        </div>
                    </div>
                </div>
            </section>
            
            <motion.section id="stats" className="w-full py-12 md:py-20 bg-card/50" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={sectionVariants}>
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="p-6">
                            <Users2 className="h-12 w-12 text-accent mx-auto mb-4" />
                            <AnimatedNumber to={50} suffix="+" />
                            <p className="text-muted-foreground mt-2">Partner Schools</p>
                        </div>
                        <div className="p-6">
                            <Trophy className="h-12 w-12 text-accent mx-auto mb-4" />
                            <AnimatedNumber to={100000} prefix="₹" suffix="+" />
                            <p className="text-muted-foreground mt-2">Worth of Prizes</p>
                        </div>
                        <div className="p-6">
                            <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
                            <AnimatedNumber to={15000} suffix="+" />
                            <p className="text-muted-foreground mt-2">Expected Participants</p>
                        </div>
                    </div>
                </div>
            </motion.section>

            <motion.section id="why-choose-us" className="w-full py-12 md:py-20 bg-background" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}>
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Why Choose Junior Scientist?</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {perks.map((perk, i) => (
                            <motion.div key={perk.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: i * 0.1 }} viewport={{ once: true }}>
                                <Card className="bg-card shadow-soft hover:shadow-primary/20 transition-all duration-300 p-8 text-center rounded-xl border border-border/30 hover:border-primary/50 hover:-translate-y-2 h-full">
                                    {perk.icon}
                                    <h3 className="text-xl font-bold mt-4 mb-2 text-foreground">{perk.title}</h3>
                                    <p className="text-base text-muted-foreground">{perk.description}</p>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </motion.section>

             <motion.section id="find-your-path" className="w-full py-12 md:py-20 bg-card/50" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}>
                <div className="container mx-auto px-4">
                    <h2 className="text-center font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>What's Your Superpower?</h2>
                    <p className="text-lg text-muted-foreground text-center mt-2 max-w-xl mx-auto mb-16">Discover events tailored to your unique interests and unlock your true potential.</p>
                    {loading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                    ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center">
                        {superpowers.map((superpower, i) => (
                            <TiltedCard
                                key={superpower.id}
                                superpowerImage={superpower.mainImage}
                                superpowerIcon={superpower.icon}
                                superpowerTitle={superpower.title}
                                superpowerDescription={superpower.description}
                                backContent={
                                <ul>
                                    {superpower.events.length > 0 ? (
                                    superpower.events.map((event, index) => (
                                        <li key={index}>
                                        <Link href={`/events/${event.slug}`}>{event.title}</Link>
                                        </li>
                                    ))
                                    ) : (
                                    <li>No events yet</li>
                                    )}
                                </ul>
                                }
                            />
                        ))}
                    </div>
                    )}
                </div>
            </motion.section>

             <motion.section id="gallery" className="w-full py-12 md:py-20" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} variants={sectionVariants}>
                <div className="container mx-auto px-4">
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Moments of Brilliance</h2>
                    <div className="flex overflow-x-auto space-x-6 pb-4">
                       {galleryImages.map((image, index) => (
                         <motion.div key={index} className="flex-shrink-0 w-80 md:w-96 rounded-xl overflow-hidden shadow-lg hover:shadow-primary/40 transition-shadow duration-300 group"
                            initial={{ opacity: 0, x: 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.5, delay: index * 0.1 }}
                            viewport={{ once: true }}
                         >
                            <div className="relative h-64">
                                <Image src={image.src} alt={image.alt} fill style={{ objectFit: 'cover' }} data-ai-hint={image.dataAiHint} className="group-hover:scale-105 transition-transform duration-300" />
                                <div className="absolute inset-0 bg-black/30"></div>
                                <div className="absolute bottom-4 left-4 text-white">
                                    <p className="font-bold text-lg">{image.alt}</p>
                                </div>
                            </div>
                         </motion.div>
                       ))}
                    </div>
                </div>
            </motion.section>
            
            <motion.section className="w-full py-20 md:py-24" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.5 }} variants={sectionVariants}>
                <div className="container mx-auto px-4 text-center">
                    <MessageSquare className="h-12 w-12 text-primary mx-auto mb-6 opacity-70" />
                    <p className="text-2xl md:text-3xl font-medium italic max-w-4xl mx-auto text-foreground">
                        "We empower students to explore their potential and shape the future through engaging events."
                    </p>
                    <p className="text-lg text-muted-foreground mt-4">- The Junior Scientist Team</p>
                </div>
            </motion.section>

            <motion.section id="contact-us" className="w-full py-12 md:py-20 bg-card/50 scroll-mt-20" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={sectionVariants}>
                <div className="container mx-auto px-4 text-center">
                    <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Get in Touch</h2>
                    <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">Have questions or want to partner with us? We'd love to hear from you!</p>
                    <div className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
                        <Button size="lg" variant="outline" asChild><a href="mailto:contact@juniorscientist.events"><Mail className="mr-2 h-5 w-5" /> Email Us</a></Button>
                        <Button size="lg" variant="outline" asChild><a href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK" target="_blank" rel="noopener noreferrer"><Users2 className="mr-2 h-5 w-5" /> Join WhatsApp Group</a></Button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-10">
                        <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
                            <h4 className="font-semibold text-md text-foreground">Support: Ayush</h4>
                            <a href="tel:+919022887167" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"><Phone className="h-4 w-4 mr-2" /> +91 90228 87167</a>
                        </Card>
                        <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
                            <h4 className="font-semibold text-md text-foreground">Partnerships: Aditi</h4>
                            <a href="tel:+918010214560" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"><Phone className="h-4 w-4 mr-2" /> +91 80102 14560</a>
                        </Card>
                    </div>
                    <div className="flex justify-center space-x-6">
                        <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"><Facebook size={28} /></Link>
                        <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"><Instagram size={28} /></Link>
                        <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"><Twitter size={28} /></Link>
                    </div>
                </div>
            </motion.section>
        </div>
    );
}
