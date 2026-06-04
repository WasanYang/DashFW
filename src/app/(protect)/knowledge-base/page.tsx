"use client";

import { useState } from "react";
import {
  useGetArticlesQuery,
  useAddArticleMutation,
  useUpdateArticleMutation,
  useDeleteArticleMutation,
} from "@/services/knowledgeBaseApiSlice";
import { useGetJobTypesQuery } from "@/services/jobTypeApiSlice";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditableNovelField } from "@/components/ui/editable-novel-field";
import {
  BookOpen,
  Search,
  Plus,
  Copy,
  Check,
  Trash2,
  Tag,
  ChevronRight,
  Save,
  Edit2,
  X,
  FileText,
  Key,
  Loader2
} from "lucide-react";

export default function KnowledgeBasePage() {
  const { data: articles = [], isLoading: isLoadingArticles } = useGetArticlesQuery();
  const { data: jobTypes = [] } = useGetJobTypesQuery();

  const [addArticle] = useAddArticleMutation();
  const [updateArticle] = useUpdateArticleMutation();
  const [deleteArticle] = useDeleteArticleMutation();

  const { toast } = useToast();

  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJobTypeFilter, setSelectedJobTypeFilter] = useState<string>("all");

  // Local states for editing credentials / details
  const [isEditingCredentials, setIsEditingCredentials] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editJobTypeId, setEditJobTypeId] = useState<string>("none");
  const [editTags, setEditTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [editCreds, setEditCreds] = useState<{ id: string; label: string; value: string }[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeArticle = articles.find(
    (a) => a.id === selectedArticleId || a._id === selectedArticleId
  );

  // Initialize form values when active article changes
  const selectArticle = (id: string) => {
    setSelectedArticleId(id);
    const art = articles.find((a) => a.id === id || a._id === id);
    if (art) {
      setEditTitle(art.title);
      setEditJobTypeId(art.jobTypeId || "none");
      setEditTags(art.tags || []);
      setEditCreds(art.quickCredentials || []);
      setIsEditingCredentials(false);
    }
  };

  const handleCopy = (id: string, text: string) => {
    if (!text) {
      toast({
        title: "ไม่มีข้อความให้คัดลอก",
        variant: "destructive",
      });
      return;
    }
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({
      title: "คัดลอกแล้ว!",
      description: `คัดลอก "${text}" ลงคลิปบอร์ดแล้ว`,
    });
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCreateArticle = async () => {
    try {
      const result = await addArticle({
        title: "คู่มือการทำงานใหม่",
        content: "<p>พิมพ์เนื้อหาคู่มือที่นี่...</p>",
        tags: ["New"],
        quickCredentials: [
          { id: "1", label: "ตัวอย่างหัวข้อความต้องการ", value: "ตัวอย่างข้อมูล" }
        ],
        jobTypeId: undefined
      }).unwrap();

      toast({
        title: "สำเร็จ!",
        description: "สร้างบทความใหม่แล้ว",
      });

      if (result.id || result._id) {
        selectArticle((result.id || result._id) as string);
      }
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถสร้างบทความได้",
        variant: "destructive",
      });
    }
  };

  const handleSaveMeta = async () => {
    if (!activeArticle) return;
    try {
      await updateArticle({
        id: (activeArticle.id || activeArticle._id)!,
        data: {
          title: editTitle,
          jobTypeId: editJobTypeId === "none" ? undefined : editJobTypeId,
          tags: editTags,
          quickCredentials: editCreds,
        },
      }).unwrap();

      toast({
        title: "บันทึกสำเร็จ",
        description: "บันทึกรายละเอียดข้อมูลบทความแล้ว",
      });
      setIsEditingCredentials(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถบันทึกข้อมูลได้",
        variant: "destructive",
      });
    }
  };

  const handleContentChange = async (newHTML: string) => {
    if (!activeArticle) return;
    try {
      await updateArticle({
        id: (activeArticle.id || activeArticle._id)!,
        data: {
          content: newHTML,
        },
      }).unwrap();
    } catch (err) {
      console.error(err);
      toast({
        title: "ล้มเหลว",
        description: "ไม่สามารถบันทึกเนื้อหาบทความได้",
        variant: "destructive",
      });
    }
  };

  const handleDeleteArticle = async () => {
    if (!activeArticle) return;
    if (!confirm("คุณต้องการลบบทความคลังความรู้นี้ใช่หรือไม่?")) return;

    try {
      await deleteArticle((activeArticle.id || activeArticle._id)!).unwrap();
      toast({
        title: "สำเร็จ",
        description: "ลบบทความเรียบร้อยแล้ว",
      });
      setSelectedArticleId(null);
    } catch (err) {
      console.error(err);
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถลบบทความได้",
        variant: "destructive",
      });
    }
  };

  // Add / Edit credential row handlers
  const handleAddCredRow = () => {
    setEditCreds([
      ...editCreds,
      { id: Date.now().toString(), label: "หัวข้อข้อมูล", value: "" },
    ]);
  };

  const handleUpdateCredRow = (id: string, field: "label" | "value", text: string) => {
    setEditCreds(
      editCreds.map((c) => (c.id === id ? { ...c, [field]: text } : c))
    );
  };

  const handleRemoveCredRow = (id: string) => {
    setEditCreds(editCreds.filter((c) => c.id !== id));
  };

  // Tag helper
  const handleAddTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim())) {
      setEditTags([...editTags, newTag.trim()]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditTags(editTags.filter((t) => t !== tagToRemove));
  };

  // Filter logic
  const filteredArticles = articles.filter((art) => {
    const matchesSearch =
      art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (art.tags && art.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));
    const matchesJobType =
      selectedJobTypeFilter === "all" || art.jobTypeId === selectedJobTypeFilter;
    return matchesSearch && matchesJobType;
  });

  return (
    <div className="flex h-[calc(100vh-2rem)] w-full gap-4 p-4 overflow-hidden">
      {/* LEFT SIDEBAR: Lists & Filters */}
      <div className="w-80 flex flex-col bg-card border border-border/50 rounded-2xl p-4 shadow-sm shrink-0">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h1 className="text-lg font-bold tracking-tight text-foreground/90">คลังความรู้</h1>
          </div>
          <Button size="icon" variant="ghost" onClick={handleCreateArticle} className="h-8 w-8 text-primary hover:bg-primary/10">
            <Plus className="h-4.5 w-4.5" />
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ค้นหาคู่มือ..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9 text-xs rounded-xl"
          />
        </div>

        {/* Job Type Filter Dropdown */}
        <div className="mb-4">
          <Label className="text-[10px] text-muted-foreground mb-1 block">ประเภทของงาน (Job Type)</Label>
          <Select value={selectedJobTypeFilter} onValueChange={setSelectedJobTypeFilter}>
            <SelectTrigger className="h-9 text-xs rounded-xl">
              <SelectValue placeholder="ทุกประเภทงาน" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">ทุกประเภทงาน</SelectItem>
              {jobTypes.map((jt) => (
                <SelectItem key={jt._id || jt.id} value={(jt._id || jt.id)!}>
                  {jt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Article Lists */}
        <div className="flex-1 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
          {isLoadingArticles ? (
            <div className="flex justify-center items-center py-12 text-muted-foreground text-xs gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>กำลังโหลดคู่มือ...</span>
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground text-xs">
              ไม่พบข้อมูลคู่มือในหมวดหมู่นี้
            </div>
          ) : (
            filteredArticles.map((art) => {
              const isActive = art.id === selectedArticleId || art._id === selectedArticleId;
              const associatedJobType = jobTypes.find((jt) => jt._id === art.jobTypeId || jt.id === art.jobTypeId);

              return (
                <button
                  key={art.id || art._id}
                  onClick={() => selectArticle((art.id || art._id)!)}
                  className={`w-full text-left p-3 rounded-xl transition-all duration-200 border flex flex-col gap-1.5 ${
                    isActive
                      ? "bg-primary/5 border-primary/30 text-foreground font-bold shadow-2xs"
                      : "bg-transparent border-transparent hover:bg-muted/50 text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex justify-between items-start gap-1">
                    <span className="text-xs truncate font-semibold line-clamp-1">{art.title}</span>
                    <ChevronRight className={`h-3.5 w-3.5 mt-0.5 shrink-0 transition-transform ${isActive ? "rotate-90 text-primary" : ""}`} />
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {associatedJobType && (
                      <Badge variant="outline" className="text-[9px] py-0 px-1.5 border-primary/20 text-primary bg-primary/5">
                        {associatedJobType.name}
                      </Badge>
                    )}
                    {(art.tags || []).slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] text-muted-foreground/80 bg-muted px-1.5 py-0.5 rounded-sm">
                        #{t}
                      </span>
                    ))}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT SIDEBAR: Content View & Notion Editor */}
      <div className="flex-1 flex flex-col bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm">
        {activeArticle ? (
          <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header Toolbar */}
            <div className="flex justify-between items-center p-4 border-b border-border/40 shrink-0">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <span className="text-xs font-semibold text-muted-foreground">แก้ไขรายละเอียดคู่มือ</span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleDeleteArticle}
                  className="h-8 text-destructive hover:bg-destructive/10 hover:text-destructive text-xs"
                >
                  <Trash2 className="h-4 w-4 mr-1.5" />
                  ลบข้อมูล
                </Button>
              </div>
            </div>

            {/* Scrollable details view */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
              {/* Metadata Panel (Title, JobType mapping, Tags) */}
              <div className="bg-muted/30 border border-border/30 rounded-xl p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
                    <Tag className="h-4 w-4 text-primary" />
                    ข้อมูลจำแนกคู่มือ
                  </h3>
                  {!isEditingCredentials ? (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditingCredentials(true)} className="h-7 text-xs px-2.5 text-primary hover:bg-primary/10">
                      <Edit2 className="h-3 w-3 mr-1" />
                      แก้ไขรายละเอียด
                    </Button>
                  ) : (
                    <div className="flex gap-1.5">
                      <Button variant="outline" size="sm" onClick={() => {
                        setIsEditingCredentials(false);
                        // reset local state
                        setEditTitle(activeArticle.title);
                        setEditJobTypeId(activeArticle.jobTypeId || "none");
                        setEditTags(activeArticle.tags || []);
                        setEditCreds(activeArticle.quickCredentials || []);
                      }} className="h-7 text-xs px-2.5">
                        ยกเลิก
                      </Button>
                      <Button variant="default" size="sm" onClick={handleSaveMeta} className="h-7 text-xs px-2.5 bg-primary text-primary-foreground hover:bg-primary/95">
                        <Save className="h-3 w-3 mr-1" />
                        บันทึก
                      </Button>
                    </div>
                  )}
                </div>

                {!isEditingCredentials ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">หัวข้อคู่มือ</Label>
                      <p className="text-sm font-bold text-foreground">{activeArticle.title}</p>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">ประเภทงานที่เชื่อมโยง (Job Type)</Label>
                      <p className="text-sm">
                        {jobTypes.find((jt) => jt._id === activeArticle.jobTypeId || jt.id === activeArticle.jobTypeId)?.name || (
                          <span className="text-muted-foreground/60 text-xs italic">ไม่มีการเชื่อมโยง</span>
                        )}
                      </p>
                    </div>

                    <div className="md:col-span-2 space-y-1">
                      <Label className="text-[10px] text-muted-foreground">ป้ายกำกับ (Tags)</Label>
                      <div className="flex flex-wrap gap-1.5 mt-0.5">
                        {(activeArticle.tags || []).length === 0 ? (
                          <span className="text-muted-foreground/60 text-xs italic">ไม่มีป้ายกำกับ</span>
                        ) : (
                          activeArticle.tags.map((t) => (
                            <Badge key={t} variant="secondary" className="text-[10px] font-semibold text-muted-foreground/90 bg-muted/90 py-0.5">
                              #{t}
                            </Badge>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">หัวข้อคู่มือ</Label>
                        <Input
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          className="h-8.5 text-xs rounded-xl"
                        />
                      </div>

                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">เชื่อมโยงประเภทงาน (Job Type)</Label>
                        <Select value={editJobTypeId} onValueChange={setEditJobTypeId}>
                          <SelectTrigger className="h-8.5 text-xs rounded-xl">
                            <SelectValue placeholder="เลือกประเภทงาน" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">ไม่เชื่อมโยง</SelectItem>
                            {jobTypes.map((jt) => (
                              <SelectItem key={jt._id || jt.id} value={(jt._id || jt.id)!}>
                                {jt.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-[10px] text-muted-foreground">ป้ายกำกับ (Tags)</Label>
                      <div className="flex flex-wrap gap-1.5 mb-1.5">
                        {editTags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-[10px] py-0.5 flex items-center gap-1">
                            #{tag}
                            <button type="button" onClick={() => handleRemoveTag(tag)} className="hover:text-destructive">
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="เพิ่มแท็กใหม่..."
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
                          className="h-8 text-xs max-w-[200px] rounded-lg"
                        />
                        <Button type="button" size="sm" onClick={handleAddTag} className="h-8 text-xs rounded-lg">
                          เพิ่ม
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* QUICK CREDENTIALS PANEL */}
              <div className="bg-card border border-border/60 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="flex justify-between items-center">
                  <div className="space-y-0.5">
                    <h3 className="text-xs font-bold text-foreground/95 flex items-center gap-1.5">
                      <Key className="h-4.5 w-4.5 text-primary" />
                      ช่องข้อมูลด่วน (Quick Credentials & Client Requirements)
                    </h3>
                    <p className="text-[10px] text-muted-foreground">ฟิลด์ข้อความสำหรับคัดลอกด่วน เพื่อส่งต่อให้ลูกค้าหรือทีมงาน</p>
                  </div>
                  {isEditingCredentials && (
                    <Button variant="outline" size="sm" onClick={handleAddCredRow} className="h-7 text-xs px-2.5 text-primary hover:bg-primary/10 border-primary/20">
                      <Plus className="h-3.5 w-3.5 mr-1" />
                      เพิ่มหัวข้อ
                    </Button>
                  )}
                </div>

                {editCreds.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground text-xs italic bg-muted/20 border border-dashed rounded-xl">
                    ยังไม่มีการระบุข้อมูลด่วนสำหรับบทความนี้
                  </div>
                ) : !isEditingCredentials ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {editCreds.map((cred) => (
                      <div key={cred.id} className="flex items-center justify-between p-2.5 bg-muted/40 hover:bg-muted/70 border border-border/30 rounded-xl transition-all">
                        <div className="min-w-0 pr-2">
                          <span className="block text-[9px] uppercase tracking-wider text-muted-foreground font-bold">{cred.label || "ไม่มีหัวข้อ"}</span>
                          <span className="block text-xs font-medium text-foreground/90 truncate mt-0.5 select-all">
                            {cred.value || <span className="text-muted-foreground/40 italic">ว่างเปล่า (รอการกรอก)</span>}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleCopy(cred.id, cred.value)}
                          className="h-8 w-8 text-muted-foreground hover:text-primary shrink-0"
                        >
                          {copiedId === cred.id ? (
                            <Check className="h-4 w-4 text-green-500" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
                    {editCreds.map((cred) => (
                      <div key={cred.id} className="flex gap-2 items-center">
                        <Input
                          placeholder="ชื่อหัวข้อ (เช่น Gmail, รหัสผ่าน)"
                          value={cred.label}
                          onChange={(e) => handleUpdateCredRow(cred.id, "label", e.target.value)}
                          className="h-8.5 text-xs rounded-xl flex-1 max-w-[200px]"
                        />
                        <Input
                          placeholder="ค่าข้อมูลที่ต้องการเก็บ / คำถามคำอธิบาย"
                          value={cred.value}
                          onChange={(e) => handleUpdateCredRow(cred.id, "value", e.target.value)}
                          className="h-8.5 text-xs rounded-xl flex-2"
                        />
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveCredRow(cred.id)}
                          className="h-8.5 w-8.5 text-destructive hover:bg-destructive/10 shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* RICH-TEXT EDITOR SECTION */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground/90 block px-1">เนื้อหาคู่มือและรายการเอกสารที่ต้องขอ (Notion-Style Guide)</Label>
                <div className="border border-border/40 rounded-2xl overflow-hidden shadow-2xs">
                  <EditableNovelField
                    value={activeArticle.content}
                    onChange={handleContentChange}
                  />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="h-16 w-16 bg-primary/5 rounded-full flex items-center justify-center mb-4 text-primary animate-pulse">
              <BookOpen className="h-8 w-8" />
            </div>
            <h2 className="text-lg font-bold text-foreground/90">ยินดีต้อนรับสู่คลังความรู้การทำงาน</h2>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mb-4 leading-relaxed">
              เลือกบทความแนะนำเพื่อเปิดดูแนวทางการทำงาน หรือสร้างบทความความต้องการใหม่ เพื่อบันทึกและส่งมอบให้ลูกค้าและผู้ร่วมทีม
            </p>
            <Button onClick={handleCreateArticle} className="gap-1.5 h-9 text-xs rounded-xl">
              <Plus className="h-4 w-4" />
              สร้างบทความคู่มือแรก
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
