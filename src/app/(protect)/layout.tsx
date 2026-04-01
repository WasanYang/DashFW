import type { Metadata } from 'next';
import { Toaster } from '@/components/ui/toaster';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/sidebar';
import { Header } from '@/components/header';

export const metadata: Metadata = {
  title: 'DevFlow Pro',
  description:
    'A personalized project management tool for a Full-stack Developer & Digital Marketer.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className='font-body antialiased'>
      <SidebarProvider>
        <div className='flex h-screen overflow-hidden bg-background'>
          <AppSidebar />
          <div className='flex flex-1 flex-col min-w-0'>
            <Header />
            <main className='flex-1 overflow-y-auto bg-muted/40 p-4 sm:p-6 md:p-8'>
              {children}
            </main>
          </div>
        </div>
      </SidebarProvider>
      <Toaster />
    </div>
  );
}
