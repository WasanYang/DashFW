'use client';

import { ClientList } from "@/components/clients/client-list";
import { useGetTasksQuery } from "@/services/taskApi";

export default function ClientsPage() {
  const { data: tasks = [], isLoading } = useGetTasksQuery();

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-8">
      <ClientList tasks={tasks} />
    </div>
  );
}
