'use client';

import { useState, useMemo, useEffect } from 'react';
import { Project, Client, SubTask } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { EditableQuillField } from '@/components/ui/editable-quill-field';
import { CreateProjectForm } from './create-project-form';
import { ProjectDialogHeader } from './project-dialog-header';
import { ProjectDialogStats } from './project-dialog-stats';
import { ProjectDialogSubtasks } from './project-dialog-subtasks';
import {
  updateSubtaskRecursively,
  removeSubtaskRecursively,
  addChildToSubtaskRecursively,
  calculateProgress,
} from './kanban-utils';
import { fetchJobTypes } from '@/services/jobTypeClient';
import type { JobType } from '@/app/(protect)/job-types/page';

interface ProjectDialogProps {
  modalContent: Project | 'create' | null;
  clients: Client[];
  onClose: () => void;
  onAddProject: (
    data: Omit<Project, 'id' | 'status' | 'revisions' | 'order'>,
  ) => void;
  onUpdateProject: (project: Project) => Promise<void>;
}

export function ProjectDialog({
  modalContent,
  clients,
  onClose,
  onAddProject,
  onUpdateProject,
}: ProjectDialogProps) {
  const [editableProject, setEditableProject] = useState<Project | null>(null);
  const [committedProject, setCommittedProject] = useState<Project | null>(null);
  const [editingField, setEditingField] = useState<string | null>(null);
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);

  useEffect(() => {
    fetchJobTypes().then(setJobTypes);
  }, []);

  useEffect(() => {
    if (modalContent && typeof modalContent === 'object') {
      setEditableProject({ ...modalContent });
      setCommittedProject({ ...modalContent });
      setEditingField(null);
    } else {
      setEditableProject(null);
      setCommittedProject(null);
      setEditingField(null);
    }
  }, [typeof modalContent === 'object' ? modalContent?.id : modalContent]);

  const handleValueChange = (key: keyof Project, value: any) => {
    setEditableProject((prev) => (prev ? { ...prev, [key]: value } : null));
  };

  const handleStartEdit = (field: string) => setEditingField(field);

  const handleSave = async () => {
    if (!editableProject) return;
    await onUpdateProject(editableProject);
    setCommittedProject({ ...editableProject });
    setEditingField(null);
  };

  const handleCancel = () => {
    if (committedProject) {
      setEditableProject({ ...committedProject });
    }
    setEditingField(null);
  };

  const saveImmediately = async (updated: Project) => {
    setEditableProject(updated);
    setCommittedProject({ ...updated });
    await onUpdateProject(updated);
  };

  const handleSubtaskUpdate = (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean,
  ) => {
    if (!editableProject) return;
    const updated = {
      ...editableProject,
      subTasks: updateSubtaskRecursively(
        editableProject.subTasks || [],
        taskId,
        field,
        value,
      ),
    };
    saveImmediately(updated);
  };

  const handleAddSubtask = () => {
    if (!editableProject) return;
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: 'New sub-task',
      description: '',
      completed: false,
    };
    const updated = {
      ...editableProject,
      subTasks: [...(editableProject.subTasks || []), newSubTask],
    };
    saveImmediately(updated);
  };

  const handleAddChildSubtask = (parentId: string) => {
    if (!editableProject) return;
    const newSubTask: SubTask = {
      id: `sub-${Date.now()}`,
      text: 'New nested sub-task',
      description: '',
      completed: false,
    };
    const updated = {
      ...editableProject,
      subTasks: addChildToSubtaskRecursively(
        editableProject.subTasks || [],
        parentId,
        newSubTask,
      ),
    };
    saveImmediately(updated);
  };

  const handleRemoveSubtask = (taskId: string) => {
    if (!editableProject) return;
    const updated = {
      ...editableProject,
      subTasks: removeSubtaskRecursively(editableProject.subTasks || [], taskId),
    };
    saveImmediately(updated);
  };

  const handleDetailsChange = (val: string) => {
    if (!editableProject) return;
    const updated = { ...editableProject, details: val };
    saveImmediately(updated);
  };

  const selectedClient = useMemo(() => {
    if (!committedProject) return undefined;
    return clients.find((c) => c._id === committedProject.clientId);
  }, [committedProject, clients]);

  const progress = useMemo(
    () => calculateProgress(committedProject?.subTasks),
    [committedProject],
  );

  return (
    <Dialog open={!!modalContent} onOpenChange={(isOpen) => !isOpen && onClose()}>
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
              onSubmit={onAddProject}
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
          committedProject &&
          editableProject && (
            <>
              <ProjectDialogHeader
                project={committedProject}
                editableProject={editableProject}
                selectedClient={selectedClient}
                jobTypes={jobTypes}
                editingField={editingField}
                onStartEdit={handleStartEdit}
                onSave={handleSave}
                onCancel={handleCancel}
                onValueChange={handleValueChange}
              />

              <ScrollArea className='flex-grow pr-6 -mr-6'>
                <div className='space-y-6 pb-6'>
                  <ProjectDialogStats
                    project={committedProject}
                    editableProject={editableProject}
                    editingField={editingField}
                    onStartEdit={handleStartEdit}
                    onSave={handleSave}
                    onCancel={handleCancel}
                    onValueChange={handleValueChange}
                  />

                  <Separator />

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
                            onChange={handleDetailsChange}
                            placeholder='Enter project details, user info, requirements, etc.'
                          />
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <ProjectDialogSubtasks
                    project={committedProject}
                    progress={progress}
                    onUpdateSubtask={handleSubtaskUpdate}
                    onRemoveSubtask={handleRemoveSubtask}
                    onAddChildSubtask={handleAddChildSubtask}
                    onAddSubtask={handleAddSubtask}
                  />
                </div>
              </ScrollArea>
            </>
          )
        )}
      </DialogContent>
    </Dialog>
  );
}
