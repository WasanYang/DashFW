'use client';

import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useGetProjectsQuery, useAddProjectMutation, useUpdateProjectMutation, useDeleteProjectMutation } from '@/services/projectApi';
import { useGetClientsQuery } from '@/services/clientApi';
import { useGetTasksQuery } from '@/services/taskApi';
import { useGetJobTypesQuery } from '@/services/jobTypeApiSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { format } from 'date-fns';
import { Plus, Search, Calendar as CalendarIcon, Briefcase, Trash2, FolderOpen, ArrowRight, ExternalLink, LayoutGrid, Table, Archive, User, Settings2, Filter, ArrowUpDown, Download, ChevronDown, ChevronUp, ListChecks, ChevronLeft, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

function InlineNotesInput({
  project,
  updateProject,
}: {
  project: any;
  updateProject: any;
}) {
  const [value, setValue] = useState(project.notes || '');

  useEffect(() => {
    setValue(project.notes || '');
  }, [project.notes]);

  const handleBlur = () => {
    if (value !== (project.notes || '')) {
      updateProject({ id: project.id, data: { notes: value } });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <Input
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="h-8 bg-transparent border-transparent hover:border-border/50 hover:bg-muted/5 focus-visible:border-border/80 focus-visible:bg-transparent text-xs w-full shadow-none rounded-lg px-2 transition-all"
    />
  );
}

export default function ProjectsPage() {
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
  const { data: tasks = [], isLoading: loadingTasks } = useGetTasksQuery();
  const { data: jobTypes = [], isLoading: loadingJobTypes } = useGetJobTypesQuery();

  const [addProject, { isLoading: isCreating }] = useAddProjectMutation();
  const [deleteProject] = useDeleteProjectMutation();
  const [updateProject] = useUpdateProjectMutation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState<string | null>(null);

  // Archive state
  const [showArchived, setShowArchived] = useState(false);

  // Active (non-archived) projects for status counting
  const activeProjects = useMemo(() => projects.filter((p) => !p.archived), [projects]);

  const metrics = useMemo(() => {
    const counts: Record<string, number> = {
      Total: activeProjects.length,
      New: 0,
      'In progress': 0,
      Pending: 0,
      Delayed: 0,
      Completed: 0,
      Support: 0,
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
  const [newRelatedProjectIds, setNewRelatedProjectIds] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState<string>('Medium');
  const [newNotes, setNewNotes] = useState('');
  const [newJobTypeId, setNewJobTypeId] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState<'title' | 'client' | 'type' | 'status' | 'priority' | 'none'>('none');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Pagination & Filter state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [selectedJobTypeFilter, setSelectedJobTypeFilter] = useState('all');
  const [selectedClientFilter, setSelectedClientFilter] = useState('all');

  const toggleSort = (field: 'title' | 'client' | 'type' | 'status' | 'priority') => {
    if (sortBy === field) {
      if (sortOrder === 'asc') {
        setSortOrder('desc');
      } else {
        setSortBy('none');
      }
    } else {
      setSortBy(field);
      setSortOrder(field === 'priority' ? 'desc' : 'asc');
    }
  };

  const renderSortIcon = (field: 'title' | 'client' | 'type' | 'status' | 'priority') => {
    if (sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 ml-1 text-muted-foreground/30 inline-block opacity-0 group-hover/header:opacity-100 transition-opacity" />;
    }
    return sortOrder === 'asc' ? (
      <ChevronDown className="w-3 h-3 ml-1 text-primary inline-block shrink-0" />
    ) : (
      <ChevronUp className="w-3 h-3 ml-1 text-primary inline-block shrink-0" />
    );
  };

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

  // Filter projects by search query, archive status, and sort them
  const filteredProjects = useMemo(() => {
    let list = projects;
    if (showArchived) {
      list = list.filter((p) => p.archived);
    } else {
      list = list.filter((p) => !p.archived);
    }
    if (selectedJobTypeFilter !== 'all') {
      list = list.filter((p) => p.jobTypeId === selectedJobTypeFilter);
    }
    if (selectedClientFilter !== 'all') {
      list = list.filter((p) => p.clientId === selectedClientFilter);
    }
    const query = searchQuery.toLowerCase().trim();
    if (query) {
      list = list.filter((p) => {
        const client = clients.find((c) => c._id === p.clientId);
        return (
          p.title.toLowerCase().includes(query) ||
          (p.subtitle && p.subtitle.toLowerCase().includes(query)) ||
          (client && client.name.toLowerCase().includes(query))
        );
      });
    }

    // Apply Sorting
    if (sortBy !== 'none') {
      list = [...list].sort((a, b) => {
        let valA = '';
        let valB = '';

        if (sortBy === 'title') {
          valA = a.title.toLowerCase();
          valB = b.title.toLowerCase();
        } else if (sortBy === 'client') {
          const clientA = clients.find((c) => c._id === a.clientId);
          const clientB = clients.find((c) => c._id === b.clientId);
          valA = (clientA?.name || '').toLowerCase();
          valB = (clientB?.name || '').toLowerCase();
        } else if (sortBy === 'type') {
          const typeA = jobTypes.find((jt) => jt._id === a.jobTypeId || jt.id === a.jobTypeId);
          const typeB = jobTypes.find((jt) => jt._id === b.jobTypeId || jt.id === b.jobTypeId);
          valA = (typeA?.name || '').toLowerCase();
          valB = (typeB?.name || '').toLowerCase();
        } else if (sortBy === 'status') {
          valA = (a.status || 'New').toLowerCase();
          valB = (b.status || 'New').toLowerCase();
        } else if (sortBy === 'priority') {
          const priorityWeight: Record<string, number> = {
            'Urgent': 4,
            'High': 3,
            'Medium': 2,
            'Low': 1,
            'none': 0,
            '': 0
          };
          const weightA = priorityWeight[a.priority || 'Medium'] || 0;
          const weightB = priorityWeight[b.priority || 'Medium'] || 0;
          return sortOrder === 'asc' ? weightA - weightB : weightB - weightA;
        }

        if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return list;
  }, [projects, searchQuery, clients, jobTypes, showArchived, sortBy, sortOrder, selectedJobTypeFilter, selectedClientFilter]);

  const totalPages = Math.ceil(filteredProjects.length / itemsPerPage);
  const activePage = totalPages > 0 ? Math.min(currentPage, totalPages) : 1;
  const startIndex = (activePage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedProjects = filteredProjects.slice(startIndex, endIndex);

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
    if (!newTitle.trim()) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'กรุณากรอกชื่อโครงการ', variant: 'destructive' });
      return;
    }

    try {
      await addProject({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || undefined,
        clientId: newClientId && newClientId !== 'none' ? newClientId : undefined,
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
        priority: newPriority,
        notes: newNotes.trim() || undefined,
        jobTypeId: newJobTypeId && newJobTypeId !== 'none' ? newJobTypeId : undefined,
        relatedProjectIds: newRelatedProjectIds.length > 0 ? newRelatedProjectIds : undefined,
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
    setNewRelatedProjectIds([]);
    setNewPriority('Medium');
    setNewNotes('');
    setNewJobTypeId('');
  };

  if (loadingProjects || loadingClients || loadingTasks || loadingJobTypes) {
    return <div className="p-8 text-center text-muted-foreground">กำลังโหลดรายการโครงการ...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full min-h-full p-4 sm:p-6">


      {/* TITLE */}
      <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-1 mb-2">Projects</h1>

      {/* TOOLBAR */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 px-1">
        <div className="relative w-48 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="pl-9 h-9 rounded-full border-dashed border-border/60 bg-transparent text-sm focus-visible:ring-0 shadow-none w-full"
          />
        </div>
        <Button variant="outline" size="sm" disabled className="h-9 rounded-full border-dashed border-border/60 text-sm text-muted-foreground/80 font-medium px-4 shrink-0 bg-transparent shadow-none gap-2"><Table className="w-4 h-4" /> Table</Button>
        <Button variant="outline" size="sm" disabled className="h-9 rounded-full border-dashed border-border/60 text-sm text-muted-foreground/80 font-medium px-4 shrink-0 bg-transparent shadow-none gap-2"><Settings2 className="w-4 h-4" /> Edit view</Button>
        
        {/* Project Type Filter Select Dropdown */}
        <Select value={selectedJobTypeFilter} onValueChange={(val) => { setSelectedJobTypeFilter(val); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-auto inline-flex px-4 rounded-full border-dashed border-border/60 text-sm text-muted-foreground/80 font-medium bg-transparent shadow-none gap-2 focus:ring-0">
            <Filter className="w-4 h-4 text-muted-foreground/60" />
            <span className="flex items-center gap-1.5">
              {selectedJobTypeFilter !== 'all' && (
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: jobTypes.find(jt => jt._id === selectedJobTypeFilter || jt.id === selectedJobTypeFilter)?.color || '#cbd5e1' }} 
                />
              )}
              {selectedJobTypeFilter === 'all'
                ? 'All Types'
                : jobTypes.find(jt => jt._id === selectedJobTypeFilter || jt.id === selectedJobTypeFilter)?.name || 'Unknown Type'}
            </span>
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            <SelectItem value="all">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full border border-dashed border-muted-foreground/45 shrink-0" />
                All Types
              </span>
            </SelectItem>
            {jobTypes.map(jt => (
              <SelectItem key={jt._id || jt.id} value={jt._id || jt.id || ''}>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: jt.color || '#cbd5e1' }} />
                  {jt.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Client Filter Select Dropdown */}
        <Select value={selectedClientFilter} onValueChange={(val) => { setSelectedClientFilter(val); setCurrentPage(1); }}>
          <SelectTrigger className="h-9 w-auto inline-flex px-4 rounded-full border-dashed border-border/60 text-sm text-muted-foreground/80 font-medium bg-transparent shadow-none gap-2 focus:ring-0">
            <User className="w-4 h-4 text-muted-foreground/60" />
            <span className="flex items-center gap-1.5">
              {selectedClientFilter === 'all'
                ? 'All Clients'
                : clients.find(c => c._id === selectedClientFilter)?.name || 'Unknown Client'}
            </span>
          </SelectTrigger>
          <SelectContent className="rounded-xl max-h-60 overflow-y-auto">
            <SelectItem value="all">
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                All Clients
              </span>
            </SelectItem>
            {clients.filter(c => !c.archived).map(c => (
              <SelectItem key={c._id} value={c._id}>
                <span className="flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0" />
                  {c.name}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" disabled className="h-9 rounded-full border-dashed border-border/60 text-sm text-muted-foreground/80 font-medium px-4 shrink-0 bg-transparent shadow-none gap-2"><LayoutGrid className="w-4 h-4" /> Group</Button>
        <Button variant="outline" size="sm" onClick={() => { setShowArchived(!showArchived); setCurrentPage(1); }} className={cn("h-9 rounded-full border-dashed text-sm font-medium px-4 shrink-0 shadow-none gap-2", showArchived ? "bg-muted text-primary border-primary/30" : "border-border/60 text-muted-foreground/80 bg-transparent")}><Archive className="w-4 h-4" /> Archived</Button>
        <Button variant="outline" size="sm" disabled className="h-9 rounded-full border-dashed border-border/60 text-sm text-muted-foreground/80 font-medium px-4 shrink-0 bg-transparent shadow-none gap-2"><Download className="w-4 h-4" /> Import / Export</Button>
      </div>

      {/* STATUS METRICS BAR */}
      <div className="flex w-full rounded-md overflow-hidden select-none px-1 mb-3 mt-1">
        <div className="flex-1 bg-[#475b75] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.Total}</span>
          <span className="truncate">Projects</span>
        </div>
        <div className="flex-1 bg-[#3b82f6] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.New}</span>
          <span className="truncate">New</span>
        </div>
        <div className="flex-1 bg-[#22c55e] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics['In progress']}</span>
          <span className="truncate">In progress</span>
        </div>
        <div className="flex-1 bg-[#f97316] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.Pending}</span>
          <span className="truncate">Pending</span>
        </div>
        <div className="flex-1 bg-[#e11d48] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.Delayed}</span>
          <span className="truncate">Delayed</span>
        </div>
        <div className="flex-1 bg-[#64748b] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.Completed}</span>
          <span className="truncate">Completed</span>
        </div>
        <div className="flex-1 bg-[#0ea5e9] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold border-r border-white/20">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.Support}</span>
          <span className="truncate">Support</span>
        </div>
        <div className="flex-1 bg-[#475569] text-white h-9 flex items-center px-3 gap-2 text-xs font-semibold">
          <span className="bg-black/20 px-1.5 py-0.5 rounded text-white min-w-[20px] text-center text-[11px]">{metrics.Canceled}</span>
          <span className="truncate">Canceled</span>
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
      ) : (
        <div className="flex flex-col gap-2.5 mx-1 mb-4">
          <Card className="border border-border/50 shadow-none overflow-hidden bg-card rounded-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-transparent text-xs font-semibold text-muted-foreground/80 text-left select-none">
                    <th className="py-3 px-4 w-12 text-center"></th>
                    <th className="py-3 px-4 w-20 border-l border-border/30 text-center">Actions</th>
                    <th 
                      className="py-3 px-4 w-60 border-l border-border/30 cursor-pointer group/header hover:bg-muted/10 transition-colors animate-fade-in"
                      onClick={() => toggleSort('title')}
                    >
                      <span className="flex items-center">
                        Project name
                        {renderSortIcon('title')}
                      </span>
                    </th>
                    <th 
                      className="py-3 px-4 border-l border-border/30 cursor-pointer group/header hover:bg-muted/10 transition-colors"
                      onClick={() => toggleSort('client')}
                    >
                      <span className="flex items-center">
                        Project client
                        {renderSortIcon('client')}
                      </span>
                    </th>
                    <th 
                      className="py-3 px-4 w-40 border-l border-border/30 cursor-pointer group/header hover:bg-muted/10 transition-colors"
                      onClick={() => toggleSort('type')}
                    >
                      <span className="flex items-center">
                        Project Type
                        {renderSortIcon('type')}
                      </span>
                    </th>
                    <th 
                      className="py-3 px-4 w-40 border-l border-border/30 cursor-pointer group/header hover:bg-muted/10 transition-colors"
                      onClick={() => toggleSort('status')}
                    >
                      <span className="flex items-center">
                        Status
                        {renderSortIcon('status')}
                      </span>
                    </th>
                    <th 
                      className="py-3 px-4 w-32 border-l border-border/30 cursor-pointer group/header hover:bg-muted/10 transition-colors"
                      onClick={() => toggleSort('priority')}
                    >
                      <span className="flex items-center">
                        Priority
                        {renderSortIcon('priority')}
                      </span>
                    </th>
                    <th className="py-3 px-4 w-24 border-l border-border/30 text-center">Progress</th>
                    <th className="py-3 px-4 w-72 border-l border-border/30">Remarks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {paginatedProjects.map((project) => {
                    const client = clients.find(c => c._id === project.clientId);
                    const stats = projectStats.get(project.id) || { total: 0, completed: 0, progress: 0 };

                    return (
                      <tr
                        key={project.id}
                        className="hover:bg-muted/15 transition-all duration-150 group"
                      >
                        {/* Checkbox Circle */}
                        <td className="py-3 px-4 text-center align-middle">
                          <div className="w-4 h-4 rounded-full border border-muted-foreground/30 hover:border-primary/80 transition-all cursor-pointer mx-auto flex items-center justify-center" />
                        </td>

                        {/* Actions */}
                        <td className="py-3 px-4 align-middle border-l border-border/30">
                          <div className="flex items-center justify-center gap-1.5">
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:bg-muted rounded-md" onClick={() => handleToggleArchive(project.id, !!project.archived)}><Archive className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md" onClick={() => setProjectToDelete(project.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>

                        {/* Project Title */}
                        <td className="py-3 px-4 align-middle font-bold text-foreground text-sm border-l border-border/30">
                          <Link href={`/board/${project.id}`} className="hover:text-primary flex items-center gap-2">
                            <span className="truncate max-w-[180px]">{project.title}</span>
                            {project.archived && (
                              <Badge variant="outline" className="text-[10px] font-bold text-destructive bg-destructive/10 border-destructive/20 uppercase shrink-0 py-0 px-2 h-5">
                                Archived
                              </Badge>
                            )}
                          </Link>
                        </td>

                        {/* Project Client badge */}
                        <td className="py-3 px-4 align-middle border-l border-border/30">
                          <Select
                            value={project.clientId || 'none'}
                            onValueChange={(val) => {
                              const newClientId = val === 'none' ? undefined : val;
                              updateProject({ id: project.id, data: { clientId: newClientId } });
                              toast({ title: 'สำเร็จ!', description: 'อัปเดตลูกค้าเรียบร้อยแล้ว' });
                            }}
                          >
                            <SelectTrigger className="h-7 w-auto inline-flex px-2.5 py-0.5 rounded-xl bg-slate-100/80 hover:bg-slate-200 text-slate-700 text-[11px] font-medium border border-transparent hover:border-dashed hover:border-slate-400 shadow-none [&>svg]:hidden focus:ring-0 focus-visible:ring-0 transition-all">
                              <div className="flex items-center gap-1.5 truncate">
                                <User className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{client?.name || 'Unknown'}</span>
                              </div>
                            </SelectTrigger>
                            <SelectContent className="rounded-xl text-xs max-w-[200px]">
                              <SelectItem value="none">No Client</SelectItem>
                              {clients.map(c => (
                                <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Project Type select badge */}
                        <td className="py-3 px-4 align-middle border-l border-border/30">
                          {(() => {
                            const projectJobType = jobTypes.find(jt => (jt._id === project.jobTypeId || jt.id === project.jobTypeId));
                            return (
                              <Select
                                value={project.jobTypeId || 'none'}
                                onValueChange={(val) => {
                                  const newJobTypeId = val === 'none' ? undefined : val;
                                  updateProject({ id: project.id, data: { jobTypeId: newJobTypeId } });
                                  toast({ title: 'สำเร็จ!', description: 'อัปเดตประเภทโครงการเรียบร้อยแล้ว' });
                                }}
                              >
                                <SelectTrigger className="h-7 w-auto inline-flex px-2.5 py-0.5 rounded-xl bg-muted/65 hover:bg-muted text-foreground text-[11px] font-medium border border-transparent hover:border-dashed hover:border-border shadow-none [&>svg]:hidden focus:ring-0 focus-visible:ring-0 transition-all">
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: projectJobType?.color || '#cbd5e1' }} />
                                    <span className="truncate font-semibold">
                                      {projectJobType?.name || 'No Type'}
                                    </span>
                                  </div>
                                </SelectTrigger>
                                <SelectContent className="rounded-xl text-xs max-w-[200px]">
                                  <SelectItem value="none">No Type</SelectItem>
                                  {jobTypes.map(jt => (
                                    <SelectItem key={jt._id || jt.id} value={jt._id || jt.id || ''}>
                                      <div className="flex items-center gap-1.5">
                                        <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: jt.color || '#cbd5e1' }} />
                                        {jt.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            );
                          })()}
                        </td>

                        {/* Status Dropdown badge select */}
                        <td className="py-3 px-4 align-middle border-l border-border/30">
                          <Select
                            value={project.status || 'New'}
                            onValueChange={(val) => {
                              updateProject({ id: project.id, data: { status: val } });
                              toast({ title: 'สำเร็จ!', description: `อัปเดตสถานะโครงการเป็น ${val} เรียบร้อยแล้ว` });
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 w-32 font-semibold text-xs rounded border-0 text-white shadow-none transition-all duration-200 focus:ring-0 focus-visible:ring-0 justify-between",
                                (!project.status || project.status === 'New') && "bg-[#3b82f6] hover:bg-[#2563eb]",
                                project.status === 'In progress' && "bg-[#22c55e] hover:bg-[#16a34a]",
                                project.status === 'Pending' && "bg-[#f97316] hover:bg-[#ea580c]",
                                project.status === 'Delayed' && "bg-[#e11d48] hover:bg-[#be123c]",
                                project.status === 'Completed' && "bg-[#64748b] hover:bg-[#475569]",
                                project.status === 'Support' && "bg-[#0ea5e9] hover:bg-[#0284c7]",
                                project.status === 'Canceled' && "bg-[#475569] hover:bg-[#334155]"
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl text-xs">
                              <SelectItem value="New">New</SelectItem>
                              <SelectItem value="In progress">In progress</SelectItem>
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Delayed">Delayed</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Support">Support</SelectItem>
                              <SelectItem value="Canceled">Canceled</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Priority Dropdown Select */}
                        <td className="py-3 px-4 align-middle border-l border-border/30">
                          <Select
                            value={project.priority || 'Medium'}
                            onValueChange={(val) => {
                              updateProject({ id: project.id, data: { priority: val } });
                              toast({ title: 'สำเร็จ!', description: `อัปเดตความสำคัญเป็น ${val} เรียบร้อยแล้ว` });
                            }}
                          >
                            <SelectTrigger
                              className={cn(
                                "h-8 w-28 font-semibold text-xs rounded border-0 text-white shadow-none transition-all duration-200 focus:ring-0 focus-visible:ring-0 justify-between",
                                project.priority === 'Urgent' && "bg-rose-500 hover:bg-rose-600",
                                project.priority === 'High' && "bg-amber-500 hover:bg-amber-600",
                                (!project.priority || project.priority === 'Medium') && "bg-blue-500 hover:bg-blue-600",
                                project.priority === 'Low' && "bg-slate-500 hover:bg-slate-600"
                              )}
                            >
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl text-xs">
                              <SelectItem value="Urgent">Urgent</SelectItem>
                              <SelectItem value="High">High</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Low">Low</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>

                        {/* Progress */}
                        <td className="py-3 px-4 align-middle text-center font-semibold text-xs text-muted-foreground border-l border-border/30">
                          {stats.total > 0 ? `${stats.progress}%` : '-'}
                        </td>

                        {/* Remarks (Inline Notes) */}
                        <td className="py-2 px-3 align-middle border-l border-border/30">
                          <InlineNotesInput project={project} updateProject={updateProject} />
                        </td>
                      </tr>
                    );
                  })}

                  {/* Inline Create project button */}
                  <tr className="bg-transparent hover:bg-muted/5 transition-colors">
                    <td colSpan={9} className="p-0 border-t border-border/30">
                      <div
                        onClick={() => setIsCreateOpen(true)}
                        className="px-5 py-3.5 cursor-pointer flex items-center gap-2.5 text-primary/80 hover:text-primary font-semibold text-sm transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Create project
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>

          {/* Pagination Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1 py-1 text-xs text-muted-foreground/80 font-medium select-none">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <Select
                value={String(itemsPerPage)}
                onValueChange={(val) => {
                  setItemsPerPage(Number(val));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="h-8 w-[70px] px-2 rounded-xl bg-transparent border-border/50 text-xs shadow-none focus:ring-0 focus-visible:ring-0">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl min-w-[70px]">
                  {[5, 10, 20, 30, 50].map((size) => (
                    <SelectItem key={size} value={String(size)} className="text-xs">
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-6">
              <span>
                {filteredProjects.length > 0
                  ? `Showing ${startIndex + 1} to ${Math.min(endIndex, filteredProjects.length)} of ${filteredProjects.length}`
                  : 'No projects to display'}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl border-border/50 shadow-none hover:bg-muted"
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={activePage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center justify-center min-w-[40px] px-1 font-semibold text-foreground">
                  {activePage} / {totalPages || 1}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 rounded-xl border-border/50 shadow-none hover:bg-muted"
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={activePage >= totalPages || totalPages === 0}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-[24px] bg-background">
          <div className="bg-muted/30 px-6 py-5 border-b border-border/40">
            <DialogHeader>
              <DialogTitle className="font-bold text-xl flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" /> Create New Project
              </DialogTitle>
              <DialogDescription className="text-sm mt-1 text-muted-foreground/80">
                สร้างโครงการระดับบนสำหรับจัดเก็บงานย่อยและตั้งรอบ Invoice
              </DialogDescription>
            </DialogHeader>
          </div>

          <form onSubmit={handleCreateProject} className="px-6 py-5">
            <div className="space-y-5">
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
                {/* Title */}
                <div className="flex flex-col gap-2 md:col-span-4">
                  <span className="text-xs font-semibold text-foreground/80">Project Title <span className="text-destructive">*</span></span>
                  <Input
                    placeholder="e.g. Website Redesign Q3"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    className="rounded-xl h-10 border-border/60 bg-transparent text-sm focus-visible:ring-primary shadow-sm"
                    required
                  />
                </div>

                {/* Subtitle */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground/80">Subtitle</span>
                  <Input
                    placeholder="e.g. Scope phase 1"
                    value={newSubtitle}
                    onChange={(e) => setNewSubtitle(e.target.value)}
                    className="rounded-xl h-10 border-border/60 bg-transparent text-sm shadow-sm"
                  />
                </div>

                {/* Client Selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80">Client</span>
                    <span className="text-[10px] text-muted-foreground">Optional</span>
                  </div>
                  <Select onValueChange={setNewClientId} value={newClientId}>
                    <SelectTrigger className="rounded-xl h-10 border-border/60 shadow-sm text-sm bg-transparent">
                      <SelectValue placeholder="Select client" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">No Client</SelectItem>
                      {clients.map(c => (
                        <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Project Type Selection */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-foreground/80">Project Type</span>
                    <span className="text-[10px] text-muted-foreground">Optional</span>
                  </div>
                  <Select onValueChange={setNewJobTypeId} value={newJobTypeId}>
                    <SelectTrigger className="rounded-xl h-10 border-border/60 shadow-sm text-sm bg-transparent">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="none">No Type</SelectItem>
                      {jobTypes.map(jt => (
                        <SelectItem key={jt._id || jt.id} value={jt._id || jt.id || ''}>
                          <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: jt.color || '#cbd5e1' }} />
                            {jt.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Priority Selection */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground/80">Priority</span>
                  <Select onValueChange={setNewPriority} value={newPriority}>
                    <SelectTrigger className="rounded-xl h-10 border-border/60 shadow-sm text-sm bg-transparent">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Urgent">Urgent</SelectItem>
                      <SelectItem value="High">High</SelectItem>
                      <SelectItem value="Medium">Medium</SelectItem>
                      <SelectItem value="Low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Timeline */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground/80">Timeline</span>
                  <div className="flex items-center gap-2">
                    <Input
                      type="date"
                      value={newStartDate}
                      onChange={(e) => setNewStartDate(e.target.value)}
                      className="rounded-xl h-10 text-xs border-border/60 shadow-sm bg-transparent"
                    />
                    <span className="text-muted-foreground/50 text-xs">-</span>
                    <Input
                      type="date"
                      value={newDeadline}
                      onChange={(e) => setNewDeadline(e.target.value)}
                      className="rounded-xl h-10 text-xs border-border/60 shadow-sm bg-transparent"
                    />
                  </div>
                </div>

                {/* Remarks & Tag */}
                <div className="flex flex-col gap-2">
                  <span className="text-xs font-semibold text-foreground/80">Remarks & Tag</span>
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder="e.g. Waiting for details, In progress"
                      value={newNotes}
                      onChange={(e) => setNewNotes(e.target.value)}
                      className="rounded-xl h-10 text-sm border-border/60 shadow-sm bg-transparent flex-1"
                    />
                    
                    <div className="h-10 px-2.5 flex items-center bg-muted/10 border border-border/60 rounded-xl shadow-sm shrink-0">
                      <div className="flex items-center gap-1">
                        {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#64748b'].map(c => (
                          <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            className={cn(
                              "w-3.5 h-3.5 rounded-full transition-all",
                              newColor === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-60 hover:opacity-100"
                            )}
                            style={{ backgroundColor: c }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Project Details */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground/80">Project Details</span>
                <textarea
                  placeholder="รายละเอียดเงื่อนไขสัญญา, ขอบเขตงานรายเดือน..."
                  value={newDetails}
                  onChange={(e) => setNewDetails(e.target.value)}
                  className="flex min-h-[80px] w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
                />
              </div>

              {/* Related Projects */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Related Projects</span>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="w-full justify-between h-10 rounded-xl border-border/60 bg-transparent shadow-sm text-sm font-normal">
                      {newRelatedProjectIds.length > 0
                        ? `${newRelatedProjectIds.length} project(s) selected`
                        : <span className="text-muted-foreground">Select related projects</span>}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-[300px] sm:w-[500px] max-h-60 overflow-y-auto rounded-xl">
                    {projects.map((p) => (
                      <DropdownMenuCheckboxItem
                        key={p.id}
                        checked={newRelatedProjectIds.includes(p.id)}
                        onCheckedChange={(checked) => {
                          setNewRelatedProjectIds(prev => 
                            checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                          )
                        }}
                      >
                        {p.title}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                
                {/* Render selected pills */}
                {newRelatedProjectIds.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {newRelatedProjectIds.map(id => {
                      const proj = projects.find(p => p.id === id);
                      return proj ? (
                        <Badge key={id} variant="secondary" className="text-[10px] font-normal px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-muted/50 border-border/50">
                          <FolderOpen className="w-3 h-3 text-muted-foreground" />
                          <span className="truncate max-w-[150px]">{proj.title}</span>
                          <button
                            type="button"
                            onClick={() => setNewRelatedProjectIds(prev => prev.filter(pid => pid !== id))}
                            className="ml-0.5 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                          >
                            ×
                          </button>
                        </Badge>
                      ) : null;
                    })}
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="mt-6 gap-3 sm:justify-between pt-5 border-t border-border/40">
              <Button type="button" variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-xl h-10 text-sm hover:bg-muted/50">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating} className="rounded-xl h-10 px-8 text-sm font-bold shadow-md">
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
