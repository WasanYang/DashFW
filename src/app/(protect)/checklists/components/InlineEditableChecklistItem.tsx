
import { useRef, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Check, X } from "lucide-react";

type Props = {
  item: { id: string; text: string };
  isEditing: boolean;
  onEdit: () => void;
  onSave: (val: string) => void;
  onCancel: () => void;
  onDelete: (id: string) => void;
};

export function InlineEditableChecklistItem({
  item,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete,
}: Props) {
  const [value, setValue] = useState(item.text);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  useEffect(() => {
    if (!isEditing) setValue(item.text);
  }, [isEditing, item.text]);

  if (isEditing) {
    return (
      <li className="flex items-center gap-2 bg-background rounded-lg px-3 py-2 shadow-sm border border-input focus-within:ring-2 focus-within:ring-primary/30 transition">
        <input
          ref={inputRef}
          className="flex-1 text-base rounded-md px-3 py-1 border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          value={value}
          onChange={e => setValue(e.target.value)}
          onKeyDown={e => {
            if (e.key === "Enter") onSave(value);
            if (e.key === "Escape") onCancel();
          }}
        />
        <Button size="icon" variant="ghost" className="rounded-lg text-green-600 hover:bg-green-100" onClick={() => onSave(value)} title="บันทึก">
          <Check className="w-4 h-4" />
        </Button>
        <Button size="icon" variant="ghost" className="rounded-lg text-gray-500 hover:bg-muted" onClick={onCancel} title="ยกเลิก">
          <X className="w-4 h-4" />
        </Button>
      </li>
    );
  }
  return (
    <li className="flex items-center gap-2 bg-white rounded-lg px-3 py-2 shadow-sm border border-muted-foreground/10 group hover:bg-muted/60 transition">
      <span className="flex-1 text-base cursor-pointer select-text" onClick={onEdit}>{item.text}</span>
      <Button size="icon" variant="ghost" className="rounded-lg hover:bg-primary/10" onClick={onEdit} title="แก้ไข">
        <Edit2 className="w-4 h-4" />
      </Button>
      <Button size="icon" variant="ghost" className="rounded-lg hover:bg-red-100 text-red-600" onClick={() => onDelete(item.id)} title="ลบ">
        <Trash2 className="w-4 h-4" />
      </Button>
    </li>
  );
}
