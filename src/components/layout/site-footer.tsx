
import { Atom } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="border-t border-border/40 bg-background/90 text-muted-foreground">
      <div className="container mx-auto px-4 py-8 text-center text-sm">
        <div className="flex justify-center items-center mb-2">
          <Atom className="h-5 w-5 mr-2 text-primary" />
          <span className="font-semibold text-foreground">JUNIOR SCIENTIST</span>
        </div>
        <p className="mb-1">
          An Initiative by AXIS, TechFest of Visvesvaraya National Institute of Technology, Nagpur.
        </p>
        <p>&copy; {new Date().getFullYear()} Junior Scientist. All rights reserved.</p>
        <p className="mt-1">
          Powered by Innovation | Designed for Connection
        </p>
      </div>
    </footer>
  );
}
