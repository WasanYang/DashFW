'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useGetProjectsQuery, useAddProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '@/services/projectApi';
import { useGetClientsQuery } from '@/services/clientApi';
import { useGetTasksQuery } from '@/services/taskApi';
import { useGetTimeLogsQuery } from '@/services/timeLogApi';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Plus, Search, Calendar as CalendarIcon, Briefcase, Trash2, FolderOpen, ArrowRight, ExternalLink, LayoutGrid, Table, Archive, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function ProjectsPage() {
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
  const { data: tasks = [], isLoading: loadingTasks } = useGetTasksQuery();
  const { data: timeLogs = [], isLoading: loadingTimeLogs } = useGetTimeLogsQuery();
  const [addProject, { isLoading: isCreating }] = useAddProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // View mode and Archive states
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [showArchived, setShowArchived] = useState(false);

  // Active (non-archived) projects for status counting
  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const metrics = useMemo(() => {
    const counts = {
      Total: activeProjects.length,
      New: 0,
      'In progress': 0,
      Pending: 0,
      Delayed: 0,
      Completed: 0,
      Canceled: 0,
    };
    activeProjects.forEach((p) => {
      const s = p.status || 'New';
      if (counts[s] !== undefined) {
        counts[s]++;
      } else {
        counts['New']++;
      }
    });
    return counts;
  }, [activeProjects]);

  // Calculate spent budget for a project
  const getProjectBudgetStats = (project: any) => {
    const projectTimeLogs = timeLogs.filter((log) => log.projectId === project.id);
    const spent = projectTimeLogs.filter((log) => log.billable).reduce((sum, log) => {
      const rate = log.billingRate || project.hourlyRate || 0;
      const hours = (log.duration || 0) / 3600;
      return sum + (hours * rate);
    }, 0);
    const total = project.gross_price || 0;
    const pct = total > 0 ? (spent / total) * 100 : 0;
    const currencySym = project.currency === 'USD' ? '$' : '฿';
    return {
      spent,
      total,
      pct: pct.toFixed(2),
      formatted: `${currencySym}${spent.toFixed(2)}/${currencySym}${total.toFixed(2)} (${pct.toFixed(2)}%)`
    };
  };

  // New Project Form State
  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newGrossPrice, setNewGrossPrice] = useState<number>(0);
  const [newHourlyRate, setNewHourlyRate] = useState<number>(0);
  const [newCurrency, setNewCurrency] = useState('THB');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newBillable, setNewBillable] = useState(true);

  const handleToggleArchive = async (id: string, currentArchived: boolean) => {
    try {
      await updateProject({ id, data: { archived: !currentArchived } }).unwrap();
      toast({
        title: 'สำเร็จ!',
        description: !currentArchived ? 'จัดเก็บโครงการเรียบร้อยแล้ว' : 'กู้คืนโครงการเรียบร้อยแล้ว',
      });
    } catch (err) {
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถเปลี่ยนสถานะโครงการได้',
        variant: 'destructive',
      });
    }
  };

  // Filter projects by search query and archive status
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (!showArchived) {
      list = list.filter((p) => !p.archived);
    }
    const query = searchQuery.toLowerCase().trim();
    if (!query) return list;
    return list.filter((p) => {
      const client = clients.find((c) => c._id === p.clientId);
      return (
        p.title.toLowerCase().includes(query) ||
        (p.subtitle && p.subtitle.toLowerCase().includes(query)) ||
        (client && client.name.toLowerCase().includes(query))
      );
    });
  }, [projects, searchQuery, clients, showArchived]);

  // Calculate task counts and progress for each project
  const projectStats = useMemo(() => {
    const statsMap = new Map();
    projects.forEach(p => {
      const projTasks = tasks.filter(t => t.projectId === p.id);
      const total = projTasks.length;
      const completed = projTasks.filter(t => t.status === 'Completed' || t.status === 'Paid').length;
      const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
      statsMap.set(p.id, { total, completed, progress });
    });
    return statsMap;
  }, [projects, tasks]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newClientId) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'กรุณากรอกชื่อโครงการและเลือกลูกค้า', variant: 'destructive' });
      return;
    }

    try {
      await addProject({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || undefined,
        clientId: newClientId,
        details: newDetails.trim() || undefined,
        startDate: newStartDate ? new Date(newStartDate) : undefined,
        deadline: newDeadline ? new Date(newDeadline) : undefined,
        gross_price: newGrossPrice,
        hourlyRate: newHourlyRate || undefined,
        currency: newCurrency,
        color: newColor,
        billable: newBillable,
        archived: false,
        status: 'New',
      }).unwrap();

      toast({ title: 'สำเร็จ!', description: 'สร้างโครงการใหม่เรียบร้อยแล้ว' });
      setIsCreateOpen(false);
      resetForm();
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้างโครงการได้', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!projectToDelete) return;
    try {
      await deleteProject({ id: projectToDelete }).unwrap();
      toast({ title: 'สำเร็จ!', description: 'ลบโครงการเรียบร้อยแล้ว' });
      setProjectToDelete(null);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบโครงการได้', variant: 'destructive' });
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewSubtitle('');
    setNewClientId('');
    setNewDetails('');
    setNewGrossPrice(0);
    setNewHourlyRate(0);
    setNewCurrency('THB');
    setNewStartDate('');
    setNewDeadline('');
    setNewColor('#3b82f6');
    setNewBillable(true);
  };

  if (loadingProjects || loadingClients || loadingTasks || loadingTimeLogs) {
    return <div className="p-8 text-center text-muted-foreground">กำลังโหลดรายการโครงการ...</div>;
  }

  return (
    <div className="flex flex-col gap-6 p-4 max-w-7xl mx-auto w-full">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-6 rounded-2xl border border-border/80 shadow-xs">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground/90">Projects Workspace</h1>
          <p className="text-xs text-muted-foreground mt-1">
            พื้นที่เก็บโครงการระดับบนสไตล์ Plutio จัดการเวลา งาน และใบแจ้งหนี้แบบรายเดือนแยกแต่ละโครงการ
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="rounded-xl font-bold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shrink-0 shadow-sm">
          <Plus className="w-4 h-4" /> New Project Container
        </Button>
      </div>

      {/* STATUS METRICS BAR */}
      <div className="flex flex-wrap sm:flex-nowrap w-full rounded-xl overflow-hidden border border-border/40 select-none shadow-2xs">
        <div className="flex-1 min-w-[120px] bg-[#334155] text-white py-3 px-4 flex items-center justify-center gap-2 border-r border-b sm:border-b-0 border-white/10 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics.Total}</span>
          <span>Projects</span>
        </div>
        <div className="flex-1 min-w-[120px] bg-[#3b82f6] text-white py-3 px-4 flex items-center justify-center gap-2 border-r border-b sm:border-b-0 border-white/10 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics.New}</span>
          <span>New</span>
        </div>
        <div className="flex-1 min-w-[120px] bg-[#22c55e] text-white py-3 px-4 flex items-center justify-center gap-2 border-r border-b sm:border-b-0 border-white/10 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics['In progress']}</span>
          <span>In progress</span>
        </div>
        <div className="flex-1 min-w-[120px] bg-[#f97316] text-white py-3 px-4 flex items-center justify-center gap-2 border-r border-b sm:border-b-0 border-white/10 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics.Pending}</span>
          <span>Pending</span>
        </div>
        <div className="flex-1 min-w-[120px] bg-[#ef4444] text-white py-3 px-4 flex items-center justify-center gap-2 border-r border-b sm:border-b-0 border-white/10 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics.Delayed}</span>
          <span>Delayed</span>
        </div>
        <div className="flex-1 min-w-[120px] bg-[#475569] text-white py-3 px-4 flex items-center justify-center gap-2 border-r border-white/10 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics.Completed}</span>
          <span>Completed</span>
        </div>
        <div className="flex-1 min-w-[120px] bg-[#64748b] text-white py-3 px-4 flex items-center justify-center gap-2 text-xs font-bold transition-all">
          <span className="bg-black/20 text-white px-2 py-0.5 rounded-md min-w-[20px] text-center">{metrics.Canceled}</span>
          <span>Canceled</span>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/75" />
          <Input
            placeholder="ค้นหาชื่อโครงการ, ลูกค้า..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10 rounded-xl border-border/70 bg-background/50 w-full"
          />
        </div>

        {/* View Switcher & Archived toggle */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Show/Hide Archived button */}
          <Button
            variant={showArchived ? 'default' : 'outline'}
            size="sm"
            onClick={() => setShowArchived(!showArchived)}
            className={cn(
              "h-9 rounded-xl border-border/70 text-xs font-semibold gap-1.5 shrink-0 transition-all",
              showArchived ? "bg-muted text-primary border-primary/45" : "bg-background/50 shadow-2xs"
            )}
          >
            <Archive className="w-3.5 h-3.5" /> {showArchived ? 'Hide Archived' : 'Show Archived'}
          </Button>

          {/* View switcher */}
          <div className="flex bg-muted p-1 rounded-xl text-xs border border-border/40 shrink-0 shadow-2xs">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === 'grid'
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Card Grid
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === 'table'
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('table')}
            >
              <Table className="mr-1.5 h-3.5 w-3.5" /> Table View
            </Button>
          </div>
        </div>
      </div>

      {/* PROJECTS LIST */}
      {filteredProjects.length === 0 ? (
        <Card className="border border-dashed border-border/70 p-12 text-center rounded-2xl">
          <CardContent className="space-y-4">
            <FolderOpen className="w-12 h-12 text-muted-foreground/50 mx-auto" />
            <h3 className="font-bold text-lg">ยังไม่มีโครงการในระบบ</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              สร้างตู้เก็บโครงการย่อยตัวแรกของคุณ เพื่อจัดการบอร์ดงาน ใบแจ้งหนี้ และเวลาทำงานแยกต่างหาก
            </p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="rounded-xl">
              เริ่มต้นสร้างโครงการ ➔
            </Button>
          </CardContent>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => {
            const client = clients.find(c => c._id === project.clientId);
            const stats = projectStats.get(project.id) || { total: 0, completed: 0, progress: 0 };
            
            return (
              <Card 
                key={project.id} 
                className="overflow-hidden border border-border/60 hover:shadow-md transition-all duration-200 bg-card rounded-2xl flex flex-col group relative"
                style={{ borderTop: project.color ? `5px solid ${project.color}` : undefined }}
              >
                {/* Archived Banner */}
                {project.archived && (
                  <Badge variant="destructive" className="absolute top-3 right-3 text-[9px] font-bold uppercase py-0.5 px-2 rounded h-5">
                    Archived
                  </Badge>
                )}

                <CardHeader className="p-5 pb-3">
                  <div className="flex justify-between items-start gap-2">
                    <div className="min-w-0">
                      <h3 className="font-black text-lg text-foreground truncate group-hover:text-primary transition-colors">
                        {project.title}
                      </h3>
                      {project.subtitle && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{project.subtitle}</p>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-5 pt-0 flex-grow flex flex-col gap-4">
                  {/* Client Info */}
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 border shadow-3xs">
                      <AvatarImage src={client?.avatarUrl} />
                      <AvatarFallback className="text-[10px] font-bold bg-primary/5 text-primary">
                        {client?.name ? client.name.charAt(0) : '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-bold text-foreground/80">{client?.name || 'Unknown Client'}</span>
                  </div>

                  {/* Date details */}
                  <div className="grid grid-cols-2 gap-2 text-xs border-t border-border/30 pt-3">
                    <div className="text-muted-foreground">
                      <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Start Date</span>
                      <span className="font-semibold text-foreground/80">
                        {project.startDate ? format(new Date(project.startDate), 'dd MMM yyyy') : 'No date'}
                      </span>
                    </div>
                    <div className="text-muted-foreground">
                      <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Deadline</span>
                      <span className="font-semibold text-foreground/80">
                        {project.deadline ? format(new Date(project.deadline), 'dd MMM yyyy') : 'No date'}
                      </span>
                    </div>
                  </div>

                  {/* Progress details */}
                  <div className="space-y-1.5 mt-2">
                    <div className="flex justify-between text-xs font-bold text-muted-foreground">
                      <span>Progress</span>
                      <span>{stats.progress}% ({stats.completed}/{stats.total} Tasks)</span>
                    </div>
                    <Progress value={stats.progress} className="h-1.5" />
                  </div>

                  {/* Pricing detail */}
                  <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-1 text-xs">
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-muted-foreground/60 tracking-wider">Project Value</span>
                      <span className="font-black text-sm text-foreground/80">
                        {project.gross_price ? `${project.currency === 'USD' ? '$' : '฿'}${project.gross_price.toLocaleString()}` : 'Free/Hourly'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        className={cn(
                          "h-8 w-8 text-muted-foreground transition-colors hover:bg-muted rounded-lg",
                          project.archived ? "text-destructive hover:text-destructive/80" : "hover:text-primary"
                        )}
                        onClick={(e) => {
                          e.preventDefault();
                          handleToggleArchive(project.id, !!project.archived);
                        }}
                        title={project.archived ? "Restore from Archive" : "Archive Project"}
                      >
                        <Archive className="h-4 w-4" />
                      </Button>
                 ) : (
        <Card className="border border-border/50 shadow-sm overflow-hidden bg-card rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-muted/5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 text-left">
                  <th className="py-3 px-5 w-12 text-center"></th>
                  <th className="py-3 px-5">Project</th>
                  <th className="py-3 px-5">Project Client</th>
                  <th className="py-3 px-5 w-44">Status</th>
                  <th className="py-3 px-5 w-20">Members</th>
                  <th className="py-3 px-5 w-48">Progress</th>
                  <th className="py-3 px-5">Budget</th>
                  <th className="py-3 px-5 w-32 text-right pr-8">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredProjects.map((project) => {
                  const client = clients.find(c => c._id === project.clientId);
                  const stats = projectStats.get(project.id) || { total: 0, completed: 0, progress: 0 };
                  const budgetStats = getProjectBudgetStats(project);

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-muted/15 transition-all duration-150 group"
                    >
                      {/* Checkbox Circle */}
                      <td className="py-4 px-5 text-center align-middle">
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/35 hover:border-primary/80 hover:bg-primary/5 transition-all cursor-pointer mx-auto flex items-center justify-center group-hover:scale-105" />
                      </td>

                      {/* Project Title */}
                      <td className="py-4 px-5 align-middle font-bold text-foreground">
                        <Link href={`/board/${project.id}`} className="hover:text-primary hover:underline flex items-center gap-2">
                          <span className="truncate max-w-[200px]">{project.title}</span>
                          {project.archived && (
                            <Badge variant="outline" className="text-[9px] font-bold text-destructive bg-destructive/10 border-destructive/20 uppercase shrink-0 py-0 px-1.5 h-4">
                              Archived
                            </Badge>
                          )}
                        </Link>
                        {project.subtitle && (
                          <span className="block text-xs text-muted-foreground font-normal mt-0.5 truncate max-w-[200px]">
                            {project.subtitle}
                          </span>
                        )}
                      </td>

                      {/* Project Client badge */}
                      <td className="py-4 px-5 align-middle">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 px-3 py-1 rounded-lg text-xs font-semibold select-none">
                          <User className="w-3.5 h-3.5 text-slate-500" />
                          <span>{client?.name || 'Unknown Client'}</span>
                        </div>
                      </td>

                      {/* Status Dropdown badge select */}
                      <td className="py-4 px-5 align-middle">
                        <Select
                          value={project.status || 'New'}
                          onValueChange={(val) => {
                            updateProject({ id: project.id, data: { status: val } });
                            toast({ title: 'สำเร็จ!', description: `อัปเดตสถานะโครงการเป็น ${val} เรียบร้อยแล้ว` });
                          }}
                        >
                          <SelectTrigger
                            className={cn(
                              "h-8 w-32 font-bold text-[11px] rounded-lg border-0 text-white shadow-3xs uppercase tracking-wider transition-all duration-200 focus:ring-0 focus-visible:ring-0 justify-between",
                              (!project.status || project.status === 'New') && "bg-[#3b82f6] hover:bg-[#2563eb]",
                              project.status === 'In progress' && "bg-[#22c55e] hover:bg-[#16a34a]",
                              project.status === 'Pending' && "bg-[#f97316] hover:bg-[#ea580c]",
                              project.status === 'Delayed' && "bg-[#ef4444] hover:bg-[#dc2626]",
                              project.status === 'Completed' && "bg-[#475569] hover:bg-[#334155]",
                              project.status === 'Canceled' && "bg-[#64748b] hover:bg-[#4b5563]"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="New">New</SelectItem>
                            <SelectItem value="In progress">In progress</SelectItem>
                            <SelectItem value="Pending">Pending</SelectItem>
                            <SelectItem value="Delayed">Delayed</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Canceled">Canceled</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Members */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex -space-x-1 overflow-hidden">
                          <Avatar className="h-6.5 w-6.5 border-2 border-background shadow-3xs shrink-0">
                            <AvatarFallback className="text-[9px] font-black bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-100">
                              RY
                            </AvatarFallback>
                          </Avatar>
                        </div>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-5 align-middle w-48">
                        <div className="flex items-center gap-3">
                          <Progress value={stats.total > 0 ? stats.progress : 0} className="h-1.5 w-24 bg-muted/80" />
                          <span className="text-[10px] font-bold text-muted-foreground/85 whitespace-nowrap">
                            {stats.total > 0 ? `${stats.completed}/${stats.total} (${stats.progress}%)` : "No tasks"}
                          </span>
                        </div>
                      </td>

                      {/* Budget */}
                      <td className="py-4 px-5 align-middle font-bold text-foreground text-xs whitespace-nowrap">
                        {budgetStats.formatted}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right align-middle pr-8">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "h-8 w-8 text-muted-foreground transition-colors hover:bg-muted rounded-lg",
                              project.archived ? "text-destructive hover:text-destructive/80" : "hover:text-primary"
                            )}
                            onClick={() => handleToggleArchive(project.id, !!project.archived)}
                            title={project.archived ? "Restore from Archive" : "Archive Project"}
                          >
                            <Archive className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                            onClick={() => setProjectToDelete(project.id)}
                            title="Delete Project"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Link href={`/board/${project.id}`}>
                            <Button size="sm" className="h-8 rounded-lg font-bold gap-1 text-xs bg-muted text-foreground hover:bg-primary hover:text-primary-foreground ml-1">
                              Open Workspace <ArrowRight className="w-3 h-3" />
                            </Button>
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Inline Create project button */}
                <tr className="bg-muted/5 hover:bg-muted/10 transition-colors">
                  <td colSpan={8} className="p-0">
                    <div
                      onClick={() => setIsCreateOpen(true)}
                      className="px-8 py-4 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Create project
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>


      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-xl rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl">Create New Project Container</DialogTitle>
            <DialogDescription>
              สร้างโครงการระดับบนสำหรับจัดเก็บงานย่อยและตั้งรอบ Invoice รายเดือน
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateProject} className="space-y-4 py-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Title */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Title*</span>
                <Input
                  placeholder="เช่น SEO & Support รายเดือน"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl h-9"
                  required
                />
              </div>

              {/* Subtitle */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subtitle</span>
                <Input
                  placeholder="เช่น รอบปี 2569"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="rounded-xl h-9"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Client Selection */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Client*</span>
                <Select onValueChange={setNewClientId} value={newClientId}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue placeholder="เลือกลูกค้าคู่สัญญา" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {clients.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Tag Color */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Color Tag</span>
                <div className="flex items-center gap-1.5 h-9">
                  {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#64748b'].map(c => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewColor(c)}
                      className={cn(
                        "w-5 h-5 rounded-full border transition-all",
                        newColor === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-80"
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Start Date */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Start Date</span>
                <Input
                  type="date"
                  value={newStartDate}
                  onChange={(e) => setNewStartDate(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deadline</span>
                <Input
                  type="date"
                  value={newDeadline}
                  onChange={(e) => setNewDeadline(e.target.value)}
                  className="rounded-xl h-9 text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 border-t border-border/30 pt-3">
              {/* Currency */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Currency</span>
                <Select onValueChange={setNewCurrency} value={newCurrency}>
                  <SelectTrigger className="rounded-xl h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="THB">THB (฿)</SelectItem>
                    <SelectItem value="USD">USD ($)</SelectItem>
                    <SelectItem value="EUR">EUR (€)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Fixed Budget */}
              <div className="flex flex-col gap-1.5 col-span-2">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gross Project Price / Retainer Rate</span>
                <Input
                  type="number"
                  placeholder="เช่น 10000"
                  value={newGrossPrice || ''}
                  onChange={(e) => setNewGrossPrice(Number(e.target.value))}
                  className="rounded-xl h-9"
                />
              </div>
            </div>

            {/* Project Details */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Details</span>
              <textarea
                placeholder="รายละเอียดเงื่อนไขสัญญา, ขอบเขตงานรายเดือน..."
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                className="flex min-h-[60px] w-full rounded-xl border border-input bg-transparent px-3 py-2 text-xs shadow-2xs placeholder:text-muted-foreground/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            <DialogFooter className="pt-3 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-9 text-xs">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="rounded-xl h-9 text-xs font-bold">
                {isCreating ? 'Creating...' : 'Create Project'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!projectToDelete} onOpenChange={(open) => !open && setProjectToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-destructive">Confirm Delete Project?</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบโครงการตู้เก็บนี้? ข้อมูลการตั้งค่าโครงการจะถูกลบทั้งหมด 
              *(งานย่อย/การ์ดงานที่อยู่ภายในจะไม่ถูกลบ แต่จะถูกย้ายไปอยู่เป็นงานทั่วไป)*
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setProjectToDelete(null)} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="rounded-xl h-9 text-xs font-bold">
              Confirm Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
