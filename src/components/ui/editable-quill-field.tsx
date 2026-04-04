import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Button } from '@/components/ui/button';
import { Pencil, Check, X } from 'lucide-react';

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

interface EditableQuillFieldProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const EditableQuillField: React.FC<EditableQuillFieldProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Enter details...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  useEffect(() => {
    setEditValue(value);
  }, [value]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  return (
    <div className={`relative group ${className}`}>
      {!isEditing ? (
        <div className='relative min-h-[80px] border rounded p-2 bg-background text-foreground select-text group'>
          <div
            className='ql-editor prose prose-sm max-w-none'
            dangerouslySetInnerHTML={{
              __html:
                value ||
                "<span class='text-muted-foreground'>No details</span>",
            }}
          />
          <Button
            variant='ghost'
            size='icon'
            className='absolute top-2 right-2 opacity-0 group-hover:opacity-80 hover:opacity-100 transition'
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
            aria-label='Edit details'
          >
            <Pencil className='h-4 w-4' />
          </Button>
        </div>
      ) : (
        <div className='border rounded p-2 bg-background'>
          <ReactQuill
            value={editValue}
            onChange={setEditValue}
            theme='snow'
            placeholder={placeholder}
            className='min-h-[80px]'
          />
          <div className='flex gap-2 mt-2 justify-end'>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleSave}
              aria-label='Save details'
            >
              <Check className='h-4 w-4' />
            </Button>
            <Button
              variant='ghost'
              size='icon'
              onClick={handleCancel}
              aria-label='Cancel edit details'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
