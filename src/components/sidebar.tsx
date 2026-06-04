'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Home,
  FolderKanban,
  ListTodo,
  Inbox,
  Users,
  FileSpreadsheet,
  Wallet,
  FileSignature,
  Calendar,
  Clock,
  Timer,
  ClipboardList,
  FolderOpen,
  BotMessageSquare,
  ListChecks,
  Settings2,
  ChevronLeft,
  Settings,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useSidebar } from '@/components/ui/sidebar';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { logout } from '@/lib/auth';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const navGroups = [
  {
    id: 'core',
    items: [
      { href: '/dashboard', label: 'Home', icon: Home },
      { href: '/projects', label: 'Projects', icon: FolderKanban },
      { href: '/board', label: 'Tasks', icon: ListTodo },
      { href: '/snippets', label: 'Inbox', icon: Inbox, wip: true },
    ]
  },
  {
    id: 'business',
    items: [
      { href: '/clients', label: 'Contacts', icon: Users },
      { href: '/invoices', label: 'Proposals', icon: FileSpreadsheet },
      { href: '/financials', label: 'Financials', icon: Wallet },
      { href: '/invoices', label: 'Contracts', icon: FileSignature, wip: true },
    ]
  },
  {
    id: 'planning',
    items: [
      { href: '/dashboard', label: 'Calendar', icon: Calendar, wip: true },
      { href: '/templates', label: 'Schedulers', icon: Clock, wip: true },
      { href: '/dashboard', label: 'Timesheets', icon: Timer, wip: true },
    ]
  },
  {
    id: 'tools',
    items: [
      { href: '/templates', label: 'Forms', icon: ClipboardList, wip: true },
      { href: '/board', label: 'Files', icon: FolderOpen, wip: true },
    ]
  },
  {
    id: 'ai',
    items: [
      { href: '/snippets', label: 'AI Snippets', icon: BotMessageSquare },
      { href: '/templates', label: 'Templates', icon: Settings2 },
      { href: '/job-types', label: 'Job Types', icon: ListChecks },
    ]
  }
];

export function AppSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('Freelancer');
  const [userInitial, setUserInitial] = useState<string>('F');

  useEffect(() => {
    setIsMounted(true);
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
      if (user?.displayName) {
        setUserName(user.displayName);
        setUserInitial(user.displayName.charAt(0).toUpperCase());
      } else if (user?.email) {
        const localPart = user.email.split('@')[0];
        setUserName(localPart);
        setUserInitial(localPart.charAt(0).toUpperCase());
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  if (!isMounted) {
    return null;
  }

  const getIsActive = (href: string, label: string) => {
    if (pathname === '/dashboard') return label === 'Home';
    if (pathname === '/projects') return label === 'Projects';
    if (pathname === '/board') return label === 'Tasks';
    if (pathname === '/snippets') return label === 'AI Snippets';
    if (pathname === '/templates') return label === 'Templates';
    if (pathname === '/invoices') return label === 'Proposals';
    if (pathname === '/clients') return label === 'Contacts';
    if (pathname === '/financials') return label === 'Financials';
    return pathname === href;
  };

  return (
    <aside
      className={cn(
        'relative hidden h-full flex-col rounded-2xl border border-border/50 bg-card p-3 transition-all duration-300 ease-in-out md:flex shrink-0 shadow-sm',
        isCollapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Profile Section matching reference image */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <div
            className={cn(
              'flex items-center gap-2.5 pb-3 border-b border-border/30 mb-3 cursor-pointer hover:bg-muted/50 rounded-xl p-1 -mx-1',
              isCollapsed ? 'justify-center' : 'px-1.5'
            )}
          >
            <div className='h-9 w-9 rounded-full bg-[#6b21a8] flex items-center justify-center text-white font-extrabold text-sm select-none shrink-0 shadow-xs'>
              {userInitial}
            </div>
            <div
              className={cn(
                'flex flex-col min-w-0 transition-all duration-200 ease-in-out',
                isCollapsed && 'scale-x-0 opacity-0 hidden'
              )}
            >
              <span className='font-bold text-sm text-foreground truncate'>{userName}</span>
              <span className='text-[10px] text-muted-foreground truncate'>freelancer</span>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className="w-56 ml-2">
          <DropdownMenuLabel>
            My Account
            {userEmail && (
              <div className='text-xs text-muted-foreground mt-1'>
                {userEmail}
              </div>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>Settings</DropdownMenuItem>
          <DropdownMenuItem>Support</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:bg-destructive/10 focus:text-destructive">Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Main Navigation with grouped items & dashed dividers */}
      <nav className='flex-1 flex flex-col gap-3 overflow-y-auto pr-1 scrollbar-thin'>
        <TooltipProvider delayDuration={0}>
          {navGroups.map((group, groupIdx) => (
            <div key={group.id} className="flex flex-col gap-1">
              {group.items.map((item) => {
                const isActive = getIsActive(item.href, item.label);

                if (item.wip) {
                  return (
                    <Tooltip key={item.label}>
                      <TooltipTrigger asChild>
                        <div className={cn(isCollapsed && 'flex justify-center')}>
                          <Button
                            variant="ghost"
                            disabled
                            className={cn(
                              'w-full justify-start gap-2.5 rounded-lg border-0 h-8 px-2.5 opacity-40 cursor-not-allowed select-none hover:bg-transparent',
                              isCollapsed && 'w-10 justify-center px-0'
                            )}
                            aria-label={item.label}
                          >
                            <item.icon className="h-4.5 w-4.5 text-muted-foreground/50 shrink-0" />
                            <span className={cn('truncate text-xs text-muted-foreground/60 text-left', isCollapsed && 'hidden')}>
                              {item.label}
                            </span>
                            {!isCollapsed && (
                              <Lock className="h-3 w-3 ml-auto text-muted-foreground/45 shrink-0" />
                            )}
                          </Button>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side='right'>
                        {item.label} (Coming Soon)
                      </TooltipContent>
                    </Tooltip>
                  );
                }

                return (
                  <Tooltip key={item.label}>
                    <TooltipTrigger asChild>
                      <Link href={item.href}>
                        <Button
                          variant="ghost"
                          className={cn(
                            'w-full justify-start gap-2.5 rounded-lg border-0 transition-all duration-200 h-8 px-2.5',
                            isActive
                              ? 'bg-primary/10 text-primary hover:bg-primary/15 hover:text-primary font-bold'
                              : 'text-muted-foreground hover:text-foreground hover:bg-muted/40 font-semibold',
                            isCollapsed && 'w-10 justify-center px-0'
                          )}
                          aria-label={item.label}
                        >
                          <item.icon className={cn('h-4.5 w-4.5', isActive ? 'text-primary' : 'text-muted-foreground/80')} />
                          <span className={cn('truncate text-xs', isCollapsed && 'hidden')}>
                            {item.label}
                          </span>
                        </Button>
                      </Link>
                    </TooltipTrigger>
                    {isCollapsed && (
                      <TooltipContent side='right'>{item.label}</TooltipContent>
                    )}
                  </Tooltip>
                );
              })}
              {groupIdx < navGroups.length - 1 && (
                <div className="my-1.5 border-t border-border/25 border-dashed" />
              )}
            </div>
          ))}
        </TooltipProvider>
      </nav>

      {/* Footer Settings */}
      <div className='mt-auto pt-3 border-t border-border/30'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href='/templates'>
                <Button
                  variant='ghost'
                  className={cn(
                    'w-full justify-start gap-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg h-8 px-2.5 font-semibold',
                    isCollapsed && 'w-10 justify-center px-0'
                  )}
                >
                  <Settings className='h-4.5 w-4.5' />
                  <span className={cn('text-xs', isCollapsed && 'hidden')}>Settings</span>
                </Button>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side='right'>Settings</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Collapse Toggle Button */}
      <Button
        variant='outline'
        size='icon'
        className='absolute -right-4 top-8 h-8 w-8 rounded-full shadow-xs border-border/60 hover:bg-muted'
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft
          className={cn(
            'h-4 w-4 transition-transform',
            isCollapsed && 'rotate-180'
          )}
        />
      </Button>
    </aside>
  );
}
