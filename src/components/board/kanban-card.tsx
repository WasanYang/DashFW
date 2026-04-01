'use client';

import { useState, useEffect, DragEvent } from 'react';
import { Project } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Minus, Plus } from 'lucide-react';
import { formatDistanceToNow, isPast } from 'date-fns';

interface KanbanCardProps {
  project: Project;
  onDragStart: (e: DragEvent<HTMLDivElement>, projectId: string) => void;
  updateProject: (project: Project) => void;
}

export function KanbanCard({ project, onDragStart, updateProject }: KanbanCardProps) {
  const [timeLeft, setTimeLeft] = useState('');

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
      </CardContent>
    </Card>
  );
}
