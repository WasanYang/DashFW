'use client';

import { useRouter } from 'next/navigation';
import { ClientForm, type ClientFormValues } from '@/components/clients/client-form';
import { useClients } from '@/contexts/clients-context';

export default function NewClientPage() {
  const router = useRouter();
  const { addClient } = useClients();

  const handleSubmit = (values: ClientFormValues) => {
    addClient({
      name: values.name,
      email: values.email,
      fastwork_link: values.fastwork_link,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    });
    router.push('/clients');
  };

  return (
    <div className="space-y-8 py-4">
      <ClientForm mode="create" onSubmit={handleSubmit} submitLabel="Create Client" />
    </div>
  );
}
