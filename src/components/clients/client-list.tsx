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
} from 'lucide-react';
import { Client, Project, Social, SubTask, Task } from '@/lib/types';
import {
  useGetClientsQuery,
  useAddClientMutation,
  useUpdateClientMutation,
} from '@/services/clientApi';
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
  
  return 'Sabai Sabai Workspace'; // Default fallback matching original mockup
};

export function ClientList({ tasks }: ClientListProps) {
  const projects = tasks; // Alias for compatibility with internal UI naming
  const {
    data: clients = [],
    isLoading,
    error,
    refetch,
  } = useGetClientsQuery();
  const [addClient, { isLoading: isAddingClient }] = useAddClientMutation();
  const [updateClient, { isLoading: isUpdatingClient }] =
    useUpdateClientMutation();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [projectModal, setProjectModal] = useState<Task | null>(null);

  const [viewMode, setViewMode] = useState<'table' | 'split'>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'people' | 'companies'>('people');
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  // States for Company Creation / Edit (Plutio redesign)
  const [isCompanyCreateOpen, setIsCompanyCreateOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<{
    name: string;
    clients: Client[];
    status: 'Active' | 'Pending' | 'Inactive';
    projectsCount: number;
  } | null>(null);
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

  // Dynamic client statuses and projects
  const clientStatusMap = useMemo(() => {
    const map: { [clientId: string]: { status: 'Active' | 'Pending' | 'Inactive'; projectsCount: number } } = {};
    
    clients.forEach(client => {
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
    const companyMap: {
      [name: string]: {
        name: string;
        clients: Client[];
        status: 'Active' | 'Pending' | 'Inactive';
        projectsCount: number;
      }
    } = {};

    clients.forEach((client) => {
      const compName = getClientCompany(client);
      const clientInfo = clientStatusMap[client._id] || { status: 'Inactive', projectsCount: 0 };

      if (!companyMap[compName]) {
        companyMap[compName] = {
          name: compName,
          clients: [],
          status: 'Inactive',
          projectsCount: 0,
        };
      }

      companyMap[compName].clients.push(client);
      companyMap[compName].projectsCount += clientInfo.projectsCount;

      const currentStatus = companyMap[compName].status;
      if (clientInfo.status === 'Active') {
        companyMap[compName].status = 'Active';
      } else if (clientInfo.status === 'Pending' && currentStatus !== 'Active') {
        companyMap[compName].status = 'Pending';
      }
    });

    return Object.values(companyMap);
  }, [clients, clientStatusMap]);

  const filteredCompanies = useMemo(() => {
    if (!searchQuery.trim()) return companiesList;
    const query = searchQuery.toLowerCase();
    return companiesList.filter((comp) =>
      comp.name.toLowerCase().includes(query) ||
      comp.clients.some(c => c.name.toLowerCase().includes(query) || c.email.toLowerCase().includes(query))
    );
  }, [companiesList, searchQuery]);

  const statusCounts = useMemo(() => {
    if (activeTab === 'companies') {
      const counts = {
        Total: companiesList.length,
        Pending: 0,
        Active: 0,
        Inactive: 0,
      };
      companiesList.forEach(comp => {
        counts[comp.status]++;
      });
      return counts;
    }

    const counts = {
      Total: clients.length,
      Pending: 0,
      Active: 0,
      Inactive: 0,
    };
    
    clients.forEach(client => {
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
    const actualPeople = clients.filter(c => !c.isCompany);
    if (!searchQuery.trim()) return actualPeople;
    const query = searchQuery.toLowerCase();
    return actualPeople.filter(c => 
      c.name.toLowerCase().includes(query) || 
      c.email.toLowerCase().includes(query) ||
      (c.notes && c.notes.toLowerCase().includes(query))
    );
  }, [clients, searchQuery]);

  // sync selectedClient with clients
  useEffect(() => {
    setSelectedClient((prev) => {
      if (prev && clients.some((c) => c._id === prev._id)) {
        return clients.find((c) => c._id === prev._id) || null;
      }
      const actualPeople = clients.filter(c => !c.isCompany);
      if (!prev && actualPeople.length > 0) {
        return actualPeople[0];
      }
      return prev;
    });
  }, [clients]);

  // sync selectedCompany with companiesList
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

  // Load company form values when editing
  useEffect(() => {
    if (editingCompany) {
      const placeholder = editingCompany.clients.find(c => c.isCompany);
      setCompFormName(editingCompany.name);
      setCompFormEmail(placeholder ? placeholder.email : '');
      setCompFormPhone(placeholder ? (placeholder.phone || placeholder.socials?.find(s => s.platform === 'Phone')?.value || '') : '');
      setCompFormCustomFields(placeholder ? (placeholder.customFields || []) : []);
      setCompFormAddress(placeholder ? (placeholder.address || '') : '');
      setCompFormCityState(placeholder ? (placeholder.city_state || '') : '');
      setCompFormCountry(placeholder ? (placeholder.country || '') : '');
      setCompFormZip(placeholder ? (placeholder.zip || '') : '');
      setCompFormTimezone(placeholder ? (placeholder.timezone || 'Asia/Bangkok') : 'Asia/Bangkok');
      setCompFormBio(placeholder ? (placeholder.bio || '') : '');
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
    await addClient(values);
    await refetch();
    setIsCreateOpen(false);
  };

  const handleEditClient = async (values: any) => {
    if (!editingClient || !editingClient._id) return;
    await updateClient({
      _id: editingClient._id,
      data: values,
    });
    await refetch();
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
      // 1. Update/create placeholder client document in DB
      const placeholder = editingCompany.clients.find(c => c.isCompany);
      if (placeholder) {
        await updateClient({
          _id: placeholder._id,
          data: {
            name: name,
            companyName: name,
            email: email,
            phone: phone,
            socials: phone ? [{ id: `soc-phone-${Date.now()}`, platform: 'Phone', value: phone }] : [],
            notes: `company: ${name}\nisCompany: true\nphone: ${phone}\naddress: ${address}\ncity_state: ${cityState}\ncountry: ${country}\nzip: ${zip}\ntimezone: ${timezone}\nbio: ${bio}` + 
                   (customFields.length > 0 ? '\n' + customFields.map(cf => `custom_field:${cf.label}:${cf.value}`).join('\n') : ''),
            customFields: customFields,
            address,
            city_state: cityState,
            country,
            zip,
            timezone,
            bio,
          }
        });
      } else {
        await addClient({
          name: name,
          companyName: name,
          email: email,
          isCompany: true,
          phone: phone,
          socials: phone ? [{ id: `soc-phone-${Date.now()}`, platform: 'Phone', value: phone }] : [],
          notes: `company: ${name}\nisCompany: true\nphone: ${phone}\naddress: ${address}\ncity_state: ${cityState}\ncountry: ${country}\nzip: ${zip}\ntimezone: ${timezone}\nbio: ${bio}` + 
                 (customFields.length > 0 ? '\n' + customFields.map(cf => `custom_field:${cf.label}:${cf.value}`).join('\n') : ''),
          customFields: customFields,
          fastwork_link: '',
          address,
          city_state: cityState,
          country,
          zip,
          timezone,
          bio,
        });
      }

      // 2. Cascade rename companyName to all members of the company
      for (const client of editingCompany.clients) {
        if (client.isCompany) continue;
        const updatedNotes = client.notes ? client.notes.split('\n').map(line => {
          if (line.toLowerCase().startsWith('company:')) {
            return `company: ${name}`;
          }
          return line;
        }).join('\n') : `company: ${name}`;

        await updateClient({
          _id: client._id,
          data: {
            companyName: name,
            notes: updatedNotes
          }
        });
      }
      setEditingCompany(null);
    } else {
      // Create new company
      await addClient({
        name: name,
        companyName: name,
        email: email,
        isCompany: true,
        phone: phone,
        socials: phone ? [{ id: `soc-phone-${Date.now()}`, platform: 'Phone', value: phone }] : [],
        notes: `company: ${name}\nisCompany: true\nphone: ${phone}\naddress: ${address}\ncity_state: ${cityState}\ncountry: ${country}\nzip: ${zip}\ntimezone: ${timezone}\nbio: ${bio}` + 
               (customFields.length > 0 ? '\n' + customFields.map(cf => `custom_field:${cf.label}:${cf.value}`).join('\n') : ''),
        customFields: customFields,
        fastwork_link: '',
        address,
        city_state: cityState,
        country,
        zip,
        timezone,
        bio,
      });
      setIsCompanyCreateOpen(false);
    }

    await refetch();
    // Reset form states
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

  const renderSubtasksReadOnly = (tasks: SubTask[], level = 0) => (
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
      {/* BREADCRUMB HEADER */}
      <div className="flex-shrink-0 flex items-center gap-2 mb-2 text-sm font-bold text-muted-foreground/90">
        <span>Contacts</span>
        <span>/</span>
        <span className="text-foreground/90">People</span>
      </div>

      {/* PEOPLE / COMPANIES TABS */}
      <div className="flex-shrink-0 flex border-b border-border/40 gap-4 mb-4 select-none">
        <button
          onClick={() => setActiveTab('people')}
          className={cn(
            "pb-2.5 text-xs font-bold transition-all relative",
            activeTab === 'people'
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          People
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={cn(
            "pb-2.5 text-xs font-bold transition-all relative",
            activeTab === 'companies'
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground"
          )}
        >
          Companies
        </button>
      </div>

      {/* HEADER CONTROLS */}
      <div className="flex-shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search bar */}
          <div className="relative w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground/75" />
            <Input
              placeholder="Search contacts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-9 rounded-xl border-border/70 focus-visible:ring-primary w-full bg-background/50 shadow-2xs"
            />
          </div>

          {/* View switcher */}
          <div className="flex bg-muted p-1 rounded-xl text-xs border border-border/40 shrink-0 shadow-2xs">
            <Button
              variant={viewMode === 'table' ? 'default' : 'ghost'}
              size="sm"
              className={cn(
                "h-8 px-3 rounded-lg text-xs font-bold transition-all duration-200",
                viewMode === 'table'
                  ? "bg-background text-primary shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
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
                  : "text-muted-foreground hover:text-foreground"
              )}
              onClick={() => setViewMode('split')}
            >
              <LayoutGrid className="mr-1.5 h-3.5 w-3.5" /> CRM View
            </Button>
          </div>

          {/* Static decoration buttons to match Plutio style header */}
          <div className="hidden lg:flex items-center gap-1 bg-muted p-1 rounded-xl border border-border/40 shrink-0 shadow-2xs">
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Edit view</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Filter</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Group</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Order</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Archived</Button>
            <Button variant="ghost" className="h-8 text-xs text-muted-foreground font-semibold px-2.5">Import / Export</Button>
          </div>
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

      {/* STATUS SUMMARY BAR */}
      <div className="flex-shrink-0 flex items-center gap-2.5 mb-6 flex-wrap select-none">
        <div className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/50 dark:border-slate-700 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>{statusCounts.Total} {activeTab === 'companies' ? 'Companies' : 'Contacts'}</span>
        </div>
        <div className="bg-orange-500/10 text-orange-700 dark:text-orange-400 border border-orange-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-orange-500" />
          <span>{statusCounts.Pending} Pending</span>
        </div>
        <div className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>{statusCounts.Active} Active</span>
        </div>
        <div className="bg-slate-500/10 text-slate-700 dark:text-slate-400 border border-slate-200/20 px-3.5 py-1.5 rounded-full text-xs font-bold flex items-center gap-2 shadow-2xs">
          <span className="w-2 h-2 rounded-full bg-slate-500" />
          <span>{statusCounts.Inactive} Inactive</span>
        </div>
      </div>

      {viewMode === 'table' ? (
        activeTab === 'people' ? (
          <Card className="border border-border/50 shadow-sm overflow-hidden bg-card rounded-2xl mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 text-left">
                    <th className="py-3 px-5 w-12 text-center"></th>
                    <th className="py-3 px-5">Contact</th>
                    <th className="py-3 px-5">User role</th>
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-5 w-32">Status</th>
                    <th className="py-3 px-5">Email address</th>
                    <th className="py-3 px-5 w-24 text-right pr-8">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No contacts found.
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map((client) => {
                      const clientInfo = clientStatusMap[client._id] || { status: 'Inactive', projectsCount: 0 };

                      return (
                        <tr
                          key={client._id}
                          className="hover:bg-muted/15 transition-all duration-150 group"
                        >
                          {/* Checkbox circle */}
                          <td className="py-4 px-5 text-center align-middle">
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/25 hover:border-primary/80 hover:bg-primary/5 transition-all cursor-pointer mx-auto flex items-center justify-center group-hover:scale-105" />
                          </td>

                          {/* Contact Info (Avatar + Name) */}
                          <td className="py-4 px-5 align-middle">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8 border border-primary/10 shadow-3xs shrink-0">
                                <AvatarImage src={client.avatarUrl} alt={client.name} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs">
                                  {client.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <span
                                onClick={() => {
                                  setSelectedClient(client);
                                  setViewMode('split');
                                }}
                                className="font-bold text-foreground/90 cursor-pointer hover:text-primary hover:underline transition-all"
                              >
                                {client.name}
                              </span>
                            </div>
                          </td>

                          {/* User role */}
                          <td className="py-4 px-5 align-middle">
                            <span className="inline-flex items-center bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              Client
                            </span>
                          </td>

                          {/* Company */}
                          <td className="py-4 px-5 align-middle">
                            <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              <Building2 className="h-3 w-3" /> {getClientCompany(client)}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5 align-middle">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-wider shadow-3xs",
                                clientInfo.status === "Active"
                                  ? "bg-green-500/10 text-green-700"
                                  : clientInfo.status === "Pending"
                                  ? "bg-amber-500/10 text-amber-700"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {clientInfo.status}
                            </span>
                          </td>

                          {/* Email address */}
                          <td className="py-4 px-5 text-muted-foreground align-middle font-medium">
                            {client.email}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right align-middle pr-8">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
                                onClick={() => setEditingClient(client)}
                                aria-label="Edit client"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                              {client.fastwork_link && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
                                  asChild
                                >
                                  <a
                                    href={client.fastwork_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    aria-label="Fastwork profile"
                                  >
                                    <ExternalLink className="h-3.5 w-3.5" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Footer row: Add someone */}
                  <tr className="bg-muted/5 hover:bg-muted/10 transition-colors">
                    <td colSpan={7} className="p-0">
                      <div
                        onClick={() => setIsCreateOpen(true)}
                        className="px-8 py-4 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add someone
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        ) : (
          <Card className="border border-border/50 shadow-sm overflow-hidden bg-card rounded-2xl mb-8">
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-border/30 bg-muted/5 text-[10px] uppercase tracking-wider font-bold text-muted-foreground/80 text-left">
                    <th className="py-3 px-5 w-12 text-center"></th>
                    <th className="py-3 px-5">Company</th>
                    <th className="py-3 px-5">Team / Contacts</th>
                    <th className="py-3 px-5">Projects</th>
                    <th className="py-3 px-5 w-32">Status</th>
                    <th className="py-3 px-5">Primary Contact</th>
                    <th className="py-3 px-5 w-24 text-right pr-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredCompanies.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-sm text-muted-foreground">
                        No companies found.
                      </td>
                    </tr>
                  ) : (
                    filteredCompanies.map((company) => {
                      const actualClients = company.clients.filter(c => !c.isCompany);
                      const primaryClient = actualClients[0] || null;

                      return (
                        <tr
                          key={company.name}
                          className="hover:bg-muted/15 transition-all duration-150 group"
                        >
                          {/* Checkbox circle */}
                          <td className="py-4 px-5 text-center align-middle">
                            <div className="w-4 h-4 rounded-full border border-muted-foreground/25 hover:border-primary/80 hover:bg-primary/5 transition-all cursor-pointer mx-auto flex items-center justify-center group-hover:scale-105" />
                          </td>

                          {/* Company Name */}
                          <td className="py-4 px-5 align-middle">
                            <div className="flex items-center gap-3">
                              <div className="h-8 w-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
                                <Building2 className="h-4.5 w-4.5" />
                              </div>
                              <span
                                onClick={() => {
                                  setSelectedCompany(company.name);
                                  setViewMode('split');
                                }}
                                className="font-bold text-foreground/90 cursor-pointer hover:text-primary hover:underline transition-all"
                              >
                                {company.name}
                              </span>
                            </div>
                          </td>

                          {/* Team / Contacts (Avatars) */}
                          <td className="py-4 px-5 align-middle">
                            <div className="flex -space-x-2 overflow-hidden">
                              {actualClients.length === 0 ? (
                                <span className="text-xs text-muted-foreground/75 italic">No contacts</span>
                              ) : (
                                actualClients.map((c) => (
                                  <Tooltip key={c._id}>
                                    <TooltipTrigger asChild>
                                      <Avatar className="h-7 w-7 border-2 border-background shadow-3xs shrink-0 cursor-pointer hover:translate-y-[-2px] transition-transform">
                                        <AvatarImage src={c.avatarUrl} alt={c.name} />
                                        <AvatarFallback className="bg-primary/5 text-primary font-bold text-[10px]">
                                          {c.name.charAt(0)}
                                        </AvatarFallback>
                                      </Avatar>
                                    </TooltipTrigger>
                                    <TooltipContent side="top" className="text-xs">
                                      {c.name} ({c.email})
                                    </TooltipContent>
                                  </Tooltip>
                                ))
                              )}
                            </div>
                          </td>

                          {/* Projects Count */}
                          <td className="py-4 px-5 align-middle">
                            <span className="inline-flex items-center gap-1.5 bg-primary/5 text-primary border border-primary/10 font-bold text-[10px] px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                              {company.projectsCount} {company.projectsCount === 1 ? 'Project' : 'Projects'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="py-4 px-5 align-middle">
                            <span
                              className={cn(
                                "inline-flex items-center justify-center h-6 px-3 rounded-full text-[9px] font-black uppercase tracking-wider shadow-3xs",
                                company.status === "Active"
                                  ? "bg-green-500/10 text-green-700"
                                  : company.status === "Pending"
                                  ? "bg-amber-500/10 text-amber-700"
                                  : "bg-muted text-muted-foreground"
                              )}
                            >
                              {company.status}
                            </span>
                          </td>

                          {/* Primary Contact Email */}
                          <td className="py-4 px-5 text-muted-foreground align-middle font-medium">
                            {primaryClient ? `${primaryClient.name} (${primaryClient.email})` : '-'}
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right align-middle pr-8">
                            <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg"
                                onClick={() => setEditingCompany(company)}
                                aria-label="Edit company"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}

                  {/* Footer row: Add company */}
                  <tr className="bg-muted/5 hover:bg-muted/10 transition-colors">
                    <td colSpan={7} className="p-0">
                      <div
                        onClick={() => setIsCompanyCreateOpen(true)}
                        className="px-8 py-4 cursor-pointer flex items-center gap-2 text-primary/80 hover:text-primary font-bold text-xs transition-colors"
                      >
                        <Plus className="h-4 w-4" /> Add company
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </Card>
        )
      ) : (
        activeTab === 'people' ? (
          <div className='grid gap-8 lg:grid-cols-3'>
            <div className='lg:col-span-1'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                  <CardTitle>Clients</CardTitle>
                  <Button size='sm' onClick={() => setIsCreateOpen(true)}>
                    <Plus className='mr-1.5 h-4 w-4' />
                    Add Client
                  </Button>
                </CardHeader>
                <CardContent className="px-2 sm:px-4">
                  {isLoading ? (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      Loading...
                    </div>
                  ) : error ? (
                    <div className='py-8 text-center text-sm text-destructive'>
                      Error loading clients
                    </div>
                  ) : clients.length === 0 ? (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      No clients found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
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
                              "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                              isSelected
                                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                                : "border-border/60 bg-card hover:bg-muted/40 text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-9 w-9 shrink-0 border border-border/40">
                                <AvatarImage
                                  src={client.avatarUrl}
                                  alt={client.name}
                                  data-ai-hint="portrait person"
                                />
                                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                                  {client.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm truncate">{client.name}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {completedProjectsCount} {completedProjectsCount === 1 ? 'project' : 'projects'} completed
                                </span>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-1 shrink-0 ml-2" onClick={(e) => e.stopPropagation()}>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
                                onClick={() => setEditingClient(client)}
                                aria-label="Edit client"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {client.fastwork_link && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/60"
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
                <Card>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-center gap-4'>
                        <Avatar className='h-16 w-16 border border-primary/10 shadow-3xs shrink-0'>
                          <AvatarImage
                            src={selectedClient.avatarUrl}
                            alt={selectedClient.name}
                            data-ai-hint='portrait person'
                          />
                          <AvatarFallback className='text-2xl font-bold bg-primary/5 text-primary'>
                            {selectedClient.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className='text-2xl font-black tracking-tight text-foreground'>
                            {selectedClient.name}
                          </CardTitle>
                          <p className='mt-1 text-muted-foreground text-sm font-medium'>
                            {selectedClient.email}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant='outline'
                        size='sm'
                        onClick={() => setEditingClient(selectedClient)}
                        className="rounded-xl font-bold text-xs"
                      >
                        Edit Details
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <Separator />
                    <div className='grid gap-6 md:grid-cols-2'>
                      <div>
                        <h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80'>
                          Contact & Socials
                        </h4>
                        <div className='space-y-4'>
                          {selectedClient.socials &&
                          selectedClient.socials.length > 0 ? (
                            selectedClient.socials.map(renderSocialLink)
                          ) : (
                            <p className='text-sm text-muted-foreground'>
                              No social links added.
                            </p>
                          )}
                        </div>
                      </div>
                      <div>
                        <h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80'>Notes</h4>
                        {selectedClient.notes ? (
                          <p className='text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed'>
                            {selectedClient.notes}
                          </p>
                        ) : (
                          <p className='text-sm text-muted-foreground'>
                            No notes for this client.
                          </p>
                        )}
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80'>
                        Client Projects
                      </h4>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {clientProjects.length > 0 ? (
                          clientProjects.map((project) => (
                            <Card key={project.id} className="hover:border-primary/20 transition-all">
                              <CardHeader className="pb-2">
                                <button
                                  onClick={() => setProjectModal(project)}
                                  className='text-left hover:underline w-full'
                                >
                                  <CardTitle className='text-base font-bold'>
                                    {project.title}
                                  </CardTitle>
                                </button>
                              </CardHeader>
                              <CardContent className='space-y-3'>
                                <div className='flex items-center justify-between text-xs'>
                                  <Badge
                                    variant={
                                      project.status === 'Completed' ||
                                      project.status === 'Paid'
                                        ? 'default'
                                        : 'secondary'
                                    }
                                    className="rounded-full border-0 px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                                  >
                                    {project.status}
                                  </Badge>
                                  <span className='font-bold text-muted-foreground'>
                                    {formatNumber(project.gross_price)}
                                  </span>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                          <p className='text-sm text-muted-foreground col-span-2'>
                            No projects found for this client.
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className='flex items-center justify-center h-96'>
                  <p className='text-muted-foreground'>
                    Select a client to see details
                  </p>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className='grid gap-8 lg:grid-cols-3'>
            <div className='lg:col-span-1'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-4'>
                  <CardTitle>Companies</CardTitle>
                </CardHeader>
                <CardContent className="px-2 sm:px-4">
                  {isLoading ? (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      Loading...
                    </div>
                  ) : error ? (
                    <div className='py-8 text-center text-sm text-destructive'>
                      Error loading companies
                    </div>
                  ) : companiesList.length === 0 ? (
                    <div className='py-8 text-center text-sm text-muted-foreground'>
                      No companies found.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
                      {companiesList.map((company) => {
                        const isSelected = selectedCompany === company.name;

                        return (
                          <div
                            key={company.name}
                            onClick={() => setSelectedCompany(company.name)}
                            className={cn(
                              "flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer",
                              isSelected
                                ? "border-primary/40 bg-primary/10 text-primary shadow-sm"
                                : "border-border/60 bg-card hover:bg-muted/40 text-foreground"
                            )}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="h-9 w-9 rounded-xl bg-primary/5 text-primary border border-primary/10 flex items-center justify-center shrink-0">
                                <Building2 className="h-4.5 w-4.5" />
                              </div>
                              <div className="flex flex-col min-w-0">
                                <span className="font-semibold text-sm truncate">{company.name}</span>
                                <span className="text-[11px] text-muted-foreground">
                                  {company.clients.length} {company.clients.length === 1 ? 'contact' : 'contacts'}
                                </span>
                              </div>
                            </div>
                            <span className={cn(
                              "inline-flex items-center justify-center h-5 px-2 rounded-full text-[8px] font-black uppercase tracking-wider shrink-0 ml-2",
                              company.status === "Active"
                                ? "bg-green-500/10 text-green-700"
                                : company.status === "Pending"
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-muted text-muted-foreground"
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
                <Card>
                  <CardHeader>
                    <div className='flex items-start justify-between gap-4'>
                      <div className='flex items-center gap-4'>
                        <div className='h-16 w-16 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 shadow-3xs shrink-0'>
                          <Building2 className='h-8 w-8' />
                        </div>
                        <div>
                          <CardTitle className='text-2xl font-black tracking-tight text-foreground'>
                            {activeCompanyInfo.name}
                          </CardTitle>
                          <p className='mt-1 text-muted-foreground text-sm font-medium flex items-center gap-2'>
                            <span className={cn(
                              "inline-flex items-center justify-center h-5 px-2.5 rounded-full text-[9px] font-black uppercase tracking-wider",
                              activeCompanyInfo.status === "Active"
                                ? "bg-green-500/10 text-green-700"
                                : activeCompanyInfo.status === "Pending"
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-muted text-muted-foreground"
                            )}>
                              {activeCompanyInfo.status}
                            </span>
                            &bull; {activeCompanyInfo.clients.length} {activeCompanyInfo.clients.length === 1 ? 'contact' : 'contacts'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-6'>
                    <Separator />
                    
                    {/* Contacts List */}
                    <div>
                      <h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2'>
                        <User className="h-4.5 w-4.5 text-muted-foreground" />
                        Associated Contacts
                      </h4>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {activeCompanyInfo.clients.map((client) => (
                          <Card key={client._id} className="border-border/60 bg-muted/5 shadow-2xs">
                            <CardContent className="p-4 flex items-center gap-3">
                              <Avatar className="h-10 w-10 shrink-0">
                                <AvatarImage src={client.avatarUrl} alt={client.name} />
                                <AvatarFallback className="bg-primary/5 text-primary font-bold text-sm">
                                  {client.name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-sm truncate">{client.name}</p>
                                <p className="text-xs text-muted-foreground truncate">{client.email}</p>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary/95 text-xs font-bold shrink-0 hover:bg-primary/5 rounded-lg"
                                onClick={() => {
                                  setSelectedClient(client);
                                  setActiveTab('people');
                                  setViewMode('split');
                                }}
                              >
                                View Profile
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Company Projects */}
                    <div>
                      <h4 className='mb-4 text-sm font-bold uppercase tracking-wider text-muted-foreground/80 flex items-center gap-2'>
                        <FolderKanban className="h-4.5 w-4.5 text-muted-foreground" />
                        Company Projects
                      </h4>
                      <div className='grid gap-4 sm:grid-cols-2'>
                        {(() => {
                          const companyProjects = projects.filter(p => 
                            activeCompanyInfo.clients.some(c => c._id === p.clientId)
                          );
                          
                          return companyProjects.length > 0 ? (
                            companyProjects.map((project) => (
                              <Card key={project.id} className="hover:border-primary/20 transition-all">
                                <CardHeader className="pb-2">
                                  <button
                                    onClick={() => setProjectModal(project)}
                                    className='text-left hover:underline w-full'
                                  >
                                    <CardTitle className='text-base font-bold'>
                                      {project.title}
                                    </CardTitle>
                                  </button>
                                </CardHeader>
                                <CardContent className='space-y-3'>
                                  <div className='flex items-center justify-between text-xs'>
                                    <Badge
                                      variant={
                                        project.status === 'Completed' ||
                                        project.status === 'Paid'
                                          ? 'default'
                                          : 'secondary'
                                      }
                                      className="rounded-full border-0 px-2.5 py-0.5 text-[9px] uppercase tracking-wider font-bold"
                                    >
                                      {project.status}
                                    </Badge>
                                    <span className='font-bold text-muted-foreground'>
                                      {formatNumber(project.gross_price)}
                                    </span>
                                  </div>
                                  {project.subTasks && project.subTasks.length > 0 && (
                                    <div className="space-y-1">
                                      <div className="flex items-center justify-between text-[10px] text-muted-foreground font-semibold">
                                        <span>Progress</span>
                                        <span>{Math.round(calculateProgress(project.subTasks))}%</span>
                                      </div>
                                      <Progress value={calculateProgress(project.subTasks)} className="h-1" />
                                    </div>
                                  )}
                                </CardContent>
                              </Card>
                            ))
                          ) : (
                            <p className='text-sm text-muted-foreground col-span-2'>
                              No projects found for this company.
                            </p>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card className='flex items-center justify-center h-96'>
                  <p className='text-muted-foreground'>
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
              defaultValues={editingClient || undefined}
              onSubmit={handleEditClient}
              submitLabel="Save profile"
              onCancel={() => setEditingClient(null)}
              isLoading={isUpdatingClient || isAddingClient}
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
