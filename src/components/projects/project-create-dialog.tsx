'use client';

import { useState } from 'react';
import { useAddProjectMutation } from '@/services/projectApi';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuCheckboxItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { FolderOpen, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ProjectCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: any[];
  jobTypes: any[];
  projects: any[];
}

export function ProjectCreateDialog({
  open,
  onOpenChange,
  clients,
  jobTypes,
  projects,
}: ProjectCreateDialogProps) {
  const [addProject, { isLoading: isCreating }] = useAddProjectMutation();
  const { toast } = useToast();

  const [newTitle, setNewTitle] = useState('');
  const [newSubtitle, setNewSubtitle] = useState('');
  const [newClientId, setNewClientId] = useState('');
  const [newDetails, setNewDetails] = useState('');
  const [newGrossPrice, setNewGrossPrice] = useState<number>(0);
  const [newHourlyRate, setNewHourlyRate] = useState<number>(0);
  const [newCurrency, setNewCurrency] = useState('THB');
  const [newStartDate, setNewStartDate] = useState('');
  const [newDeadline, setNewDeadline] = useState('');
  const [newColor, setNewColor] = useState('#3b82f6');
  const [newBillable, setNewBillable] = useState(true);
  const [newRelatedProjectIds, setNewRelatedProjectIds] = useState<string[]>([]);
  const [newPriority, setNewPriority] = useState<string>('Medium');
  const [newNotes, setNewNotes] = useState('');
  const [newJobTypeId, setNewJobTypeId] = useState('');

  const resetForm = () => {
    setNewTitle('');
    setNewSubtitle('');
    setNewClientId('');
    setNewDetails('');
    setNewGrossPrice(0);
    setNewHourlyRate(0);
    setNewCurrency('THB');
    setNewStartDate('');
    setNewDeadline('');
    setNewColor('#3b82f6');
    setNewBillable(true);
    setNewRelatedProjectIds([]);
    setNewPriority('Medium');
    setNewNotes('');
    setNewJobTypeId('');
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'กรุณากรอกชื่อโครงการ', variant: 'destructive' });
      return;
    }

    try {
      await addProject({
        title: newTitle.trim(),
        subtitle: newSubtitle.trim() || undefined,
        clientId: newClientId && newClientId !== 'none' ? newClientId : undefined,
        details: newDetails.trim() || undefined,
        startDate: newStartDate ? new Date(newStartDate) : undefined,
        deadline: newDeadline ? new Date(newDeadline) : undefined,
        gross_price: newGrossPrice,
        hourlyRate: newHourlyRate || undefined,
        currency: newCurrency,
        color: newColor,
        billable: newBillable,
        archived: false,
        status: 'New',
        priority: newPriority,
        notes: newNotes.trim() || undefined,
        jobTypeId: newJobTypeId && newJobTypeId !== 'none' ? newJobTypeId : undefined,
        relatedProjectIds: newRelatedProjectIds.length > 0 ? newRelatedProjectIds : undefined,
      }).unwrap();

      toast({ title: 'สำเร็จ!', description: 'สร้างโครงการใหม่เรียบร้อยแล้ว' });
      onOpenChange(false);
      resetForm();
    } catch (err) {
      toast({ title: 'เกิดข้อผิดพลาด', description: 'ไม่สามารถสร้างโครงการได้', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border border-border/50 shadow-2xl rounded-[24px] bg-background">
        <div className="bg-muted/30 px-6 py-5 border-b border-border/40">
          <DialogHeader>
            <DialogTitle className="font-bold text-xl flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" /> Create New Project
            </DialogTitle>
            <DialogDescription className="text-sm mt-1 text-muted-foreground/80">
              สร้างโครงการระดับบนสำหรับจัดเก็บงานย่อยและตั้งรอบ Invoice
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleCreateProject} className="px-6 py-5">
          <div className="space-y-5">
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              {/* Title */}
              <div className="flex flex-col gap-2 md:col-span-4">
                <span className="text-xs font-semibold text-foreground/80">Project Title <span className="text-destructive">*</span></span>
                <Input
                  placeholder="e.g. Website Redesign Q3"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="rounded-xl h-10 border-border/60 bg-transparent text-sm focus-visible:ring-primary shadow-sm"
                  required
                />
              </div>

              {/* Subtitle */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground/80">Subtitle</span>
                <Input
                  placeholder="e.g. Scope phase 1"
                  value={newSubtitle}
                  onChange={(e) => setNewSubtitle(e.target.value)}
                  className="rounded-xl h-10 border-border/60 bg-transparent text-sm shadow-sm"
                />
              </div>

              {/* Client Selection */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Client</span>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <Select onValueChange={setNewClientId} value={newClientId}>
                  <SelectTrigger className="rounded-xl h-10 border-border/60 shadow-sm text-sm bg-transparent">
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">No Client</SelectItem>
                    {clients.map(c => (
                      <SelectItem key={c._id} value={c._id}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Project Type Selection */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-foreground/80">Project Type</span>
                  <span className="text-[10px] text-muted-foreground">Optional</span>
                </div>
                <Select onValueChange={setNewJobTypeId} value={newJobTypeId}>
                  <SelectTrigger className="rounded-xl h-10 border-border/60 shadow-sm text-sm bg-transparent">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="none">No Type</SelectItem>
                    {jobTypes.map(jt => (
                      <SelectItem key={jt._id || jt.id} value={jt._id || jt.id || ''}>
                        <div className="flex items-center gap-1.5">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: jt.color || '#cbd5e1' }} />
                          {jt.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority Selection */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground/80">Priority</span>
                <Select onValueChange={setNewPriority} value={newPriority}>
                  <SelectTrigger className="rounded-xl h-10 border-border/60 shadow-sm text-sm bg-transparent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Urgent">Urgent</SelectItem>
                    <SelectItem value="High">High</SelectItem>
                    <SelectItem value="Medium">Medium</SelectItem>
                    <SelectItem value="Low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Timeline */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground/80">Timeline</span>
                <div className="flex items-center gap-2">
                  <Input
                    type="date"
                    value={newStartDate}
                    onChange={(e) => setNewStartDate(e.target.value)}
                    className="rounded-xl h-10 text-xs border-border/60 shadow-sm bg-transparent"
                  />
                  <span className="text-muted-foreground/50 text-xs">-</span>
                  <Input
                    type="date"
                    value={newDeadline}
                    onChange={(e) => setNewDeadline(e.target.value)}
                    className="rounded-xl h-10 text-xs border-border/60 shadow-sm bg-transparent"
                  />
                </div>
              </div>

              {/* Remarks & Tag */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-foreground/80">Remarks & Tag</span>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Waiting for details, In progress"
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="rounded-xl h-10 text-sm border-border/60 shadow-sm bg-transparent flex-1"
                  />
                  
                  <div className="h-10 px-2.5 flex items-center bg-muted/10 border border-border/60 rounded-xl shadow-sm shrink-0">
                    <div className="flex items-center gap-1">
                      {['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#64748b'].map(c => (
                        <button
                          key={c}
                          type="button"
                          onClick={() => setNewColor(c)}
                          className={cn(
                            "w-3.5 h-3.5 rounded-full transition-all",
                            newColor === c ? "ring-2 ring-primary ring-offset-1 scale-110" : "opacity-60 hover:opacity-100"
                          )}
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Details */}
            <div className="flex flex-col gap-2">
              <span className="text-xs font-semibold text-foreground/80">Project Details</span>
              <textarea
                placeholder="รายละเอียดเงื่อนไขสัญญา, ขอบเขตงานรายเดือน..."
                value={newDetails}
                onChange={(e) => setNewDetails(e.target.value)}
                className="flex min-h-[80px] w-full rounded-xl border border-border/60 bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground/50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50"
              />
            </div>

            {/* Related Projects */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-foreground/80">Related Projects</span>
                <span className="text-[10px] text-muted-foreground">Optional</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between h-10 rounded-xl border-border/60 bg-transparent shadow-sm text-sm font-normal">
                    {newRelatedProjectIds.length > 0
                      ? `${newRelatedProjectIds.length} project(s) selected`
                      : <span className="text-muted-foreground">Select related projects</span>}
                    <ChevronDown className="h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[300px] sm:w-[500px] max-h-60 overflow-y-auto rounded-xl">
                  {projects.map((p) => (
                    <DropdownMenuCheckboxItem
                      key={p.id}
                      checked={newRelatedProjectIds.includes(p.id)}
                      onCheckedChange={(checked) => {
                        setNewRelatedProjectIds(prev => 
                          checked ? [...prev, p.id] : prev.filter(id => id !== p.id)
                        )
                      }}
                    >
                      {p.title}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Render selected pills */}
              {newRelatedProjectIds.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {newRelatedProjectIds.map(id => {
                    const proj = projects.find(p => p.id === id);
                    return proj ? (
                      <Badge key={id} variant="secondary" className="text-[10px] font-normal px-2.5 py-0.5 rounded-full flex items-center gap-1.5 bg-muted/50 border-border/50">
                        <FolderOpen className="w-3 h-3 text-muted-foreground" />
                        <span className="truncate max-w-[150px]">{proj.title}</span>
                        <button
                          type="button"
                          onClick={() => setNewRelatedProjectIds(prev => prev.filter(pid => pid !== id))}
                          className="ml-0.5 text-muted-foreground hover:text-foreground shrink-0 transition-colors"
                        >
                          ×
                        </button>
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          </div>

          <DialogFooter className="mt-6 gap-3 sm:justify-between pt-5 border-t border-border/40">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-10 text-sm hover:bg-muted/50">
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating} className="rounded-xl h-10 px-8 text-sm font-bold shadow-md">
              {isCreating ? 'Creating...' : 'Create Project'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
