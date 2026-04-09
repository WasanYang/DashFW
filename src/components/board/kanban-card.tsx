'use client';

import { useState, useEffect, DragEvent, useMemo } from 'react';
import { Project, SubTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { JobType } from '@/app/(protect)/job-types/page';
import { useGetJobTypesQuery } from '@/services/jobTypeApiSlice';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Minus, Plus, ChevronDown } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { formatNumber } from '@/lib/number-format';

export interface KanbanCardProps {
  project: Project;
  onDragStart: (
    e: DragEvent<HTMLDivElement>,
    projectId: string,
    index: number,
    status: string,
  ) => void;
  onDragOver?: (
    e: DragEvent<HTMLDivElement>,
    index: number,
    status: string,
  ) => void;
  onDrop?: (
    e: DragEvent<HTMLDivElement>,
    index: number,
    status: string,
  ) => void;
  index: number;
  updateProject: (project: Project) => void;
  onCardClick: (project: Project) => void;
  status: string;
}

// Only count root sub-tasks for progress
const calculateProgress = (tasks: SubTask[] | undefined): number => {
  if (!tasks || tasks.length === 0) {
    return 0;
  }
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((task) => task.completed).length;
  if (totalTasks === 0) return 0;
  return (completedTasks / totalTasks) * 100;
};

export function KanbanCard({
  project,
  onDragStart,
  onDragOver,
  onDrop,
  index,
  updateProject,
  onCardClick,
  status,
}: KanbanCardProps) {
  const { data: jobTypes = [] } = useGetJobTypesQuery();
  const [subtaskToDelete, setSubtaskToDelete] = useState<SubTask | null>(null);
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [timeLeft, setTimeLeft] = useState('');
  const subTaskProgress = useMemo(
    () => calculateProgress(project.subTasks),
    [project.subTasks],
  );

  useEffect(() => {
    const deadlineDate = new Date(project.deadline);
    const updateTimer = () => {
      if (isPast(deadlineDate)) {
        setTimeLeft('Overdue');
      } else {
        setTimeLeft(formatDistanceToNow(deadlineDate, { addSuffix: true }));
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [project.deadline]);

  const handleRevisionChange = (increment: number) => {
    const newRevisions = Math.max(0, project.revisions + increment);
    updateProject({ ...project, revisions: newRevisions });
  };

  const confirmRemoveSubtask = () => {
    if (!subtaskToDelete) return;
    const removeRecursively = (tasks: SubTask[], id: string): SubTask[] => {
      let newTasks: SubTask[] = [];
      for (const task of tasks) {
        if (task.id === id) {
          continue;
        }
        if (task.children) {
          task.children = removeRecursively(task.children, id);
        }
        newTasks.push(task);
      }
      return newTasks;
    };
    updateProject({
      ...project,
      subTasks: removeRecursively(project.subTasks || [], subtaskToDelete.id),
    });
    setSubtaskToDelete(null);
  };
  // Count all subtasks recursively
  const countAllSubtasks = (tasks: SubTask[]): number => {
    let count = 0;
    for (const task of tasks) {
      count++;
      if (task.children) {
        count += countAllSubtasks(task.children);
      }
    }
    return count;
  };

  const renderSubtasksPreview = (tasks: SubTask[]) => {
    const totalSubtasks = countAllSubtasks(tasks);
    if (!tasks || tasks.length === 0) {
      return (
        <div className='flex flex-col gap-1 relative'>
          <span className='absolute right-0 top-0 text-xs text-muted-foreground'>
            0 sub task
          </span>
        </div>
      );
    }
    const preview = tasks.slice(0, 2);
    const restCount = tasks.length - preview.length;
    return (
      <div className='flex flex-col gap-1 relative'>
        {/* Subtask count on the right */}
        <span className='absolute right-0 top-0 text-xs text-muted-foreground'>
          {totalSubtasks} sub task{totalSubtasks !== 1 ? 's' : ''}
        </span>
        {preview.map((subtask) => (
          <div key={subtask.id} className='flex items-center gap-2'>
            <Checkbox
              id={`subtask-preview-${subtask.id}`}
              checked={subtask.completed}
              disabled
            />
            <Label
              htmlFor={`subtask-preview-${subtask.id}`}
              className={cn(
                'text-xs flex-grow truncate',
                subtask.completed && 'line-through text-muted-foreground',
              )}
              title={subtask.text}
            >
              {subtask.text}
            </Label>
          </div>
        ))}
        {restCount > 0 && (
          <span className='text-xs text-muted-foreground'>
            +{restCount} more
          </span>
        )}
      </div>
    );
  };

  // หา jobType name จาก jobTypes
  const jobTypeName = jobTypes.find((jt) => jt._id === project.jobTypeId)?.name;

  return (
    <>
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, project.id, index, status)}
        onDragOver={
          onDragOver ? (e) => onDragOver(e, index, status) : undefined
        }
        onDrop={onDrop ? (e) => onDrop(e, index, status) : undefined}
        className='cursor-grab active:cursor-grabbing'
      >
        <CardHeader className='p-4 flex flex-row items-center justify-between'>
          <div
            onClick={() => onCardClick(project)}
            className='cursor-pointer  flex-1 min-w-0'
          >
            <CardTitle
              className='text-base truncate max-w-full hover:underline'
              title={project.title}
            >
              {project.title}
            </CardTitle>
            <div className='flex flex-row gap-2 items-center mt-1'>
              {project.client?.name && (
                <div className='text-xs text-muted-foreground truncate'>
                  {project.client.name.trim()}
                </div>
              )}
              {jobTypeName && (
                <div className='text-[11px] text-muted-foreground bg-transparent px-1 py-0.5 truncate font-normal'>
                  {jobTypeName}
                </div>
              )}
            </div>
          </div>
          <Button
            variant='ghost'
            size='icon'
            className='ml-2 h-6 w-6 flex-shrink-0'
            aria-label={isCollapsed ? 'Show details' : 'Hide details'}
            onClick={() => setIsCollapsed((prev) => !prev)}
            tabIndex={0}
          >
            <ChevronDown
              className={`h-4 w-4 transition-transform ${isCollapsed ? '-rotate-90' : 'rotate-0'}`}
            />
          </Button>
        </CardHeader>
        {!isCollapsed && (
          <CardContent className='flex flex-col gap-4 p-4 pt-0'>
            <div className='flex items-center justify-between text-sm text-muted-foreground'>
              <div className='flex items-center gap-1'>
                <Clock className='h-4 w-4' />
                <span
                  className={
                    isPast(new Date(project.deadline)) ? 'text-destructive' : ''
                  }
                >
                  {timeLeft}
                </span>
              </div>
              <Badge variant='outline'>
                {formatNumber(project.gross_price)}
              </Badge>
            </div>

            {project.subTasks && project.subTasks.length > 0 && (
              <div>
                {renderSubtasksPreview(project.subTasks)}
                <Progress value={subTaskProgress} className='h-2 mt-2' />
                <p className='text-xs text-muted-foreground mt-1'>
                  {Math.round(subTaskProgress)}% complete
                </p>
              </div>
            )}

            <div className='items-center justify-between hidden'>
              <span className='text-sm font-medium'>Revisions:</span>
              <div className='flex items-center gap-1'>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => handleRevisionChange(-1)}
                >
                  <Minus className='h-4 w-4' />
                </Button>
                <span className='w-6 text-center font-semibold'>
                  {project.revisions}
                </span>
                <Button
                  variant='outline'
                  size='icon'
                  className='h-6 w-6'
                  onClick={() => handleRevisionChange(1)}
                >
                  <Plus className='h-4 w-4' />
                </Button>
              </div>
            </div>
          </CardContent>
        )}
      </Card>
      <DeleteConfirmationDialog
        open={!!subtaskToDelete}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
        onConfirm={confirmRemoveSubtask}
        title='Delete Sub-task?'
        description={`Are you sure you want to delete "${subtaskToDelete?.text}"? This will also delete any nested tasks.`}
      />
    </>
  );
}
