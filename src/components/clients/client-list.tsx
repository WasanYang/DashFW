'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ExternalLink,
  Pencil,
  Plus,
  Phone,
  Globe,
  MessageCircle,
  Instagram,
  User,
  Hash,
  ListTodo,
  DollarSign,
  Clock,
  MessageSquare,
  Search,
  Table,
  LayoutGrid,
  Building2,
  FolderKanban,
  Trash2,
  HelpCircle,
  Archive,
} from 'lucide-react';
import { Client, Company, Project, Social, SubTask, Task } from '@/lib/types';
import {
  useGetClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
  useDeleteClientMutation,
} from '@/services/clientApi';
import {
  useGetCompaniesQuery,
  useAddCompanyMutation,
  useUpdateCompanyMutation,
  useDeleteCompanyMutation,
} from '@/services/companyApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { ClientForm, ClientFormValues } from './client-form';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';
import { format } from 'date-fns';
import { Progress } from '../ui/progress';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { formatNumber } from '@/lib/number-format';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

interface ClientListProps {
  tasks: Task[];
}

const socialIcons: { [key: string]: React.ElementType } = {
  Phone: Phone,
  Website: Globe,
  Line: MessageCircle,
  Instagram: Instagram,
  Facebook: User,
  Other: Hash,
};

const calculateProgress = (tasks: SubTask[] | undefined): number => {
  if (!tasks || tasks.length === 0) {
    return 0;
  }

  let totalTasks = 0;
  let completedTasks = 0;

  const countTasks = (tasks: SubTask[]) => {
    tasks.forEach((task) => {
      totalTasks++;
      if (task.completed) {
        completedTasks++;
      }
      if (task.children) {
        countTasks(task.children);
      }
    });
  };

  countTasks(tasks);

  if (totalTasks === 0) return 0;

  return (completedTasks / totalTasks) * 100;
};

const getClientCompany = (client: Client): string => {
  if (client.companyName) return client.companyName;
  if (client.notes) {
    const lines = client.notes.split('\n');
    for (const line of lines) {
      if (line.toLowerCase().startsWith('company:')) {
        return line.substring(8).trim();
      }
    }
  }
  
  if (client.email) {
    const domain = client.email.split('@')[1];
    if (domain) {
      const personalDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'icloud.com'];
      if (!personalDomains.includes(domain.toLowerCase())) {
        const parts = domain.split('.');
        const domainName = parts[0];
        return domainName.charAt(0).toUpperCase() + domainName.slice(1) + ' Inc.';
      }
    }
  }
  return '-';
};

const CompanyInlineEdit = ({ client, companyList, companiesData, updateClient }: { client: Client, companyList: string[], companiesData: Company[], updateClient: any }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  
  const currentVal = client.companyId ? (companiesData.find((c: any) => c._id === client.companyId)?.name || '-') : '-';

  const handleSelect = (val: string) => {
    if (val !== currentVal) {
      if (val === '-') {
        updateClient({ _id: client._id, data: { companyId: null } });
      } else {
        const comp = companiesData.find((c: any) => c.name === val);
        if (comp) {
          updateClient({ _id: client._id, data: { companyId: comp._id } });
        }
      }
    }
    setOpen(false);
  };

  const filtered = companyList.filter((c: any) => c.toLowerCase().includes(search.toLowerCase()) && c !== '-');
  
  return (
    <Popover open={open} onOpenChange={(o) => { setOpen(o); if(o) setSearch(''); }}>
      <PopoverTrigger asChild>
        <div className="flex items-center gap-1.5 cursor-pointer bg-primary/5 hover:bg-primary/10 border border-transparent hover:border-primary/20 px-2.5 py-1 rounded-md transition-colors w-full max-w-[150px] shadow-sm group">
          <Building2 className="h-3 w-3 text-primary shrink-0 group-hover:scale-110 transition-transform" />
          <span className="text-primary font-bold text-[10px] tracking-wide truncate">
            {currentVal}
          </span>
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-[200px] p-0 overflow-hidden rounded-xl border-border/40 shadow-lg" align="start">
        <div className="flex flex-col">
          <input
            autoFocus
            className="w-full bg-transparent p-2.5 text-xs font-semibold outline-none border-b border-border/40"
            placeholder="Search or type to add..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && search) {
                handleSelect(search);
              }
            }}
          />
          <div className="max-h-[200px] overflow-y-auto p-1 flex flex-col gap-0.5">
            {!search && currentVal !== '-' && (
              <div 
                className="px-2.5 py-1.5 text-xs text-destructive font-bold rounded-lg hover:bg-destructive/10 cursor-pointer transition-colors flex items-center gap-1.5 mb-1"
                onClick={() => handleSelect('-')}
              >
                <Trash2 className="h-3 w-3" /> Remove company
              </div>
            )}
            {filtered.map((c: any) => (
              <div 
                key={c} 
                className="px-2.5 py-1.5 text-xs font-medium rounded-lg hover:bg-muted cursor-pointer transition-colors"
                onClick={() => handleSelect(c)}
              >
                {c}
              </div>
            ))}
            {search && !filtered.includes(search) && (
              <div 
                className="px-2.5 py-1.5 text-xs text-primary font-bold rounded-lg hover:bg-primary/10 cursor-pointer transition-colors flex items-center gap-1.5"
                onClick={() => handleSelect(search)}
              >
                <Plus className="h-3 w-3" /> Add "{search}"
              </div>
            )}
            {filtered.length === 0 && !search && currentVal === '-' && (
              <div className="px-2 py-4 text-xs text-muted-foreground/60 text-center font-medium">
                No companies found
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export function ClientList({ tasks }: ClientListProps) {
  const projects = tasks; // Alias for compatibility with internal UI naming
  const { data: clients = [], isLoading: isLoadingClients, error: errorClients, refetch: refetchClients } = useGetClientsQuery();
  const { data: rawCompanies = [], isLoading: isLoadingCompanies, error: errorCompanies, refetch: refetchCompanies } = useGetCompaniesQuery();

  const [addClient, { isLoading: isAddingClient }] = useAddClientMutation();
  const [updateClient, { isLoading: isUpdatingClient }] = useUpdateClientMutation();
  const [deleteClient] = useDeleteClientMutation();
  
  const [addCompany, { isLoading: isAddingCompany }] = useAddCompanyMutation();
  const [updateCompany, { isLoading: isUpdatingCompany }] = useUpdateCompanyMutation();
  const [deleteCompany] = useDeleteCompanyMutation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isCompanyCreateOpen, setIsCompanyCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [projectModal, setProjectModal] = useState<Task | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'split'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'companies'>('people');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const [compFormName, setCompFormName] = useState('');
  const [compFormEmail, setCompFormEmail] = useState('');
  const [compFormPhone, setCompFormPhone] = useState('');
  const [compFormCustomFields, setCompFormCustomFields] = useState<{ label: string; value: string }[]>([]);
  const [compFormAddress, setCompFormAddress] = useState('');
  const [compFormCityState, setCompFormCityState] = useState('');
  const [compFormCountry, setCompFormCountry] = useState('');
  const [compFormZip, setCompFormZip] = useState('');
  const [compFormTimezone, setCompFormTimezone] = useState('Asia/Bangkok');
  const [compFormBio, setCompFormBio] = useState('');

  // Style constants for stacked inputs
  const stackedInputClass =
    'flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all';
  const labelClass =
    'text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 uppercase tracking-wider select-none mb-0.5';
  const inputClass =
    'bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground placeholder:text-muted-foreground/40 w-full h-5';

  const clientStatusMap = useMemo(() => {
    const map: { [clientId: string]: { status: 'Active' | 'Pending' | 'Inactive'; projectsCount: number } } = {};
    
    clients.forEach((client: any) => {
      const associatedProjects = projects.filter(p => p.clientId === client._id);
      
      const hasActive = associatedProjects.some(p => p.status === 'In Progress' || p.status === 'Review');
      const hasPending = associatedProjects.some(p => p.status === 'Backlog');
      
      let status: 'Active' | 'Pending' | 'Inactive' = 'Inactive';
      if (hasActive) {
        status = 'Active';
      } else if (hasPending) {
        status = 'Pending';
      }
      
      map[client._id] = {
        status,
        projectsCount: associatedProjects.length
      };
    });
    
    return map;
  }, [clients, projects]);

  const companiesList = useMemo(() => {
    return rawCompanies.map(comp => {
      const associatedClients = clients.filter((c: any) => c.companyId === comp._id);
      let projectsCount = 0;
      let status: 'Active' | 'Pending' | 'Inactive' = 'Inactive';
      
      associatedClients.forEach((c: any) => {
        const info = clientStatusMap[c._id] || { status: 'Inactive', projectsCount: 0 };
        projectsCount += info.projectsCount;
        if (info.status === 'Active') {
          status = 'Active';
        } else if (info.status === 'Pending' && status !== 'Active') {
          status = 'Pending';
        }
      });
      
      const result: any = {
        ...comp,
        clients: associatedClients,
        projectsCount,
        status
      };
      return result;
    });
  }, [rawCompanies, clients, clientStatusMap]);

  const filteredCompanies = useMemo(() => {
    let list = companiesList;
    if (!showArchived) {
      list = list.filter(comp => {
        const hasActiveClient = comp.clients.some((c: any) => !c.archived);
        if (comp.clients.length === 0) return true;
        return hasActiveClient;
      });
    }

    return list.filter((comp) =>
      comp.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [companiesList, searchQuery, showArchived]);

  const statusCounts = useMemo(() => {
    if (activeTab === 'companies') {
      const counts = {
        Total: companiesList.length,
        Pending: 0,
        Active: 0,
        Inactive: 0,
      };
      companiesList.forEach(comp => {
        counts[comp.status as 'Active' | 'Pending' | 'Inactive']++;
      });
      return counts;
    }

    const counts = {
      Total: clients.length,
      Pending: 0,
      Active: 0,
      Inactive: 0,
    };
    
    clients.forEach((client: any) => {
      const info = clientStatusMap[client._id];
      if (info) {
        counts[info.status]++;
      } else {
        counts.Inactive++;
      }
    });
    
    return counts;
  }, [clients, clientStatusMap, activeTab, companiesList]);

  const filteredClients = useMemo(() => {
    let actualPeople = clients;
    if (!showArchived) {
      actualPeople = actualPeople.filter((c: any) => !c.archived);
    }
    
    return actualPeople.filter((c: any) => 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [clients, searchQuery, showArchived]);

  useEffect(() => {
    setSelectedClient((prev) => {
      if (prev && clients.some((c) => c._id === prev._id)) {
        return clients.find((c) => c._id === prev._id) || null;
      }
      if (clients.length > 0) {
        return clients[0];
      }
      return prev;
    });
  }, [clients]);

  useEffect(() => {
    setSelectedCompany((prev) => {
      if (prev && companiesList.some((c) => c.name === prev)) {
        return prev;
      }
      if (companiesList.length > 0) {
        return companiesList[0].name;
      }
      return null;
    });
  }, [companiesList]);

  useEffect(() => {
    if (editingCompany) {
      setCompFormName(editingCompany.name || '');
      setCompFormEmail(editingCompany.email || '');
      setCompFormPhone(editingCompany.phone || '');
      setCompFormCustomFields(editingCompany.customFields || []);
      setCompFormAddress(editingCompany.address || '');
      setCompFormCityState(editingCompany.city_state || '');
      setCompFormCountry(editingCompany.country || '');
      setCompFormZip(editingCompany.zip || '');
      setCompFormTimezone(editingCompany.timezone || 'Asia/Bangkok');
      setCompFormBio(editingCompany.bio || '');
    } else {
      setCompFormName('');
      setCompFormEmail('');
      setCompFormPhone('');
      setCompFormCustomFields([]);
      setCompFormAddress('');
      setCompFormCityState('');
      setCompFormCountry('');
      setCompFormZip('');
      setCompFormTimezone('Asia/Bangkok');
      setCompFormBio('');
    }
  }, [editingCompany]);

  const activeCompanyInfo = useMemo(() => {
    return companiesList.find((c) => c.name === selectedCompany) || null;
  }, [companiesList, selectedCompany]);

  const clientProjects = projects.filter(
    (p) => p.clientId === selectedClient?._id,
  );

  const handleAddClient = async (values: any) => {
    const { companyName, ...rest } = values;
    let companyId = null;
    if (companyName) {
      const comp = rawCompanies.find((c: any) => c.name === companyName);
      if (comp) companyId = comp._id;
    }
    await addClient({ ...rest, companyId });
    await refetchClients();
    setIsCreateOpen(false);
  };

  const handleEditClient = async (values: any) => {
    if (!editingClient || !editingClient._id) return;
    const { companyName, ...rest } = values;
    let companyId = null;
    if (companyName) {
      const comp = rawCompanies.find((c: any) => c.name === companyName);
      if (comp) companyId = comp._id;
    }
    await updateClient({
      _id: editingClient._id,
      data: { ...rest, companyId },
    });
    await refetchClients();
    setEditingClient(null);
    setIsCreateOpen(false);
  };

  const handleCompanySubmit = async () => {
    if (!compFormName.trim()) return;
    
    const name = compFormName.trim();
    const email = compFormEmail.trim();
    const phone = compFormPhone.trim();
    const customFields = compFormCustomFields.filter(f => f.label.trim() && f.value.trim());
    const address = compFormAddress.trim();
    const cityState = compFormCityState.trim();
    const country = compFormCountry.trim();
    const zip = compFormZip.trim();
    const timezone = compFormTimezone.trim();
    const bio = compFormBio.trim();

    if (editingCompany) {
      await updateCompany({
        _id: editingCompany._id,
        data: {
          name: name,
          email: email,
          phone: phone,
          socials: phone ? [{ id: `soc-phone-${Date.now()}`, platform: 'Phone', value: phone }] : [],
          customFields: customFields,
          address,
          city_state: cityState,
          country,
          zip,
          timezone,
          bio,
        }
      });
      setEditingCompany(null);
    } else {
      await addCompany({
        name: name,
        email: email,
        phone: phone,
        socials: phone ? [{ id: `soc-phone-${Date.now()}`, platform: 'Phone', value: phone }] : [],
        customFields: customFields,
        address,
        city_state: cityState,
        country,
        zip,
        timezone,
        bio,
      });
    }

    await refetchCompanies();
    setIsCompanyCreateOpen(false);

    setCompFormName('');
    setCompFormEmail('');
    setCompFormPhone('');
    setCompFormCustomFields([]);
    setCompFormAddress('');
    setCompFormCityState('');
    setCompFormCountry('');
    setCompFormZip('');
    setCompFormTimezone('Asia/Bangkok');
    setCompFormBio('');
  };

  const renderSocialLink = (social: Social, idx: number) => {
    const Icon = socialIcons[social.platform] || Hash;
    return (
      <div
        key={social.platform + '-' + idx}
        className='flex items-center gap-3'
      >
        <Icon className='h-5 w-5 text-muted-foreground' />
        <div className='flex-1'>
          <p className='text-sm font-medium'>{social.platform}</p>
          <p className='text-sm text-muted-foreground truncate'>
            {social.value}
          </p>
        </div>
      </div>
    );
  };

  const projectModalProgress = useMemo(() => {
    if (!projectModal) return 0;
    return calculateProgress(projectModal.subTasks);
  }, [projectModal]);

  const renderSubtasksReadOnly = (tasks: SubTask[], level = 0): React.ReactNode => (
    <div className='space-y-1'>
      {tasks.map((subtask) => (
        <div key={subtask.id} style={{ paddingLeft: `${level * 1.5}rem` }}>
          <div className='flex items-center gap-2'>
            <Checkbox
              id={`readonly-subtask-${subtask.id}`}
              checked={subtask.completed}
              disabled
            />
            <Label
              htmlFor={`readonly-subtask-${subtask.id}`}
              className={cn(
                'text-sm',
                subtask.completed && 'line-through text-muted-foreground',
              )}
            >
              {subtask.text}
            </Label>
          </div>
          {subtask.children &&
            subtask.children.length > 0 &&
            renderSubtasksReadOnly(subtask.children, level + 1)}
        </div>
      ))}
    </div>
  );

  return (
    <TooltipProvider delayDuration={0}>
      <div className="mx-auto max-w-7xl mb-8 space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-bold text-muted-foreground/90">
            <span>Contacts</span>
            <span>/</span>
            <span className="text-foreground/90">{activeTab === 'people' ? 'People' : 'Companies'}</span>
          </div>
          
          <Button
            onClick={() => {
              if (activeTab === 'companies') {
                setIsCompanyCreateOpen(true);
              } else {
                setIsCreateOpen(true);
              }
            }}
            className="h-9 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl shadow-sm shrink-0"
          >
            <Plus className="mr-1.5 h-4 w-4" /> Add {activeTab === 'companies' ? 'company' : 'someone'}
          </Button>
        </div>

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex bg-muted/60 p-1 rounded-xl text-xs border border-border/40 shrink-0 shadow-2xs select-none">
              <Button
                variant={activeTab === 'people' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-bold transition-all duration-200",
                  activeTab === 'people'
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
                onClick={() => setActiveTab('people')}
              >
                People
              </Button>
              <Button
                variant={activeTab === 'companies' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-4 rounded-lg text-xs font-bold transition-all duration-200",
                  activeTab === 'companies'
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
                onClick={() => setActiveTab('companies')}
              >
                Companies
              </Button>
            </div>

            <div className="w-px h-6 bg-border/50 mx-1 hidden md:block"></div>

            <div className="flex bg-muted/60 p-1 rounded-xl text-xs border border-border/40 shrink-0 shadow-2xs">
              <Button
                variant={viewMode === 'table' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                  viewMode === 'table'
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
                onClick={() => setViewMode('table')}
              >
                <Table className="mr-1.5 h-3.5 w-3.5" /> Table
              </Button>
              <Button
                variant={viewMode === 'split' ? 'default' : 'ghost'}
                size="sm"
                className={cn(
                  "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                  viewMode === 'split'
                    ? "bg-background text-primary shadow-sm"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/80"
                )}
                onClick={() => setViewMode('split')}
              >
                <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> CRM View
              </Button>
            </div>
            
            <div className="flex items-center gap-1.5 bg-card p-1 rounded-xl border border-border/40 shadow-sm shrink-0">
              <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Filter</Button>
              <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Sort</Button>
              <Button 
                variant="ghost" 
                onClick={() => setShowArchived(!showArchived)}
                className={cn("h-8 text-xs font-semibold px-2.5", showArchived ? "bg-muted text-primary" : "text-muted-foreground")}
              >
                <Archive className="w-3.5 h-3.5 mr-1.5" />
                {showArchived ? 'Hide Archived' : 'Show Archived'}
              </Button>
            </div>
          </div>
          
          <div className="relative w-full md:w-64 shrink-0">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl border-border/70 focus-visible:ring-primary w-full bg-background/50 shadow-2xs transition-all hover:bg-background"
            />
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap select-none pt-2">
          <div className="bg-card text-foreground border border-border/50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center border border-slate-200 dark:border-slate-700">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-black">Total</span>
              <span className="text-sm leading-none mt-0.5">{statusCounts.Total}</span>
            </div>
          </div>

          <div className="bg-card text-foreground border border-border/50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-lg bg-orange-50 dark:bg-orange-950/30 flex items-center justify-center border border-orange-100 dark:border-orange-900/50">
              <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-black">Pending</span>
              <span className="text-sm leading-none mt-0.5">{statusCounts.Pending}</span>
            </div>
          </div>

          <div className="bg-card text-foreground border border-border/50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center border border-emerald-100 dark:border-emerald-900/50">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-black">Active</span>
              <span className="text-sm leading-none mt-0.5">{statusCounts.Active}</span>
            </div>
          </div>

          <div className="bg-card text-foreground border border-border/50 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-3 shadow-sm hover:shadow-md transition-all">
            <div className="w-8 h-8 rounded-lg bg-slate-50 dark:bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-800">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-black">Inactive</span>
              <span className="text-sm leading-none mt-0.5">{statusCounts.Inactive}</span>
            </div>
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        activeTab === 'people' ? (
          <div className="mx-auto max-w-7xl bg-card border border-border/40 shadow-sm rounded-2xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/30 text-[10px] uppercase tracking-widest font-black text-muted-foreground/70 text-left">
                    <th className="py-3.5 px-5 w-12 text-center"></th>
                    <th className="py-3.5 px-5">Contact</th>
                    <th className="py-3.5 px-5">Role</th>
                    <th className="py-3.5 px-5">Company</th>
                    <th className="py-3.5 px-5 w-32">Status</th>
                    <th className="py-3.5 px-5">Email Address</th>
                    <th className="py-3.5 px-5 w-24 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm font-medium text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <User className="h-10 w-10 text-muted-foreground/30" />
                          <span>No contacts found.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const clientInfo = clientStatusMap[client._id] || { status: 'Inactive', projectsCount: 0 };

                      return (
                        <tr
                          key={client._id}
                          className={cn("hover:bg-muted/30 transition-all duration-200 group bg-card", client.archived ? "opacity-60" : "")}
                        >
                          <td className="py-3 px-5 text-center align-middle">
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer mx-auto flex items-center justify-center group-hover:scale-110" />
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-border shadow-sm shrink-0">
                                <AvatarImage src={client.avatarUrl} alt={client.name} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                  {client.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <input
                                type="text"
                                defaultValue={client.name}
                                onBlur={(e) => {
                                  if (e.target.value !== client.name) {
                                    updateClient({ _id: client._id, data: { name: e.target.value } });
                                  }
                                }}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') e.currentTarget.blur();
                                }}
                                className="font-bold text-foreground/90 bg-transparent border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 -mx-2 transition-all text-[13px] w-full"
                              />
                            </div>
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <span className="inline-flex items-center bg-slate-100/80 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[9px] px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200 dark:border-slate-700 shadow-sm">
                              Client
                            </span>
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <CompanyInlineEdit 
                              client={client} 
                              companyList={rawCompanies.map((c: any) => c.name)} 
                              companiesData={rawCompanies}
                              updateClient={updateClient} 
                            />
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border",
                                clientInfo.status === "Active"
                                  ? "bg-green-50 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400"
                                  : clientInfo.status === "Pending"
                                  ? "bg-orange-50 text-orange-700 border-orange-200/50 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-400"
                                  : "bg-muted text-muted-foreground border-border/50"
                              )}
                            >
                              {clientInfo.status}
                            </span>
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <input
                              type="email"
                              defaultValue={client.email}
                              onBlur={(e) => {
                                if (e.target.value !== client.email) {
                                  updateClient({ _id: client._id, data: { email: e.target.value } });
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') e.currentTarget.blur();
                              }}
                              className="text-muted-foreground text-[13px] font-medium bg-transparent border border-transparent hover:border-border focus:border-primary focus:ring-1 focus:ring-primary rounded px-2 py-1 -mx-2 transition-all w-full"
                            />
                          </td>

                          <td className="py-4 px-5 text-right align-middle pr-8">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                onClick={() => setEditingClient(client)}
                                aria-label="Edit client"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className={cn("h-8 w-8 text-muted-foreground rounded-lg", client.archived ? "hover:text-destructive hover:bg-destructive/10 text-destructive" : "hover:text-amber-600 hover:bg-amber-600/10")}
                                onClick={() => updateClient({ _id: client._id, data: { archived: !client.archived } })}
                                aria-label="Archive client"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() => {
                                  if(window.confirm('Are you sure you want to permanently delete this contact?')) {
                                    deleteClient({ _id: client._id });
                                  }
                                }}
                                aria-label="Delete client"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                              {client.fastwork_link && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                  asChild
                                >
                                  <a
                                    href={client.fastwork_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Fastwork profile"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  <tr className="bg-muted/10 hover:bg-muted/30 transition-colors">
                    <td colSpan={7} className="p-0 border-t border-border/40">
                      <div
                        onClick={() => setIsCreateOpen(true)}
                        className="px-8 py-3 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add someone
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-7xl bg-card border border-border/40 shadow-sm rounded-2xl overflow-hidden mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/40 bg-muted/30 text-[10px] uppercase tracking-widest font-black text-muted-foreground/70 text-left">
                    <th className="py-3.5 px-5 w-12 text-center"></th>
                    <th className="py-3.5 px-5">Company</th>
                    <th className="py-3.5 px-5">Team / Contacts</th>
                    <th className="py-3.5 px-5">Projects</th>
                    <th className="py-3.5 px-5 w-32">Status</th>
                    <th className="py-3.5 px-5">Primary Contact</th>
                    <th className="py-3.5 px-5 w-24 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-16 text-center text-sm font-medium text-muted-foreground">
                        <div className="flex flex-col items-center justify-center gap-3">
                          <Building2 className="h-10 w-10 text-muted-foreground/30" />
                          <span>No companies found.</span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => {
                      const actualClients = company.clients || [];
                      const primaryClient = actualClients[0] || null;

                      return (
                        <tr
                          key={company.name}
                          className="hover:bg-muted/30 transition-all duration-200 group bg-card"
                        >
                          <td className="py-3 px-5 text-center align-middle">
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/30 hover:border-primary hover:bg-primary/10 transition-all cursor-pointer mx-auto flex items-center justify-center group-hover:scale-110" />
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20 shadow-sm">
                                <Building2 className="h-4 w-4" />
                              </div>
                              <span
                                onClick={() => {
                                  setSelectedCompany(company.name);
                                  setViewMode('split');
                                }}
                                className="font-bold text-foreground/90 cursor-pointer hover:text-primary transition-all text-[13px] hover:underline"
                              >
                                {company.name}
                              </span>
                            </div>
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <div className="flex -space-x-2 overflow-hidden">
                              {actualClients.length === 0 ? (
                                <span className="text-[11px] text-muted-foreground/75 font-medium italic bg-muted/50 px-2 py-0.5 rounded-md border border-border/50">No contacts</span>
                              ) : (
                                actualClients.map((c: Client) => (
                                  <Tooltip key={c._id}>
                                    <TooltipTrigger asChild>
                                      <Avatar className={cn("h-8 w-8 border-2 border-background shadow-sm shrink-0 cursor-pointer hover:translate-y-[-2px] transition-transform hover:z-10", c.archived ? "opacity-50" : "")}>
                                        <AvatarImage src={c.avatarUrl} alt={c.name} />
                                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                          {c.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs font-medium">
                                      {c.name} ({c.email}) {c.archived ? '(Archived)' : ''}
                                    </TooltipContent>
                                  </Tooltip>
                                ))
                              )}
                            </div>
                          </td>

                          <td className="py-3 px-5 align-middle">
                            <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/20 font-bold text-[10px] px-2.5 py-0.5 rounded-md tracking-wide shadow-sm">
                              {company.projectsCount} {company.projectsCount === 1 ? 'Project' : 'Projects'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-3 px-5 align-middle">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-wider shadow-sm border",
                                company.status === "Active"
                                  ? "bg-green-50 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400"
                                  : company.status === "Pending"
                                  ? "bg-orange-50 text-orange-700 border-orange-200/50 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-400"
                                  : "bg-muted text-muted-foreground border-border/50"
                              )}
                            >
                              {company.status}
                            </span>
                          </td>

                          {/* Primary Contact Email */}
                          <td className="py-3 px-5 text-muted-foreground align-middle text-[13px] font-medium">
                            {primaryClient ? `${primaryClient.name} (${primaryClient.email})` : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right align-middle pr-8">
                            <div className="flex items-center justify-end gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-200" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                onClick={() => setEditingCompany(company)}
                                aria-label="Edit company"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-amber-600 hover:bg-amber-600/10 rounded-lg"
                                onClick={() => {
                                  // Archive all clients belonging to this company
                                  company.clients.forEach((c: any) => {
                                    updateClient({ _id: c._id, data: { archived: !c.archived } });
                                  });
                                }}
                                aria-label="Archive company"
                              >
                                <Archive className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg"
                                onClick={() => {
                                  if(window.confirm('Are you sure you want to permanently delete this company and all its contacts?')) {
                                    company.clients.forEach((c: any) => deleteClient({ _id: c._id }));
                                  }
                                }}
                                aria-label="Delete company"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Footer row: Add company */}
                  <tr className="bg-muted/10 hover:bg-muted/30 transition-colors">
                    <td colSpan={7} className="p-0 border-t border-border/40">
                      <div
                        onClick={() => setIsCompanyCreateOpen(true)}
                        className="px-8 py-3 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add company
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )
      ) : (
        activeTab === 'people' ? (
          <div className='grid gap-8 lg:grid-cols-3'>
            <div className='lg:col-span-1'>
              <Card className="border-border/40 shadow-sm rounded-2xl bg-card overflow-hidden">
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/20 border-b border-border/30'>
                  <CardTitle className="text-lg font-black">Clients</CardTitle>
                  <Button size='sm' onClick={() => setIsCreateOpen(true)} className="h-8 rounded-lg">
                    <Plus className='mr-1.5 h-4 w-4' />
                    Add
                  </Button>
                </CardHeader>
                <CardContent className="p-0">
                  {(isLoadingClients || isLoadingCompanies) ? (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                        <div className="h-4 w-24 bg-muted rounded"></div>
                      </div>
                    </div>
                  ) : (errorClients || errorCompanies) ? (
                    <div className='py-8 text-center text-sm text-destructive font-medium'>
                      Error loading clients
                    </div>
                  ) : clients.length === 0 ? (
                    <div className='py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3'>
                      <User className="h-10 w-10 text-muted-foreground/30" />
                      <span>No clients found.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30 max-h-[700px] overflow-y-auto">
                      {clients.map((client) => {
                        const completedProjectsCount = projects.filter(
                          (p) =>
                            p.clientId === client._id &&
                            (p.status === 'Completed' || p.status === 'Paid'),
                        ).length;
                        const isSelected = selectedClient?._id === client._id;

                        return (
                          <div
                            key={client._id}
                            onClick={() => setSelectedClient(client)}
                            className={cn(
                              "flex items-center justify-between p-4 transition-all cursor-pointer group",
                              isSelected
                                ? "bg-primary/5 relative"
                                : "hover:bg-muted/30 bg-card"
                            )}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-10 w-10 shrink-0 border border-border/50 shadow-sm">
                                <AvatarImage
                                  src={client.avatarUrl}
                                  alt={client.name}
                                  data-ai-hint="portrait person"
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold">
                                  {client.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className={cn("font-bold text-[13px] truncate", isSelected ? "text-primary" : "text-foreground")}>{client.name}</span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {completedProjectsCount} {completedProjectsCount === 1 ? 'project' : 'projects'} completed
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                onClick={() => setEditingClient(client)}
                                aria-label="Edit client"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {client.fastwork_link && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
                                  asChild
                                >
                                  <a
                                    href={client.fastwork_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Fastwork profile"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-2'>
              {selectedClient ? (
                <Card className="border-border/40 shadow-sm rounded-2xl bg-card overflow-hidden">
                  {/* COVER PHOTO */}
                  <div className="h-32 w-full bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-pink-500/20 relative">
                    {/* Placeholder for actual cover image if added in future */}
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  </div>

                  <div className="px-6 relative">
                    <div className='flex flex-col sm:flex-row items-start justify-between gap-4 -mt-12 mb-6'>
                      <div className='flex flex-col sm:flex-row items-center sm:items-end gap-4'>
                        <Avatar className='h-24 w-24 border-4 border-card shadow-md shrink-0 bg-card'>
                          <AvatarImage
                            src={selectedClient.avatarUrl}
                            alt={selectedClient.name}
                            data-ai-hint='portrait person'
                          />
                          <AvatarFallback className='text-3xl font-black bg-primary/10 text-primary'>
                            {selectedClient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="text-center sm:text-left mb-1">
                          <CardTitle className='text-2xl font-black tracking-tight text-foreground'>
                            {selectedClient.name}
                          </CardTitle>
                          <p className='text-muted-foreground text-[13px] font-medium'>
                            {selectedClient.email}
                          </p>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto mt-2 sm:mt-12 flex items-center justify-center sm:justify-end gap-2">
                        <Button
                          variant='outline'
                          size='sm'
                          className="rounded-xl font-bold text-xs h-9"
                        >
                          <MessageSquare className="mr-1.5 h-4 w-4" /> Message
                        </Button>
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => setEditingClient(selectedClient)}
                          className="rounded-xl font-bold text-xs h-9 shadow-sm"
                        >
                          <Pencil className="mr-1.5 h-4 w-4" /> Edit Details
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="bg-border/40" />
                    
                    <div className='grid gap-8 md:grid-cols-2 py-6'>
                      <div className="space-y-6">
                        <div>
                          <h4 className='mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                            Contact & Socials
                          </h4>
                          <div className='space-y-3 bg-muted/20 p-4 rounded-xl border border-border/30'>
                            {selectedClient.socials && selectedClient.socials.length > 0 ? (
                              selectedClient.socials.map(renderSocialLink)
                            ) : (
                              <p className='text-[13px] text-muted-foreground font-medium italic'>
                                No social links added.
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <h4 className='mb-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground'>Notes</h4>
                        <div className='bg-yellow-50/50 dark:bg-yellow-900/10 p-4 rounded-xl border border-yellow-200/50 dark:border-yellow-900/30 h-full min-h-[120px]'>
                          {selectedClient.notes ? (
                            <p className='text-[13px] text-foreground/80 whitespace-pre-wrap leading-relaxed font-medium'>
                              {selectedClient.notes}
                            </p>
                          ) : (
                            <p className='text-[13px] text-muted-foreground font-medium italic'>
                              No notes for this client.
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator className="bg-border/40" />

                    <div className="py-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className='text-[10px] font-black uppercase tracking-widest text-muted-foreground'>
                          Client Projects
                        </h4>
                        <Badge variant="secondary" className="rounded-full text-[10px] font-bold px-2 py-0.5">
                          {clientProjects.length} Total
                        </Badge>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {clientProjects.length > 0 ? (
                          clientProjects.map((project) => (
                            <div 
                              key={project.id} 
                              className="group flex flex-col justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                              onClick={() => setProjectModal(project)}
                            >
                              <div className="mb-3">
                                <h5 className='text-sm font-bold group-hover:text-primary transition-colors line-clamp-1'>
                                  {project.title}
                                </h5>
                              </div>
                              <div className='flex items-center justify-between mt-auto'>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "rounded-md border-0 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold shadow-sm",
                                    project.status === 'Completed' || project.status === 'Paid'
                                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                      : "bg-muted text-muted-foreground"
                                  )}
                                >
                                  {project.status}
                                </Badge>
                                <span className='font-black text-sm text-foreground/80 group-hover:text-foreground transition-colors'>
                                  {formatNumber(project.gross_price)}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="col-span-2 py-8 flex flex-col items-center justify-center gap-2 border border-dashed border-border/60 rounded-xl bg-muted/10">
                            <FolderKanban className="h-8 w-8 text-muted-foreground/40" />
                            <p className='text-[13px] text-muted-foreground font-medium'>
                              No projects found for this client.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className='flex flex-col items-center justify-center h-full min-h-[500px] border-dashed border-border/60 bg-muted/5 shadow-none'>
                  <User className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className='text-muted-foreground font-bold'>
                    Select a client to see details
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className='grid gap-8 lg:grid-cols-3'>
            <div className='lg:col-span-1'>
              <Card className="border-border/40 shadow-sm rounded-2xl bg-card overflow-hidden">
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4 bg-muted/20 border-b border-border/30'>
                  <CardTitle className="text-lg font-black">Companies</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  {(isLoadingClients || isLoadingCompanies) ? (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      <div className="animate-pulse flex flex-col items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-muted"></div>
                        <div className="h-4 w-24 bg-muted rounded"></div>
                      </div>
                    </div>
                  ) : (errorClients || errorCompanies) ? (
                    <div className='py-8 text-center text-sm text-destructive font-medium'>
                      Error loading companies
                    </div>
                  ) : companiesList.length === 0 ? (
                    <div className='py-12 text-center text-sm text-muted-foreground flex flex-col items-center gap-3'>
                      <Building2 className="h-10 w-10 text-muted-foreground/30" />
                      <span>No companies found.</span>
                    </div>
                  ) : (
                    <div className="divide-y divide-border/30 max-h-[700px] overflow-y-auto">
                      {companiesList.map((company) => {
                        const isSelected = selectedCompany === company.name;

                        return (
                          <div
                            key={company.name}
                            onClick={() => setSelectedCompany(company.name)}
                            className={cn(
                              "flex items-center justify-between p-4 transition-all cursor-pointer group",
                              isSelected
                                ? "bg-primary/5 relative"
                                : "hover:bg-muted/30 bg-card"
                            )}
                          >
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary"></div>
                            )}
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0 shadow-sm">
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className={cn("font-bold text-[13px] truncate", isSelected ? "text-primary" : "text-foreground")}>{company.name}</span>
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {company.clients.length} {company.clients.length === 1 ? 'contact' : 'contacts'}
                                </span>
                              </div>
                            </div>
                            <span className={cn(
                              "inline-flex items-center justify-center h-5 px-2 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ml-2 shadow-sm border",
                              company.status === "Active"
                                ? "bg-green-50 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400"
                                : company.status === "Pending"
                                ? "bg-orange-50 text-orange-700 border-orange-200/50 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-400"
                                : "bg-muted text-muted-foreground border-border/50"
                            )}>
                              {company.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className='lg:col-span-2'>
              {activeCompanyInfo ? (
                <Card className="border-border/40 shadow-sm rounded-2xl bg-card overflow-hidden">
                  {/* COVER PHOTO */}
                  <div className="h-32 w-full bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 relative">
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                  </div>

                  <div className="px-6 relative">
                    <div className='flex flex-col sm:flex-row items-start justify-between gap-4 -mt-12 mb-6'>
                      <div className='flex flex-col sm:flex-row items-center sm:items-end gap-4'>
                        <div className='h-24 w-24 rounded-2xl bg-card text-primary flex items-center justify-center border-4 border-card shadow-md shrink-0 relative'>
                          <div className="absolute inset-0 bg-primary/10 rounded-xl m-1"></div>
                          <Building2 className='h-10 w-10 relative z-10' />
                        </div>
                        <div className="text-center sm:text-left mb-1">
                          <CardTitle className='text-2xl font-black tracking-tight text-foreground'>
                            {activeCompanyInfo.name}
                          </CardTitle>
                          <div className='mt-2 flex items-center justify-center sm:justify-start gap-2'>
                            <span className={cn(
                              "inline-flex items-center justify-center h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-wider border shadow-sm",
                              activeCompanyInfo.status === "Active"
                                ? "bg-green-50 text-green-700 border-green-200/50 dark:bg-green-950/30 dark:border-green-900/50 dark:text-green-400"
                                : activeCompanyInfo.status === "Pending"
                                ? "bg-orange-50 text-orange-700 border-orange-200/50 dark:bg-orange-950/30 dark:border-orange-900/50 dark:text-orange-400"
                                : "bg-muted text-muted-foreground border-border/50"
                            )}>
                              {activeCompanyInfo.status}
                            </span>
                            <span className="text-[12px] text-muted-foreground font-medium">
                              &bull; {activeCompanyInfo.clients.length} {activeCompanyInfo.clients.length === 1 ? 'contact' : 'contacts'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="w-full sm:w-auto mt-2 sm:mt-12 flex items-center justify-center sm:justify-end gap-2">
                        <Button
                          variant='default'
                          size='sm'
                          onClick={() => setEditingCompany(activeCompanyInfo)}
                          className="rounded-xl font-bold text-xs h-9 shadow-sm"
                        >
                          <Pencil className="mr-1.5 h-4 w-4" /> Edit Company
                        </Button>
                      </div>
                    </div>
                    
                    <Separator className="bg-border/40" />
                    
                    {/* Contacts List */}
                    <div className="py-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5'>
                          <User className="h-3.5 w-3.5" />
                          Associated Contacts
                        </h4>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {activeCompanyInfo.clients.map((client: Client) => (
                          <div 
                            key={client._id} 
                            className="group flex items-center justify-between p-3 rounded-xl border border-border/40 bg-card hover:bg-muted/20 hover:border-primary/30 transition-all shadow-sm"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-10 w-10 shrink-0 border border-border/50 shadow-sm">
                                <AvatarImage src={client.avatarUrl} alt={client.name} />
                                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                                  {client.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <p className="font-bold text-[13px] truncate group-hover:text-primary transition-colors">{client.name}</p>
                                <p className="text-[11px] text-muted-foreground font-medium truncate">{client.email}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-primary hover:text-primary/95 text-xs font-bold shrink-0 rounded-lg h-8 px-3 opacity-0 group-hover:opacity-100 transition-opacity bg-primary/5"
                              onClick={() => {
                                setSelectedClient(client);
                                setActiveTab('people');
                                setViewMode('split');
                              }}
                            >
                              View Profile
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Separator className="bg-border/40" />

                    {/* Company Projects */}
                    <div className="py-6">
                      <div className="flex items-center justify-between mb-4">
                        <h4 className='text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-1.5'>
                          <FolderKanban className="h-3.5 w-3.5" />
                          Company Projects
                        </h4>
                      </div>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {(() => {
                          const companyProjects = projects.filter(p => 
                            activeCompanyInfo.clients.some((c: any) => c._id === p.clientId)
                          );
                          
                          return companyProjects.length > 0 ? (
                            companyProjects.map((project) => (
                              <div 
                                key={project.id} 
                                className="group flex flex-col justify-between p-4 rounded-xl border border-border/40 bg-card hover:bg-muted/20 hover:border-primary/30 transition-all cursor-pointer shadow-sm hover:shadow-md"
                                onClick={() => setProjectModal(project)}
                              >
                                <div className="mb-3">
                                  <h5 className='text-sm font-bold group-hover:text-primary transition-colors line-clamp-1'>
                                    {project.title}
                                  </h5>
                                </div>
                                <div className='flex items-center justify-between mt-auto mb-2'>
                                  <Badge
                                    variant="outline"
                                    className={cn(
                                      "rounded-md border-0 px-2 py-0.5 text-[9px] uppercase tracking-wider font-bold shadow-sm",
                                      project.status === 'Completed' || project.status === 'Paid'
                                        ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                                        : "bg-muted text-muted-foreground"
                                    )}
                                  >
                                    {project.status}
                                  </Badge>
                                  <span className='font-black text-sm text-foreground/80 group-hover:text-foreground transition-colors'>
                                    {formatNumber(project.gross_price)}
                                  </span>
                                </div>
                                {project.subTasks && project.subTasks.length > 0 && (
                                  <div className="space-y-1.5 pt-2 border-t border-border/30 mt-1">
                                    <div className="flex items-center justify-between text-[10px] text-muted-foreground font-black uppercase tracking-widest">
                                      <span>Progress</span>
                                      <span className={cn(
                                        calculateProgress(project.subTasks) === 100 ? "text-emerald-500" : "text-primary"
                                      )}>{Math.round(calculateProgress(project.subTasks))}%</span>
                                    </div>
                                    <Progress value={calculateProgress(project.subTasks)} className="h-1.5 bg-muted/50" />
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 py-8 flex flex-col items-center justify-center gap-2 border border-dashed border-border/60 rounded-xl bg-muted/10">
                              <FolderKanban className="h-8 w-8 text-muted-foreground/40" />
                              <p className='text-[13px] text-muted-foreground font-medium'>
                                No projects found for this company.
                              </p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </Card>
              ) : (
                <Card className='flex flex-col items-center justify-center h-full min-h-[500px] border-dashed border-border/60 bg-muted/5 shadow-none'>
                  <Building2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
                  <p className='text-muted-foreground font-bold'>
                    Select a company to see details
                  </p>
                </Card>
              )}
            </div>
          </div>
        )
      )}

      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-[20px] overflow-hidden border border-border/40">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-[#2c2c54] dark:text-white">Create profile</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-2">
            <ClientForm
              mode="create"
              onSubmit={handleAddClient}
              submitLabel="Create profile"
              onCancel={() => setIsCreateOpen(false)}
              isLoading={isAddingClient}
              companyList={companiesList.map((c: any) => c.name)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editingClient}
        onOpenChange={(open) => !open && setEditingClient(null)}
      >
        <DialogContent className="sm:max-w-[500px] p-6 rounded-[20px] overflow-hidden border border-border/40">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-[#2c2c54] dark:text-white">Edit profile</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[75vh] pr-2">
            <ClientForm
              mode="edit"
              defaultValues={{
                ...editingClient,
                companyName: editingClient?.companyId 
                  ? rawCompanies.find((c: any) => c._id === editingClient.companyId)?.name 
                  : '',
              }}
              onSubmit={handleEditClient}
              submitLabel="Save profile"
              onCancel={() => setEditingClient(null)}
              isLoading={isUpdatingClient || isAddingClient}
              companyList={companiesList.map((c: any) => c.name)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Create / Edit Company Dialog (Plutio style) */}
      <Dialog open={isCompanyCreateOpen || !!editingCompany} onOpenChange={(open) => {
        if (!open) {
          setIsCompanyCreateOpen(false);
          setEditingCompany(null);
          setCompFormName('');
          setCompFormEmail('');
          setCompFormPhone('');
          setCompFormCustomFields([]);
          setCompFormAddress('');
          setCompFormCityState('');
          setCompFormCountry('');
          setCompFormZip('');
          setCompFormTimezone('Asia/Bangkok');
          setCompFormBio('');
        }
      }}>
        <DialogContent className="sm:max-w-[500px] p-6 rounded-[20px] border border-border/40">
          <DialogHeader className="pb-2">
            <DialogTitle className="text-xl font-bold text-[#2c2c54] dark:text-white">
              {editingCompany ? 'Edit company' : 'Create company'}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-2">
            <div className="space-y-4 pt-2 pb-2">
              {/* Company Name */}
              <div className={stackedInputClass}>
                <span className={labelClass}>Company name*</span>
                <input
                  className={inputClass}
                  placeholder="Enter company name"
                  value={compFormName}
                  onChange={(e) => setCompFormName(e.target.value)}
                />
              </div>

              {/* Email Address */}
              <div className={stackedInputClass}>
                <span className={labelClass}>Email address</span>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="company@domain.com"
                  value={compFormEmail}
                  onChange={(e) => setCompFormEmail(e.target.value)}
                />
              </div>

              {/* Phone Number */}
              <div className={stackedInputClass}>
                <span className={labelClass}>Phone number</span>
                <input
                  className={inputClass}
                  placeholder="Enter phone number"
                  value={compFormPhone}
                  onChange={(e) => setCompFormPhone(e.target.value)}
                />
              </div>

              {/* Address */}
              <div className={stackedInputClass}>
                <span className={labelClass}>Address</span>
                <input
                  className={inputClass}
                  placeholder="Street address"
                  value={compFormAddress}
                  onChange={(e) => setCompFormAddress(e.target.value)}
                />
              </div>

              {/* City/State & Zip (Side by Side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className={stackedInputClass}>
                  <span className={labelClass}>City / State</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Bangkok"
                    value={compFormCityState}
                    onChange={(e) => setCompFormCityState(e.target.value)}
                  />
                </div>
                <div className={stackedInputClass}>
                  <span className={labelClass}>Zip Code</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. 10110"
                    value={compFormZip}
                    onChange={(e) => setCompFormZip(e.target.value)}
                  />
                </div>
              </div>

              {/* Country & Timezone (Side by Side) */}
              <div className="grid grid-cols-2 gap-3">
                <div className={stackedInputClass}>
                  <span className={labelClass}>Country</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Thailand"
                    value={compFormCountry}
                    onChange={(e) => setCompFormCountry(e.target.value)}
                  />
                </div>
                <div className={stackedInputClass}>
                  <span className={labelClass}>Timezone</span>
                  <Select
                    onValueChange={(val: string) => setCompFormTimezone(val)}
                    value={compFormTimezone}
                  >
                    <SelectTrigger className="border-none p-0 h-auto bg-transparent focus:ring-0 text-[13px] text-foreground shadow-none">
                      <SelectValue placeholder="Timezone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Bio */}
              <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <span className={labelClass}>Bio</span>
                <textarea
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground placeholder:text-muted-foreground/40 w-full resize-none min-h-[60px]"
                  placeholder="Tell us about the company..."
                  value={compFormBio}
                  onChange={(e) => setCompFormBio(e.target.value)}
                />
              </div>

              {/* Custom Fields List */}
              {compFormCustomFields.length > 0 && (
                <div className="space-y-3">
                  {compFormCustomFields.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <div className="flex-grow grid grid-cols-[1fr_2fr] border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-[14px] divide-x divide-[#d0d0eb] dark:divide-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
                        <div className="space-y-0 p-3 py-2 flex flex-col justify-center">
                          <span className={labelClass}>Field Label</span>
                          <input
                            className={inputClass}
                            placeholder="Label"
                            value={item.label}
                            onChange={(e) => {
                              const updated = [...compFormCustomFields];
                              updated[index].label = e.target.value;
                              setCompFormCustomFields(updated);
                            }}
                          />
                        </div>
                        <div className="space-y-0 p-3 py-2 flex flex-col justify-center">
                          <span className={labelClass}>Field Value</span>
                          <input
                            className={inputClass}
                            placeholder="Value"
                            value={item.value}
                            onChange={(e) => {
                              const updated = [...compFormCustomFields];
                              updated[index].value = e.target.value;
                              setCompFormCustomFields(updated);
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[14px] border border-dashed border-[#d0d0eb] dark:border-slate-700 shrink-0"
                        onClick={() => {
                          setCompFormCustomFields(compFormCustomFields.filter((_, idx) => idx !== index));
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Custom Field Button */}
              <button
                type="button"
                onClick={() => setCompFormCustomFields([...compFormCustomFields, { label: '', value: '' }])}
                className="w-full flex items-center justify-between border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-muted/50 rounded-[14px] p-3 text-muted-foreground transition-all"
              >
                <div className="flex items-center gap-3 font-semibold text-xs text-[#8b8ba9] dark:text-slate-300">
                  <div className="h-4 w-4 rounded-md border border-current flex items-center justify-center text-[10px] font-bold">
                    +
                  </div>
                  <span>Add custom field</span>
                </div>
                <HelpCircle className="h-4 w-4 text-muted-foreground/40" />
              </button>

              {/* Action Buttons (Plutio styling) */}
              <div className="flex gap-3 pt-4 border-t border-border/20">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsCompanyCreateOpen(false);
                    setEditingCompany(null);
                    setCompFormName('');
                    setCompFormEmail('');
                    setCompFormPhone('');
                    setCompFormCustomFields([]);
                    setCompFormAddress('');
                    setCompFormCityState('');
                    setCompFormCountry('');
                    setCompFormZip('');
                    setCompFormTimezone('Asia/Bangkok');
                    setCompFormBio('');
                  }}
                  className="flex-1 rounded-[14px] h-10 border border-[#d0d0eb] text-muted-foreground bg-slate-50 hover:bg-slate-100 font-semibold"
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleCompanySubmit}
                  disabled={!compFormName.trim() || isAddingClient || isUpdatingClient}
                  className={cn(
                    "flex-1 rounded-[14px] h-10 font-bold transition-all flex items-center justify-center gap-1.5",
                    compFormName.trim()
                      ? "bg-[#47c947] hover:bg-[#3fb33f] text-white"
                      : "bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300"
                  )}
                >
                  {compFormName.trim()
                    ? (editingCompany ? 'Save changes' : 'Create company →')
                    : 'Enter company name to continue →'}
                </Button>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Project Detail Dialog */}
      <Dialog
        open={!!projectModal}
        onOpenChange={(isOpen) => !isOpen && setProjectModal(null)}
      >
        <DialogContent className='sm:max-w-2xl h-[90vh] flex flex-col'>
          {projectModal && (
            <>
              <DialogHeader>
                <DialogTitle className='text-2xl'>
                  {projectModal.title}
                </DialogTitle>
                <DialogDescription>
                  In status{' '}
                  <span className='font-semibold'>{projectModal.status}</span>{' '}
                  &bull; Due by {format(new Date(projectModal.deadline), 'PPP')}
                </DialogDescription>
              </DialogHeader>
              <ScrollArea className='flex-grow pr-6 -mr-6'>
                <div className='space-y-6 pb-6'>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                      {/* <DollarSign className='h-6 w-6 text-muted-foreground' /> */}
                      <div>
                        <p className='text-sm text-muted-foreground'>Price</p>
                        <p className='font-semibold text-lg'>
                          {formatNumber(projectModal.gross_price)}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                      <MessageSquare className='h-6 w-6 text-muted-foreground' />
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Revisions
                        </p>
                        <p className='font-semibold text-lg'>
                          {projectModal.revisions}
                        </p>
                      </div>
                    </div>
                    <div className='flex items-center gap-3 p-4 rounded-lg bg-muted'>
                      <Clock className='h-6 w-6 text-muted-foreground' />
                      <div>
                        <p className='text-sm text-muted-foreground'>
                          Deadline
                        </p>
                        <p className='font-semibold'>
                          {format(
                            new Date(projectModal.deadline),
                            'MMM d, yyyy',
                          )}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {projectModal.subTasks &&
                    projectModal.subTasks.length > 0 && (
                      <div>
                        <h3 className='text-lg font-semibold mb-4 flex items-center gap-2'>
                          <ListTodo className='h-5 w-5' />
                          Sub-tasks
                        </h3>
                        <div className='space-y-4'>
                          <div className='flex items-center gap-4'>
                            <Progress
                              value={projectModalProgress}
                              className='h-2'
                            />
                            <span className='text-sm font-medium text-muted-foreground whitespace-nowrap'>
                              {Math.round(projectModalProgress)}%
                            </span>
                          </div>

                          {renderSubtasksReadOnly(projectModal.subTasks)}
                        </div>
                      </div>
                    )}
                </div>
              </ScrollArea>
            </>
          )}
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}
