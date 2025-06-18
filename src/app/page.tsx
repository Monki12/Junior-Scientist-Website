
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'; // Added CardFooter
import { Atom, CheckCircle, Users, Cpu, Bot, Puzzle, Award, Brain, MessageSquare, TrendingUp, ShieldCheck, BookOpen, Users2, Phone, Mail, Instagram, Facebook, Twitter, ArrowDown, Sparkles, Zap, Trophy } from 'lucide-react'; // Added more icons
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

// Homepage uses the new EventFlow theme
export default function EventFlowHomePage() {
  return (
    <div className="flex flex-col items-center text-foreground animate-fade-in-up space-y-16 md:space-y-24"> {/* Added space between sections */}
      {/* Hero Section */}
      <section className="w-full py-16 md:py-28 text-center relative overflow-hidden mt-[-2rem]"> {/* Adjusted padding and negative margin */}
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.03]">
           <Image src="https://placehold.co/1920x1080.png" alt="Abstract background pattern" fill style={{ objectFit: 'cover' }} data-ai-hint="abstract geometric light" priority />
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <Atom className="h-16 w-16 md:h-20 md:w-20 text-primary mx-auto mb-6 animate-bounce" /> {/* Changed animation */}
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight mb-4 text-primary uppercase" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            EventFlow
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-6 max-w-3xl mx-auto">
            Your Gateway to Exciting Student Events
          </p>
          <p className="text-md md:text-lg text-foreground/70 mb-10 max-w-2xl mx-auto">
            "Discover, register, and manage your event participation seamlessly. Let the journey begin!"
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-12">
            <Button size="lg" asChild className="bg-accent hover:bg-accent/90 text-accent-foreground shadow-soft transition-transform hover:scale-105 px-10 py-3 text-lg rounded-lg">
              <Link href="/signup">Get Started</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-primary border-primary/50 hover:bg-primary/5 hover:border-primary shadow-soft transition-transform hover:scale-105 px-10 py-3 text-lg rounded-lg">
              <Link href="/events">Explore Events</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground flex items-center justify-center">
            <ArrowDown className="inline-block h-4 w-4 mr-1 animate-bounce" /> Scroll down to learn more
          </p>
        </div>
      </section>

      {/* What's Your Superpower? Section / Categories */}
      <section id="categories" className="w-full py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <Sparkles className="h-10 w-10 text-accent mx-auto mb-2" />
            <h2 className="text-3xl md:text-4xl font-bold text-primary">Discover Your Niche</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-xl mx-auto">Find events tailored to your interests and talents.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {superpowerCategories.map((category) => (
              <Card key={category.name} className="bg-card shadow-soft hover:shadow-md-soft transition-all duration-300 flex flex-col text-center p-6 rounded-xl border border-border/30 hover:border-primary/50">
                <CardHeader className="items-center p-0 mb-4">
                  {category.icon}
                  <CardTitle className="text-xl text-primary">{category.name}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow p-0 mb-4">
                  <p className="text-muted-foreground text-sm">{category.description}</p>
                </CardContent>
                <CardFooter className="flex-col items-center p-0">
                  <p className="text-xs text-muted-foreground/80 mb-2">Related Events:</p>
                  <ul className="space-y-1">
                  {category.events.slice(0,2).map(event => ( // Show max 2 events
                    <li key={event.slug}>
                      <Button variant="link" asChild className="text-accent hover:text-accent/80 p-0 h-auto text-sm">
                        <Link href={`/events/${event.slug}`}>{event.title}</Link>
                      </Button>
                    </li>
                  ))}
                  </ul>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Stats Section */}
      <section className="w-full py-12 md:py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="p-6">
              <Users className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary">50+</p>
              <p className="text-muted-foreground">Partner Schools</p>
            </div>
            <div className="p-6">
              <Trophy className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary">₹1 Lakh+</p>
              <p className="text-muted-foreground">Worth of Prizes</p>
            </div>
            <div className="p-6">
              <TrendingUp className="h-12 w-12 text-accent mx-auto mb-3" />
              <p className="text-4xl font-bold text-primary">15k+</p>
              <p className="text-muted-foreground">Expected Participants</p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section id="featured-events" className="w-full py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4 text-center">
          <Zap className="h-10 w-10 text-accent mx-auto mb-2" />
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-primary">Featured Events</h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Explore a variety of challenges designed to spark curiosity and innovation.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subEventsData.slice(0, 3).map((event) => ( // Show first 3 events
              <Link href={`/events/${event.slug}`} key={event.id} className="block group">
                <Card className="overflow-hidden shadow-soft hover:shadow-md-soft transition-shadow duration-300 h-full bg-card border border-border/30 hover:border-primary/50 rounded-xl">
                  <div className="relative w-full h-48">
                    <Image
                      src={event.mainImage.src}
                      alt={event.mainImage.alt}
                      fill
                      style={{ objectFit: 'cover' }}
                      data-ai-hint={event.mainImage.dataAiHint}
                      className="group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <CardHeader className="p-4">
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{event.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-0">
                    <p className="text-sm text-muted-foreground line-clamp-2">{event.shortDescription}</p>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
           <Button asChild className="mt-12 bg-accent hover:bg-accent/80 text-accent-foreground px-8 py-3 text-md rounded-lg shadow-soft">
              <Link href="/events">View All Events</Link>
            </Button>
        </div>
      </section>

      {/* Quote Section */}
      <section className="w-full py-12 md:py-16 bg-primary/80 text-primary-foreground">
        <div className="container mx-auto px-4 text-center">
          <MessageSquare className="h-10 w-10 text-accent-foreground mx-auto mb-4 opacity-70" />
          <p className="text-xl md:text-2xl font-semibold italic max-w-3xl mx-auto">
            "We empower students to explore their potential and shape the future through engaging events."
          </p>
           <p className="text-md text-accent-foreground/80 mt-3">- The EventFlow Team</p>
        </div>
      </section>
      
      {/* Perks Section */}
      <section className="w-full py-12 md:py-20 bg-background">
        <div className="container mx-auto px-4">
           <h2 className="text-3xl md:text-4xl font-bold text-center mb-12 text-primary">Why Choose EventFlow?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {perks.map((perk) => (
              <Card key={perk.title} className="bg-card shadow-soft p-6 text-center rounded-xl border border-border/30">
                {perk.icon}
                <h3 className="text-lg font-semibold mt-4 mb-2 text-foreground">{perk.title}</h3>
                <p className="text-sm text-muted-foreground">{perk.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Us Section */}
      <section id="contact-us" className="w-full py-12 md:py-20 bg-muted/30 scroll-mt-20">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-primary mb-6">Get in Touch</h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">Have questions or want to partner with us? We'd love to hear from you!</p>
          <div className="flex flex-col md:flex-row justify-center items-center gap-x-6 gap-y-4 mb-8">
             <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground rounded-lg shadow-sm" asChild>
              <a href="mailto:contact@eventflow.com">
                <Mail className="mr-2 h-5 w-5" /> Email Us
              </a>
            </Button>
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent/10 hover:text-accent-foreground rounded-lg shadow-sm" asChild>
              <a href="https://chat.whatsapp.com/YOUR_GROUP_INVITE_LINK" target="_blank" rel="noopener noreferrer">
                <Users className="mr-2 h-5 w-5" /> Join WhatsApp Group
              </a>
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-xl mx-auto mb-10">
            <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
              <h4 className="font-semibold text-md text-foreground">Support: Ayush</h4>
              <a href="tel:+919022887167" className="flex items-center justify-center text-sm text-muted-foreground hover:text-accent">
                <Phone className="h-4 w-4 mr-2" /> +91 90228 87167
              </a>
            </Card>
            <Card className="p-4 bg-card shadow-soft border-border/30 rounded-lg">
              <h4 className="font-semibold text-md text-foreground">Partnerships: Aditi</h4>
              <a href="tel:+918010214560" className="flex items-center justify-center text-sm text-muted-foreground hover:text-accent">
                <Phone className="h-4 w-4 mr-2" /> +91 80102 14560
              </a>
            </Card>
          </div>
          <div className="flex justify-center space-x-6">
            <Link href="#" aria-label="Facebook" className="text-muted-foreground hover:text-primary transition-colors"><Facebook size={24} /></Link>
            <Link href="#" aria-label="Instagram" className="text-muted-foreground hover:text-primary transition-colors"><Instagram size={24} /></Link>
            <Link href="#" aria-label="Twitter" className="text-muted-foreground hover:text-primary transition-colors"><Twitter size={24} /></Link>
          </div>
        </div>
      </section>
    </div>
  );
}
