
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
} from '@/components/ui/sidebar';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  Trophy,
  UserCircle,
  GraduationCap,
  LogOut,
  HelpCircle,
  ScanLine,
  Search,
  Ticket,
  Users2,
  ListTodo
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { LightBulbToggle } from './light-bulb-toggle';
import { useToast } from '@/hooks/use-toast';

const getNavLinksForRole = (role: string | undefined) => {
  const baseLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
  ];

  const studentLinks = [
    ...baseLinks,
    { href: '/events', label: 'Explore Events', icon: Search },
    { href: '/my-registrations', label: 'My Registrations', icon: Ticket },
    { href: '/my-tasks', label: 'My Tasks', icon: ListTodo },
  ];

  const managerLinks = [
    ...baseLinks,
    { href: '/tasks', label: 'Team Boards', icon: ClipboardList },
    { href: '/my-tasks', label: 'My Tasks', icon: ListTodo },
    { href: '/my-events', label: 'All Events', icon: Calendar },
    { href: '/staff', label: 'Manage Staff', icon: Users },
    { href: '/students', label: 'Manage Students', icon: GraduationCap },
    {
      group: 'Teams',
      links: [
        { href: '/teams', label: 'My Teams', icon: Users2 },
        { href: '/teams/manage', label: 'Manage Teams', icon: Users2 },
      ]
    },
    { href: '/ocr-tool', label: 'OCR Scanner', icon: ScanLine },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];
  
  const organizerLinks = [
    ...baseLinks,
    { href: '/tasks', label: 'Team Boards', icon: ClipboardList },
    { href: '/my-tasks', label: 'My Tasks', icon: ListTodo },
    { href: '/my-events', label: 'My Events', icon: Calendar },
    { href: '/teams', label: 'My Teams', icon: Users2 },
  ];

  const repLinks = [
    ...baseLinks,
    { href: '/tasks', label: 'Team Boards', icon: ClipboardList },
    { href: '/my-tasks', label: 'My Tasks', icon: ListTodo },
    { href: '/my-events', label: 'My Events', icon: Calendar },
    { href: '/teams', label: 'My Teams', icon: Users2 },
    { href: '/students', label: 'Event Students', icon: GraduationCap },
  ];

  switch (role) {
    case 'admin':
    case 'overall_head':
      return managerLinks;
    case 'event_representative':
      return repLinks;
    case 'organizer':
      return organizerLinks;
    case 'student':
    case 'test':
      return studentLinks;
    default:
      return [];
  }
};

export default function AppSidebar() {
  const { userProfile, logOut } = useAuth();
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
  
  if (userProfile?.role === 'organizer' && userProfile.studentDataEventAccess && Object.values(userProfile.studentDataEventAccess).some(v => v === true)) {
    const studentDataLink = { href: '/students', label: 'Student Data', icon: GraduationCap };
    if (!navLinks.some(link => 'href' in link && link.href === studentDataLink.href)) {
      const myEventsIndex = navLinks.findIndex(link => 'href' in link && link.href === '/my-events');
      if (myEventsIndex !== -1) {
          navLinks.splice(myEventsIndex + 1, 0, studentDataLink);
      } else {
          navLinks.push(studentDataLink);
      }
    }
  }

  const renderLink = (link: any) => (
     <SidebarMenuItem key={link.href}>
        <SidebarMenuButton
          onClick={() => router.push(link.href)}
          isActive={pathname.startsWith(link.href) && (link.href !== '/dashboard' || pathname === '/dashboard')}
          tooltip={{ children: link.label }}
        >
          <link.icon />
          <span>{link.label}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
  );

  return (
    <>
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button onClick={() => router.push('/dashboard')} className="flex items-center gap-2">
              <Logo className="h-10 w-8" />
              <span className="font-semibold text-lg group-data-[collapsible=icon]:hidden">
                Junior Scientist
              </span>
            </button>
          </div>
          <SidebarTrigger className="group-data-[collapsible=icon]:hidden" />
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((item) => {
            if ('group' in item) {
                return (
                    <SidebarGroup key={item.group}>
                        <SidebarMenu>
                            {item.links.map(renderLink)}
                        </SidebarMenu>
                    </SidebarGroup>
                )
            }
            return renderLink(item);
          })}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarGroup>
            <SidebarMenu>
                <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => router.push('/profile')} isActive={pathname === '/profile'} tooltip={{ children: 'Profile' }}>
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
