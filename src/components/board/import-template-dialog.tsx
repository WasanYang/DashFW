'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FolderOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImportTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  allTemplates: any[];
  projectTasks: any[];
  onImport: (templateId: string, targetGroupId: string) => Promise<void>;
}

export const ImportTemplateDialog: React.FC<ImportTemplateDialogProps> = ({
  open,
  onOpenChange,
  allTemplates,
  projectTasks,
  onImport,
}) => {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [targetGroupIdForChecklist, setTargetGroupIdForChecklist] = useState<string>('');
  const [templateFilterType, setTemplateFilterType] = useState<'all' | 'task_group' | 'project'>('task_group');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReset = () => {
    setSelectedTemplateId('');
    setTargetGroupIdForChecklist('');
    setTemplateFilterType('task_group');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  const handleSubmit = async () => {
    if (!selectedTemplateId) return;
    setIsSubmitting(true);
    try {
      await onImport(selectedTemplateId, targetGroupIdForChecklist);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredTemplates = allTemplates.filter((t: any) => {
    if (templateFilterType === 'all') return true;
    if (templateFilterType === 'project') return t.type === 'project';
    if (templateFilterType === 'task_group') return t.type === 'group' || t.type === 'task';
    return true;
  });

  const selectedTemplate = allTemplates.find(
    (t: any) => t._id === selectedTemplateId || t.id === selectedTemplateId
  );

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="rounded-2xl max-w-lg bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <FolderOpen className="w-5 h-5 text-primary" />
            เลือกเทมเพลตที่ต้องการใช้งาน
          </DialogTitle>
          <DialogDescription>
            เลือกแผนเทมเพลตเพื่อนำเข้าไปสร้างในโครงการนี้
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-2">
          {/* Category tabs for filtering templates */}
          <div className="flex bg-muted/40 p-1.5 rounded-xl border border-border/60 text-xs">
            <button
              type="button"
              onClick={() => {
                setTemplateFilterType('task_group');
                setSelectedTemplateId('');
                setTargetGroupIdForChecklist('');
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg font-semibold transition-all text-center",
                templateFilterType === 'task_group'
                  ? "bg-card text-primary shadow-xs border border-border/10 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              กลุ่มงาน/งานย่อย
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplateFilterType('project');
                setSelectedTemplateId('');
                setTargetGroupIdForChecklist('');
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg font-semibold transition-all text-center",
                templateFilterType === 'project'
                  ? "bg-card text-primary shadow-xs border border-border/10 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              โครงการ (Projects)
            </button>
            <button
              type="button"
              onClick={() => {
                setTemplateFilterType('all');
                setSelectedTemplateId('');
                setTargetGroupIdForChecklist('');
              }}
              className={cn(
                "flex-1 py-1.5 rounded-lg font-semibold transition-all text-center",
                templateFilterType === 'all'
                  ? "bg-card text-primary shadow-xs border border-border/10 font-bold"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              ทั้งหมด
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">เทมเพลต (Template)</Label>
            <Select
              value={selectedTemplateId}
              onValueChange={(val) => {
                setSelectedTemplateId(val);
                const tpl = allTemplates.find((t: any) => t._id === val || t.id === val);
                if (tpl && tpl.type !== 'task') {
                  setTargetGroupIdForChecklist('');
                }
              }}
            >
              <SelectTrigger className="rounded-xl h-10">
                <SelectValue placeholder="เลือกเทมเพลต" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {filteredTemplates.length === 0 ? (
                  <SelectItem value="none" disabled>ไม่มีเทมเพลตในหมวดหมู่นี้</SelectItem>
                ) : (
                  filteredTemplates.map((tpl: any) => (
                    <SelectItem key={tpl._id || tpl.id} value={tpl._id || tpl.id}>
                      {tpl.name} ({tpl.type === 'project' ? 'Project' : tpl.type === 'group' ? 'Group' : 'Checklist'})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* If selected template is a task checklist, prompt user to select target group */}
          {selectedTemplate && selectedTemplate.type === 'task' && (
            <div className="space-y-1.5 animate-in fade-in duration-200">
              <Label className="text-xs font-semibold text-muted-foreground">เลือกกลุ่มงานเป้าหมาย (Target Group)</Label>
              <Select
                value={targetGroupIdForChecklist}
                onValueChange={setTargetGroupIdForChecklist}
              >
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="เลือกกลุ่มงานในโครงการนี้" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  {projectTasks.length === 0 ? (
                    <SelectItem value="none" disabled>ไม่มีกลุ่มงานในโครงการนี้</SelectItem>
                  ) : (
                    projectTasks.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.title}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 border-t border-border/40 pt-3">
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting} className="rounded-xl h-10">
            ยกเลิก
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!selectedTemplateId || isSubmitting}
            className="rounded-xl h-10 px-6 font-semibold bg-primary text-primary-foreground hover:bg-primary/90"
          >
            นำเข้าเทมเพลต
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
