'use client';

import { useState } from 'react';
import { mockProjects, mockClients } from '@/lib/data';
import { Project, Client, SubTask } from '@/lib/types';
import { notFound } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Clock, DollarSign, MessageSquare, ListTodo, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ProjectDetailsPage({ params }: { params: { id: string } }) {
  const [project, setProject] = useState<Project | undefined>(() => mockProjects.find(p => p.id === params.id));

  if (!project) {
    notFound();
  }

  const client: Client | undefined = mockClients.find(c => c.id === project.clientId);

  const subTaskProgress = () => {
    if (!project.subTasks || project.subTasks.length === 0) {
      return 0;
    }
    const completed = project.subTasks.filter(st => st.completed).length;
    return (completed / project.subTasks.length) * 100;
  };
  const progress = subTaskProgress();

  const handleSubtaskUpdate = (taskId: string, field: 'text' | 'description' | 'completed', value: string | boolean) => {
    setProject(prevProject => {
      if (!prevProject) return prevProject;
      const newSubTasks = prevProject.subTasks?.map(st => 
        st.id === taskId ? { ...st, [field]: value } : st
      );
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  const addSubtask = () => {
    setProject(prevProject => {
      if (!prevProject) return prevProject;
      const newSubTask: SubTask = {
        id: `sub-${Date.now()}`,
        text: 'New sub-task',
        description: '',
        completed: false
      };
      const newSubTasks = [...(prevProject.subTasks || []), newSubTask];
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  const removeSubtask = (taskId: string) => {
    setProject(prevProject => {
      if (!prevProject) return prevProject;
      const newSubTasks = prevProject.subTasks?.filter(st => st.id !== taskId);
      return { ...prevProject, subTasks: newSubTasks };
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
       <Link href="/board" className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
           <ArrowLeft className="h-4 w-4" />
           Back to Board
       </Link>
      
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-3xl">{project.title}</CardTitle>
            <Badge variant={(project.status === 'Completed' || project.status === 'Paid') ? 'default' : 'secondary'}>{project.status}</Badge>
          </div>
          <CardDescription>
            Due by {format(project.deadline, 'PPP')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <DollarSign className="h-6 w-6 text-muted-foreground" />
                  <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="font-semibold text-lg">${project.gross_price.toFixed(2)}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <MessageSquare className="h-6 w-6 text-muted-foreground" />
                  <div>
                      <p className="text-sm text-muted-foreground">Revisions</p>
                      <p className="font-semibold text-lg">{project.revisions}</p>
                  </div>
              </div>
              <div className="flex items-center gap-3 p-4 rounded-lg bg-muted">
                  <Clock className="h-6 w-6 text-muted-foreground" />
                  <div>
                      <p className="text-sm text-muted-foreground">Deadline</p>
                      <p className="font-semibold">{format(project.deadline, "MMM d, yyyy")}</p>
                  </div>
              </div>
          </div>
          
          <Separator />

          {client && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Client</h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={client.avatarUrl} data-ai-hint="portrait person" />
                  <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{client.name}</p>
                  <p className="text-sm text-muted-foreground">{client.email}</p>
                </div>
              </div>
            </div>
          )}

          {project.subTasks !== undefined && (
            <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <ListTodo className="h-5 w-5" />
                    Sub-tasks
                </h3>
                <div className="space-y-4">
                    <div className="flex items-center gap-4">
                        <Progress value={progress} className="h-2" />
                        <span className="text-sm font-medium text-muted-foreground whitespace-nowrap">{Math.round(progress)}%</span>
                    </div>
                    
                    <Accordion type="multiple" className="w-full space-y-2">
                        {project.subTasks.map(subtask => (
                            <AccordionItem value={subtask.id} key={subtask.id} className="border rounded-md px-4 bg-muted/50">
                                <div className="flex items-center">
                                    <AccordionTrigger className="flex-grow py-3">
                                        <div className="flex items-center gap-3">
                                            <Checkbox 
                                                id={`subtask-check-${subtask.id}`} 
                                                checked={subtask.completed}
                                                onClick={(e) => e.stopPropagation()} // Prevent trigger from firing
                                                onCheckedChange={(checked) => handleSubtaskUpdate(subtask.id, 'completed', !!checked)}
                                            />
                                            <Label 
                                                htmlFor={`subtask-check-${subtask.id}`}
                                                className={cn("text-sm", subtask.completed ? "line-through text-muted-foreground" : "")}
                                            >
                                                {subtask.text}
                                            </Label>
                                        </div>
                                    </AccordionTrigger>
                                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => removeSubtask(subtask.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                                <AccordionContent className="pb-4">
                                    <div className="space-y-3 pl-8">
                                        <div className="space-y-1">
                                            <Label htmlFor={`subtask-text-${subtask.id}`}>Task</Label>
                                            <Input
                                                id={`subtask-text-${subtask.id}`}
                                                value={subtask.text}
                                                onChange={(e) => handleSubtaskUpdate(subtask.id, 'text', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <Label htmlFor={`subtask-desc-${subtask.id}`}>Description</Label>
                                            <Textarea
                                                id={`subtask-desc-${subtask.id}`}
                                                placeholder="Add more details..."
                                                value={subtask.description || ''}
                                                onChange={(e) => handleSubtaskUpdate(subtask.id, 'description', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        ))}
                    </Accordion>

                    <Button onClick={addSubtask} variant="outline">
                        <PlusCircle className="mr-2 h-4 w-4" />
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
