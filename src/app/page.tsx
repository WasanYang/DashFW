'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import app from '@/lib/firebase';

export default function Page() {
  const router = useRouter();
  useEffect(() => {
    const auth = getAuth(app);
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace('/login');
      } else {
        router.replace('/dashboard');
      }
    });
    return () => unsubscribe();
  }, [router]);
  return null;
}
