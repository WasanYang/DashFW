'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { aiPoweredSnippetGenerator } from '@/ai/flows/ai-powered-snippet-generator-flow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Bot, Copy, Loader2, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAddSnippetMutation } from '@/services/snippetApiSlice';

const FormSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
  context: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export function SnippetGenerator() {
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Save fields state
  const [saveTitle, setSaveTitle] = useState('');
  const [saveTags, setSaveTags] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [addSnippet] = useAddSnippetMutation();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      prompt: '',
      context: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedSnippet('');
    try {
      const result = await aiPoweredSnippetGenerator(data);
      setGeneratedSnippet(result.snippet);
      setSaveTitle(data.prompt.substring(0, 30));
      setSaveTags('AI Generated');
    } catch (error) {
      console.error("Snippet generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate snippet. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedSnippet);
    toast({
        title: "Copied!",
        description: "Snippet copied to clipboard.",
    });
  };

  const handleSaveSnippet = async () => {
    if (!saveTitle.trim()) {
      toast({
        title: "กรุณาระบุหัวข้อ",
        description: "โปรดระบุหัวข้อสำหรับข้อความนี้",
        variant: "destructive",
      });
      return;
    }
    setIsSaving(true);
    try {
      const tagsArray = saveTags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);
      await addSnippet({
        title: saveTitle.trim(),
        content: generatedSnippet,
        tags: tagsArray,
      }).unwrap();
      toast({
        title: "สำเร็จ!",
        description: "บันทึกข้อความลง Snippet Manager เรียบร้อยแล้ว",
      });
      setGeneratedSnippet('');
      setSaveTitle('');
      setSaveTags('');
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อความได้",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Prompt</FormLabel>
                <FormControl>
                  <Input placeholder="e.g., Opening pitch for a web dev project" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="context"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Additional Context (Optional)</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., Client is a small restaurant, needs online ordering." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={isLoading} className="w-full">
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Bot className="mr-2 h-4 w-4" />
            )}
            Generate Snippet
          </Button>
        </form>
      </Form>

      {generatedSnippet && (
        <Card className="border border-primary/20 bg-primary/5">
          <CardContent className="p-4 space-y-4 relative">
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={copyToClipboard} title="คัดลอก">
                <Copy className="h-4 w-4" />
            </Button>
            <div className="space-y-2 pr-8">
              <span className="text-xs font-semibold text-primary">ผลลัพธ์จาก AI:</span>
              <p className="font-code text-sm text-muted-foreground whitespace-pre-wrap">{generatedSnippet}</p>
            </div>
            
            <Separator className="bg-primary/20" />
            
            {/* Save snippet section */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-semibold text-muted-foreground">บันทึกลงใน Snippet Manager:</span>
              <div className="grid gap-2">
                <div className="space-y-1">
                  <Label htmlFor="save-title" className="text-xs">หัวข้อ (Title)</Label>
                  <Input
                    id="save-title"
                    className="h-8 text-xs bg-background"
                    placeholder="ระบุหัวข้อ เช่น เปิดดีลงานร้านอาหาร"
                    value={saveTitle}
                    onChange={(e) => setSaveTitle(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="save-tags" className="text-xs">แท็ก (คั่นด้วยจุลภาค เช่น Client, Pitch)</Label>
                  <Input
                    id="save-tags"
                    className="h-8 text-xs bg-background"
                    placeholder="เช่น AI, Pitch, Intro"
                    value={saveTags}
                    onChange={(e) => setSaveTags(e.target.value)}
                    disabled={isSaving}
                  />
                </div>
                <Button 
                  type="button" 
                  size="sm" 
                  className="w-full h-8 text-xs mt-1" 
                  disabled={isSaving || !saveTitle.trim()}
                  onClick={handleSaveSnippet}
                >
                  {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Save className="w-3.5 h-3.5 mr-1" />}
                  บันทึกลงฐานข้อมูล
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Add simple Separator inside this file since it might not be imported or created locally
function Separator({ className }: { className?: string }) {
  return <div className={`h-[1px] w-full bg-border ${className}`} />;
}

