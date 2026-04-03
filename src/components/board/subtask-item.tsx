'use client';

import React from 'react';
import { SubTask } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';

interface SubtaskItemProps {
    subtask: SubTask;
    onUpdate: (taskId: string, field: 'text' | 'description' | 'completed', value: string | boolean) => void;
    onRemove: (taskId: string) => void;
    onAddChild: (parentId: string) => void;
    idPrefix?: string;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({ subtask, onUpdate, onRemove, onAddChild, idPrefix = '' }) => {
    return (
        <AccordionItem value={subtask.id} className="border rounded-md px-4 bg-muted/50">
            <div className="flex items-center">
                <AccordionTrigger className="flex-grow py-3">
                    <div className="flex items-center gap-3">
                        <Checkbox 
                            id={`${idPrefix}subtask-check-${subtask.id}`}
                            checked={subtask.completed}
                            onClick={(e) => e.stopPropagation()}
                            onCheckedChange={(checked) => onUpdate(subtask.id, 'completed', !!checked)}
                        />
                        <Label 
                            htmlFor={`${idPrefix}subtask-check-${subtask.id}`}
                            className={cn("text-sm", subtask.completed ? "line-through text-muted-foreground" : "")}
                        >
                            {subtask.text}
                        </Label>
                    </div>
                </AccordionTrigger>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onRemove(subtask.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
            <AccordionContent className="pb-4">
                <div className="space-y-3 pl-8">
                    <div className="space-y-1">
                        <Label htmlFor={`${idPrefix}subtask-text-${subtask.id}`}>Task</Label>
                        <Input
                            id={`${idPrefix}subtask-text-${subtask.id}`}
                            value={subtask.text}
                            onChange={(e) => onUpdate(subtask.id, 'text', e.target.value)}
                        />
                    </div>
                    <div className="space-y-1">
                        <Label htmlFor={`${idPrefix}subtask-desc-${subtask.id}`}>Description</Label>
                        <Textarea
                            id={`${idPrefix}subtask-desc-${subtask.id}`}
                            placeholder="Add more details..."
                            value={subtask.description || ''}
                            onChange={(e) => onUpdate(subtask.id, 'description', e.target.value)}
                        />
                    </div>

                    <div className="space-y-4 pt-4">
                        <h4 className="text-sm font-semibold">Nested Sub-tasks</h4>
                        <div className="pl-4 space-y-2">
                          <Accordion type="multiple" className="w-full space-y-2">
                            {subtask.children?.map(child => (
                                <SubtaskItem 
                                    key={child.id}
                                    subtask={child}
                                    onUpdate={onUpdate}
                                    onRemove={onRemove}
                                    onAddChild={onAddChild}
                                    idPrefix={idPrefix}
                                />
                            ))}
                          </Accordion>
                        </div>
                        <Button onClick={() => onAddChild(subtask.id)} variant="outline" size="sm">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            Add Nested Task
                        </Button>
                    </div>

                </div>
            </AccordionContent>
        </AccordionItem>
    );
};
