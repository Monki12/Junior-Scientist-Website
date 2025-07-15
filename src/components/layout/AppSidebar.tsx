
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
  SidebarMenuSub,
  SidebarMenuSubButton,
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
  ListTodo,
  CheckCircle,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Logo } from './logo';
import { LightBulbToggle } from './light-bulb-toggle';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const getNavLinksForRole = (role: string | undefined) => {
  const baseLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: Home },
  ];

  const studentLinks = [
    ...baseLinks,
    { href: '/events', label: 'Explore Events', icon: Search },
    { href: '/my-registrations', label: 'My Registrations', icon: Ticket },
  ];
  
  const taskSubLinks = {
    group: 'Tasks',
    icon: ClipboardList,
    links: [
        { href: '/my-tasks', label: 'My Assigned Tasks'},
        { href: '/tasks', label: 'Team Task Boards'},
        { href: '/tasks/my-boards', label: 'My Boards'},
        { href: '/tasks/manage-boards', label: 'Manage All Boards'},
    ]
  };
  
  const managerLinks = [
    ...baseLinks,
    taskSubLinks,
    { href: '/my-events', label: 'All Events', icon: Calendar },
    { href: '/staff', label: 'Manage Staff', icon: Users },
    { href: '/students', label: 'Manage Students', icon: GraduationCap },
    { href: '/ocr-tool', label: 'OCR Scanner', icon: ScanLine },
    { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
  ];
  
  const organizerLinks = [
    ...baseLinks,
    {
        group: 'Tasks',
        icon: ClipboardList,
        links: [
            { href: '/my-tasks', label: 'My Assigned Tasks'},
            { href: '/tasks', label: 'Team Task Boards'},
            { href: '/tasks/my-boards', label: 'My Boards'},
        ]
    },
    { href: '/my-events', label: 'My Events', icon: Calendar },
  ];

  const repLinks = [
    ...baseLinks,
    {
        group: 'Tasks',
        icon: ClipboardList,
        links: [
            { href: '/my-tasks', label: 'My Assigned Tasks'},
            { href: '/tasks', label: 'Team Task Boards'},
            { href: '/tasks/my-boards', label: 'My Boards'},
        ]
    },
    { href: '/my-events', label: 'My Events', icon: Calendar },
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
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
      Tasks: pathname.startsWith('/tasks')
  });

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

  let navLinks = getNavLinksForRole(userProfile?.role);
  
  // Dynamically add 'Student Data' link for organizers with permission
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
          isActive={pathname === link.href}
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
                const Icon = item.icon;
                const isGroupActive = pathname.startsWith('/tasks');
                return (
                    <SidebarMenuItem key={item.group}>
                        <SidebarMenuButton
                          onClick={() => setOpenGroups(prev => ({...prev, [item.group]: !prev[item.group]}))}
                          isActive={isGroupActive}
                          data-state={openGroups[item.group] ? 'open' : 'closed'}
                          className="pr-2"
                        >
                            <Icon />
                            <span>{item.group}</span>
                            <ChevronDown className="ml-auto h-4 w-4 shrink-0 transition-transform duration-200 group-data-[collapsible=icon]:hidden data-[state=open]:rotate-180" />
                        </SidebarMenuButton>
                        {openGroups[item.group] && (
                            <SidebarMenuSub className="group-data-[collapsible=icon]:hidden">
                                {item.links.map(sublink => (
                                     <SidebarMenuSubItem key={sublink.href}>
                                        <SidebarMenuSubButton onClick={() => router.push(sublink.href)} isActive={pathname === sublink.href}>
                                            {sublink.label}
                                        </SidebarMenuSubButton>
                                    </SidebarMenuSubItem>
                                ))}
                            </SidebarMenuSub>
                        )}
                    </SidebarMenuItem>
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
