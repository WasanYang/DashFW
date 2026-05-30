import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, ClipboardList } from "lucide-react";
import { JobType } from "@/lib/types";

type Props = {
  jobTypes: JobType[];
  onEdit: (jt: JobType) => void;
  onDelete: (id: string) => void;
};

export function JobTypeTable({ jobTypes, onEdit, onDelete }: Props) {
  if (jobTypes.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg bg-muted/50 border border-dashed border-muted-foreground/20">
        <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <ClipboardList className="w-12 h-12 mb-2 opacity-40 text-primary" />
          <div className="font-medium text-lg">ยังไม่มีประเภทงาน</div>
          <div className="text-sm">เริ่มต้นด้วยการเพิ่มประเภทงานใหม่</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {jobTypes.map((jt) => (
        <Card key={jt._id || jt.id} className="hover:shadow-md transition bg-card border border-border/60">
          <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
            <div className="space-y-1">
              <CardTitle className="text-xl font-bold">{jt.name}</CardTitle>
              {jt.description && (
                <CardDescription className="text-sm line-clamp-2">{jt.description}</CardDescription>
              )}
            </div>
            <div className="flex gap-1 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                onClick={() => onEdit(jt)}
                title="แก้ไข"
              >
                <Edit2 className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                onClick={() => onDelete(jt._id || jt.id || '')}
                title="ลบ"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 rounded-lg p-2.5">
              <ClipboardList className="w-4 h-4 text-primary" />
              <span>
                {jt.checklists && jt.checklists.length > 0
                  ? `${jt.checklists.length} รายการเช็คลิสต์`
                  : 'ไม่มีเช็คลิสต์เริ่มต้น'}
              </span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
