'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';
import { format } from 'date-fns';
import { Project } from '@/lib/types';

interface ProjectTimesheetTabProps {
  project: Project;
  projectTimeLogs: any[];
}

export const ProjectTimesheetTab: React.FC<ProjectTimesheetTabProps> = ({
  project,
  projectTimeLogs,
}) => {
  // Helper to format duration
  const formatDurationHours = (totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    return `${hours.toFixed(2)} hrs`;
  };

  // Calculations
  const totalLoggedDuration = projectTimeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalBillableDuration = projectTimeLogs
    .filter((log) => log.billable)
    .reduce((sum, log) => sum + (log.duration || 0), 0);

  const totalBillableEarnings = projectTimeLogs
    .filter((log) => log.billable)
    .reduce((sum, log) => {
      const rate = log.billingRate || project.hourlyRate || 0;
      const hours = (log.duration || 0) / 3600;
      return sum + hours * rate;
    }, 0);

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border border-border/60 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Tracked Time</span>
              <h3 className="text-2xl font-black text-foreground mt-1">{formatDurationHours(totalLoggedDuration)}</h3>
            </div>
            <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Billable Tracked Time</span>
              <h3 className="text-2xl font-black text-primary mt-1">{formatDurationHours(totalBillableDuration)}</h3>
            </div>
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border/60 shadow-sm rounded-2xl">
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Accumulated Billable Earnings</span>
              <h3 className="text-2xl font-black text-green-600 mt-1">
                {project.currency === 'USD' ? '$' : '฿'}
                {totalBillableEarnings.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </h3>
            </div>
            <div className="p-3 bg-green-50 text-green-600 rounded-xl">
              <Clock className="w-5 h-5" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Logs Table */}
      <Card className="border border-border/60 shadow-sm rounded-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Project Time History</CardTitle>
          <CardDescription>All recorded sessions of work logged for this project</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {projectTimeLogs.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">
              No time logs recorded for this project yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-transparent text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                    <th className="p-4">Description</th>
                    <th className="p-4">Billing Rate</th>
                    <th className="p-4">Duration</th>
                    <th className="p-4">Billable</th>
                    <th className="p-4 text-right pr-6">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/20">
                  {projectTimeLogs.map((log) => {
                    const rate = log.billingRate || project.hourlyRate || 0;
                    return (
                      <tr key={log._id || log.id} className="hover:bg-muted/10">
                        <td className="p-4 font-semibold text-foreground/80">{log.taskName}</td>
                        <td className="p-4">
                          {project.currency === 'USD' ? '$' : '฿'}
                          {rate}/hr
                        </td>
                        <td className="p-4 font-bold">{formatDurationHours(log.duration || 0)}</td>
                        <td className="p-4">
                          {log.billable ? (
                            <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">
                              Yes
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-400 border-slate-200">
                              No
                            </Badge>
                          )}
                        </td>
                        <td className="p-4 text-right pr-6 text-muted-foreground font-medium">
                          {log.startTime ? format(new Date(log.startTime), 'dd MMM yyyy') : 'No date'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
