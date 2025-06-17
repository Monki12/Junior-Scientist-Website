'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
import { Zap, Menu, LogOut, UserCircle, LayoutDashboard, CalendarDays, ScanLine, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/events', label: 'Events', icon: CalendarDays, authRequired: false },
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, authRequired: true },
  { href: '/ocr-tool', label: 'OCR Tool', icon: ScanLine, authRequired: true },
  { href: '/notifications', label: 'Notifications', icon: Bell, authRequired: true },
];

export default function MainNav() {
  const { user, logOut, loading } = useAuth();
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
      // Toast for successful logout is not an error, so omitted based on guidelines.
    } catch (error) {
      toast({
        title: 'Logout Failed',
        description: (error as Error).message || 'An unexpected error occurred.',
        variant: 'destructive',
      });
    }
  };

  const NavLinkItem: React.FC<{ href: string; label: string; Icon: React.ElementType; onClick?: () => void }> = ({ href, label, Icon, onClick }) => (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary/10 hover:text-primary",
        pathname === href ? "text-primary bg-primary/5" : "text-muted-foreground"
      )}
    >
      <Icon className="h-5 w-5" />
      {label}
    </Link>
  );

  const UserAvatar = () => (
    <Avatar className="h-8 w-8">
      <AvatarImage src={user?.photoURL || undefined} alt={user?.displayName || user?.email || 'User'} />
      <AvatarFallback>{user?.email?.[0].toUpperCase() || 'U'}</AvatarFallback>
    </Avatar>
  );

  if (!mounted) {
    return (
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary">
            <Zap className="h-6 w-6" />
            <span>EventFlow</span>
          </Link>
          <div className="h-8 w-20 animate-pulse rounded-md bg-muted"></div>
        </div>
      </header>
    );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary font-headline">
          <Zap className="h-6 w-6" />
          <span>EventFlow</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-2 lg:space-x-4">
          {navLinks.filter(link => !link.authRequired || (link.authRequired && user)).map(link => (
            <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} />
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {loading ? (
             <div className="h-8 w-8 animate-pulse rounded-full bg-muted"></div>
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <UserAvatar />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName || user.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => router.push('/profile')}>
                  <UserCircle className="mr-2 h-4 w-4" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Log out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <Button variant="ghost" asChild>
                <Link href="/login">Log In</Link>
              </Button>
              <Button asChild className="bg-accent hover:bg-accent/90 text-accent-foreground">
                <Link href="/signup">Sign Up</Link>
              </Button>
            </div>
          )}

          {/* Mobile Navigation Trigger */}
          <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[280px] p-0">
              <div className="flex h-full flex-col">
                <div className="border-b p-4">
                  <Link href="/" className="flex items-center gap-2 text-lg font-bold text-primary font-headline" onClick={() => setIsMobileMenuOpen(false)}>
                    <Zap className="h-6 w-6" />
                    <span>EventFlow</span>
                  </Link>
                </div>
                <nav className="flex-grow space-y-2 p-4">
                  {navLinks.filter(link => !link.authRequired || (link.authRequired && user)).map(link => (
                     <NavLinkItem key={link.href} href={link.href} label={link.label} Icon={link.icon} onClick={() => setIsMobileMenuOpen(false)} />
                  ))}
                </nav>
                {!user && !loading && (
                  <div className="mt-auto border-t p-4 space-y-2">
                    <Button variant="outline" className="w-full" asChild onClick={() => setIsMobileMenuOpen(false)}>
                      <Link href="/login">Log In</Link>
                    </Button>
                    <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" asChild onClick={() => setIsMobileMenuOpen(false)}>
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
