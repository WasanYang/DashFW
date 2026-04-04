'use client';
import { KanbanBoard } from '@/components/board/kanban-board';
import { useGetProjectsQuery } from '@/services/projectApi';
import { useGetClientsQuery } from '@/services/clientApi';

export default function BoardPage() {
  const {
    data: projects = [],
    isLoading: loadingProjects,
    error: errorProjects,
  } = useGetProjectsQuery();
  const {
    data: clients = [],
    isLoading: loadingClients,
    error: errorClients,
  } = useGetClientsQuery();

  if (loadingProjects || loadingClients) {
    return (
      <div className='flex items-center justify-center h-full'>Loading...</div>
    );
  }
  if (errorProjects || errorClients) {
    return (
      <div className='flex items-center justify-center h-full text-destructive'>
        Error loading data
      </div>
    );
  }
  return (
    <div className='flex flex-col h-full'>
      <KanbanBoard initialProjects={projects} clients={clients} />
    </div>
  );
}
