'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ExternalLink,
  Pencil,
  Plus,
  Phone,
  Globe,
  MessageCircle,
  Instagram,
  User,
  Hash,
  ListTodo,
  DollarSign,
  Clock,
  MessageSquare,
} from 'lucide-react';
import { Client, Project, Social, SubTask } from '@/lib/types';
import {
  useGetClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
} from '@/services/clientApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ClientForm, ClientFormValues } from './client-form';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { cn } from '@/lib/utils';

interface ClientListProps {
  projects: Project[];
}

const socialIcons: { [key: string]: React.ElementType } = {
  Phone: Phone,
  Website: Globe,
  Line: MessageCircle,
  Instagram: Instagram,
  Facebook: User,
  Other: Hash,
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

export function ClientList({ projects }: ClientListProps) {
  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
  } = useGetClientsQuery();
  const [addClient, { isLoading: isAddingClient }] = useAddClientMutation();
  const [updateClient, { isLoading: isUpdatingClient }] =
    useUpdateClientMutation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [projectModal, setProjectModal] = useState<Project | null>(null);

  // sync selectedClient with clients
  useEffect(() => {
    setSelectedClient((prev) => {
      if (prev && clients.some((c) => c._id === prev._id)) {
        return clients.find((c) => c._id === prev._id) || null;
      }
      if (!prev && clients.length > 0) {
        return clients[0];
      }
      return prev;
    });
  }, [clients]);

  const clientProjects = projects.filter(
    (p) => p.clientId === selectedClient?._id,
  );

  const handleAddClient = async (values: ClientFormValues) => {
    await addClient({
      ...values,
      avatarUrl: values.avatarUrl?.trim() || undefined,
      socials: values.socials?.map((s, i) => ({
        ...s,
        id: s.id ?? `soc-${Date.now()}-${i}`, // ให้ id เป็น string เสมอ
      })),
    });
    // get the newly created client from the API response and set it as selected
    await refetch();
    setIsCreateOpen(false);
  };

  const handleEditClient = async (values: ClientFormValues) => {
    console.log('handleEditClient', editingClient);
    if (!editingClient || !editingClient._id) return;
    await updateClient({
      _id: editingClient._id,
      data: {
        ...values,
        avatarUrl: values.avatarUrl?.trim() || undefined,
        socials: values.socials?.map((s) => ({
          ...s,
          id: s.id ?? '', // ให้ id เป็น string เสมอ
        })),
      },
    });
    await refetch();
    setEditingClient(null);
    setIsCreateOpen(false);
  };

  const renderSocialLink = (social: Social, idx: number) => {
    const Icon = socialIcons[social.platform] || Hash;
    return (
      <div
        key={social.platform + '-' + idx}
        className='flex items-center gap-3'
      >
        <Icon className='h-5 w-5 text-muted-foreground' />
        <div className='flex-1'>
          <p className='text-sm font-medium'>{social.platform}</p>
          <p className='text-sm text-muted-foreground truncate'>
            {social.value}
          </p>
        </div>
      </div>
    );
  };

  const projectModalProgress = useMemo(() => {
    if (!projectModal) return 0;
    return calculateProgress(projectModal.subTasks);
  }, [projectModal]);

  const renderSubtasksReadOnly = (tasks: SubTask[], level = 0) => (
    <div className='space-y-1'>
      {tasks.map((subtask) => (
        <div key={subtask.id} style={{ paddingLeft: `${level * 1.5}rem` }}>
          <div className='flex items-center gap-2'>
            <Checkbox
              id={`readonly-subtask-${subtask.id}`}
              checked={subtask.completed}
              disabled
            />
            <Label
              htmlFor={`readonly-subtask-${subtask.id}`}
              className={cn(
                'text-sm',
                subtask.completed && 'line-through text-muted-foreground',
              )}
            >
              {subtask.text}
            </Label>
          </div>
          {subtask.children &&
            subtask.children.length > 0 &&
            renderSubtasksReadOnly(subtask.children, level + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <>
      <div className='grid gap-8 lg:grid-cols-3'>
        <div className='lg:col-span-1'>
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
              <CardTitle>Clients</CardTitle>
              <Button size='sm' onClick={() => setIsCreateOpen(true)}>
                <Plus className='mr-1.5 h-4 w-4' />
                Add Client
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className='text-center'>Projects</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow key='loading'>
                      <TableCell
                        colSpan={3}
                        className='text-center text-muted-foreground'
                      >
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : error ? (
                    <TableRow key='error'>
                      <TableCell
                        colSpan={3}
                        className='text-center text-destructive'
                      >
                        Error loading clients
                      </TableCell>
                    </TableRow>
                  ) : clients.length === 0 ? (
                    <TableRow key='no-clients'>
                      <TableCell
                        colSpan={3}
                        className='text-center text-muted-foreground'
                      >
                        No clients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => {
                      const completedProjectsCount = projects.filter(
                        (p) =>
                          p.clientId === client._id &&
                          (p.status === 'Completed' || p.status === 'Paid'),
                      ).length;

                      return (
                        <TableRow
                          key={client._id}
                          onClick={() => setSelectedClient(client)}
                          className={`cursor-pointer ${
                            selectedClient?._id === client._id
                              ? 'bg-muted/50'
                              : ''
                          }`}
                        >
                          <TableCell className='flex items-center gap-3 font-medium'>
                            <Avatar className='h-8 w-8'>
                              <AvatarImage
                                src={client.avatarUrl}
                                alt={client.name}
                                data-ai-hint='portrait person'
                              />
                              <AvatarFallback>
                                {client.name.charAt(0)}
                              </AvatarFallback>
                            </Avatar>
                            <span className='truncate'>{client.name}</span>
                          </TableCell>
                          <TableCell className='text-center font-medium'>
                            {completedProjectsCount}
                          </TableCell>
                          <TableCell>
                            <div className='flex items-center justify-end gap-1'>
                              <Button
                                variant='ghost'
                                size='icon'
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingClient(client);
                                }}
                                aria-label='Edit client'
                              >
                                <Pencil className='h-4 w-4' />
                              </Button>
                              {client.fastwork_link && (
                                <Button variant='ghost' size='icon' asChild>
                                  <a
                                    href={client.fastwork_link}
                                    target='_blank'
                                    rel='noopener noreferrer'
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label='Fastwork profile'
                                  >
                                    <ExternalLink className='h-4 w-4' />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className='lg:col-span-2'>
          {selectedClient ? (
            <Card>
              <CardHeader>
                <div className='flex items-start justify-between gap-4'>
                  <div className='flex items-center gap-4'>
                    <Avatar className='h-16 w-16'>
                      <AvatarImage
                        src={selectedClient.avatarUrl}
                        alt={selectedClient.name}
                        data-ai-hint='portrait person'
                      />
                      <AvatarFallback className='text-2xl'>
                        {selectedClient.name.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className='text-2xl'>
                        {selectedClient.name}
                      </CardTitle>
                      <p className='mt-1 text-muted-foreground'>
                        {selectedClient.email}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant='outline'
                    size='sm'
                    onClick={() => setEditingClient(selectedClient)}
                  >
                    Edit Details
                  </Button>
                </div>
              </CardHeader>
              <CardContent className='space-y-6'>
                <Separator />
                <div className='grid gap-6 md:grid-cols-2'>
                  <div>
                    <h4 className='mb-4 text-lg font-semibold'>
                      Contact & Socials
                    </h4>
                    <div className='space-y-4'>
                      {selectedClient.socials &&
                      selectedClient.socials.length > 0 ? (
                        selectedClient.socials.map(renderSocialLink)
                      ) : (
                        <p className='text-sm text-muted-foreground'>
                          No social links added.
                        </p>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className='mb-4 text-lg font-semibold'>Notes</h4>
                    {selectedClient.notes ? (
                      <p className='text-sm text-muted-foreground whitespace-pre-wrap'>
                        {selectedClient.notes}
                      </p>
                    ) : (
                      <p className='text-sm text-muted-foreground'>
                        No notes for this client.
                      </p>
                    )}
                  </div>
                </div>

                <Separator />

                <div>
                  <h4 className='mb-4 text-lg font-semibold'>
                    Client Projects
                  </h4>
                  <div className='grid gap-4 sm:grid-cols-2'>
                    {clientProjects.length > 0 ? (
                      clientProjects.map((project) => (
                        <Card key={project.id}>
                          <CardHeader>
                            <button
                              onClick={() => setProjectModal(project)}
                              className='text-left hover:underline w-full'
                            >
                              <CardTitle className='text-base'>
                                {project.title}
                              </CardTitle>
                            </button>
                          </CardHeader>
                          <CardContent className='space-y-2'>
                            <div className='flex items-center justify-between text-sm'>
                              <Badge
                                variant={
                                  project.status === 'Completed' ||
                                  project.status === 'Paid'
                                    ? 'default'
                                    : 'secondary'
                                }
                              >
                                {project.status}
                              </Badge>
                              <span className='font-semibold'>
                                ${project.gross_price.toFixed(2)}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className='text-sm text-muted-foreground col-span-2'>
                        No projects found for this client.
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className='flex items-center justify-center h-96'>
              <p className='text-muted-foreground'>
                Select a client to see details
              </p>
            </Card>
          )}
        </div>
      </div>

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className='sm:max-w-[625px]'>
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>
              Fill in the form below to add a new client to your CRM.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className='max-h-[70vh] pr-6 -mr-6'>
            <ClientForm
              mode='create'
              onSubmit={handleAddClient}
              submitLabel='Create Client'
              onCancel={() => setIsCreateOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
      >
        <DialogContent className='sm:max-w-[625px]'>
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>
              Update the details for {editingClient?.name}.
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className='max-h-[70vh] pr-6 -mr-6'>
            <ClientForm
              mode='edit'
              defaultValues={editingClient || undefined}
              onSubmit={handleEditClient}
              submitLabel='Save Changes'
              onCancel={() => setEditingClient(null)}
              isLoading={isUpdatingClient || isAddingClient}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog
        open={!!projectModal}
        onOpenChange={(isOpen) => !isOpen && setProjectModal(null)}
      >
        <DialogContent className='sm:max-w-2xl h-[90vh] flex flex-col'>
          {projectModal && (
            <>
              <DialogHeader>
                <DialogTitle className='text-2xl'>
                  {projectModal.title}
                </DialogTitle>
                <DialogDescription>
                  In status{' '}
                  <span className='font-semibold'>{projectModal.status}</span>{' '}
                  &bull; Due by {format(new Date(projectModal.deadline), 'PPP')}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className='flex-grow pr-6 -mr-6'>
                <div className='space-y-6 pb-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                      <DollarSign className='h-6 w-6 text-muted-foreground' />
                      <div>
                        <p className='text-sm text-muted-foreground'>Price</p>
                        <p className='font-semibold text-lg'>
                          ${projectModal.gross_price.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                      <MessageSquare className='h-6 w-6 text-muted-foreground' />
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Revisions
                        </p>
                        <p className='font-semibold text-lg'>
                          {projectModal.revisions}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                      <Clock className='h-6 w-6 text-muted-foreground' />
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Deadline
                        </p>
                        <p className='font-semibold'>
                          {format(
                            new Date(projectModal.deadline),
                            'MMM d, yyyy',
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {projectModal.subTasks &&
                    projectModal.subTasks.length > 0 && (
                      <div>
                        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                          <ListTodo className='h-5 w-5' />
                          Sub-tasks
                        </h3>
                        <div className='space-y-4'>
                          <div className='flex items-center gap-4'>
                            <Progress
                              value={projectModalProgress}
                              className='h-2'
                            />
                            <span className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
                              {Math.round(projectModalProgress)}%
                            </span>
                          </div>

                          {renderSubtasksReadOnly(projectModal.subTasks)}
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
