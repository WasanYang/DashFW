'use client';

import { useState, useMemo, useEffect, DragEvent } from 'react';
import Link from 'next/link';
import { Project, ProjectStatus, Client, SubTask } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  DollarSign,
  MessageSquare,
  Clock,
  ListTodo,
  PlusCircle,
  Pencil,
  Check,
  X,
  CalendarIcon,
  Search,
  Table,
  LayoutGrid,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { CreateProjectForm } from './create-project-form';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { SubtaskItem } from './subtask-item';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';
import {
  useAddProjectMutation,
  useUpdateProjectMutation,
} from '@/services/projectApi';
import { EditableQuillField } from '../ui/editable-quill-field';
import { formatNumber } from '@/lib/number-format';
import { fetchJobTypes } from '@/services/jobTypeClient';
import type { JobType } from '@/app/(protect)/job-types/page';

interface KanbanBoardProps {
  initialProjects: Project[];
  clients: Client[];
}

const columns: ProjectStatus[] = [
  'Backlog',
  'In Progress',
  'Review',
  'Completed',
  'Paid',
];

const updateSubtaskRecursively = (
  tasks: SubTask[],
  taskId: string,
  field: 'text' | 'description' | 'completed',
  value: string | boolean,
): SubTask[] => {
  return tasks.map((task) => {
    if (task.id === taskId) {
      return { ...task, [field]: value };
    }
    if (task.children) {
      return {
        ...task,
        children: updateSubtaskRecursively(task.children, taskId, field, value),
      };
    }
    return task;
  });
};

const removeSubtaskRecursively = (
  tasks: SubTask[],
  taskId: string,
): SubTask[] => {
  return tasks
    .filter((task) => task.id !== taskId)
    .map((task) =>
      task.children
        ? { ...task, children: removeSubtaskRecursively(task.children, taskId) }
        : task,
    );
};

const addChildToSubtaskRecursively = (
  tasks: SubTask[],
  parentId: string,
  newSubtask: SubTask,
): SubTask[] => {
  return tasks.map((task) => {
    if (task.id === parentId) {
      const children = task.children
        ? [...task.children, newSubtask]
        : [newSubtask];
      return { ...task, children };
    }
    if (task.children) {
      return {
        ...task,
        children: addChildToSubtaskRecursively(
          task.children,
          parentId,
          newSubtask,
        ),
      };
    }
    return task;
  });
};

const calculateProgress = (tasks: SubTask[] | undefined): number => {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  let totalTasks = 0;
  let completedTasks = 0;

  const countTasks = (tasks: SubTask[]) => {
    tasks.forEach((task) => {
      totalTasks++;
      if (task.completed) {
        completedTasks++;
      }
      if (task.children) {
        countTasks(task.children);
      }
    });
  };

  countTasks(tasks);

  if (totalTasks === 0) return 0;

  return (completedTasks / totalTasks) * 100;
};

export function KanbanBoard({
  initialProjects,
  clients,
}: Omit<KanbanBoardProps, 'translations'>) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [modalContent, setModalContent] = useState<Project | 'create' | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('table');
  const [searchQuery, setSearchQuery] = useState('');

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const handleSaveSubtitle = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingSubtitle(false);
  };

  const handleCancelSubtitle = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingSubtitle(false);
  };
  const countAllSubtasks = (subtasks: SubTask[] | undefined): number => {
    if (!Array.isArray(subtasks)) return 0;
    let count = 0;
    for (const st of subtasks) {
      count++;
      if (Array.isArray(st.children)) {
        count += countAllSubtasks(st.children);
      }
    }
    return count;
  };

  const countAll = (subtasks: SubTask[] | undefined): [number, number] => {
    let total = 0,
      done = 0;
    if (!Array.isArray(subtasks)) return [0, 0];
    for (const st of subtasks) {
      total++;
      if (st.completed) done++;
      if (Array.isArray(st.children)) {
        const [t, d] = countAll(st.children);
        total += t;
        done += d;
      }
    }
    return [total, done];
  };

  const [isEditingOrderNo, setIsEditingOrderNo] = useState(false);
  const [isEditingType, setIsEditingType] = useState(false);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  useEffect(() => {
    fetchJobTypes().then(setJobTypes);
  }, []);
  const handleSaveType = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingType(false);
  };
  const handleCancelType = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingType(false);
  };
  const handleSaveOrderNo = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingOrderNo(false);
  };

  const handleCancelOrderNo = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingOrderNo(false);
  };
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [isEditingRevisions, setIsEditingRevisions] = useState(false);
  const [isEditingDeadline, setIsEditingDeadline] = useState(false);
  const [editableProject, setEditableProject] = useState<Project | null>(null);

  const [addProjectMutation] = useAddProjectMutation();
  const [updateProjectMutation] = useUpdateProjectMutation();

  const filteredProjects = useMemo(() => {
    if (!searchQuery.trim()) return projects;
    const query = searchQuery.toLowerCase();
    return projects.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(query);
      const clientName = clients.find((c) => c._id === p.clientId)?.name || '';
      const clientMatch = clientName.toLowerCase().includes(query);
      return titleMatch || clientMatch;
    });
  }, [projects, searchQuery, clients]);

  const groupedProjects = useMemo(() => {
    return columns.reduce(
      (acc, status) => {
        acc[status] = filteredProjects
          .filter((p) => p.status === status)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return acc;
      },
      {} as Record<ProjectStatus, Project[]>,
    );
  }, [filteredProjects]);

  const statusCounts = useMemo(() => {
    const counts = {
      Total: projects.length,
      Backlog: 0,
      'In Progress': 0,
      Review: 0,
      Completed: 0,
      Paid: 0,
    };
    projects.forEach((p) => {
      if (counts[p.status] !== undefined) {
        counts[p.status]++;
      }
    });
    return counts;
  }, [projects]);

  const handleDragStart = (
    e: DragEvent<HTMLDivElement>,
    projectId: string,
    index: number,
  ) => {
    e.dataTransfer.setData('projectId', projectId);
    e.dataTransfer.setData('fromIndex', String(index));
  };

  // Removed duplicate handleCardDrop declaration
  const handleCardDrop = async (
    fromIndex: number,
    toIndex: number,
    fromStatus: string,
    toStatus: string,
  ) => {
    setProjects((prev) => {
      // หา project ใน column ต้นทางและปลายทาง
      const fromCol = prev
        .filter((p) => p.status === fromStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const toCol = prev
        .filter((p) => p.status === toStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      const fromId = fromCol[fromIndex]?.id;
      if (!fromId) return prev;
      let newProjects = [...prev];
      let updated: Project[] = [];
      if (fromStatus === toStatus) {
        // reorder ใน column เดียวกัน
        const col = [...fromCol];
        const [moved] = col.splice(fromIndex, 1);
        col.splice(toIndex, 0, moved);
        // อัปเดต order ใหม่ (immutable)
        const colWithOrder = col.map((p, idx) => ({ ...p, order: idx }));
        newProjects = newProjects.map((p) =>
          p.status === fromStatus
            ? colWithOrder.find((c) => c.id === p.id) || p
            : p,
        );
        updated = colWithOrder;
      } else {
        // ข้าม column: เปลี่ยน status และแทรกที่ตำแหน่งใหม่
        let fromColCopy = [...fromCol];
        let toColCopy = [...toCol];
        const [moved] = fromColCopy.splice(fromIndex, 1);
        const movedWithStatus = { ...moved, status: toStatus as ProjectStatus };
        toColCopy.splice(toIndex, 0, movedWithStatus);
        // อัปเดต order ใหม่ทั้งสอง column (immutable)
        const fromColWithOrder = fromColCopy.map((p, idx) => ({
          ...p,
          order: idx,
        }));
        const toColWithOrder = toColCopy.map((p, idx) => ({
          ...p,
          order: idx,
        }));
        newProjects = newProjects.map((p) => {
          if (p.id === movedWithStatus.id) return movedWithStatus;
          if (p.status === fromStatus)
            return fromColWithOrder.find((c) => c.id === p.id) || p;
          if (p.status === toStatus)
            return toColWithOrder.find((c) => c.id === p.id) || p;
          return p;
        });
        updated = [movedWithStatus, ...fromColWithOrder, ...toColWithOrder];
      }
      // Sync เฉพาะ status/order ไป backend
      updated.forEach((proj) => {
        updateProjectMutation({
          id: proj.id,
          data: {
            status: proj.status,
            order: proj.order,
          },
        });
      });
      return newProjects;
    });
  };

  const handleDrop = async (
    e: DragEvent<HTMLDivElement>,
    newStatus: ProjectStatus,
  ) => {
    console.log('handleDrop', { newStatus });
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');
    // ถ้า fromIndex เป็นตัวเลข (reorder ใน column เดียวกัน) ให้ return; ถ้า undefined/ว่าง ให้เปลี่ยนสถานะ
    const fromIndex = Number(e.dataTransfer.getData('fromIndex'));
    if (isNaN(fromIndex)) {
      return;
    }
    setProjects((prevProjects) => {
      // หา project ที่จะย้าย
      const projectToMove = prevProjects.find((p) => p.id === projectId);
      if (!projectToMove) return prevProjects;
      // หา project ใน column ปลายทาง
      const destCol = prevProjects
        .filter((p) => p.status === newStatus)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
      // กำหนด order ใหม่เป็นลำดับสุดท้าย
      const newOrder =
        destCol.length > 0
          ? Math.max(...destCol.map((p) => p.order ?? 0)) + 1
          : 0;
      // อัปเดต project ที่ย้าย
      const updatedProject = {
        ...projectToMove,
        status: newStatus,
        order: newOrder,
      };
      // รวม project ใหม่เข้าไปใน state
      const newProjects = prevProjects.map((p) =>
        p.id === projectId ? updatedProject : p,
      );
      // sync เฉพาะ status/order ไป backend
      updateProjectMutation({
        id: updatedProject.id,
        data: {
          status: updatedProject.status,
          order: updatedProject.order,
        },
      });
      return newProjects;
    });
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const addProject = async (
    newProjectData: Omit<Project, 'id' | 'status' | 'revisions' | 'order'>,
  ) => {
    try {
      // Do not generate id, let MongoDB handle it
      let subTasks = (newProjectData.subTasks || []).map((st, idx) => ({
        ...st,
        completed: false,
      }));
      // หา order ล่าสุดใน column Backlog
      const backlogProjects = projects.filter((p) => p.status === 'Backlog');
      const maxOrder =
        backlogProjects.length > 0
          ? Math.max(...backlogProjects.map((p) => p.order ?? 0))
          : -1;
      const res = await addProjectMutation({
        ...newProjectData,
        status: 'Backlog',
        revisions: 0,
        subTasks,
        order: maxOrder + 1,
      }).unwrap();
      setProjects((prev) => [res, ...prev]);
      setModalContent(null);
    } catch (err) {
      alert('Failed to add project');
    }
  };

  const updateProject = async (updatedProject: Project) => {
    try {
      await updateProjectMutation({
        id: updatedProject.id,
        data: updatedProject,
      }).unwrap();
      setProjects((prev) =>
        prev.map((p) => (p.id === updatedProject.id ? updatedProject : p)),
      );
      if (
        typeof modalContent === 'object' &&
        modalContent?.id === updatedProject.id
      ) {
        setModalContent(updatedProject);
      }
    } catch (err) {
      alert('Failed to update project');
    }
  };

  const handleCardClick = (project: Project) => {
    setModalContent(project);
    setEditableProject({ ...project });
    setIsEditingTitle(false);
    setIsEditingPrice(false);
    setIsEditingRevisions(false);
    setIsEditingDeadline(false);
  };

  const handleCloseModal = () => {
    setModalContent(null);
    setEditableProject(null);
    setIsEditingTitle(false);
    setIsEditingPrice(false);
    setIsEditingRevisions(false);
    setIsEditingDeadline(false);
  };

  const handleValueChange = (key: keyof Project, value: any) => {
    if (editableProject) {
      setEditableProject({ ...editableProject, [key]: value });
    }
  };

  const handleSaveTitle = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingTitle(false);
  };

  const handleCancelTitle = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingTitle(false);
  };

  const handleSavePrice = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingPrice(false);
  };
  const handleCancelPrice = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingPrice(false);
  };

  const handleSaveRevisions = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingRevisions(false);
  };
  const handleCancelRevisions = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingRevisions(false);
  };

  const handleSaveDeadline = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingDeadline(false);
  };
  const handleCancelDeadline = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingDeadline(false);
  };

  const handleSubtaskUpdateInModal = (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean,
  ) => {
    if (!editableProject) return;
    const newSubTasks = updateSubtaskRecursively(
      editableProject.subTasks || [],
      taskId,
      field,
      value,
    );
    const updatedEditableProject = {
      ...editableProject,
      subTasks: newSubTasks,
    };
    setEditableProject(updatedEditableProject);
    updateProject(updatedEditableProject);
    setModalContent(updatedEditableProject);
  };

  const addSubtaskInModal = () => {
    if (!editableProject) return;
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: 'New sub-task',
      description: '',
      completed: false,
    };
    const newSubTasks = [...(editableProject.subTasks || []), newSubTask];
    const updatedEditableProject = {
      ...editableProject,
      subTasks: newSubTasks,
    };
    setEditableProject(updatedEditableProject);
    updateProject(updatedEditableProject);
    setModalContent(updatedEditableProject);
  };

  const addChildSubtaskInModal = (parentId: string) => {
    if (!editableProject) return;
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: 'New nested sub-task',
      description: '',
      completed: false,
    };
    const newSubTasks = addChildToSubtaskRecursively(
      editableProject.subTasks || [],
      parentId,
      newSubTask,
    );
    const updatedEditableProject = {
      ...editableProject,
      subTasks: newSubTasks,
    };
    setEditableProject(updatedEditableProject);
    updateProject(updatedEditableProject);
    setModalContent(updatedEditableProject);
  };

  const removeSubtaskInModal = (taskId: string) => {
    if (!editableProject) return;
    const newSubTasks = removeSubtaskRecursively(
      editableProject.subTasks || [],
      taskId,
    );
    const updatedEditableProject = {
      ...editableProject,
      subTasks: newSubTasks,
    };
    setEditableProject(updatedEditableProject);
    updateProject(updatedEditableProject);
    setModalContent(updatedEditableProject);
  };

  const selectedClient = useMemo(() => {
    if (!modalContent || typeof modalContent !== 'object') return undefined;
    return clients.find((c) => c._id === modalContent.clientId);
  }, [modalContent, clients]);

  const modalSubTaskProgress = useMemo(() => {
    if (!modalContent || typeof modalContent !== 'object') return 0;
    return calculateProgress(modalContent.subTasks);
  }, [modalContent]);

  return (
    <>
      {/* HEADER CONTROLS */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5 mt-2">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground/90">Projects</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl border-border/70 focus-visible:ring-primary w-full bg-background/50 shadow-2xs"
            />
          </div>

          {/* View switcher */}
          <div className="flex bg-muted p-1 rounded-xl text-xs border border-border/40 shrink-0 shadow-2xs">
            <Button
              variant={viewMode === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === 'kanban'
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('kanban')}
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> Kanban
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
              <Table className="mr-1.5 h-3.5 w-3.5" /> Table
            </Button>
          </div>

          {/* Static decoration buttons to match Plutio style header */}
          <div className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/40 shrink-0 shadow-2xs">
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Edit view</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Filter</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Group</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Order</Button>
          </div>

          <Button
            onClick={() => setModalContent('create')}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" /> New Project
          </Button>
        </div>
      </div>

      {/* STATUS SUMMARY BAR - SOFT AND PREMIUM PILLS */}
      <div className="flex-shrink-0 flex items-center gap-2.5 mb-6 flex-wrap select-none">
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>{statusCounts.Total} Projects</span>
        </div>
        <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>{statusCounts.Backlog} Backlog</span>
        </div>
        <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>{statusCounts['In Progress']} In progress</span>
        </div>
        <div className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>{statusCounts.Review} Review</span>
        </div>
        <div className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-purple-500" />
          <span>{statusCounts.Completed} Completed</span>
        </div>
        <div className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-500 animate-pulse" />
          <span>{statusCounts.Paid} Paid</span>
        </div>
      </div>

      <Dialog
        open={!!modalContent}
        onOpenChange={(isOpen) => !isOpen && handleCloseModal()}
      >
        <DialogContent className='sm:max-w-4xl h-[90vh] flex flex-col'>
          {modalContent === 'create' ? (
            <>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new project to your board.
                </DialogDescription>
              </DialogHeader>
              <CreateProjectForm
                clients={clients}
                onSubmit={addProject}
                translations={{
                  titleLabel: 'Project Title',
                  clientLabel: 'Client',
                  selectClientPlaceholder: 'Select a client',
                  priceLabel: 'Gross Price',
                  deadlineLabel: 'Deadline',
                  pickDatePlaceholder: 'Pick a date',
                  subtasksLabel: 'Sub-tasks',
                  addSubtask: 'Add Sub-task',
                  removeSubtask: 'Remove',
                  createProjectButton: 'Create Project',
                  creatingProjectButton: 'Creating...',
                  titleRequired: 'Project title is required.',
                  clientRequired: 'Please select a client.',
                  priceRequired: 'Price must be a positive number.',
                  deadlineRequired: 'Deadline is required.',
                }}
              />
            </>
          ) : (
            modalContent &&
            typeof modalContent === 'object' &&
            editableProject && (
              <>
                <DialogHeader>
                  <div className='flex flex-col gap-1 pr-12'>
                    <div className='flex items-center gap-2'>
                      {!isEditingTitle ? (
                        <>
                          <DialogTitle className='flex-grow text-2xl'>
                            <Link
                              href={`/board/${modalContent.id}`}
                              className='hover:underline'
                            >
                              {modalContent.title}
                            </Link>
                          </DialogTitle>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingTitle(true)}
                          >
                            <Pencil className='h-5 w-5' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={editableProject.title}
                            onChange={(e) =>
                              handleValueChange('title', e.target.value)
                            }
                            className='text-2xl font-semibold flex-grow h-auto py-1'
                            autoFocus
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleSaveTitle}
                          >
                            <Check className='h-5 w-5' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleCancelTitle}
                          >
                            <X className='h-5 w-5' />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className='flex items-center gap-2'>
                      {!isEditingSubtitle ? (
                        <>
                          <span className='text-muted-foreground text-sm'>
                            {modalContent.subtitle || (
                              <span className='italic text-xs'>
                                No description
                              </span>
                            )}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingSubtitle(true)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={editableProject.subtitle || ''}
                            onChange={(e) =>
                              handleValueChange('subtitle', e.target.value)
                            }
                            className='text-sm flex-grow h-auto py-1'
                            autoFocus
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleSaveSubtitle}
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleCancelSubtitle}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {selectedClient && (
                    <div className='flex items-center gap-2 text-xs text-muted-foreground'>
                      Client:{' '}
                      <span className='font-medium'>{selectedClient.name}</span>
                    </div>
                  )}
                  {/* Order No. and Project Type together */}
                  <div className='flex items-center gap-6 mt-1 mb-2'>
                    <div className='text-xs text-muted-foreground flex items-center gap-2'>
                      Order No.:
                      {!isEditingOrderNo ? (
                        <>
                          <span className='font-mono'>
                            {modalContent.orderNo || '-'}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={() => setIsEditingOrderNo(true)}
                            aria-label='Edit order number'
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Input
                            value={editableProject.orderNo || ''}
                            onChange={(e) =>
                              handleValueChange('orderNo', e.target.value)
                            }
                            className='font-mono h-6 py-0 text-xs w-36'
                            autoFocus
                          />
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={handleSaveOrderNo}
                            aria-label='Save order number'
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={handleCancelOrderNo}
                            aria-label='Cancel edit order number'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </>
                      )}
                    </div>
                    <div className='text-xs text-muted-foreground flex items-center gap-2'>
                      ประเภทงาน:
                      {!isEditingType ? (
                        <>
                          <span className='font-mono'>
                            {jobTypes.find(
                              (jt) => jt._id === modalContent.jobTypeId,
                            )?.name || '-'}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={() => setIsEditingType(true)}
                            aria-label='Edit project type'
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <select
                            value={editableProject.jobTypeId || ''}
                            onChange={(e) =>
                              handleValueChange('jobTypeId', e.target.value)
                            }
                            className='font-mono h-6 py-0 text-xs w-36 border rounded px-2'
                            autoFocus
                          >
                            <option value='' disabled>
                              เลือกประเภทงาน
                            </option>
                            {jobTypes.map((jt) => (
                              <option key={jt._id} value={jt._id}>
                                {jt.name}
                              </option>
                            ))}
                          </select>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={handleSaveType}
                            aria-label='Save project type'
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={handleCancelType}
                            aria-label='Cancel edit project type'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Project details section */}
                  <div className='mb-2 text-xs text-muted-foreground flex items-center gap-4'>
                    <span className='mr-4'>
                      Status:{' '}
                      <span className='font-semibold'>
                        {modalContent.status}
                      </span>
                    </span>
                    <span className='flex items-center gap-1'>
                      Due:
                      {!isEditingDeadline ? (
                        <>
                          <span>
                            {format(new Date(modalContent.deadline), 'PPP')}
                          </span>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={() => setIsEditingDeadline(true)}
                            aria-label='Edit due date'
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant={'outline'}
                                className={cn(
                                  'pl-3 text-left font-normal h-auto py-1 w-36 justify-start',
                                  !editableProject.deadline &&
                                    'text-muted-foreground',
                                )}
                              >
                                {editableProject.deadline ? (
                                  format(
                                    new Date(editableProject.deadline),
                                    'PPP',
                                  )
                                ) : (
                                  <span>Pick a date</span>
                                )}
                                <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent
                              className='w-auto p-0'
                              align='start'
                            >
                              <Calendar
                                mode='single'
                                selected={new Date(editableProject.deadline)}
                                onSelect={(date) =>
                                  handleValueChange('deadline', date)
                                }
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={handleSaveDeadline}
                            aria-label='Save due date'
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-5 w-5 p-0'
                            onClick={handleCancelDeadline}
                            aria-label='Cancel edit due date'
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </>
                      )}
                    </span>
                  </div>
                </DialogHeader>

                <ScrollArea className='flex-grow pr-6 -mr-6'>
                  <div className='space-y-6 pb-6'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                        {/* <DollarSign className='h-6 w-6 text-muted-foreground' /> */}
                        <div className='flex-grow'>
                          <p className='text-sm text-muted-foreground'>Price</p>
                          {isEditingPrice ? (
                            <Input
                              type='number'
                              value={editableProject.gross_price}
                              onChange={(e) =>
                                handleValueChange(
                                  'gross_price',
                                  Number(e.target.value),
                                )
                              }
                              className='font-semibold text-lg p-1 h-auto'
                            />
                          ) : (
                            <p className='font-semibold text-lg'>
                              {formatNumber(modalContent.gross_price)}
                            </p>
                          )}
                        </div>
                        {isEditingPrice ? (
                          <div className='flex'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleSavePrice}
                            >
                              <Check className='h-5 w-5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleCancelPrice}
                            >
                              <X className='h-5 w-5' />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingPrice(true)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                        <MessageSquare className='h-6 w-6 text-muted-foreground' />
                        <div className='flex-grow'>
                          <p className='text-sm text-muted-foreground'>
                            Revisions
                          </p>
                          {isEditingRevisions ? (
                            <Input
                              type='number'
                              value={editableProject.revisions}
                              onChange={(e) =>
                                handleValueChange(
                                  'revisions',
                                  Number(e.target.value),
                                )
                              }
                              className='font-semibold text-lg p-1 h-auto'
                            />
                          ) : (
                            <p className='font-semibold text-lg'>
                              {modalContent.revisions}
                            </p>
                          )}
                        </div>
                        {isEditingRevisions ? (
                          <div className='flex'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleSaveRevisions}
                            >
                              <Check className='h-5 w-5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleCancelRevisions}
                            >
                              <X className='h-5 w-5' />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingRevisions(true)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                        <Clock className='h-6 w-6 text-muted-foreground' />
                        <div className='flex-grow'>
                          <p className='text-sm text-muted-foreground'>
                            Deadline
                          </p>
                          {isEditingDeadline ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'pl-3 text-left font-normal h-auto py-1 w-full justify-start',
                                    !editableProject.deadline &&
                                      'text-muted-foreground',
                                  )}
                                >
                                  {editableProject.deadline ? (
                                    format(
                                      new Date(editableProject.deadline),
                                      'PPP',
                                    )
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent
                                className='w-auto p-0'
                                align='start'
                              >
                                <Calendar
                                  mode='single'
                                  selected={new Date(editableProject.deadline)}
                                  onSelect={(date) =>
                                    handleValueChange('deadline', date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <p className='font-semibold'>
                              {format(
                                new Date(modalContent.deadline),
                                'MMM d, yyyy',
                              )}
                            </p>
                          )}
                        </div>
                        {isEditingDeadline ? (
                          <div className='flex'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleSaveDeadline}
                            >
                              <Check className='h-5 w-5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleCancelDeadline}
                            >
                              <X className='h-5 w-5' />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingDeadline(true)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        )}
                      </div>
                    </div>
                    <Separator />
                    {/* Project Details Section: Rich Text Editor */}
                    <div className='mb-6'>
                      <Accordion type='single' collapsible>
                        <AccordionItem value='details'>
                          <AccordionTrigger>
                            <span className='text-lg font-semibold mb-2'>
                              Project Details
                            </span>
                          </AccordionTrigger>
                          <AccordionContent>
                            <EditableQuillField
                              value={editableProject.details || ''}
                              onChange={(val) =>
                                handleValueChange('details', val)
                              }
                              placeholder='Enter project details, user info, requirements, etc.'
                            />
                          </AccordionContent>
                        </AccordionItem>
                      </Accordion>
                    </div>
                    {modalContent.subTasks !== undefined && (
                      <div>
                        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                          <ListTodo className='h-5 w-5' />
                          Sub-tasks
                          <span className='ml-2 text-xs text-muted-foreground'>
                            {(() => {
                              return (
                                countAllSubtasks(modalContent.subTasks) || 0
                              );
                            })()}
                          </span>
                        </h3>
                        <div className='space-y-4'>
                          <div className='flex items-center gap-4'>
                            <Progress
                              value={modalSubTaskProgress}
                              className='h-2'
                            />
                            <span className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
                              {Math.round(modalSubTaskProgress)}%
                            </span>
                            <span className='text-xs text-muted-foreground'>
                              {(() => {
                                // Recursively count all subtasks and completed subtasks
                                const [total, done] = countAll(
                                  modalContent.subTasks,
                                );
                                return `${done}/${total}`;
                              })()}
                            </span>
                          </div>

                          <Accordion
                            type='multiple'
                            className='w-full space-y-2'
                          >
                            {[...(modalContent.subTasks || [])]
                              .sort(
                                (a, b) =>
                                  Number(a.completed) - Number(b.completed),
                              )
                              .map((subtask) => (
                                <SubtaskItem
                                  key={subtask.id}
                                  subtask={subtask}
                                  onUpdate={handleSubtaskUpdateInModal}
                                  onRemove={removeSubtaskInModal}
                                  onAddChild={addChildSubtaskInModal}
                                  idPrefix='modal-'
                                />
                              ))}
                          </Accordion>

                          <Button onClick={addSubtaskInModal} variant='outline'>
                            <PlusCircle className='mr-2 h-4 w-4' />
                            Add Sub-task
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </>
            )
          )}
        </DialogContent>
      </Dialog>

      {viewMode === 'table' ? (
        <Card className="border border-border/50 shadow-sm overflow-hidden bg-card rounded-2xl mb-8">
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
                  <th className="py-3 px-5 w-36 text-right pr-8">Budget</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredProjects.map((project) => {
                  const client = clients.find((c) => c._id === project.clientId);
                  const progress = calculateProgress(project.subTasks);
                  const [totalTasks, doneTasks] = countAll(project.subTasks);

                  return (
                    <tr
                      key={project.id}
                      className="hover:bg-muted/15 transition-all duration-150 group"
                    >
                      {/* Checkbox circle */}
                      <td className="py-4 px-5 text-center align-middle">
                        <div className="w-4 h-4 rounded-full border border-muted-foreground/25 hover:border-primary/80 hover:bg-primary/5 transition-all cursor-pointer mx-auto flex items-center justify-center group-hover:scale-105" />
                      </td>

                      {/* Project Title */}
                      <td className="py-4 px-5 font-bold text-foreground/90 align-middle">
                        <span
                          onClick={() => handleCardClick(project)}
                          className="cursor-pointer hover:text-primary hover:underline transition-all"
                        >
                          {project.title}
                        </span>
                      </td>

                      {/* Project Client */}
                      <td className="py-4 px-5 text-muted-foreground align-middle">
                        {client ? (
                          <span className="inline-flex items-center bg-primary/5 text-primary border border-primary/10 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                            {client.name}
                          </span>
                        ) : (
                          <span className="italic text-xs opacity-60">No client</span>
                        )}
                      </td>

                      {/* Status Dropdown - Pill badge select */}
                      <td className="py-4 px-5 align-middle">
                        <Select
                          value={project.status}
                          onValueChange={(val) =>
                            updateProject({ ...project, status: val as ProjectStatus })
                          }
                        >
                          <SelectTrigger
                            className={cn(
                              "h-7 w-32 font-bold text-[10px] rounded-full border border-transparent shadow-3xs uppercase tracking-wider transition-all duration-200 focus:ring-0 focus-visible:ring-0",
                              project.status === "Completed" || project.status === "Paid"
                                ? "bg-green-500/10 text-green-700 hover:bg-green-500/15"
                                : project.status === "Review"
                                ? "bg-amber-500/10 text-amber-700 hover:bg-amber-500/15"
                                : project.status === "In Progress"
                                ? "bg-primary/10 text-primary hover:bg-primary/15"
                                : "bg-muted text-muted-foreground hover:bg-muted/80"
                            )}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
                            <SelectItem value="Backlog">Backlog</SelectItem>
                            <SelectItem value="In Progress">In Progress</SelectItem>
                            <SelectItem value="Review">Review</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Paid">Paid</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>

                      {/* Members */}
                      <td className="py-4 px-5 align-middle">
                        <Avatar className="h-6.5 w-6.5 border border-primary/10 shadow-3xs">
                          <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px]">
                            W
                          </AvatarFallback>
                        </Avatar>
                      </td>

                      {/* Progress */}
                      <td className="py-4 px-5 align-middle">
                        <div className="flex items-center gap-3">
                          <Progress value={progress} className="h-1.5 w-24 bg-muted/80" />
                          <span className="text-[10px] font-bold text-muted-foreground/85 whitespace-nowrap">
                            {totalTasks > 0 ? `${doneTasks}/${totalTasks} tasks` : "No tasks"}
                          </span>
                        </div>
                      </td>

                      {/* Budget (Price) */}
                      <td className="py-4 px-5 text-right font-black text-foreground/80 align-middle pr-8">
                        {project.gross_price > 0
                          ? `฿${project.gross_price.toLocaleString()}`
                          : "฿0"}
                      </td>
                    </tr>
                  );
                })}

                {/* Footer row: Create project */}
                <tr className="bg-muted/5 hover:bg-muted/10 transition-colors">
                  <td colSpan={7} className="p-0">
                    <div
                      onClick={() => setModalContent("create")}
                      className="px-8 py-4 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                    >
                      <Plus className="h-4 w-4" /> Create new project
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="flex w-full gap-4 overflow-x-auto pb-4 min-h-screen">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              projects={groupedProjects[status]}
              onDrop={handleDrop}
              onDragStart={(e, projectId, index) => {
                e.dataTransfer.setData('projectId', projectId);
                e.dataTransfer.setData('fromIndex', String(index));
                e.dataTransfer.setData('fromStatus', status);
              }}
              onCardDrop={(fromIdx, toIdx) =>
                handleCardDrop(fromIdx, toIdx, status, status)
              }
              updateProject={updateProject}
              onCardClick={handleCardClick}
            />
          ))}
        </div>
      )}
    </>
  );
}
