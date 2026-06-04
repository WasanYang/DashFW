'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { EditableNovelField } from '@/components/ui/editable-novel-field';
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
  Copy,
  Edit2,
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
  GripVertical,
  Play,
  FolderOpen,
  Settings2,
  Coins,
  Briefcase,
  AlertCircle,
  Info,
  Target
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
import { generateAiProjectNotes } from '@/ai/flows/ai-project-notes-flow';
import { useGetTaskTemplatesQuery } from '@/services/taskTemplateApiSlice';
import { formatNumber } from '@/lib/number-format';
import { cn } from '@/lib/utils';
import type { Client, SubTask } from '@/lib/types';

export default function ProjectDetailsPage() {
  const showTimeTracker = false;

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

  const [activeTab, setActiveTab] = useState<'Tasks' | 'Notes' | 'Calendar' | 'Timesheet' | 'Invoices' | 'Edit'>('Tasks');

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

  // Active Details Section Tab State
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingTabTitle, setEditingTabTitle] = useState('');

  // Helper to add template sections
  const addTemplateSection = async (title: string, defaultContent: string) => {
    if (!project) return;
    const newSectionId = `sec-${Date.now()}`;
    const newSection = {
      id: newSectionId,
      title: title,
      content: defaultContent
    };
    const currentSections = project.detailsSections || [];
    await updateProject({ id: project.id, data: { detailsSections: [...currentSections, newSection] } }).unwrap();
    setActiveSectionId(newSectionId);
  };

  // AI Notes Generator states & handlers
  const [isAiNotesOpen, setIsAiNotesOpen] = useState(false);
  const [aiNotesRawText, setAiNotesRawText] = useState('');
  const [isGeneratingAiNotes, setIsGeneratingAiNotes] = useState(false);
  const [aiNotesPreviewSections, setAiNotesPreviewSections] = useState<{ title: string; content: string; }[] | null>(null);
  const [aiNotesPreviewActiveTab, setAiNotesPreviewActiveTab] = useState<number>(0);

  const handleGenerateAiNotes = async () => {
    if (!aiNotesRawText.trim()) return;
    setIsGeneratingAiNotes(true);
    try {
      const res = await generateAiProjectNotes({ rawText: aiNotesRawText.trim() });
      if (res.sections && res.sections.length > 0) {
        setAiNotesPreviewSections(res.sections);
        setAiNotesPreviewActiveTab(0);
      } else {
        toast({
          title: "ไม่พบข้อมูล",
          description: "AI ไม่สามารถจัดระเบียบข้อมูลตามที่ส่งเข้าไปได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาดในการประมวลผล",
        description: "โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือคีย์ API",
        variant: "destructive"
      });
    } finally {
      setIsGeneratingAiNotes(false);
    }
  };

  const handleSaveAiNotes = async (overwrite: boolean) => {
    if (!aiNotesPreviewSections || aiNotesPreviewSections.length === 0 || !project) return;
    
    // Structure new sections
    const formattedSections = aiNotesPreviewSections.map((sec, idx) => ({
      id: `ai-sec-${Date.now()}-${idx}`,
      title: sec.title,
      content: sec.content
    }));
    
    let updatedSections = [];
    if (overwrite) {
      updatedSections = formattedSections;
    } else {
      updatedSections = [...(project.detailsSections || []), ...formattedSections];
    }
    
    try {
      await updateProject({
        id: project.id,
        data: { detailsSections: updatedSections }
      }).unwrap();
      
      toast({
        title: "สำเร็จ!",
        description: overwrite ? "สร้างแท็บใหม่เรียบร้อยแล้ว" : "เพิ่มแท็บใหม่เรียบร้อยแล้ว",
      });
      
      // Select the first newly added/replaced tab as the active one
      if (formattedSections.length > 0) {
        setActiveSectionId(formattedSections[0].id);
      }
      
      // Reset state and close modal
      setIsAiNotesOpen(false);
      setAiNotesPreviewSections(null);
      setAiNotesRawText('');
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลโน้ตเข้าโครงการได้",
        variant: "destructive"
      });
    }
  };

  // Templates Import states & handler
  const [isImportTemplateOpen, setIsImportTemplateOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [targetGroupIdForChecklist, setTargetGroupIdForChecklist] = useState<string>('');
  const { data: allTemplates = [] } = useGetTaskTemplatesQuery();

  const handleImportTemplate = async () => {
    if (!selectedTemplateId || !project) return;
    const template = allTemplates.find((t: any) => t._id === selectedTemplateId || t.id === selectedTemplateId);
    if (!template) return;

    try {
      if (template.type === 'project') {
        const groups = template.data.groups || [];
        for (const group of groups) {
          const formattedSubTasks: SubTask[] = [];
          (group.tasks || []).forEach((task: any, taskIdx: number) => {
            // Add the main task from template
            const parentSubTaskId = `imported-task-${Date.now()}-${taskIdx}-${Math.random().toString(36).substr(2, 9)}`;
            formattedSubTasks.push({
              id: parentSubTaskId,
              text: task.title,
              description: task.details || '',
              completed: false
            });

            // Flatten subtasks by adding them with two-space indentation
            (task.subTasks || []).forEach((sub: any, subIdx: number) => {
              formattedSubTasks.push({
                id: `imported-sub-${Date.now()}-${taskIdx}-${subIdx}-${Math.random().toString(36).substr(2, 9)}`,
                text: `  ${sub.text}`,
                completed: false
              });
            });
          });

          await addTask({
            title: group.title,
            projectId: id,
            clientId: project.clientId,
            status: 'Backlog',
            gross_price: 0,
            deadline: new Date(),
            revisions: 0,
            subTasks: formattedSubTasks,
            boardView: activeBoardView !== 'Main View' ? activeBoardView : undefined
          }).unwrap();
        }
      } else if (template.type === 'group') {
        const group = template.data.groups?.[0];
        if (group) {
          const formattedSubTasks: SubTask[] = [];
          (group.tasks || []).forEach((task: any, taskIdx: number) => {
            const parentSubTaskId = `imported-task-${Date.now()}-${taskIdx}-${Math.random().toString(36).substr(2, 9)}`;
            formattedSubTasks.push({
              id: parentSubTaskId,
              text: task.title,
              description: task.details || '',
              completed: false
            });

            (task.subTasks || []).forEach((sub: any, subIdx: number) => {
              formattedSubTasks.push({
                id: `imported-sub-${Date.now()}-${taskIdx}-${subIdx}-${Math.random().toString(36).substr(2, 9)}`,
                text: `  ${sub.text}`,
                completed: false
              });
            });
          });

          await addTask({
            title: group.title,
            projectId: id,
            clientId: project.clientId,
            status: 'Backlog',
            gross_price: 0,
            deadline: new Date(),
            revisions: 0,
            subTasks: formattedSubTasks,
            boardView: activeBoardView !== 'Main View' ? activeBoardView : undefined
          }).unwrap();
        }
      } else if (template.type === 'task') {
        if (!targetGroupIdForChecklist) {
          toast({
            title: "โปรดเลือกกลุ่มงาน",
            description: "คุณต้องเลือกกลุ่มงานเป้าหมายเพื่อนำเช็คลิสต์นี้ไปบันทึก",
            variant: "destructive"
          });
          return;
        }

        const targetTask = projectTasks.find(t => t.id === targetGroupIdForChecklist);
        if (targetTask) {
          const newSubTasks = (template.data.subTasks || []).map((sub: any, subIdx: number) => ({
            id: `imported-checklist-${Date.now()}-${subIdx}`,
            text: sub.text,
            completed: false
          }));

          const updatedSubTasks = [...(targetTask.subTasks || []), ...newSubTasks];
          await updateTask({ id: targetGroupIdForChecklist, data: { subTasks: updatedSubTasks } }).unwrap();
        }
      }

      toast({
        title: "สำเร็จ!",
        description: `นำแม่แบบ "${template.name}" ไปใช้งานเรียบร้อยแล้ว`,
      });
      setIsImportTemplateOpen(false);
      setSelectedTemplateId('');
      setTargetGroupIdForChecklist('');
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำแม่แบบไปติดตั้งได้",
        variant: "destructive"
      });
    }
  };

  // Task Details Sidebar State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<{ groupId: string, task: SubTask } | null>(null);

  // New item inputs
  const [newGroupName, setNewGroupName] = useState('');
  const [newTasksInputs, setNewTasksInputs] = useState<Record<string, string>>({});

  const project = projects.find((p) => p.id === id);

  // Project Edit states (Form State)
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editRevisions, setEditRevisions] = useState<number>(0);
  const [editDeadline, setEditDeadline] = useState<Date>(new Date());
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editBillable, setEditBillable] = useState(true);
  const [editHourlyRate, setEditHourlyRate] = useState<number | ''>('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editColor, setEditColor] = useState('');
  const [editArchived, setEditArchived] = useState(false);
  const [editPriority, setEditPriority] = useState('Medium');

  useEffect(() => {
    if (project) {
      setEditTitle(project.title || '');
      setEditSubtitle(project.subtitle || '');
      setEditDetails(project.details || '');
      setEditPrice(project.gross_price || 0);
      setEditRevisions(project.revisions || 0);
      setEditDeadline(project.deadline ? new Date(project.deadline) : new Date());
      setEditStartDate(project.startDate ? new Date(project.startDate) : undefined);
      setEditBillable(project.billable !== false);
      setEditHourlyRate(project.hourlyRate ?? '');
      setEditCurrency(project.currency || 'USD');
      setEditColor(project.color || '');
      setEditArchived(!!project.archived);
      setEditPriority(project.priority || 'Medium');
    }
  }, [project]);

  // Synchronize active details section tab
  useEffect(() => {
    if (project?.detailsSections && project.detailsSections.length > 0) {
      if (!activeSectionId || !project.detailsSections.some(s => s.id === activeSectionId)) {
        setActiveSectionId(project.detailsSections[0].id);
      }
    } else {
      setActiveSectionId(null);
    }
  }, [project, activeSectionId]);

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
  const distinctViews = Array.from(new Set([
    ...(project?.boardViews || []),
    ...projectTasks.map(t => t.boardView || 'Main View')
  ]));
  if (!distinctViews.includes('Main View')) {
    distinctViews.unshift('Main View');
  }

  // Filter tasks in active view
  const filteredTasksByView = projectTasks.filter(t => (t.boardView || 'Main View') === activeBoardView);

  // Map tasks to taskGroups format for UI checklist
  const taskGroups = (() => {
    let rawGroups = filteredTasksByView.map((t) => ({
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

  // Calculate statistics based on current active view
  const totalTasksCount = filteredTasksByView.reduce((sum, t) => sum + (t.subTasks?.length || 0) + 1, 0);
  const completedTasksCount = filteredTasksByView.reduce((sum, t) => {
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

  const onDragEndSections = async (result: DropResult) => {
    if (!result.destination || !project?.detailsSections) return;
    const { source, destination } = result;
    if (source.index === destination.index) return;
    
    const newSections = Array.from(project.detailsSections);
    const [moved] = newSections.splice(source.index, 1);
    newSections.splice(destination.index, 0, moved);
    
    await updateProject({ id: project.id, data: { detailsSections: newSections } }).unwrap();
  };

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, type } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    if (type === 'task') {
      const sourceGroupId = source.droppableId;
      const destinationGroupId = destination.droppableId;
      
      const sourceGroup = projectTasks.find(t => t.id === sourceGroupId);
      const destinationGroup = projectTasks.find(t => t.id === destinationGroupId);
      
      if (!sourceGroup || !destinationGroup) return;

      if (sourceGroupId === destinationGroupId) {
        // Reordering within the same group
        const newSubTasks = Array.from(sourceGroup.subTasks || []);
        const [movedTask] = newSubTasks.splice(source.index, 1);
        newSubTasks.splice(destination.index, 0, movedTask);
        
        await updateTask({ id: sourceGroupId, data: { subTasks: newSubTasks } }).unwrap();
      } else {
        // Moving between groups
        const sourceSubTasks = Array.from(sourceGroup.subTasks || []);
        const destSubTasks = Array.from(destinationGroup.subTasks || []);
        
        const [movedTask] = sourceSubTasks.splice(source.index, 1);
        destSubTasks.splice(destination.index, 0, movedTask);
        
        await Promise.all([
          updateTask({ id: sourceGroupId, data: { subTasks: sourceSubTasks } }).unwrap(),
          updateTask({ id: destinationGroupId, data: { subTasks: destSubTasks } }).unwrap()
        ]);
      }
    }
  };

  // CRUD View handlers for renaming a view
  const handleRenameView = async (oldName: string, newName: string) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingViewName(null);
      return;
    }
    
    // 1. Save new view list to project so empty views persist
    const newViews = distinctViews.map(v => v === oldName ? trimmed : v);
    if (!newViews.includes(trimmed)) newViews.push(trimmed);
    
    try {
      await updateProject({ id, data: { boardViews: Array.from(new Set(newViews)) } }).unwrap();
      
      // 2. Find all tasks currently in this view and update them
      const tasksInView = projectTasks.filter(t => (t.boardView || 'Main View') === oldName);
      if (tasksInView.length > 0) {
        await Promise.all(
          tasksInView.map(t => 
            updateTask({ id: t.id, data: { boardView: trimmed } }).unwrap()
          )
        );
      }
      toast({ title: 'สำเร็จ', description: `เปลี่ยนชื่อเป็น "${trimmed}" เรียบร้อย` });
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเปลี่ยนชื่อ View ได้', variant: 'destructive' });
    }
    
    setEditingViewName(null);
    setActiveBoardView(trimmed);
  };

  const handleAddView = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed || distinctViews.includes(trimmed)) return;
    const newViews = [...distinctViews, trimmed];
    try {
      await updateProject({ id, data: { boardViews: newViews } }).unwrap();
      setActiveBoardView(trimmed);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถเพิ่ม View ใหม่ได้', variant: 'destructive' });
    }
  };

  const handleDuplicateView = async (viewName: string) => {
    const newViewName = `${viewName} (Copy)`;
    
    // 1. Add to project.boardViews
    const newViews = [...distinctViews, newViewName];
    try {
      await updateProject({ id, data: { boardViews: newViews } }).unwrap();
      
      // 2. Duplicate all tasks
      const tasksInView = projectTasks.filter(t => (t.boardView || 'Main View') === viewName);
      if (tasksInView.length > 0) {
        await Promise.all(
          tasksInView.map(t => {
            const taskData: any = { ...t };
            delete taskData.id;
            delete taskData.googleEventId;
            return addTask({ ...taskData, boardView: newViewName }).unwrap();
          })
        );
      }
      toast({ title: 'ทำสำเนาสำเร็จ', description: `สร้าง "${newViewName}" เรียบร้อยแล้ว` });
      setActiveBoardView(newViewName);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถทำสำเนา View ได้', variant: 'destructive' });
    }
  };

  const handleDeleteView = async (viewName: string) => {
    if (viewName === 'Main View') {
      toast({ title: 'ไม่สามารถลบได้', description: 'Main View เป็นมุมมองหลักของโปรเจกต์', variant: 'destructive' });
      return;
    }
    if (!window.confirm(`คุณต้องการลบ View "${viewName}" และงานทั้งหมดที่อยู่ในนี้ใช่หรือไม่?`)) return;
    
    // 1. Remove from project.boardViews
    const newViews = distinctViews.filter(v => v !== viewName);
    try {
      await updateProject({ id, data: { boardViews: newViews } }).unwrap();
      
      // 2. Delete all tasks in this view
      const tasksInView = projectTasks.filter(t => t.boardView === viewName);
      if (tasksInView.length > 0) {
        await Promise.all(
          tasksInView.map(t => deleteTask({ id: t.id }).unwrap())
        );
      }
      toast({ title: 'ลบสำเร็จ', description: `ลบ View "${viewName}" เรียบร้อยแล้ว` });
      setActiveBoardView('Main View');
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบ View ได้', variant: 'destructive' });
    }
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

    // Check if all subtasks are completed
    const allCompleted = updatedSubTasks.length > 0 && updatedSubTasks.every(st => st.completed);
    
    // Determine new status for parent task
    let newStatus = targetTask.status;
    if (allCompleted) {
      newStatus = 'Completed';
    } else if (!checked && targetTask.status === 'Completed') {
      newStatus = 'In Progress';
    }

    await updateTask({ 
      id: parentTaskId, 
      data: { 
        subTasks: updatedSubTasks,
        status: newStatus
      } 
    }).unwrap();
  };

  // Toggle parent task (group) status directly
  const handleToggleGroupStatus = async (groupId: string, checked: boolean) => {
    const targetTask = projectTasks.find(t => t.id === groupId);
    if (!targetTask) return;

    const newStatus = checked ? 'Completed' : 'In Progress';
    
    // Also toggle all subtasks to match group checked state
    const updatedSubTasks = (targetTask.subTasks || []).map(st => ({
      ...st,
      completed: checked
    }));

    await updateTask({ 
      id: groupId, 
      data: { 
        status: newStatus,
        subTasks: updatedSubTasks
      } 
    }).unwrap();

    toast({ title: checked ? 'ทำเครื่องหมายเสร็จสิ้นกลุ่มงานแล้ว' : 'เปลี่ยนสถานะกลุ่มงานเป็นกำลังดำเนินการ' });
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
          details: editDetails,
          gross_price: editPrice,
          revisions: editRevisions,
          deadline: editDeadline,
          startDate: editStartDate,
          billable: editBillable,
          hourlyRate: editHourlyRate === '' ? undefined : editHourlyRate,
          currency: editCurrency,
          color: editColor,
          archived: editArchived,
          priority: editPriority
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
    <div className='flex flex-col gap-6 p-4 md:px-8 md:py-6 w-full min-h-full'>
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
          <Button
            variant={activeTab === 'Edit' ? 'default' : 'outline'}
            size="icon"
            onClick={() => setActiveTab('Edit')}
            className={cn(
              "rounded-xl h-9 w-9 border-border/60 transition-all",
              activeTab === 'Edit' && "bg-primary text-primary-foreground border-primary"
            )}
            title="Project Settings"
          >
            <Settings2 className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </div>

      {/* 2. SUB-NAVIGATION TABS (Lavender horizontal tab row) */}
      <div className="flex bg-card p-1.5 rounded-2xl border border-border/60 shadow-xs overflow-x-auto print:hidden shrink-0">
        {((['Tasks', 'Notes', 'Calendar', 'Timesheet', 'Invoices', 'Edit'] as const).filter(t => showTimeTracker || t !== 'Timesheet')).map((tab) => {
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
            
            {/* Horizontal Board Views - Browser Tab Style (matching Notes tab style) */}
            <div className="flex items-end gap-1 border-b border-border/80 px-1 mb-6 overflow-x-auto scrollbar-none">
              {distinctViews.map(view => {
                const isActive = activeBoardView === view;
                return editingViewName === view ? (
                  <Input
                    key={`edit-${view}`}
                    autoFocus
                    value={editedViewNameValue}
                    onChange={(e) => setEditedViewNameValue(e.target.value)}
                    onBlur={() => handleRenameView(view, editedViewNameValue)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameView(view, editedViewNameValue);
                      else if (e.key === 'Escape') setEditingViewName(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="h-6 py-0.5 px-2 text-xs w-28 border border-primary/50 focus-visible:ring-1 focus-visible:ring-primary rounded-md bg-background mb-1"
                  />
                ) : (
                  <div
                    key={view}
                    onClick={() => setActiveBoardView(view)}
                    className={`
                      flex items-center gap-1.5 px-4 py-2 border rounded-t-xl select-none cursor-pointer transition-all duration-150 shrink-0
                      ${isActive 
                        ? 'bg-card border-border border-b-transparent text-primary font-bold shadow-[0_-3px_8px_-3px_rgba(0,0,0,0.08)] translate-y-[1px]' 
                        : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                      }
                    `}
                  >
                    <span 
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setEditingViewName(view);
                        setEditedViewNameValue(view);
                      }}
                      className="text-sm font-semibold select-none truncate max-w-[120px]"
                      title="Double-click to rename"
                    >
                      {view}
                    </span>
                    {view !== 'Main View' && (
                      <button
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (!window.confirm(`Are you sure you want to delete "${view}"?`)) return;
                          handleDeleteView(view);
                        }}
                        className="p-0.5 rounded-full hover:bg-muted-foreground/15 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                );
              })}
              
              {isAddViewOpen ? (
                <div className="flex items-center gap-1 ml-2 shrink-0 mb-1.5">
                  <Input
                    value={newViewName}
                    onChange={(e) => setNewViewName(e.target.value)}
                    placeholder="New view name..."
                    className="h-6 text-xs w-28 border border-primary/50 focus-visible:ring-1 focus-visible:ring-primary rounded-md bg-background px-2 py-0.5"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newViewName.trim()) {
                        handleAddView(newViewName);
                        setNewViewName('');
                        setIsAddViewOpen(false);
                      }
                      if (e.key === 'Escape') setIsAddViewOpen(false);
                    }}
                  />
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-green-600 rounded-md" onClick={() => {
                    if (newViewName.trim()) {
                      setActiveBoardView(newViewName.trim());
                      setNewViewName('');
                      setIsAddViewOpen(false);
                    }
                  }}>
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground rounded-md" onClick={() => setIsAddViewOpen(false)}>
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="icon"
                  className="rounded-lg h-7 w-7 text-muted-foreground ml-2 shrink-0 bg-transparent hover:bg-muted/50 mb-1"
                  onClick={() => setIsAddViewOpen(true)}
                  title="Add new view"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>

            {/* Search and task stats toolbar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border/60">
              <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
                <div className="relative w-full sm:max-w-xs">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tasks..."
                    value={taskSearchQuery}
                    onChange={(e) => setTaskSearchQuery(e.target.value)}
                    className="pl-9 h-9 rounded-xl border-border/60 text-xs bg-background"
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Input
                    placeholder="เพิ่มหัวข้องานหลัก..."
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                    className="h-9 w-full sm:w-48 rounded-xl text-xs border-border/60 bg-background"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddTaskGroup();
                    }}
                  />
                  <Button
                    onClick={handleAddTaskGroup}
                    className="h-9 rounded-xl bg-primary text-primary-foreground font-semibold px-3 gap-1 text-xs shrink-0"
                  >
                    <Plus className="w-3.5 h-3.5" /> หัวข้องาน
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setIsImportTemplateOpen(true)}
                    className="h-9 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:text-primary transition-all font-semibold px-3 gap-1 text-xs shrink-0"
                  >
                    <FolderOpen className="w-3.5 h-3.5 text-primary shrink-0" />
                    ใช้เทมเพลต (Templates)
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                <div className="flex items-center gap-2 flex-grow sm:flex-grow-0">
                  <Progress value={progressPercent} className="w-24 sm:w-32 h-2" />
                  <span className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                    {completedTasksCount}/{totalTasksCount} items ({Math.round(progressPercent)}%)
                  </span>
                </div>
              </div>
            </div>

            {/* List of Task Groups (Checklist Sheet) */}
            <div className="bg-card border border-border/60 rounded-2xl shadow-xs overflow-hidden">
              <DragDropContext onDragEnd={onDragEnd}>
                <div className="divide-y divide-border/40">
                  {taskGroups.length === 0 ? (
                    <div className="py-16 text-center text-xs text-muted-foreground bg-card">
                      <ListTodo className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      No tasks found. Create a new main task or use AI to generate a checklist.
                    </div>
                  ) : (
                    taskGroups.map((group) => (
                      <div key={group.id} className="p-5 space-y-3 transition-colors hover:bg-muted/5 group/section">
                        {/* Group Header */}
                        <div className="flex items-center justify-between gap-3 border-b border-border/40 pb-2">
                          <div className="flex items-center gap-2.5 flex-grow">
                            <input
                              type="checkbox"
                              checked={group.completed}
                              onChange={(e) => handleToggleGroupStatus(group.id, e.target.checked)}
                              className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                            />
                            {editingId === group.id ? (
                              <div className="flex items-center gap-1.5 flex-grow">
                                <Input
                                  value={editingText}
                                  onChange={(e) => setEditingText(e.target.value)}
                                  className="h-7 text-xs font-semibold max-w-xs border-primary"
                                  autoFocus
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameTaskOrGroup(group.id, editingText);
                                  }}
                                />
                                <Button size="icon" className="h-7 w-7 bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => handleRenameTaskOrGroup(group.id, editingText)}>
                                  <Check className="w-3.5 h-3.5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => setEditingId(null)}>
                                  <X className="w-3.5 h-3.5" />
                                </Button>
                              </div>
                            ) : (
                              <h3
                                className={cn(
                                  "font-bold text-sm cursor-pointer flex items-center gap-2 hover:text-primary transition-colors",
                                  group.completed ? "line-through text-muted-foreground/60" : "text-foreground"
                                )}
                                onClick={() => {
                                  setEditingId(group.id);
                                  setEditingText(group.text);
                                }}
                              >
                                {group.text}
                                {group.completed && (
                                  <Badge variant="secondary" className="text-[9px] text-green-600 bg-green-50 hover:bg-green-50 border-none font-bold px-1.5 py-0">Done</Badge>
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
                            className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover/section:opacity-100 transition-opacity"
                            onClick={() => handleDeleteTaskOrGroup(group.id)}
                            title="Delete Group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>

                        {/* Task Group list items */}
                        <Droppable droppableId={group.id} type="task">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-1.5"
                            >
                              {(group.children || []).map((task, taskIdx) => (
                                <Draggable key={task.id} draggableId={task.id} index={taskIdx}>
                                  {(provided, snapshot) => (
                                    <div
                                      ref={provided.innerRef}
                                      {...provided.draggableProps}
                                      className={cn(
                                        "flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/40 transition-all gap-4 group/row border border-transparent",
                                        snapshot.isDragging && "shadow-lg bg-card border-primary/20 opacity-95 z-50"
                                      )}
                                    >
                                      <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div
                                          {...provided.dragHandleProps}
                                          className="cursor-grab text-muted-foreground/30 hover:text-foreground opacity-0 group-hover/row:opacity-100 transition-opacity shrink-0"
                                        >
                                          <GripVertical className="h-4 w-4" />
                                        </div>
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
                                            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => handleRenameTaskOrGroup(task.id, editingText, group.id)}>
                                              <Check className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setEditingId(null)}>
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <span
                                            className={cn(
                                              "text-xs text-foreground cursor-pointer flex-1 truncate hover:text-primary transition-colors",
                                              task.completed && "line-through text-muted-foreground/60"
                                            )}
                                            onClick={() => {
                                              setSelectedTaskDetail({ groupId: group.id, task: task as SubTask });
                                            }}
                                          >
                                            {task.text}
                                          </span>
                                        )}
                                      </div>

                                      {/* Badges & Actions */}
                                      <div className="flex items-center gap-3 shrink-0 ml-4">
                                        {/* Due Date Indicator */}
                                        {task.dueDate && (
                                          <div className={cn(
                                            "flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium border hidden sm:flex",
                                            (() => {
                                              const overdue = new Date(task.dueDate) < new Date() && !task.completed;
                                              return overdue 
                                                ? "bg-red-50 text-red-600 border-red-100 dark:bg-red-950/20 dark:text-red-400 dark:border-red-900/30" 
                                                : "bg-muted text-muted-foreground border-border/40";
                                            })()
                                          )}>
                                            <CalendarIcon className="w-3 h-3 text-muted-foreground/70" />
                                            <span>{format(new Date(task.dueDate), 'dd/MM/yyyy')}</span>
                                          </div>
                                        )}

                                        {/* Assignee Avatar */}
                                        {task.assignee ? (
                                          <Avatar className="h-6 w-6 border border-border/50 hidden sm:flex">
                                            <AvatarFallback className="text-[9px] bg-purple-100 text-purple-700 font-bold">{task.assignee.charAt(0)}</AvatarFallback>
                                          </Avatar>
                                        ) : (
                                          <div className="h-6 w-6 rounded-full bg-muted border border-border/50 border-dashed flex items-center justify-center hidden sm:flex">
                                            <UserCircle className="w-3 h-3 text-muted-foreground/40" />
                                          </div>
                                        )}
                                        
                                        <div className="flex items-center gap-1">
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive opacity-0 group-hover/row:opacity-100 transition-opacity rounded-lg"
                                            onClick={() => handleDeleteTaskOrGroup(task.id, group.id)}
                                            title="Delete Task"
                                          >
                                            <Trash2 className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>

                        {/* Add new task input inside group */}
                        <div className="flex gap-1 items-center pt-2 pl-2 pb-2 mt-1">
                          <Button
                            onClick={() => handleAddTaskInGroup(group.id)}
                            variant="ghost"
                            className="h-8 px-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-md shrink-0"
                            title="Add Task"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                          <Input
                            placeholder="Add a new task..."
                            value={newTasksInputs[group.id] || ''}
                            onChange={(e) => setNewTasksInputs(prev => ({ ...prev, [group.id]: e.target.value }))}
                            className="h-8 text-xs border-transparent shadow-none bg-transparent hover:bg-muted/20 focus-visible:ring-0 focus-visible:bg-background focus-visible:border-border/50 max-w-sm px-2 transition-colors rounded-md"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleAddTaskInGroup(group.id);
                            }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </DragDropContext>
            </div>

            {/* AI Generator Box inside Tasks tab */}
            <div className="bg-card rounded-2xl p-5 border border-border/60 shadow-xs space-y-3">
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
              <div className="flex items-center justify-between p-4 border-b border-border/40 bg-card">
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
        {activeTab === 'Timesheet' && showTimeTracker && (
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
                      <tr className="border-b border-border/40 bg-transparent text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
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
          <Card className="border border-border/60 shadow-sm rounded-2xl bg-card overflow-hidden">
            <CardHeader className="border-b border-border/40 bg-card pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" /> Project Container Settings
              </CardTitle>
              <CardDescription>Configure pricing, timelines, currencies, priorities, and tag colors for this project container</CardDescription>
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                
                {/* LEFT COLUMN: General Info & Scope */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2 border-b border-border/40 pb-2">
                    <FileText className="w-4 h-4 text-primary/80" /> General Details
                  </h3>

                  {/* Project Title */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Title</span>
                    <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      <Briefcase className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground w-full h-6"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        placeholder="Project title..."
                      />
                    </div>
                  </div>

                  {/* Subtitle */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Subtitle / Short Tagline</span>
                    <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      <AlignLeft className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <input
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground w-full h-6"
                        value={editSubtitle}
                        onChange={(e) => setEditSubtitle(e.target.value)}
                        placeholder="Subtitle..."
                      />
                    </div>
                  </div>

                  {/* Scope details */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Scope Details (Description)</span>
                    <div className="flex border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      <textarea
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/40 w-full resize-none min-h-[100px]"
                        placeholder="Describe the scope of work or general notes for this project retainer..."
                        value={editDetails}
                        onChange={(e) => setEditDetails(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Project Tag Color */}
                  <div className="flex flex-col gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Tag Color</span>
                    <div className="flex flex-wrap gap-2.5 items-center">
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
                            "w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center shadow-sm",
                            editColor === c.hex
                              ? "border-primary ring-2 ring-primary/25 scale-110"
                              : "border-transparent"
                          )}
                          style={{ backgroundColor: c.hex }}
                          onClick={() => setEditColor(c.hex)}
                          title={c.name}
                        >
                          {editColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                        </button>
                      ))}
                      <button
                        type="button"
                        className={cn(
                          "px-3 py-1 text-xs border rounded-lg hover:bg-muted transition-colors h-7 flex items-center justify-center font-semibold",
                          !editColor ? "bg-muted text-primary border-primary/20" : "text-muted-foreground border-border"
                        )}
                        onClick={() => setEditColor('')}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Timelines & Budgets */}
                <div className="space-y-6">
                  <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2 border-b border-border/40 pb-2">
                    <CalendarDays className="w-4 h-4 text-primary/80" /> Timeline & Budget
                  </h3>

                  {/* Dates: Kickoff and Deadline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Kickoff Date */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kickoff Date</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal text-sm h-10 rounded-xl px-3 border-input bg-background hover:bg-muted/50 gap-2",
                              !editStartDate && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                            <span className="truncate">
                              {editStartDate ? format(editStartDate, 'PPP') : 'Pick kickoff date'}
                            </span>
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

                    {/* Deadline */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Deadline (Due Date)</span>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal text-sm h-10 rounded-xl px-3 border-input bg-background hover:bg-muted/50 gap-2",
                              !editDeadline && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                            <span className="truncate">
                              {editDeadline ? format(editDeadline, 'PPP') : 'Pick deadline date'}
                            </span>
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
                  </div>

                  {/* Priority Setting */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Project Priority</span>
                    <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                      <AlertCircle className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <select
                        value={editPriority}
                        onChange={(e) => setEditPriority(e.target.value)}
                        className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground font-semibold w-full h-6 cursor-pointer"
                      >
                        <option value="Urgent">🔴 Urgent Priority</option>
                        <option value="High">🟠 High Priority</option>
                        <option value="Medium">🟡 Medium Priority</option>
                        <option value="Low">🔵 Low Priority</option>
                      </select>
                    </div>
                  </div>

                  {/* Budget and Revisions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Budget */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Gross Budget</span>
                      <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                        <span className="text-sm text-muted-foreground font-semibold">{editCurrency === 'USD' ? '$' : '฿'}</span>
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground font-bold w-full h-6"
                          value={editPrice}
                          onChange={(e) => setEditPrice(Number(e.target.value))}
                        />
                      </div>
                    </div>

                    {/* Revisions */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Target Revisions</span>
                      <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                        <Target className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                        <input
                          type="number"
                          className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground w-full h-6"
                          value={editRevisions}
                          onChange={(e) => setEditRevisions(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Billing Settings card */}
                  <div className="border border-border/50 bg-card rounded-2xl p-4 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Coins className="w-4 h-4 text-primary shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-foreground block">Billable Retainer</span>
                          <span className="text-[10px] text-muted-foreground">Charge clients by hourly rate for this container</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editBillable}
                        onChange={(e) => setEditBillable(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                      />
                    </div>

                    {editBillable && (
                      <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Currency</label>
                          <select
                            value={editCurrency}
                            onChange={(e) => setEditCurrency(e.target.value)}
                            className="border border-input rounded-xl px-2.5 py-1 text-sm h-10 bg-background cursor-pointer focus:ring-primary focus:border-primary"
                          >
                            <option value="USD">USD ($)</option>
                            <option value="THB">THB (฿)</option>
                            <option value="EUR">EUR (€)</option>
                          </select>
                        </div>

                        <div className="flex flex-col gap-1">
                          <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Hourly Rate</label>
                          <Input
                            type="number"
                            placeholder="Hourly Rate"
                            value={editHourlyRate}
                            onChange={(e) => setEditHourlyRate(e.target.value ? Number(e.target.value) : '')}
                            className="h-10 rounded-xl px-3 border-input bg-background"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Archive settings */}
                  <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <Archive className="w-4 h-4 text-destructive shrink-0" />
                        <div>
                          <span className="text-xs font-bold text-destructive block">Archive Container</span>
                          <span className="text-[10px] text-muted-foreground">Archive this project container and hide it from active boards</span>
                        </div>
                      </div>
                      <input
                        type="checkbox"
                        checked={editArchived}
                        onChange={(e) => setEditArchived(e.target.checked)}
                        className="h-4.5 w-4.5 rounded border-gray-300 text-destructive focus:ring-destructive cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

              </div>

              {/* Form Buttons */}
              <div className="border-t border-border/40 pt-6 flex justify-end gap-3">
                <Button variant="outline" className="rounded-xl px-5 h-10" onClick={() => router.push('/projects')}>
                  Cancel
                </Button>
                <Button className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 h-10 shadow-sm" onClick={handleSaveChanges}>
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* ---------------- NOTES TAB (Horizontal Tabs) ---------------- */}
        {activeTab === 'Notes' && (
          <div className="bg-card border border-border/60 rounded-2xl p-6 shadow-sm flex flex-col gap-6">
            <div className="flex justify-between items-center border-b border-border/40 pb-4">
              <div>
                <h2 className="text-lg font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Project Notes & Details
                </h2>
                <p className="text-sm text-muted-foreground">
                  Manage OTA details, Google Ads keywords, and other notes here.
                </p>
              </div>
              <Button
                onClick={() => setIsAiNotesOpen(true)}
                className="gap-2 rounded-xl shadow-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:text-primary transition-all font-semibold text-xs h-9"
              >
                <Sparkles className="w-3.5 h-3.5 text-primary animate-pulse shrink-0" />
                สร้างแท็บด้วย AI
              </Button>
            </div>

            {(!project.detailsSections || project.detailsSections.length === 0) ? (
              <div className="text-center py-12 bg-card border border-dashed border-border/60 rounded-xl max-w-xl mx-auto w-full px-6 shadow-xs">
                <FileText className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <h3 className="font-semibold text-base mb-1">ยังไม่มีหัวข้อโน้ตย่อหรือรายละเอียด</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  เริ่มต้นบันทึกข้อมูลและจัดกลุ่มด้วยแท็บต่างๆ โดยใช้เทมเพลตเริ่มต้นด้านล่าง หรือสร้างแท็บเปล่าขึ้นใหม่
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 h-10 px-3 rounded-lg border-primary/20 hover:border-primary/50 text-foreground"
                    onClick={() => addTemplateSection(
                      'General Notes',
                      '<h3>General Notes</h3><p>Start recording general information, notes, and instructions here...</p>'
                    )}
                  >
                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                    <span className="truncate text-xs">General Notes</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 h-10 px-3 rounded-lg border-primary/20 hover:border-primary/50 text-foreground"
                    onClick={() => addTemplateSection(
                      'OTA Setup',
                      '<h3>OTA Setup Checklist</h3><p>Use this area to track credentials, URLs, and properties setup status.</p><table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead style="background-color: #f3f4f6;"><tr><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Platform</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Username / ID</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Status</th></tr></thead><tbody><tr><td style="border: 1px solid #d1d5db; padding: 8px;">Booking.com</td><td style="border: 1px solid #d1d5db; padding: 8px;">-</td><td style="border: 1px solid #d1d5db; padding: 8px;">Pending</td></tr><tr><td style="border: 1px solid #d1d5db; padding: 8px;">Agoda</td><td style="border: 1px solid #d1d5db; padding: 8px;">-</td><td style="border: 1px solid #d1d5db; padding: 8px;">Pending</td></tr><tr><td style="border: 1px solid #d1d5db; padding: 8px;">Trip.com</td><td style="border: 1px solid #d1d5db; padding: 8px;">-</td><td style="border: 1px solid #d1d5db; padding: 8px;">Pending</td></tr></tbody></table>'
                    )}
                  >
                    <Building2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span className="truncate text-xs">OTA Setup</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 h-10 px-3 rounded-lg border-primary/20 hover:border-primary/50 text-foreground"
                    onClick={() => addTemplateSection(
                      'SEO Keywords',
                      '<h3>SEO Keyword Strategy</h3><p>Define target search keywords, competition level, and search volume goals.</p><table style="width: 100%; border-collapse: collapse; margin-top: 10px;"><thead style="background-color: #f3f4f6;"><tr><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Target Keyword</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Search Volume</th><th style="border: 1px solid #d1d5db; padding: 8px; text-align: left;">Difficulty</th></tr></thead><tbody><tr><td style="border: 1px solid #d1d5db; padding: 8px;">example keyword</td><td style="border: 1px solid #d1d5db; padding: 8px;">1,200/mo</td><td style="border: 1px solid #d1d5db; padding: 8px;">Low</td></tr></tbody></table>'
                    )}
                  >
                    <Search className="w-4 h-4 text-purple-500 shrink-0" />
                    <span className="truncate text-xs">SEO Keywords</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="justify-start gap-2 h-10 px-3 rounded-lg border-primary/20 hover:border-primary/50 text-foreground"
                    onClick={() => addTemplateSection(
                      'Client Brief',
                      '<h3>Client Project Brief</h3><p>Summarize key objectives, milestones, and deliverable targets.</p><ul><li><strong>Project Scope:</strong> </li><li><strong>Design Preferences:</strong> </li><li><strong>Key Deliverables:</strong> </li><li><strong>Important Assets Links:</strong> </li></ul>'
                    )}
                  >
                    <MessageSquare className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className="truncate text-xs">Client Brief</span>
                  </Button>
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-3">
                  <Button 
                    onClick={async () => {
                      const newSectionId = `sec-${Date.now()}`;
                      const newSection = {
                        id: newSectionId,
                        title: 'New Section',
                        content: ''
                      };
                      await updateProject({ id: project.id, data: { detailsSections: [newSection] } }).unwrap();
                      setActiveSectionId(newSectionId);
                    }}
                    className="gap-2 px-6 rounded-xl shadow-sm"
                  >
                    <Plus className="w-4 h-4" /> สร้างแท็บเปล่า
                  </Button>
                  <Button 
                    onClick={() => setIsAiNotesOpen(true)}
                    className="gap-2 px-6 rounded-xl shadow-sm bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold"
                  >
                    <Sparkles className="w-4 h-4 text-white animate-pulse" /> สร้างแท็บด้วย AI
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-4">
                {/* Horizontal Tab strip with drag and drop */}
                <DragDropContext onDragEnd={onDragEndSections}>
                  <Droppable droppableId="details-sections-tabs" direction="horizontal">
                    {(provided) => (
                      <div 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                        className="flex items-center gap-1 border-b border-border/80 px-1 -mb-px overflow-x-auto scrollbar-none"
                      >
                        {(project.detailsSections || []).map((section, index) => {
                          const isActive = activeSectionId === section.id;
                          return (
                            <Draggable key={section.id} draggableId={section.id} index={index}>
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  {...provided.dragHandleProps}
                                  onClick={() => setActiveSectionId(section.id)}
                                  className={`
                                    flex items-center gap-1.5 px-4 py-2 border rounded-t-xl select-none cursor-pointer transition-all duration-150 shrink-0
                                    ${isActive 
                                      ? 'bg-card border-border border-b-transparent text-primary font-bold shadow-[0_-3px_8px_-3px_rgba(0,0,0,0.08)]' 
                                      : 'bg-transparent border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground'
                                    }
                                  `}
                                >
                                  <GripVertical className="w-3.5 h-3.5 text-muted-foreground/30 cursor-grab shrink-0" />
                                  {editingTabId === section.id ? (
                                    <Input
                                      autoFocus
                                      value={editingTabTitle}
                                      onChange={(e) => setEditingTabTitle(e.target.value)}
                                      onBlur={async () => {
                                        if (editingTabTitle.trim()) {
                                          const newSections = project.detailsSections!.map(s => s.id === section.id ? { ...s, title: editingTabTitle.trim() } : s);
                                          await updateProject({ id: project.id, data: { detailsSections: newSections } }).unwrap();
                                        }
                                        setEditingTabId(null);
                                      }}
                                      onKeyDown={async (e) => {
                                        if (e.key === 'Enter') {
                                          if (editingTabTitle.trim()) {
                                            const newSections = project.detailsSections!.map(s => s.id === section.id ? { ...s, title: editingTabTitle.trim() } : s);
                                            await updateProject({ id: project.id, data: { detailsSections: newSections } }).unwrap();
                                          }
                                          setEditingTabId(null);
                                        } else if (e.key === 'Escape') {
                                          setEditingTabId(null);
                                        }
                                      }}
                                      onClick={(e) => e.stopPropagation()}
                                      className="h-6 py-0.5 px-2 text-xs w-28 border border-primary/50 focus-visible:ring-1 focus-visible:ring-primary rounded-md bg-background"
                                    />
                                  ) : (
                                    <span 
                                      onDoubleClick={(e) => {
                                        e.stopPropagation();
                                        setEditingTabId(section.id);
                                        setEditingTabTitle(section.title);
                                      }}
                                      className="text-sm font-semibold select-none truncate max-w-[120px]"
                                      title="Double-click to rename"
                                    >
                                      {section.title}
                                    </span>
                                  )}
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (!window.confirm(`Are you sure you want to delete "${section.title}"?`)) return;
                                      const newSections = project.detailsSections!.filter(s => s.id !== section.id);
                                      await updateProject({ id: project.id, data: { detailsSections: newSections } }).unwrap();
                                      if (activeSectionId === section.id) {
                                        setActiveSectionId(newSections.length > 0 ? newSections[0].id : null);
                                      }
                                    }}
                                    className="p-0.5 rounded-full hover:bg-muted-foreground/15 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}
                        {provided.placeholder}

                        {/* Add Section Button */}
                        <Button 
                          onClick={async () => {
                            const newSectionId = `sec-${Date.now()}`;
                            const newSection = {
                              id: newSectionId,
                              title: 'New Tab',
                              content: ''
                            };
                            await updateProject({ id: project.id, data: { detailsSections: [...(project.detailsSections || []), newSection] } }).unwrap();
                            setActiveSectionId(newSectionId);
                          }} 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground shrink-0 ml-1 hover:bg-muted/40"
                          title="Add new note tab"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>

                {/* Tab content area */}
                {(() => {
                  const activeSection = project.detailsSections.find(s => s.id === activeSectionId) || project.detailsSections[0];
                  if (!activeSection) return null;

                  return (
                    <div className="bg-card rounded-xl p-2 border border-border/60 shadow-xs mt-2">
                      <EditableNovelField
                        key={activeSection.id}
                        value={activeSection.content}
                        onChange={async (newContent) => {
                          const newSections = project.detailsSections!.map(s => s.id === activeSection.id ? { ...s, content: newContent } : s);
                          await updateProject({ id: project.id, data: { detailsSections: newSections } }).unwrap();
                        }}
                        placeholder={`Start typing details for ${activeSection.title}... (Supports tables and rich text formatting)`}
                      />
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        )}

        {/* Import Template Dialog */}
        <Dialog open={isImportTemplateOpen} onOpenChange={setIsImportTemplateOpen}>
          <DialogContent className="rounded-2xl max-w-lg bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2">
                <FolderOpen className="w-5 h-5 text-primary" />
                เลือกเทมเพลตที่ต้องการใช้งาน
              </DialogTitle>
              <DialogDescription>
                เลือกแผนเทมเพลตเพื่อนำเข้าไปสร้างในโครงการนี้
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-2">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold text-muted-foreground">เทมเพลต (Template)</Label>
                <Select value={selectedTemplateId} onValueChange={(val) => {
                  setSelectedTemplateId(val);
                  const tpl = allTemplates.find((t: any) => t._id === val || t.id === val);
                  if (tpl && tpl.type !== 'task') {
                    setTargetGroupIdForChecklist('');
                  }
                }}>
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="เลือกเทมเพลต" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {allTemplates.length === 0 ? (
                      <SelectItem value="none" disabled>ไม่มีเทมเพลตในระบบ</SelectItem>
                    ) : (
                      allTemplates.map((tpl: any) => (
                        <SelectItem key={tpl._id || tpl.id} value={tpl._id || tpl.id}>
                          {tpl.name} ({tpl.type === 'project' ? 'Project' : tpl.type === 'group' ? 'Group' : 'Checklist'})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>

              {/* If selected template is a task checklist, prompt user to select target group */}
              {(() => {
                const tpl = allTemplates.find((t: any) => t._id === selectedTemplateId || t.id === selectedTemplateId);
                if (tpl && tpl.type === 'task') {
                  return (
                    <div className="space-y-1.5 animate-in fade-in duration-200">
                      <Label className="text-xs font-semibold text-muted-foreground">เลือกกลุ่มงานเป้าหมาย (Target Group)</Label>
                      <Select value={targetGroupIdForChecklist} onValueChange={setTargetGroupIdForChecklist}>
                        <SelectTrigger className="rounded-xl h-10">
                          <SelectValue placeholder="เลือกกลุ่มงานในโครงการนี้" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          {projectTasks.length === 0 ? (
                            <SelectItem value="none" disabled>ไม่มีกลุ่มงานในโครงการนี้</SelectItem>
                          ) : (
                            projectTasks.map((t: any) => (
                              <SelectItem key={t.id} value={t.id}>
                                {t.title}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            <DialogFooter className="gap-2 border-t border-border/40 pt-3">
              <Button variant="outline" onClick={() => {
                setIsImportTemplateOpen(false);
                setSelectedTemplateId('');
                setTargetGroupIdForChecklist('');
              }} className="rounded-xl h-10">
                ยกเลิก
              </Button>
              <Button
                onClick={handleImportTemplate}
                disabled={!selectedTemplateId}
                className="rounded-xl h-10 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
              >
                นำเข้าเทมเพลต
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* AI Notes Generator Dialog */}
        <Dialog open={isAiNotesOpen} onOpenChange={setIsAiNotesOpen}>
          <DialogContent className="rounded-2xl max-w-2xl h-[80vh] flex flex-col bg-background border border-border">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                สร้างและจัดระเบียบแท็บด้วย AI
              </DialogTitle>
              <DialogDescription>
                วางข้อมูลดิบ เช่น รายละเอียดโครงการ, บรีฟลูกค้า, หรือรหัสเข้าสู่ระบบต่างๆ แล้ว AI จะทำการวิเคราะห์และสร้างแถบข้อมูลให้โดยอัตโนมัติ
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex-grow flex flex-col gap-4 overflow-hidden my-2">
              {!aiNotesPreviewSections ? (
                // STEP 1: Input text area
                <div className="flex-1 flex flex-col gap-2 overflow-hidden">
                  <label className="text-xs font-semibold text-muted-foreground">ข้อมูลดิบโครงการ (Raw Data)</label>
                  <textarea
                    value={aiNotesRawText}
                    onChange={(e) => setAiNotesRawText(e.target.value)}
                    placeholder="ตัวอย่างเช่น:
- ข้อมูลลูกค้า: บริษัท เทคโนโลยี จำกัด ผู้ติดต่อ คุณเอ โทร 081-xxxxxxx
- รายละเอียดงาน: สร้างเว็บไซต์โปรโมทบริการขนาด 5 หน้า และตั้งค่าแคมเปญ Facebook Ads
- ข้อมูลเข้าใช้งาน:
  1. Hosting: Username: user123 / Password: password123 (Server IP: 122.11.2.1)
  2. WordPress: URL: dev.tech.com/wp-admin, User: admin, Pass: passwp456
- คีย์เวิร์ดต้องการเน้น: บริษัทพัฒนาเว็บ, ทำเว็บเชียงใหม่, รับทำระบบ"
                    className="flex-1 w-full bg-background border border-border/80 rounded-xl p-3.5 text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-mono"
                    disabled={isGeneratingAiNotes}
                  />
                </div>
              ) : (
                // STEP 2: Preview generated sections
                <div className="flex-grow flex flex-col gap-4 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground">ผลลัพธ์การจัดระเบียบของ AI (AI Preview)</span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="text-xs text-primary"
                      onClick={() => {
                        setAiNotesPreviewSections(null);
                      }}
                    >
                      แก้ไขข้อมูลดิบใหม่
                    </Button>
                  </div>
                  
                  {/* Preview Tabs */}
                  <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none shrink-0">
                    {aiNotesPreviewSections.map((sec, idx) => (
                      <button
                        key={idx}
                        onClick={() => setAiNotesPreviewActiveTab(idx)}
                        className={cn(
                          "px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors",
                          aiNotesPreviewActiveTab === idx 
                            ? "bg-primary/10 text-primary border-primary/20" 
                            : "bg-muted/20 border-transparent text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                        )}
                      >
                        {sec.title}
                      </button>
                    ))}
                  </div>
                  
                  {/* Preview Tab Content */}
                  <div className="flex-1 overflow-y-auto border border-border/80 bg-card rounded-xl p-4 shadow-xs">
                    <div 
                      className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-4"
                      dangerouslySetInnerHTML={{ __html: aiNotesPreviewSections[aiNotesPreviewActiveTab]?.content || '' }}
                    />
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-2.5 pt-3 border-t border-border/40 shrink-0">
              <Button
                variant="outline"
                onClick={() => {
                  setIsAiNotesOpen(false);
                  setAiNotesPreviewSections(null);
                  setAiNotesRawText('');
                }}
                disabled={isGeneratingAiNotes}
                className="rounded-xl h-10 px-5 text-sm"
              >
                ยกเลิก
              </Button>
              
              {!aiNotesPreviewSections ? (
                <Button
                  onClick={handleGenerateAiNotes}
                  disabled={!aiNotesRawText.trim() || isGeneratingAiNotes}
                  className="rounded-xl h-10 px-6 text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white gap-2"
                >
                  {isGeneratingAiNotes ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      กำลังเรียบเรียงข้อมูล...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-white" />
                      วิเคราะห์และสร้างแท็บ
                    </>
                  )}
                </Button>
              ) : (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => handleSaveAiNotes(false)}
                    className="rounded-xl h-10 px-5 text-sm text-foreground gap-1.5"
                  >
                    <Plus className="w-4 h-4" />
                    บันทึกต่อท้าย (Append)
                  </Button>
                  <Button
                    onClick={() => handleSaveAiNotes(true)}
                    className="rounded-xl h-10 px-5 text-sm bg-primary text-primary-foreground font-semibold gap-1.5"
                  >
                    <Check className="w-4 h-4" />
                    บันทึกทับทั้งหมด (Overwrite)
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

      </div>
    </div>
  );
}
