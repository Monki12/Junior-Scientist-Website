

'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useAuth } from '@/hooks/use-auth';
import { LightBulbToggle } from '@/components/layout/light-bulb-toggle';
import { 
  Menu, Home, Search, Phone, UserPlus, LogIn, LayoutDashboard
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/layout/logo';

const publicNavLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Browse Events', icon: Search },
  { href: '/#contact-us', label: 'Contact', icon: Phone },
];

export default function MainNav() {
  const { authUser, loading } = useAuth();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLinkClick = (href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (href.includes('#')) {
      const [path, anchor] = href.split('#');
      const targetPath = path || '/'; 
      if (pathname === targetPath || (targetPath === '/' && pathname === '/')) {
        e?.preventDefault();
        const targetElement = document.getElementById(anchor);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      }
    }
    setIsMobileMenuOpen(false);
  };

  const NavLinkItem: React.FC<{ href: string; label: string; Icon: React.ElementType }> = ({ href, label, Icon }) => (
    <Link
      href={href}
      onClick={(e) => handleLinkClick(href, e)}
      className={cn(
        "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary", 
        (pathname === href || (pathname + (typeof window !== 'undefined' ? window.location.hash : '')) === href ) ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/80",
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );

  // Don't render the main nav on dashboard pages, as the new layout takes over
  if (pathname.startsWith('/(dashboard)') || pathname.startsWith('/dashboard') || pathname.startsWith('/staff') || pathname.startsWith('/leaderboard')) {
      return null;
  }
  
  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-primary">
            <div className="h-8 w-12 animate-pulse rounded-md bg-muted"></div>
            <span className="w-32 h-6 bg-muted rounded animate-pulse"></span>
          </div>
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center" aria-label="Junior Scientist Home">
          <Logo className="h-12 w-8" />
        </Link>
        
        <div className="ml-auto flex items-center gap-2">
          <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {publicNavLinks.map(link => (
                <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} />
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2">
             <LightBulbToggle />
             {loading ? (
               <div className="h-9 w-9 animate-pulse rounded-full bg-muted"></div>
             ) : authUser ? (
                <Button asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2"/> Go to Dashboard</Link>
                </Button>
             ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login"><LogIn className="mr-2"/>Log In</Link>
                  </Button>
                  <Button asChild className="bg-accent hover:bg-accent/80 text-accent-foreground">
                    <Link href="/signup"><UserPlus className="mr-2"/>Sign Up</Link>
                  </Button>
                </>
             )}
          </div>
          
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon" className="h-9 w-9">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-card">
                <SheetHeader className="border-b p-4 flex flex-row justify-between items-center">
                  <Link href="/" className="flex items-center" aria-label="Junior Scientist Home" onClick={() => setIsMobileMenuOpen(false)}>
                    <Logo className="h-12 w-8" />
                  </Link>
                  <LightBulbToggle />
                </SheetHeader>
                <nav className="flex-grow space-y-1 p-4 overflow-y-auto">
                  {publicNavLinks.map(link => (
                     <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} />
                  ))}
                </nav>
                <div className="border-t p-4 mt-auto">
                  {authUser ? (
                     <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/dashboard"><LayoutDashboard className="mr-2"/> Go to Dashboard</Link>
                    </Button>
                  ) : !loading && (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/login"><LogIn className="mr-2"/>Log In</Link>
                      </Button>
                      <Button className="w-full bg-accent hover:bg-accent/80 text-accent-foreground" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/signup"><UserPlus className="mr-2"/>Sign Up</Link>
                      </Button>
                    </div>
                  )}
                </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
