'use client';

import { useState, useMemo, DragEvent } from 'react';
import { Project, ProjectStatus } from '@/lib/types';
import { KanbanColumn } from './kanban-column';

interface KanbanBoardProps {
  initialProjects: Project[];
}

const columns: ProjectStatus[] = [
  'Backlog',
  'In Progress',
  'Review',
  'Completed',
  'Paid',
];

export function KanbanBoard({ initialProjects }: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);

  const groupedProjects = useMemo(() => {
    return columns.reduce((acc, status) => {
      acc[status] = projects.filter((p) => p.status === status);
      return acc;
    }, {} as Record<ProjectStatus, Project[]>);
  }, [projects]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>, newStatus: ProjectStatus) => {
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
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  }

  return (
    <div className="flex h-[calc(100vh-10rem)] w-full gap-4 overflow-x-auto pb-4">
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
  );
}
