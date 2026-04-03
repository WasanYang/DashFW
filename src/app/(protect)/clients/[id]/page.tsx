'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// This page is deprecated and will redirect to the main clients page.
// All editing is now handled in a dialog on the clients list page.
export default function EditClientPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/clients');
  }, [router]);

  return null;
}
