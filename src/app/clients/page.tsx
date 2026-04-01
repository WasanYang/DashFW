import { ClientList } from "@/components/clients/client-list";
import { mockClients, mockProperties } from "@/lib/data";

export default function ClientsPage() {
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Client & Property CRM</h1>
            <ClientList clients={mockClients} properties={mockProperties} />
        </div>
    );
}
