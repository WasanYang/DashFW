'use client';

import { useState } from 'react';
import { useGetJobTypesQuery, useAddJobTypeMutation, useUpdateJobTypeMutation, useDeleteJobTypeMutation } from '@/services/jobTypeApiSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, Edit, ListChecks, Settings2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function JobTypesPage() {
  const { data: jobTypes = [], isLoading } = useGetJobTypesQuery();
  const [addJobType, { isLoading: isCreating }] = useAddJobTypeMutation();
  const [updateJobType, { isLoading: isUpdating }] = useUpdateJobTypeMutation();
  const [deleteJobType] = useDeleteJobTypeMutation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<any | null>(null);
  const [jobTypeToDelete, setJobTypeToDelete] = useState<string | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3b82f6');

  const openCreateDialog = () => {
    setEditingJobType(null);
    setName('');
    setDescription('');
    setColor('#3b82f6');
    setIsDialogOpen(true);
  };

  const openEditDialog = (jobType: any) => {
    setEditingJobType(jobType);
    setName(jobType.name);
    setDescription(jobType.description || '');
    setColor(jobType.color || '#3b82f6');
    setIsDialogOpen(true);
  };

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
      setIsDialogOpen(false);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถบันทึกข้อมูลได้', variant: 'destructive' });
    }
  };

  const handleDeleteConfirm = async () => {
    if (!jobTypeToDelete) return;
    try {
      await deleteJobType(jobTypeToDelete).unwrap();
      toast({ title: 'สำเร็จ!', description: 'ลบประเภทโครงการเรียบร้อยแล้ว' });
      setJobTypeToDelete(null);
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถลบประเภทโครงการได้', variant: 'destructive' });
    }
  };

  const filteredJobTypes = jobTypes.filter((jt) =>
    jt.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (jt.description && jt.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">กำลังโหลดรายการประเภทโครงการ...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full min-h-full p-4 sm:p-6">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-1 mb-1">Job Types</h1>
        <p className="text-xs text-muted-foreground px-1 mb-2">
          จัดการประเภทโครงการหลักสำหรับระบุประเภทงานต่างๆ เช่น OTA, Google Map, Google Ads
        </p>
      </div>

      {/* TOOLBAR */}
      <div className="flex items-center gap-2.5 overflow-x-auto pb-1 px-1">
        <div className="relative w-64 shrink-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
          <Input
            placeholder="ค้นหาประเภทงาน..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 rounded-full border-dashed border-border/60 bg-transparent text-sm focus-visible:ring-0 shadow-none w-full"
          />
        </div>
        <div className="ml-auto">
          <Button
            onClick={openCreateDialog}
            className="h-9 rounded-full text-xs font-semibold gap-1.5 shadow-sm px-4"
          >
            <Plus className="w-4 h-4" /> สร้างประเภทโครงการ
          </Button>
        </div>
      </div>

      {/* LIST TABLE */}
      {filteredJobTypes.length === 0 ? (
        <Card className="border border-dashed border-border/70 p-12 text-center rounded-2xl mx-1">
          <CardContent className="space-y-4 pt-6">
            <ListChecks className="w-12 h-12 text-muted-foreground/50 mx-auto" />
            <h3 className="font-bold text-lg">ยังไม่มีประเภทโครงการ</h3>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              สร้างประเภทโครงการหลัก เช่น Google Map, OTA, Google Ads เพื่อจัดหมวดหมู่ให้กับงานโปรเจคของคุณ
            </p>
            <Button onClick={openCreateDialog} variant="outline" className="rounded-xl">
              เริ่มต้นสร้างประเภทโครงการ ➔
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-border/50 shadow-none overflow-hidden bg-card rounded-xl mx-1 mb-4">
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-border/30 bg-transparent text-xs font-semibold text-muted-foreground/80 text-left select-none">
                  <th className="py-3 px-4 w-12 text-center"></th>
                  <th className="py-3 px-4 w-72">ชื่อประเภทโครงการ</th>
                  <th className="py-3 px-4 border-l border-border/30">รายละเอียด / คำอธิบาย</th>
                  <th className="py-3 px-4 w-28 text-right border-l border-border/30"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/30">
                {filteredJobTypes.map((jt) => (
                  <tr key={jt._id || jt.id} className="hover:bg-muted/15 transition-all duration-150 group">
                    <td className="py-3 px-4 text-center align-middle">
                      <ListChecks className="w-4 h-4 mx-auto" style={{ color: jt.color || '#3b82f6' }} />
                    </td>
                    <td className="py-3 px-4 align-middle font-bold text-foreground text-sm">
                      {jt.name}
                    </td>
                    <td className="py-3 px-4 align-middle text-muted-foreground text-xs border-l border-border/30">
                      {jt.description || <span className="italic text-muted-foreground/45">ไม่ได้ระบุรายละเอียด</span>}
                    </td>
                    <td className="py-3 px-4 text-right align-middle opacity-0 group-hover:opacity-100 transition-opacity border-l border-border/30">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:bg-muted rounded-md"
                          onClick={() => openEditDialog(jt)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md"
                          onClick={() => setJobTypeToDelete(jt._id || jt.id || null)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* CREATE & EDIT DIALOG */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
              <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="rounded-xl h-10 text-sm hover:bg-muted/50">
                Cancel
              </Button>
              <Button type="submit" disabled={isCreating || isUpdating} className="rounded-xl h-10 px-8 text-sm font-bold shadow-md">
                {isCreating || isUpdating ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={!!jobTypeToDelete} onOpenChange={(open) => !open && setJobTypeToDelete(null)}>
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="font-black text-xl text-destructive">ยืนยันลบประเภทโครงการ?</DialogTitle>
            <DialogDescription>
              คุณแน่ใจหรือไม่ว่าต้องการลบประเภทโครงการนี้? ข้อมูลประเภทโครงการจะถูกลบออกจากระบบหลัก
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button variant="outline" onClick={() => setJobTypeToDelete(null)} className="rounded-xl h-9 text-xs">
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteConfirm} className="rounded-xl h-9 text-xs font-bold">
              ยืนยันลบ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
