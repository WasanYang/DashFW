'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus,
  Trash2,
  Edit2,
  Sparkles,
  ListTodo,
  FolderKanban,
  LayoutGrid,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import {
  useGetTaskTemplatesQuery,
  useDeleteTaskTemplateMutation,
} from '@/services/taskTemplateApiSlice';
import { useToast } from '@/hooks/use-toast';
import { TemplateAiDialog } from './template-ai-dialog';
import { TemplateEditorDialog } from './template-editor-dialog';
import { TemplateModel } from '@/lib/types';


export function TemplateList() {
  const { data: templates = [], isLoading } = useGetTaskTemplatesQuery();
  const [deleteTemplate] = useDeleteTaskTemplateMutation();
  const { toast } = useToast();

  // Modal Dialogs States
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isAiOpen, setIsAiOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<TemplateModel | null>(null);
  const [prepopulatedData, setPrepopulatedData] = useState<any>(null);

  const handleOpenCreate = () => {
    setEditingTemplate(null);
    setPrepopulatedData(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (tpl: TemplateModel) => {
    setEditingTemplate(tpl);
    setPrepopulatedData(null);
    setIsEditorOpen(true);
  };

  const handleAiGenerated = (data: any) => {
    setEditingTemplate(null);
    setPrepopulatedData(data);
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

  return (
    <div className="flex flex-col gap-4 w-full min-h-full p-4 sm:p-6">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground/90 px-1 mb-2">Templates</h1>
          <p className="text-xs text-muted-foreground px-1">
            สร้างและนำเทมเพลตรายการงานไปใช้จริงในหน้าบอร์ดโครงการ
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
        <Card className="border-dashed border-border/80 bg-card flex flex-col items-center justify-center p-16 text-center shadow-xs">
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
                    <ListTodo className="w-3 h-3 mr-1" /> Task Template
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 border-t border-border/40 bg-card p-4 flex items-center justify-between">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">
                  {(() => {
                    if (tpl.type === 'task') return `${tpl.data?.subTasks?.length || 0} Tasks`;
                    if (tpl.type === 'group') return `${tpl.data?.groups?.[0]?.tasks?.length || 0} Tasks`;
                    if (tpl.type === 'project') {
                      const count = (tpl.data?.groups || []).reduce((sum: number, g: any) => sum + (g.tasks?.length || 0), 0);
                      return `${count} Tasks`;
                    }
                    return '0 Tasks';
                  })()}
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
      <TemplateAiDialog
        open={isAiOpen}
        onOpenChange={setIsAiOpen}
        onGenerated={handleAiGenerated}
      />

      {/* TEMPLATE EDITOR DIALOG */}
      <TemplateEditorDialog
        open={isEditorOpen}
        onOpenChange={setIsEditorOpen}
        editingTemplate={editingTemplate}
        prepopulatedData={prepopulatedData}
      />
    </div>
  );
}
