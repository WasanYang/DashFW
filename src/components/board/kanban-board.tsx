'use client';

import { useState, useMemo, DragEvent } from 'react';
import Link from 'next/link';
import { Project, ProjectStatus, Client, SubTask } from '@/lib/types';
import { KanbanColumn } from './kanban-column';
import { Button } from '@/components/ui/button';
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
} from '../ui/accordion';
import { SubtaskItem } from './subtask-item';
import { Input } from '../ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { Calendar } from '../ui/calendar';
import { cn } from '@/lib/utils';

interface KanbanBoardProps {
  initialProjects: Project[];
  clients: Client[];
  translations: Record<string, string>;
}

const columns: ProjectStatus[] = [
  'Backlog',
  'In Progress',
  'Review',
  'Completed',
  'Paid',
];

const updateSubtaskRecursively = (tasks: SubTask[], taskId: string, field: 'text' | 'description' | 'completed', value: string | boolean): SubTask[] => {
  return tasks.map(task => {
      if (task.id === taskId) {
          return { ...task, [field]: value };
      }
      if (task.children) {
          return { ...task, children: updateSubtaskRecursively(task.children, taskId, field, value) };
      }
      return task;
  });
};

const removeSubtaskRecursively = (tasks: SubTask[], taskId: string): SubTask[] => {
  let newTasks: SubTask[] = [];
  for (const task of tasks) {
      if (task.id === taskId) {
          continue;
      }
      if (task.children) {
          task.children = removeSubtaskRecursively(task.children, taskId);
      }
      newTasks.push(task);
  }
  return newTasks;
}

const addChildToSubtaskRecursively = (tasks: SubTask[], parentId: string, newSubtask: SubTask): SubTask[] => {
  return tasks.map(task => {
      if (task.id === parentId) {
          const children = task.children ? [...task.children, newSubtask] : [newSubtask];
          return { ...task, children };
      }
      if (task.children) {
          return { ...task, children: addChildToSubtaskRecursively(task.children, parentId, newSubtask) };
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
        tasks.forEach(task => {
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
  translations,
}: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingDetails, setIsEditingDetails] = useState(false);
  const [editableProject, setEditableProject] = useState<Project | null>(null);


  const groupedProjects = useMemo(() => {
    return columns.reduce((acc, status) => {
      acc[status] = projects.filter((p) => p.status === status);
      return acc;
    }, {} as Record<ProjectStatus, Project[]>);
  }, [projects]);

  const handleDragStart = (e: DragEvent<HTMLDivElement>, projectId: string) => {
    e.dataTransfer.setData('projectId', projectId);
  };

  const handleDrop = (
    e: DragEvent<HTMLDivElement>,
    newStatus: ProjectStatus
  ) => {
    e.preventDefault();
    const projectId = e.dataTransfer.getData('projectId');

    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projectId ? { ...p, status: newStatus } : p
      )
    );
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const updateProject = (updatedProject: Project) => {
    const newProjects = projects.map((p) => (p.id === updatedProject.id ? updatedProject : p));
    setProjects(newProjects);
    if (selectedProject && selectedProject.id === updatedProject.id) {
      setSelectedProject(updatedProject);
    }
  };

  const addProject = (
    newProjectData: Omit<Project, 'id' | 'status' | 'revisions'>
  ) => {
    const newProject: Project = {
      ...newProjectData,
      id: `proj-${Date.now()}`,
      status: 'Backlog',
      revisions: 0,
    };
    setProjects((prevProjects) => [newProject, ...prevProjects]);
    setCreateDialogOpen(false);
  };

  const handleCardClick = (project: Project) => {
    setSelectedProject(project);
    setEditableProject({ ...project });
    setIsEditingTitle(false);
    setIsEditingDetails(false);
  };
  
  const handleCloseModal = () => {
    setSelectedProject(null);
    setEditableProject(null);
    setIsEditingTitle(false);
    setIsEditingDetails(false);
  };

  const handleValueChange = (key: keyof Project, value: any) => {
    if(editableProject) {
        setEditableProject({...editableProject, [key]: value});
    }
  };

  const handleSaveTitle = () => {
      if(editableProject) {
          updateProject(editableProject);
          setSelectedProject(editableProject);
      }
      setIsEditingTitle(false);
  };
  
  const handleCancelTitle = () => {
      if(selectedProject) {
          setEditableProject({...selectedProject});
      }
      setIsEditingTitle(false);
  };

  const handleSaveDetails = () => {
      if(editableProject) {
          updateProject(editableProject);
          setSelectedProject(editableProject);
      }
      setIsEditingDetails(false);
  };

  const handleCancelDetails = () => {
      if(selectedProject) {
          setEditableProject({...selectedProject});
      }
      setIsEditingDetails(false);
  };

  const handleSubtaskUpdateInModal = (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean
  ) => {
    if (!editableProject) return;
    const newSubTasks = updateSubtaskRecursively(editableProject.subTasks || [], taskId, field, value);
    setEditableProject({ ...editableProject, subTasks: newSubTasks });
    updateProject({ ...editableProject, subTasks: newSubTasks });
    setSelectedProject({ ...editableProject, subTasks: newSubTasks });
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
    setEditableProject({ ...editableProject, subTasks: newSubTasks });
    updateProject({ ...editableProject, subTasks: newSubTasks });
    setSelectedProject({ ...editableProject, subTasks: newSubTasks });
  };

  const addChildSubtaskInModal = (parentId: string) => {
    if (!editableProject) return;
    const newSubTask: SubTask = {
        id: `sub-${Date.now()}`,
        text: 'New nested sub-task',
        description: '',
        completed: false,
    };
    const newSubTasks = addChildToSubtaskRecursively(editableProject.subTasks || [], parentId, newSubTask);
    setEditableProject({ ...editableProject, subTasks: newSubTasks });
    updateProject({ ...editableProject, subTasks: newSubTasks });
    setSelectedProject({ ...editableProject, subTasks: newSubTasks });
  };

  const removeSubtaskInModal = (taskId: string) => {
    if (!editableProject) return;
    const newSubTasks = removeSubtaskRecursively(
      editableProject.subTasks || [],
      taskId
    );
    setEditableProject({ ...editableProject, subTasks: newSubTasks });
    updateProject({ ...editableProject, subTasks: newSubTasks });
    setSelectedProject({ ...editableProject, subTasks: newSubTasks });
  };

  const selectedClient = useMemo(() => {
    if (!selectedProject) return undefined;
    return clients.find((c) => c.id === selectedProject.clientId);
  }, [selectedProject, clients]);

  const modalSubTaskProgress = useMemo(() => {
    if (!selectedProject) return 0;
    return calculateProgress(selectedProject.subTasks);
  }, [selectedProject]);

  return (
    <>
      <div className="flex-shrink-0 flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">{translations.pageTitle}</h1>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          {translations.newProject}
        </Button>
      </div>

      <Dialog open={isCreateDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{translations.createNewProjectTitle}</DialogTitle>
            <DialogDescription>
              {translations.createNewProjectDescription}
            </DialogDescription>
          </DialogHeader>
          <CreateProjectForm
            clients={clients}
            onSubmit={addProject}
            translations={translations}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!selectedProject}
        onOpenChange={(isOpen) => !isOpen && handleCloseModal()}
      >
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          {selectedProject && editableProject && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2 pr-12">
                    {!isEditingTitle ? (
                        <>
                            <DialogTitle className='flex-grow text-2xl'>
                                <Link href={`/board/${selectedProject.id}`} className="hover:underline">
                                    {selectedProject.title}
                                </Link>
                            </DialogTitle>
                            <Button variant="ghost" size="icon" onClick={() => setIsEditingTitle(true)}>
                                <Pencil className="h-5 w-5" />
                            </Button>
                        </>
                    ) : (
                        <>
                            <Input 
                                value={editableProject.title} 
                                onChange={(e) => handleValueChange('title', e.target.value)}
                                className="text-2xl font-semibold flex-grow h-auto py-1"
                                autoFocus
                            />
                            <Button variant="ghost" size="icon" onClick={handleSaveTitle}>
                                <Check className="h-5 w-5" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={handleCancelTitle}>
                                <X className="h-5 w-5" />
                            </Button>
                        </>
                    )}
                </div>
                <DialogDescription>
                  In status{' '}
                  <span className="font-semibold">{selectedProject.status}</span>{' '}
                  &bull; Due by{' '}
                  {format(new Date(selectedProject.deadline), 'PPP')}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="space-y-6 pb-6">
                  
                  <div className='space-y-2'>
                    <div className='flex justify-end items-center -mb-2'>
                      {!isEditingDetails ? (
                          <Button variant="ghost" size="icon" onClick={() => setIsEditingDetails(true)}>
                              <Pencil className="h-4 w-4" />
                          </Button>
                      ) : (
                          <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon" onClick={handleSaveDetails}>
                                  <Check className="h-5 w-5" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={handleCancelDetails}>
                                  <X className="h-5 w-5" />
                              </Button>
                          </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                        <DollarSign className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Price</p>
                          {isEditingDetails ? (
                            <Input type="number" value={editableProject.gross_price} onChange={(e) => handleValueChange('gross_price', Number(e.target.value))} className="font-semibold text-lg p-1 h-auto border-0 bg-transparent focus-visible:ring-0 focus-visible:bg-white -ml-1" />
                          ) : (
                            <p className="font-semibold text-lg">
                              ${selectedProject.gross_price.toFixed(2)}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                        <MessageSquare className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Revisions</p>
                          {isEditingDetails ? (
                             <Input type="number" value={editableProject.revisions} onChange={(e) => handleValueChange('revisions', Number(e.target.value))} className="font-semibold text-lg p-1 h-auto border-0 bg-transparent focus-visible:ring-0 focus-visible:bg-white -ml-1" />
                          ) : (
                            <p className="font-semibold text-lg">
                              {selectedProject.revisions}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                        <Clock className="h-6 w-6 text-muted-foreground" />
                        <div>
                          <p className="text-sm text-muted-foreground">Deadline</p>
                          {isEditingDetails ? (
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                            "pl-3 text-left font-normal h-auto py-1",
                                            !editableProject.deadline && "text-muted-foreground"
                                        )}
                                    >
                                        {editableProject.deadline ? (
                                            format(new Date(editableProject.deadline), "PPP")
                                        ) : (
                                            <span>Pick a date</span>
                                        )}
                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={new Date(editableProject.deadline)}
                                        onSelect={(date) => handleValueChange('deadline', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                          ) : (
                            <p className="font-semibold">
                              {format(new Date(selectedProject.deadline), 'MMM d, yyyy')}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>


                  <Separator />

                  {selectedClient && (
                    <div>
                      <h3 className="text-lg font-semibold mb-2">Client</h3>
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarImage
                            src={selectedClient.avatarUrl}
                            data-ai-hint="portrait person"
                          />
                          <AvatarFallback>
                            {selectedClient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{selectedClient.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {selectedClient.email}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProject.subTasks !== undefined && (
                    <div>
                      <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                        <ListTodo className="h-5 w-5" />
                        Sub-tasks
                      </h3>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Progress value={modalSubTaskProgress} className="h-2" />
                          <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">
                            {Math.round(modalSubTaskProgress)}%
                          </span>
                        </div>

                        <Accordion type="multiple" className="w-full space-y-2">
                          {selectedProject.subTasks.map((subtask) => (
                            <SubtaskItem
                              key={subtask.id}
                              subtask={subtask}
                              onUpdate={handleSubtaskUpdateInModal}
                              onRemove={removeSubtaskInModal}
                              onAddChild={addChildSubtaskInModal}
                              idPrefix="modal-"
                            />
                          ))}
                        </Accordion>

                        <Button
                          onClick={addSubtaskInModal}
                          variant="outline"
                        >
                          <PlusCircle className="mr-2 h-4 w-4" />
                          Add Sub-task
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="flex flex-grow w-full gap-4 overflow-x-auto pb-4">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            projects={groupedProjects[status]}
            onDrop={handleDrop}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            updateProject={updateProject}
            onCardClick={handleCardClick}
          />
        ))}
      </div>
    </>
  );
}
