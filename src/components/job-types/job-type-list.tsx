'use client';

import React, { useState } from 'react';
import { useGetJobTypesQuery, useDeleteJobTypeMutation } from '@/services/jobTypeApiSlice';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Search, Trash2, Edit, ListChecks } from 'lucide-react';
import { JobTypeDialog } from './job-type-dialog';
import { JobType } from '@/lib/types';

export function JobTypeList() {
  const { data: jobTypes = [], isLoading } = useGetJobTypesQuery();
  const [deleteJobType] = useDeleteJobTypeMutation();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingJobType, setEditingJobType] = useState<JobType | null>(null);
  const [jobTypeToDelete, setJobTypeToDelete] = useState<string | null>(null);

  const openCreateDialog = () => {
    setEditingJobType(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (jobType: JobType) => {
    setEditingJobType(jobType);
    setIsDialogOpen(true);
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
      <JobTypeDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingJobType={editingJobType}
      />

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
