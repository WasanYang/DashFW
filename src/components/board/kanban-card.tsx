'use client';

import { useState, useEffect, DragEvent, useMemo } from 'react';
import { Project, SubTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Minus,
  Plus,
  ChevronDown,
  ListTodo,
  Trash2,
  PlusCircle,
} from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { Input } from '../ui/input';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';


interface KanbanCardProps {
  project: Project;
  onDragStart: (e: DragEvent<HTMLDivElement>, projectId: string) => void;
  updateProject: (project: Project) => void;
  onCardClick: (project: Project) => void;
}

const calculateProgress = (tasks: SubTask[] | undefined): number => {
    if (!tasks || tasks.length === 0) {
        return 0;
    }

    let totalTasks = 0;
    let completedTasks = 0;

    const countTasks = (tasks: SubTask[]) => {
        tasks.forEach(task => {
            totalTasks++;
            if (task.completed) {
                completedTasks++;
            }
            if (task.children) {
                countTasks(task.children);
            }
        });
    };
    
    countTasks(tasks);

    if (totalTasks === 0) return 0;

    return (completedTasks / totalTasks) * 100;
};

export function KanbanCard({
  project,
  onDragStart,
  updateProject,
  onCardClick,
}: KanbanCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);
  const [subtaskToDelete, setSubtaskToDelete] = useState<SubTask | null>(null);


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

  const handleSubTaskToggle = (subTaskId: string) => {
    const toggleRecursively = (tasks: SubTask[]): SubTask[] => {
      return tasks.map(st => {
        if (st.id === subTaskId) {
          return { ...st, completed: !st.completed };
        }
        if (st.children) {
          return { ...st, children: toggleRecursively(st.children) };
        }
        return st;
      });
    };
    const newSubTasks = toggleRecursively(project.subTasks || []);
    updateProject({ ...project, subTasks: newSubTasks });
  };

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() === '') {
      setIsAddingSubtask(false);
      return;
    }
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    updateProject({
      ...project,
      subTasks: [...(project.subTasks || []), newSubTask],
    });
    setNewSubtaskText('');
    setIsAddingSubtask(false);
  };

  const handleRemoveSubtask = (subtask: SubTask) => {
    setSubtaskToDelete(subtask);
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
  
  const subTaskProgress = useMemo(() => calculateProgress(project.subTasks), [project.subTasks]);

  const renderSubtasks = (tasks: SubTask[], level = 0) => (
    <>
      {tasks.map(subtask => (
        <div key={subtask.id} style={{ marginLeft: `${level * 1}rem` }}>
           <div
            className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/50"
          >
            <Checkbox
              id={`subtask-${subtask.id}`}
              checked={subtask.completed}
              onCheckedChange={() => handleSubTaskToggle(subtask.id)}
            />
            <Label
              htmlFor={`subtask-${subtask.id}`}
              className={cn(
                'text-sm flex-grow',
                subtask.completed && 'line-through text-muted-foreground'
              )}
            >
              {subtask.text}
            </Label>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => handleRemoveSubtask(subtask)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
          {subtask.children && renderSubtasks(subtask.children, level + 1)}
        </div>
      ))}
    </>
  );

  return (
    <>
      <Card
        draggable
        onDragStart={(e) => onDragStart(e, project.id)}
        className="cursor-grab active:cursor-grabbing"
      >
        <CardHeader className="p-4">
          <div
            onClick={() => onCardClick(project)}
            className="cursor-pointer hover:underline"
          >
            <CardTitle className="text-base">{project.title}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              <span
                className={
                  isPast(new Date(project.deadline)) ? 'text-destructive' : ''
                }
              >
                {timeLeft}
              </span>
            </div>
            <Badge variant="outline">${project.gross_price.toFixed(2)}</Badge>
          </div>

          {project.subTasks && project.subTasks.length > 0 && (
            <div>
              <Progress value={subTaskProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {Math.round(subTaskProgress)}% complete
              </p>
            </div>
          )}

          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Revisions:</span>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRevisionChange(-1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-6 text-center font-semibold">
                {project.revisions}
              </span>
              <Button
                variant="outline"
                size="icon"
                className="h-6 w-6"
                onClick={() => handleRevisionChange(1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {project.subTasks && (
            <Collapsible open={isSubtasksOpen} onOpenChange={setIsSubtasksOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-0 -mb-2">
                  <ListTodo className="h-4 w-4 mr-2" />
                  <span>Sub-tasks</span>
                  <ChevronDown
                    className={cn(
                      'h-4 w-4 ml-auto transition-transform',
                      isSubtasksOpen && 'rotate-180'
                    )}
                  />
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2 mt-4 pt-2 border-t">
                {project.subTasks.length > 0 && renderSubtasks(project.subTasks)}
                
                {isAddingSubtask ? (
                    <div className="flex items-center gap-2">
                        <Input
                            placeholder="New sub-task..."
                            value={newSubtaskText}
                            onChange={(e) => setNewSubtaskText(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubtask();
                                if (e.key === 'Escape') setIsAddingSubtask(false);
                            }}
                            autoFocus
                        />
                        <Button size="sm" onClick={handleAddSubtask}>Add</Button>
                    </div>
                ) : (
                    <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => setIsAddingSubtask(true)}
                    >
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Add sub-task
                    </Button>
                )}

              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>
      <DeleteConfirmationDialog
        open={!!subtaskToDelete}
        onOpenChange={(open) => !open && setSubtaskToDelete(null)}
        onConfirm={confirmRemoveSubtask}
        title="Delete Sub-task?"
        description={`Are you sure you want to delete "${subtaskToDelete?.text}"? This will also delete any nested tasks.`}
      />
    </>
  );
}
