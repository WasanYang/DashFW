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
  Trash2,
  PlusCircle,
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
import { Checkbox } from '../ui/checkbox';
import { cn } from '@/lib/utils';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

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

export function KanbanBoard({
  initialProjects,
  clients,
  translations,
}: KanbanBoardProps) {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [isCreateDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

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
    setProjects(
      projects.map((p) => (p.id === updatedProject.id ? updatedProject : p))
    );
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

  const handleSubtaskUpdateInModal = (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean
  ) => {
    if (!selectedProject) return;
    const newSubTasks = selectedProject.subTasks?.map((st) =>
      st.id === taskId ? { ...st, [field]: value } : st
    );
    const updatedProject = { ...selectedProject, subTasks: newSubTasks };
    updateProject(updatedProject);
  };

  const addSubtaskInModal = () => {
    if (!selectedProject) return;
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: 'New sub-task',
      description: '',
      completed: false,
    };
    const newSubTasks = [...(selectedProject.subTasks || []), newSubTask];
    const updatedProject = { ...selectedProject, subTasks: newSubTasks };
    updateProject(updatedProject);
  };

  const removeSubtaskInModal = (taskId: string) => {
    if (!selectedProject) return;
    const newSubTasks = selectedProject.subTasks?.filter(
      (st) => st.id !== taskId
    );
    const updatedProject = { ...selectedProject, subTasks: newSubTasks };
    updateProject(updatedProject);
  };

  const selectedClient = useMemo(() => {
    if (!selectedProject) return undefined;
    return clients.find((c) => c.id === selectedProject.clientId);
  }, [selectedProject, clients]);

  const modalSubTaskProgress = useMemo(() => {
    if (!selectedProject?.subTasks || selectedProject.subTasks.length === 0) {
      return 0;
    }
    const completed = selectedProject.subTasks.filter(
      (st) => st.completed
    ).length;
    return (completed / selectedProject.subTasks.length) * 100;
  }, [selectedProject?.subTasks]);

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
        onOpenChange={(isOpen) => !isOpen && setSelectedProject(null)}
      >
        <DialogContent className="sm:max-w-4xl h-[90vh] flex flex-col">
          {selectedProject && (
            <>
              <DialogHeader>
                <DialogTitle>
                  <Link
                    href={`/board/${selectedProject.id}`}
                    className="hover:underline"
                  >
                    {selectedProject.title}
                  </Link>
                </DialogTitle>
                <DialogDescription>
                  In status{' '}
                  <span className="font-semibold">{selectedProject.status}</span>{' '}
                  &bull; Due by{' '}
                  {format(new Date(selectedProject.deadline), 'PPP')}
                </DialogDescription>
              </DialogHeader>

              <ScrollArea className="flex-grow pr-6 -mr-6">
                <div className="space-y-6 pb-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                      <DollarSign className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold text-lg">
                          ${selectedProject.gross_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                      <MessageSquare className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Revisions
                        </p>
                        <p className="font-semibold text-lg">
                          {selectedProject.revisions}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                      <Clock className="h-6 w-6 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Deadline
                        </p>
                        <p className="font-semibold">
                          {format(
                            new Date(selectedProject.deadline),
                            'MMM d, yyyy'
                          )}
                        </p>
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
                            <AccordionItem
                              value={subtask.id}
                              key={subtask.id}
                              className="border rounded-md px-4 bg-muted/50"
                            >
                              <div className="flex items-center">
                                <AccordionTrigger className="flex-grow py-3">
                                  <div className="flex items-center gap-3">
                                    <Checkbox
                                      id={`modal-subtask-check-${subtask.id}`}
                                      checked={subtask.completed}
                                      onClick={(e) => e.stopPropagation()} // Prevent trigger from firing
                                      onCheckedChange={(checked) =>
                                        handleSubtaskUpdateInModal(
                                          subtask.id,
                                          'completed',
                                          !!checked
                                        )
                                      }
                                    />
                                    <Label
                                      htmlFor={`modal-subtask-check-${subtask.id}`}
                                      className={cn(
                                        'text-sm',
                                        subtask.completed
                                          ? 'line-through text-muted-foreground'
                                          : ''
                                      )}
                                    >
                                      {subtask.text}
                                    </Label>
                                  </div>
                                </AccordionTrigger>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  onClick={() => removeSubtaskInModal(subtask.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                              <AccordionContent className="pb-4">
                                <div className="space-y-3 pl-8">
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`modal-subtask-text-${subtask.id}`}
                                    >
                                      Task
                                    </Label>
                                    <Input
                                      id={`modal-subtask-text-${subtask.id}`}
                                      value={subtask.text}
                                      onChange={(e) =>
                                        handleSubtaskUpdateInModal(
                                          subtask.id,
                                          'text',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <Label
                                      htmlFor={`modal-subtask-desc-${subtask.id}`}
                                    >
                                      Description
                                    </Label>
                                    <Textarea
                                      id={`modal-subtask-desc-${subtask.id}`}
                                      placeholder="Add more details..."
                                      value={subtask.description || ''}
                                      onChange={(e) =>
                                        handleSubtaskUpdateInModal(
                                          subtask.id,
                                          'description',
                                          e.target.value
                                        )
                                      }
                                    />
                                  </div>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
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
            onCardClick={(project) => setSelectedProject(project)}
          />
        ))}
      </div>
    </>
  );
}
