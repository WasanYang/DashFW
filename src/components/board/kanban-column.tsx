'use client';

import { DragEvent } from 'react';
import { Project, ProjectStatus } from '@/lib/types';
import { KanbanCard } from './kanban-card';

interface KanbanColumnProps {
  status: ProjectStatus;
  projects: Project[];
  onDrop: (e: DragEvent<HTMLDivElement>, status: ProjectStatus) => void;
  onDragStart: (
    e: DragEvent<HTMLDivElement>,
    projectId: string,
    index: number,
  ) => void;
  onCardDrop: (
    fromIndex: number,
    toIndex: number,
    status: ProjectStatus,
  ) => void;
  updateProject: (project: Project) => void;
  onCardClick: (project: Project) => void;
}

export function KanbanColumn({
  status,
  projects,
  onDrop,
  onDragStart,
  onCardDrop,
  updateProject,
  onCardClick,
}: KanbanColumnProps) {
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      }}
      onDrop={(e) => {
        // ถ้า drop ที่ column (ไม่ใช่ card) ให้เปลี่ยน status
        e.preventDefault();
        const projectId = e.dataTransfer.getData('projectId');
        if (projectId) {
          // Clear fromIndex so KanbanBoard.handleDrop will process status change
          e.dataTransfer.setData('fromIndex', '');
          onDrop(e, status);
        }
      }}
      className='w-72 flex-shrink-0 rounded-lg bg-card p-2 min-h-[60px] flex flex-col'
      style={{ overflow: 'visible' }}
    >
      <div className='mb-4 flex items-center justify-between p-2'>
        <h3 className='font-semibold text-foreground'>{status}</h3>
        <span className='rounded-full bg-primary/10 px-2 py-1 text-xs font-semibold text-primary'>
          {projects.length}
        </span>
      </div>
      <div className='flex flex-col gap-3 flex-1'>
        {projects.map((project, idx) => (
          <KanbanCard
            key={project.id}
            project={project}
            index={idx}
            status={status}
            onDragStart={(e, projectId, fromIdx) => {
              e.dataTransfer.setData('projectId', projectId);
              e.dataTransfer.setData('fromIndex', String(fromIdx));
              e.dataTransfer.setData('fromStatus', status);
              if (typeof onDragStart === 'function') {
                onDragStart(e, projectId, fromIdx);
              }
            }}
            onDragOver={(e, overIdx, overStatus) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e, toIdx, toStatus) => {
              e.preventDefault();
              const fromIdx = Number(e.dataTransfer.getData('fromIndex'));
              const fromStatus = e.dataTransfer.getData('fromStatus');
              if (!isNaN(fromIdx)) {
                onCardDrop(fromIdx, toIdx, status);
              }
            }}
            updateProject={updateProject}
            onCardClick={onCardClick}
          />
        ))}
      </div>
    </div>
  );
}
