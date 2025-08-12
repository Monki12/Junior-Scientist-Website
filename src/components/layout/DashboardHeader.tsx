
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Camera, HelpCircle, LogOut, UserCircle, Menu } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function DashboardHeader() {
  const { userProfile, authUser, logOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const { toast } = useToast();

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

  const pageTitles: { [key: string]: string } = {
    '/dashboard': 'Dashboard Overview',
    '/staff': 'Staff Management',
    '/students': 'Student Data',
    '/my-events': 'Event Management',
    '/my-registrations': 'My Registrations',
    '/tasks': 'Task Management',
    '/profile': 'My Profile',
    '/ocr-tool': 'OCR Scanner',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
  };

  const getPageTitle = () => {
    // Exact match first
    if (pageTitles[pathname]) {
        return pageTitles[pathname];
    }
    // Partial match for dynamic routes
    const matchedTitle = Object.entries(pageTitles).find(([path]) => pathname.startsWith(path) && path !== '/');
    return matchedTitle ? matchedTitle[1] : 'Junior Scientist';
  };

  const showOcrButton = userProfile && !['student', 'test'].includes(userProfile.role);

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:px-6">
       <div className="lg:hidden">
         <SidebarTrigger asChild>
            <Button size="icon" variant="outline">
              <Menu className="h-5 w-5" />
            </Button>
          </SidebarTrigger>
       </div>
      
      <div className="flex-1">
        <h1 className="text-lg font-semibold tracking-wide">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-2 md:gap-4">
        {showOcrButton && (
          <Button variant="ghost" size="icon" onClick={() => router.push('/ocr-tool')} aria-label="OCR Scan">
            <Camera className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={() => router.push('/notifications')} aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9 border">
                <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'User'} />
                <AvatarFallback>{(userProfile?.fullName || authUser?.email || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-semibold truncate">{userProfile?.fullName || userProfile?.displayName}</p>
              <p className="text-xs text-muted-foreground font-normal">{authUser?.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/profile')}>
              <UserCircle className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => toast({ title: "Help", description: "Help documentation coming soon."})}>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
