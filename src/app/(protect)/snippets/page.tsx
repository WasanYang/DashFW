"use client";

import { SnippetGenerator } from "@/components/snippets/snippet-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useGetSnippetsQuery, useDeleteSnippetMutation } from "@/services/snippetApiSlice";
import { useToast } from "@/hooks/use-toast";

export default function SnippetsPage() {
  const { data: snippets = [], isLoading } = useGetSnippetsQuery();
  const [deleteSnippet] = useDeleteSnippetMutation();
  const { toast } = useToast();

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: "คัดลอกแล้ว!",
      description: "คัดลอกข้อความลงคลิปบอร์ดแล้ว",
    });
  };

  const handleDelete = async (id: string) => {
    if (confirm("ต้องการลบข้อความนี้ใช่หรือไม่?")) {
      try {
        await deleteSnippet(id).unwrap();
        toast({
          title: "สำเร็จ!",
          description: "ลบข้อความสำเร็จ",
        });
      } catch (err) {
        console.error(err);
        toast({
          title: "ล้มเหลว",
          description: "ไม่สามารถลบข้อความได้",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>AI-Powered Snippet Generator</CardTitle>
          </CardHeader>
          <CardContent>
            <SnippetGenerator />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Snippet Manager</h1>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">กำลังโหลดข้อความ...</div>
            ) : (
              <div className="space-y-4">
                {snippets.length === 0 && (
                  <p className="text-muted-foreground text-center py-8">ยังไม่มีการบันทึกข้อความ</p>
                )}
                {snippets.map((snippet) => (
                    <Card key={snippet.id || snippet._id}>
                        <CardHeader className="flex flex-row justify-between items-start">
                            <div className="space-y-1">
                                <CardTitle className="text-lg">{snippet.title}</CardTitle>
                                 <div className="flex gap-2">
                                    {snippet.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                                </div>
                            </div>
                            <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => copyToClipboard(snippet.content)}>
                                    <Copy className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(snippet.id || snippet._id || '')}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <p className="text-muted-foreground font-code whitespace-pre-wrap">{snippet.content}</p>
                        </CardContent>
                    </Card>
                ))}
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
