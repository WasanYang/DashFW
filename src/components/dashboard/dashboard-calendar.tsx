'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import { Task } from '@/lib/types';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  subDays,
  startOfMonth,
  endOfMonth,
  subMonths,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
} from 'date-fns';

interface DashboardCalendarProps {
  tasks: Task[];
}

export function DashboardCalendar({ tasks }: DashboardCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'week' | 'month'>('week');

  // Week days calculation
  const startOfCurrentWeek = useMemo(() => {
    return startOfWeek(currentDate, { weekStartsOn: 1 }); // Monday
  }, [currentDate]);

  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(startOfCurrentWeek, i));
  }, [startOfCurrentWeek]);

  // Month days calculation for Monthly Grid View
  const monthDays = useMemo(() => {
    const startMonth = startOfMonth(currentDate);
    const gridStart = startOfWeek(startMonth, { weekStartsOn: 1 });
    const endMonth = endOfMonth(currentDate);
    const gridEnd = endOfWeek(endMonth, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [currentDate]);

  // Navigate calendar
  const handlePrev = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => subDays(prev, 7));
    } else {
      setCurrentDate((prev) => subMonths(prev, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === 'week') {
      setCurrentDate((prev) => addDays(prev, 7));
    } else {
      setCurrentDate((prev) => addMonths(prev, 1));
    }
  };

  const handleToday = () => setCurrentDate(new Date());

  // Date range title for Week View
  const dateTitle = useMemo(() => {
    if (viewMode === 'month') {
      return format(currentDate, 'MMMM yyyy');
    } else {
      const firstDay = weekDays[0];
      const lastDay = weekDays[6];
      if (firstDay.getMonth() === lastDay.getMonth()) {
        return `${format(firstDay, 'MMMM')} ${format(firstDay, 'yyyy')}`;
      } else if (firstDay.getFullYear() === lastDay.getFullYear()) {
        return `${format(firstDay, 'MMM')} - ${format(lastDay, 'MMM')} ${format(firstDay, 'yyyy')}`;
      } else {
        return `${format(firstDay, 'MMM yyyy')} - ${format(lastDay, 'MMM yyyy')}`;
      }
    }
  }, [currentDate, viewMode, weekDays]);

  return (
    <Card className="border border-border/80 shadow-sm overflow-hidden">
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4 bg-muted/5 border-b border-border/50">
        <div className="flex items-center gap-3">
          <CalendarIcon className="w-5 h-5 text-primary" />
          <span className="text-lg font-bold tracking-tight text-foreground/90">
            {dateTitle}
          </span>
        </div>

        <div className="flex items-center gap-4 flex-wrap print:hidden">
          {/* View Mode Switcher */}
          <div className="flex bg-muted p-1 rounded-xl text-xs border border-border/40">
            <Button
              variant={viewMode === 'week' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === 'week'
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('week')}
            >
              Week
            </Button>
            <Button
              variant={viewMode === 'month' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === 'month'
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('month')}
            >
              Month
            </Button>
          </div>

          <div className="flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/40">
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-3 text-xs rounded-lg font-bold text-muted-foreground hover:text-foreground"
              onClick={handleToday}
            >
              Today
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50"
              onClick={handlePrev}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/50"
              onClick={handleNext}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 overflow-x-auto">
        {viewMode === 'month' ? (
          <div className="min-w-[800px]">
            {/* Day Names Header */}
            <div className="grid grid-cols-7 divide-x divide-border/50 border-b border-border/50 bg-muted/15 font-semibold text-xs text-center py-2.5 text-muted-foreground">
              <div>Mon</div>
              <div>Tue</div>
              <div>Wed</div>
              <div>Thu</div>
              <div>Fri</div>
              <div className="text-primary/70">Sat</div>
              <div className="text-primary/70">Sun</div>
            </div>

            {/* Monthly Days Grid */}
            <div className="grid grid-cols-7 divide-x divide-y divide-border/50 text-sm">
              {monthDays.map((day) => {
                const dayKey = format(day, 'yyyy-MM-dd');
                const dayTasks = tasks.filter(
                  (t) => t.deadline && isSameDay(new Date(t.deadline), day)
                );
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const isToday = isSameDay(day, new Date());

                return (
                  <div
                    key={dayKey}
                    className={cn(
                      "p-2.5 min-h-[110px] flex flex-col gap-2 transition-colors",
                      isCurrentMonth ? "bg-background" : "bg-muted/5 text-muted-foreground/35",
                      isToday && "bg-primary/5"
                    )}
                  >
                    <div className="flex justify-between items-center">
                      <span
                        className={cn(
                          "text-xs font-semibold px-2 py-0.5 rounded-full select-none",
                          isToday ? "bg-primary text-primary-foreground font-bold" : "text-muted-foreground"
                        )}
                      >
                        {format(day, 'd')}
                      </span>
                      {dayTasks.length > 0 && (
                        <span className="text-[9px] font-bold text-primary/70 bg-primary/5 px-1.5 py-0.5 rounded-full border border-primary/10">
                          {dayTasks.length} task{dayTasks.length === 1 ? '' : 's'}
                        </span>
                      )}
                    </div>

                    <div className="flex-1 flex flex-col gap-1 overflow-y-auto max-h-[85px] pr-0.5">
                      {dayTasks.map((t) => (
                        <Link
                          key={t.id}
                          href={t.projectId ? `/board/${t.projectId}` : `/board`}
                          className={cn(
                            "block text-[10px] px-2 py-1.5 rounded-lg font-semibold truncate border leading-tight transition-all duration-150 hover:scale-[1.01] hover:shadow-xs cursor-pointer",
                            t.status === 'Completed' || t.status === 'Paid'
                              ? 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15'
                              : t.status === 'Review'
                              ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15'
                              : t.status === 'In Progress'
                              ? 'bg-primary/10 text-primary border-primary/25 hover:bg-primary/15'
                              : 'bg-muted text-muted-foreground border-muted-foreground/10 hover:bg-muted/90'
                          )}
                          title={`${t.title} (${t.status})`}
                        >
                          {t.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="min-w-[800px] grid grid-cols-7 divide-x divide-border/50 text-sm">
            {weekDays.map((day) => {
              const dayKey = format(day, 'yyyy-MM-dd');
              const dayTasks = tasks.filter(
                (t) => t.deadline && isSameDay(new Date(t.deadline), day)
              );
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={dayKey}
                  className={cn(
                    "p-3 min-h-[260px] flex flex-col gap-3 transition-colors bg-background",
                    isToday && "bg-primary/5"
                  )}
                >
                  {/* Day Header */}
                  <div
                    className={cn(
                      "flex flex-col items-center justify-center py-2.5 rounded-xl border transition-all duration-200",
                      isToday
                        ? "bg-primary text-primary-foreground border-primary shadow-sm"
                        : "bg-muted/30 border-transparent text-muted-foreground"
                    )}
                  >
                    <span className="text-[10px] uppercase font-bold tracking-wider opacity-90">
                      {format(day, 'EEE')}
                    </span>
                    <span className="text-base font-extrabold mt-0.5">
                      {format(day, 'd')}
                    </span>
                  </div>

                  {/* Task Deadlines list */}
                  <div className="flex-1 flex flex-col gap-2 overflow-y-auto max-h-[190px] pr-0.5">
                    {dayTasks.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-muted-foreground/15 rounded-xl p-3 bg-muted/5 min-h-[70px]">
                        <span className="text-[10px] text-muted-foreground/50 font-medium">
                          No deadlines
                        </span>
                      </div>
                    ) : (
                      dayTasks.map((t) => (
                        <Link
                          key={t.id}
                          href={t.projectId ? `/board/${t.projectId}` : `/board`}
                          className={cn(
                            "block text-[11px] p-2.5 rounded-xl font-semibold border leading-tight transition-all duration-200 hover:scale-[1.02] hover:shadow-xs cursor-pointer",
                            t.status === 'Completed' || t.status === 'Paid'
                              ? 'bg-green-500/10 text-green-700 border-green-500/20 hover:bg-green-500/15'
                              : t.status === 'Review'
                              ? 'bg-amber-500/10 text-amber-700 border-amber-500/20 hover:bg-amber-500/15'
                              : t.status === 'In Progress'
                              ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
                              : 'bg-muted text-muted-foreground border-muted-foreground/10 hover:bg-muted/90'
                          )}
                          title={`${t.title} (${t.status})`}
                        >
                          <div className="font-bold text-foreground/90 mb-1.5 truncate">
                            {t.title}
                          </div>
                          <div className="flex justify-between items-center text-[9px] opacity-80 font-normal">
                            <span className="px-1.5 py-0.5 rounded-full bg-background/50 border text-[8px] font-bold uppercase tracking-wider">
                              {t.status}
                            </span>
                            {t.gross_price > 0 && (
                              <span className="font-bold text-foreground/80">
                                ฿{t.gross_price.toLocaleString()}
                              </span>
                            )}
                          </div>
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
