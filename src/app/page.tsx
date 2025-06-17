
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Atom, CheckCircle, Users, Cpu, Bot, Puzzle, Award, Brain, MessageSquare, TrendingUp, ShieldCheck, BookOpen, Users2, Phone, Mail, Instagram, Facebook, Twitter, ArrowDown } from 'lucide-react';
import { subEventsData } from '@/data/subEvents';

const superpowerCategories = [
  {
    name: 'The Thinker',
    icon: <MessageSquare className="h-10 w-10 text-primary mb-3" />,
    description: 'Excel in debating, global affairs, and public speaking? Born diplomat!',
    events: subEventsData.filter(event => event.superpowerCategory === 'The Thinker').map(e => ({ title: e.title, slug: e.slug })),
    dataAiHint: 'thought bubble idea',
  },
  {
    name: 'The Brainiac',
    icon: <Brain className="h-10 w-10 text-primary mb-3" />,
    description: 'Obsessed with facts, quizzes, and science puzzles? You see the patterns others miss.',
    events: subEventsData.filter(event => event.superpowerCategory === 'The Brainiac').map(e => ({ title: e.title, slug: e.slug })),
    dataAiHint: 'glowing brain network',
  },
  {
    name: 'The Strategist',
    icon: <Puzzle className="h-10 w-10 text-primary mb-3" />,
    description: 'Enjoy solving math riddles and cracking logic games? Master of numbers and patterns.',
    events: subEventsData.filter(event => event.superpowerCategory === 'The Strategist').map(e => ({ title: e.title, slug: e.slug })),
    dataAiHint: 'chess strategy board',
  },
  {
    name: 'The Innovator',
    icon: <Bot className="h-10 w-10 text-primary mb-3" />,
    description: 'Love to design, build, and bring new ideas to life? Future tech pioneer!',
    events: subEventsData.filter(event => event.superpowerCategory === 'The Innovator').map(e => ({ title: e.title, slug: e.slug })),
    dataAiHint: 'robot gears innovation',
  },
];

const perks = [
  {
    icon: <ShieldCheck className="h-8 w-8 text-accent" />,
    title: 'Safe Campus Environment',
    description: 'Ensuring a secure and supportive atmosphere for all participants.',
  },
  {
    icon: <BookOpen className="h-8 w-8 text-accent" />,
    title: 'Real Learning Beyond Textbooks',
    description: 'Practical application of knowledge and development of critical skills.',
  },
  {
    icon: <Users2 className="h-8 w-8 text-accent" />,
    title: 'Organized Supervision & Verified Volunteers',
    description: 'Dedicated team to guide and assist students throughout the event.',
  },
];

export default function JuniorScientistHomePage() {
  return (
    <div className="flex flex-col items-center text-foreground animate-fade-in-up">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 text-center bg-background relative overflow-hidden">
        <div className="absolute inset-0 opacity-5 dark:opacity-[0.03]">
           {/* Decorative background, could be an abstract science pattern or subtle gradient lines */}
           <Image src="https://placehold.co/1920x1080.png" alt="Abstract background" layout="fill" objectFit="cover" data-ai-hint="science pattern dark" />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Atom className="h-16 w-16 md:h-24 md:w-24 text-primary mx-auto mb-6 animate-pulse" />
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-4 text-primary uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            JUNIOR SCIENTIST
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-8 max-w-3xl mx-auto">
            Central India's Largest School Students Event
          </p>
          <p className="text-lg md:text-xl text-foreground/70 mb-10 max-w-2xl mx-auto">
            "Explore science, strategy, and creativity – all in one place!"
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-lg transition-transform hover:scale-105 px-10 py-6 text-lg">
              <Link href="/signup">Register / Login</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground animate-bounce">
            <ArrowDown className="inline-block h-4 w-4 mr-1" /> Scroll down to know more
          </p>
        </div>
      </section>

      {/* What's Your Superpower? Section */}
      <section className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">WHAT'S YOUR SUPERPOWER?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {superpowerCategories.map((category) => (
              <Card key={category.name} className="bg-card/80 backdrop-blur-sm shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col text-center p-6 rounded-xl border border-border/50 hover:border-primary/50">
                <CardHeader className="items-center p-0 mb-4">
                  {category.icon}
                  <CardTitle className="text-2xl text-primary">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-0 mb-4">
                  <p className="text-muted-foreground">{category.description}</p>
                </CardContent>
                <CardDescription className="text-sm text-foreground/70">
                  Try:
                  <ul className="mt-2 space-y-1">
                  {category.events.map(event => (
                    <li key={event.slug}>
                      <Button variant="link" asChild className="text-accent hover:text-accent/80 p-0 h-auto">
                        <Link href={`/events/${event.slug}`}>{event.title}</Link>
                      </Button>
                    </li>
                  ))}
                  </ul>
                </CardDescription>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="w-full py-16 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <Users className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary">50+</p>
              <p className="text-muted-foreground">Schools</p>
            </div>
            <div className="p-6">
              <Award className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary">1 Lakh+</p>
              <p className="text-muted-foreground">Prize Pool</p>
            </div>
            <div className="p-6">
              <TrendingUp className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary">15k+</p>
              <p className="text-muted-foreground">Footfall</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6 Unique Events Section */}
      <section className="w-full py-16 md:py-24 bg-muted/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">6 UNIQUE EVENTS</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Dive into a variety of challenges designed to spark curiosity and innovation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subEventsData.map((event) => (
              <Link href={`/events/${event.slug}`} key={event.id} className="block group">
                <Card className="overflow-hidden shadow-lg hover:shadow-xl transition-shadow duration-300 h-full bg-card/80 backdrop-blur-sm border border-border/50 hover:border-primary/50 rounded-xl">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.mainImage.src}
                      alt={event.mainImage.alt}
                      layout="fill"
                      objectFit="cover"
                      data-ai-hint={event.mainImage.dataAiHint}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-xl group-hover:text-primary transition-colors">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground line-clamp-2">{event.shortDescription}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
           <Button asChild className="mt-12 bg-accent hover:bg-accent/90 text-accent-foreground px-8 py-3 text-md">
              <Link href="/events">View All Sub-Events</Link>
            </Button>
        </div>
      </section>

      {/* Quote Section */}
      <section className="w-full py-16 md:py-20 bg-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <MessageSquare className="h-12 w-12 text-accent-foreground mx-auto mb-4 opacity-70" />
          <p className="text-2xl md:text-3xl font-semibold italic max-w-3xl mx-auto">
            "We don't just prepare students to win prizes – we prepare them to take charge of the future."
          </p>
           <p className="text-lg text-accent-foreground/80 mt-4">- The Junior Scientist Team</p>
        </div>
      </section>
      
      {/* Perks Section */}
      <section className="w-full py-16 md:py-24 bg-background">
        <div className="container mx-auto px-4">
           <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">EVENT PERKS</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {perks.map((perk) => (
              <Card key={perk.title} className="bg-card/70 backdrop-blur-sm shadow-lg p-6 text-center rounded-xl border border-border/50">
                {perk.icon}
                <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground">{perk.title}</h3>
                <p className="text-muted-foreground">{perk.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact-us" className="w-full py-16 md:py-24 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-8">Contact Us</h2>
          <p className="text-lg text-muted-foreground mb-6">Have questions or want to get involved? Reach out to us!</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-6 mb-8">
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground" asChild>
              <a href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK" target="_blank" rel="noopener noreferrer">
                <Users className="mr-2 h-5 w-5" /> Join our WhatsApp Group
              </a>
            </Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-10">
            <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50 rounded-lg">
              <h4 className="font-semibold text-lg text-foreground">Ayush</h4>
              <a href="tel:+919022887167" className="flex items-center justify-center text-muted-foreground hover:text-accent">
                <Phone className="h-4 w-4 mr-2" /> 9022887167
              </a>
            </Card>
            <Card className="p-4 bg-card/80 backdrop-blur-sm border-border/50 rounded-lg">
              <h4 className="font-semibold text-lg text-foreground">Aditi</h4>
              <a href="tel:+918010214560" className="flex items-center justify-center text-muted-foreground hover:text-accent">
                <Phone className="h-4 w-4 mr-2" /> 8010214560
              </a>
            </Card>
          </div>
          <div className="flex justify-center space-x-6">
            <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary"><Facebook size={28} /></Link>
            <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary"><Instagram size={28} /></Link>
            <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary"><Twitter size={28} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
