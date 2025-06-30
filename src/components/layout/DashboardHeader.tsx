
'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Bell, Camera, HelpCircle, LogOut, UserCircle } from 'lucide-react';
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
    '/students': 'Student Management',
    '/events': 'Event Management',
    '/tasks': 'Task Management',
    '/leaderboard': 'Leaderboard',
    '/profile': 'My Profile',
    '/ocr-tool': 'OCR Scanner',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
  };

  const getPageTitle = () => {
    return pageTitles[pathname] || 'Junior Scientist';
  };

  return (
    <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background px-4 sm:h-16 sm:px-6">
      <SidebarTrigger className="sm:hidden" />
      <div className="flex-1">
        <h1 className="text-lg font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" onClick={() => router.push('/ocr-tool')} aria-label="OCR Scan">
          <Camera className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" onClick={() => router.push('/notifications')} aria-label="Notifications">
          <Bell className="h-5 w-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-9 w-9 rounded-full p-0">
              <Avatar className="h-9 w-9">
                <AvatarImage src={userProfile?.photoURL || undefined} alt={userProfile?.displayName || 'User'} />
                <AvatarFallback>{(userProfile?.displayName || authUser?.email || 'U')[0].toUpperCase()}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
            <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/90">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
