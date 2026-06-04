'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Settings2 } from 'lucide-react';
import { useAddJobTypeMutation, useUpdateJobTypeMutation } from '@/services/jobTypeApiSlice';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { JobType } from '@/lib/types';

interface JobTypeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingJobType: JobType | null;
}

export function JobTypeDialog({
  open,
  onOpenChange,
  editingJobType,
}: JobTypeDialogProps) {
  const [addJobType, { isLoading: isCreating }] = useAddJobTypeMutation();
  const [updateJobType, { isLoading: isUpdating }] = useUpdateJobTypeMutation();
  const { toast } = useToast();

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  useEffect(() => {
    if (open) {
      if (editingJobType) {
        setName(editingJobType.name);
        setDescription(editingJobType.description || '');
        setColor(editingJobType.color || '#3b82f6');
      } else {
        setName('');
        setDescription('');
        setColor('#3b82f6');
      }
    }
  }, [open, editingJobType]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'กรุณากรอกชื่อประเภทโครงการ', variant: 'destructive' });
      return;
    }

    try {
      if (editingJobType) {
        await updateJobType({
          _id: editingJobType._id || editingJobType.id,
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        }).unwrap();
        toast({ title: 'สำเร็จ!', description: 'แก้ไขประเภทโครงการเรียบร้อยแล้ว' });
      } else {
        await addJobType({
          name: name.trim(),
          description: description.trim() || undefined,
          color,
        }).unwrap();
        toast({ title: 'สำเร็จ!', description: 'สร้างประเภทโครงการใหม่เรียบร้อยแล้ว' });
      }
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border border-border/50 shadow-2xl rounded-[24px] bg-background">
        <div className="bg-muted/30 px-6 py-5 border-b border-border/40">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl flex items-center gap-2">
              <Settings2 className="w-5 h-5 text-primary" />
              {editingJobType ? 'แก้ไขประเภทโครงการ' : 'สร้างประเภทโครงการใหม่'}
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground/80">
              {editingJobType ? 'แก้ไขรายละเอียดของประเภทโครงการ' : 'เพิ่มประเภทโครงการสำหรับจัดกลุ่มงานโปรเจค'}
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground/80">ชื่อประเภทโครงการ <span className="text-destructive">*</span></span>
            <Input
              placeholder="เช่น OTA, Google Map, Google Ads"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl h-10 border-border/60 bg-transparent text-sm focus-visible:ring-primary shadow-sm"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground/80">สีของหมวดหมู่</span>
            <div className="flex items-center gap-2 mt-1">
              {['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#64748b'].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    "w-6 h-6 rounded-full transition-all border border-border/40",
                    color === c ? "ring-2 ring-primary ring-offset-2 scale-110" : "opacity-60 hover:opacity-100"
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold text-foreground/80">รายละเอียด / คำอธิบาย</span>
            <textarea
              placeholder="ระบุคำอธิบายสั้นๆ..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="flex min-h-[80px] w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
            />
          </div>

          <DialogFooter className="mt-6 gap-3 sm:justify-between pt-5 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 text-sm hover:bg-muted/50">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || isUpdating} className="rounded-xl h-10 px-8 text-sm font-bold shadow-md">
              {isCreating || isUpdating ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
