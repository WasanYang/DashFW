'use client';

import { useState, useEffect, DragEvent, useMemo } from 'react';
import { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Minus, Plus, ChevronDown, ListTodo } from 'lucide-react';
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


interface KanbanCardProps {
  project: Project;
  onDragStart: (e: DragEvent<HTMLDivElement>, projectId: string) => void;
  updateProject: (project: Project) => void;
}

export function KanbanCard({ project, onDragStart, updateProject }: KanbanCardProps) {
  const [timeLeft, setTimeLeft] = useState('');
  const [isSubtasksOpen, setIsSubtasksOpen] = useState(false);

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
        <CardTitle className="text-base">{project.title}</CardTitle>
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

        {project.subTasks && project.subTasks.length > 0 && (
            <Collapsible open={isSubtasksOpen} onOpenChange={setIsSubtasksOpen}>
                <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-start px-0 -mb-2">
                        <ListTodo className="h-4 w-4 mr-2"/>
                        <span>Sub-tasks</span>
                        <ChevronDown className={cn("h-4 w-4 ml-auto transition-transform", isSubtasksOpen && "rotate-180")} />
                    </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-2 mt-2">
                    {project.subTasks.map(subtask => (
                        <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-md bg-muted/50">
                            <Checkbox 
                                id={`subtask-${subtask.id}`} 
                                checked={subtask.completed}
                                onCheckedChange={() => handleSubTaskToggle(subtask.id)}
                            />
                            <Label 
                                htmlFor={`subtask-${subtask.id}`}
                                className={cn("text-sm", subtask.completed && "line-through text-muted-foreground")}
                            >
                                {subtask.text}
                            </Label>
                        </div>
                    ))}
                </CollapsibleContent>
            </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}
