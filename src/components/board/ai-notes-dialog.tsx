'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, Loader2, Plus, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AiNotesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isGenerating: boolean;
  onGenerate: (rawText: string) => Promise<any[] | null>;
  onSave: (sections: any[], overwrite: boolean) => Promise<void>;
}

export const AiNotesDialog: React.FC<AiNotesDialogProps> = ({
  open,
  onOpenChange,
  isGenerating,
  onGenerate,
  onSave,
}) => {
  const [aiNotesRawText, setAiNotesRawText] = useState('');
  const [aiNotesPreviewSections, setAiNotesPreviewSections] = useState<any[] | null>(null);
  const [aiNotesPreviewActiveTab, setAiNotesPreviewActiveTab] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  const handleClose = () => {
    setAiNotesRawText('');
    setAiNotesPreviewSections(null);
    setAiNotesPreviewActiveTab(0);
    onOpenChange(false);
  };

  const handleGenerate = async () => {
    if (!aiNotesRawText.trim()) return;
    const sections = await onGenerate(aiNotesRawText);
    if (sections) {
      setAiNotesPreviewSections(sections);
      setAiNotesPreviewActiveTab(0);
    }
  };

  const handleSave = async (overwrite: boolean) => {
    if (!aiNotesPreviewSections) return;
    setIsSaving(true);
    try {
      await onSave(aiNotesPreviewSections, overwrite);
      handleClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if (!val) handleClose();
      else onOpenChange(true);
    }}>
      <DialogContent className="rounded-2xl max-w-2xl h-[80vh] flex flex-col bg-background border border-border">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
            สร้างและจัดระเบียบแท็บด้วย AI
          </DialogTitle>
          <DialogDescription>
            วางข้อมูลดิบ เช่น รายละเอียดโครงการ, บรีฟลูกค้า, หรือรหัสเข้าสู่ระบบต่างๆ แล้ว AI จะทำการวิเคราะห์และสร้างแถบข้อมูลให้โดยอัตโนมัติ
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow flex flex-col gap-4 overflow-hidden my-2">
          {!aiNotesPreviewSections ? (
            // STEP 1: Input text area
            <div className="flex-1 flex flex-col gap-2 overflow-hidden">
              <label className="text-xs font-semibold text-muted-foreground">ข้อมูลดิบโครงการ (Raw Data)</label>
              <textarea
                value={aiNotesRawText}
                onChange={(e) => setAiNotesRawText(e.target.value)}
                placeholder="ตัวอย่างเช่น:
- ข้อมูลลูกค้า: บริษัท เทคโนโลยี จำกัด ผู้ติดต่อ คุณเอ โทร 081-xxxxxxx
- รายละเอียดงาน: สร้างเว็บไซต์โปรโมทบริการขนาด 5 หน้า และตั้งค่าแคมเปญ Facebook Ads
- ข้อมูลเข้าใช้งาน:
  1. Hosting: Username: user123 / Password: password123 (Server IP: 122.11.2.1)
  2. WordPress: URL: dev.tech.com/wp-admin, User: admin, Pass: passwp456
- คีย์เวิร์ดต้องการเน้น: บริษัทพัฒนาเว็บ, ทำเว็บเชียงใหม่, รับทำระบบ"
                className="flex-1 w-full bg-background border border-border/80 rounded-xl p-3.5 text-sm font-medium outline-none focus-visible:ring-1 focus-visible:ring-primary resize-none font-mono"
                disabled={isGenerating}
              />
            </div>
          ) : (
            // STEP 2: Preview generated sections
            <div className="flex-grow flex flex-col gap-4 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground">ผลลัพธ์การจัดระเบียบของ AI (AI Preview)</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-xs text-primary"
                  onClick={() => {
                    setAiNotesPreviewSections(null);
                  }}
                  disabled={isSaving}
                >
                  แก้ไขข้อมูลดิบใหม่
                </Button>
              </div>

              {/* Preview Tabs */}
              <div className="flex items-center gap-1.5 border-b border-border/80 pb-2 overflow-x-auto scrollbar-none shrink-0">
                {aiNotesPreviewSections.map((sec, idx) => (
                  <button
                    key={idx}
                    onClick={() => setAiNotesPreviewActiveTab(idx)}
                    className={cn(
                      "px-3 py-1.5 text-xs font-bold border rounded-lg transition-colors",
                      aiNotesPreviewActiveTab === idx
                        ? "bg-primary/10 text-primary border-primary/20"
                        : "bg-card/60 border-border/60 text-muted-foreground hover:bg-card hover:text-foreground shadow-2xs"
                    )}
                  >
                    {sec.title}
                  </button>
                ))}
              </div>

              {/* Preview Tab Content */}
              <div className="flex-1 overflow-y-auto border border-border/80 bg-card rounded-xl p-4 shadow-xs">
                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-xs leading-relaxed space-y-4"
                  dangerouslySetInnerHTML={{ __html: aiNotesPreviewSections[aiNotesPreviewActiveTab]?.content || '' }}
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2.5 pt-3 border-t border-border/40 shrink-0">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isGenerating || isSaving}
            className="rounded-xl h-10 px-5 text-sm"
          >
            ยกเลิก
          </Button>

          {!aiNotesPreviewSections ? (
            <Button
              onClick={handleGenerate}
              disabled={!aiNotesRawText.trim() || isGenerating}
              className="rounded-xl h-10 px-6 text-sm font-semibold bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90 text-white gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  กำลังเรียบเรียงข้อมูล...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-white" />
                  วิเคราะห์และสร้างแท็บ
                </>
              )}
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => handleSave(false)}
                disabled={isSaving}
                className="rounded-xl h-10 px-5 text-sm text-foreground gap-1.5"
              >
                <Plus className="w-4 h-4" />
                บันทึกต่อท้าย (Append)
              </Button>
              <Button
                onClick={() => handleSave(true)}
                disabled={isSaving}
                className="rounded-xl h-10 px-5 text-sm bg-primary text-primary-foreground font-semibold gap-1.5"
              >
                <Check className="w-4 h-4" />
                บันทึกทับทั้งหมด (Overwrite)
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
