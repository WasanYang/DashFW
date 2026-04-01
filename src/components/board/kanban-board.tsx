'use client';

import { useState, useMemo, DragEvent } from 'react';
import { Project, ProjectStatus, Client } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CreateProjectForm } from './create-project-form';

interface KanbanBoardProps {
  initialProjects: Project[];
  clients: Client[];
  translations: Record<string, string>;
}

const columns: ProjectStatus[] = [
  'Backlog',
  'In Progress',
  'Review',
  'Completed',
  'Paid',
];

export function KanbanBoard({
  initialProjects,
  clients,
  translations,
}: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);

  const groupedProjects = useMemo(() => {
    return columns.reduce((acc, status) => {
      acc[status] = projects.filter((p) => p.status === status);
      return acc;
    }, {} as Record<ProjectStatus, Project[]>);
  }, [projects]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    newStatus: ProjectStatus
  ) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');

    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const updateProject = (updatedProject: Project) => {
    setProjects(
      projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
  };

  const addProject = (
    newProjectData: Omit<Project, 'id' | 'status' | 'revisions'>
  ) => {
    const newProject: Project = {
      ...newProjectData,
      id: `proj-${Date.now()}`,
      status: 'Backlog',
      revisions: 0,
    };
    setProjects((prevProjects) => [newProject, ...prevProjects]);
    setCreateDialogOpen(false);
  };

  return (
    <>
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{translations.pageTitle}</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {translations.newProject}
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{translations.createNewProjectTitle}</DialogTitle>
            <DialogDescription>
              {translations.createNewProjectDescription}
            </DialogDescription>
          </DialogHeader>
          <CreateProjectForm
            clients={clients}
            onSubmit={addProject}
            translations={translations}
          />
        </DialogContent>
      </Dialog>

      <div className="flex flex-grow w-full gap-4 overflow-x-auto pb-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            projects={groupedProjects[status]}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            updateProject={updateProject}
          />
        ))}
      </div>
    </>
  );
}
