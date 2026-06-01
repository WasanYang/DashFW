'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RepeatsPopover } from '@/components/board/repeats-popover';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  ListTodo,
  Sparkles,
  Loader2,
  Share2,
  Trash2,
  Plus,
  Pencil,
  Search,
  Calendar as CalendarIcon,
  ChevronDown,
  Check,
  X,
  FileText,
  Building2,
  Archive,
  AlignLeft,
  CalendarDays,
  Repeat,
  UserCircle,
  MoreHorizontal,
  Play
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { useGetProjectsQuery, useUpdateProjectMutation } from '@/services/projectApi';
import { useGetTasksQuery, useAddTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation } from '@/services/taskApi';
import { useGetClientsQuery } from '@/services/clientApi';
import { useGetTimeLogsQuery } from '@/services/timeLogApi';
import { useGetInvoicesQuery } from '@/services/invoiceApi';
import { useToast } from '@/hooks/use-toast';
import { createAiChecklist } from '@/ai/flows/ai-checklist-creator-flow';
import { formatNumber } from '@/lib/number-format';
import { cn } from '@/lib/utils';
import type { Client, SubTask } from '@/lib/types';

export default function ProjectDetailsPage() {
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: tasks = [], isLoading: loadingTasks } = useGetTasksQuery();
  const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
  const { data: timeLogs = [], isLoading: loadingTimeLogs } = useGetTimeLogsQuery();
  const { data: invoices = [], isLoading: loadingInvoices } = useGetInvoicesQuery();
  
  const [updateProject] = useUpdateProjectMutation();
  const [addTask] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  // Active workspace tab: 'Tasks' | 'Calendar' | 'Timesheet' | 'Invoices' | 'Edit'
  const [activeTab, setActiveTab] = useState<'Tasks' | 'Calendar' | 'Timesheet' | 'Invoices' | 'Edit'>('Tasks');

  // Search task query
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Horizontal Board Views
  const [activeBoardView, setActiveBoardView] = useState('Main View');
  const [isAddViewOpen, setIsAddViewOpen] = useState(false);
  const [newViewName, setNewViewName] = useState('');
  
  // View Editing State
  const [editingViewName, setEditingViewName] = useState<string | null>(null);
  const [editedViewNameValue, setEditedViewNameValue] = useState('');

  // AI checklist state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Editing state for Task Titles or Group Names inline
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');

  // Task Details Sidebar State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<{ groupId: string, task: SubTask } | null>(null);

  // New item inputs
  const [newGroupName, setNewGroupName] = useState('');
  const [newTasksInputs, setNewTasksInputs] = useState<Record<string, string>>({});

  const project = projects.find((p) => p.id === id);

  // Project Edit states (Form State)
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editRevisions, setEditRevisions] = useState<number>(0);
  const [editDeadline, setEditDeadline] = useState<Date>(new Date());
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editBillable, setEditBillable] = useState(true);
  const [editHourlyRate, setEditHourlyRate] = useState<number | ''>('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editColor, setEditColor] = useState('');
  const [editArchived, setEditArchived] = useState(false);

  useEffect(() => {
    if (project) {
      setEditTitle(project.title || '');
      setEditSubtitle(project.subtitle || '');
      setEditPrice(project.gross_price || 0);
      setEditRevisions(project.revisions || 0);
      setEditDeadline(project.deadline ? new Date(project.deadline) : new Date());
      setEditStartDate(project.startDate ? new Date(project.startDate) : undefined);
      setEditBillable(project.billable !== false);
      setEditHourlyRate(project.hourlyRate ?? '');
      setEditCurrency(project.currency || 'USD');
      setEditColor(project.color || '');
      setEditArchived(!!project.archived);
    }
  }, [project]);

  if (loadingProjects || loadingTasks || loadingClients || loadingTimeLogs || loadingInvoices) {
    return <div className="p-8 text-center text-muted-foreground">Loading workspace...</div>;
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">ไม่พบโครงการนี้ในระบบ</p>
        <Link href="/projects">
          <Button variant="outline">กลับหน้ารายชื่อโครงการ</Button>
        </Link>
      </div>
    );
  }

  const client: Client | undefined = clients.find(
    (c) => c._id === project.clientId,
  );

  // Filter tasks that belong to this project container
  const projectTasks = tasks.filter((t) => t.projectId === id);

  // Extract distinct views from tasks
  const distinctViews = Array.from(new Set(projectTasks.map(t => t.boardView || 'Main View')));
  if (!distinctViews.includes('Main View')) {
    distinctViews.unshift('Main View');
  }

  // Map tasks to taskGroups format for UI checklist
  const taskGroups = (() => {
    const filteredByView = projectTasks.filter(t => (t.boardView || 'Main View') === activeBoardView);
    
    let rawGroups = filteredByView.map((t) => ({
      id: t.id,
      text: t.title,
      completed: t.status === 'Completed' || t.status === 'Paid',
      children: t.subTasks || []
    }));

    if (rawGroups.length === 0) {
      return [];
    }

    // Filter by search query if set
    if (!taskSearchQuery.trim()) return rawGroups;
    const query = taskSearchQuery.toLowerCase();
    return rawGroups.map(g => ({
      ...g,
      children: g.children.filter(t => t.text.toLowerCase().includes(query))
    })).filter(g => g.children.length > 0 || g.text.toLowerCase().includes(query));
  })();

  // Calculate project statistics
  const totalTasksCount = projectTasks.reduce((sum, t) => sum + (t.subTasks?.length || 0) + 1, 0);
  const completedTasksCount = projectTasks.reduce((sum, t) => {
    const completedSubs = (t.subTasks || []).filter(st => st.completed).length;
    const taskCompleted = (t.status === 'Completed' || t.status === 'Paid') ? 1 : 0;
    return sum + completedSubs + taskCompleted;
  }, 0);

  const progressPercent = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

  // Filter project-specific TimeLogs
  const projectTimeLogs = timeLogs.filter((log) => log.projectId === id);
  const totalLoggedDuration = projectTimeLogs.reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalBillableDuration = projectTimeLogs.filter(l => l.billable).reduce((sum, log) => sum + (log.duration || 0), 0);
  const totalBillableEarnings = projectTimeLogs.filter(l => l.billable).reduce((sum, log) => {
    const rate = log.billingRate || project.hourlyRate || 0;
    const hours = (log.duration || 0) / 3600;
    return sum + (hours * rate);
  }, 0);

  // Filter project-specific Invoices
  const projectInvoices = invoices.filter((inv) => inv.projectId === id);

  // Time log duration formatter
  const formatDurationHours = (totalSeconds: number) => {
    const hours = totalSeconds / 3600;
    return `${hours.toFixed(2)} hrs`;
  };

  // Handler for renaming a view
  const handleRenameView = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingViewName(null);
      return;
    }
    
    // Find all tasks currently in this view
    const tasksInView = projectTasks.filter(t => (t.boardView || 'Main View') === oldName);
    
    try {
      // Update them all to the new view name
      await Promise.all(
        tasksInView.map(t => 
          updateTask({ id: t.id, data: { boardView: trimmed } }).unwrap()
        )
      );
      toast({ title: 'สำเร็จ', description: `เปลี่ยนชื่อเป็น "${trimmed}" เรียบร้อย` });
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเปลี่ยนชื่อ View ได้', variant: 'destructive' });
    }
    
    setEditingViewName(null);
    setActiveBoardView(trimmed);
  };

  const handleAddTask = async (groupName: string, text: string) => {
    if (!text.trim() || !project || !project.clientId) return;
    
    await addTask({
      title: text.trim(),
      projectId: id,
      clientId: project.clientId,
      status: groupName as any,
      gross_price: 0,
      deadline: new Date(),
      revisions: 0,
      boardView: activeBoardView !== 'Main View' ? activeBoardView : undefined
    });
  };

  // CRUD Task Group handlers (creating a Task card under the Project)
  const handleAddTaskGroup = async () => {
    if (!newGroupName.trim()) return;
    
    await addTask({
      title: newGroupName.trim(),
      projectId: id,
      clientId: project.clientId,
      status: 'Backlog',
      gross_price: 0,
      deadline: new Date(),
      revisions: 0,
      subTasks: [],
      boardView: activeBoardView !== 'Main View' ? activeBoardView : undefined
    }).unwrap();

    setNewGroupName('');
    toast({ title: 'สร้างกลุ่มงานใหม่สำเร็จ' });
  };

  // Adding a subtask inside a Task card
  const handleAddTaskInGroup = async (groupId: string) => {
    const taskText = newTasksInputs[groupId];
    if (!taskText || !taskText.trim()) return;

    const targetTask = projectTasks.find(t => t.id === groupId);
    if (!targetTask) return;

    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: taskText.trim(),
      completed: false
    };

    const updatedSubTasks = [...(targetTask.subTasks || []), newSubTask];
    await updateTask({ id: groupId, data: { subTasks: updatedSubTasks } }).unwrap();
    
    setNewTasksInputs(prev => ({ ...prev, [groupId]: '' }));
    toast({ title: 'เพิ่มรายการงานย่อยสำเร็จ' });
  };

  // Toggle checklist item status
  const handleToggleTask = async (subTaskId: string, checked: boolean, parentTaskId: string) => {
    const targetTask = projectTasks.find(t => t.id === parentTaskId);
    if (!targetTask) return;

    const updatedSubTasks = (targetTask.subTasks || []).map(st => {
      if (st.id === subTaskId) {
        return { ...st, completed: checked };
      }
      return st;
    });

    await updateTask({ id: parentTaskId, data: { subTasks: updatedSubTasks } }).unwrap();
  };

  // Delete Task card or subtask
  const handleDeleteTaskOrGroup = async (targetId: string, parentTaskId?: string) => {
    if (parentTaskId) {
      const targetTask = projectTasks.find(t => t.id === parentTaskId);
      if (!targetTask) return;

      const updatedSubTasks = (targetTask.subTasks || []).filter(st => st.id !== targetId);
      await updateTask({ id: parentTaskId, data: { subTasks: updatedSubTasks } }).unwrap();
    } else {
      await deleteTask({ id: targetId }).unwrap();
    }
    toast({ title: 'ลบรายการออกเรียบร้อยแล้ว' });
  };

  // Rename Task card or subtask
  const handleRenameTaskOrGroup = async (targetId: string, textVal: string, parentTaskId?: string) => {
    if (!textVal.trim()) return;
    if (parentTaskId) {
      const targetTask = projectTasks.find(t => t.id === parentTaskId);
      if (!targetTask) return;

      const updatedSubTasks = (targetTask.subTasks || []).map(st => {
        if (st.id === targetId) {
          return { ...st, text: textVal.trim() };
        }
        return st;
      });
      await updateTask({ id: parentTaskId, data: { subTasks: updatedSubTasks } }).unwrap();
    } else {
      await updateTask({ id: targetId, data: { title: textVal.trim() } }).unwrap();
    }
    setEditingId(null);
    toast({ title: 'แก้ไขข้อความสำเร็จ' });
  };

  // Update specific field inside SubTask from the Sidebar
  const handleUpdateTaskDetail = async (field: keyof SubTask, value: any) => {
    if (!selectedTaskDetail) return;
    const { groupId, task } = selectedTaskDetail;
    const targetTask = projectTasks.find(t => t.id === groupId);
    if (!targetTask) return;

    const updatedTask = { ...task, [field]: value };
    const updatedSubTasks = (targetTask.subTasks || []).map(st => st.id === task.id ? updatedTask : st);
    
    // Optimistic UI update
    setSelectedTaskDetail({ groupId, task: updatedTask });
    
    try {
      await updateTask({ id: groupId, data: { subTasks: updatedSubTasks } }).unwrap();
    } catch (err) {
      toast({ title: 'อัปเดตล้มเหลว', description: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', variant: 'destructive' });
      // Revert on fail
      setSelectedTaskDetail({ groupId, task });
    }
  };

  // AI checklist generator
  const handleGenerateAiSubtasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    try {
      const result = await createAiChecklist({ description: aiPrompt.trim() });
      const newAiSubTasks: SubTask[] = result.checklistItems.map((itemText, idx) => ({
        id: `sub-ai-${Date.now()}-${idx}`,
        text: itemText,
        completed: false,
      }));

      // Create a new task card for these AI suggestions
      await addTask({
        title: `⚡ AI: ${aiPrompt.trim().substring(0, 30)}...`,
        projectId: id,
        clientId: project.clientId,
        status: 'Backlog',
        gross_price: 0,
        deadline: new Date(),
        revisions: 0,
        subTasks: newAiSubTasks
      }).unwrap();

      setAiPrompt('');
      toast({
        title: 'สำเร็จ!',
        description: 'ร่างรายการสิ่งที่ต้องทำด้วย AI สำเร็จแล้ว',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายการงานย่อยจาก AI ได้',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Project Edit settings submit handler
  const handleSaveChanges = async () => {
    try {
      await updateProject({
        id: project.id,
        data: {
          title: editTitle,
          subtitle: editSubtitle,
          gross_price: editPrice,
          revisions: editRevisions,
          deadline: editDeadline,
          startDate: editStartDate,
          billable: editBillable,
          hourlyRate: editHourlyRate === '' ? undefined : editHourlyRate,
          currency: editCurrency,
          color: editColor,
          archived: editArchived
        }
      }).unwrap();
      toast({
        title: 'สำเร็จ!',
        description: 'อัปเดตข้อมูลรายละเอียดโครงการเรียบร้อยแล้ว',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'บันทึกข้อมูลล้มเหลว',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className='flex flex-col gap-6 p-4 md:px-8 md:py-6 w-full h-full'>
      {/* 1. TOP HEADER (Plutio-style Breadcrumbs & Settings) */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-card p-4 rounded-2xl border border-border/80 shadow-sm">
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            <Link href="/projects" className="hover:text-primary transition-colors flex items-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" /> Projects
            </Link>
            <span>/</span>
            <span className="truncate max-w-[200px] text-foreground/80">{project.title}</span>
            <span>/</span>
            <span className="text-primary font-bold">{activeTab}</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight truncate mt-1 flex items-center gap-2">
            {project.title}
            {project.color && (
              <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: project.color }} />
            )}
            {project.archived && (
              <Badge variant="outline" className="text-[10px] font-bold text-destructive bg-destructive/10 border-destructive/20 uppercase shrink-0">
                Archived
              </Badge>
            )}
          </h1>
        </div>

        <div className="flex items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
          {client && (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8 border">
                <AvatarImage src={client.avatarUrl} />
                <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <span className="text-xs font-semibold text-muted-foreground hidden md:inline">{client.name}</span>
            </div>
          )}

          <Button
            variant="outline"
            size="icon"
            onClick={() => {
              const shareUrl = `${window.location.origin}/share/project/${project.id}`;
              navigator.clipboard.writeText(shareUrl);
              toast({
                title: 'คัดลอกลิงก์เรียบร้อย!',
                description: 'คุณสามารถส่งลิงก์นี้ให้ลูกค้าเพื่อดูอัปเดตงานแบบอ่านอย่างเดียวได้ทันที',
              });
            }}
            className="rounded-xl h-9 w-9 border-border/60"
            title="Share Client Link"
          >
            <Share2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (Lavender horizontal tab row) */}
      <div className="flex bg-primary/5 p-1.5 rounded-2xl border border-primary/10 overflow-x-auto print:hidden shrink-0">
        {(['Tasks', 'Calendar', 'Timesheet', 'Invoices', 'Edit'] as const).map((tab) => {
          const isAct = activeTab === tab;
          return (
            <Button
              key={tab}
              variant={isAct ? 'default' : 'ghost'}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "rounded-xl px-5 text-sm font-semibold shrink-0 h-9 transition-all",
                isAct
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
              )}
            >
              {tab === 'Edit' ? 'Project Settings (Edit)' : tab}
            </Button>
          );
        })}
      </div>

      {/* 3. TAB CONTENT VIEWS */}
      <div className="flex-grow">
        {/* VIEW A: TASKS WORKSPACE (Plutio-style Task Groups) */}
        {activeTab === 'Tasks' && (
          <div className="flex items-start gap-4">
            <div className="flex-1 space-y-6 min-w-0 pb-12">
            
            {/* Horizontal Board Views */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-border/50 mb-4">
              {distinctViews.map(view => (
                editingViewName === view ? (
                  <Input
                    key={`edit-${view}`}
                    value={editedViewNameValue}
                    onChange={(e) => setEditedViewNameValue(e.target.value)}
                    className="h-8 w-32 text-xs rounded-xl border-border/60 bg-background"
                    autoFocus
                    onBlur={() => handleRenameView(view, editedViewNameValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameView(view, editedViewNameValue);
                      else if (e.key === 'Escape') setEditingViewName(null);
                    }}
                  />
                ) : (
                  <div key={view} className="relative group flex items-center">
                    <Button
                      variant={activeBoardView === view ? 'secondary' : 'ghost'}
                      onClick={() => setActiveBoardView(view)}
                      className={cn(
                        "rounded-xl h-8 px-4 text-xs font-semibold transition-all shrink-0 pr-8",
                        activeBoardView === view ? "bg-muted text-foreground border border-border/60 shadow-sm" : "text-muted-foreground hover:bg-muted/50"
                      )}
                    >
                      {view}
                    </Button>
                    {activeBoardView === view && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 h-6 w-6 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingViewName(view);
                          setEditedViewNameValue(view);
                        }}
                      >
                        <Pencil className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                )
              ))}
              
              {isAddViewOpen ? (
                <div className="flex items-center gap-1 ml-1 shrink-0">
                  <Input
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="New view name..."
                    className="h-8 w-32 text-xs rounded-xl border-border/60 bg-background"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newViewName.trim()) {
                        setActiveBoardView(newViewName.trim());
                        setNewViewName('');
                        setIsAddViewOpen(false);
                      }
                      if (e.key === 'Escape') setIsAddViewOpen(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-green-600 rounded-lg" onClick={() => {
                    if (newViewName.trim()) {
                      setActiveBoardView(newViewName.trim());
                      setNewViewName('');
                      setIsAddViewOpen(false);
                    }
                  }}>
                    <Check className="w-4 h-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground rounded-lg" onClick={() => setIsAddViewOpen(false)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-xl h-8 w-8 text-muted-foreground ml-1 shrink-0 bg-transparent border border-dashed border-border/60"
                  onClick={() => setIsAddViewOpen(true)}
                  title="Add new view"
                >
                  <Plus className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Search and task stats toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  value={taskSearchQuery}
                  onChange={(e) => setTaskSearchQuery(e.target.value)}
                  className="pl-9 h-9 rounded-xl border-border/60 text-xs bg-background"
                />
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                  <Progress value={progressPercent} className="w-24 sm:w-32 h-2" />
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                    {completedTasksCount}/{totalTasksCount} items ({Math.round(progressPercent)}%)
                  </span>
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="New task group..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-9 w-40 rounded-xl text-xs border-border/60 bg-background"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTaskGroup();
                    }}
                  />
                  <Button
                    onClick={handleAddTaskGroup}
                    className="h-9 rounded-xl bg-primary text-primary-foreground font-semibold px-3 gap-1 text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> Group
                  </Button>
                </div>
              </div>
            </div>

            {/* List of Task Groups */}
            <div className="space-y-4">
              {taskGroups.length === 0 ? (
                <div className="py-12 text-center bg-card rounded-2xl border border-border/60 text-sm text-muted-foreground">
                  No task groups found. Use the toolbar on the right to add a task group or search.
                </div>
              ) : (
                taskGroups.map((group) => (
                  <div key={group.id} className="bg-card border border-border/60 rounded-2xl p-4 space-y-3 shadow-sm">
                    {/* Task Group Header */}
                    <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                      <div className="flex items-center gap-2 flex-grow">
                        <ListTodo className="w-4 h-4 text-primary shrink-0" />
                        {editingId === group.id ? (
                          <div className="flex items-center gap-1.5 flex-grow">
                            <Input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              className="h-7 text-sm font-semibold max-w-xs border-primary"
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleRenameTaskOrGroup(group.id, editingText);
                              }}
                            />
                            <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white rounded" onClick={() => handleRenameTaskOrGroup(group.id, editingText)}>
                              <Check className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 rounded" onClick={() => setEditingId(null)}>
                              <X className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <h3
                            className="font-bold text-sm text-foreground hover:underline cursor-pointer flex items-center gap-2"
                            onClick={() => {
                              setEditingId(group.id);
                              setEditingText(group.text);
                            }}
                          >
                            {group.text}
                            {group.completed && (
                              <Badge variant="outline" className="text-[9px] text-green-600 bg-green-50">Done</Badge>
                            )}
                          </h3>
                        )}
                        <span className="text-[10px] font-bold bg-muted text-muted-foreground px-2 py-0.5 rounded-full shrink-0">
                          {group.children?.length || 0}
                        </span>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                        onClick={() => handleDeleteTaskOrGroup(group.id)}
                        title="Delete Group"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    {/* Task Group list items */}
                    <div className="space-y-2">
                      {(group.children || []).map((task, taskIdx) => (
                        <div
                          key={task.id}
                          className="flex items-center justify-between p-3 rounded-xl border border-border/50 bg-background/50 hover:bg-background/80 transition-all gap-4 group"
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={(e) => handleToggleTask(task.id, e.target.checked, group.id)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                            />
                            {editingId === task.id ? (
                              <div className="flex items-center gap-1.5 flex-grow">
                                <Input
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="h-8 text-xs max-w-lg border-primary"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameTaskOrGroup(task.id, editingText, group.id);
                                  }}
                                />
                                <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded" onClick={() => handleRenameTaskOrGroup(task.id, editingText, group.id)}>
                                  <Check className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded" onClick={() => setEditingId(null)}>
                                  <X className="w-4 h-4" />
                                </Button>
                              </div>
                            ) : (
                              <span
                                className={cn(
                                  "text-xs text-foreground cursor-pointer flex-1 truncate hover:underline",
                                  task.completed && "line-through text-muted-foreground"
                                )}
                                onClick={() => {
                                  setSelectedTaskDetail({ groupId: group.id, task: task as SubTask });
                                }}
                              >
                                {task.text}
                              </span>
                            )}

                            {/* Badges and Columns */}
                            <div className="flex items-center gap-3 shrink-0 ml-4 hidden sm:flex">
                              <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 text-[10px] font-bold px-2 rounded-full cursor-pointer">
                                {project.title}
                              </Badge>
                              <span className="text-[10px] bg-muted font-bold text-muted-foreground px-1.5 py-0.5 rounded w-10 text-center">
                                #{String(taskIdx + 1).padStart(3, '0')}
                              </span>
                              
                              <div className="flex items-center gap-2 border-l border-border/40 pl-3 ml-1">
                                {task.assignee ? (
                                  <Avatar className="h-6 w-6 border border-border/50">
                                    <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700">{task.assignee.charAt(0)}</AvatarFallback>
                                  </Avatar>
                                ) : (
                                  <div className="h-6 w-6 rounded-full bg-muted border border-border/50 border-dashed flex items-center justify-center">
                                    <UserCircle className="w-3 h-3 text-muted-foreground/50" />
                                  </div>
                                )}
                                
                                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-green-600 rounded-full">
                                  <Play className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pl-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                              onClick={() => handleDeleteTaskOrGroup(task.id, group.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}

                      {/* Add new task input inside group */}
                      <div className="flex gap-2 items-center pt-2 pl-7">
                        <Input
                          placeholder="What needs to be done?..."
                          value={newTasksInputs[group.id] || ''}
                          onChange={(e) => setNewTasksInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                          className="h-8 rounded-xl border-border/50 text-xs bg-background max-w-md"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddTaskInGroup(group.id);
                          }}
                        />
                        <Button
                          onClick={() => handleAddTaskInGroup(group.id)}
                          variant="outline"
                          className="h-8 rounded-xl text-xs px-3 gap-1 shrink-0"
                        >
                          <Plus className="w-3 h-3" /> Add Task
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* AI Generator Box inside Tasks tab */}
            <div className="bg-primary/5 rounded-2xl p-5 border border-primary/20 space-y-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                <h4 className="font-bold text-sm text-primary">ร่างรายการงานย่อยด้วยระบบ AI (AI Checklist Creator)</h4>
              </div>
              <p className="text-xs text-muted-foreground">
                พิมพ์คำอธิบายรายละเอียดโปรเจกต์หรือความต้องการ เพื่อให้ AI แนะนำรายการสิ่งที่ต้องทำแบบแยกย่อย
              </p>
              <form onSubmit={handleGenerateAiSubtasks} className="flex gap-2 max-w-2xl">
                <Input
                  className="bg-background h-9 text-xs rounded-xl"
                  placeholder="เช่น ออกแบบหน้าจอนระบบสั่งอาหาร, ลงทะเบียน Domain & Host พร้อมเช็ค SSL"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGeneratingAi}
                />
                <Button type="submit" className="h-9 rounded-xl text-xs gap-1.5" disabled={isGeneratingAi || !aiPrompt.trim()}>
                  {isGeneratingAi ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5" />
                  )}
                  แนะนำโดย AI
                </Button>
              </form>
            </div>
          </div>
          
          {/* FLOATING RIGHT PANEL (Task Details) */}
          {selectedTaskDetail && (
            <div className="fixed right-4 xl:right-8 top-24 z-40 w-[320px] xl:w-[400px] flex flex-col bg-card rounded-2xl shadow-2xl border border-border/60 overflow-hidden h-[calc(100vh-120px)]">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-muted/10">
                <div className="flex flex-col gap-1 overflow-hidden">
                  <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider truncate">
                    <span className="truncate">{activeBoardView}</span>
                    <span>/</span>
                    <span className="truncate">{projectTasks.find(t => t.id === selectedTaskDetail.groupId)?.title}</span>
                  </div>
                  <input
                    type="text"
                    value={selectedTaskDetail.task.text}
                    onChange={(e) => handleUpdateTaskDetail('text', e.target.value)}
                    className="text-base font-bold bg-transparent border-none p-0 h-auto focus:ring-0 truncate w-full"
                    placeholder="Task name"
                  />
                </div>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground shrink-0 rounded-full" onClick={() => setSelectedTaskDetail(null)}>
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-2 p-2 px-4 border-b border-border/40 bg-muted/20 overflow-x-auto shrink-0">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 rounded-lg text-primary bg-primary/5">
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
                    onChange={(e) => handleUpdateTaskDetail('description', e.target.value)}
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
                        <Button variant="outline" className={cn("h-8 justify-start text-left font-normal text-xs px-2 bg-background border-border/60 shadow-none", !selectedTaskDetail.task.startDate && "text-muted-foreground")}>
                          {selectedTaskDetail.task.startDate ? format(new Date(selectedTaskDetail.task.startDate), 'dd/MM/yyyy') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[60]" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedTaskDetail.task.startDate ? new Date(selectedTaskDetail.task.startDate) : undefined}
                          onSelect={(date) => handleUpdateTaskDetail('startDate', date?.toISOString())}
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
                        <Button variant="outline" className={cn("h-8 justify-start text-left font-normal text-xs px-2 bg-background border-border/60 shadow-none", !selectedTaskDetail.task.dueDate && "text-muted-foreground")}>
                          {selectedTaskDetail.task.dueDate ? format(new Date(selectedTaskDetail.task.dueDate), 'dd/MM/yyyy') : <span>Pick a date</span>}
                          <CalendarIcon className="ml-auto h-3 w-3 opacity-50" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 z-[60]" align="start">
                        <Calendar
                          mode="single"
                          selected={selectedTaskDetail.task.dueDate ? new Date(selectedTaskDetail.task.dueDate) : undefined}
                          onSelect={(date) => handleUpdateTaskDetail('dueDate', date?.toISOString())}
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
                        onChange={(val) => handleUpdateTaskDetail('repeats', val === 'none' ? '' : (typeof val === 'object' ? JSON.stringify(val) : val))} 
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
                          <X className="w-3 h-3 cursor-pointer hover:text-destructive" onClick={() => handleUpdateTaskDetail('assignee', '')} />
                        </Badge>
                      ) : (
                        <Input
                          placeholder="Name..."
                          className="h-7 w-24 text-[10px] rounded-md border-border/60 bg-background px-2"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleUpdateTaskDetail('assignee', e.currentTarget.value);
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
          )}
        </div>
        )}

        {/* VIEW B: CALENDAR TAB */}
        {activeTab === 'Calendar' && (
          <Card className="border border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Project Timeline & Important Dates</CardTitle>
              <CardDescription>Dates mapped to this project collected from schedule inputs</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 pb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="flex gap-4 p-4 border border-border/50 rounded-xl items-center bg-muted/20">
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

                <div className="flex gap-4 p-4 border border-border/50 rounded-xl items-center bg-muted/20">
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
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(project.startDate), 'MMM dd, yyyy')}</span>
                      <p className="text-xs font-semibold mt-0.5">Kickoff: Project start date recorded</p>
                    </div>
                  )}
                  {project.deadline && (
                    <div className="relative">
                      <div className="absolute -left-[21px] top-1.5 w-3 h-3 rounded-full bg-destructive ring-4 ring-background" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{format(new Date(project.deadline), 'MMM dd, yyyy')}</span>
                      <p className="text-xs font-semibold mt-0.5">Deadline: Target delivery deadline</p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* VIEW C: TIMESHEET TAB */}
        {activeTab === 'Timesheet' && (
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
                      {project.currency === 'USD' ? '$' : '฿'}{totalBillableEarnings.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </h3>
                  </div>
                  <div className="p-3 bg-green-50 text-green-600 rounded-xl">
                    <Clock className="w-5 h-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* List of Time Logs */}
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
                        <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
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
                                {project.currency === 'USD' ? '$' : '฿'}{rate}/hr
                              </td>
                              <td className="p-4 font-bold">{formatDurationHours(log.duration || 0)}</td>
                              <td className="p-4">
                                {log.billable ? (
                                  <Badge variant="outline" className="text-[9px] bg-green-50 text-green-700 border-green-200">Yes</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px] bg-slate-50 text-slate-400 border-slate-200">No</Badge>
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
        )}

        {/* VIEW D: INVOICES TAB */}
        {activeTab === 'Invoices' && (
          <Card className="border border-border/60 shadow-sm rounded-2xl">
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle className="text-lg">Linked Invoices</CardTitle>
                <CardDescription>Billed financial documents generated for this project container</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {projectInvoices.length === 0 ? (
                <div className="py-12 text-center text-sm text-muted-foreground">
                  No invoices connected to this project container yet.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border/40 bg-muted/20 text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                        <th className="p-4">Invoice #</th>
                        <th className="p-4">Title / Label</th>
                        <th className="p-4">Due Date</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right pr-6">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/20">
                      {projectInvoices.map((inv) => (
                        <tr key={inv._id || inv.id} className="hover:bg-muted/10">
                          <td className="p-4 font-bold text-primary">{inv.invoiceNumber}</td>
                          <td className="p-4 font-semibold text-foreground/80">{inv.title || 'Invoice'}</td>
                          <td className="p-4 font-medium text-muted-foreground">
                            {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : 'No date'}
                          </td>
                          <td className="p-4">
                            <Badge
                              variant={
                                inv.status === 'Paid'
                                  ? 'default'
                                  : inv.status === 'Sent'
                                  ? 'secondary'
                                  : inv.status === 'Overdue'
                                  ? 'destructive'
                                  : 'outline'
                              }
                              className={cn(
                                "text-[9px] font-bold uppercase py-0.5 px-2 rounded-md h-5",
                                inv.status === 'Paid' && "bg-green-600 text-white"
                              )}
                            >
                              {inv.status}
                            </Badge>
                          </td>
                          <td className="p-4 text-right pr-6 font-black text-sm text-foreground/80">
                            {inv.currency === 'USD' ? '$' : '฿'}{(inv.total || 0).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* VIEW E: PROJECT SETTINGS (Edit) */}
        {activeTab === 'Edit' && (
          <Card className="border border-border/60 shadow-sm rounded-2xl">
            <CardHeader>
              <CardTitle className="text-lg">Project Container Settings</CardTitle>
              <CardDescription>Configure pricing, timelines, currencies, and tag configurations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 pb-8">
              {/* Text Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <span className="text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 uppercase tracking-wider mb-0.5">Project Title</span>
                  <input
                    className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground w-full h-5"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                  />
                </div>

                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <span className="text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 uppercase tracking-wider mb-0.5">Subtitle</span>
                  <input
                    className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground w-full h-5"
                    value={editSubtitle}
                    onChange={(e) => setEditSubtitle(e.target.value)}
                  />
                </div>
              </div>

              {/* Details Textarea */}
              <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <span className="text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 uppercase tracking-wider mb-1">Scope details</span>
                <textarea
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground placeholder:text-muted-foreground/40 w-full resize-none min-h-[60px]"
                  placeholder="Scope details for this retainer..."
                  value={editSubtitle} // Maps subtitle/details
                  onChange={(e) => setEditSubtitle(e.target.value)}
                />
              </div>

              {/* Pricing & Revisions & Kickoff */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px]">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Budget Price</span>
                  <div className="flex items-center gap-1.5 h-5">
                    <span className="text-xs text-muted-foreground font-semibold">{editCurrency === 'USD' ? '$' : '฿'}</span>
                    <input
                      type="number"
                      className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground w-full h-5 font-bold"
                      value={editPrice}
                      onChange={(e) => setEditPrice(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px]">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">Target Revisions</span>
                  <input
                    type="number"
                    className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground w-full h-5"
                    value={editRevisions}
                    onChange={(e) => setEditRevisions(Number(e.target.value))}
                  />
                </div>

                {/* Kickoff Date */}
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px]">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Kickoff Date</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "p-0 h-auto text-left font-normal justify-start text-sm w-full hover:bg-transparent",
                          !editStartDate && "text-muted-foreground"
                        )}
                      >
                        {editStartDate ? format(editStartDate, 'PPP') : <span>Pick kickoff date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editStartDate}
                        onSelect={setEditStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Due Date (Deadline) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px]">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Deadline (Due Date)</span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="ghost"
                        className={cn(
                          "p-0 h-auto text-left font-normal justify-start text-sm w-full hover:bg-transparent",
                          !editDeadline && "text-muted-foreground"
                        )}
                      >
                        {editDeadline ? format(editDeadline, 'PPP') : <span>Pick deadline date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={editDeadline}
                        onSelect={(date) => date && setEditDeadline(date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Billable & Rates */}
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-[14px] justify-center">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">Billable Project</span>
                    <input
                      type="checkbox"
                      checked={editBillable}
                      onChange={(e) => setEditBillable(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                  {editBillable && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/40">
                      <select
                        value={editCurrency}
                        onChange={(e) => setEditCurrency(e.target.value)}
                        className="border rounded px-1.5 py-0.5 text-xs h-7 bg-background"
                      >
                        <option value="USD">USD ($)</option>
                        <option value="THB">THB (฿)</option>
                        <option value="EUR">EUR (€)</option>
                      </select>
                      <Input
                        type="number"
                        placeholder="Hourly Rate"
                        value={editHourlyRate}
                        onChange={(e) => setEditHourlyRate(e.target.value ? Number(e.target.value) : '')}
                        className="h-7 text-xs flex-1"
                      />
                    </div>
                  )}
                </div>

                {/* Project Tag Color Picker */}
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-[14px] justify-center">
                  <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Project Tag Color</span>
                  <div className="flex flex-wrap gap-2 items-center">
                    {[
                      { name: 'Red', hex: '#ef4444' },
                      { name: 'Orange', hex: '#f97316' },
                      { name: 'Yellow', hex: '#eab308' },
                      { name: 'Green', hex: '#22c55e' },
                      { name: 'Blue', hex: '#3b82f6' },
                      { name: 'Purple', hex: '#a855f7' },
                      { name: 'Slate', hex: '#64748b' }
                    ].map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        className={cn(
                          "w-6 h-6 rounded-full border transition-transform hover:scale-110",
                          editColor === c.hex
                            ? "ring-2 ring-ring ring-offset-2 scale-110"
                            : "border-muted"
                        )}
                        style={{ backgroundColor: c.hex }}
                        onClick={() => setEditColor(c.hex)}
                        title={c.name}
                      />
                    ))}
                    <button
                      type="button"
                      className={cn(
                        "px-2 py-1 text-xs border rounded hover:bg-muted transition-colors",
                        !editColor && "bg-muted font-semibold"
                      )}
                      onClick={() => setEditColor('')}
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>

              {/* Archive Project Setting */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-[14px] justify-center col-span-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-muted-foreground block">Archive Project</span>
                      <span className="text-[10px] text-muted-foreground/80 mt-0.5 block">Hide from main board and projects view</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={editArchived}
                      onChange={(e) => setEditArchived(e.target.checked)}
                      className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl" onClick={() => router.push('/projects')}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-primary text-primary-foreground font-semibold px-6" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

    </div>
  );
}
