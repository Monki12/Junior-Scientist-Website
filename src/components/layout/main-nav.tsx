
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
import { LightBulbToggle } from '@/components/layout/light-bulb-toggle';
import { 
  Menu, LogOut, UserCircle, Home, Search, Briefcase, Settings, LayoutDashboard, Users, Bell, CalendarCheck, ShieldCheck, ListChecks, FileScan, Phone, MoreHorizontal, ChevronDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { UserProfileData } from '@/types';
import { Logo } from '@/components/layout/logo';


const commonBaseLinks = [
  { href: '/', label: 'Home', icon: Home },
  { href: '/events', label: 'Browse Events', icon: Search },
];

const studentNavLinks = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard#my-events', label: 'My Events', icon: CalendarCheck },
  { href: '/dashboard#teams', label: 'Teams', icon: Users }, 
  { href: '/dashboard#admit-cards', label: 'Admit Cards', icon: ShieldCheck }, // Changed Icon
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'Profile', icon: UserCircle },
];

const baseOrganizerLinks = [
  { href: '/dashboard', label: 'My Dashboard', icon: LayoutDashboard },
  { href: '/ocr-tool', label: 'OCR Tool', icon: FileScan },
  { href: '/notifications', label: 'Notifications', icon: Bell },
  { href: '/profile', label: 'My Profile', icon: UserCircle },
];

const MAX_DESKTOP_NAV_LINKS_DIRECT = 3; // Max links to show directly before collapsing to "Menu" icon

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
  
  const handleLinkClick = (href: string, e?: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
    if (href.includes('#')) {
      const [path, anchor] = href.split('#');
      // Check if currently on the page that the anchor link targets
      // For root anchors like '/#contact-us', `path` will be empty.
      const targetPath = path || '/'; 
      if (pathname === targetPath || (targetPath === '/' && pathname === '/')) {
        e?.preventDefault();
        const targetElement = document.getElementById(anchor);
        if (targetElement) {
          targetElement.scrollIntoView({ behavior: 'smooth' });
        }
      } else {
        // If navigating to a different page with an anchor, just let NextLink handle it.
        // The browser should jump to the anchor after page load.
      }
    }
    // For non-anchor links, or links to different pages, no special handling needed here.
    // The NextLink default behavior is sufficient.
  };


  const NavLinkItem: React.FC<{ href: string; label: string; Icon: React.ElementType; onClick?: () => void; isBranding?: boolean; }> = ({ href, label, Icon, onClick, isBranding = false }) => (
    <Link
      href={href}
      onClick={(e) => {
        handleLinkClick(href, e);
        if (onClick) onClick();
        if (!isBranding) setIsMobileMenuOpen(false);
      }}
      className={cn(
        "flex items-center gap-2 rounded-md text-sm font-medium transition-colors",
        isBranding 
          ? "text-xl font-bold text-primary font-headline hover:opacity-90 p-0" 
          : "px-2 py-1.5 hover:bg-primary/10 hover:text-primary", 
        !isBranding && (pathname === href || (pathname + (typeof window !== 'undefined' ? window.location.hash : '')) === href ) ? "text-primary bg-primary/5" : "text-muted-foreground hover:text-primary/80",
        isBranding && "p-0" 
      )}
    >
      <Icon className={cn(isBranding ? "h-7 w-7" : "h-5 w-5")} />
      {label}
    </Link>
  );

  const UserAvatar = () => (
    <Avatar className="h-9 w-9 border border-transparent group-hover:border-primary/50 transition-colors">
      <AvatarImage src={authUser?.photoURL || userProfile?.photoURL || undefined} alt={authUser?.displayName || userProfile?.displayName || authUser?.email || 'User'} />
      <AvatarFallback className="text-sm bg-primary/20 text-primary">{(userProfile?.displayName || authUser?.displayName || userProfile?.email || authUser?.email)?.[0].toUpperCase() || 'U'}</AvatarFallback>
    </Avatar>
  );
  
  const getNavLinksForRole = (profile?: UserProfileData | null) => {
    let userSpecificLinks: Array<{ href: string; label: string; icon: React.ElementType; }> = [];
    if (authUser && profile) {
      switch (profile.role) {
        case 'student':
        case 'test':
          userSpecificLinks = studentNavLinks;
          break;
        case 'event_representative':
          userSpecificLinks = [...baseOrganizerLinks];
          if (profile.assignedEventSlug) {
            userSpecificLinks.splice(1, 0, { href: `/organizer/events/manage/${profile.assignedEventSlug}`, label: 'Manage My Event', icon: Briefcase });
            userSpecificLinks.splice(2, 0, { href: `/organizer/event-tasks`, label: 'Event Tasks', icon: ListChecks});
          }
          break;
        case 'organizer':
          userSpecificLinks = [...baseOrganizerLinks];
          break;
        case 'overall_head':
          userSpecificLinks = [
            { href: '/dashboard', label: 'OH Dashboard', icon: LayoutDashboard },
            { href: '/admin/tasks', label: 'Global Tasks', icon: Settings },
            { href: '/organizer/events/manage', label: 'Manage All Events', icon: Briefcase },
            { href: '/ocr-tool', label: 'OCR Tool', icon: FileScan },
            { href: '/notifications', label: 'Notifications', icon: Bell },
            { href: '/profile', label: 'My Profile', icon: UserCircle },
          ];
          break;
        case 'admin':
          userSpecificLinks = [
            { href: '/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
            { href: '/admin/tasks', label: 'Global Tasks', icon: Settings },
            { href: '/organizer/events/manage', label: 'Manage All Events', icon: Briefcase },
            { href: '/admin/users', label: 'Manage Users', icon: Users}, 
            { href: '/ocr-tool', label: 'OCR Tool', icon: FileScan },
            { href: '/notifications', label: 'Notifications', icon: Bell },
            { href: '/profile', label: 'My Profile', icon: UserCircle },
          ];
          break;
        default:
          userSpecificLinks = []; 
      }
       return [...commonBaseLinks, ...userSpecificLinks.filter(sl => !commonBaseLinks.find(cl => cl.label === sl.label))];
    }
    return commonBaseLinks;
  };

  const currentRoleNavLinks = getNavLinksForRole(userProfile);
  const contactUsLink = { href: '/#contact-us', label: 'Contact', icon: Phone };
  const allDisplayableNavLinks = [...currentRoleNavLinks, contactUsLink];


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
            {allDisplayableNavLinks.length <= MAX_DESKTOP_NAV_LINKS_DIRECT ? (
              allDisplayableNavLinks.map(link => (
                <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} />
              ))
            ) : (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">More navigation links</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {allDisplayableNavLinks.map(link => (
                    <DropdownMenuItem key={link.href} asChild>
                      <Link 
                        href={link.href} 
                        onClick={(e) => handleLinkClick(link.href, e)}
                        className="flex items-center w-full"
                      >
                        <link.icon className="mr-2 h-4 w-4" />
                        {link.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </nav>

          <div className="hidden md:flex items-center gap-2">
             <LightBulbToggle />
             {loading ? (
               <div className="h-9 w-9 animate-pulse rounded-full bg-muted"></div>
             ) : authUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full group p-0">
                      <UserAvatar />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{userProfile?.displayName || authUser.displayName || authUser.email}</p>
                        <p className="text-xs leading-none text-muted-foreground">
                          {authUser.email} {userProfile?.role ? `(${userProfile.role.replace('_', ' ')})` : ''}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => router.push('/dashboard')}>
                        <LayoutDashboard className="mr-2 h-4 w-4" />
                        Dashboard
                    </DropdownMenuItem>
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
                <>
                  <Button variant="outline" asChild>
                    <Link href="/login">Log In</Link>
                  </Button>
                  <Button asChild className="bg-accent hover:bg-accent/80 text-accent-foreground">
                    <Link href="/signup">Sign Up</Link>
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
                  {allDisplayableNavLinks.map(link => (
                     <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} onClick={() => setIsMobileMenuOpen(false)} />
                  ))}
                </nav>
                <div className="border-t p-4 mt-auto">
                  {authUser ? (
                     <div className="space-y-2">
                       <div className="flex items-center gap-2 p-2 rounded-md hover:bg-muted">
                          <UserAvatar/>
                          <div className="flex flex-col">
                             <span className="text-sm font-medium leading-none">{userProfile?.displayName || authUser.displayName || "User"}</span>
                             <span className="text-xs leading-none text-muted-foreground">{authUser.email}</span>
                          </div>
                       </div>
                       <DropdownMenuSeparator />
                      <Button variant="destructive" className="w-full" onClick={() => {handleLogout(); setIsMobileMenuOpen(false);}}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Log out
                      </Button>
                    </div>
                  ) : !loading && (
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/login">Log In</Link>
                      </Button>
                      <Button className="w-full bg-accent hover:bg-accent/80 text-accent-foreground" asChild onClick={() => setIsMobileMenuOpen(false)}>
                        <Link href="/signup">Sign Up</Link>
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
