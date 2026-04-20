'use client';

import Link from 'next/link';
import { Project, Client } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Pencil, Check, X, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import type { JobType } from '@/app/(protect)/job-types/page';

interface ProjectDialogHeaderProps {
  project: Project;
  editableProject: Project;
  selectedClient: Client | undefined;
  jobTypes: JobType[];
  editingField: string | null;
  onStartEdit: (field: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onValueChange: (key: keyof Project, value: any) => void;
}

export function ProjectDialogHeader({
  project,
  editableProject,
  selectedClient,
  jobTypes,
  editingField,
  onStartEdit,
  onSave,
  onCancel,
  onValueChange,
}: ProjectDialogHeaderProps) {
  return (
    <DialogHeader>
      <div className='flex flex-col gap-1 pr-12'>
        <div className='flex items-center gap-2'>
          {editingField !== 'title' ? (
            <>
              <DialogTitle className='flex-grow text-2xl'>
                <Link href={`/board/${project.id}`} className='hover:underline'>
                  {project.title}
                </Link>
              </DialogTitle>
              <Button variant='ghost' size='icon' onClick={() => onStartEdit('title')}>
                <Pencil className='h-5 w-5' />
              </Button>
            </>
          ) : (
            <>
              <Input
                value={editableProject.title}
                onChange={(e) => onValueChange('title', e.target.value)}
                className='text-2xl font-semibold flex-grow h-auto py-1'
                autoFocus
              />
              <Button variant='ghost' size='icon' onClick={onSave}>
                <Check className='h-5 w-5' />
              </Button>
              <Button variant='ghost' size='icon' onClick={onCancel}>
                <X className='h-5 w-5' />
              </Button>
            </>
          )}
        </div>

        <div className='flex items-center gap-2'>
          {editingField !== 'subtitle' ? (
            <>
              <span className='text-muted-foreground text-sm'>
                {project.subtitle || (
                  <span className='italic text-xs'>No description</span>
                )}
              </span>
              <Button variant='ghost' size='icon' onClick={() => onStartEdit('subtitle')}>
                <Pencil className='h-4 w-4' />
              </Button>
            </>
          ) : (
            <>
              <Input
                value={editableProject.subtitle || ''}
                onChange={(e) => onValueChange('subtitle', e.target.value)}
                className='text-sm flex-grow h-auto py-1'
                autoFocus
              />
              <Button variant='ghost' size='icon' onClick={onSave}>
                <Check className='h-4 w-4' />
              </Button>
              <Button variant='ghost' size='icon' onClick={onCancel}>
                <X className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>
      </div>

      {selectedClient && (
        <div className='flex items-center gap-2 text-xs text-muted-foreground'>
          Client: <span className='font-medium'>{selectedClient.name}</span>
        </div>
      )}

      <div className='flex items-center gap-6 mt-1 mb-2'>
        <div className='text-xs text-muted-foreground flex items-center gap-2'>
          Order No.:
          {editingField !== 'orderNo' ? (
            <>
              <span className='font-mono'>{project.orderNo || '-'}</span>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={() => onStartEdit('orderNo')}
                aria-label='Edit order number'
              >
                <Pencil className='h-4 w-4' />
              </Button>
            </>
          ) : (
            <>
              <Input
                value={editableProject.orderNo || ''}
                onChange={(e) => onValueChange('orderNo', e.target.value)}
                className='font-mono h-6 py-0 text-xs w-36'
                autoFocus
              />
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={onSave}
                aria-label='Save order number'
              >
                <Check className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={onCancel}
                aria-label='Cancel edit order number'
              >
                <X className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>

        <div className='text-xs text-muted-foreground flex items-center gap-2'>
          ประเภทงาน:
          {editingField !== 'type' ? (
            <>
              <span className='font-mono'>
                {jobTypes.find((jt) => jt._id === project.jobTypeId)?.name || '-'}
              </span>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={() => onStartEdit('type')}
                aria-label='Edit project type'
              >
                <Pencil className='h-4 w-4' />
              </Button>
            </>
          ) : (
            <>
              <select
                value={editableProject.jobTypeId || ''}
                onChange={(e) => onValueChange('jobTypeId', e.target.value)}
                className='font-mono h-6 py-0 text-xs w-36 border rounded px-2'
                autoFocus
              >
                <option value='' disabled>
                  เลือกประเภทงาน
                </option>
                {jobTypes.map((jt) => (
                  <option key={jt._id} value={jt._id}>
                    {jt.name}
                  </option>
                ))}
              </select>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={onSave}
                aria-label='Save project type'
              >
                <Check className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={onCancel}
                aria-label='Cancel edit project type'
              >
                <X className='h-4 w-4' />
              </Button>
            </>
          )}
        </div>
      </div>

      <div className='mb-2 text-xs text-muted-foreground flex items-center gap-4'>
        <span className='mr-4'>
          Status: <span className='font-semibold'>{project.status}</span>
        </span>
        <span className='flex items-center gap-1'>
          Due:
          {editingField !== 'deadline' ? (
            <>
              <span>{format(new Date(project.deadline), 'PPP')}</span>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={() => onStartEdit('deadline')}
                aria-label='Edit due date'
              >
                <Pencil className='h-4 w-4' />
              </Button>
            </>
          ) : (
            <>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    className={cn(
                      'pl-3 text-left font-normal h-auto py-1 w-36 justify-start',
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
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={onSave}
                aria-label='Save due date'
              >
                <Check className='h-4 w-4' />
              </Button>
              <Button
                variant='ghost'
                size='icon'
                className='h-5 w-5 p-0'
                onClick={onCancel}
                aria-label='Cancel edit due date'
              >
                <X className='h-4 w-4' />
              </Button>
            </>
          )}
        </span>
      </div>
    </DialogHeader>
  );
}
