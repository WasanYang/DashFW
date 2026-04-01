import { ClientList } from "@/components/clients/client-list";
import { mockClients, mockProperties } from "@/lib/data";
import { getTranslations } from "next-intl/server";

export default async function ClientsPage() {
    const t = await getTranslations('Clients');
    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">{t('title')}</h1>
            <ClientList clients={mockClients} properties={mockProperties} />
        </div>
    );
}
