
import { Shield } from 'lucide-react';
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-muted/50 text-muted-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start md:items-center">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <Link href="/" aria-label="Junior Scientist Home">
              <Logo className="h-16 w-11" />
            </Link>
            <p className="text-xs mt-2">Student event registration platform.</p>
            <p className="text-xs">An Initiative by AXIS, VNIT Nagpur.</p>
          </div>

          <div className="text-center text-xs">
            <p>&copy; {new Date().getFullYear()} Junior Scientist. All rights reserved.</p>
            <p className="mt-1">
              Powered by Innovation | Designed for Connection
            </p>
          </div>
          
          <div className="flex flex-col items-center md:items-end text-center md:text-right text-xs space-y-1">
            <p className="font-semibold text-foreground mb-1">Quick Links</p>
            <Link href="/events" className="hover:text-primary transition-colors">Browse Events</Link>
            <Link href="/#contact-us" className="hover:text-primary transition-colors">Contact Us</Link>
            <Link href="/login" className="hover:text-primary transition-colors">Student Login</Link>
            <Link href="/auth/org-login" className="flex items-center gap-1 hover:text-primary transition-colors">
                <Shield className="h-3 w-3" /> Organizational Login
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
