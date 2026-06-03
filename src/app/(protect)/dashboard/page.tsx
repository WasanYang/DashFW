'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Play,
  Square,
  Trash2,
  Clock,
  FileText,
  Globe,
  Settings,
} from 'lucide-react';
import { useGetProjectsQuery } from '@/services/projectApi';
import { useGetTasksQuery } from '@/services/taskApi';
import { useGetClientsQuery } from '@/services/clientApi';
import { useGetInvoicesQuery } from '@/services/invoiceApi';
import { useGetProposalsQuery } from '@/services/proposalApi';
import {
  useGetTimeLogsQuery,
  useAddTimeLogMutation,
  useDeleteTimeLogMutation
} from '@/services/timeLogApi';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
} from 'date-fns';
import { DashboardCalendar } from '@/components/dashboard/dashboard-calendar';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LineChart,
  Line,
} from 'recharts';

const CHART_COLORS = ['#f87171', '#c084fc', '#4ade80', '#60a5fa', '#fbbf24'];
const PIE_COLORS = ['#3b82f6', '#f472b6'];

export default function DashboardPage() {
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: tasks = [], isLoading: loadingTasks } = useGetTasksQuery();
  const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
  const { data: invoices = [], isLoading: loadingInvoices } = useGetInvoicesQuery();
  const { data: proposals = [], isLoading: loadingProposals } = useGetProposalsQuery();
  const { data: timeLogs = [], isLoading: loadingTimeLogs } = useGetTimeLogsQuery();

  const [addTimeLog] = useAddTimeLogMutation();
  const [deleteTimeLog] = useDeleteTimeLogMutation();

  const showTimeTracker = false;

  // Time Tracker state
  const [isTracking, setIsTracking] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [trackerTaskName, setTrackerTaskName] = useState('');
  const [trackerProjectId, setTrackerProjectId] = useState('none');
  const [trackerContactId, setTrackerContactId] = useState('none');
  const [trackerBillable, setTrackerBillable] = useState(true);
  const [trackerBillingRate, setTrackerBillingRate] = useState<number | string>('');
  const [trackerCostRate, setTrackerCostRate] = useState<number | string>('');
  const [trackerCategory, setTrackerCategory] = useState('Development');
  const [showSettings, setShowSettings] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Google Calendar Integration states
  const [calendarConnected, setCalendarConnected] = useState(false);
  const [isSyncingCalendar, setIsSyncingCalendar] = useState(false);

  useEffect(() => {
    // Check connection status
    fetch('/api/auth/google/status')
      .then(res => res.json())
      .then(data => setCalendarConnected(!!data.connected))
      .catch(err => console.error('Error fetching calendar status:', err));
  }, []);

  const handleConnectCalendar = () => {
    setIsSyncingCalendar(true);
    window.location.href = '/api/auth/google';
  };

  const handleDisconnectCalendar = async () => {
    setIsSyncingCalendar(true);
    try {
      const res = await fetch('/api/auth/google/status', { method: 'DELETE' });
      if (res.ok) {
        setCalendarConnected(false);
      }
    } catch (err) {
      console.error('Error disconnecting calendar:', err);
    } finally {
      setIsSyncingCalendar(false);
    }
  };

  // Load active timer from localStorage if page refreshes
  useEffect(() => {
    const savedStartTime = localStorage.getItem('dashfw_timer_start');
    const savedTaskName = localStorage.getItem('dashfw_timer_task');
    const savedProjectId = localStorage.getItem('dashfw_timer_project');
    const savedContactId = localStorage.getItem('dashfw_timer_contact');
    const savedBillable = localStorage.getItem('dashfw_timer_billable');
    const savedBillingRate = localStorage.getItem('dashfw_timer_billing_rate');
    const savedCostRate = localStorage.getItem('dashfw_timer_cost_rate');
    const savedCategory = localStorage.getItem('dashfw_timer_category');
    
    if (savedStartTime) {
      const parsedStart = new Date(savedStartTime);
      setStartTime(parsedStart);
      setTrackerTaskName(savedTaskName || '');
      setTrackerProjectId(savedProjectId || 'none');
      setTrackerContactId(savedContactId || 'none');
      setTrackerBillable(savedBillable !== 'false');
      setTrackerBillingRate(savedBillingRate || '');
      setTrackerCostRate(savedCostRate || '');
      setTrackerCategory(savedCategory || 'Development');
      setIsTracking(true);
      
      const secondsDiff = Math.floor((new Date().getTime() - parsedStart.getTime()) / 1000);
      setElapsedSeconds(secondsDiff > 0 ? secondsDiff : 0);
    }
  }, []);

  // Handle ticking
  useEffect(() => {
    if (isTracking && startTime) {
      timerRef.current = setInterval(() => {
        const diff = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        setElapsedSeconds(diff > 0 ? diff : 0);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isTracking, startTime]);

  const handleStartTimer = () => {
    const now = new Date();
    setIsTracking(true);
    setStartTime(now);
    setElapsedSeconds(0);
    
    localStorage.setItem('dashfw_timer_start', now.toISOString());
    localStorage.setItem('dashfw_timer_task', trackerTaskName);
    localStorage.setItem('dashfw_timer_project', trackerProjectId);
    localStorage.setItem('dashfw_timer_contact', trackerContactId);
    localStorage.setItem('dashfw_timer_billable', String(trackerBillable));
    localStorage.setItem('dashfw_timer_billing_rate', String(trackerBillingRate));
    localStorage.setItem('dashfw_timer_cost_rate', String(trackerCostRate));
    localStorage.setItem('dashfw_timer_category', trackerCategory);
  };

  const handleStopTimer = async () => {
    if (!startTime) return;
    setIsTracking(false);
    const endTime = new Date();
    
    // Save to MongoDB
    await addTimeLog({
      projectId: trackerProjectId !== 'none' ? trackerProjectId : undefined,
      taskName: trackerTaskName.trim() || 'General Work',
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      duration: elapsedSeconds,
      note: '',
      contactId: trackerContactId !== 'none' ? trackerContactId : undefined,
      billable: trackerBillable,
      billingRate: trackerBillingRate ? Number(trackerBillingRate) : undefined,
      costRate: trackerCostRate ? Number(trackerCostRate) : undefined,
      category: trackerCategory,
      costStatus: 'Unpaid'
    });
    
    // Clear localStorage
    localStorage.removeItem('dashfw_timer_start');
    localStorage.removeItem('dashfw_timer_task');
    localStorage.removeItem('dashfw_timer_project');
    localStorage.removeItem('dashfw_timer_contact');
    localStorage.removeItem('dashfw_timer_billable');
    localStorage.removeItem('dashfw_timer_billing_rate');
    localStorage.removeItem('dashfw_timer_cost_rate');
    localStorage.removeItem('dashfw_timer_category');
    
    // Reset states
    setTrackerTaskName('');
    setTrackerProjectId('none');
    setTrackerContactId('none');
    setTrackerBillable(true);
    setTrackerBillingRate('');
    setTrackerCostRate('');
    setTrackerCategory('Development');
    setElapsedSeconds(0);
    setStartTime(null);
  };

  const formatDuration = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
      hours.toString().padStart(2, '0'),
      minutes.toString().padStart(2, '0'),
      seconds.toString().padStart(2, '0')
    ].join(':');
  };



  // --- DATA PROCESSING FOR CHARTS ---

  const clientMap = useMemo(() => {
    return new Map(clients.map((c) => [c._id, c.name]));
  }, [clients]);

  // Proposals: real proposals value grouped by client
  const proposalsData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    proposals.forEach((p) => {
      const clientName = p.client?.name || clientMap.get(p.clientId) || 'ทั่วไป';
      groups[clientName] = (groups[clientName] || 0) + (p.total || 0);
    });

    const data = Object.keys(groups).map((key) => ({
      name: key,
      value: groups[key],
    }));

    if (data.length === 0) {
      return [
        { name: 'Sample A', value: 45000 },
        { name: 'Sample B', value: 23000 },
        { name: 'Sample C', value: 12000 },
      ];
    }
    return data.slice(0, 4);
  }, [proposals, clientMap]);

  // Invoices: Paid invoices value grouped by client
  const invoicesData = useMemo(() => {
    const groups: { [key: string]: number } = {};
    invoices
      .filter((inv) => inv.status === 'Paid')
      .forEach((inv) => {
        const clientName = inv.client?.name || clientMap.get(inv.clientId) || 'ทั่วไป';
        groups[clientName] = (groups[clientName] || 0) + (inv.total || 0);
      });

    const data = Object.keys(groups).map((key) => ({
      name: key,
      value: groups[key],
    }));

    if (data.length === 0) {
      return [
        { name: 'Sample A', value: 30000 },
        { name: 'Sample B', value: 18000 },
        { name: 'Sample C', value: 15000 },
      ];
    }
    return data.slice(0, 4);
  }, [invoices, clientMap]);

  // Contracts: Project count grouped by status
  const contractsData = useMemo(() => {
    const counts: { [key: string]: number } = {
      'Backlog': 0,
      'In Progress': 0,
      'Review': 0,
      'Completed': 0,
      'Paid': 0,
    };
    tasks.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });

    return Object.keys(counts).map((key) => ({
      name: key,
      value: counts[key] * 100, // scaled for chart aesthetics
    }));
  }, [tasks]);

  // Projects status distribution (Donut)
  const projectsStatusData = useMemo(() => {
    const statusCounts: { [key: string]: number } = {};
    tasks.forEach((p) => {
      statusCounts[p.status] = (statusCounts[p.status] || 0) + 1;
    });

    const data = Object.keys(statusCounts).map((status) => ({
      name: status,
      value: statusCounts[status],
    }));

    if (data.length === 0) {
      return [
        { name: 'In Progress', value: 3 },
        { name: 'Review', value: 1 },
        { name: 'Backlog', value: 2 },
      ];
    }
    return data;
  }, [tasks]);

  // Tasks Completion rate (Pie)
  const tasksProgressData = useMemo(() => {
    let completed = 0;
    let total = 0;
    tasks.forEach((p) => {
      if (p.subTasks) {
        p.subTasks.forEach((t) => {
          total++;
          if (t.completed) completed++;
        });
      }
    });

    if (total === 0) {
      return [
        { name: 'Completed', value: 10 },
        { name: 'Remaining', value: 5 },
      ];
    }
    return [
      { name: 'Completed', value: completed },
      { name: 'Remaining', value: total - completed },
    ];
  }, [tasks]);

  // Timesheet: Completed projects value over the last 6 months
  const timesheetData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      months.push(subMonths(new Date(), i));
    }

    return months.map((m) => {
      const monthStart = startOfMonth(m);
      const monthEnd = endOfMonth(m);
      const label = format(m, 'MMM');

      const completedVal = tasks
        .filter((p) => {
          if (!p.deadline) return false;
          const d = new Date(p.deadline);
          return d >= monthStart && d <= monthEnd && (p.status === 'Completed' || p.status === 'Paid');
        })
        .reduce((sum, p) => sum + (p.gross_price || 0), 0);

      return {
        name: label,
        value: completedVal,
      };
    });
  }, [tasks]);

  const hasRealData = tasks.length > 0;

  if (
    loadingProjects ||
    loadingTasks ||
    loadingClients ||
    loadingInvoices ||
    loadingProposals ||
    loadingTimeLogs
  ) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard data...</div>;
  }

  return (
    <div className='flex flex-col gap-6 p-1'>
      {/* TIME TRACKER WIDGET */}
      {showTimeTracker && (
        <Card className="border border-border/80 shadow-sm overflow-hidden bg-gradient-to-r from-card to-primary/5">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-1">
                <div className="flex items-center gap-2 shrink-0">
                  <Clock className={`w-5 h-5 text-primary shrink-0 ${isTracking ? 'animate-pulse' : ''}`} />
                  <span className="font-semibold text-sm text-foreground">Time Tracker</span>
                </div>
                <Input
                  type="text"
                  placeholder="What are you working on?"
                  value={trackerTaskName}
                  onChange={(e) => setTrackerTaskName(e.target.value)}
                  disabled={isTracking}
                  className="bg-background border-border/60 focus-visible:ring-primary w-full md:max-w-md h-10 rounded-xl"
                />
                <Select
                  value={trackerProjectId}
                  onValueChange={setTrackerProjectId}
                  disabled={isTracking}
                >
                  <SelectTrigger className="w-full sm:w-[220px] bg-background border-border/60 h-10 rounded-xl">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General Time</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                <span className="font-mono text-2xl font-bold tracking-wider text-foreground select-none mr-2">
                  {formatDuration(elapsedSeconds)}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowSettings((prev) => !prev)}
                  className={cn(
                    "h-10 w-10 rounded-xl border border-border/60 transition-colors",
                    showSettings && "bg-muted text-primary"
                  )}
                  title="Timer Settings"
                >
                  <Settings className="w-4.5 h-4.5" />
                </Button>
                {isTracking ? (
                  <Button
                    onClick={handleStopTimer}
                    variant="destructive"
                    className="w-28 h-10 rounded-xl font-semibold gap-2 shadow-sm shrink-0"
                  >
                    <Square className="w-4 h-4 fill-current" /> Stop
                  </Button>
                ) : (
                  <Button
                    onClick={handleStartTimer}
                    className="w-28 h-10 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-semibold gap-2 shadow-sm shrink-0"
                  >
                    <Play className="w-4 h-4 fill-current" /> Start
                  </Button>
                )}
              </div>
            </div>

            {/* Collapsible Plutio-style settings drawer */}
            {showSettings && (
              <div className="mt-4 pt-4 border-t border-border/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Member / Contact */}
                <div className="space-y-1">
                  <Label htmlFor="trackerContact" className="text-xs font-semibold text-muted-foreground">Assignee / Member</Label>
                  <Select
                    value={trackerContactId}
                    onValueChange={setTrackerContactId}
                    disabled={isTracking}
                  >
                    <SelectTrigger id="trackerContact" className="bg-background border-border/60 h-10 rounded-xl text-xs">
                      <SelectValue placeholder="Select Member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">General (No Assignee)</SelectItem>
                      {clients.map((c) => (
                        <SelectItem key={c._id} value={c._id} className="text-xs">
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <Label htmlFor="trackerCategory" className="text-xs font-semibold text-muted-foreground">Category</Label>
                  <Select
                    value={trackerCategory}
                    onValueChange={setTrackerCategory}
                    disabled={isTracking}
                  >
                    <SelectTrigger id="trackerCategory" className="bg-background border-border/60 h-10 rounded-xl text-xs">
                      <SelectValue placeholder="Select Category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Development" className="text-xs">Development</SelectItem>
                      <SelectItem value="Design" className="text-xs">Design</SelectItem>
                      <SelectItem value="Marketing" className="text-xs">Marketing</SelectItem>
                      <SelectItem value="Consulting" className="text-xs">Consulting</SelectItem>
                      <SelectItem value="Writing" className="text-xs">Writing</SelectItem>
                      <SelectItem value="Support" className="text-xs">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Billing Rate */}
                <div className="space-y-1">
                  <Label htmlFor="trackerBillingRate" className="text-xs font-semibold text-muted-foreground">Billing Rate (/hr)</Label>
                  <Input
                    id="trackerBillingRate"
                    type="number"
                    placeholder="e.g. 50"
                    value={trackerBillingRate}
                    onChange={(e) => setTrackerBillingRate(e.target.value)}
                    disabled={isTracking}
                    className="bg-background border-border/60 h-10 rounded-xl text-xs"
                  />
                </div>

                {/* Cost Rate */}
                <div className="space-y-1">
                  <Label htmlFor="trackerCostRate" className="text-xs font-semibold text-muted-foreground">Cost Rate (/hr)</Label>
                  <Input
                    id="trackerCostRate"
                    type="number"
                    placeholder="e.g. 30"
                    value={trackerCostRate}
                    onChange={(e) => setTrackerCostRate(e.target.value)}
                    disabled={isTracking}
                    className="bg-background border-border/60 h-10 rounded-xl text-xs"
                  />
                </div>

                {/* Billable Checkbox */}
                <div className="flex flex-col justify-center items-center h-full pt-4 md:pt-0">
                  <Label htmlFor="trackerBillable" className="text-xs font-semibold text-muted-foreground mb-1.5">Billable Time</Label>
                  <input
                    id="trackerBillable"
                    type="checkbox"
                    checked={trackerBillable}
                    onChange={(e) => setTrackerBillable(e.target.checked)}
                    disabled={isTracking}
                    className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* SECTION 1: CALENDAR (Top) */}
      <DashboardCalendar tasks={tasks} />

      {/* SECTION 2: 3-COLUMN BAR CHARTS GRID (Middle) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Proposals */}
        <Card className="border border-border/80 shadow-sm relative">
          {proposals.length === 0 && (
            <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs font-semibold text-muted-foreground">⚠️ No real proposals yet</span>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Proposals</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={proposalsData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]}>
                  {proposalsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Invoices */}
        <Card className="border border-border/80 shadow-sm relative">
          {invoices.length === 0 && (
            <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs font-semibold text-muted-foreground">⚠️ No paid invoices yet</span>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Invoices</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={invoicesData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]}>
                  {invoicesData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 1) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Contracts */}
        <Card className="border border-border/80 shadow-sm relative">
          {!hasRealData && (
            <div className="absolute inset-0 z-20 bg-background/60 backdrop-blur-[1px] flex flex-col items-center justify-center">
              <Sparkles className="w-5 h-5 text-muted-foreground mb-1" />
              <span className="text-xs font-semibold text-muted-foreground">⚠️ No active projects yet</span>
            </div>
          )}
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Contracts (Project Flow)</CardTitle>
          </CardHeader>
          <CardContent className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={contractsData}>
                <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {contractsData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[(index + 2) % CHART_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* SECTION 3: CHARTS GRID */}
      <div className={cn(
        "grid grid-cols-1 gap-6",
        showTimeTracker ? "md:grid-cols-3" : "md:grid-cols-2"
      )}>
        {/* Projects status (Donut) */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Projects Status</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={projectsStatusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {projectsStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend iconSize={8} layout="horizontal" align="center" verticalAlign="bottom" />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tasks status (Pie) */}
        <Card className="border border-border/80 shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold">Tasks Progress</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px] flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={tasksProgressData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                  dataKey="value"
                >
                  {tasksProgressData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Timesheet (Line) */}
        {showTimeTracker && (
          <Card className="border border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Timesheet (Monthly Velocity)</CardTitle>
            </CardHeader>
            <CardContent className="h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timesheetData}>
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}
      </div>

      {/* SECTION 4: RECENT TIME LOGS & BILLING OVERVIEW */}
      <div className={cn(
        "grid grid-cols-1 gap-6",
        showTimeTracker ? "lg:grid-cols-3" : "grid-cols-1"
      )}>
        {showTimeTracker && (
          <Card className="lg:col-span-2 border border-border/80 shadow-sm">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary animate-spin-[20s]" /> Recent Time Logs
              </CardTitle>
              <CardDescription>Records of your tracked freelance hours</CardDescription>
            </CardHeader>
            <CardContent className="max-h-[300px] overflow-y-auto pr-1">
              {timeLogs.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No time logs recorded yet. Start tracking above!
                </div>
              ) : (
                <div className="divide-y divide-border/40">
                  {timeLogs.map((log) => (
                    <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-sm truncate">{log.taskName}</p>
                        <p className="text-xs text-muted-foreground truncate flex items-center gap-1.5 flex-wrap mt-0.5">
                          <span>{log.projectTitle || 'General Time'}</span>
                          <span>&bull;</span>
                          <span>{format(new Date(log.startTime), 'MMM d, h:mm a')}</span>
                          {log.category && (
                            <>
                              <span>&bull;</span>
                              <span className="bg-primary/5 text-primary text-[10px] px-1.5 py-0.5 rounded font-medium">{log.category}</span>
                            </>
                          )}
                          {log.billable && (
                            <>
                              <span>&bull;</span>
                              <span className="text-green-600 bg-green-500/10 text-[10px] px-1.5 py-0.5 rounded font-semibold">
                                Billable{log.billingRate ? ` ($${log.billingRate}/hr)` : ''}
                              </span>
                            </>
                          )}
                          {log.contactId && (
                            <>
                              <span>&bull;</span>
                              <span className="text-slate-500 text-[10px]">
                                Member: {clients.find(c => c._id === log.contactId)?.name || 'Unknown'}
                              </span>
                            </>
                          )}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-mono font-semibold bg-primary/10 text-primary px-2.5 py-1 rounded-md">
                          {formatDuration(log.duration)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={() => deleteTimeLog({ id: log.id! })}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}
        
        <Card className={cn("border border-border/80 shadow-sm", showTimeTracker ? "lg:col-span-1" : "w-full")}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" /> Billing Overview
            </CardTitle>
            <CardDescription>Quick summary of invoices & proposals</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3.5 bg-green-500/5 border border-green-500/10 rounded-2xl">
              <div>
                <p className="text-[10px] text-green-600 font-bold uppercase tracking-wider">PAID INVOICES</p>
                <p className="text-xl font-bold text-green-700 mt-0.5">
                  ฿{invoices.filter(i => i.status === 'Paid').reduce((sum, i) => sum + i.total, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="w-8 h-8 text-green-600 opacity-60" />
            </div>
            
            <div className="flex items-center justify-between p-3.5 bg-primary/5 border border-primary/10 rounded-2xl">
              <div>
                <p className="text-[10px] text-primary font-bold uppercase tracking-wider">SENT PROPOSALS</p>
                <p className="text-xl font-bold text-primary mt-0.5">
                  ฿{proposals.filter(p => p.status === 'Sent').reduce((sum, p) => sum + p.total, 0).toLocaleString()}
                </p>
              </div>
              <FileText className="w-8 h-8 text-primary opacity-60" />
            </div>

            {/* Google Calendar Connection Widget */}
            <Separator className="my-3" />
            <div className="flex flex-col gap-2 pt-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Google Calendar</span>
                <Badge variant="outline" className={cn("text-[9px] font-bold px-2 py-0.5 border-0 rounded-full",
                  calendarConnected ? "bg-green-500/10 text-green-700" : "bg-muted text-muted-foreground"
                )}>
                  {calendarConnected ? 'Connected' : 'Not Connected'}
                </Badge>
              </div>
              
              {calendarConnected ? (
                <Button
                  onClick={handleDisconnectCalendar}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs text-destructive hover:text-destructive hover:bg-destructive/5 rounded-xl border-dashed h-9"
                  disabled={isSyncingCalendar}
                >
                  {isSyncingCalendar ? 'Disconnecting...' : 'Disconnect Calendar'}
                </Button>
              ) : (
                <Button
                  onClick={handleConnectCalendar}
                  className="w-full text-xs bg-[#4285F4] hover:bg-[#4285F4]/90 text-white font-semibold rounded-xl h-9 flex items-center justify-center gap-1.5 shadow-sm"
                  disabled={isSyncingCalendar}
                >
                  <Globe className="w-3.5 h-3.5" /> Connect Google Calendar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
