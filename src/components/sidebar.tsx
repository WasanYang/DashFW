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
  FileText,
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

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { href: '/board', label: 'Projects', icon: Columns3 },
  { href: '/clients', label: 'Clients', icon: Users },
  { href: '/invoices', label: 'Invoices & Proposals', icon: FileText },
  { href: '/job-types', label: 'Job Templates', icon: Settings },
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
        isCollapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Profile Section matching reference image */}
      <div
        className={cn(
          'flex items-center gap-3 pb-4 border-b border-border/40 mb-6',
          isCollapsed ? 'justify-center' : 'px-2'
        )}
      >
        <div className='h-9 w-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm select-none shrink-0'>
          W
        </div>
        <div
          className={cn(
            'flex flex-col min-w-0 transition-all duration-200 ease-in-out',
            isCollapsed && 'scale-x-0 opacity-0 hidden'
          )}
        >
          <span className='font-bold text-sm text-foreground truncate'>wasan</span>
          <span className='text-[10px] text-muted-foreground truncate'>freelancer</span>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className='flex-1 flex flex-col gap-1.5 overflow-y-auto'>
        <TooltipProvider delayDuration={0}>
          {navItems.map((item) => {
            const isActive = pathname === item.href;

            return (
              <Tooltip key={item.href}>
                <TooltipTrigger asChild>
                  <Link href={item.href}>
                    <Button
                      variant="ghost"
                      className={cn(
                        'w-full justify-start gap-3 rounded-lg border-0 transition-colors',
                        isActive
                          ? 'bg-[#eae8f3] text-primary hover:bg-[#eae8f3] hover:text-primary font-semibold'
                          : 'text-muted-foreground hover:text-foreground hover:bg-muted/40',
                        isCollapsed && 'w-12 justify-center'
                      )}
                      aria-label={item.label}
                    >
                      <item.icon className={cn('h-5 w-5', isActive ? 'text-primary' : 'text-muted-foreground')} />
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
            );
          })}
        </TooltipProvider>
      </nav>

      {/* Footer Settings */}
      <div className='mt-auto pt-4 border-t border-border/40'>
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Link href='/settings'>
                <Button
                  variant='ghost'
                  className={cn(
                    'w-full justify-start gap-3 text-muted-foreground hover:text-foreground hover:bg-muted/40',
                    isCollapsed && 'w-12 justify-center'
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

      {/* Collapse Toggle Button */}
      <Button
        variant='outline'
        size='icon'
        className='absolute -right-4 top-8 h-8 w-8 rounded-full'
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
