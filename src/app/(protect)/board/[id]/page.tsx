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
import { ImportTemplateDialog } from '@/components/board/import-template-dialog';
import { AiNotesDialog } from '@/components/board/ai-notes-dialog';
import { ProjectCalendarTab } from '@/components/board/project-calendar-tab';
import { ProjectTimesheetTab } from '@/components/board/project-timesheet-tab';
import { ProjectInvoicesTab } from '@/components/board/project-invoices-tab';
import { ProjectSettingsTab } from '@/components/board/project-settings-tab';
import { TaskDetailsSidebar } from '@/components/board/task-details-sidebar';
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
import { useGetTasksQuery, useAddTaskMutation, useUpdateTaskMutation, useDeleteTaskMutation, useAddTasksBulkMutation } from '@/services/taskApi';
import { useGetClientsQuery } from '@/services/clientApi';
import { useGetTimeLogsQuery } from '@/services/timeLogApi';
import { useGetInvoicesQuery } from '@/services/invoiceApi';
import { useToast } from '@/hooks/use-toast';
import { createAiChecklist } from '@/ai/flows/ai-checklist-creator-flow';
import { generateAiProjectNotes } from '@/ai/flows/ai-project-notes-flow';
import { useGetTaskTemplatesQuery } from '@/services/taskTemplateApiSlice';
import { formatNumber } from '@/lib/number-format';
import { cn } from '@/lib/utils';
import type { Client, SubTask, Task } from '@/lib/types';

export default function ProjectDetailsPage() {
  const showTimeTracker = false;

  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: tasks = [], isLoading: loadingTasks } = useGetTasksQuery();
  const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
  const { data: timeLogs = [], isLoading: loadingTimeLogs } = useGetTimeLogsQuery();
  const { data: invoices = [], isLoading: loadingInvoices } = useGetInvoicesQuery();
  
  const [updateProject, { isLoading: isUpdatingProject }] = useUpdateProjectMutation();
  const [addTask] = useAddTaskMutation();
  const [updateTask] = useUpdateTaskMutation();
  const [deleteTask] = useDeleteTaskMutation();
  const [addTasksBulk] = useAddTasksBulkMutation();
  
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const { data: allTemplates = [] } = useGetTaskTemplatesQuery();

  const [activeTab, setActiveTab] = useState<'Tasks' | 'Notes' | 'Calendar' | 'Timesheet' | 'Invoices' | 'Edit'>('Tasks');

  // Search task query
  const [taskSearchQuery, setTaskSearchQuery] = useState('');

  // Horizontal Board Views
  const [activeBoardView, setActiveBoardView] = useState<string>('');
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

  // AI Notes Generator states
  const [isAiNotesOpen, setIsAiNotesOpen] = useState(false);
  const [isGeneratingAiNotes, setIsGeneratingAiNotes] = useState(false);

  // Templates Import states
  const [isImportTemplateOpen, setIsImportTemplateOpen] = useState(false);

  // Task Details Sidebar State
  const [selectedTaskDetail, setSelectedTaskDetail] = useState<{ groupId: string, task: SubTask } | null>(null);

  // New item inputs
  const [newGroupName, setNewGroupName] = useState('');
  const [newTasksInputs, setNewTasksInputs] = useState<Record<string, string>>({});
  const [taskNotesInputs, setTaskNotesInputs] = useState<Record<string, string>>({});

  const project = projects.find((p) => p.id === id);

  // Filter tasks that belong to this project container
  const projectTasks = tasks.filter((t) => t.projectId === id);

  // Extract distinct views from tasks
  const distinctViews = Array.from(new Set([
    ...(project?.boardViews || []),
    ...projectTasks.map(t => t.boardView).filter(Boolean) as string[]
  ]));

  // Derived tasks filtered by active view
  const filteredTasksByView = projectTasks
    .filter((t) => t.boardView === activeBoardView)
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  // Automatically select first view if none is selected or view was deleted
  useEffect(() => {
    if (distinctViews.length > 0) {
      if (!activeBoardView || !distinctViews.includes(activeBoardView)) {
        setActiveBoardView(distinctViews[0]);
      }
    } else {
      setActiveBoardView('');
    }
  }, [distinctViews, activeBoardView]);

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

  const handleGenerateAiNotes = async (rawText: string) => {
    if (!rawText.trim()) return null;
    setIsGeneratingAiNotes(true);
    try {
      const res = await generateAiProjectNotes({ rawText: rawText.trim() });
      if (res.sections && res.sections.length > 0) {
        return res.sections;
      } else {
        toast({
          title: "ไม่พบข้อมูล",
          description: "AI ไม่สามารถจัดระเบียบข้อมูลตามที่ส่งเข้าไปได้ กรุณาลองใหม่อีกครั้ง",
          variant: "destructive"
        });
        return null;
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาดในการประมวลผล",
        description: "โปรดตรวจสอบการเชื่อมต่ออินเทอร์เน็ตหรือคีย์ API",
        variant: "destructive"
      });
      return null;
    } finally {
      setIsGeneratingAiNotes(false);
    }
  };

  const handleSaveAiNotes = async (sections: any[], overwrite: boolean) => {
    if (!sections || sections.length === 0 || !project) return;
    
    const formattedSections = sections.map((sec, idx) => ({
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
      
      if (formattedSections.length > 0) {
        setActiveSectionId(formattedSections[0].id);
      }
      setIsAiNotesOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลโน้ตเข้าโครงการได้",
        variant: "destructive"
      });
    }
  };

  const handleImportTemplate = async (templateId: string, targetGroupId: string) => {
    if (!project) return;
    const template = allTemplates.find((t: any) => t._id === templateId || t.id === templateId);
    if (!template) return;

    try {
      let order = 0;
      const highestOrder = filteredTasksByView.reduce((max, t) => Math.max(max, t.order ?? 0), 0);
      const tasksToCreate: Partial<Task>[] = [];

      if (template.type === 'project') {
        const groups = template.data.groups || [];
        for (const group of groups) {
          for (const task of group.tasks || []) {
            tasksToCreate.push({
              title: `${group.title}: ${task.title}`,
              details: task.details || '',
              projectId: id,
              clientId: project.clientId,
              status: 'Backlog',
              gross_price: 0,
              deadline: new Date(),
              revisions: 0,
              subTasks: [],
              order: highestOrder + order++,
              boardView: activeBoardView || undefined
            });

            for (const sub of task.subTasks || []) {
              tasksToCreate.push({
                title: `${group.title}: ${task.title} - ${sub.text}`,
                projectId: id,
                clientId: project.clientId,
                status: 'Backlog',
                gross_price: 0,
                deadline: new Date(),
                revisions: 0,
                subTasks: [],
                order: highestOrder + order++,
                boardView: activeBoardView || undefined
              });
            }
          }
        }
      } else if (template.type === 'group') {
        const group = template.data.groups?.[0];
        if (group) {
          for (const task of group.tasks || []) {
            tasksToCreate.push({
              title: `${group.title}: ${task.title}`,
              details: task.details || '',
              projectId: id,
              clientId: project.clientId,
              status: 'Backlog',
              gross_price: 0,
              deadline: new Date(),
              revisions: 0,
              subTasks: [],
              order: highestOrder + order++,
              boardView: activeBoardView || undefined
            });

            for (const sub of task.subTasks || []) {
              tasksToCreate.push({
                title: `${group.title}: ${task.title} - ${sub.text}`,
                projectId: id,
                clientId: project.clientId,
                status: 'Backlog',
                gross_price: 0,
                deadline: new Date(),
                revisions: 0,
                subTasks: [],
                order: highestOrder + order++,
                boardView: activeBoardView || undefined
              });
            }
          }
        }
      } else if (template.type === 'task') {
        for (const sub of template.data.subTasks || []) {
          tasksToCreate.push({
            title: sub.text,
            projectId: id,
            clientId: project.clientId,
            status: 'Backlog',
            gross_price: 0,
            deadline: new Date(),
            revisions: 0,
            subTasks: [],
            order: highestOrder + order++,
            boardView: activeBoardView || undefined
          });
        }
      }

      if (tasksToCreate.length > 0) {
        await addTasksBulk(tasksToCreate).unwrap();
      }

      toast({
        title: "สำเร็จ!",
        description: `นำแม่แบบ "${template.name}" ไปใช้งานเรียบร้อยแล้ว`,
      });
      setIsImportTemplateOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถนำแม่แบบไปติดตั้งได้",
        variant: "destructive"
      });
    }
  };


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


  // Map tasks to flat taskList format for UI checklist
  const taskList = (() => {
    let rawTasks = filteredTasksByView.map((t) => ({
      id: t.id,
      text: t.title,
      completed: t.status === 'Completed' || t.status === 'Paid',
      description: t.details || '',
      startDate: t.startDate,
      dueDate: t.deadline,
      repeats: t.repeats,
      assignee: t.assignee,
      notes: t.notes || '',
      originalTask: t
    }));

    if (rawTasks.length === 0) {
      return [];
    }

    // Filter by search query if set
    if (!taskSearchQuery.trim()) return rawTasks;
    const query = taskSearchQuery.toLowerCase();
    return rawTasks.filter((t) => t.text.toLowerCase().includes(query));
  })();

  // Calculate statistics based on current active view
  const totalTasksCount = filteredTasksByView.length;
  const completedTasksCount = filteredTasksByView.filter(t => t.status === 'Completed' || t.status === 'Paid').length;

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
      const tasksInView = projectTasks.filter(t => t.boardView === oldName);
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
      const tasksInView = projectTasks.filter(t => t.boardView === viewName);
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
      setActiveBoardView(newViews.length > 0 ? newViews[0] : '');
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
      boardView: activeBoardView || undefined
    });
  };

  // Create flat task
  const handleAddTaskDirectly = async () => {
    if (!newGroupName.trim() || !project || !project.clientId) return;
    
    // Find highest order in current view
    const highestOrder = filteredTasksByView.reduce((max, t) => Math.max(max, t.order ?? 0), 0);

    await addTask({
      title: newGroupName.trim(),
      projectId: id,
      clientId: project.clientId,
      status: 'Backlog',
      gross_price: 0,
      deadline: new Date(),
      revisions: 0,
      subTasks: [],
      order: highestOrder + 1,
      boardView: activeBoardView || undefined
    }).unwrap();

    setNewGroupName('');
    toast({ title: 'สร้างงานสำเร็จ' });
  };

  // Toggle task completed status
  const handleToggleTaskStatus = async (taskId: string, checked: boolean) => {
    const newStatus = checked ? 'Completed' : 'In Progress';
    
    await updateTask({ 
      id: taskId, 
      data: { 
        status: newStatus
      } 
    }).unwrap();

    toast({ title: checked ? 'ทำเครื่องหมายเสร็จสิ้นแล้ว' : 'เปลี่ยนสถานะเป็นกำลังดำเนินการ' });
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    await deleteTask({ id: taskId }).unwrap();
    toast({ title: 'ลบรายการออกเรียบร้อยแล้ว' });
  };

  // Rename task
  const handleRenameTask = async (taskId: string, textVal: string) => {
    if (!textVal.trim()) return;
    await updateTask({ id: taskId, data: { title: textVal.trim() } }).unwrap();
    setEditingId(null);
    toast({ title: 'แก้ไขข้อความสำเร็จ' });
  };

  // Save note / remark
  const handleUpdateTaskNotes = async (taskId: string, notesVal: string) => {
    try {
      await updateTask({ id: taskId, data: { notes: notesVal } }).unwrap();
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาดในการบันทึกหมายเหตุ', variant: 'destructive' });
    }
  };

  // Update specific field inside Task from the Sidebar
  const handleUpdateTaskDetail = async (field: keyof SubTask, value: any) => {
    if (!selectedTaskDetail) return;
    const { groupId, task } = selectedTaskDetail;
    const taskId = groupId;

    let dbField = field as string;
    let dbValue = value;
    if (field === 'text') dbField = 'title';
    if (field === 'description') dbField = 'details';
    if (field === 'dueDate') dbField = 'deadline';

    const updatedTask = { ...task, [field]: value };
    
    // Optimistic UI update
    setSelectedTaskDetail({ groupId, task: updatedTask });
    
    try {
      await updateTask({ id: taskId, data: { [dbField]: dbValue } }).unwrap();
    } catch (err) {
      toast({ title: 'อัปเดตล้มเหลว', description: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล', variant: 'destructive' });
      // Revert on fail
      setSelectedTaskDetail(selectedTaskDetail);
    }
  };

  // AI checklist generator
  const handleGenerateAiSubtasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    try {
      const result = await createAiChecklist({ description: aiPrompt.trim() });
      
      // Find highest order in current view
      const highestOrder = filteredTasksByView.reduce((max, t) => Math.max(max, t.order ?? 0), 0);

      // Create a flat task for each AI checklist item
      const tasksToCreate = result.checklistItems.map((itemText, index) => ({
        title: itemText,
        projectId: id,
        clientId: project.clientId,
        status: 'Backlog' as const,
        gross_price: 0,
        deadline: new Date(),
        revisions: 0,
        subTasks: [],
        order: highestOrder + index + 1,
        boardView: activeBoardView || undefined
      }));

      if (tasksToCreate.length > 0) {
        await addTasksBulk(tasksToCreate).unwrap();
      }

      setAiPrompt('');
      toast({
        title: 'สำเร็จ!',
        description: 'ร่างรายการสิ่งที่ต้องทำด้วย AI สำเร็จแล้ว',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'เกิดข้อผิดพลาด',
        description: 'ไม่สามารถสร้างรายการงานจาก AI ได้',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  // Project Edit settings submit handler
  const handleSaveProjectSettings = async (data: any) => {
    try {
      await updateProject({
        id: project.id,
        data
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
                const viewTasks = projectTasks.filter(t => t.boardView === view);
                const totalInView = viewTasks.reduce((sum, t) => sum + (t.subTasks?.length || 0) + 1, 0);
                const completedInView = viewTasks.reduce((sum, t) => {
                  const completedSubs = (t.subTasks || []).filter(st => st.completed).length;
                  const taskCompleted = (t.status === 'Completed' || t.status === 'Paid') ? 1 : 0;
                  return sum + completedSubs + taskCompleted;
                }, 0);
                const progressPercent = totalInView > 0 ? Math.round((completedInView / totalInView) * 100) : 0;

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
                        : 'bg-card/60 border-border/60 text-muted-foreground hover:bg-card hover:text-foreground shadow-2xs'
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

                    {totalInView > 0 ? (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none shrink-0 transition-colors ml-1",
                        isActive 
                          ? "bg-primary/10 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        {completedInView}/{totalInView} ({progressPercent}%)
                      </span>
                    ) : (
                      <span className={cn(
                        "text-[9px] font-bold px-1.5 py-0.5 rounded-full select-none shrink-0 ml-1",
                        isActive 
                          ? "bg-primary/5 text-primary/60" 
                          : "bg-muted/40 text-muted-foreground/50"
                      )}>
                        0/0
                      </span>
                    )}

                    <button
                      onClick={async (e) => {
                        e.stopPropagation();
                        handleDeleteView(view);
                      }}
                      className="p-0.5 rounded-full hover:bg-muted-foreground/15 text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
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

            {!activeBoardView ? (
              <div className="flex flex-col items-center justify-center p-16 text-center bg-card rounded-2xl border border-dashed border-border/80 max-w-xl mx-auto my-8 space-y-4 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <ListTodo className="w-6 h-6 animate-pulse" />
                </div>
                <h3 className="text-base font-bold text-foreground">ยังไม่มีมุมมอง (View) ในบอร์ดนี้</h3>
                <p className="text-xs text-muted-foreground max-w-xs leading-relaxed">
                  กรุณาสร้างมุมมองใหม่เพื่อเริ่มต้นสร้างและจัดการรายการงานย่อยของคุณอย่างเป็นระเบียบ เช่น "Phase 1", "Phase 2"
                </p>
                <Button
                  onClick={() => setIsAddViewOpen(true)}
                  className="rounded-xl h-10 px-5 text-xs font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Plus className="w-4 h-4 mr-1" /> สร้างมุมมองแรกของคุณ
                </Button>
              </div>
            ) : (
              <>
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
                        placeholder="เพิ่มงานใหม่..."
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        className="h-9 w-full sm:w-48 rounded-xl text-xs border-border/60 bg-background"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleAddTaskDirectly();
                        }}
                      />
                      <Button
                        onClick={handleAddTaskDirectly}
                        className="h-9 rounded-xl bg-primary text-primary-foreground font-semibold px-3 gap-1 text-xs shrink-0"
                      >
                        <Plus className="w-3.5 h-3.5" /> สร้างงาน
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

                {/* List of Tasks (Checklist Sheet) */}
                <div className="bg-card border border-border/60 rounded-2xl shadow-xs overflow-hidden">
                  <DragDropContext onDragEnd={onDragEnd}>
                    <Droppable droppableId="project-tasks-list" type="task">
                      {(provided) => (
                        <div
                          {...provided.droppableProps}
                          ref={provided.innerRef}
                          className="divide-y divide-border/40"
                        >
                          {taskList.length === 0 ? (
                            <div className="py-16 text-center text-xs text-muted-foreground bg-card">
                              <ListTodo className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                              No tasks found. Create a new task or use AI to generate tasks.
                            </div>
                          ) : (
                            taskList.map((task, taskIdx) => (
                              <Draggable key={task.id} draggableId={task.id} index={taskIdx}>
                                {(provided, snapshot) => (
                                  <div
                                    ref={provided.innerRef}
                                    {...provided.draggableProps}
                                    className={cn(
                                      "flex items-center justify-between p-5 transition-all gap-4 group/row border border-transparent hover:bg-muted/5",
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
                                        onChange={(e) => handleToggleTaskStatus(task.id, e.target.checked)}
                                        className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer shrink-0"
                                      />
                                      <div className="flex flex-col flex-1 min-w-0">
                                        {editingId === task.id ? (
                                          <div className="flex items-center gap-1.5 flex-grow">
                                            <Input
                                              value={editingText}
                                              onChange={(e) => setEditingText(e.target.value)}
                                              className="h-8 text-xs max-w-lg border-primary"
                                              autoFocus
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleRenameTask(task.id, editingText);
                                              }}
                                            />
                                            <Button size="icon" className="h-8 w-8 bg-green-600 hover:bg-green-700 text-white rounded-lg" onClick={() => handleRenameTask(task.id, editingText)}>
                                              <Check className="w-4 h-4" />
                                            </Button>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setEditingId(null)}>
                                              <X className="w-4 h-4" />
                                            </Button>
                                          </div>
                                        ) : (
                                          <div className="flex flex-col flex-1 min-w-0">
                                            <span
                                              className={cn(
                                                "text-xs text-foreground cursor-pointer truncate hover:text-primary transition-colors",
                                                task.completed && "line-through text-muted-foreground/60"
                                              )}
                                              onClick={() => {
                                                setSelectedTaskDetail({ groupId: task.id, task: task as any });
                                              }}
                                            >
                                              {task.text}
                                            </span>
                                            <input
                                              type="text"
                                              placeholder="เพิ่มหมายเหตุ..."
                                              value={taskNotesInputs[task.id] !== undefined ? taskNotesInputs[task.id] : (task.notes || '')}
                                              onChange={(e) => setTaskNotesInputs((prev: Record<string, string>) => ({ ...prev, [task.id]: e.target.value }))}
                                              onBlur={() => handleUpdateTaskNotes(task.id, taskNotesInputs[task.id] !== undefined ? taskNotesInputs[task.id] : (task.notes || ''))}
                                              onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
                                              className="text-[10px] text-muted-foreground bg-transparent border-none p-0 focus:ring-0 focus:outline-none focus:border-none focus-visible:ring-0 focus-visible:outline-none w-full mt-0.5 hover:text-foreground/80 focus:text-foreground transition-colors"
                                            />
                                          </div>
                                        )}
                                      </div>
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
                                          onClick={() => handleDeleteTask(task.id)}
                                          title="Delete Task"
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </Draggable>
                            ))
                          )}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
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
          </>
        )}
      </div>
          
          {/* FLOATING RIGHT PANEL (Task Details) */}
          <TaskDetailsSidebar
            selectedTaskDetail={selectedTaskDetail}
            activeBoardView={activeBoardView}
            projectTasks={projectTasks}
            onClose={() => setSelectedTaskDetail(null)}
            onUpdate={handleUpdateTaskDetail}
          />
        </div>
        )}

        {/* VIEW B: CALENDAR TAB */}
        {activeTab === 'Calendar' && (
          <ProjectCalendarTab project={project} />
        )}

        {/* VIEW C: TIMESHEET TAB */}
        {activeTab === 'Timesheet' && showTimeTracker && (
          <ProjectTimesheetTab project={project} projectTimeLogs={projectTimeLogs} />
        )}

        {/* VIEW D: INVOICES TAB */}
        {activeTab === 'Invoices' && (
          <ProjectInvoicesTab project={project} projectInvoices={projectInvoices} />
        )}

        {/* VIEW E: PROJECT SETTINGS (Edit) */}
        {activeTab === 'Edit' && (
          <ProjectSettingsTab
            project={project}
            onSave={handleSaveProjectSettings}
            isSaving={isUpdatingProject}
          />
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
                                      : 'bg-card/60 border-border/60 text-muted-foreground hover:bg-card hover:text-foreground shadow-2xs'
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
        <ImportTemplateDialog
          open={isImportTemplateOpen}
          onOpenChange={setIsImportTemplateOpen}
          allTemplates={allTemplates}
          projectTasks={projectTasks}
          onImport={handleImportTemplate}
        />

        {/* AI Notes Generator Dialog */}
        <AiNotesDialog
          open={isAiNotesOpen}
          onOpenChange={setIsAiNotesOpen}
          isGenerating={isGeneratingAiNotes}
          onGenerate={handleGenerateAiNotes}
          onSave={handleSaveAiNotes}
        />

      </div>
    </div>
  );
}
