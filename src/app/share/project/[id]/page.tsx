'use client';

import React, { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { useGetProjectsQuery } from '@/services/projectApi';
import { format } from 'date-fns';
import { Clock, CheckCircle2, AlertCircle, Mail, Globe, Sparkles, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { SubTask } from '@/lib/types';

export default function PublicProjectSharePage() {
  const params = useParams();
  const projectId = params?.id as string;

  const { data: projects = [], isLoading } = useGetProjectsQuery();

  const project = useMemo(() => {
    return projects.find((p) => p.id === projectId) || null;
  }, [projects, projectId]);

  // Calculate Subtask Completion
  const stats = useMemo(() => {
    if (!project || !project.subTasks || project.subTasks.length === 0) {
      return { total: 0, completed: 0, percent: 0 };
    }
    
    let total = 0;
    let completed = 0;
    
    const countTasks = (tasks: SubTask[]) => {
      tasks.forEach((task) => {
        total++;
        if (task.completed) completed++;
        if (task.children) countTasks(task.children);
      });
    };
    
    countTasks(project.subTasks);
    return {
      total,
      completed,
      percent: Math.round((completed / total) * 100)
    };
  }, [project]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f4f3f9] flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-sm text-muted-foreground font-semibold">Loading project status portal...</p>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-[#f4f3f9] flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border/80 shadow-md">
          <CardContent className="p-8 text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto" />
            <h2 className="text-xl font-bold">Project Not Found</h2>
            <p className="text-sm text-muted-foreground">
              The project link you followed might be incorrect, deleted, or private.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const renderSubtasksReadOnly = (tasks: SubTask[], level = 0) => (
    <div className="space-y-2.5 mt-1">
      {tasks.map((task) => (
        <div key={task.id} style={{ paddingLeft: `${level * 1.25}rem` }} className="space-y-1">
          <div className="flex items-start gap-2.5">
            <Checkbox
              id={`subtask-${task.id}`}
              checked={task.completed}
              disabled
              className="mt-0.5 border-border/80 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 shrink-0"
            />
            <Label
              htmlFor={`subtask-${task.id}`}
              className={cn(
                "text-sm leading-tight cursor-default select-none",
                task.completed ? "line-through text-muted-foreground font-normal" : "text-slate-800 font-semibold"
              )}
            >
              {task.text}
            </Label>
          </div>
          {task.children && task.children.length > 0 && renderSubtasksReadOnly(task.children, level + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f4f3f9] py-8 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-6">
        
        {/* BRAND HEADER */}
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-extrabold text-xs">
              DF
            </div>
            <span className="font-extrabold text-sm text-slate-800 tracking-tight">DevFlow Pro</span>
          </div>
          <Badge variant="outline" className="bg-green-500/5 text-green-700 border-green-500/20 text-[10px] gap-1 px-2.5 h-6 rounded-full font-bold">
            <ShieldCheck className="w-3.5 h-3.5" /> Client Portal Verified
          </Badge>
        </div>

        {/* MAIN PROGRESS CARD */}
        <Card className="border-0 shadow-md bg-card overflow-hidden rounded-2xl">
          <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-6 sm:p-8 border-b border-border/40">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl sm:text-3xl font-extrabold text-slate-800 tracking-tight">
                  {project.title}
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium">
                  Project Tracking Board for Client
                </CardDescription>
              </div>
              <Badge className={cn("w-fit px-3 py-1 text-xs rounded-full border-0 font-bold",
                project.status === 'Completed' || project.status === 'Paid'
                  ? 'bg-green-500/10 text-green-700'
                  : 'bg-primary/10 text-primary'
              )}>
                {project.status}
              </Badge>
            </div>

            {/* PROGRESS BAR */}
            <div className="mt-6 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-wider">
                <span>Task Completion</span>
                <span>{stats.percent}% ({stats.completed}/{stats.total})</span>
              </div>
              <Progress value={stats.percent} className="h-2.5 bg-slate-200/60" />
            </div>
          </div>

          <CardContent className="p-6 sm:p-8 space-y-8">
            {/* METADATA GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border">
                <Clock className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Project Deadline</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {project.deadline ? format(new Date(project.deadline), 'MMMM dd, yyyy') : 'No Date Set'}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/40 border">
                <Sparkles className="w-5 h-5 text-muted-foreground shrink-0" />
                <div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Revision Count</p>
                  <p className="font-bold text-slate-800 text-sm mt-0.5">
                    {project.revisions} rounds included
                  </p>
                </div>
              </div>
            </div>

            {project.details && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Project Description</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-muted/20 p-4 rounded-xl border border-dashed whitespace-pre-wrap">
                  {project.details}
                </p>
              </div>
            )}

            <Separator className="bg-border/60" />

            {/* TASK CHECKLISTS */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-bold text-slate-800">Milestone Checklists</h3>
              </div>
              
              {project.subTasks && project.subTasks.length > 0 ? (
                <div className="bg-muted/10 p-5 rounded-2xl border space-y-4">
                  {renderSubtasksReadOnly(project.subTasks)}
                </div>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground bg-muted/20 rounded-2xl border border-dashed">
                  No subtasks logged for this project.
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DEVELOPER PROFILE / CONTACT */}
        <Card className="border-0 shadow-sm bg-card rounded-2xl">
          <CardContent className="p-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 text-center sm:text-left flex-col sm:flex-row">
              <Avatar className="h-14 w-14 border-2 border-primary/20 shadow-sm shrink-0">
                <AvatarImage src="" alt="wasan" />
                <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">W</AvatarFallback>
              </Avatar>
              <div>
                <h4 className="font-bold text-slate-800 text-base">wasan</h4>
                <p className="text-xs text-muted-foreground font-medium">Freelance Full-stack Developer & Digital Marketer</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <a
                href="mailto:wasan.dev@gmail.com"
                className="inline-flex items-center gap-2 text-xs font-bold text-white bg-primary hover:bg-primary/95 px-4 py-2.5 rounded-xl shadow-sm transition-colors"
              >
                <Mail className="w-4 h-4" /> Message Developer
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
