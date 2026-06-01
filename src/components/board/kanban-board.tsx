'use client';

import { useState, useMemo, useEffect, DragEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Project, Task, ProjectStatus, Client, SubTask } from '@/lib/types';
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
  CheckCircle2,
  X,
  CalendarIcon,
  Search,
  Table,
  LayoutGrid,
  Archive,
  User,
  ArrowRight,
  FolderOpen,
  ChevronDown,
  AlignJustify,
} from 'lucide-react';
import { RepeatsPopover, formatRepeatSummary } from '@/components/board/repeats-popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CreateProjectForm } from './create-project-form';
import { ScrollArea } from '../ui/scroll-area';
import { format } from 'date-fns';
import { Separator } from '../ui/separator';
import { Avatar, AvatarImage, AvatarFallback } from '../ui/avatar';
import { Progress } from '../ui/progress';
import { Badge } from '@/components/ui/badge';
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
  useAddTaskMutation,
  useUpdateTaskMutation,
} from '@/services/taskApi';
import { EditableQuillField } from '../ui/editable-quill-field';
import { formatNumber } from '@/lib/number-format';
import { fetchJobTypes } from '@/services/jobTypeClient';
import type { JobType } from '@/app/(protect)/job-types/page';

interface KanbanBoardProps {
  initialTasks: Task[];
  projects: Project[];
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
  initialTasks,
  projects: projectContainers,
  clients,
}: KanbanBoardProps) {
  const router = useRouter();
  const [projects, setProjects] = useState<Task[]>(initialTasks);
  const [modalContent, setModalContent] = useState<Task | 'create' | null>(
    null,
  );
  const [viewMode, setViewMode] = useState<'kanban' | 'table' | 'list' | 'calendar' | 'timeline'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('all');
  const [activeTaskFilter, setActiveTaskFilter] = useState<'all' | 'my' | 'delegated' | 'following' | 'today'>('all');

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
  const [isEditingStartDate, setIsEditingStartDate] = useState(false);
  const [isEditingHourlyRate, setIsEditingHourlyRate] = useState(false);
  const [editableProject, setEditableProject] = useState<Task | null>(null);

  const [addTaskMutation] = useAddTaskMutation();
  const [updateTaskMutation] = useUpdateTaskMutation();

  const filteredProjects = useMemo(() => {
    let list = projects;
    if (!showArchived) {
      list = list.filter((p) => !p.archived);
    }
    if (selectedProjectId !== 'all') {
      list = list.filter((p) => p.projectId === selectedProjectId);
    } else {
      if (activeTaskFilter === 'today') {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        list = list.filter((t) => t.deadline && format(new Date(t.deadline), 'yyyy-MM-dd') === todayStr);
      } else if (activeTaskFilter === 'my') {
        list = list.filter((t) => !t.projectId);
      } else if (activeTaskFilter === 'delegated') {
        list = list.filter((t) => t.gross_price > 0);
      } else if (activeTaskFilter === 'following') {
        list = list.filter((t) => t.revisions > 0);
      }
    }
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase();
    return list.filter((p) => {
      const titleMatch = p.title.toLowerCase().includes(query);
      const clientName = clients.find((c) => c._id === p.clientId)?.name || '';
      const clientMatch = clientName.toLowerCase().includes(query);
      return titleMatch || clientMatch;
    });
  }, [projects, searchQuery, clients, showArchived, selectedProjectId, activeTaskFilter]);

  const groupedProjects = useMemo(() => {
    return columns.reduce(
      (acc, status) => {
        acc[status] = filteredProjects
          .filter((p) => p.status === status)
          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        return acc;
      },
      {} as Record<ProjectStatus, Task[]>,
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
      let updated: Task[] = [];
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
        updateTaskMutation({
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
      updateTaskMutation({
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
    newProjectData: Omit<Task, 'id' | 'status' | 'revisions' | 'order'>,
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
      const res = await addTaskMutation({
        ...newProjectData,
        status: 'Backlog',
        revisions: 0,
        subTasks,
        order: maxOrder + 1,
        projectId: selectedProjectId !== 'all' ? selectedProjectId : undefined,
      }).unwrap();
      setProjects((prev) => [res, ...prev]);
      setModalContent(null);
    } catch (err) {
      alert('Failed to add task');
    }
  };

  const updateProject = async (updatedProject: Task) => {
    try {
      await updateTaskMutation({
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
      alert('Failed to update task');
    }
  };

  const handleCardClick = (project: Project) => {
    router.push(`/board/${project.id}`);
  };

  const handleCloseModal = () => {
    setModalContent(null);
    setEditableProject(null);
    setIsEditingTitle(false);
    setIsEditingPrice(false);
    setIsEditingRevisions(false);
    setIsEditingDeadline(false);
    setIsEditingStartDate(false);
    setIsEditingHourlyRate(false);
  };

  const handleValueChange = (key: keyof Task, value: any) => {
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

  const handleSaveStartDate = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingStartDate(false);
  };
  const handleCancelStartDate = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingStartDate(false);
  };

  const handleSaveHourlyRate = () => {
    if (editableProject) {
      updateProject(editableProject);
      setModalContent(editableProject);
    }
    setIsEditingHourlyRate(false);
  };
  const handleCancelHourlyRate = () => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
    }
    setIsEditingHourlyRate(false);
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
    <div className="flex h-full w-full gap-6 overflow-hidden">
      {/* LEFT SIDEBAR PANEL */}
      <div className="w-[280px] shrink-0 hidden lg:flex flex-col bg-card border border-border/50 rounded-2xl p-4 gap-6 overflow-y-auto">
        {/* Task sets */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-extrabold text-[11px] text-muted-foreground uppercase tracking-wider">Task sets</span>
            <Button variant="ghost" size="icon" className="h-6 w-6 rounded-md hover:bg-muted text-muted-foreground" onClick={() => setModalContent('create')}>
              <PlusCircle className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-[10px] text-muted-foreground leading-normal mb-2">
            For tasks that don't need a full project - perfect for goals, checklists or simple to-dos.
          </p>
          <div className="flex flex-col gap-1">
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId('all');
                setActiveTaskFilter('all');
              }}
              className={cn(
                "w-full justify-start gap-2.5 h-9 px-3 rounded-xl text-xs font-bold",
                selectedProjectId === 'all' && activeTaskFilter === 'all'
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <ListTodo className="h-4 w-4 shrink-0" />
              <span>All tasks</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId('all');
                setActiveTaskFilter('my');
              }}
              className={cn(
                "w-full justify-start gap-2.5 h-9 px-3 rounded-xl text-xs font-bold",
                selectedProjectId === 'all' && activeTaskFilter === 'my'
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <User className="h-4 w-4 shrink-0" />
              <span>My tasks</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId('all');
                setActiveTaskFilter('delegated');
              }}
              className={cn(
                "w-full justify-start gap-2.5 h-9 px-3 rounded-xl text-xs font-bold",
                selectedProjectId === 'all' && activeTaskFilter === 'delegated'
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <ArrowRight className="h-4 w-4 shrink-0" />
              <span>Delegated</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId('all');
                setActiveTaskFilter('following');
              }}
              className={cn(
                "w-full justify-start gap-2.5 h-9 px-3 rounded-xl text-xs font-bold",
                selectedProjectId === 'all' && activeTaskFilter === 'following'
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <Search className="h-4 w-4 shrink-0" />
              <span>Following</span>
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setSelectedProjectId('all');
                setActiveTaskFilter('today');
              }}
              className={cn(
                "w-full justify-start gap-2.5 h-9 px-3 rounded-xl text-xs font-bold",
                selectedProjectId === 'all' && activeTaskFilter === 'today'
                  ? "bg-primary/10 text-primary hover:bg-primary/15"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
              )}
            >
              <CalendarIcon className="h-4 w-4 shrink-0" />
              <span>Today</span>
            </Button>
          </div>
        </div>

        <Separator className="bg-border/30" />

        {/* Project Tasks */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1">
              <span className="font-extrabold text-[11px] text-muted-foreground uppercase tracking-wider">Project tasks</span>
              <span className="text-[10px] text-muted-foreground/60 cursor-pointer" title="Active projects list">ⓘ</span>
            </div>
          </div>
          <div className="flex flex-col gap-1 max-h-[300px] overflow-y-auto pr-1">
            {projectContainers.filter(p => !p.archived).map((proj) => (
              <Button
                key={proj.id}
                variant="ghost"
                onClick={() => {
                  setSelectedProjectId(proj.id);
                  setActiveTaskFilter('all');
                }}
                className={cn(
                  "w-full justify-between items-center h-9 px-3 rounded-xl text-xs font-bold",
                  selectedProjectId === proj.id
                    ? "bg-primary/10 text-primary hover:bg-primary/15"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/40"
                )}
              >
                <div className="flex items-center gap-2.5 truncate">
                  <FolderOpen className="h-4 w-4 shrink-0 opacity-70" />
                  <span className="truncate">{proj.title}</span>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    "text-[8px] font-extrabold uppercase shrink-0 py-0 px-1.5 h-4.5 rounded-md border-0 text-white select-none",
                    (!proj.status || proj.status === 'New') && "bg-[#3b82f6]",
                    proj.status === 'In progress' && "bg-[#22c55e]",
                    proj.status === 'Pending' && "bg-[#f97316]",
                    proj.status === 'Delayed' && "bg-[#ef4444]",
                    proj.status === 'Completed' && "bg-[#475569]",
                    proj.status === 'Canceled' && "bg-[#64748b]"
                  )}
                >
                  {proj.status || 'New'}
                </Badge>
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="flex-grow flex flex-col min-w-0 overflow-y-auto pr-1">
        {/* PATHWAY */}
        <div className="text-[10px] font-black text-muted-foreground/70 tracking-wider uppercase mb-1.5 flex items-center gap-1.5 select-none mt-2">
          <span>Tasks</span>
          <span>/</span>
          <span className="text-foreground/90">
            {selectedProjectId !== 'all' 
              ? (projectContainers.find(p => p.id === selectedProjectId)?.title || 'Project tasks')
              : (activeTaskFilter === 'all' ? 'All tasks' : 
                 activeTaskFilter === 'today' ? 'Today' : 
                 activeTaskFilter === 'my' ? 'My tasks' : 
                 activeTaskFilter === 'delegated' ? 'Delegated' : 'Following')
            }
          </span>
        </div>

        {/* HEADER CONTROLS */}
        <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight text-foreground/90">Tasks</h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            {/* Project Dropdown Filter */}
            <div className="w-48">
              <Select
                value={selectedProjectId}
                onValueChange={(val) => {
                  setSelectedProjectId(val);
                  setActiveTaskFilter('all');
                }}
              >
                <SelectTrigger className="rounded-xl h-9 bg-background/50 border-border/70 text-xs font-semibold">
                  <SelectValue placeholder="Filter by Project" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all">All Projects</SelectItem>
                  {projectContainers.map((proj) => (
                    <SelectItem key={proj.id} value={proj.id}>
                      {proj.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Search bar */}
            <div className="relative w-56">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
              <Input
                placeholder="Search tasks..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl border-border/70 focus-visible:ring-primary w-full bg-background/50 shadow-2xs"
              />
            </div>

            {/* View switcher */}
            <div className="flex bg-muted/30 p-1 rounded-xl text-xs shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-8 gap-2 bg-background shadow-xs font-medium border-border/60 hover:bg-muted/50 rounded-lg">
                    {viewMode === 'list' && <><AlignJustify className="w-3.5 h-3.5" /> List</>}
                    {viewMode === 'table' && <><Table className="w-3.5 h-3.5" /> Table</>}
                    {viewMode === 'kanban' && <><LayoutGrid className="w-3.5 h-3.5" /> Kanban</>}
                    {viewMode === 'calendar' && <><CalendarIcon className="w-3.5 h-3.5" /> Calendar</>}
                    {viewMode === 'timeline' && <><Clock className="w-3.5 h-3.5" /> Timeline</>}
                    <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50 ml-1" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-40 z-[60] rounded-xl p-1.5 shadow-lg border-border/60">
                  <DropdownMenuItem onClick={() => setViewMode('list')} className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5">
                    <AlignJustify className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    List
                    {viewMode === 'list' && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('table')} className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5">
                    <Table className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Table
                    {viewMode === 'table' && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('kanban')} className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5">
                    <LayoutGrid className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Kanban
                    {viewMode === 'kanban' && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('calendar')} className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5">
                    <CalendarIcon className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Calendar
                    {viewMode === 'calendar' && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setViewMode('timeline')} className="text-xs font-medium cursor-pointer rounded-lg px-2 py-1.5">
                    <Clock className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                    Timeline
                    {viewMode === 'timeline' && <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-primary" />}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Archived projects toggle */}
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
              <Plus className="mr-1.5 h-4 w-4" /> New Task
            </Button>
          </div>
        </div>

        {/* STATUS SUMMARY BAR - SOFT AND PREMIUM PILLS */}
        <div className="flex-shrink-0 flex items-center gap-2 mb-5 flex-wrap select-none">
          <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-slate-500" />
            <span>{statusCounts.Total} Tasks</span>
          </div>
          <div className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-200/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-blue-500" />
            <span>{statusCounts.Backlog} Backlog</span>
          </div>
          <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>{statusCounts['In Progress']} In progress</span>
          </div>
          <div className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-orange-500" />
            <span>{statusCounts.Review} Review</span>
          </div>
          <div className="bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-200/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>{statusCounts.Completed} Completed</span>
          </div>
          <div className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200/20 px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 shadow-2xs">
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
                <DialogTitle>Create New Task</DialogTitle>
                <DialogDescription>
                  Fill in the details below to add a new task to your board.
                </DialogDescription>
              </DialogHeader>
              <CreateProjectForm
                clients={clients}
                onSubmit={addProject}
                translations={{
                  titleLabel: 'Task Title',
                  clientLabel: 'Client',
                  selectClientPlaceholder: 'Select a client',
                  priceLabel: 'Gross Price',
                  deadlineLabel: 'Deadline',
                  pickDatePlaceholder: 'Pick a date',
                  subtasksLabel: 'Sub-tasks',
                  addSubtask: 'Add Sub-task',
                  removeSubtask: 'Remove',
                  createProjectButton: 'Create Task',
                  creatingProjectButton: 'Creating...',
                  titleRequired: 'Task title is required.',
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

                    {/* Planning & Billing Grid */}
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mt-4'>
                      {/* Start Date */}
                      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                        <CalendarIcon className='h-6 w-6 text-muted-foreground' />
                        <div className='flex-grow'>
                          <p className='text-sm text-muted-foreground'>
                            Start Date
                          </p>
                          {isEditingStartDate ? (
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button
                                  variant={'outline'}
                                  className={cn(
                                    'pl-3 text-left font-normal h-auto py-1 w-full justify-start',
                                    !editableProject.startDate &&
                                      'text-muted-foreground',
                                  )}
                                >
                                  {editableProject.startDate ? (
                                    format(
                                      new Date(editableProject.startDate),
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
                                  selected={editableProject.startDate ? new Date(editableProject.startDate) : undefined}
                                  onSelect={(date) =>
                                    handleValueChange('startDate', date)
                                  }
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                          ) : (
                            <p className='font-semibold'>
                              {modalContent.startDate ? (
                                format(
                                  new Date(modalContent.startDate),
                                  'MMM d, yyyy',
                                )
                              ) : (
                                <span className="italic text-xs text-muted-foreground">Not set</span>
                              )}
                            </p>
                          )}
                        </div>
                        {isEditingStartDate ? (
                          <div className='flex'>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleSaveStartDate}
                            >
                              <Check className='h-5 w-5' />
                            </Button>
                            <Button
                              variant='ghost'
                              size='icon'
                              onClick={handleCancelStartDate}
                            >
                              <X className='h-5 w-5' />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            variant='ghost'
                            size='icon'
                            onClick={() => setIsEditingStartDate(true)}
                          >
                            <Pencil className='h-4 w-4' />
                          </Button>
                        )}
                      </div>

                      {/* Billing Settings */}
                      <div className='flex flex-col gap-2 p-4 rounded-lg bg-muted justify-center'>
                        <div className='flex items-center justify-between w-full'>
                          <span className='text-sm font-medium text-muted-foreground'>Billable</span>
                          <input
                            type='checkbox'
                            checked={!!editableProject.billable}
                            onChange={(e) => {
                              const updated = { ...editableProject, billable: e.target.checked };
                              setEditableProject(updated);
                              updateProject(updated);
                            }}
                            className='h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary'
                          />
                        </div>
                        <Separator className="my-1" />
                        <div className='flex items-center gap-1 w-full justify-between'>
                          <div className='flex-grow'>
                            <p className='text-xs text-muted-foreground'>Hourly Rate</p>
                            {isEditingHourlyRate ? (
                              <div className='flex items-center gap-1 mt-1'>
                                <select
                                  value={editableProject.currency || 'USD'}
                                  onChange={(e) =>
                                    handleValueChange('currency', e.target.value)
                                  }
                                  className='border rounded h-7 text-xs px-1'
                                >
                                  <option value='USD'>$</option>
                                  <option value='THB'>฿</option>
                                  <option value='EUR'>€</option>
                                  <option value='GBP'>£</option>
                                </select>
                                <Input
                                  type='number'
                                  value={editableProject.hourlyRate || ''}
                                  onChange={(e) =>
                                    handleValueChange(
                                      'hourlyRate',
                                      e.target.value ? Number(e.target.value) : undefined,
                                    )
                                  }
                                  className='font-semibold text-xs p-1 h-7 w-20'
                                />
                              </div>
                            ) : (
                              <p className='font-semibold text-sm'>
                                {modalContent.hourlyRate ? (
                                  <>
                                    {modalContent.currency === 'THB' ? '฿' : modalContent.currency === 'EUR' ? '€' : modalContent.currency === 'GBP' ? '£' : '$'}
                                    {modalContent.hourlyRate} / hr
                                  </>
                                ) : (
                                  <span className="italic text-xs text-muted-foreground">Not set</span>
                                )}
                              </p>
                            )}
                          </div>
                          {isEditingHourlyRate ? (
                            <div className='flex'>
                              <Button
                                variant='ghost'
                                size='icon'
                                className="h-7 w-7"
                                onClick={handleSaveHourlyRate}
                              >
                                <Check className='h-4 w-4' />
                              </Button>
                              <Button
                                variant='ghost'
                                size='icon'
                                className="h-7 w-7"
                                onClick={handleCancelHourlyRate}
                              >
                                <X className='h-4 w-4' />
                              </Button>
                            </div>
                          ) : (
                            <Button
                              variant='ghost'
                              size='icon'
                              className="h-7 w-7"
                              onClick={() => setIsEditingHourlyRate(true)}
                            >
                              <Pencil className='h-3.5 w-3.5' />
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Project Tag Color */}
                      <div className='flex flex-col gap-2 p-4 rounded-lg bg-muted justify-center md:col-span-1'>
                        <p className='text-sm text-muted-foreground font-medium'>
                          Project Tag Color
                        </p>
                        <div className='flex flex-wrap gap-1.5 items-center mt-1'>
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
                              className={cn(
                                "w-5 h-5 rounded-full border transition-transform hover:scale-110",
                                editableProject.color === c.hex
                                  ? "ring-2 ring-ring ring-offset-2 scale-110"
                                  : "border-muted"
                              )}
                              style={{ backgroundColor: c.hex }}
                              onClick={() => {
                                const updated = { ...editableProject, color: c.hex };
                                setEditableProject(updated);
                                updateProject(updated);
                              }}
                              title={c.name}
                            />
                          ))}
                          <button
                            className={cn(
                              "px-1.5 py-0.5 text-[10px] border rounded hover:bg-background transition-colors",
                              !editableProject.color && "bg-background font-semibold"
                            )}
                            onClick={() => {
                              const updated = { ...editableProject, color: '' };
                              setEditableProject(updated);
                              updateProject(updated);
                            }}
                          >
                            Clear
                          </button>
                        </div>
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
        <div className="flex flex-col gap-6 mb-8 w-full">
          {columns.map((column) => {
            const columnTasks = filteredProjects.filter((p) => p.status === column);
            
            return (
              <div key={column} className="flex flex-col gap-2 w-full">
                <div className="flex items-center gap-2 px-2">
                  <h3 className="font-bold text-sm text-foreground/90">{column}</h3>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full font-bold">{columnTasks.length}</span>
                </div>
                
                <Card className="border border-border/50 shadow-sm overflow-hidden bg-card rounded-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border-collapse">
                      <thead>
                        <tr className="border-b border-border/30 bg-muted/5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 text-left">
                          <th className="py-2.5 px-4 w-10 text-center"></th>
                          <th className="py-2.5 px-2 w-8 text-center"></th>
                          <th className="py-2.5 px-4">Task</th>
                          <th className="py-2.5 px-4 w-48">Project</th>
                          <th className="py-2.5 px-4 w-24">Assignee</th>
                          <th className="py-2.5 px-4 w-36">Start date</th>
                          <th className="py-2.5 px-4 w-36">Due date</th>
                          <th className="py-2.5 px-4 w-32">Repeats</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/30">
                        {columnTasks.map((project) => {
                          const parentProj = projectContainers.find((p) => p.id === project.projectId);
                          const isDone = project.status === 'Completed' || project.status === 'Paid';

                          return (
                            <tr
                              key={project.id}
                              className="hover:bg-muted/15 transition-all duration-150 group"
                            >
                              {/* Checkbox */}
                              <td className="py-3 px-4 text-center align-middle w-10">
                                <input
                                  type="checkbox"
                                  checked={isDone}
                                  onChange={() => {
                                    updateProject({ ...project, status: isDone ? 'Backlog' : 'Completed' });
                                  }}
                                  className="h-4 w-4 rounded border-muted-foreground/30 text-primary focus:ring-primary cursor-pointer transition-all"
                                />
                              </td>

                              {/* Status dot */}
                              <td className="py-3 px-2 text-center align-middle w-8">
                                <div 
                                  className={cn(
                                    "w-2.5 h-2.5 rounded-full mx-auto",
                                    isDone ? "bg-green-500" :
                                    project.status === 'Review' ? "bg-amber-500" :
                                    project.status === 'In Progress' ? "bg-blue-500" : 
                                    project.color ? "" : "bg-slate-300"
                                  )}
                                  style={(!isDone && project.status !== 'Review' && project.status !== 'In Progress' && project.color) ? { backgroundColor: project.color } : undefined}
                                />
                              </td>

                              {/* Title */}
                              <td className="py-3 px-4 font-bold text-foreground/90 align-middle hover:text-primary transition-colors cursor-pointer" onClick={() => handleCardClick(project)}>
                                <span className="line-clamp-1">{project.title}</span>
                                {project.archived && (
                                  <Badge variant="outline" className="text-[9px] font-bold text-destructive bg-destructive/10 border-destructive/20 uppercase shrink-0 py-0 px-1.5 h-4 ml-1.5 inline-block">
                                    Archived
                                  </Badge>
                                )}
                              </td>

                              {/* Project (Editable) */}
                              <td className="py-3 px-4 align-middle w-48">
                                <Select 
                                  value={project.projectId || "general"} 
                                  onValueChange={(val) => updateProject({ ...project, projectId: val === 'general' ? undefined : val })}
                                >
                                  <SelectTrigger className="h-7 border-transparent hover:border-border/50 bg-transparent hover:bg-muted/50 px-2 py-0 shadow-none font-bold text-[10px] w-full">
                                    {parentProj ? (
                                      <Badge variant="outline" className="bg-[#3b82f6]/10 text-[#3b82f6] border-[#3b82f6]/20 font-bold text-[10px] px-2 py-0 rounded-full truncate border-none max-w-[130px]">
                                        {parentProj.title}
                                      </Badge>
                                    ) : (
                                      <span className="text-[10px] text-muted-foreground/60 italic">General Task</span>
                                    )}
                                  </SelectTrigger>
                                  <SelectContent className="max-h-[300px] z-[60]">
                                    <SelectItem value="general" className="text-xs italic text-muted-foreground">General Task</SelectItem>
                                    {projectContainers.map(p => (
                                      <SelectItem key={p.id} value={p.id} className="text-xs font-semibold">{p.title}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </td>

                              {/* Assignee */}
                              <td className="py-3 px-4 align-middle w-24">
                                <div className="h-6 w-6 rounded-full border border-dashed border-muted-foreground/25 flex items-center justify-center bg-muted/5 cursor-pointer hover:bg-muted/50 transition-colors">
                                  <User className="h-3 w-3 text-muted-foreground/40" />
                                </div>
                              </td>

                              {/* Start Date */}
                              <td className="py-3 px-4 align-middle w-36">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="cursor-pointer hover:bg-muted/50 px-2 py-1 -mx-2 rounded-md transition-colors text-xs font-semibold text-muted-foreground/90 flex items-center group">
                                      {project.startDate ? format(new Date(project.startDate), 'dd MMM yyyy') : <span className="text-muted-foreground/50">-</span>}
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={project.startDate ? new Date(project.startDate) : undefined}
                                      onSelect={(date) => updateProject({ ...project, startDate: date?.toISOString() })}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </td>

                              {/* Due Date */}
                              <td className="py-3 px-4 align-middle w-36">
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <div className="cursor-pointer hover:bg-muted/50 px-2 py-1 -mx-2 rounded-md transition-colors text-xs font-semibold text-muted-foreground/90 flex items-center group">
                                      {project.deadline ? format(new Date(project.deadline), 'dd MMM yyyy') : <span className="text-muted-foreground/50">-</span>}
                                    </div>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 z-[60]" align="start">
                                    <Calendar
                                      mode="single"
                                      selected={project.deadline ? new Date(project.deadline) : undefined}
                                      onSelect={(date) => updateProject({ ...project, deadline: date?.toISOString() })}
                                      initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                              </td>

                              {/* Repeats */}
                              <td className="py-3 px-4 align-middle w-32">
                                <div className="px-2 py-1 -mx-2 hover:bg-muted/50 rounded-md transition-colors inline-flex">
                                  <RepeatsPopover 
                                    value={project.repeats} 
                                    onChange={(newVal) => updateProject({ ...project, repeats: typeof newVal === 'string' ? newVal : JSON.stringify(newVal) })}
                                  />
                                </div>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Footer row: Create task */}
                        <tr className="bg-muted/5 hover:bg-muted/10 transition-colors">
                          <td colSpan={8} className="p-0 border-t border-border/20">
                            <div
                              onClick={() => setModalContent("create")}
                              className="px-6 py-3 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                            >
                              <Plus className="h-4 w-4" /> Create task
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
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
      </div>
    </div>
  );
}
