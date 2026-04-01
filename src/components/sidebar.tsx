'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BotMessageSquare,
  ChevronLeft,
  Columns3,
  LayoutGrid,
  ListChecks,
  Users,
  Wallet,
  Settings,
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
import { DevFlowProIcon } from './icons';
import { useSidebar } from '@/components/ui/sidebar';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/board', label: 'Kanban Board', icon: Columns3 },
  { href: '/clients', label: 'Clients & CRM', icon: Users },
  { href: '/financials', label: 'Financials', icon: Wallet },
  { href: '/snippets', label: 'AI Snippets', icon: BotMessageSquare },
  { href: '/checklists', label: 'AI Checklists', icon: ListChecks },
];

export function AppSidebar() {
  const pathname = usePathname();
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <aside
      className={cn(
        'relative hidden h-screen flex-col border-r bg-card p-4 transition-all duration-300 ease-in-out md:flex',
        isCollapsed ? 'w-20 items-center' : 'w-64',
      )}
    >
      <div
        className={cn(
          'flex items-center gap-2',
          isCollapsed && 'justify-center',
        )}
      >
        <DevFlowProIcon className='h-8 w-8 text-primary' />
        <h1
          className={cn(
            'text-xl font-bold text-primary transition-opacity',
            isCollapsed && 'opacity-0 w-0',
          )}
        >
          DevFlow
        </h1>
      </div>

      <nav className='mt-8 flex-1 flex-col gap-2 overflow-y-auto'>
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link href={item.href}>
                  <Button
                    variant={pathname === item.href ? 'secondary' : 'ghost'}
                    className={cn(
                      'w-full justify-start gap-3',
                      isCollapsed && 'w-12 justify-center',
                    )}
                    aria-label={item.label}
                  >
                    <item.icon className='h-5 w-5' />
                    <span className={cn('truncate', isCollapsed && 'hidden')}>
                      {item.label}
                    </span>
                  </Button>
                </Link>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side='right'>{item.label}</TooltipContent>
              )}
            </Tooltip>
          ))}
        </TooltipProvider>
      </nav>

      <div className='mt-auto pt-4'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href='/settings'>
                <Button
                  variant='ghost'
                  className={cn(
                    'w-full justify-start gap-3',
                    isCollapsed && 'w-12 justify-center',
                  )}
                >
                  <Settings className='h-5 w-5' />
                  <span className={cn(isCollapsed && 'hidden')}>Settings</span>
                </Button>
              </Link>
            </TooltipTrigger>
            {isCollapsed && (
              <TooltipContent side='right'>Settings</TooltipContent>
            )}
          </Tooltip>
        </TooltipProvider>
      </div>

      <Button
        variant='outline'
        size='icon'
        className='absolute -right-4 top-8 h-8 w-8 rounded-full'
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        <ChevronLeft
          className={cn(
            'h-4 w-4 transition-transform',
            isCollapsed && 'rotate-180',
          )}
        />
      </Button>
    </aside>
  );
}
