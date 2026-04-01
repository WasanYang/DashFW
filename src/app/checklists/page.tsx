import { ChecklistGenerator } from "@/components/checklists/checklist-generator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockChecklists } from "@/lib/data";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";

export default function ChecklistsPage() {
  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>AI-Powered Checklist Creator</CardTitle>
          </CardHeader>
          <CardContent>
            <ChecklistGenerator />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <div className="space-y-8">
            <h1 className="text-3xl font-bold">Checklist Templates</h1>
            <div className="space-y-4">
            {mockChecklists.map((checklist) => (
                <Card key={checklist.id}>
                    <CardHeader>
                        <CardTitle className="text-lg">{checklist.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {checklist.items.map((item) => (
                            <div key={item.id} className="flex items-center space-x-2">
                                <Checkbox id={`${checklist.id}-${item.id}`} defaultChecked={item.completed} />
                                <Label htmlFor={`${checklist.id}-${item.id}`} className={item.completed ? 'line-through text-muted-foreground' : ''}>
                                    {item.text}
                                </Label>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            ))}
            </div>
        </div>
      </div>
    </div>
  );
}
