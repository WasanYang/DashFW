"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Edit2, Trash2, Plus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export type JobType = {
  _id?: string;
  name: string;
  description?: string;
};

export default function JobTypeManager() {
  const [jobTypes, setJobTypes] = useState<JobType[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<JobType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchJobTypes();
  }, []);

  async function fetchJobTypes() {
    setIsLoading(true);
    try {
      const res = await fetch("/api/job-type");
      setJobTypes(await res.json());
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      if (editing) {
        await fetch("/api/job-type", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _id: editing._id, name: name.trim(), description: description.trim() }),
        });
        toast({
          title: "สำเร็จ!",
          description: "แก้ไขประเภทงานเรียบร้อยแล้ว",
        });
      } else {
        await fetch("/api/job-type", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), description: description.trim() }),
        });
        toast({
          title: "สำเร็จ!",
          description: "เพิ่มประเภทงานเรียบร้อยแล้ว",
        });
      }
      setName("");
      setDescription("");
      setEditing(null);
      fetchJobTypes();
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกประเภทงานได้",
        variant: "destructive",
      });
    }
  }

  async function handleEdit(jobType: JobType) {
    setEditing(jobType);
    setName(jobType.name);
    setDescription(jobType.description || "");
  }

  async function handleDelete(id?: string) {
    if (!id) return;
    if (!confirm("ต้องการลบประเภทงานนี้ใช่หรือไม่?")) return;
    try {
      await fetch(`/api/job-type?id=${id}`, { method: "DELETE" });
      toast({
        title: "สำเร็จ!",
        description: "ลบประเภทงานเรียบร้อยแล้ว",
      });
      fetchJobTypes();
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบประเภทงานได้",
        variant: "destructive",
      });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
      {/* Column 1: Add/Edit Form */}
      <div className="lg:col-span-1">
        <Card className="sticky top-24">
          <CardHeader>
            <CardTitle>{editing ? "แก้ไขประเภทงาน" : "เพิ่มประเภทงานใหม่"}</CardTitle>
            <CardDescription>
              {editing ? "ทำการแก้ไขข้อมูลประเภทงานด้านล่าง" : "กรอกข้อมูลเพื่อระบุประเภทงานใหม่ในระบบ"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">ชื่อประเภทงาน</label>
                <Input
                  placeholder="เช่น Facebook Page, Website Design"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">รายละเอียดเพิ่มเติม (คำอธิบาย)</label>
                <Input
                  placeholder="เช่น บริการตั้งค่าและเขียนคอนเทนต์"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" className="flex-grow">
                  {editing ? "บันทึกการแก้ไข" : "เพิ่มประเภทงาน"}
                </Button>
                {editing && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => {
                      setEditing(null);
                      setName("");
                      setDescription("");
                    }}
                  >
                    ยกเลิก
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Column 2: Cards Grid View */}
      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">ประเภทของงาน</h1>
          <Button variant="outline" size="icon" onClick={fetchJobTypes} disabled={isLoading}>
            <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {isLoading && jobTypes.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">กำลังโหลดข้อมูล...</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {jobTypes.length === 0 && (
              <p className="text-muted-foreground text-center col-span-2 py-12 border border-dashed rounded-xl">
                ยังไม่มีข้อมูลประเภทงานในฐานข้อมูล
              </p>
            )}
            {jobTypes.map(jt => (
              <Card key={jt._id} className="hover:shadow-md transition border border-border/60 bg-card">
                <CardHeader className="flex flex-row items-start justify-between pb-2 space-y-0">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold">{jt.name}</CardTitle>
                    {jt.description && (
                      <CardDescription className="text-sm line-clamp-3">{jt.description}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary"
                      onClick={() => handleEdit(jt)}
                      title="แก้ไข"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive text-muted-foreground"
                      onClick={() => handleDelete(jt._id)}
                      title="ลบ"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
