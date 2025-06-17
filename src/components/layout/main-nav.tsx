
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { Atom, Menu, LogOut, UserCircle, Home, CalendarDays, Phone, ScanLine, Bell, Briefcase, Settings, BarChart3, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserRole } from '@/types';

const commonLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Events', icon: CalendarDays },
  { href: '/#contact-us', label: 'Contact Us', icon: Phone },
];

const studentLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
];

const organizerLinks = [
  { href: '/dashboard', label: 'Organizer Dashboard', icon: BarChart3 },
  { href: '/organizer/events/manage', label: 'Manage Events', icon: Briefcase},
  { href: '/ocr-tool', label: 'OCR Tool', icon: ScanLine },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
];

const overallHeadLinks = [
  ...organizerLinks,
  { href: '/admin/tasks', label: 'Task Management', icon: Settings },
];

const adminLinks = [
  ...overallHeadLinks,
  { href: '/admin/users', label: 'User Management', icon: UserCircle },
];


export default function MainNav() {
  const { authUser, userProfile, logOut, loading } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleLogout = async () => {
    try {
      await logOut();
      router.push('/');
      toast({ title: "Logged Out", description: "You have been successfully logged out." });
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const NavLinkItem: React.FC<{ href: string; label: string; Icon: React.ElementType; onClick?: () => void; isBranding?: boolean; }> = ({ href, label, Icon, onClick, isBranding = false }) => (
    <Link
      href={href}
      onClick={(e) => {
        if (href.includes('#')) {
          e.preventDefault();
          const targetId = href.split('#')[1];
          const targetElement = document.getElementById(targetId);
          if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
          }
        }
        if (onClick) onClick();
        if (!isBranding) setIsMobileMenuOpen(false);
      }}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
        isBranding 
          ? "text-xl font-bold text-primary font-headline hover:opacity-90 p-0" 
          : "px-2 py-1.5 hover:bg-primary/10 hover:text-primary",
        !isBranding && (pathname === href || (href.includes('#') && pathname + (window.location.hash || '') === href) ) ? "text-primary bg-primary/5" : "text-muted-foreground",
        isBranding && "p-0"
      )}
    >
      <Icon className={cn(isBranding ? "h-7 w-7" : "h-5 w-5")} />
      {label}
    </Link>
  );

  const UserAvatar = () => (
    <Avatar className="h-8 w-8 border border-transparent group-hover:border-primary/50 transition-colors">
      <AvatarImage src={authUser?.photoURL || userProfile?.photoURL || undefined} alt={authUser?.displayName || userProfile?.displayName || authUser?.email || 'User'} />
      <AvatarFallback>{(authUser?.email || userProfile?.email)?.[0].toUpperCase() || 'U'}</AvatarFallback>
    </Avatar>
  );
  
  const getNavLinksForRole = (role?: UserRole) => {
    let specificLinks = [];
    if (authUser) {
      switch (role) {
        case 'student':
        case 'test':
          specificLinks = studentLinks;
          break;
        case 'organizer':
        case 'event_representative':
          specificLinks = organizerLinks;
          break;
        case 'overall_head':
          specificLinks = overallHeadLinks;
          break;
        case 'admin':
          specificLinks = adminLinks;
          break;
        default:
          specificLinks = studentLinks; 
      }
       return [...commonLinks, ...specificLinks.filter(sl => !commonLinks.find(cl => cl.href === sl.href))];
    }
    return commonLinks;
  };

  const currentNavLinks = getNavLinksForRole(userProfile?.role);

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-2 text-lg font-bold text-primary">
            <Atom className="h-6 w-6 animate-pulse" />
            <span className="w-32 h-6 bg-muted rounded animate-pulse"></span>
          </div>
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <NavLinkItem href="/" label="JUNIOR SCIENTIST" Icon={Atom} isBranding />

        <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
          {currentNavLinks.map(link => (
            <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
             <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          ) : authUser ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full group">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{userProfile?.displayName || authUser.displayName || authUser.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {authUser.email} ({userProfile?.role ? userProfile.role.replace('_', ' ') : '...'})
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                 {(userProfile?.role === 'student' || userProfile?.role === 'test' || userProfile?.role === 'organizer' || userProfile?.role === 'event_representative' || userProfile?.role === 'overall_head' || userProfile?.role === 'admin') && (
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive-foreground focus:bg-destructive/90">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="outline" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0 flex flex-col">
                <SheetHeader className="sr-only">
                  <SheetTitle>Main Navigation Menu</SheetTitle>
                </SheetHeader>
                <div className="border-b p-4">
                  <NavLinkItem href="/" label="JUNIOR SCIENTIST" Icon={Atom} isBranding onClick={() => setIsMobileMenuOpen(false)}/>
                </div>
                <nav className="flex-grow space-y-1 p-4 overflow-y-auto">
                  {currentNavLinks.map(link => (
                     <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} onClick={() => setIsMobileMenuOpen(false)} />
                  ))}
                </nav>
                {!authUser && !loading && (
                  <div className="border-t p-4 space-y-2">
                    <Button variant="outline" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
                 {authUser && !loading && (
                  <div className="border-t p-4 space-y-2">
                    <Button variant="destructive" className="w-full" onClick={() => {handleLogout(); setIsMobileMenuOpen(false);}}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                 )}
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
