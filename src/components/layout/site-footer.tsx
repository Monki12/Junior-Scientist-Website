
import { Atom } from 'lucide-react';
import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/50 text-muted-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary mb-2 font-headline hover:opacity-90">
              <Atom className="h-6 w-6" />
              EventFlow
            </Link>
            <p className="text-xs">Student event registration platform.</p>
            <p className="text-xs">An Initiative by AXIS, VNIT Nagpur.</p>
          </div>

          <div className="text-center text-xs">
            <p>&copy; {new Date().getFullYear()} EventFlow. All rights reserved.</p>
            <p className="mt-1">
              Powered by Innovation | Designed for Connection
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end text-center md:text-right text-xs">
            <p className="font-semibold text-foreground mb-1">Quick Links</p>
            <Link href="/events" className="hover:text-primary transition-colors">Browse Events</Link>
            <Link href="/#contact-us" className="hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Login</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
