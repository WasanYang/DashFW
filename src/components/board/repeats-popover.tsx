'use client';

import React, { useState, useEffect } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { HelpCircle, CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { RepeatConfig } from '@/lib/types';

interface RepeatsPopoverProps {
  value: string | RepeatConfig | undefined | null;
  onChange: (value: RepeatConfig | string | null) => void;
}

export const formatRepeatSummary = (val: any) => {
  if (!val || val === 'none') return "Doesn't repeat";
  if (typeof val === 'string' && !val.startsWith('{')) return val;
  
  let cfg: RepeatConfig;
  if (typeof val === 'string') {
    try { cfg = JSON.parse(val); } catch { return "Custom" }
  } else {
    cfg = val;
  }
  
  if (cfg.interval === 1) {
    if (cfg.unit === 'Week' && cfg.daysOfWeek?.length) {
      const fullDays: any = { Mo:'Monday', Tu:'Tuesday', We:'Wednesday', Th:'Thursday', Fr:'Friday', Sa:'Saturday', Su:'Sunday' };
      const daysStr = cfg.daysOfWeek.map((d: string) => fullDays[d]).join(', ');
      return `Every week on ${daysStr}`;
    }
    if (cfg.unit === 'Month') {
      if (cfg.monthlyType === 'weekday' && cfg.monthlyOrdinal && cfg.monthlyWeekday) {
         return `Every month on the ${cfg.monthlyOrdinal.toLowerCase()} ${cfg.monthlyWeekday}`;
      }
      if (cfg.monthlyType === 'date' && cfg.monthlyDate) {
         const d = cfg.monthlyDate;
         return `Every month on the ${d}${d === 1 || d === 21 || d === 31 ? 'st' : d === 2 || d === 22 ? 'nd' : d === 3 || d === 23 ? 'rd' : 'th'}`;
      }
    }
    return `Every ${cfg.unit.toLowerCase()}`;
  } else {
    if (cfg.unit === 'Week' && cfg.daysOfWeek?.length) {
      const fullDays: any = { Mo:'Monday', Tu:'Tuesday', We:'Wednesday', Th:'Thursday', Fr:'Friday', Sa:'Saturday', Su:'Sunday' };
      const daysStr = cfg.daysOfWeek.map((d: string) => fullDays[d]).join(', ');
      return `Every ${cfg.interval} weeks on ${daysStr}`;
    }
    return `Every ${cfg.interval} ${cfg.unit.toLowerCase()}s`;
  }
};

export function RepeatsPopover({ value, onChange }: RepeatsPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const parseConfig = (val: any): RepeatConfig => {
    if (typeof val === 'object' && val !== null) return val;
    if (typeof val === 'string') {
      if (val.startsWith('{')) {
        try { return JSON.parse(val); } catch {}
      }
      if (val === 'Daily') return { interval: 1, unit: 'Day' };
      if (val === 'Weekly') return { interval: 1, unit: 'Week', daysOfWeek: ['Mo'] };
      if (val === 'Monthly') return { interval: 1, unit: 'Month', monthlyType: 'date', monthlyDate: 1 };
    }
    return { interval: 1, unit: 'Week', daysOfWeek: ['Mo'], action: 'change_due_date', isEnd: false, monthlyType: 'date', monthlyDate: 1 };
  };

  const [config, setConfig] = useState<RepeatConfig>(() => parseConfig(value));

  // Sync state if value changes externally
  useEffect(() => {
    if (!isOpen) {
      if (value === '' || value === null || value === undefined || value === 'none') {
        // do nothing
      } else {
        setConfig(parseConfig(value));
      }
    }
  }, [value, isOpen]);

  const updateConfig = (updates: Partial<RepeatConfig>) => {
    const newConfig = { ...config, ...updates };
    setConfig(newConfig);
    // Auto save
    onChange(newConfig);
  };

  const toggleDay = (day: string) => {
    const days = config.daysOfWeek || [];
    let newDays;
    if (days.includes(day)) {
      newDays = days.filter(d => d !== day);
      if (newDays.length === 0) newDays = [day]; // Keep at least one
    } else {
      newDays = [...days, day];
    }
    updateConfig({ daysOfWeek: newDays });
  };

  const isEnabled = value !== '' && value !== null && value !== undefined && value !== 'none';

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-2 cursor-pointer group flex-1">
          <span className={cn("text-sm hover:underline", isEnabled ? "text-foreground" : "text-muted-foreground")}>
            {formatRepeatSummary(value)}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[340px] p-4 flex flex-col gap-4 shadow-xl border-border/80 rounded-2xl" align="start" sideOffset={8}>
        
        {/* Toggle On/Off Entire Repeat */}
        <div className="flex items-center justify-between pb-2 border-b border-border/40">
          <span className="font-semibold text-sm">Repeat Task</span>
          <Switch 
            checked={isEnabled} 
            onCheckedChange={(checked) => {
              if (checked) {
                onChange(config);
              } else {
                onChange('none');
              }
            }} 
          />
        </div>

        {isEnabled && (
          <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
            {/* Every X Unit */}
            <div className="flex items-center gap-2 border border-border/60 rounded-xl p-1 bg-background shadow-sm">
              <span className="text-sm font-medium text-muted-foreground px-3">Every</span>
              <Input 
                type="number" 
                min={1} 
                value={config.interval} 
                onChange={e => updateConfig({interval: parseInt(e.target.value) || 1})} 
                className="w-16 h-8 text-center border-none shadow-none focus-visible:ring-0 font-semibold" 
              />
              <Select value={config.unit} onValueChange={(u: any) => updateConfig({unit: u})}>
                <SelectTrigger className="flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Day">Day</SelectItem>
                  <SelectItem value="Week">Week</SelectItem>
                  <SelectItem value="Month">Month</SelectItem>
                  <SelectItem value="Year">Year</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Days of week if Week */}
            {config.unit === 'Week' && (
              <div className="flex items-center justify-between gap-1 px-1">
                {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(day => (
                  <div key={day} 
                    onClick={() => toggleDay(day)}
                    className={cn("h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold cursor-pointer border transition-all duration-200 shadow-sm",
                      config.daysOfWeek?.includes(day) ? "bg-primary text-primary-foreground border-primary" : "bg-card text-muted-foreground border-border/60 hover:bg-muted"
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>
            )}

            {/* Monthly settings */}
            {config.unit === 'Month' && (
              <RadioGroup 
                value={config.monthlyType || 'date'} 
                onValueChange={(val: any) => updateConfig({ monthlyType: val })}
                className="flex flex-col gap-2 px-1"
              >
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="date" id="r-date" />
                  <label htmlFor="r-date" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 border border-border/60 rounded-xl p-1 bg-background shadow-sm">
                      <Select 
                        value={config.monthlyDate ? config.monthlyDate.toString() : '1'} 
                        onValueChange={(val) => updateConfig({ monthlyDate: parseInt(val), monthlyType: 'date' })}
                      >
                        <SelectTrigger className="flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="max-h-[200px] z-[70]">
                          {Array.from({length: 31}, (_, i) => i + 1).map(num => (
                            <SelectItem key={num} value={num.toString()}>
                              {num}{num === 1 || num === 21 || num === 31 ? 'st' : num === 2 || num === 22 ? 'nd' : num === 3 || num === 23 ? 'rd' : 'th'} day of the month
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </label>
                </div>
                
                <div className="flex items-center gap-3">
                  <RadioGroupItem value="weekday" id="r-weekday" />
                  <label htmlFor="r-weekday" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2 border border-border/60 rounded-xl p-1 bg-background shadow-sm">
                      <Select 
                        value={config.monthlyOrdinal || 'First'} 
                        onValueChange={(val: any) => updateConfig({ monthlyOrdinal: val, monthlyType: 'weekday' })}
                      >
                        <SelectTrigger className="flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[70]">
                          {['First', 'Second', 'Third', 'Fourth', 'Last'].map(ord => (
                            <SelectItem key={ord} value={ord}>{ord}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Select 
                        value={config.monthlyWeekday || 'Monday'} 
                        onValueChange={(val: any) => updateConfig({ monthlyWeekday: val, monthlyType: 'weekday' })}
                      >
                        <SelectTrigger className="flex-1 h-8 border-none shadow-none focus-visible:ring-0 bg-transparent font-medium">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="z-[70]">
                          {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
                            <SelectItem key={day} value={day}>{day}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </label>
                </div>
              </RadioGroup>
            )}

            <div className="border-t border-border/60 border-dashed" />

            {/* Action */}
            <div className="flex flex-col gap-1.5 border border-border/60 rounded-xl p-2.5 bg-background shadow-sm relative group">
              <label className="text-xs font-medium text-muted-foreground px-1">Action</label>
              <Select value={config.action || 'change_due_date'} onValueChange={a => updateConfig({action: a})}>
                <SelectTrigger className="h-8 border-none shadow-none focus-visible:ring-0 p-1 font-medium">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="change_due_date">task.repeat.change_due_date</SelectItem>
                  <SelectItem value="create_new_task">task.repeat.create_new_task</SelectItem>
                </SelectContent>
              </Select>
              <HelpCircle className="w-4 h-4 text-muted-foreground/40 absolute right-3 top-3 cursor-help hover:text-primary transition-colors" />
            </div>

            <div className="border-t border-border/60 border-dashed" />

            {/* Set to end */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between border border-border/60 rounded-xl p-3 bg-background shadow-sm">
                <div className="flex items-center gap-3">
                  <Switch checked={config.isEnd || false} onCheckedChange={c => updateConfig({isEnd: c})} />
                  <span className="text-sm font-medium">Set to end</span>
                </div>
              </div>
              
              {config.isEnd && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className={cn("h-10 justify-start text-left font-normal text-sm px-3 bg-background border-border/60 rounded-xl shadow-sm", !config.endDate && "text-muted-foreground")}>
                      {config.endDate ? format(new Date(config.endDate), 'dd/MM/yyyy') : <span>Pick an end date</span>}
                      <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 z-[70]" align="start">
                    <Calendar
                      mode="single"
                      selected={config.endDate ? new Date(config.endDate) : undefined}
                      onSelect={(date) => updateConfig({endDate: date?.toISOString()})}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
