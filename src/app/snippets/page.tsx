import { SnippetGenerator } from "@/components/snippets/snippet-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockSnippets } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function SnippetsPage() {
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
            <div className="space-y-4">
            {mockSnippets.map((snippet) => (
                <Card key={snippet.id}>
                    <CardHeader className="flex flex-row justify-between items-start">
                        <div className="space-y-1">
                            <CardTitle className="text-lg">{snippet.title}</CardTitle>
                             <div className="flex gap-2">
                                {snippet.tags.map(tag => <Badge key={tag} variant="secondary">{tag}</Badge>)}
                            </div>
                        </div>
                        <Button variant="ghost" size="icon">
                            <Copy className="h-4 w-4" />
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground font-code">{snippet.content}</p>
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}
