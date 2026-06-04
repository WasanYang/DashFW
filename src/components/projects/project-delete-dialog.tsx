'use client';

import { useDeleteProjectMutation } from '@/services/projectApi';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ProjectDeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string | null;
}

export function ProjectDeleteDialog({
  open,
  onOpenChange,
  projectId,
}: ProjectDeleteDialogProps) {
  const [deleteProject, { isLoading: isDeleting }] = useDeleteProjectMutation();
  const { toast } = useToast();

  const handleDeleteConfirm = async () => {
    if (!projectId) return;
    try {
      await deleteProject({ id: projectId }).unwrap();
      toast({ title: 'สำเร็จ!', description: 'ลบโครงการเรียบร้อยแล้ว' });
      onOpenChange(false);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบโครงการได้', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle className="font-black text-xl text-destructive">Confirm Delete Project?</DialogTitle>
          <DialogDescription>
            คุณแน่ใจหรือไม่ว่าต้องการลบโครงการตู้เก็บนี้? ข้อมูลการตั้งค่าโครงการจะถูกลบทั้งหมด 
            *(งานย่อย/การ์ดงานที่อยู่ภายในจะไม่ถูกลบ แต่จะถูกย้ายไปอยู่เป็นงานทั่วไป)*
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="pt-4 gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-9 text-xs">
            Cancel
          </Button>
          <Button variant="destructive" disabled={isDeleting} onClick={handleDeleteConfirm} className="rounded-xl h-9 text-xs font-bold">
            {isDeleting ? 'Deleting...' : 'Confirm Delete'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
