import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { 
  LucideHome, 
  LucideUsers, 
  LucideGlobe, 
  LucideShoppingBag, 
  LucideMessageSquare, 
  LucideSettings, 
  LucideMenu,
  LucideLogOut,
  LucideBell,
  Bot,
  Briefcase,
  Calendar,
  GraduationCap
} from 'lucide-react';
import ThemeToggle from '../ui/ThemeToggle';
import { Button } from '../ui/button';
import { useIsMobile } from '../../hooks/use-mobile';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '../ui/dropdown-menu';

type SidebarItem = {
  icon: React.ReactNode;
  label: string;
  href: string;
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [location] = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const getSidebarItems = (role: string = 'user'): SidebarItem[] => {
    const baseItems = [
      {
        icon: <LucideHome className="h-5 w-5" />,
        label: 'Dashboard',
        href: '/dashboard',
        roles: ['admin', 'user', 'manager'],
      },
      {
        icon: <LucideUsers className="h-5 w-5" />,
        label: 'Users',
        href: '/dashboard/users',
        roles: ['admin'],
      },
      {
        icon: <LucideGlobe className="h-5 w-5" />,
        label: 'Websites',
        href: '/dashboard/websites',
        roles: ['admin', 'manager'],
      },
      {
        icon: <LucideShoppingBag className="h-5 w-5" />,
        label: 'E-commerce',
        href: '/dashboard/ecommerce',
        roles: ['admin', 'manager'],
      },
      {
        icon: <Bot className="h-5 w-5" />,
        label: 'AI Omnilayer',
        href: '/dashboard/ai',
        roles: ['admin', 'manager', 'user'],
      },
      {
        icon: <LucideUsers className="h-5 w-5" />,
        label: 'Social Network',
        href: '/dashboard/social',
        roles: ['admin', 'manager', 'user'],
      },
      {
        icon: <GraduationCap className="h-5 w-5" />,
        label: 'Education',
        href: '/dashboard/education',
        roles: ['admin', 'manager'],
      },
      {
        icon: <Briefcase className="h-5 w-5" />,
        label: 'Jobs',
        href: '/dashboard/jobs',
        roles: ['admin', 'manager'],
      },
      {
        icon: <Calendar className="h-5 w-5" />,
        label: 'Booking',
        href: '/dashboard/booking',
        roles: ['admin', 'manager'],
      },
      {
        icon: <LucideMessageSquare className="h-5 w-5" />,
        label: 'Messages',
        href: '/dashboard/messages',
        roles: ['admin', 'manager', 'user'],
      },
      {
        icon: <LucideSettings className="h-5 w-5" />,
        label: 'Settings',
        href: '/dashboard/settings',
        roles: ['admin', 'manager', 'user'],
      },
    ];

    return baseItems.filter(item => item.roles.includes(role));
  };

  // For now hardcode the role - in a real app this would come from auth context
  const userRole = 'admin';
  const sidebarItems = getSidebarItems(userRole);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="border-b bg-background">
        <div className="flex h-16 items-center px-4 sm:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-2"
            onClick={toggleSidebar}
          >
            <LucideMenu className="h-5 w-5" />
            <span className="sr-only">Toggle sidebar</span>
          </Button>
          
          <div className="flex items-center gap-2 font-semibold text-lg">
            <Link href="/">
              <div className="flex items-center cursor-pointer">
                <span className="bg-primary text-primary-foreground p-1 rounded mr-2">E</span>
                <span className="hidden sm:inline-block">Echoverse</span>
              </div>
            </Link>
          </div>

          <div className="ml-auto flex items-center gap-4">
            <Button variant="ghost" size="icon" className="relative">
              <LucideBell className="h-5 w-5" />
              <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
            </Button>
            
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/placeholder-user.jpg" alt="Profile" />
                    <AvatarFallback>AD</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <LucideLogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside 
          className={`bg-background fixed md:relative inset-y-0 z-30 md:z-0 transition-all duration-300 border-r ${
            isSidebarOpen || !isMobile ? 'left-0' : '-left-64'
          } w-64 md:block`}
        >
          <div className="h-full px-3 py-4 overflow-y-auto">
            <nav className="space-y-1 mt-10">
              {sidebarItems.map((item) => {
                const isActive = location === item.href;
                return (
                  <Link key={item.href} href={item.href}>
                    <div
                      className={`flex items-center px-3 py-2 rounded-md text-sm font-medium cursor-pointer ${
                        isActive 
                          ? 'bg-primary text-primary-foreground' 
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                    >
                      <span className="mr-3">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Overlay for mobile sidebar */}
        {isMobile && isSidebarOpen && (
          <div 
            className="fixed inset-0 z-20 bg-black/50 md:hidden" 
            onClick={toggleSidebar}
          ></div>
        )}

        {/* Main content */}
        <main className="flex-1 p-6 md:px-8 md:py-6 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}