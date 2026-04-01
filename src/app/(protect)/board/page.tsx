import { KanbanBoard } from '@/components/board/kanban-board';
import { mockClients, mockProjects } from '@/lib/data';

export default async function BoardPage() {
  const translations = {
    pageTitle: 'Kanban Board',
    newProject: 'New Project',
    createNewProjectTitle: 'Create New Project',
    createNewProjectDescription: 'Fill in the details below to add a new project to your board.',
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

  return (
    <div className="flex flex-col h-full">
      <KanbanBoard
        initialProjects={mockProjects}
        clients={mockClients}
        translations={translations}
      />
    </div>
  );
}
