'use client';

import { Project, SubTask } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SubtaskItem } from './subtask-item';
import { ListTodo, PlusCircle } from 'lucide-react';
import { countAllSubtasks, countCompletedSubtasks } from './kanban-utils';

interface ProjectDialogSubtasksProps {
  project: Project;
  progress: number;
  onUpdateSubtask: (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean,
  ) => void;
  onRemoveSubtask: (taskId: string) => void;
  onAddChildSubtask: (parentId: string) => void;
  onAddSubtask: () => void;
}

export function ProjectDialogSubtasks({
  project,
  progress,
  onUpdateSubtask,
  onRemoveSubtask,
  onAddChildSubtask,
  onAddSubtask,
}: ProjectDialogSubtasksProps) {
  if (project.subTasks === undefined) return null;

  const [total, done] = countCompletedSubtasks(project.subTasks);
  const subtaskCount = countAllSubtasks(project.subTasks);

  return (
    <div>
      <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
        <ListTodo className='h-5 w-5' />
        Sub-tasks
        <span className='ml-2 text-xs text-muted-foreground'>{subtaskCount || 0}</span>
      </h3>
      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <Progress value={progress} className='h-2' />
          <span className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
            {Math.round(progress)}%
          </span>
          <span className='text-xs text-muted-foreground'>
            {done}/{total}
          </span>
        </div>

        <Accordion type='multiple' className='w-full space-y-2'>
          {[...(project.subTasks || [])]
            .sort((a, b) => Number(a.completed) - Number(b.completed))
            .map((subtask) => (
              <SubtaskItem
                key={subtask.id}
                subtask={subtask}
                onUpdate={onUpdateSubtask}
                onRemove={onRemoveSubtask}
                onAddChild={onAddChildSubtask}
                idPrefix='modal-'
              />
            ))}
        </Accordion>

        <Button onClick={onAddSubtask} variant='outline'>
          <PlusCircle className='mr-2 h-4 w-4' />
          Add Sub-task
        </Button>
      </div>
    </div>
  );
}
