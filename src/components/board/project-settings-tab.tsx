'use client';

import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import {
  Settings2,
  FileText,
  Briefcase,
  AlignLeft,
  Check,
  CalendarDays,
  Calendar as CalendarIcon,
  AlertCircle,
  Target,
  Coins,
  Archive,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { Project } from '@/lib/types';

interface ProjectSettingsTabProps {
  project: Project;
  onSave: (data: any) => Promise<void>;
  isSaving: boolean;
}

export const ProjectSettingsTab: React.FC<ProjectSettingsTabProps> = ({
  project,
  onSave,
  isSaving,
}) => {
  const router = useRouter();

  // Local Form States
  const [editTitle, setEditTitle] = useState('');
  const [editSubtitle, setEditSubtitle] = useState('');
  const [editDetails, setEditDetails] = useState('');
  const [editPrice, setEditPrice] = useState<number>(0);
  const [editRevisions, setEditRevisions] = useState<number>(0);
  const [editDeadline, setEditDeadline] = useState<Date>(new Date());
  const [editStartDate, setEditStartDate] = useState<Date | undefined>(undefined);
  const [editBillable, setEditBillable] = useState(true);
  const [editHourlyRate, setEditHourlyRate] = useState<number | ''>('');
  const [editCurrency, setEditCurrency] = useState('USD');
  const [editColor, setEditColor] = useState('');
  const [editArchived, setEditArchived] = useState(false);
  const [editPriority, setEditPriority] = useState('Medium');

  useEffect(() => {
    if (project) {
      setEditTitle(project.title || '');
      setEditSubtitle(project.subtitle || '');
      setEditDetails(project.details || '');
      setEditPrice(project.gross_price || 0);
      setEditRevisions(project.revisions || 0);
      setEditDeadline(project.deadline ? new Date(project.deadline) : new Date());
      setEditStartDate(project.startDate ? new Date(project.startDate) : undefined);
      setEditBillable(project.billable !== false);
      setEditHourlyRate(project.hourlyRate ?? '');
      setEditCurrency(project.currency || 'USD');
      setEditColor(project.color || '');
      setEditArchived(!!project.archived);
      setEditPriority(project.priority || 'Medium');
    }
  }, [project]);

  const handleSaveChanges = async () => {
    await onSave({
      title: editTitle,
      subtitle: editSubtitle,
      details: editDetails,
      gross_price: editPrice,
      revisions: editRevisions,
      deadline: editDeadline,
      startDate: editStartDate,
      billable: editBillable,
      hourlyRate: editHourlyRate === '' ? undefined : editHourlyRate,
      currency: editCurrency,
      color: editColor,
      archived: editArchived,
      priority: editPriority,
    });
  };

  return (
    <Card className="border border-border/60 shadow-sm rounded-2xl bg-card overflow-hidden">
      <CardHeader className="border-b border-border/40 bg-card pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Settings2 className="w-5 h-5 text-primary" /> Project Container Settings
        </CardTitle>
        <CardDescription>
          Configure pricing, timelines, currencies, priorities, and tag colors for this project container
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 md:p-8 space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* LEFT COLUMN: General Info & Scope */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2 border-b border-border/40 pb-2">
              <FileText className="w-4 h-4 text-primary/80" /> General Details
            </h3>

            {/* Project Title */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Project Title
              </span>
              <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <Briefcase className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <input
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground w-full h-6"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  placeholder="Project title..."
                />
              </div>
            </div>

            {/* Subtitle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Subtitle / Short Tagline
              </span>
              <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <AlignLeft className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <input
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground w-full h-6"
                  value={editSubtitle}
                  onChange={(e) => setEditSubtitle(e.target.value)}
                  placeholder="Subtitle..."
                />
              </div>
            </div>

            {/* Scope details */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Scope Details (Description)
              </span>
              <div className="flex border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <textarea
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground placeholder:text-muted-foreground/40 w-full resize-none min-h-[100px]"
                  placeholder="Describe the scope of work or general notes for this project retainer..."
                  value={editDetails}
                  onChange={(e) => setEditDetails(e.target.value)}
                />
              </div>
            </div>

            {/* Project Tag Color */}
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Project Tag Color
              </span>
              <div className="flex flex-wrap gap-2.5 items-center">
                {[
                  { name: 'Red', hex: '#ef4444' },
                  { name: 'Orange', hex: '#f97316' },
                  { name: 'Yellow', hex: '#eab308' },
                  { name: 'Green', hex: '#22c55e' },
                  { name: 'Blue', hex: '#3b82f6' },
                  { name: 'Purple', hex: '#a855f7' },
                  { name: 'Slate', hex: '#64748b' },
                ].map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    className={cn(
                      'w-7 h-7 rounded-full border-2 transition-all hover:scale-110 flex items-center justify-center shadow-sm',
                      editColor === c.hex
                        ? 'border-primary ring-2 ring-primary/25 scale-110'
                        : 'border-transparent'
                    )}
                    style={{ backgroundColor: c.hex }}
                    onClick={() => setEditColor(c.hex)}
                    title={c.name}
                  >
                    {editColor === c.hex && <Check className="w-3.5 h-3.5 text-white stroke-[3px]" />}
                  </button>
                ))}
                <button
                  type="button"
                  className={cn(
                    'px-3 py-1 text-xs border rounded-lg hover:bg-muted transition-colors h-7 flex items-center justify-center font-semibold',
                    !editColor ? 'bg-muted text-primary border-primary/20' : 'text-muted-foreground border-border'
                  )}
                  onClick={() => setEditColor('')}
                >
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Timelines & Budgets */}
          <div className="space-y-6">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2 border-b border-border/40 pb-2">
              <CalendarDays className="w-4 h-4 text-primary/80" /> Timeline & Budget
            </h3>

            {/* Dates: Kickoff and Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Kickoff Date */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Kickoff Date
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal text-sm h-10 rounded-xl px-3 border-input bg-background hover:bg-muted/50 gap-2',
                        !editStartDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <span className="truncate">
                        {editStartDate ? format(editStartDate, 'PPP') : 'Pick kickoff date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={editStartDate} onSelect={setEditStartDate} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Deadline */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Deadline (Due Date)
                </span>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        'w-full justify-start text-left font-normal text-sm h-10 rounded-xl px-3 border-input bg-background hover:bg-muted/50 gap-2',
                        !editDeadline && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                      <span className="truncate">
                        {editDeadline ? format(editDeadline, 'PPP') : 'Pick deadline date'}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={editDeadline}
                      onSelect={(date) => date && setEditDeadline(date)}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Priority Setting */}
            <div className="flex flex-col gap-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                Project Priority
              </span>
              <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <AlertCircle className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                <select
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground font-semibold w-full h-6 cursor-pointer"
                >
                  <option value="Urgent">🔴 Urgent Priority</option>
                  <option value="High">🟠 High Priority</option>
                  <option value="Medium">🟡 Medium Priority</option>
                  <option value="Low">🔵 Low Priority</option>
                </select>
              </div>
            </div>

            {/* Budget and Revisions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Budget */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Gross Budget
                </span>
                <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <span className="text-sm text-muted-foreground font-semibold">
                    {editCurrency === 'USD' ? '$' : '฿'}
                  </span>
                  <input
                    type="number"
                    className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground font-bold w-full h-6"
                    value={editPrice}
                    onChange={(e) => setEditPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              {/* Revisions */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                  Target Revisions
                </span>
                <div className="flex items-center gap-2 border border-input bg-background px-3 py-2 rounded-xl focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                  <Target className="w-4 h-4 text-muted-foreground/60 shrink-0" />
                  <input
                    type="number"
                    className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-sm text-foreground w-full h-6"
                    value={editRevisions}
                    onChange={(e) => setEditRevisions(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            {/* Billing Settings card */}
            <div className="border border-border/50 bg-card rounded-2xl p-4 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Coins className="w-4 h-4 text-primary shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-foreground block">Billable Retainer</span>
                    <span className="text-[10px] text-muted-foreground">
                      Charge clients by hourly rate for this container
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editBillable}
                  onChange={(e) => setEditBillable(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                />
              </div>

              {editBillable && (
                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-border/40">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      Currency
                    </label>
                    <select
                      value={editCurrency}
                      onChange={(e) => setEditCurrency(e.target.value)}
                      className="border border-input rounded-xl px-2.5 py-1 text-sm h-10 bg-background cursor-pointer focus:ring-primary focus:border-primary"
                    >
                      <option value="USD">USD ($)</option>
                      <option value="THB">THB (฿)</option>
                      <option value="EUR">EUR (€)</option>
                    </select>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">
                      Hourly Rate
                    </label>
                    <Input
                      type="number"
                      placeholder="Hourly Rate"
                      value={editHourlyRate}
                      onChange={(e) => setEditHourlyRate(e.target.value ? Number(e.target.value) : '')}
                      className="h-10 rounded-xl px-3 border-input bg-background"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Archive settings */}
            <div className="border border-destructive/20 bg-destructive/5 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Archive className="w-4 h-4 text-destructive shrink-0" />
                  <div>
                    <span className="text-xs font-bold text-destructive block">Archive Container</span>
                    <span className="text-[10px] text-muted-foreground">
                      Archive this project container and hide it from active boards
                    </span>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={editArchived}
                  onChange={(e) => setEditArchived(e.target.checked)}
                  className="h-4.5 w-4.5 rounded border-gray-300 text-destructive focus:ring-destructive cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Form Buttons */}
        <div className="border-t border-border/40 pt-6 flex justify-end gap-3">
          <Button variant="outline" className="rounded-xl px-5 h-10" onClick={() => router.push('/projects')}>
            Cancel
          </Button>
          <Button
            className="rounded-xl bg-primary text-primary-foreground font-semibold px-6 h-10 shadow-sm"
            onClick={handleSaveChanges}
            disabled={isSaving}
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
