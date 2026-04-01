'use client';

import { notFound, useParams, useRouter } from 'next/navigation';
import { ClientForm, type ClientFormValues } from '@/components/clients/client-form';
import { useClients } from '@/contexts/clients-context';

export default function EditClientPage() {
  const params = useParams();
  const id = typeof params.id === 'string' ? params.id : params.id?.[0];
  const router = useRouter();
  const { clients, updateClient } = useClients();

  if (!id) {
    notFound();
  }

  const client = clients.find((c) => c.id === id);

  if (!client) {
    notFound();
  }

  const handleSubmit = (values: ClientFormValues) => {
    updateClient(client.id, {
      name: values.name,
      email: values.email,
      fastwork_link: values.fastwork_link,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    });
    router.push('/clients');
  };

  return (
    <div className="space-y-8 py-4">
      <ClientForm
        mode="edit"
        defaultValues={{
          name: client.name,
          email: client.email,
          fastwork_link: client.fastwork_link,
          avatarUrl: client.avatarUrl,
        }}
        onSubmit={handleSubmit}
        submitLabel="บันทึกการแก้ไข"
      />
    </div>
  );
}
