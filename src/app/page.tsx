import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Users, Edit3, BarChart3, ScanText, BellRing, ShieldCheck, ListChecks, Trophy, DatabaseZap } from 'lucide-react';

const features = [
  {
    icon: <Users className="h-8 w-8 text-accent" />,
    title: 'Browse Events',
    description: 'Discover a wide range of events tailored to your interests.',
    link: '/events',
    linkText: 'Explore Events',
    dataAiHint: 'event crowd'
  },
  {
    icon: <Edit3 className="h-8 w-8 text-accent" />,
    title: 'Event Management',
    description: 'Organizers can effortlessly create, edit, and manage event listings.',
    link: '/signup?role=organizer',
    linkText: 'Become an Organizer',
    dataAiHint: 'planning desk'
  },
  {
    icon: <ScanText className="h-8 w-8 text-accent" />,
    title: 'AI-Powered OCR',
    description: 'Scan registration forms and automate data entry with our smart OCR tool.',
    link: '/ocr-tool',
    linkText: 'Try OCR Tool',
    dataAiHint: 'document scan'
  },
  {
    icon: <Trophy className="h-8 w-8 text-accent" />,
    title: 'Gamified Experience',
    description: 'Engage in organizing with points, leaderboards, and credibility scores.',
    link: '#',
    linkText: 'Learn More',
    dataAiHint: 'achievement award'
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center">
      {/* Hero Section */}
      <section className="w-full py-20 md:py-32 bg-gradient-to-br from-primary/10 via-background to-background animate-fade-in">
        <div className="container mx-auto text-center px-4">
          <Zap className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 text-primary">
            EventFlow
          </h1>
          <p className="text-xl md:text-2xl text-foreground/80 mb-10 max-w-3xl mx-auto">
            Your ultimate platform for seamless event management and participation. Discover, organize, and engage like never before.
          </p>
          <div className="flex flex-col sm:flex-row justify-center items-center gap-4">
            <Button size="lg" asChild className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg transition-transform hover:scale-105">
              <Link href="/events">Discover Events</Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-primary text-primary hover:bg-primary/5 shadow-lg transition-transform hover:scale-105">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full py-16 md:py-24">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Why Choose EventFlow?</h2>
          <p className="text-lg text-muted-foreground text-center mb-12 max-w-2xl mx-auto">
            EventFlow offers a comprehensive suite of tools designed to simplify event organization and enhance attendee experiences.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
                <CardHeader className="items-center text-center">
                  {feature.icon}
                  <CardTitle className="mt-4 text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow text-center">
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
                <div className="p-6 pt-0 text-center">
                   <Button variant="link" asChild className="text-accent hover:text-accent/80">
                     <Link href={feature.link}>{feature.linkText}</Link>
                   </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>
      
      {/* Full Feature List Teaser */}
      <section className="w-full py-16 md:py-24 bg-secondary/30">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-8">And So Much More...</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 text-muted-foreground">
            {[
              { icon: BarChart3, label: "Dashboard Analytics" },
              { icon: BellRing, label: "Real-time Notifications" },
              { icon: ShieldCheck, label: "Role-Based Access" },
              { icon: ListChecks, label: "Task Management" },
              { icon: DatabaseZap, label: "Student Data Tools" },
            ].map(item => (
              <div key={item.label} className="flex flex-col items-center p-4 rounded-lg hover:bg-background transition-colors">
                <item.icon className="h-10 w-10 text-primary mb-2" />
                <span className="text-sm">{item.label}</span>
              </div>
            ))}
          </div>
          <p className="mt-10 text-lg">
            Ready to streamline your events? 
            <Link href="/signup" className="font-semibold text-primary hover:underline ml-1">
              Sign up today!
            </Link>
          </p>
        </div>
      </section>

      {/* Placeholder for Images section */}
      <section className="w-full py-16">
        <div className="container mx-auto px-4">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">Experience EventFlow</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
                    <Image src="https://placehold.co/600x400.png" alt="Event collaboration" width={600} height={400} className="w-full h-full object-cover" data-ai-hint="team collaboration" />
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
                    <Image src="https://placehold.co/600x400.png" alt="Student engagement" width={600} height={400} className="w-full h-full object-cover" data-ai-hint="students presentation" />
                </div>
                <div className="aspect-video bg-muted rounded-lg overflow-hidden shadow-lg">
                    <Image src="https://placehold.co/600x400.png" alt="Data analytics dashboard" width={600} height={400} className="w-full h-full object-cover" data-ai-hint="dashboard analytics" />
                </div>
            </div>
        </div>
      </section>
    </div>
  );
}
