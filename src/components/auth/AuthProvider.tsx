'use client';
import { ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import app from '@/lib/firebase';

interface AuthProviderProps {
  children: ReactNode;
  redirectTo?: string; // path ที่จะ redirect ถ้าไม่ได้ login (เช่น '/login')
  requireAuth?: boolean; // ถ้า true จะ redirect ถ้าไม่ได้ login
}

export function AuthProvider({
  children,
  redirectTo = '/login',
  requireAuth = true,
}: AuthProviderProps) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user: User | null) => {
      if (requireAuth && !user) {
        router.replace(redirectTo);
      } else if (user && pathname === '/') {
        console.log(user, pathname);
        router.replace('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router, redirectTo, requireAuth, pathname]);

  return <>{children}</>;
}
