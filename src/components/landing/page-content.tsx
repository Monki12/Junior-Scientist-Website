
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
import { motion, useInView, animate, useScroll, useTransform } from 'framer-motion';
import TiltedCard from '@/components/ui/TiltedCard';
import { cn } from '@/lib/utils';

interface AnimatedNumberProps {
  to: number;
  suffix?: string;
  prefix?: string;
}

function AnimatedNumber({ to, suffix = '', prefix = '' }: AnimatedNumberProps) {
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

const AnimatedContent = ({ children, direction = 'up', className, delay = 0 }: { children: React.ReactNode, direction?: 'up' | 'left' | 'right', className?: string, delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });

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
      animate={isInView ? "visible" : "hidden"}
      transition={{ duration: 0.8, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const SectionWrapper = ({ children, className, id }: { children: React.ReactNode, className?: string, id?: string }) => {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, amount: 0.2 });
    
    return (
        <motion.section
            id={id}
            ref={ref}
            className={cn("w-full py-12 md:py-20", className)}
            initial={{ opacity: 0, y: 50 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {children}
        </motion.section>
    )
}

function GallerySection() {
    const galleryRef = useRef(null);
    const { scrollYProgress } = useScroll({
      target: galleryRef,
      offset: ['start end', 'end start'],
    });

    const x = useTransform(scrollYProgress, [0, 1], ['1%', '-95%']);

    const galleryImages = [
        { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Science_fair_project.jpg/1280px-Science_fair_project.jpg', alt: 'Science fair project', dataAiHint: 'science fair' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/7/7b/Girl_uses_a_microscope_at_a_science_camp.jpg/1280px-Girl_uses_a_microscope_at_a_science_camp.jpg', alt: 'Girl uses a microscope', dataAiHint: 'student microscope' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Robot_at_a_STEM_camp.jpg/1280px-Robot_at_a_STEM_camp.jpg', alt: 'Robot at a STEM camp', dataAiHint: 'student robot' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/00/Computer_programming_class_for_kids.jpg/1280px-Computer_programming_class_for_kids.jpg', alt: 'Kids coding class', dataAiHint: 'students coding' },
        { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f6/Students_doing_an_experiment.jpg/1280px-Students_doing_an_experiment.jpg', alt: 'chemistry experiment', },
    ];

    return (
        <section ref={galleryRef} className="gallery-section">
            <AnimatedContent>
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-2 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Moments of Brilliance</h2>
                <p className="text-lg text-muted-foreground text-center mt-2 max-w-xl mx-auto mb-16">Explore our vibrant community in action.</p>
            </AnimatedContent>
            <motion.div style={{ x }} className="gallery-strip">
               {galleryImages.map((image, index) => (
                 <motion.div key={index} className="gallery-item"
                    initial={{ opacity: 0, y: 100 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: index * 0.1, ease: 'easeOut' }}
                    viewport={{ once: true }}
                 >
                    <Image src={image.src} alt={image.alt} fill style={{ objectFit: 'cover' }} data-ai-hint={image.dataAiHint} />
                 </motion.div>
               ))}
            </motion.div>
             <div className="scroll-hint">Scroll to explore more moments</div>
        </section>
    )
}

export default function PageContent() {
    const [events, setEvents] = useState<SubEvent[]>([]);
    const [loading, setLoading] = useState(true);

    const refTitle = useRef(null);
    const inViewTitle = useInView(refTitle, { once: true, amount: 0.5 });
    
    const refPara1 = useRef(null);
    const inViewPara1 = useInView(refPara1, { once: true, amount: 0.6 });
    
    const refImg1 = useRef(null);
    const inViewImg1 = useInView(refImg1, { once: true, amount: 0.7 });

    const refPara2 = useRef(null);
    const inViewPara2 = useInView(refPara2, { once: true, amount: 0.6 });

    const refImg2 = useRef(null);
    const inViewImg2 = useInView(refImg2, { once: true, amount: 0.7 });

    const refPara3 = useRef(null);
    const inViewPara3 = useInView(refPara3, { once: true, amount: 0.6 });

    const quoteRef = useRef(null);
    const inViewQuote = useInView(quoteRef, { once: true, amount: 0.5 });

    const superpowers = [
        {
          id: 1,
          mainImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cf/Teenage_boy_reading.jpg/1200px-Teenage_boy_reading.jpg',
          icon: 'https://img.icons8.com/ios-filled/100/A800FF/speech-bubble--v1.png',
          title: "The Thinker",
          description: "Excel in debating, global affairs, and public speaking? Born diplomat!",
          events: ["Mathamaze", "Model United Nations", "Debate Championship"],
        },
        {
          id: 2,
          mainImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Kids_at_science_fair.jpg/1280px-Kids_at_science_fair.jpg',
          icon: 'https://img.icons8.com/ios-filled/100/A800FF/brain.png',
          title: "The Brainiac",
          description: "Obsessed with facts, quizzes, and science puzzles? You see the patterns others miss.",
          events: ["Ex-Quiz-It", "Science Olympiad", "Code-a-thon"],
        },
        {
          id: 3,
          mainImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/62/Chess_problem.jpg/1280px-Chess_problem.jpg',
          icon: 'https://img.icons8.com/ios-filled/100/A800FF/gears.png',
          title: "The Strategist",
          description: "Enjoy solving math riddles and cracking logic games? Master of numbers and patterns.",
          events: ["Chess Tournament", "Logic Puzzles Challenge"],
        },
        {
          id: 4,
          mainImage: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Kid_with_robot_at_exhibition.jpg/1280px-Kid_with_robot_at_exhibition.jpg',
          icon: 'https://img.icons8.com/ios-filled/100/A800FF/rocket.png',
          title: "The Innovator",
          description: "Love to design, build, and bring new ideas to life? Future tech pioneer!",
          events: ["Robotics Competition", "3D Printing Workshop", "Junior Hackathon"],
        },
      ];

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

    return (
        <div className="space-y-24 md:space-y-32 bg-background z-10 relative w-full overflow-x-hidden">
            
            <SectionWrapper id="about-us" className="scroll-mt-20">
                <div className="container mx-auto px-4">
                    <motion.h2
                        ref={refTitle}
                        className="text-3xl md:text-4xl font-bold text-center mb-16 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary"
                        initial={{ opacity: 0, y: 50 }}
                        animate={inViewTitle ? { opacity: 1, y: 0 } : {}}
                        transition={{ duration: 0.8, type: "spring", stiffness: 100 }}
                    >
                        About Junior Scientist
                    </motion.h2>
                    
                    <div className="space-y-12 md:space-y-16">
                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <motion.div
                                ref={refPara1}
                                initial={{ opacity: 0, x: -100 }}
                                animate={inViewPara1 ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="space-y-4 text-lg text-muted-foreground"
                            >
                                <p>At Junior Scientist, we are passionate about fostering curiosity and innovation in young minds.</p>
                            </motion.div>
                             <motion.div
                                ref={refImg1}
                                initial={{ opacity: 0, x: 100, scale: 0.9 }}
                                animate={inViewImg1 ? { opacity: 1, x: 0, scale: 1 } : {}}
                                transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
                             >
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
                            </motion.div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 md:gap-12 items-center">
                            <motion.div 
                                ref={refPara2}
                                initial={{ opacity: 0, x: 100 }}
                                animate={inViewPara2 ? { opacity: 1, x: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="space-y-4 text-lg text-muted-foreground md:order-2"
                            >
                                <p>Our mission is to provide an engaging platform where students can explore scientific principles, critical thinking, and problem-solving through hands-on experiences and competitive events. We believe in nurturing the next generation of innovators and leaders by creating an environment that is not only challenging but also supportive and fun.</p>
                            </motion.div>
                             <motion.div
                                ref={refImg2}
                                initial={{ opacity: 0, x: -100, scale: 0.9 }}
                                animate={inViewImg2 ? { opacity: 1, x: 0, scale: 1 } : {}}
                                transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
                                className="md:order-1"
                             >
                                <div className="relative aspect-video rounded-xl shadow-2xl shadow-primary/20">
                                     <Image
                                        src="https://i.ibb.co/q1zR2x9/abstract-tech.jpg"
                                        alt="Abstract technology visualization"
                                        data-ai-hint="data visualization"
                                        fill
                                        style={{ objectFit: 'cover' }}
                                        className="rounded-xl"
                                    />
                                </div>
                            </motion.div>
                        </div>
                        
                        <div className="text-center">
                            <motion.div
                                ref={refPara3}
                                initial={{ opacity: 0, y: 50 }}
                                animate={inViewPara3 ? { opacity: 1, y: 0 } : {}}
                                transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                className="space-y-4 text-lg text-muted-foreground max-w-3xl mx-auto"
                            >
                                 <p>Join us in fostering the bright minds of tomorrow, where every experiment is a step towards discovery.</p>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </SectionWrapper>
            
            <SectionWrapper id="stats" className="bg-card/50">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <AnimatedContent delay={0}>
                            <div className="p-6">
                                <Users2 className="h-12 w-12 text-accent mx-auto mb-4" />
                                <AnimatedNumber to={50} suffix="+" />
                                <p className="text-muted-foreground mt-2">Partner Schools</p>
                            </div>
                        </AnimatedContent>
                        <AnimatedContent delay={0.2}>
                            <div className="p-6">
                                <Trophy className="h-12 w-12 text-accent mx-auto mb-4" />
                                <AnimatedNumber to={100000} prefix="₹" suffix="+" />
                                <p className="text-muted-foreground mt-2">Worth of Prizes</p>
                            </div>
                        </AnimatedContent>
                        <AnimatedContent delay={0.4}>
                            <div className="p-6">
                                <Zap className="h-12 w-12 text-accent mx-auto mb-4" />
                                <AnimatedNumber to={15000} suffix="+" />
                                <p className="text-muted-foreground mt-2">Expected Participants</p>
                            </div>
                        </AnimatedContent>
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper id="why-choose-us">
                <div className="container mx-auto px-4">
                    <AnimatedContent>
                        <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Why Choose Junior Scientist?</h2>
                    </AnimatedContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {perks.map((perk, i) => (
                           <AnimatedContent key={perk.title} delay={i * 0.2}>
                                <Card className="bg-card shadow-soft hover:shadow-primary/20 transition-all duration-300 p-8 text-center rounded-xl border border-border/30 hover:border-primary/50 hover:-translate-y-2 h-full">
                                    {perk.icon}
                                    <h3 className="text-xl font-bold mt-4 mb-2 text-foreground">{perk.title}</h3>
                                    <p className="text-base text-muted-foreground">{perk.description}</p>
                                </Card>
                            </AnimatedContent>
                        ))}
                    </div>
                </div>
            </SectionWrapper>

            <SectionWrapper id="superpowers">
                <div className="container mx-auto px-4">
                    <AnimatedContent>
                      <h2 className="text-center font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary" style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)' }}>What's Your Superpower?</h2>
                      <p className="text-lg text-muted-foreground text-center mt-2 max-w-xl mx-auto mb-16">Discover events tailored to your unique interests and unlock your true potential.</p>
                    </AnimatedContent>
                    {loading ? (
                        <div className="flex justify-center items-center h-48"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>
                    ) : (
                    <motion.div 
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 justify-items-center"
                        variants={{
                            visible: { transition: { staggerChildren: 0.15 } }
                        }}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, amount: 0.2 }}
                    >
                        {superpowers.map((superpower, i) => (
                           <motion.div 
                                key={superpower.id}
                                variants={{
                                    hidden: { opacity: 0, y: 50 * (i % 2 === 0 ? 1 : -1) },
                                    visible: { opacity: 1, y: 0 }
                                }}
                                transition={{ duration: 0.8, ease: "easeOut" }}
                            >
                            <TiltedCard
                                superpowerImage={superpower.mainImage}
                                superpowerIcon={superpower.icon}
                                superpowerTitle={superpower.title}
                                superpowerDescription={superpower.description}
                                backContent={
                                <ul>
                                    {events.filter(e => e.superpowerCategory === superpower.title).length > 0 ? (
                                        events.filter(e => e.superpowerCategory === superpower.title).map((event, index) => (
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
                            </motion.div>
                        ))}
                    </motion.div>
                    )}
                </div>
            </SectionWrapper>

            <GallerySection />
            
            <SectionWrapper>
                <div className="container mx-auto px-4 text-center">
                    <motion.div
                        ref={quoteRef}
                        className="quote-container"
                        initial={{ opacity: 0, x: -200 }}
                        animate={inViewQuote ? { opacity: 1, x: 0 } : {}}
                        transition={{ duration: 1.0, ease: "easeOut", type: "spring", stiffness: 80 }}
                      >
                        <motion.div
                          className="quote-icon"
                          initial={{ scale: 0, opacity: 0 }}
                          animate={inViewQuote ? { scale: 1, opacity: 1 } : {}}
                          transition={{ duration: 0.5, delay: 0.5, ease: "easeOut" }}
                        >
                            <MessageSquare className="h-12 w-12 text-primary opacity-70" />
                        </motion.div>
                        <motion.p
                          className="text-2xl md:text-3xl font-medium italic max-w-4xl mx-auto text-foreground"
                          initial={{ opacity: 0 }}
                          animate={inViewQuote ? { opacity: 1 } : {}}
                          transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
                        >
                            "We empower students to explore their potential and shape the future through engaging events."
                        </motion.p>
                        <motion.p
                          className="text-lg text-muted-foreground mt-4"
                          initial={{ opacity: 0 }}
                          animate={inViewQuote ? { opacity: 1 } : {}}
                          transition={{ duration: 1.2, delay: 1.0, ease: "easeOut" }}
                        >
                            - The Junior Scientist Team
                        </motion.p>
                    </motion.div>
                </div>
            </SectionWrapper>

            <SectionWrapper id="contact-us" className="bg-card/50 scroll-mt-20">
                <div className="container mx-auto px-4 text-center">
                    <AnimatedContent>
                        <h2 className="text-3xl md:text-4xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-accent to-primary">Get in Touch</h2>
                        <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">Have questions or want to partner with us? We'd love to hear from you!</p>
                    </AnimatedContent>
                    <AnimatedContent delay={0.2} className="flex flex-col md:flex-row justify-center items-center gap-4 mb-8">
                        <Button size="lg" variant="outline" asChild><a href="mailto:contact@juniorscientist.events"><Mail className="mr-2 h-5 w-5" /> Email Us</a></Button>
                        <Button size="lg" variant="outline" asChild><a href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK" target="_blank" rel="noopener noreferrer"><Users2 className="mr-2 h-5 w-5" /> Join WhatsApp Group</a></Button>
                    </AnimatedContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-10">
                         <AnimatedContent delay={0.4}>
                            <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
                                <h4 className="font-semibold text-md text-foreground">Support: Ayush</h4>
                                <a href="tel:+919022887167" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"><Phone className="h-4 w-4 mr-2" /> +91 90228 87167</a>
                            </Card>
                        </AnimatedContent>
                        <AnimatedContent delay={0.5}>
                            <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
                                <h4 className="font-semibold text-md text-foreground">Partnerships: Aditi</h4>
                                <a href="tel:+918010214560" className="flex items-center justify-center text-sm text-muted-foreground hover:text-primary"><Phone className="h-4 w-4 mr-2" /> +91 80102 14560</a>
                            </Card>
                        </AnimatedContent>
                    </div>
                     <AnimatedContent delay={0.6} className="flex justify-center space-x-6">
                        <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"><Facebook size={28} /></Link>
                        <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"><Instagram size={28} /></Link>
                        <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-transform hover:scale-125"><Twitter size={28} /></Link>
                    </AnimatedContent>
                </div>
            </SectionWrapper>
        </div>
    );
}
