import { ClientsProvider } from '@/contexts/clients-context';
import { mockClients } from '@/lib/data';

export default function ClientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div>{children}</div>;
}
