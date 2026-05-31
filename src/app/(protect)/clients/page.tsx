'use client';

import { ClientList } from "@/components/clients/client-list";
import { useGetProjectsQuery } from "@/services/projectApi";

export default function ClientsPage() {
  const { data: projects = [], isLoading } = useGetProjectsQuery();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <ClientList projects={projects} />
    </div>
  );
}
