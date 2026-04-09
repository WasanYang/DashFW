'use client';

import { useState } from 'react';
import { mockProjects, mockClients } from '@/lib/data';
import { Project, Client, SubTask } from '@/lib/types';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Clock,
  DollarSign,
  MessageSquare,
  ListTodo,
  PlusCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Accordion } from '@/components/ui/accordion';
import { SubtaskItem } from '@/components/board/subtask-item';

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

export default function ProjectDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const [project, setProject] = useState<Project | undefined>(() => {
    const foundProject = mockProjects.find((p) => p.id === params.id);
    if (foundProject) {
      return {
        ...foundProject,
        deadline: new Date(foundProject.deadline),
      };
    }
    return undefined;
  });

  if (!project) {
    notFound();
  }

  const client: Client | undefined = mockClients.find(
    (c) => c._id === project.clientId,
  );

  const progress = calculateProgress(project.subTasks);

  const handleSubtaskUpdate = (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean,
  ) => {
    setProject((prevProject) => {
      if (!prevProject) return prevProject;
      const newSubTasks = updateSubtaskRecursively(
        prevProject.subTasks || [],
        taskId,
        field,
        value,
      );
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  const addSubtask = () => {
    setProject((prevProject) => {
      if (!prevProject) return prevProject;
      const newSubTask: SubTask = {
        id: `sub-${Date.now()}`,
        text: 'New sub-task',
        description: '',
        completed: false,
        children: [],
      };
      const newSubTasks = [...(prevProject.subTasks || []), newSubTask];
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  const addChildSubtask = (parentId: string) => {
    setProject((prevProject) => {
      if (!prevProject) return prevProject;
      const newSubTask: SubTask = {
        id: `sub-${Date.now()}`,
        text: 'New nested sub-task',
        description: '',
        completed: false,
        children: [],
      };
      const newSubTasks = addChildToSubtaskRecursively(
        prevProject.subTasks || [],
        parentId,
        newSubTask,
      );
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  const removeSubtask = (taskId: string) => {
    setProject((prevProject) => {
      if (!prevProject) return prevProject;
      const newSubTasks = removeSubtaskRecursively(
        prevProject.subTasks || [],
        taskId,
      );
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      <Link
        href='/board'
        className='flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground'
      >
        <ArrowLeft className='h-4 w-4' />
        Back to Board
      </Link>

      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle className='text-3xl'>{project.title}</CardTitle>
            <Badge
              variant={
                project.status === 'Completed' || project.status === 'Paid'
                  ? 'default'
                  : 'secondary'
              }
            >
              {project.status}
            </Badge>
          </div>
          <CardDescription>
            Due by {format(project.deadline, 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
              <DollarSign className='h-6 w-6 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Price</p>
                <p className='font-semibold text-lg'>
                  ${project.gross_price.toFixed(2)}
                </p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
              <MessageSquare className='h-6 w-6 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Revisions</p>
                <p className='font-semibold text-lg'>{project.revisions}</p>
              </div>
            </div>
            <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
              <Clock className='h-6 w-6 text-muted-foreground' />
              <div>
                <p className='text-sm text-muted-foreground'>Deadline</p>
                <p className='font-semibold'>
                  {format(project.deadline, 'MMM d, yyyy')}
                </p>
              </div>
            </div>
          </div>

          <Separator />

          {client && (
            <div>
              <h3 className='text-lg font-semibold mb-2'>Client</h3>
              <div className='flex items-center gap-3'>
                <Avatar>
                  <AvatarImage
                    src={client.avatarUrl}
                    data-ai-hint='portrait person'
                  />
                  <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className='font-medium'>{client.name}</p>
                  <p className='text-sm text-muted-foreground'>
                    {client.email}
                  </p>
                </div>
              </div>
            </div>
          )}

          {project.subTasks !== undefined && (
            <div>
              <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                <ListTodo className='h-5 w-5' />
                Sub-tasks
              </h3>
              <div className='space-y-4'>
                <div className='flex items-center gap-4'>
                  <Progress value={progress} className='h-2' />
                  <span className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
                    {Math.round(progress)}%
                  </span>
                </div>

                <Accordion type='multiple' className='w-full space-y-2'>
                  {[...(project.subTasks || [])]
                    .sort((a, b) => Number(a.completed) - Number(b.completed))
                    .map((subtask) => (
                      <SubtaskItem
                        key={subtask.id}
                        subtask={subtask}
                        onUpdate={handleSubtaskUpdate}
                        onRemove={removeSubtask}
                        onAddChild={addChildSubtask}
                      />
                    ))}
                </Accordion>

                <Button onClick={addSubtask} variant='outline'>
                  <PlusCircle className='mr-2 h-4 w-4' />
                  Add Sub-task
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
