
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
  
  const isDashboardPage = mounted && (pathname.startsWith('/dashboard') || 
      pathname.startsWith('/staff') || 
      pathname.startsWith('/leaderboard') || 
      pathname.startsWith('/my-events') || 
      pathname.startsWith('/my-registrations') || 
      pathname.startsWith('/ocr-tool') || 
      pathname.startsWith('/profile') || 
      pathname.startsWith('/students') || 
      pathname.startsWith('/tasks'));

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

  const NavLinkItem: React.FC<{ href: string; label: string; Icon?: React.ElementType, className?: string }> = ({ href, label, Icon, className: extraClass }) => (
    <Link
      href={href}
      onClick={(e) => handleLinkClick(href, e)}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-base font-medium transition-all hover:text-primary hover:scale-105", 
        (pathname === href || (pathname + (typeof window !== 'undefined' ? window.location.hash : '')) === href ) ? "text-primary" : "text-muted-foreground",
        extraClass
      )}
    >
      {Icon && <Icon className="h-5 w-5" />}
      {label}
    </Link>
  );

  if (isDashboardPage) {
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
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container flex h-16 items-center">
        <Link href="/" className="flex items-center mr-6" aria-label="Junior Scientist Home">
          <Logo className="h-12 w-8" />
        </Link>
        
        <nav className="hidden lg:flex items-center space-x-1">
            {publicNavLinks.map(link => (
                <NavLinkItem key={link.href} href={link.href} label={link.label} />
            ))}
        </nav>
        
        <div className="ml-auto flex items-center gap-2">
          <LightBulbToggle />
          
          <div className="hidden lg:flex items-center gap-2">
             {loading ? (
               <div className="h-9 w-9 animate-pulse rounded-full bg-muted"></div>
             ) : authUser ? (
                <Button asChild>
                    <Link href="/dashboard"><LayoutDashboard className="mr-2"/> Dashboard</Link>
                </Button>
             ) : (
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild>
                    <Link href="/signup">Sign Up</Link>
                  </Button>
                </>
             )}
          </div>
          
          <div className="lg:hidden">
            <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="h-9 w-9">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] p-0 flex flex-col bg-card">
                  <SheetHeader className="border-b p-4">
                    <Link href="/" className="flex items-center" aria-label="Junior Scientist Home" onClick={() => setIsMobileMenuOpen(false)}>
                      <Logo className="h-12 w-8" />
                      <span className="font-bold ml-2">Junior Scientist</span>
                    </Link>
                  </SheetHeader>
                  <nav className="flex-grow space-y-1 p-4 overflow-y-auto">
                    {publicNavLinks.map(link => (
                      <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} className="text-lg"/>
                    ))}
                  </nav>
                  <div className="border-t p-4 mt-auto">
                    {authUser ? (
                      <Button asChild className="w-full" onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/dashboard"><LayoutDashboard className="mr-2"/> Dashboard</Link>
                      </Button>
                    ) : !loading && (
                      <div className="space-y-2">
                        <Button variant="outline" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/login"><LogIn className="mr-2"/>Log In</Link>
                        </Button>
                        <Button className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                          <Link href="/signup"><UserPlus className="mr-2"/>Sign Up</Link>
                        </Button>
                      </div>
                    )}
                  </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
