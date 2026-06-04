'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { RepeatsPopover } from '@/components/board/repeats-popover';
import {
  X,
  AlignLeft,
  MessageSquare,
  Check,
  Calendar as CalendarIcon,
  CalendarDays,
  Repeat,
  UserCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface TaskDetailsSidebarProps {
  selectedTaskDetail: {
    task: any;
    groupId: string;
  } | null;
  activeBoardView: string;
  projectTasks: any[];
  onClose: () => void;
  onUpdate: (field: any, value: any) => void;
}

export const TaskDetailsSidebar: React.FC<TaskDetailsSidebarProps> = ({
  selectedTaskDetail,
  activeBoardView,
  projectTasks,
  onClose,
  onUpdate,
}) => {
  if (!selectedTaskDetail) return null;

  const groupTask = projectTasks.find((t) => t.id === selectedTaskDetail.groupId);

  return (
    <div className="fixed right-4 xl:right-8 top-24 z-40 w-[320px] xl:w-[400px] flex flex-col bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden h-[calc(100vh-120px)]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card">
        <div className="flex flex-col gap-1 overflow-hidden">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
            <span className="truncate">{activeBoardView}</span>
            <span>/</span>
            <span className="truncate">{groupTask?.title || 'Group'}</span>
          </div>
          <input
            type="text"
            value={selectedTaskDetail.task.text}
            onChange={(e) => onUpdate('text', e.target.value)}
            className="text-base font-bold bg-transparent border-none p-0 h-auto focus:ring-0 truncate w-full"
            placeholder="Task name"
          />
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-muted-foreground shrink-0 rounded-full"
          onClick={onClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 p-2 px-4 border-b border-border/40 bg-card overflow-x-auto shrink-0">
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 rounded-lg text-primary bg-card">
          <AlignLeft className="w-3.5 h-3.5" /> Details
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 rounded-lg text-muted-foreground hover:text-foreground">
          <MessageSquare className="w-3.5 h-3.5" /> Comments
        </Button>
        <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 rounded-lg text-muted-foreground hover:text-foreground">
          <Check className="w-3.5 h-3.5" /> Subtasks
        </Button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Description */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            <AlignLeft className="w-4 h-4" /> Description
          </label>
          <textarea
            value={selectedTaskDetail.task.description || ''}
            onChange={(e) => onUpdate('description', e.target.value)}
            placeholder="Add more details to this task..."
            className="min-h-[100px] w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/50 focus:outline-hidden focus:ring-1 focus:ring-primary resize-y"
          />
        </div>

        <div className="space-y-4">
          {/* Start Date */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" /> Start date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 justify-start text-left font-normal text-xs px-2 bg-background border-border/60 shadow-none",
                    !selectedTaskDetail.task.startDate && "text-muted-foreground"
                  )}
                >
                  {selectedTaskDetail.task.startDate ? (
                    format(new Date(selectedTaskDetail.task.startDate), 'dd/MM/yyyy')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={selectedTaskDetail.task.startDate ? new Date(selectedTaskDetail.task.startDate) : undefined}
                  onSelect={(date) => onUpdate('startDate', date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Due Date */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-orange-500" /> Due date
            </label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "h-8 justify-start text-left font-normal text-xs px-2 bg-background border-border/60 shadow-none",
                    !selectedTaskDetail.task.dueDate && "text-muted-foreground"
                  )}
                >
                  {selectedTaskDetail.task.dueDate ? (
                    format(new Date(selectedTaskDetail.task.dueDate), 'dd/MM/yyyy')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 z-[60]" align="start">
                <Calendar
                  mode="single"
                  selected={selectedTaskDetail.task.dueDate ? new Date(selectedTaskDetail.task.dueDate) : undefined}
                  onSelect={(date) => onUpdate('dueDate', date?.toISOString())}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Repeats */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <Repeat className="w-4 h-4 text-blue-500" /> Repeats
            </label>
            <div className="h-8 flex items-center bg-background rounded-lg border border-border/60 px-3">
              <RepeatsPopover
                value={selectedTaskDetail.task.repeats}
                onChange={(val) =>
                  onUpdate(
                    'repeats',
                    val === 'none' ? '' : typeof val === 'object' ? JSON.stringify(val) : val
                  )
                }
              />
            </div>
          </div>

          {/* Assignee */}
          <div className="grid grid-cols-[100px_1fr] items-center gap-4">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-purple-500" /> Assignee
            </label>
            <div className="flex items-center gap-2">
              {selectedTaskDetail.task.assignee ? (
                <Badge variant="secondary" className="text-[10px] rounded-full px-2 py-0.5 font-normal flex gap-1 items-center">
                  {selectedTaskDetail.task.assignee}
                  <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => onUpdate('assignee', '')} />
                </Badge>
              ) : (
                <Input
                  placeholder="Name..."
                  className="h-7 w-24 text-[10px] rounded-md border-border/60 bg-background px-2"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onUpdate('assignee', e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
