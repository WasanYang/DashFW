'use client';

import { useState, useMemo, DragEvent } from 'react';
import { Project, ProjectStatus, Client } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { ProjectDialog } from './project-dialog';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import {
  useAddProjectMutation,
  useUpdateProjectMutation,
} from '@/services/projectApi';

interface KanbanBoardProps {
  initialProjects: Project[];
  clients: Client[];
}

const columns: ProjectStatus[] = [
  'Backlog',
  'In Progress',
  'Review',
  'Completed',
  'Paid',
];

export function KanbanBoard({ initialProjects, clients }: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [modalContent, setModalContent] = useState<Project | 'create' | null>(null);

  const [addProjectMutation] = useAddProjectMutation();
  const [updateProjectMutation] = useUpdateProjectMutation();

  const groupedProjects = useMemo(() => {
    return columns.reduce(
      (acc, status) => {
        acc[status] = projects
          .filter((p) => p.status === status)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return acc;
      },
      {} as Record<ProjectStatus, Project[]>,
    );
  }, [projects]);

  const handleCardDrop = async (
    fromIndex: number,
    toIndex: number,
    fromStatus: string,
    toStatus: string,
  ) => {
    setProjects((prev) => {
      const fromCol = prev
        .filter((p) => p.status === fromStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const toCol = prev
        .filter((p) => p.status === toStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromId = fromCol[fromIndex]?.id;
      if (!fromId) return prev;
      let newProjects = [...prev];
      let updated: Project[] = [];
      if (fromStatus === toStatus) {
        const col = [...fromCol];
        const [moved] = col.splice(fromIndex, 1);
        col.splice(toIndex, 0, moved);
        const colWithOrder = col.map((p, idx) => ({ ...p, order: idx }));
        newProjects = newProjects.map((p) =>
          p.status === fromStatus
            ? colWithOrder.find((c) => c.id === p.id) || p
            : p,
        );
        updated = colWithOrder;
      } else {
        let fromColCopy = [...fromCol];
        let toColCopy = [...toCol];
        const [moved] = fromColCopy.splice(fromIndex, 1);
        const movedWithStatus = { ...moved, status: toStatus as ProjectStatus };
        toColCopy.splice(toIndex, 0, movedWithStatus);
        const fromColWithOrder = fromColCopy.map((p, idx) => ({ ...p, order: idx }));
        const toColWithOrder = toColCopy.map((p, idx) => ({ ...p, order: idx }));
        newProjects = newProjects.map((p) => {
          if (p.id === movedWithStatus.id) return movedWithStatus;
          if (p.status === fromStatus)
            return fromColWithOrder.find((c) => c.id === p.id) || p;
          if (p.status === toStatus)
            return toColWithOrder.find((c) => c.id === p.id) || p;
          return p;
        });
        updated = [movedWithStatus, ...fromColWithOrder, ...toColWithOrder];
      }
      updated.forEach((proj) => {
        updateProjectMutation({
          id: proj.id,
          data: { status: proj.status, order: proj.order },
        });
      });
      return newProjects;
    });
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>, newStatus: ProjectStatus) => {
    console.log('handleDrop', { newStatus });
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    const fromIndex = Number(e.dataTransfer.getData('fromIndex'));
    if (isNaN(fromIndex)) return;
    setProjects((prevProjects) => {
      const projectToMove = prevProjects.find((p) => p.id === projectId);
      if (!projectToMove) return prevProjects;
      const destCol = prevProjects
        .filter((p) => p.status === newStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const newOrder =
        destCol.length > 0
          ? Math.max(...destCol.map((p) => p.order ?? 0)) + 1
          : 0;
      const updatedProject = { ...projectToMove, status: newStatus, order: newOrder };
      const newProjects = prevProjects.map((p) =>
        p.id === projectId ? updatedProject : p,
      );
      updateProjectMutation({
        id: updatedProject.id,
        data: { status: updatedProject.status, order: updatedProject.order },
      });
      return newProjects;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const addProject = async (
    newProjectData: Omit<Project, 'id' | 'status' | 'revisions' | 'order'>,
  ) => {
    try {
      const subTasks = (newProjectData.subTasks || []).map((st) => ({
        ...st,
        completed: false,
      }));
      const backlogProjects = projects.filter((p) => p.status === 'Backlog');
      const maxOrder =
        backlogProjects.length > 0
          ? Math.max(...backlogProjects.map((p) => p.order ?? 0))
          : -1;
      const res = await addProjectMutation({
        ...newProjectData,
        status: 'Backlog',
        revisions: 0,
        subTasks,
        order: maxOrder + 1,
      }).unwrap();
      setProjects((prev) => [res, ...prev]);
      setModalContent(null);
    } catch {
      alert('Failed to add project');
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      await updateProjectMutation({
        id: updatedProject.id,
        data: updatedProject,
      }).unwrap();
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      );
    } catch {
      alert('Failed to update project');
    }
  };

  return (
    <>
      <div className='flex-shrink-0 flex items-center justify-between mb-4'>
        <h1 className='text-3xl font-bold'>Kanban Board</h1>
        <Button onClick={() => setModalContent('create')}>
          <Plus className='mr-2 h-4 w-4' />
          New Project
        </Button>
      </div>

      <ProjectDialog
        modalContent={modalContent}
        clients={clients}
        onClose={() => setModalContent(null)}
        onAddProject={addProject}
        onUpdateProject={updateProject}
      />

      <div className='flex w-full gap-4 overflow-x-auto pb-4 min-h-screen'>
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            projects={groupedProjects[status]}
            onDrop={handleDrop}
            onDragStart={(e, projectId, index) => {
              e.dataTransfer.setData('projectId', projectId);
              e.dataTransfer.setData('fromIndex', String(index));
              e.dataTransfer.setData('fromStatus', status);
            }}
            onCardDrop={(fromIdx, toIdx) =>
              handleCardDrop(fromIdx, toIdx, status, status)
            }
            updateProject={updateProject}
            onCardClick={(project) => setModalContent(project)}
          />
        ))}
      </div>
    </>
  );
}
