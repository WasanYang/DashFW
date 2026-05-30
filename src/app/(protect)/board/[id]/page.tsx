'use client';

import { useState } from 'react';
import { Project, Client, SubTask } from '@/lib/types';
import { useParams, useRouter } from 'next/navigation';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  ListTodo,
  PlusCircle,
  Sparkles,
  Loader2,
  Share2,
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Accordion } from '@/components/ui/accordion';
import { SubtaskItem } from '@/components/board/subtask-item';
import { formatNumber } from '@/lib/number-format';
import { useGetProjectsQuery, useUpdateProjectMutation } from '@/services/projectApi';
import { useGetClientsQuery } from '@/services/clientApi';
import { useToast } from '@/hooks/use-toast';
import { createAiChecklist } from '@/ai/flows/ai-checklist-creator-flow';

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

export default function ProjectDetailsPage() {
  const { data: projects = [], isLoading: loadingProjects } = useGetProjectsQuery();
  const { data: clients = [], isLoading: loadingClients } = useGetClientsQuery();
  const [updateProject] = useUpdateProjectMutation();
  const { toast } = useToast();
  const params = useParams();
  const id = params?.id as string;

  // AI checklist state
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const project = projects.find((p) => p.id === id);

  if (loadingProjects || loadingClients) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!project) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">ไม่พบโครงการนี้ในระบบ</p>
        <Link href="/board">
          <Button variant="outline">กลับหน้าบอร์ด</Button>
        </Link>
      </div>
    );
  }

  const client: Client | undefined = clients.find(
    (c) => c._id === project.clientId,
  );

  const progress = calculateProgress(project.subTasks);

  const deadlineDate = project.deadline ? new Date(project.deadline) : new Date();

  const handleSubtaskUpdate = async (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean,
  ) => {
    try {
      const newSubTasks = updateSubtaskRecursively(
        project.subTasks || [],
        taskId,
        field,
        value,
      );
      await updateProject({ id: project.id, data: { subTasks: newSubTasks } }).unwrap();
    } catch (err) {
      console.error(err);
      toast({
        title: 'อัปเดตงานย่อยไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const addSubtask = async () => {
    try {
      const newSubTask: SubTask = {
        id: `sub-${Date.now()}`,
        text: 'New sub-task',
        description: '',
        completed: false,
        children: [],
      };
      const newSubTasks = [...(project.subTasks || []), newSubTask];
      await updateProject({ id: project.id, data: { subTasks: newSubTasks } }).unwrap();
    } catch (err) {
      console.error(err);
      toast({
        title: 'เพิ่มงานย่อยไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const addChildSubtask = async (parentId: string) => {
    try {
      const newSubTask: SubTask = {
        id: `sub-${Date.now()}`,
        text: 'New nested sub-task',
        description: '',
        completed: false,
        children: [],
      };
      const newSubTasks = addChildToSubtaskRecursively(
        project.subTasks || [],
        parentId,
        newSubTask,
      );
      await updateProject({ id: project.id, data: { subTasks: newSubTasks } }).unwrap();
    } catch (err) {
      console.error(err);
      toast({
        title: 'เพิ่มงานย่อยย่อยไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const removeSubtask = async (taskId: string) => {
    try {
      const newSubTasks = removeSubtaskRecursively(
        project.subTasks || [],
        taskId,
      );
      await updateProject({ id: project.id, data: { subTasks: newSubTasks } }).unwrap();
    } catch (err) {
      console.error(err);
      toast({
        title: 'ลบงานย่อยไม่สำเร็จ',
        description: 'กรุณาลองใหม่อีกครั้ง',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAiSubtasks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiPrompt.trim()) return;

    setIsGeneratingAi(true);
    try {
      const result = await createAiChecklist({ description: aiPrompt.trim() });
      
      const newAiSubTasks: SubTask[] = result.checklistItems.map((itemText, idx) => ({
        id: `sub-ai-${Date.now()}-${idx}`,
        text: itemText,
        description: 'สร้างโดยระบบผู้ช่วย AI',
        completed: false,
        children: [],
      }));

      const newSubTasks = [...(project.subTasks || []), ...newAiSubTasks];
      await updateProject({ id: project.id, data: { subTasks: newSubTasks } }).unwrap();
      setAiPrompt('');
      toast({
        title: 'สำเร็จ!',
        description: 'เพิ่มรายการงานย่อยจาก AI เรียบร้อยแล้ว',
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
            <div className="flex items-center gap-3">
              <CardTitle className='text-3xl'>{project.title}</CardTitle>
              <Button
                variant="outline"
                size="sm"
                className="h-8 rounded-lg text-xs gap-1"
                onClick={() => {
                  const shareUrl = `${window.location.origin}/share/project/${project.id}`;
                  navigator.clipboard.writeText(shareUrl);
                  toast({
                    title: 'คัดลอกลิงก์แล้ว!',
                    description: 'คุณสามารถส่งลิงก์นี้ให้ลูกค้าเพื่อดูสถานะความคืบหน้าได้ทันที',
                  });
                }}
              >
                <Share2 className="w-3.5 h-3.5" /> Share Client Link
              </Button>
            </div>
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
            Due by {format(deadlineDate, 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
              <div>
                <p className='text-sm text-muted-foreground'>Price</p>
                <p className='font-semibold text-lg'>
                  ฿{formatNumber(project.gross_price)}
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
                  {format(deadlineDate, 'MMM d, yyyy')}
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

          <Separator />

          {project.subTasks !== undefined && (
            <div className="space-y-6">
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

              <Separator />

              {/* AI Subtasks Generation Section */}
              <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-3">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                  <h4 className="font-semibold text-primary">ร่างรายการงานย่อยด้วย AI (AI Sub-tasks Generator)</h4>
                </div>
                <p className="text-sm text-muted-foreground">
                  พิมพ์คำอธิบายรายละเอียดบริการของงานนี้ เพื่อให้ AI แนะนำรายการสิ่งที่ต้องทำในการจัดทำโครงการ
                </p>
                <form onSubmit={handleGenerateAiSubtasks} className="flex gap-2">
                  <Input
                    className="bg-background"
                    placeholder="เช่น ออกแบบหน้าจอนระบบสั่งอาหาร, ลงทะเบียน Domain & Host พร้อมเช็ค SSL"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    disabled={isGeneratingAi}
                  />
                  <Button type="submit" disabled={isGeneratingAi || !aiPrompt.trim()}>
                    {isGeneratingAi ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    สร้างโดย AI
                  </Button>
                </form>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
