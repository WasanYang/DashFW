'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  Loader2,
  ListTodo,
  FolderKanban,
  LayoutGrid,
  ChevronDown,
  ChevronRight,
  PlusCircle,
  X,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  useGetTaskTemplatesQuery,
  useAddTaskTemplateMutation,
  useUpdateTaskTemplateMutation,
  useDeleteTaskTemplateMutation,
} from '@/services/taskTemplateApiSlice';
import { generateAiTaskTemplate } from '@/ai/flows/ai-template-generator-flow';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type SubTaskTemplate = {
  text: string;
  completed: boolean;
};

type TaskTemplateItem = {
  title: string;
  details?: string;
  subTasks?: SubTaskTemplate[];
};

type GroupTemplate = {
  title: string;
  tasks?: TaskTemplateItem[];
};

type TemplateData = {
  groups?: GroupTemplate[];
  subTasks?: SubTaskTemplate[];
};

type TemplateModel = {
  _id?: string;
  id?: string;
  name: string;
  description?: string;
  type: 'project' | 'group' | 'task';
  data: TemplateData;
};

export default function TemplatesPage() {
  const { data: templates = [], isLoading, refetch } = useGetTaskTemplatesQuery();
  const [addTemplate] = useAddTaskTemplateMutation();
  const [updateTemplate] = useUpdateTaskTemplateMutation();
  const [deleteTemplate] = useDeleteTaskTemplateMutation();
  const { toast } = useToast();

  // Modal Dialogs States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  
  // AI prompt state
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiType, setAiType] = useState<'project' | 'group' | 'task'>('project');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  // Editor Form States
  const [editingTemplate, setEditingTemplate] = useState<TemplateModel | null>(null);
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formType, setFormType] = useState<'project' | 'group' | 'task'>('project');
  const [formData, setFormData] = useState<TemplateData>({ groups: [], subTasks: [] });

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setFormName('');
    setFormDescription('');
    setFormType('project');
    setFormData({ groups: [{ title: 'Group 1', tasks: [] }], subTasks: [] });
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tpl: TemplateModel) => {
    setEditingTemplate(tpl);
    setFormName(tpl.name);
    setFormDescription(tpl.description || '');
    setFormType(tpl.type);
    setFormData(JSON.parse(JSON.stringify(tpl.data))); // Deep copy
    setIsEditorOpen(true);
  };

  const handleDelete = async (id?: string) => {
    if (!id) return;
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await deleteTemplate(id).unwrap();
      toast({
        title: 'Success!',
        description: 'Template deleted successfully.',
      });
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to delete template.',
        variant: 'destructive',
      });
    }
  };

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
      setIsEditorOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: 'Error',
        description: 'Failed to save template.',
        variant: 'destructive',
      });
    }
  };

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateAiTaskTemplate({ prompt: aiPrompt.trim(), type: aiType });
      if (res) {
        setFormName(res.name);
        setFormDescription(res.description);
        setFormType(res.type);
        setFormData(res.data);
        setIsAiOpen(false);
        setIsEditorOpen(true);
        setAiPrompt('');
        toast({
          title: 'Success!',
          description: 'AI has structured your template. Review it below.',
        });
      }
    } catch (err) {
      console.error(err);
      toast({
        title: 'AI Generation Failed',
        description: 'Check your API Key and connection.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAi(false);
    }
  };

  return (
    <div className="flex flex-col gap-4 w-full min-h-full p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-1 mb-2">Templates</h1>
          <p className="text-xs text-muted-foreground px-1">
            สร้างและนำเทมเพลตโครงสร้างกลุ่มงาน (Task Groups), งานย่อย (Tasks) หรือเช็คลิสต์ไปใช้จริงในหน้าบอร์ดโครงการ
          </p>
        </div>
        
        <div className="flex items-center gap-2 shrink-0">
          <Button
            onClick={() => setIsAiOpen(true)}
            className="rounded-xl shadow-sm bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 hover:text-primary transition-all font-semibold gap-1.5 h-10 px-4 text-xs"
          >
            <Sparkles className="w-4 h-4 text-primary animate-pulse shrink-0" />
            AIร่างเทมเพลต
          </Button>
          <Button onClick={handleOpenCreate} className="rounded-xl shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 h-10 px-4 text-xs">
            <Plus className="w-4 h-4" /> สร้างเทมเพลตใหม่
          </Button>
        </div>
      </div>

      {/* TEMPLATES LIST CARDS */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" /> กำลังโหลดเทมเพลต...
        </div>
      ) : templates.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-transparent flex flex-col items-center justify-center p-16 text-center">
          <FolderOpen className="w-12 h-12 text-muted-foreground/30 mb-3" />
          <h2 className="text-base font-bold text-muted-foreground mb-1">ยังไม่มีเทมเพลตงานในระบบ</h2>
          <p className="text-xs text-muted-foreground/60 mb-6">สร้างเทมเพลตแรกของคุณด้วยตนเอง หรือสั่งการให้ AI ร่างแม่แบบให้ทันที</p>
          <div className="flex gap-2">
            <Button onClick={handleOpenCreate} size="sm" variant="outline" className="rounded-xl">
              <Plus className="w-4 h-4 mr-1.5" /> สร้างเอง
            </Button>
            <Button onClick={() => setIsAiOpen(true)} size="sm" className="rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white font-semibold">
              <Sparkles className="w-4 h-4 mr-1.5" /> ร่างด้วย AI
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-2">
          {templates.map((tpl) => (
            <Card key={tpl._id} className="border border-border/80 hover:shadow-md transition-all flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-4">
                  <div className="space-y-1 min-w-0">
                    <CardTitle className="text-base font-bold truncate pr-2" title={tpl.name}>
                      {tpl.name}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2rem]">
                      {tpl.description || 'ไม่มีคำอธิบายเทมเพลต'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-[10px] font-bold rounded-lg uppercase tracking-wide px-2 py-0.5">
                    {tpl.type === 'project' && <><FolderKanban className="w-3 h-3 mr-1" /> Project</>}
                    {tpl.type === 'group' && <><LayoutGrid className="w-3 h-3 mr-1" /> Group</>}
                    {tpl.type === 'task' && <><ListTodo className="w-3 h-3 mr-1" /> Checklist</>}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-border/40 bg-muted/5 p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {tpl.type === 'project' && `${tpl.data?.groups?.length || 0} Groups`}
                  {tpl.type === 'group' && `${tpl.data?.groups?.[0]?.tasks?.length || 0} Tasks`}
                  {tpl.type === 'task' && `${tpl.data?.subTasks?.length || 0} Items`}
                </span>
                
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/5"
                    onClick={() => handleOpenEdit(tpl)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                    onClick={() => handleDelete(tpl._id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* AI TEMPLATE GENERATOR DIALOG */}
      <Dialog open={isAiOpen} onOpenChange={setIsAiOpen}>
        <DialogContent className="rounded-2xl max-w-lg bg-background border border-border">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary animate-pulse" />
              ร่างโครงสร้างเทมเพลตด้วย AI
            </DialogTitle>
            <DialogDescription>
              อธิบายประเภทงานที่ต้องการสร้างเทมเพลต แล้วระบบ AI จะเขียนโครงสร้างกลุ่มงาน (Groups), งานย่อย (Tasks), และเช็คลิสต์ย่อย (Subtasks) ให้ทันที
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">ระดับโครงสร้างเทมเพลต (Template Type)</Label>
              <Select value={aiType} onValueChange={(val: any) => setAiType(val)}>
                <SelectTrigger className="rounded-xl h-10">
                  <SelectValue placeholder="เลือกระดับเทมเพลต" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="project">Project / Tab Level (แบ่งหลายกลุ่มงานในหน้าเดียว)</SelectItem>
                  <SelectItem value="group">Task Group Level (มีกลุ่มงานเดียวที่มีหลายการ์ด)</SelectItem>
                  <SelectItem value="task">Checklist / Tasks (มีรายการเช็คลิสต์ย่อย ๆ)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">คำอธิบายงานเพื่อป้อน AI (Prompt)</Label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="เช่น: 
- การเตรียมติดตั้งและขึ้นระบบ WordPress ตั้งแต่ตกลงขอบเขตงานถึงมอบหมายงาน
- แคมเปญยิงโฆษณา Facebook และวิเคราะห์คีย์เวิร์ด
- เช็คลิสต์ตรวจสอบความเรียบร้อยก่อนส่งมอบเว็บไซต์งานลูกค้า"
                className="w-full h-32 bg-background border border-border/80 rounded-xl p-3.5 text-sm outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-sans"
                disabled={isGeneratingAi}
              />
            </div>
          </div>

          <DialogFooter className="gap-2 border-t border-border/40 pt-3">
            <Button variant="outline" onClick={() => setIsAiOpen(false)} disabled={isGeneratingAi} className="rounded-xl h-10">
              ยกเลิก
            </Button>
            <Button
              onClick={handleGenerateAiTemplate}
              disabled={!aiPrompt.trim() || isGeneratingAi}
              className="rounded-xl h-10 px-6 font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white gap-2"
            >
              {isGeneratingAi ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังคิดโครงสร้าง...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  ร่างเทมเพลตด้วย AI
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* TEMPLATE EDITOR DIALOG */}
      <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
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
              <Button type="button" variant="outline" onClick={() => setIsEditorOpen(false)} className="rounded-xl h-10 px-5 text-sm">
                ยกเลิก
              </Button>
              <Button type="submit" className="rounded-xl h-10 px-6 text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90">
                {editingTemplate ? 'บันทึกการแก้ไข' : 'บันทึกเทมเพลต'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
