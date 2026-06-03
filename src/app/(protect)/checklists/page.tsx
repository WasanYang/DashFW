
"use client";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Plus, ClipboardList, Sparkles, Loader2 } from "lucide-react";
import { JobTypeTable } from "./components/JobTypeTable";
import { ChecklistEditor } from "./components/ChecklistEditor";
import { JobType } from "@/lib/types";
import {
  useGetJobTypesQuery,
  useAddJobTypeMutation,
  useUpdateJobTypeMutation,
  useDeleteJobTypeMutation,
} from "@/services/jobTypeApiSlice";
import { useToast } from "@/hooks/use-toast";
import { createAiChecklist } from "@/ai/flows/ai-checklist-creator-flow";

type ChecklistItem = { id: string; text: string };

export default function ChecklistsPage() {
  const { data: jobTypes = [], isLoading } = useGetJobTypesQuery();
  const [addJobType] = useAddJobTypeMutation();
  const [updateJobType] = useUpdateJobTypeMutation();
  const [deleteJobType] = useDeleteJobTypeMutation();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<JobType | null>(null);
  const [name, setName] = useState("");

  // Checklist state for modal (with CRUD)
  const [modalChecklists, setModalChecklists] = useState<ChecklistItem[]>([]);
  const [checklistInput, setChecklistInput] = useState("");
  // inline edit state
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);

  // AI Generator state
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  function handleAddJobType() {
    setEditing(null);
    setName("");
    setModalChecklists([]);
    setChecklistInput("");
    setAiPrompt("");
    setOpen(true);
  }

  function handleEditJobType(jt: JobType) {
    setEditing(jt);
    setName(jt.name);
    setModalChecklists(jt.checklists || []);
    setChecklistInput("");
    setAiPrompt("");
    setOpen(true);
  }

  // Checklist CRUD handlers
  function handleAddChecklist() {
    if (!checklistInput.trim()) return;
    setModalChecklists([
      ...modalChecklists,
      { id: Date.now().toString(), text: checklistInput.trim() },
    ]);
    setChecklistInput("");
  }

  // Inline edit handlers
  function handleInlineEdit(id: string) {
    setInlineEditingId(id);
  }
  function handleInlineSave(id: string, value: string) {
    setModalChecklists(
      modalChecklists.map(item =>
        item.id === id ? { ...item, text: value.trim() } : item
      )
    );
    setInlineEditingId(null);
  }
  function handleInlineCancel() {
    setInlineEditingId(null);
  }

  function handleDeleteChecklist(id: string) {
    setModalChecklists(modalChecklists.filter(item => item.id !== id));
    if (inlineEditingId === id) {
      setInlineEditingId(null);
    }
  }

  async function handleDeleteJobType(id: string) {
    if (confirm("ลบประเภทงานนี้?")) {
      try {
        await deleteJobType(id).unwrap();
        toast({
          title: "สำเร็จ!",
          description: "ลบประเภทงานเรียบร้อยแล้ว",
        });
      } catch (error) {
        console.error(error);
        toast({
          title: "เกิดข้อผิดพลาด",
          description: "ไม่สามารถลบประเภทงานได้",
          variant: "destructive",
        });
      }
    }
  }

  async function handleSave() {
    if (!name.trim()) return;
    try {
      if (editing) {
        await updateJobType({ _id: editing._id, name, checklists: modalChecklists }).unwrap();
        toast({
          title: "สำเร็จ!",
          description: "แก้ไขประเภทงานเรียบร้อยแล้ว",
        });
      } else {
        await addJobType({ name, checklists: modalChecklists }).unwrap();
        toast({
          title: "สำเร็จ!",
          description: "เพิ่มประเภทงานใหม่เรียบร้อยแล้ว",
        });
      }
      setOpen(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="flex flex-col gap-4 w-full h-full p-4 sm:p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-primary shrink-0" />
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90">ประเภทงาน (AI Checklists)</h1>
        </div>
        <Button onClick={handleAddJobType} className="gap-2 px-4 py-2 rounded-full shadow bg-primary text-white hover:bg-primary/90 shrink-0">
          <Plus className="w-4 h-4" />
          เพิ่มประเภทงาน
        </Button>
      </div>
      <JobTypeTable jobTypes={jobTypes} onEdit={handleEditJobType} onDelete={handleDeleteJobType} />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="rounded-2xl max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold mb-2">{editing ? "แก้ไขประเภทงาน" : "เพิ่มประเภทงาน"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
            <div className="space-y-2">
              <span className="font-semibold text-sm text-muted-foreground">ชื่อประเภทงาน</span>
              <Input
                className="rounded-full px-4 py-2 text-base"
                placeholder="ชื่อประเภทงาน เช่น OTA, Facebook"
                value={name}
                onChange={e => setName(e.target.value)}
                required
              />
            </div>

            {/* AI Generator section */}
            <div className="bg-primary/5 rounded-xl p-4 border border-primary/20 space-y-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                <span className="font-semibold text-sm text-primary">ร่างเช็คลิสต์ด้วย AI</span>
              </div>
              <p className="text-xs text-muted-foreground">
                พิมพ์คำอธิบายรายละเอียดงาน เพื่อให้ AI แนะนำรายการเช็คลิสต์เริ่มต้น
              </p>
              <div className="flex gap-2">
                <Input
                  className="bg-background text-sm h-9 rounded-lg"
                  placeholder="เช่น ออกแบบหน้าเว็บร้านค้าและลงทะเบียนโดเมน"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  disabled={isGeneratingAi}
                />
                <Button 
                  type="button" 
                  size="sm" 
                  disabled={isGeneratingAi || !aiPrompt.trim()}
                  onClick={async () => {
                    setIsGeneratingAi(true);
                    try {
                      const res = await createAiChecklist({ description: aiPrompt.trim() });
                      const newItems = res.checklistItems.map((text, idx) => ({
                        id: `ai-${Date.now()}-${idx}`,
                        text
                      }));
                      setModalChecklists([...modalChecklists, ...newItems]);
                      setAiPrompt("");
                      toast({ title: "สำเร็จ", description: "ร่างเช็คลิสต์ด้วย AI เรียบร้อย" });
                    } catch (err) {
                      console.error(err);
                      toast({ title: "ผิดพลาด", description: "ไม่สามารถสร้างเช็คลิสต์ด้วย AI ได้", variant: "destructive" });
                    } finally {
                      setIsGeneratingAi(false);
                    }
                  }}
                >
                  {isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 mr-1" />}
                  เจนด้วย AI
                </Button>
              </div>
            </div>

            <ChecklistEditor
              items={modalChecklists}
              input={checklistInput}
              editingItem={null}
              onInputChange={setChecklistInput}
              onAdd={handleAddChecklist}
              onEdit={() => {}}
              onSaveEdit={() => {}}
              onCancelEdit={() => {}}
              onDelete={handleDeleteChecklist}
              inlineEditingId={inlineEditingId}
              onInlineEdit={handleInlineEdit}
              onInlineSave={handleInlineSave}
              onInlineCancel={handleInlineCancel}
            />
          </div>
          <DialogFooter className="mt-6 flex gap-2">
            <Button onClick={() => setOpen(false)} variant="ghost" className="rounded-full px-6">ยกเลิก</Button>
            <Button onClick={handleSave} className="rounded-full px-6 bg-primary text-white hover:bg-primary/90">{editing ? "บันทึก" : "เพิ่ม"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
