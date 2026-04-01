'use client';

import { useState, useEffect, DragEvent, useMemo } from 'react';
import Link from 'next/link';
import { Project, SubTask } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Minus, Plus, ChevronDown, ListTodo, Trash2, PlusCircle } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Input } from '../ui/input';


interface KanbanCardProps {
  project: Project;
  onDragStart: (e: DragEvent<HTMLDivElement>, projectId: string) => void;
  updateProject: (project: Project) => void;
}

export function KanbanCard({ project, onDragStart, updateProject }: KanbanCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);
  const [newSubtaskText, setNewSubtaskText] = useState('');
  const [isAddSubtaskOpen, setAddSubtaskOpen] = useState(false);

  useEffect(() => {
    const updateTimer = () => {
      if (isPast(project.deadline)) {
        setTimeLeft('Overdue');
      } else {
        setTimeLeft(formatDistanceToNow(project.deadline, { addSuffix: true }));
      }
    };
    updateTimer();
    const interval = setInterval(updateTimer, 60000); // Update every minute
    return () => clearInterval(interval);
  }, [project.deadline]);

  const handleRevisionChange = (increment: number) => {
    const newRevisions = Math.max(0, project.revisions + increment);
    updateProject({ ...project, revisions: newRevisions });
  }

  const handleSubTaskToggle = (subTaskId: string) => {
    const newSubTasks = project.subTasks?.map(st => 
        st.id === subTaskId ? { ...st, completed: !st.completed } : st
    );
    updateProject({ ...project, subTasks: newSubTasks });
  }

  const handleAddSubtask = () => {
    if (newSubtaskText.trim() === '') return;
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: newSubtaskText.trim(),
      completed: false,
    };
    updateProject({ ...project, subTasks: [...(project.subTasks || []), newSubTask] });
    setNewSubtaskText('');
    setAddSubtaskOpen(false);
  };
  
  const handleRemoveSubtask = (subTaskId: string) => {
    updateProject({ ...project, subTasks: project.subTasks?.filter(st => st.id !== subTaskId) });
  };

  const subTaskProgress = useMemo(() => {
    if (!project.subTasks || project.subTasks.length === 0) {
      return 0;
    }
    const completed = project.subTasks.filter(st => st.completed).length;
    return (completed / project.subTasks.length) * 100;
  }, [project.subTasks]);

  return (
    <Card
      draggable
      onDragStart={(e) => onDragStart(e, project.id)}
      className="cursor-grab active:cursor-grabbing"
    >
      <CardHeader className="p-4">
        <Link href={`/board/${project.id}`} className="hover:underline">
            <CardTitle className="text-base">{project.title}</CardTitle>
        </Link>
      </CardHeader>
      <CardContent className="flex flex-col gap-4 p-4 pt-0">
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span className={isPast(project.deadline) ? 'text-destructive' : ''}>
              {timeLeft}
            </span>
          </div>
          <Badge variant="outline">
            ${project.gross_price.toFixed(2)}
          </Badge>
        </div>

        {project.subTasks && project.subTasks.length > 0 && (
          <div>
            <Progress value={subTaskProgress} className="h-2" />
             <p className="text-xs text-muted-foreground mt-1">{Math.round(subTaskProgress)}% complete</p>
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Revisions:</span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleRevisionChange(-1)}>
              <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center font-semibold">{project.revisions}</span>
            <Button variant="outline" size="icon" className="h-6 w-6" onClick={() => handleRevisionChange(1)}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {project.subTasks && (
            <Collapsible open={isSubtasksOpen} onOpenChange={setIsSubtasksOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start px-0 -mb-2">
                        <ListTodo className="h-4 w-4 mr-2"/>
                        <span>Sub-tasks</span>
                        <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isSubtasksOpen && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-4 pt-2 border-t">
                    {project.subTasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2 p-1 rounded-md hover:bg-muted/50">
                            <Checkbox 
                                id={`subtask-${subtask.id}`} 
                                checked={subtask.completed}
                                onCheckedChange={() => handleSubTaskToggle(subtask.id)}
                            />
                            <Label 
                                htmlFor={`subtask-${subtask.id}`}
                                className={cn("text-sm flex-grow", subtask.completed && "line-through text-muted-foreground")}
                            >
                                {subtask.text}
                            </Label>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleRemoveSubtask(subtask.id)}>
                                <Trash2 className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </div>
                    ))}
                    <Popover open={isAddSubtaskOpen} onOpenChange={setAddSubtaskOpen}>
                        <PopoverTrigger asChild>
                            <Button variant="outline" size="sm" className="w-full mt-2">
                                <PlusCircle className="h-4 w-4 mr-2" /> Add sub-task
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-60 p-2">
                            <div className="flex gap-2">
                                <Input
                                placeholder="New sub-task..."
                                value={newSubtaskText}
                                onChange={(e) => setNewSubtaskText(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleAddSubtask() }}
                                />
                                <Button size="sm" onClick={handleAddSubtask}>Add</Button>
                            </div>
                        </PopoverContent>
                    </Popover>
                </CollapsibleContent>
            </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
