"use client";
import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { 
  Pencil, Check, X, Table as TableIcon, Plus, Type,
  Bold, Italic, Heading1, Heading2, Heading3, 
  List, ListOrdered, CheckSquare, Strikethrough, Code,
  Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  EditorRoot, 
  EditorContent, 
  EditorInstance,
  StarterKit, 
  TaskList, 
  TaskItem,
  Command, 
  renderItems, 
  createSuggestionItems, 
  handleCommandNavigation,
  EditorCommand,
  EditorCommandItem,
  EditorCommandEmpty,
  EditorCommandList
} from 'novel';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import TiptapUnderline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

const suggestionItems = createSuggestionItems([
  {
    title: 'ข้อความธรรมดา (Text)',
    description: 'เริ่มพิมพ์ย่อหน้าข้อความทั่วไป',
    searchTerms: ['p', 'paragraph', 'text', 'ข้อความ', 'ธรรมดา'],
    icon: <Type className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleNode('paragraph', 'paragraph').run();
    },
  },
  {
    title: 'หัวข้อใหญ่ 1 (Heading 1)',
    description: 'หัวข้อหลักขนาดใหญ่ที่สุด',
    searchTerms: ['title', 'heading', 'h1', 'ใหญ่', 'หัวข้อ'],
    icon: <Heading1 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 1 }).run();
    },
  },
  {
    title: 'หัวข้อกลาง 2 (Heading 2)',
    description: 'หัวข้อรองขนาดกลาง',
    searchTerms: ['heading', 'h2', 'กลาง', 'หัวข้อ'],
    icon: <Heading2 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 2 }).run();
    },
  },
  {
    title: 'หัวข้อย่อย 3 (Heading 3)',
    description: 'หัวข้อย่อยขนาดเล็ก',
    searchTerms: ['heading', 'h3', 'ย่อย', 'เล็ก', 'หัวข้อ'],
    icon: <Heading3 className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleHeading({ level: 3 }).run();
    },
  },
  {
    title: 'รายการสัญลักษณ์ (Bullet List)',
    description: 'รายการแบบมีสัญลักษณ์หัวข้อย่อย',
    searchTerms: ['bullet', 'list', 'unordered', 'จุด', 'รายการ'],
    icon: <List className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: 'รายการลำดับเลข (Numbered List)',
    description: 'รายการแบบลำดับตัวเลขเรียงกัน',
    searchTerms: ['number', 'list', 'ordered', 'เลข', 'รายการ'],
    icon: <ListOrdered className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: 'รายการที่ต้องทำ (To-do list)',
    description: 'รายการงานพร้อมช่องติ๊กเช็คถูก',
    searchTerms: ['todo', 'task', 'check', 'ติ๊กถูก', 'รายการ'],
    icon: <CheckSquare className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleTaskList().run();
    },
  },
  {
    title: 'ตาราง (Table)',
    description: 'แทรกตารางขนาด 3x3 ช่องข้อมูล',
    searchTerms: ['table', 'grid', 'ตาราง'],
    icon: <TableIcon className="h-4 w-4" />,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
    },
  },
]);

const extensions = [
  StarterKit.configure({
    history: false,
  }),
  TiptapUnderline,
  TextAlign.configure({
    types: ['heading', 'paragraph'],
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
  Command.configure({
    suggestion: {
      items: () => suggestionItems,
      render: renderItems,
    },
  }),
];

const MenuBar = ({ 
  editor, 
  onTableCommand, 
  onSave, 
  onCancel 
}: { 
  editor: EditorInstance | null;
  onTableCommand: (command: string) => void;
  onSave: () => void;
  onCancel: () => void;
}) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center border-b border-border/50 p-1.5 bg-muted/20 gap-1">
      {/* ปุ่มบันทึกและยกเลิก (เริ่มจากซ้ายสุด) */}
      <Button
        variant="default"
        size="sm"
        onClick={onSave}
        className="h-8 gap-1 bg-[#10B981] hover:bg-[#0e9f6e] text-white shadow-sm rounded-lg px-3 mr-1"
        title="Save"
      >
        <Check className="h-4 w-4" />
        <span className="text-xs font-semibold">บันทึก</span>
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={onCancel}
        className="h-8 gap-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg px-2.5 mr-1"
        title="Cancel"
      >
        <X className="h-4 w-4" />
        <span className="text-xs">ยกเลิก</span>
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* Bold, Italic, Underline, Strike, Code */}
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
        className={`h-8 w-8 ${editor.isActive('underline') ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        title="Underline"
      >
        <Underline className="h-4 w-4" />
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

      <div className="w-px h-6 bg-border mx-1" />

      {/* Headings */}
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

      <div className="w-px h-6 bg-border mx-1" />

      {/* Lists */}
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

      <div className="w-px h-6 bg-border mx-1" />

      {/* Text Alignment */}
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: 'left' }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('left').run()}
        title="Align Left"
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: 'center' }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('center').run()}
        title="Align Center"
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: 'right' }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('right').run()}
        title="Align Right"
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className={`h-8 w-8 ${editor.isActive({ textAlign: 'justify' }) ? 'bg-muted text-primary' : ''}`}
        onClick={() => editor.chain().focus().setTextAlign('justify').run()}
        title="Align Justify"
      >
        <AlignJustify className="h-4 w-4" />
      </Button>

      <div className="w-px h-6 bg-border mx-1" />

      {/* เครื่องมือจัดการตาราง (Table Management) ในเครื่องมือหลัก */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={`h-8 gap-1.5 text-muted-foreground hover:text-foreground ${
              editor.isActive('table') ? 'bg-muted text-primary font-semibold' : ''
            }`}
            title="Manage Table"
          >
            <TableIcon className="h-4 w-4" />
            <span className="text-xs">ตาราง</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuItem onClick={() => onTableCommand('insert')}>แทรกตาราง 3x3</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('row-above')}>เพิ่มแถวด้านบน</DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('row-below')}>เพิ่มแถวด้านล่าง</DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('col-left')}>เพิ่มคอลัมน์ด้านซ้าย</DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('col-right')}>เพิ่มคอลัมน์ด้านขวา</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('del-row')} className="text-destructive focus:text-destructive">ลบแถว</DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('del-col')} className="text-destructive focus:text-destructive">ลบคอลัมน์</DropdownMenuItem>
          <DropdownMenuItem disabled={!editor.isActive('table')} onClick={() => onTableCommand('del-table')} className="text-destructive focus:text-destructive">ลบตาราง</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
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
        <div className='relative min-h-[120px] bg-white text-black shadow-sm border border-border/50 rounded-xl pt-14 px-8 pb-8 select-text group'>
          <Button
            variant='outline'
            size='sm'
            className='absolute top-4 left-4 transition shadow-sm z-10 border border-border/50 bg-white hover:bg-muted text-primary gap-1.5 h-8 px-3 rounded-lg'
            tabIndex={-1}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(true);
            }}
            aria-label='Edit details'
          >
            <Pencil className='h-3.5 w-3.5' />
            <span className="text-xs font-semibold">แก้ไข</span>
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
        <div className='border border-border/50 rounded-xl bg-white text-black relative flex flex-col focus-within:ring-1 focus-within:ring-ring overflow-hidden shadow-sm'>
          <MenuBar 
            editor={editorRef.current} 
            onTableCommand={handleTableCommand}
            onSave={handleSave}
            onCancel={handleCancel}
          />
          
          <div className="pt-8 px-8 pb-16 w-full min-h-[250px] prose prose-sm max-w-none dark:prose-invert relative">
            <EditorRoot>
              <EditorContent
                extensions={extensions}
                className="w-full outline-none"
                editorProps={{
                  handleDOMEvents: {
                    keydown: (view, event) => {
                      if (handleCommandNavigation(event)) {
                        return true;
                      }
                      if (event.key === 'Enter' && !event.shiftKey && (event.metaKey || event.ctrlKey)) {
                        handleSave();
                        return true;
                      }
                      return false;
                    },
                  },
                  attributes: {
                    class: `focus:outline-none max-w-full min-h-[200px]`,
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
              <EditorCommand className="z-50 h-auto max-h-[330px] w-72 overflow-y-auto rounded-lg border border-border bg-white p-1 shadow-md transition-all">
                <EditorCommandEmpty className="px-2 py-1.5 text-xs text-muted-foreground">ไม่มีเมนูที่ค้นหา</EditorCommandEmpty>
                <EditorCommandList>
                  {suggestionItems.map((item: any) => (
                    <EditorCommandItem
                      value={item.title}
                      onCommand={item.command}
                      className="flex w-full items-center space-x-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-muted aria-selected:bg-muted text-foreground cursor-pointer"
                      key={item.title}
                    >
                      <div className="flex h-6 w-6 items-center justify-center rounded-md border border-border bg-background text-muted-foreground">
                        {item.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-xs text-foreground">{item.title}</p>
                        <p className="text-[10px] text-muted-foreground">{item.description}</p>
                      </div>
                    </EditorCommandItem>
                  ))}
                </EditorCommandList>
              </EditorCommand>
            </EditorRoot>

            {/* แถบเครื่องมือลัดลอยตัว (Floating helper menu) เมื่อเลือก/คลิกตารางอยู่ */}
            {editorRef.current && editorRef.current.isActive('table') && (
              <div className="absolute bottom-4 right-4 z-50 bg-white/95 border border-border shadow-lg px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm transition-all animate-in fade-in slide-in-from-bottom-2 duration-150 select-none">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mr-1 px-1">เครื่องมือตาราง:</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1 hover:bg-muted rounded-md text-primary font-semibold transition"
                  onClick={() => handleTableCommand('row-below')}
                >
                  <Plus className="h-3 w-3" /> เพิ่มแถว
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2.5 text-xs gap-1 hover:bg-muted rounded-md text-primary font-semibold transition"
                  onClick={() => handleTableCommand('col-right')}
                >
                  <Plus className="h-3 w-3" /> เพิ่มคอลัมน์
                </Button>
                <div className="w-px h-4 bg-border mx-1" />
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-md font-medium transition"
                  onClick={() => handleTableCommand('del-row')}
                >
                  ลบแถว
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 hover:bg-destructive/10 hover:text-destructive text-muted-foreground rounded-md font-medium transition"
                  onClick={() => handleTableCommand('del-col')}
                >
                  ลบคอลัมน์
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs gap-1 hover:bg-destructive/10 hover:text-destructive text-destructive rounded-md font-medium transition"
                  onClick={() => handleTableCommand('del-table')}
                >
                  ลบตาราง
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
