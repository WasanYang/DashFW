"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Pencil, Check, X, Table as TableIcon,
  Bold, Italic, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Strikethrough, Code
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EditorRoot, EditorContent, EditorInstance } from 'novel';
import { StarterKit, TaskList, TaskItem } from 'novel';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';

const extensions = [
  StarterKit.configure({
    history: false,
  }),
  TaskList,
  TaskItem.configure({
    nested: true,
  }),
  Table.configure({
    resizable: true,
  }),
  TableRow,
  TableHeader,
  TableCell,
];

const MenuBar = ({ editor }: { editor: EditorInstance | null }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap gap-1 border-b border-border/50 p-1 mb-2 bg-muted/20">
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('bold') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleBold().run()}
        title="Bold"
      >
        <Bold className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('italic') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleItalic().run()}
        title="Italic"
      >
        <Italic className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('strike') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleStrike().run()}
        title="Strikethrough"
      >
        <Strikethrough className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('code') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleCode().run()}
        title="Code"
      >
        <Code className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('heading', { level: 1 }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        title="Heading 1"
      >
        <Heading1 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('heading', { level: 2 }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        title="Heading 2"
      >
        <Heading2 className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('heading', { level: 3 }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        title="Heading 3"
      >
        <Heading3 className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1 my-auto" />

      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('bulletList') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        title="Bullet List"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('orderedList') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        title="Ordered List"
      >
        <ListOrdered className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive('taskList') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        title="Task List"
      >
        <CheckSquare className="h-4 w-4" />
      </Button>
    </div>
  );
};

interface EditableNovelFieldProps {
  value: string; // HTML string
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

export const EditableNovelField: React.FC<EditableNovelFieldProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Enter details...',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);
  // Force update when editor selection changes to trigger active state in menu bar
  const [, setUpdateState] = useState({});
  const editorRef = useRef<EditorInstance | null>(null);

  useEffect(() => {
    if (!isEditing) {
      setEditValue(value);
    }
  }, [value, isEditing]);

  const handleSave = () => {
    onChange(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  const handleTableCommand = (command: string) => {
    if (!editorRef.current) return;
    const editor = editorRef.current;

    switch (command) {
      case 'insert':
        editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
        break;
      case 'row-above':
        editor.chain().focus().addRowBefore().run();
        break;
      case 'row-below':
        editor.chain().focus().addRowAfter().run();
        break;
      case 'col-left':
        editor.chain().focus().addColumnBefore().run();
        break;
      case 'col-right':
        editor.chain().focus().addColumnAfter().run();
        break;
      case 'del-row':
        editor.chain().focus().deleteRow().run();
        break;
      case 'del-col':
        editor.chain().focus().deleteColumn().run();
        break;
      case 'del-table':
        editor.chain().focus().deleteTable().run();
        break;
    }
  };

  return (
    <div className={`relative group ${className}`}>
      {!isEditing ? (
        <div className='relative min-h-[80px] border rounded p-2 bg-background text-foreground select-text group'>
          <Button
            variant='secondary'
            size='icon'
            className='absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition shadow-md z-10 border border-border/50'
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
            aria-label='Edit details'
          >
            <Pencil className='h-4 w-4 text-primary' />
          </Button>
          <div
            className='prose prose-sm max-w-none dark:prose-invert prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 tiptap-read-only'
            dangerouslySetInnerHTML={{
              __html:
                value ||
                "<span class='text-muted-foreground'>No details</span>",
            }}
          />
        </div>
      ) : (
        <div className='border rounded bg-background relative flex flex-col focus-within:ring-1 focus-within:ring-ring'>
          <MenuBar editor={editorRef.current} />
          
          <div className="min-h-[150px] w-full px-3 pb-6">
            <EditorRoot>
              <EditorContent
                extensions={extensions}
                className="w-full prose prose-sm max-w-none dark:prose-invert outline-none"
                editorProps={{
                  handleDOMEvents: {
                    keydown: (_view, event) => {
                      if (event.key === 'Enter' && !event.shiftKey && (event.metaKey || event.ctrlKey)) {
                        handleSave();
                        return true;
                      }
                      return false;
                    },
                  },
                  attributes: {
                    class: `prose prose-sm dark:prose-invert focus:outline-none max-w-full`,
                  }
                }}
                onUpdate={({ editor }) => {
                  setEditValue(editor.getHTML());
                  setUpdateState({});
                }}
                onSelectionUpdate={() => {
                  setUpdateState({});
                }}
                onCreate={({ editor }) => {
                  editorRef.current = editor;
                  if (value) {
                    editor.commands.setContent(value);
                  }
                  setUpdateState({});
                }}
              />
            </EditorRoot>
          </div>
          
          <div className='flex gap-2 mt-2 justify-between items-center bg-muted/30 p-2 border-t'>
            <div className='flex gap-2'>
              <Button
                variant='default'
                size='sm'
                onClick={handleSave}
                aria-label='Save details'
                className='h-8 px-4 gap-1'
              >
                <Check className='h-4 w-4' /> บันทึก
              </Button>
              <Button
                variant='ghost'
                size='sm'
                onClick={handleCancel}
                aria-label='Cancel edit details'
                className='h-8 px-3 gap-1'
              >
                <X className='h-4 w-4' /> ยกเลิก
              </Button>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm' className="gap-2 h-8 text-muted-foreground">
                  <TableIcon className='h-4 w-4' /> Table
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleTableCommand('insert')}>Insert 3x3 Table</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('row-above')}>Add Row Above</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('row-below')}>Add Row Below</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('col-left')}>Add Column Left</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('col-right')}>Add Column Right</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('del-row')}>Delete Row</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('del-col')}>Delete Column</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleTableCommand('del-table')}>Delete Table</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}
    </div>
  );
};
