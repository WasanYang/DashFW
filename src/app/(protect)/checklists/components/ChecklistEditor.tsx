import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, ClipboardList } from "lucide-react";
import { InlineEditableChecklistItem } from "./InlineEditableChecklistItem";

type ChecklistItem = { id: string; text: string };

type Props = {
  items: ChecklistItem[];
  input: string;
  editingItem: ChecklistItem | null;
  onInputChange: (v: string) => void;
  onAdd: () => void;
  onEdit: (item: ChecklistItem) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (id: string) => void;
  inlineEditingId?: string | null;
  onInlineEdit?: (id: string) => void;
  onInlineSave?: (id: string, value: string) => void;
  onInlineCancel?: () => void;
};

export function ChecklistEditor({
  items,
  input,
  editingItem,
  onInputChange,
  onAdd,
  onEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
  inlineEditingId,
  onInlineEdit,
  onInlineSave,
  onInlineCancel,
}: Props) {
  return (
    <div>
      <div className="font-semibold mb-3 text-primary flex items-center gap-2">
        <ClipboardList className="w-5 h-5" /> Checklist
      </div>
      <div className="flex gap-2 mb-4">
        <Input
          className="rounded-lg px-4 py-2 text-base border border-input bg-background focus-visible:ring-2 focus-visible:ring-primary/30 transition"
          placeholder="เพิ่ม checklist เช่น ขอข้อมูลบัญชี Booking.com"
          value={input}
          onChange={e => onInputChange(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") {
              e.preventDefault();
              editingItem ? onSaveEdit() : onAdd();
            }
          }}
        />
        <Button size="icon" className="rounded-lg bg-primary text-white hover:bg-primary/90 shadow-sm" onClick={onAdd} title="เพิ่ม">
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <ul className="flex flex-col gap-2">
        {items.length === 0 && (
          <li className="flex flex-col items-center text-muted-foreground py-8 bg-muted/60 rounded-xl border border-dashed border-muted-foreground/20">
            <ClipboardList className="w-8 h-8 mb-1 opacity-30" />
            <span>ยังไม่มี checklist</span>
          </li>
        )}
        {items.map(item => (
          <InlineEditableChecklistItem
            key={item.id}
            item={item}
            isEditing={inlineEditingId === item.id}
            onEdit={() => onInlineEdit && onInlineEdit(item.id)}
            onSave={(val: string) => onInlineSave && onInlineSave(item.id, val)}
            onCancel={onInlineCancel || (() => {})}
            onDelete={onDelete}
          />
        ))}
      </ul>
    </div>
  );
}
