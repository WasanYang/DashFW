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
import { Bot, Copy, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const FormSchema = z.object({
  prompt: z.string().min(10, { message: "Prompt must be at least 10 characters." }),
  context: z.string().optional(),
});

type FormValues = z.infer<typeof FormSchema>;

export function SnippetGenerator() {
  const [generatedSnippet, setGeneratedSnippet] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

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
  }

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
        <Card>
          <CardContent className="p-4 relative">
             <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7" onClick={copyToClipboard}>
                <Copy className="h-4 w-4" />
            </Button>
            <p className="font-code text-sm text-muted-foreground pr-8">{generatedSnippet}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
