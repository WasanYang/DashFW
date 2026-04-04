import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface EditableTextFieldProps {
  value: string;
  onSave: (newValue: string) => void;
  className?: string;
  inputId?: string;
  placeholder?: string;
}

export const EditableTextField: React.FC<EditableTextFieldProps> = ({
  value,
  onSave,
  className = '',
  inputId,
  placeholder,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  const [hovered, setHovered] = useState(false);
  React.useEffect(() => {
    setEditValue(value);
  }, [value]);
  return isEditing ? (
    <div className={`relative ${className} ${isEditing ? 'w-full' : ''}`}>
      <Input
        id={inputId}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        autoFocus
        placeholder={placeholder}
        style={{
          border: '1px solid #d1d5db',
          background: 'none',
          boxShadow: 'none',
          outline: 'none',
        }}
        className='focus-visible:ring-0 focus-visible:ring-offset-0'
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
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
      className={`min-h-[36px] flex items-center rounded cursor-pointer group ${className}`}
      onClick={() => setIsEditing(true)}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') setIsEditing(true);
      }}
      title='Click to edit'
      style={{ border: 'none', background: 'none' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <span className='truncate w-full'>
        {value || <span className='text-muted-foreground'>Click to edit</span>}
      </span>
      {hovered && (
        <span className='ml-2 text-muted-foreground'>
          <svg
            width='16'
            height='16'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            viewBox='0 0 24 24'
          >
            <path d='M12 20h9' />
            <path d='M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z' />
          </svg>
        </span>
      )}
    </div>
  );
};
