import React, { useState } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

export interface EditableTextareaFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputId?: string;
  placeholder?: string;
  minRows?: number;
  maxRows?: number;
}

export const EditableTextareaField: React.FC<EditableTextareaFieldProps> = ({
  value,
  onSave,
  className = '',
  inputId,
  placeholder,
  minRows = 3,
  maxRows = 6,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  React.useEffect(() => {
    setEditValue(value);
  }, [value]);
  return isEditing ? (
    <div className={`relative ${className}`}>
      <Textarea
        id={inputId}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        autoFocus
        placeholder={placeholder}
        rows={minRows}
        style={{
          resize: 'vertical',
          minHeight: `${minRows * 1.5}em`,
          maxHeight: `${maxRows * 1.5}em`,
        }}
        onKeyDown={(e) => {
          if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
            onSave(editValue);
            setIsEditing(false);
          } else if (e.key === 'Escape') {
            setEditValue(value);
            setIsEditing(false);
          }
        }}
        onBlur={() => {
          setEditValue(value);
          setIsEditing(false);
        }}
      />
      <div className='absolute right-2 top-1 flex gap-1'>
        <Button
          size='icon'
          variant='ghost'
          className='h-6 w-6 p-0'
          title='Save'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            onSave(editValue);
            setIsEditing(false);
          }}
        >
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M5 13l4 4L19 7' />
          </svg>
        </Button>
        <Button
          size='icon'
          variant='ghost'
          className='h-6 w-6 p-0'
          title='Cancel'
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            setEditValue(value);
            setIsEditing(false);
          }}
        >
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M6 18L18 6M6 6l12 12' />
          </svg>
        </Button>
      </div>
    </div>
  ) : (
    <div
      className={`min-h-[36px] flex items-center px-2 border rounded bg-white hover:bg-muted cursor-pointer ${className}`}
      onClick={() => setIsEditing(true)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
      }}
      title='Click to edit'
      style={{ minHeight: `${minRows * 1.5}em` }}
    >
      <span className='truncate w-full'>
        {value || <span className='text-muted-foreground'>Click to edit</span>}
      </span>
    </div>
  );
};
