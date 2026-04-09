'use client';

import React, { useState } from 'react';

import { SubTask } from '@/lib/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { PlusCircle, Trash2 } from 'lucide-react';
import { DeleteConfirmationDialog } from './delete-confirmation-dialog';
import { EditableTextField } from '../ui/editable-text-field';
import { EditableTextareaField } from '../ui/editable-textarea-field';

interface SubtaskItemProps {
  subtask: SubTask;
  onUpdate: (
    taskId: string,
    field: 'text' | 'description' | 'completed',
    value: string | boolean,
  ) => void;
  onRemove: (taskId: string) => void;
  onAddChild: (parentId: string) => void;
  idPrefix?: string;
}

export const SubtaskItem: React.FC<SubtaskItemProps> = ({
  subtask,
  onUpdate,
  onRemove,
  onAddChild,
  idPrefix = '',
}) => {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <>
      <AccordionItem
        value={subtask.id}
        className='border rounded-md px-4 bg-muted/50'
      >
        <div className='flex items-center justify-between'>
          <div className='flex items-center gap-3 flex-grow'>
            <Checkbox
              id={`${idPrefix}subtask-check-${subtask.id}`}
              checked={subtask.completed}
              onClick={(e) => e.stopPropagation()}
              onCheckedChange={(checked) =>
                onUpdate(subtask.id, 'completed', !!checked)
              }
            />
            <EditableTextField
              value={subtask.text}
              onSave={(val) => onUpdate(subtask.id, 'text', val)}
              inputId={`${idPrefix}subtask-check-${subtask.id}`}
              className={cn(
                'text-sm',
                subtask.completed ? 'line-through text-muted-foreground' : '',
              )}
            />
          </div>
          <div className='flex items-center gap-1 ml-2'>
            <AccordionTrigger
              className='p-0 h-8 w-8 flex items-center justify-center bg-transparent border-0 shadow-none hover:bg-accent'
              style={{ boxShadow: 'none' }}
            >
              {/* Hide default ChevronDown, add visually hidden text for a11y */}
              <span className='sr-only'>Toggle details</span>
              <span className='text-xs text-muted-foreground ml-1'>
                {subtask.children ? subtask.children.length : 0}
              </span>
            </AccordionTrigger>
            <Button
              variant='ghost'
              size='icon'
              className='h-8 w-8'
              onClick={() => setIsDeleteDialogOpen(true)}
            >
              <Trash2 className='h-4 w-4' />
            </Button>
          </div>
        </div>
        <AccordionContent className='pb-4'>
          <div className='space-y-3 pl-8'>
            {/* Removed duplicate EditableTextField in details */}
            <div className='space-y-1'>
              <Label htmlFor={`${idPrefix}subtask-desc-${subtask.id}`}>
                Description
              </Label>
              <EditableTextareaField
                value={subtask.description || ''}
                onSave={(val) => onUpdate(subtask.id, 'description', val)}
                inputId={`${idPrefix}subtask-desc-${subtask.id}`}
              />
            </div>

            <div className='space-y-4 pt-4'>
              <h4 className='text-sm font-semibold'>Sub-tasks</h4>
              <div className='pl-4 space-y-2'>
                <Accordion type='multiple' className='w-full space-y-2'>
                  {[...(subtask.children || [])]
                    ?.sort((a, b) => Number(a.completed) - Number(b.completed))
                    .map((child) => (
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
              <Button
                onClick={() => onAddChild(subtask.id)}
                variant='outline'
                size='sm'
              >
                <PlusCircle className='mr-2 h-4 w-4' />
                Add Sub Task
              </Button>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={() => {
          onRemove(subtask.id);
          setIsDeleteDialogOpen(false);
        }}
        title='Delete Sub-task?'
        description={`Are you sure you want to delete "${subtask.text}"? This will also delete all nested sub-tasks.`}
      />
    </>
  );
};
