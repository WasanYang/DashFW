'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createAiChecklist } from '@/ai/flows/ai-checklist-creator-flow';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Bot, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  description: z.string().min(10, { message: "Description must be at least 10 characters." }),
});

type FormValues = z.infer<typeof FormSchema>;

export function ChecklistGenerator() {
  const [generatedItems, setGeneratedItems] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      description: '',
    },
  });

  const onSubmit: SubmitHandler<FormValues> = async (data) => {
    setIsLoading(true);
    setGeneratedItems([]);
    try {
      const result = await createAiChecklist(data);
      setGeneratedItems(result.checklistItems);
    } catch (error) {
      console.error("Checklist generation failed:", error);
      toast({
        title: "Error",
        description: "Failed to generate checklist. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Service/Project Description</FormLabel>
                <FormControl>
                  <Textarea placeholder="e.g., A complete setup for a new restaurant on a food delivery platform." {...field} />
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
            Generate Checklist
          </Button>
        </form>
      </Form>

      {generatedItems.length > 0 && (
        <Card>
          <CardContent className="p-4 space-y-2">
            <h4 className="font-semibold mb-2">Generated Checklist</h4>
            {generatedItems.map((item, index) => (
                <div key={index} className="flex items-center space-x-2">
                    <Checkbox id={`gen-item-${index}`} />
                    <Label htmlFor={`gen-item-${index}`}>{item}</Label>
                </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
