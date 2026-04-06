'use client';

import { DragEvent } from 'react';
import { Project, ProjectStatus } from '@/lib/types';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  status: ProjectStatus;
  projects: Project[];
  onDrop: (e: DragEvent<HTMLDivElement>, status: ProjectStatus) => void;
  onDragStart: (e: DragEvent<HTMLDivElement>, projectId: string) => void;
  onDragOver: (e: DragEvent<HTMLDivElement>) => void;
  updateProject: (project: Project) => void;
  onCardClick: (project: Project) => void;
}

export function KanbanColumn({
  status,
  projects,
  onDrop,
  onDragStart,
  onDragOver,
  updateProject,
  onCardClick,
}: KanbanColumnProps) {
  return (
    <div
      onDrop={(e) => onDrop(e, status)}
      onDragOver={onDragOver}
      className="w-72 flex-shrink-0 rounded-lg bg-card p-2 min-h-[60px] flex flex-col"
      style={{ overflow: 'visible' }}
    >
      <div className="mb-4 flex items-center justify-between p-2">
        <h3 className="font-semibold text-foreground">{status}</h3>
        <span className="rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
          {projects.length}
        </span>
      </div>
      <div className="flex flex-col gap-3 flex-1">
        {projects.map((project) => (
          <KanbanCard
            key={project.id}
            project={project}
            onDragStart={onDragStart}
            updateProject={updateProject}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
