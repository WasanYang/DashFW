'use client';

import { Project } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { MessageSquare, Clock, Pencil, Check, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/number-format';

interface ProjectDialogStatsProps {
  project: Project;
  editableProject: Project;
  editingField: string | null;
  onStartEdit: (field: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onValueChange: (key: keyof Project, value: any) => void;
}

export function ProjectDialogStats({
  project,
  editableProject,
  editingField,
  onStartEdit,
  onSave,
  onCancel,
  onValueChange,
}: ProjectDialogStatsProps) {
  return (
    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
      {/* Price */}
      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
        <div className='flex-grow'>
          <p className='text-sm text-muted-foreground'>Price</p>
          {editingField === 'price' ? (
            <Input
              type='number'
              value={editableProject.gross_price}
              onChange={(e) => onValueChange('gross_price', Number(e.target.value))}
              className='font-semibold text-lg p-1 h-auto'
            />
          ) : (
            <p className='font-semibold text-lg'>{formatNumber(project.gross_price)}</p>
          )}
        </div>
        {editingField === 'price' ? (
          <div className='flex'>
            <Button variant='ghost' size='icon' onClick={onSave}>
              <Check className='h-5 w-5' />
            </Button>
            <Button variant='ghost' size='icon' onClick={onCancel}>
              <X className='h-5 w-5' />
            </Button>
          </div>
        ) : (
          <Button variant='ghost' size='icon' onClick={() => onStartEdit('price')}>
            <Pencil className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Revisions */}
      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
        <MessageSquare className='h-6 w-6 text-muted-foreground' />
        <div className='flex-grow'>
          <p className='text-sm text-muted-foreground'>Revisions</p>
          {editingField === 'revisions' ? (
            <Input
              type='number'
              value={editableProject.revisions}
              onChange={(e) => onValueChange('revisions', Number(e.target.value))}
              className='font-semibold text-lg p-1 h-auto'
            />
          ) : (
            <p className='font-semibold text-lg'>{project.revisions}</p>
          )}
        </div>
        {editingField === 'revisions' ? (
          <div className='flex'>
            <Button variant='ghost' size='icon' onClick={onSave}>
              <Check className='h-5 w-5' />
            </Button>
            <Button variant='ghost' size='icon' onClick={onCancel}>
              <X className='h-5 w-5' />
            </Button>
          </div>
        ) : (
          <Button variant='ghost' size='icon' onClick={() => onStartEdit('revisions')}>
            <Pencil className='h-4 w-4' />
          </Button>
        )}
      </div>

      {/* Deadline */}
      <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
        <Clock className='h-6 w-6 text-muted-foreground' />
        <div className='flex-grow'>
          <p className='text-sm text-muted-foreground'>Deadline</p>
          {editingField === 'deadline' ? (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'pl-3 text-left font-normal h-auto py-1 w-full justify-start',
                    !editableProject.deadline && 'text-muted-foreground',
                  )}
                >
                  {editableProject.deadline ? (
                    format(new Date(editableProject.deadline), 'PPP')
                  ) : (
                    <span>Pick a date</span>
                  )}
                  <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={new Date(editableProject.deadline)}
                  onSelect={(date) => onValueChange('deadline', date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          ) : (
            <p className='font-semibold'>
              {format(new Date(project.deadline), 'MMM d, yyyy')}
            </p>
          )}
        </div>
        {editingField === 'deadline' ? (
          <div className='flex'>
            <Button variant='ghost' size='icon' onClick={onSave}>
              <Check className='h-5 w-5' />
            </Button>
            <Button variant='ghost' size='icon' onClick={onCancel}>
              <X className='h-5 w-5' />
            </Button>
          </div>
        ) : (
          <Button variant='ghost' size='icon' onClick={() => onStartEdit('deadline')}>
            <Pencil className='h-4 w-4' />
          </Button>
        )}
      </div>
    </div>
  );
}
