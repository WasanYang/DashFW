'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sparkles, Loader2 } from 'lucide-react';
import { generateAiTaskTemplate } from '@/ai/flows/ai-template-generator-flow';
import { useToast } from '@/hooks/use-toast';

interface TemplateAiDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (template: any) => void;
}

export function TemplateAiDialog({
  open,
  onOpenChange,
  onGenerated,
}: TemplateAiDialogProps) {
  const { toast } = useToast();
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiType, setAiType] = useState<'project' | 'group' | 'task'>('project');
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);

  const handleGenerateAiTemplate = async () => {
    if (!aiPrompt.trim()) return;
    setIsGeneratingAi(true);
    try {
      const res = await generateAiTaskTemplate({ prompt: aiPrompt.trim(), type: aiType });
      if (res) {
        onGenerated(res);
        onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
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
                <SelectItem value="project">Project / Tab Level (แบ่งหลายกลุ่มงาน in หน้าเดียว)</SelectItem>
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
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGeneratingAi} className="rounded-xl h-10">
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
  );
}
