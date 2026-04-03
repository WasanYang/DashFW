'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  PanelLeft,
  Search,
  User,
  LayoutGrid,
  Columns3,
  Users,
  Wallet,
  BotMessageSquare,
  ListChecks,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { DevFlowProIcon } from './icons';
import { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { logout } from '@/lib/auth';
import { useRouter } from 'next/navigation';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutGrid },
  { href: '/board', label: 'Kanban Board', icon: Columns3 },
  { href: '/clients', label: 'Clients & CRM', icon: Users },
  { href: '/financials', label: 'Financials', icon: Wallet },
  { href: '/snippets', label: 'AI Snippets', icon: BotMessageSquare },
  { href: '/checklists', label: 'AI Checklists', icon: ListChecks },
];

const breadcrumbLabels: { [key: string]: string } = {
  dashboard: 'Dashboard',
  board: 'Board',
  clients: 'Clients',
  financials: 'Financials',
  snippets: 'Snippets',
  checklists: 'Checklists',
};

export function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const segments = pathname.split('/').filter(Boolean);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUserEmail(user?.email ?? null);
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      // handle error if needed
      console.error('Logout failed:', error);
    }
  };

  return (
    <header className='sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6'>
      <Sheet>
        <SheetTrigger asChild>
          <Button size='icon' variant='outline' className='sm:hidden'>
            <PanelLeft className='h-5 w-5' />
            <span className='sr-only'>Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side='left' className='sm:max-w-xs'>
          <SheetHeader className='mb-4 text-left'>
            <Link href='/' className='flex items-center gap-2'>
              <DevFlowProIcon className='h-8 w-8 text-primary' />
              <SheetTitle className='text-xl font-bold text-primary'>
                DevFlow
              </SheetTitle>
            </Link>
          </SheetHeader>
          <nav className='flex flex-col gap-2'>
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                  pathname === item.href ? 'bg-muted text-primary' : ''
                }`}
              >
                <item.icon className='h-5 w-5' />
                {item.label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <Breadcrumb className='hidden md:flex'>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href='/'>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
            const href = `/${segments.slice(0, index + 1).join('/')}`;
            const label =
              breadcrumbLabels[segment] ||
              segment.charAt(0).toUpperCase() + segment.slice(1);
            return (
              <React.Fragment key={segment}>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  {index < segments.length - 1 ? (
                    <BreadcrumbLink asChild>
                      <Link href={href}>{label}</Link>
                    </BreadcrumbLink>
                  ) : (
                    <BreadcrumbPage>{label}</BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              </React.Fragment>
            );
          })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className='relative ml-auto flex-1 md:grow-0'>
        <Search className='absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground' />
        <Input
          type='search'
          placeholder='Search...'
          className='w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]'
        />
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='outline'
            size='icon'
            className='overflow-hidden rounded-full'
          >
            <User className='h-5 w-5' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
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
          <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
