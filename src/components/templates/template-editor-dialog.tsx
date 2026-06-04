'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit2, Plus, PlusCircle, X } from 'lucide-react';
import { useAddTaskTemplateMutation, useUpdateTaskTemplateMutation } from '@/services/taskTemplateApiSlice';
import { useToast } from '@/hooks/use-toast';
import { TemplateModel, TemplateData } from '@/lib/types';


interface TemplateEditorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTemplate: TemplateModel | null;
  prepopulatedData?: any;
}

export function TemplateEditorDialog({
  open,
  onOpenChange,
  editingTemplate,
  prepopulatedData,
}: TemplateEditorDialogProps) {
  const [addTemplate] = useAddTaskTemplateMutation();
  const [updateTemplate] = useUpdateTaskTemplateMutation();
  const { toast } = useToast();

  // Editor Form States
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'project' | 'group' | 'task'>('project');
  const [formData, setFormData] = useState<TemplateData>({ groups: [], subTasks: [] });

  useEffect(() => {
    if (open) {
      if (editingTemplate) {
        setFormName(editingTemplate.name);
        setFormDescription(editingTemplate.description || '');
        setFormType(editingTemplate.type);
        setFormData(JSON.parse(JSON.stringify(editingTemplate.data))); // Deep copy
      } else if (prepopulatedData) {
        setFormName(prepopulatedData.name || '');
        setFormDescription(prepopulatedData.description || '');
        setFormType(prepopulatedData.type || 'project');
        setFormData(prepopulatedData.data || { groups: [], subTasks: [] });
      } else {
        setFormName('');
        setFormDescription('');
        setFormType('project');
        setFormData({ groups: [{ title: 'Group 1', tasks: [] }], subTasks: [] });
      }
    }
  }, [open, editingTemplate, prepopulatedData]);

  // Hierarchy manipulation functions
  const addGroup = () => {
    const groups = [...(formData.groups || [])];
    groups.push({ title: `New Group ${groups.length + 1}`, tasks: [] });
    setFormData({ ...formData, groups });
  };

  const removeGroup = (groupIndex: number) => {
    const groups = [...(formData.groups || [])];
    groups.splice(groupIndex, 1);
    setFormData({ ...formData, groups });
  };

  const updateGroupTitle = (groupIndex: number, title: string) => {
    const groups = [...(formData.groups || [])];
    groups[groupIndex].title = title;
    setFormData({ ...formData, groups });
  };

  const addTask = (groupIndex: number) => {
    const groups = [...(formData.groups || [])];
    if (!groups[groupIndex].tasks) groups[groupIndex].tasks = [];
    groups[groupIndex].tasks!.push({ title: `New Task ${groups[groupIndex].tasks!.length + 1}`, subTasks: [] });
    setFormData({ ...formData, groups });
  };

  const removeTask = (groupIndex: number, taskIndex: number) => {
    const groups = [...(formData.groups || [])];
    groups[groupIndex].tasks!.splice(taskIndex, 1);
    setFormData({ ...formData, groups });
  };

  const updateTaskTitle = (groupIndex: number, taskIndex: number, title: string) => {
    const groups = [...(formData.groups || [])];
    groups[groupIndex].tasks![taskIndex].title = title;
    setFormData({ ...formData, groups });
  };

  const updateTaskDetails = (groupIndex: number, taskIndex: number, details: string) => {
    const groups = [...(formData.groups || [])];
    groups[groupIndex].tasks![taskIndex].details = details;
    setFormData({ ...formData, groups });
  };

  const addSubTask = (groupIndex: number, taskIndex: number) => {
    const groups = [...(formData.groups || [])];
    if (!groups[groupIndex].tasks![taskIndex].subTasks) groups[groupIndex].tasks![taskIndex].subTasks = [];
    groups[groupIndex].tasks![taskIndex].subTasks!.push({ text: 'New subtask', completed: false });
    setFormData({ ...formData, groups });
  };

  const removeSubTask = (groupIndex: number, taskIndex: number, subIndex: number) => {
    const groups = [...(formData.groups || [])];
    groups[groupIndex].tasks![taskIndex].subTasks!.splice(subIndex, 1);
    setFormData({ ...formData, groups });
  };

  const updateSubTaskText = (groupIndex: number, taskIndex: number, subIndex: number, text: string) => {
    const groups = [...(formData.groups || [])];
    groups[groupIndex].tasks![taskIndex].subTasks![subIndex].text = text;
    setFormData({ ...formData, groups });
  };

  // For task-level templates
  const addTaskLevelSubtask = () => {
    const subTasks = [...(formData.subTasks || [])];
    subTasks.push({ text: 'New checklist item', completed: false });
    setFormData({ ...formData, subTasks });
  };

  const removeTaskLevelSubtask = (subIndex: number) => {
    const subTasks = [...(formData.subTasks || [])];
    subTasks.splice(subIndex, 1);
    setFormData({ ...formData, subTasks });
  };

  const updateTaskLevelSubtaskText = (subIndex: number, text: string) => {
    const subTasks = [...(formData.subTasks || [])];
    subTasks[subIndex].text = text;
    setFormData({ ...formData, subTasks });
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;

    // Filter structure based on type to save clean data
    let cleanData: TemplateData = {};
    if (formType === 'project') {
      cleanData = { groups: formData.groups };
    } else if (formType === 'group') {
      cleanData = { groups: formData.groups?.slice(0, 1) || [] };
    } else {
      cleanData = { subTasks: formData.subTasks };
    }

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      type: formType,
      data: cleanData,
    };

    try {
      if (editingTemplate) {
        await updateTemplate({ _id: editingTemplate._id, ...payload }).unwrap();
        toast({
          title: 'Success!',
          description: 'Template updated successfully.',
        });
      } else {
        await addTemplate(payload).unwrap();
        toast({
          title: 'Success!',
          description: 'Template created successfully.',
        });
      }
      onOpenChange(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to save template.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl max-w-4xl h-[90vh] flex flex-col bg-background border border-border">
        <DialogHeader className="shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {editingTemplate ? <Edit2 className="w-5 h-5 text-primary" /> : <Plus className="w-5 h-5 text-primary" />}
            {editingTemplate ? 'แก้ไขข้อมูลเทมเพลต' : 'สร้างเทมเพลตงานใหม่'}
          </DialogTitle>
          <DialogDescription>
            ปรับเปลี่ยนกลุ่มงาน งานย่อย และเช็คลิสต์ภายในแม่แบบให้ตรงกับเวิร์กโฟลว์ของคุณ
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSave} className="flex-grow flex flex-col overflow-hidden my-1">
          <div className="flex-grow overflow-y-auto space-y-5 pr-1.5 py-1">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Template Name */}
              <div className="md:col-span-2 space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">ชื่อเทมเพลต (Template Name)</Label>
                <Input
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น Standard Web Dev Project, SEO Checklist"
                  className="rounded-xl h-10 text-sm font-medium"
                />
              </div>

              {/* Template Type */}
              <div className="space-y-1">
                <Label className="text-xs font-semibold text-muted-foreground">ประเภทโครงสร้าง</Label>
                <Select
                  value={formType}
                  onValueChange={(val: any) => setFormType(val)}
                  disabled={!!editingTemplate}
                >
                  <SelectTrigger className="rounded-xl h-10">
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="project">Project / Tab Level</SelectItem>
                    <SelectItem value="group">Task Group Level</SelectItem>
                    <SelectItem value="task">Checklist / Tasks</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Template Description */}
            <div className="space-y-1">
              <Label className="text-xs font-semibold text-muted-foreground">คำอธิบายเทมเพลต (Description)</Label>
              <Input
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="เช่น สรุปรายละเอียดกระบวนงานสำหรับการนำไปวางในโปรเจกต์งานสร้างเว็บ"
                className="rounded-xl h-10 text-sm font-medium"
              />
            </div>

            <div className="border-t border-border/40 pt-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-foreground">โครงสร้างภายในเทมเพลต (Internal Structure)</h3>
                
                {formType === 'project' && (
                  <Button type="button" size="sm" onClick={addGroup} className="rounded-xl gap-1 h-8 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                    <Plus className="w-3.5 h-3.5" /> เพิ่มกลุ่มงาน (Group)
                  </Button>
                )}
                {formType === 'task' && (
                  <Button type="button" size="sm" onClick={addTaskLevelSubtask} className="rounded-xl gap-1 h-8 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20">
                    <Plus className="w-3.5 h-3.5" /> เพิ่มรายการเช็คลิสต์
                  </Button>
                )}
              </div>

              {/* HIERARCHICAL BUILDER CONTENT */}
              <div className="space-y-4">
                {/* PROJECT & GROUP TYPES EDITOR */}
                {(formType === 'project' || formType === 'group') && (
                  <div className="space-y-6">
                    {(formType === 'group' ? (formData.groups?.slice(0, 1) || []) : (formData.groups || [])).map((group, groupIdx) => (
                      <div key={groupIdx} className="border border-border/80 rounded-2xl bg-muted/5 p-4 space-y-4 relative">
                        <div className="flex items-center gap-3">
                          <Badge variant="outline" className="text-[10px] font-bold rounded-lg border-primary/30 text-primary uppercase shrink-0">
                            {formType === 'group' ? 'Task Group' : `Group ${groupIdx + 1}`}
                          </Badge>
                          <Input
                            required
                            value={group.title}
                            onChange={(e) => updateGroupTitle(groupIdx, e.target.value)}
                            placeholder="เช่น การวางแผนและบรีฟงาน"
                            className="h-8 rounded-lg text-xs font-bold w-full max-w-sm bg-background"
                          />
                          
                          {formType === 'project' && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 ml-auto"
                              onClick={() => removeGroup(groupIdx)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
                        </div>

                        {/* Group Tasks List */}
                        <div className="space-y-4 pl-4 border-l border-border/70">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase">งานย่อยในกลุ่มนี้ ({group.tasks?.length || 0})</span>
                            <Button
                              type="button"
                              size="sm"
                              variant="ghost"
                              onClick={() => addTask(groupIdx)}
                              className="rounded-lg h-7 px-2 text-[10px] font-bold text-primary hover:bg-primary/5 hover:text-primary gap-1"
                            >
                              <PlusCircle className="w-3.5 h-3.5" /> เพิ่มงานย่อย (Task)
                            </Button>
                          </div>

                          <div className="space-y-3">
                            {group.tasks?.map((task, taskIdx) => (
                              <div key={taskIdx} className="border border-border/60 rounded-xl bg-background p-3 space-y-3 relative">
                                <div className="flex items-center gap-2">
                                  <Input
                                    required
                                    value={task.title}
                                    onChange={(e) => updateTaskTitle(groupIdx, taskIdx, e.target.value)}
                                    placeholder="ชื่องานย่อย เช่น สรุป Asset กับลูกค้า"
                                    className="h-8 rounded-lg text-xs font-medium w-full max-w-xs"
                                  />
                                  <Input
                                    value={task.details || ''}
                                    onChange={(e) => updateTaskDetails(groupIdx, taskIdx, e.target.value)}
                                    placeholder="รายละเอียดงานย่อยย่อๆ"
                                    className="h-8 rounded-lg text-xs text-muted-foreground w-full"
                                  />
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                                    onClick={() => removeTask(groupIdx, taskIdx)}
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </Button>
                                </div>

                                {/* Task Subtasks (Checklist Level) */}
                                <div className="pl-4 space-y-2 border-l border-primary/20">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[9px] font-bold text-muted-foreground/80 uppercase">เช็คลิสต์ย่อย</span>
                                    <Button
                                      type="button"
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => addSubTask(groupIdx, taskIdx)}
                                      className="h-6 px-1.5 text-[9px] text-muted-foreground hover:text-foreground gap-1"
                                    >
                                      <Plus className="w-3 h-3" /> เพิ่มเช็คลิสต์
                                    </Button>
                                  </div>

                                  <div className="grid grid-cols-1 gap-2">
                                    {task.subTasks?.map((subtask, subIdx) => (
                                      <div key={subIdx} className="flex items-center gap-1.5">
                                        <Input
                                          required
                                          value={subtask.text}
                                          onChange={(e) => updateSubTaskText(groupIdx, taskIdx, subIdx, e.target.value)}
                                          placeholder="ข้อความเช็คลิสต์..."
                                          className="h-7 rounded-md text-[11px] w-full max-w-md bg-muted/10 border-dashed"
                                        />
                                        <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          className="h-7 w-7 rounded-full text-muted-foreground hover:text-destructive shrink-0"
                                          onClick={() => removeSubTask(groupIdx, taskIdx, subIdx)}
                                        >
                                          <X className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* CHECKLIST / TASK TYPE EDITOR */}
                {formType === 'task' && (
                  <div className="border border-border/80 rounded-2xl bg-muted/5 p-5 space-y-3">
                    <span className="text-xs font-semibold text-muted-foreground block mb-2">รายการเช็คลิสต์ที่ถูกจัดเก็บในแม่แบบ ({formData.subTasks?.length || 0})</span>
                    <div className="grid grid-cols-1 gap-3">
                      {formData.subTasks?.map((subtask, subIdx) => (
                        <div key={subIdx} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-6 font-mono font-bold">{subIdx + 1}.</span>
                          <Input
                            required
                            value={subtask.text}
                            onChange={(e) => updateTaskLevelSubtaskText(subIdx, e.target.value)}
                            placeholder="ป้อนรายการเช็คลิสต์ เช่น ติดตั้งปลั๊กอินความปลอดภัย"
                            className="h-9 rounded-xl text-sm font-medium w-full max-w-xl bg-background"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5 shrink-0"
                            onClick={() => removeTaskLevelSubtask(subIdx)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="shrink-0 pt-3 border-t border-border/40 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-xl h-10 px-5 text-sm">
              ยกเลิก
            </Button>
            <Button type="submit" className="rounded-xl h-10 px-6 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
              {editingTemplate ? 'บันทึกการแก้ไข' : 'บันทึกเทมเพลต'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
