'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '@/lib/types';

interface ProjectCalendarTabProps {
  project: Project;
}

export const ProjectCalendarTab: React.FC<ProjectCalendarTabProps> = ({ project }) => {
  return (
    <Card className="border border-border/60 shadow-sm rounded-2xl">
      <CardHeader>
        <CardTitle className="text-lg">Project Timeline & Important Dates</CardTitle>
        <CardDescription>Dates mapped to this project collected from schedule inputs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex gap-4 p-4 border border-border/50 rounded-xl items-center bg-card shadow-xs">
            <div className="p-3 bg-primary/10 text-primary rounded-xl shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Project Start Date</h4>
              <p className="font-bold text-base mt-0.5">
                {project.startDate ? format(new Date(project.startDate), 'PPP') : 'Not Set'}
              </p>
            </div>
          </div>

          <div className="flex gap-4 p-4 border border-border/50 rounded-xl items-center bg-card shadow-xs">
            <div className="p-3 bg-destructive/10 text-destructive rounded-xl shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-xs font-semibold text-muted-foreground uppercase">Project Deadline (Due Date)</h4>
              <p className="font-bold text-base mt-0.5">
                {project.deadline ? format(new Date(project.deadline), 'PPP') : 'Not Set'}
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 space-y-3">
          <h3 className="font-bold text-sm">Key Timeline Events</h3>
          <div className="relative border-l border-border pl-4 ml-2 space-y-4 py-2">
            {project.startDate && (
              <div className="relative">
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-primary ring-4 ring-background" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {format(new Date(project.startDate), 'MMM dd, yyyy')}
                </span>
                <p className="text-xs font-semibold mt-0.5">Kickoff: Project start date recorded</p>
              </div>
            )}
            {project.deadline && (
              <div className="relative">
                <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-destructive ring-4 ring-background" />
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {format(new Date(project.deadline), 'MMM dd, yyyy')}
                </span>
                <p className="text-xs font-semibold mt-0.5">Deadline: Target delivery deadline</p>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
