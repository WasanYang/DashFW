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

  const translations = {
    pageTitle: 'Kanban Board',
    newProject: 'New Project',
    createNewProjectTitle: 'Create New Project',
    createNewProjectDescription:
      'Fill in the details below to add a new project to your board.',
    titleLabel: 'Project Title',
    clientLabel: 'Client',
    selectClientPlaceholder: 'Select a client',
    priceLabel: 'Gross Price',
    deadlineLabel: 'Deadline',
    pickDatePlaceholder: 'Pick a date',
    subtasksLabel: 'Sub-tasks',
    addSubtask: 'Add Sub-task',
    removeSubtask: 'Remove',
    createProjectButton: 'Create Project',
    creatingProjectButton: 'Creating...',
    titleRequired: 'Project title is required.',
    clientRequired: 'Please select a client.',
    priceRequired: 'Price must be a positive number.',
    deadlineRequired: 'Deadline is required.',
  };

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
      <KanbanBoard
        initialProjects={projects}
        clients={clients}
        translations={translations}
      />
    </div>
  );
}
