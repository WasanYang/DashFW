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
  Globe,
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
import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next-intl/navigation';

const navItems = [
    { href: '/', labelKey: 'dashboard', icon: LayoutGrid },
    { href: '/board', labelKey: 'board', icon: Columns3 },
    { href: '/clients', labelKey: 'clients', icon: Users },
    { href: '/financials', labelKey: 'financials', icon: Wallet },
    { href: '/snippets', labelKey: 'snippets', icon: BotMessageSquare },
    { href: '/checklists', labelKey: 'checklists', icon: ListChecks },
];

export function Header() {
  const tNav = useTranslations('Nav');
  const tHeader = useTranslations('Header');
  const tBreadcrumb = useTranslations('Breadcrumb');
  
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLocale = (nextLocale: string) => {
    router.replace(pathname, { locale: nextLocale, scroll: false });
  };

  const segments = pathname.split('/').filter(Boolean);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 sm:px-6">
      <Sheet>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">{tHeader('toggleMenu')}</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetHeader className="mb-4 text-left">
            <Link href="/" className="flex items-center gap-2">
              <DevFlowProIcon className="h-8 w-8 text-primary" />
              <SheetTitle className="text-xl font-bold text-primary">DevFlow</SheetTitle>
            </Link>
          </SheetHeader>
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary ${
                  pathname === item.href ? 'bg-muted text-primary' : ''
                }`}
              >
                <item.icon className="h-5 w-5" />
                {tNav(item.labelKey as any)}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>

      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/">{tBreadcrumb('dashboard')}</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          {segments.map((segment, index) => {
              const href = `/${segments.slice(0, index + 1).join('/')}`;
              const label = tBreadcrumb(segment as any) || segment.charAt(0).toUpperCase() + segment.slice(1);
              return (
                <React.Fragment key={segment}>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    {index < segments.length - 1 ? (
                      <BreadcrumbLink asChild>
                        <Link href={href}>
                          {label}
                        </Link>
                      </BreadcrumbLink>
                    ) : (
                      <BreadcrumbPage>
                        {label}
                      </BreadcrumbPage>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder={tHeader('search')}
          className="w-full rounded-lg bg-muted pl-8 md:w-[200px] lg:w-[320px]"
        />
      </div>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon">
            <Globe className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{tHeader('language')}</DropdownMenuLabel>
          <DropdownMenuItem onSelect={() => switchLocale('en')} disabled={locale === 'en'}>English</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => switchLocale('th')} disabled={locale === 'th'}>ไทย</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="overflow-hidden rounded-full">
            <User className="h-5 w-5" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>{tHeader('myAccount')}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{tHeader('settings')}</DropdownMenuItem>
          <DropdownMenuItem>{tHeader('support')}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>{tHeader('logout')}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
