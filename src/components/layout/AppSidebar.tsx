
'use client';

import {
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
  SidebarGroup,
  SidebarGroupLabel,
} from '@/components/ui/sidebar';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  Trophy,
  Settings,
  UserCircle,
  GraduationCap,
  LogOut,
  HelpCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { LightBulbToggle } from './light-bulb-toggle';
import { useToast } from '@/hooks/use-toast';

const getNavLinksForRole = (role: string | undefined) => {
  const baseLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];

  const studentLinks = [
    ...baseLinks,
    { href: '/events', label: 'Browse Events', icon: Calendar },
  ];

  const organizerLinks = [
    ...baseLinks,
    { href: '/tasks', label: 'My Tasks', icon: ClipboardList },
    { href: '/events', label: 'My Events', icon: Calendar },
    // Student data link is conditional and added below
  ];

  const repLinks = [
    ...baseLinks,
    { href: '/events', label: 'My Events', icon: Calendar },
    { href: '/staff', label: 'Event Staff', icon: Users },
    { href: '/students', label: 'Event Students', icon: GraduationCap },
    { href: '/tasks', label: 'Event Tasks', icon: ClipboardList },
  ];

  const overallHeadLinks = [
    ...baseLinks,
    { href: '/events', label: 'All Events', icon: Calendar },
    { href: '/staff', label: 'Manage Staff', icon: Users },
    { href: '/students', label: 'Manage Students', icon: GraduationCap },
    { href: '/tasks', label: 'Global Tasks', icon: ClipboardList },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  switch (role) {
    case 'admin':
    case 'overall_head':
      return overallHeadLinks;
    case 'event_representative':
      return repLinks;
    case 'organizer':
      return organizerLinks;
    case 'student':
    case 'test':
      return studentLinks;
    default:
      return baseLinks;
  }
};

export default function AppSidebar() {
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

  const navLinks = getNavLinksForRole(userProfile?.role);
  
  // Conditionally add Student Data link for organizers
  if (userProfile?.role === 'organizer' && userProfile.studentDataEventAccess && Object.values(userProfile.studentDataEventAccess).some(v => v === true)) {
    navLinks.push({ href: '/students', label: 'Student Data', icon: GraduationCap });
  }

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo className="h-10 w-8" />
            <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
              Junior Scientist
            </span>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                onClick={() => router.push(link.href)}
                isActive={pathname === link.href}
                tooltip={{ children: link.label }}
              >
                <link.icon />
                <span>{link.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarGroup>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push('/profile')} tooltip={{ children: 'Profile' }}>
                        <UserCircle />
                        <span>Profile</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={handleLogout} className="text-destructive hover:bg-destructive/10" tooltip={{ children: 'Log Out' }}>
                        <LogOut />
                        <span>Log Out</span>
                    </SidebarMenuButton>
                </SidebarMenuItem>
            </SidebarMenu>
            <div className="flex items-center justify-between pt-2 group-data-[collapsible=icon]:hidden">
                <LightBulbToggle />
                 <Button variant="ghost" size="icon" onClick={() => toast({ title: "Help", description: "Help and support features coming soon!"})}>
                    <HelpCircle className="h-5 w-5"/>
                 </Button>
            </div>
         </SidebarGroup>
      </SidebarFooter>
    </>
  );
}
