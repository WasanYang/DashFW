'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGetClientsQuery } from '@/services/clientApi';
import { useGetProjectsQuery } from '@/services/projectApi';
import {
  useGetInvoicesQuery,
  useAddInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
} from '@/services/invoiceApi';
import {
  useGetProposalsQuery,
  useAddProposalMutation,
  useUpdateProposalMutation,
  useDeleteProposalMutation,
} from '@/services/proposalApi';
import { format } from 'date-fns';
import { FileText, Plus, Trash2, CheckCircle2, Printer, Loader2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Invoice, Proposal, InvoiceItem, InvoiceStatus, ProposalStatus } from '@/lib/types';

export default function InvoicesProposalsPage() {
  const { data: clients = [] } = useGetClientsQuery();
  const { data: projects = [] } = useGetProjectsQuery();
  
  const { data: invoices = [], isLoading: loadingInvoices } = useGetInvoicesQuery();
  const [addInvoice, { isLoading: isCreatingInvoice }] = useAddInvoiceMutation();
  const [updateInvoice] = useUpdateInvoiceMutation();
  const [deleteInvoice] = useDeleteInvoiceMutation();

  const { data: proposals = [], isLoading: loadingProposals } = useGetProposalsQuery();
  const [addProposal, { isLoading: isCreatingProposal }] = useAddProposalMutation();
  const [updateProposal] = useUpdateProposalMutation();
  const [deleteProposal] = useDeleteProposalMutation();

  // Navigation tab: 'invoices' | 'proposals'
  const [activeTab, setActiveTab] = useState<'invoices' | 'proposals'>('invoices');
  
  // Selection states
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedProposalId, setSelectedProposalId] = useState<string | null>(null);
  
  // Form Dialogs
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  
  // Form State
  const [formDocNumber, setFormDocNumber] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formProjectId, setFormProjectId] = useState('none');
  const [formTitle, setFormTitle] = useState('');
  const [formIssueDate, setFormIssueDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [formEndDate, setFormEndDate] = useState(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
  const [formNotes, setFormNotes] = useState('');
  const [formTaxRate, setFormTaxRate] = useState(0);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Active documents
  const activeInvoice = useMemo(() => {
    if (selectedInvoiceId) return invoices.find(i => i.id === selectedInvoiceId) || null;
    return invoices[0] || null;
  }, [selectedInvoiceId, invoices]);

  const activeProposal = useMemo(() => {
    if (selectedProposalId) return proposals.find(p => p.id === selectedProposalId) || null;
    return proposals[0] || null;
  }, [selectedProposalId, proposals]);

  // Sync selection
  React.useEffect(() => {
    if (invoices.length > 0 && !selectedInvoiceId) {
      setSelectedInvoiceId(invoices[0].id!);
    }
  }, [invoices, selectedInvoiceId]);

  React.useEffect(() => {
    if (proposals.length > 0 && !selectedProposalId) {
      setSelectedProposalId(proposals[0].id!);
    }
  }, [proposals, selectedProposalId]);

  // Form items handlers
  const handleItemChange = (index: number, field: keyof InvoiceItem, value: any) => {
    const updated = [...formItems];
    const item = { ...updated[index] };
    
    if (field === 'description') {
      item.description = value;
    } else if (field === 'quantity') {
      item.quantity = Number(value);
      item.amount = item.quantity * item.rate;
    } else if (field === 'rate') {
      item.rate = Number(value);
      item.amount = item.quantity * item.rate;
    }
    
    updated[index] = item;
    setFormItems(updated);
  };

  const handleAddItem = () => {
    setFormItems([...formItems, { description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (formItems.length === 1) return;
    setFormItems(formItems.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    const isInv = activeTab === 'invoices';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormDocNumber(isInv ? `INV-${rand}` : `PROP-${rand}`);
    setFormClientId(clients[0]?._id || '');
    setFormProjectId('none');
    setFormTitle('');
    setFormIssueDate(format(new Date(), 'yyyy-MM-dd'));
    setFormEndDate(format(addDays(new Date(), 14), 'yyyy-MM-dd'));
    setFormNotes('');
    setFormTaxRate(0);
    setFormDiscount(0);
    setFormItems([{ description: '', quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsCreateOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formClientId) return;

    const subTotal = formItems.reduce((sum, item) => sum + item.amount, 0);
    const taxAmount = subTotal * (formTaxRate / 100);
    const total = subTotal + taxAmount - formDiscount;

    if (activeTab === 'invoices') {
      await addInvoice({
        invoiceNumber: formDocNumber,
        clientId: formClientId,
        projectId: formProjectId !== 'none' ? formProjectId : undefined,
        issueDate: new Date(formIssueDate).toISOString(),
        dueDate: new Date(formEndDate).toISOString(),
        items: formItems,
        taxRate: formTaxRate,
        discount: formDiscount,
        total: total > 0 ? total : 0,
        status: 'Draft',
        notes: formNotes
      });
    } else {
      await addProposal({
        proposalNumber: formDocNumber,
        clientId: formClientId,
        title: formTitle || 'General Proposal',
        description: formNotes,
        issueDate: new Date(formIssueDate).toISOString(),
        validUntil: new Date(formEndDate).toISOString(),
        items: formItems,
        total: subTotal, // proposals typically don't have tax/discount in flat form unless simple
        status: 'Draft',
        notes: formNotes
      });
    }

    setIsCreateOpen(false);
  };

  const handleMarkPaid = async (id: string) => {
    await updateInvoice({ id, data: { status: 'Paid' } });
  };

  const handleMarkAccepted = async (id: string) => {
    await updateProposal({ id, data: { status: 'Accepted' } });
  };

  const handleDelete = async (id: string) => {
    if (activeTab === 'invoices') {
      await deleteInvoice({ id });
      setSelectedInvoiceId(null);
    } else {
      await deleteProposal({ id });
      setSelectedProposalId(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col gap-6 p-1 max-w-7xl mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 print:hidden">
        <div className="flex bg-muted/60 p-1 rounded-xl">
          <Button
            variant={activeTab === 'invoices' ? 'default' : 'ghost'}
            className={cn("rounded-lg text-sm", activeTab === 'invoices' ? 'shadow-sm bg-primary text-primary-foreground' : 'text-muted-foreground')}
            onClick={() => setActiveTab('invoices')}
          >
            Invoices
          </Button>
          <Button
            variant={activeTab === 'proposals' ? 'default' : 'ghost'}
            className={cn("rounded-lg text-sm", activeTab === 'proposals' ? 'shadow-sm bg-primary text-primary-foreground' : 'text-muted-foreground')}
            onClick={() => setActiveTab('proposals')}
          >
            Proposals
          </Button>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl shadow-sm bg-primary text-primary-foreground hover:bg-primary/90 font-semibold gap-1.5 h-10">
          <Plus className="w-4 h-4" /> Create {activeTab === 'invoices' ? 'Invoice' : 'Proposal'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* LEFT COLUMN: LIST CARD */}
        <Card className="lg:col-span-1 border border-border/80 shadow-sm print:hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <FileText className="w-5 h-5 text-primary" />
              {activeTab === 'invoices' ? 'Invoice History' : 'Submitted Proposals'}
            </CardTitle>
            <CardDescription>
              Manage, check statuses, and log billing records
            </CardDescription>
          </CardHeader>
          <CardContent className="px-2 sm:px-4">
            <ScrollArea className="h-[550px] pr-1">
              {activeTab === 'invoices' ? (
                loadingInvoices ? (
                  <div className="py-12 text-center text-muted-foreground">Loading invoices...</div>
                ) : invoices.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No invoices generated yet.</div>
                ) : (
                  <div className="space-y-2">
                    {invoices.map((inv) => {
                      const isSel = selectedInvoiceId === inv.id;
                      return (
                        <div
                          key={inv.id}
                          onClick={() => setSelectedInvoiceId(inv.id!)}
                          className={cn(
                            "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                            isSel ? "bg-primary/10 border-primary/45 text-primary shadow-sm" : "bg-card border-border/60 hover:bg-muted/40"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{inv.invoiceNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">{inv.client?.name || 'General Client'}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-sm text-foreground">฿{inv.total?.toLocaleString()}</p>
                            <Badge className={cn("text-[9px] h-4 px-1.5 rounded-full mt-1 border-0",
                              inv.status === 'Paid' ? 'bg-green-500/10 text-green-700' :
                              inv.status === 'Sent' ? 'bg-blue-500/10 text-blue-700' :
                              inv.status === 'Overdue' ? 'bg-red-500/10 text-red-700' : 'bg-muted text-muted-foreground'
                            )}>
                              {inv.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              ) : (
                loadingProposals ? (
                  <div className="py-12 text-center text-muted-foreground">Loading proposals...</div>
                ) : proposals.length === 0 ? (
                  <div className="py-12 text-center text-muted-foreground">No proposals generated yet.</div>
                ) : (
                  <div className="space-y-2">
                    {proposals.map((prop) => {
                      const isSel = selectedProposalId === prop.id;
                      return (
                        <div
                          key={prop.id}
                          onClick={() => setSelectedProposalId(prop.id!)}
                          className={cn(
                            "p-3 rounded-xl border cursor-pointer transition-all flex items-center justify-between",
                            isSel ? "bg-primary/10 border-primary/45 text-primary shadow-sm" : "bg-card border-border/60 hover:bg-muted/40"
                          )}
                        >
                          <div className="min-w-0">
                            <p className="font-bold text-sm text-foreground truncate">{prop.proposalNumber}</p>
                            <p className="text-xs text-muted-foreground truncate">{prop.title}</p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-sm text-foreground">฿{prop.total?.toLocaleString()}</p>
                            <Badge className={cn("text-[9px] h-4 px-1.5 rounded-full mt-1 border-0",
                              prop.status === 'Accepted' ? 'bg-green-500/10 text-green-700' :
                              prop.status === 'Sent' ? 'bg-blue-500/10 text-blue-700' :
                              prop.status === 'Declined' ? 'bg-red-500/10 text-red-700' : 'bg-muted text-muted-foreground'
                            )}>
                              {prop.status}
                            </Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* RIGHT COLUMN: DOCUMENT PREVIEW */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {activeTab === 'invoices' ? (
            activeInvoice ? (
              <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
                {/* Print controls header */}
                <div className="bg-muted/20 px-6 py-3 border-b flex justify-between items-center print:hidden">
                  <div className="flex gap-2">
                    {activeInvoice.status !== 'Paid' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkPaid(activeInvoice.id!)}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1 rounded-lg text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Mark Paid
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="gap-1 rounded-lg text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 rounded-lg text-xs"
                    onClick={() => handleDelete(activeInvoice.id!)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* INVOICE TEMPLATE (PRINT READY) */}
                <div className="p-8 sm:p-12 bg-white text-black min-h-[700px] flex flex-col justify-between font-sans">
                  <div>
                    {/* TOP SECTION */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">INVOICE</h2>
                        <p className="text-xs text-slate-500 font-bold mt-1 tracking-widest">{activeInvoice.invoiceNumber}</p>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-base text-primary">wasan</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Freelance Full-stack Developer</p>
                        <p className="text-xs text-slate-500">wasan.dev@gmail.com</p>
                      </div>
                    </div>

                    <Separator className="my-8 bg-slate-200" />

                    {/* METADATA SECTION */}
                    <div className="grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wider mb-2">Billed To</p>
                        <p className="font-bold text-sm text-slate-800">{activeInvoice.client?.name || 'General Client'}</p>
                        <p className="text-slate-500 mt-1">{activeInvoice.client?.email}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
                          <p className="font-semibold text-slate-700">
                            {format(new Date(activeInvoice.issueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Due Date</p>
                          <p className="font-semibold text-slate-700">
                            {format(new Date(activeInvoice.dueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="mt-10 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-3 pr-4">Description</th>
                            <th className="py-3 px-4 text-center w-20">QTY</th>
                            <th className="py-3 px-4 text-right w-28">Rate</th>
                            <th className="py-3 pl-4 text-right w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {activeInvoice.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-4 pr-4 font-medium">{item.description}</td>
                              <td className="py-4 px-4 text-center">{item.quantity}</td>
                              <td className="py-4 px-4 text-right">฿{item.rate?.toLocaleString()}</td>
                              <td className="py-4 pl-4 text-right font-semibold">฿{item.amount?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-6 text-xs">
                    <div className="max-w-xs">
                      {activeInvoice.notes && (
                        <>
                          <p className="font-bold text-slate-400 uppercase tracking-wider mb-2">Notes</p>
                          <p className="text-slate-500 whitespace-pre-wrap leading-relaxed">{activeInvoice.notes}</p>
                        </>
                      )}
                    </div>
                    
                    <div className="w-64 shrink-0 space-y-2 text-right">
                      <div className="flex justify-between text-slate-500">
                        <span>Subtotal</span>
                        <span>฿{activeInvoice.items.reduce((sum, item) => sum + item.amount, 0).toLocaleString()}</span>
                      </div>
                      {activeInvoice.taxRate > 0 && (
                        <div className="flex justify-between text-slate-500">
                          <span>Tax ({activeInvoice.taxRate}%)</span>
                          <span>
                            ฿{Math.round(activeInvoice.items.reduce((sum, item) => sum + item.amount, 0) * (activeInvoice.taxRate / 100)).toLocaleString()}
                          </span>
                        </div>
                      )}
                      {activeInvoice.discount > 0 && (
                        <div className="flex justify-between text-slate-500">
                          <span>Discount</span>
                          <span>-฿{activeInvoice.discount.toLocaleString()}</span>
                        </div>
                      )}
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between text-base font-bold text-slate-800">
                        <span>Total Due</span>
                        <span>฿{activeInvoice.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground">Select an invoice to see details</p>
              </Card>
            )
          ) : (
            activeProposal ? (
              <Card className="border border-border/80 shadow-md bg-card overflow-hidden">
                {/* Print controls header */}
                <div className="bg-muted/20 px-6 py-3 border-b flex justify-between items-center print:hidden">
                  <div className="flex gap-2">
                    {activeProposal.status !== 'Accepted' && (
                      <Button
                        size="sm"
                        onClick={() => handleMarkAccepted(activeProposal.id!)}
                        className="bg-green-600 hover:bg-green-700 text-white gap-1 rounded-lg text-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Accept Proposal
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handlePrint}
                      className="gap-1 rounded-lg text-xs"
                    >
                      <Printer className="w-3.5 h-3.5" /> Print / Save PDF
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:bg-destructive/10 rounded-lg text-xs"
                    onClick={() => handleDelete(activeProposal.id!)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>

                {/* PROPOSAL TEMPLATE (PRINT READY) */}
                <div className="p-8 sm:p-12 bg-white text-black min-h-[700px] flex flex-col justify-between font-sans">
                  <div>
                    {/* TOP SECTION */}
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">PROPOSAL</h2>
                        <p className="text-xs text-slate-500 font-bold mt-1 tracking-widest">{activeProposal.proposalNumber}</p>
                      </div>
                      <div className="text-right">
                        <h3 className="font-bold text-base text-primary">wasan</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Freelance Full-stack Developer</p>
                        <p className="text-xs text-slate-500">wasan.dev@gmail.com</p>
                      </div>
                    </div>

                    <Separator className="my-8 bg-slate-200" />

                    {/* METADATA SECTION */}
                    <div className="grid grid-cols-2 gap-8 text-xs">
                      <div>
                        <p className="font-bold text-slate-400 uppercase tracking-wider mb-2">Proposal For</p>
                        <p className="font-bold text-sm text-slate-800">{activeProposal.client?.name || 'General Client'}</p>
                        <p className="text-slate-500 mt-1">{activeProposal.client?.email}</p>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Issue Date</p>
                          <p className="font-semibold text-slate-700">
                            {format(new Date(activeProposal.issueDate), 'MMM dd, yyyy')}
                          </p>
                        </div>
                        <div>
                          <p className="font-bold text-slate-400 uppercase tracking-wider mb-1">Valid Until</p>
                          <p className="font-semibold text-slate-700">
                            {format(new Date(activeProposal.validUntil), 'MMM dd, yyyy')}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* PROJECT TITLE / DESC */}
                    <div className="mt-8 text-left">
                      <h3 className="text-lg font-bold text-slate-800 mb-2">{activeProposal.title}</h3>
                      <p className="text-xs text-slate-500 whitespace-pre-wrap leading-relaxed">
                        {activeProposal.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* ITEMS TABLE */}
                    <div className="mt-10 overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b-2 border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                            <th className="py-3 pr-4">Scope of Work</th>
                            <th className="py-3 px-4 text-center w-20">QTY</th>
                            <th className="py-3 px-4 text-right w-28">Rate</th>
                            <th className="py-3 pl-4 text-right w-28">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-700">
                          {activeProposal.items.map((item, idx) => (
                            <tr key={idx} className="hover:bg-slate-50/50">
                              <td className="py-4 pr-4 font-medium">{item.description}</td>
                              <td className="py-4 px-4 text-center">{item.quantity}</td>
                              <td className="py-4 px-4 text-right">฿{item.rate?.toLocaleString()}</td>
                              <td className="py-4 pl-4 text-right font-semibold">฿{item.amount?.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* SUMMARY SECTION */}
                  <div className="mt-8 pt-8 border-t border-slate-100 flex flex-col sm:flex-row justify-between gap-6 text-xs">
                    <div className="max-w-xs">
                      {activeProposal.notes && (
                        <>
                          <p className="font-bold text-slate-400 uppercase tracking-wider mb-2">Terms & Notes</p>
                          <p className="text-slate-500 whitespace-pre-wrap leading-relaxed">{activeProposal.notes}</p>
                        </>
                      )}
                    </div>
                    
                    <div className="w-64 shrink-0 space-y-2 text-right">
                      <Separator className="bg-slate-200" />
                      <div className="flex justify-between text-base font-bold text-slate-800">
                        <span>Project Estimate</span>
                        <span>฿{activeProposal.total?.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ) : (
              <Card className="flex items-center justify-center h-[500px]">
                <p className="text-muted-foreground">Select a proposal to see details</p>
              </Card>
            )
          )}
        </div>
      </div>

      {/* CREATE DIALOG */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[650px] rounded-2xl">
          <DialogHeader>
            <DialogTitle>Create New {activeTab === 'invoices' ? 'Invoice' : 'Proposal'}</DialogTitle>
            <DialogDescription>
              Fill out the form below to generate a new document record.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="docNo">Document Number</Label>
                <Input
                  id="docNo"
                  value={formDocNumber}
                  onChange={(e) => setFormDocNumber(e.target.value)}
                  placeholder="e.g. INV-0001"
                  required
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="client">Client</Label>
                <Select value={formClientId} onValueChange={setFormClientId}>
                  <SelectTrigger id="client" className="rounded-xl border-border/60">
                    <SelectValue placeholder="Select Client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((c) => (
                      <SelectItem key={c._id} value={c._id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {activeTab === 'invoices' ? (
              <div className="space-y-1">
                <Label htmlFor="project">Project Link (Optional)</Label>
                <Select value={formProjectId} onValueChange={setFormProjectId}>
                  <SelectTrigger id="project" className="rounded-xl border-border/60">
                    <SelectValue placeholder="Select Project" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">General Invoice (No Project)</SelectItem>
                    {projects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <div className="space-y-1">
                <Label htmlFor="title">Proposal Title / Scope</Label>
                <Input
                  id="title"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g., SEO Optimization & Ad Campaign Setup"
                  required
                  className="rounded-xl border-border/60"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="issueDate">Issue Date</Label>
                <Input
                  id="issueDate"
                  type="date"
                  value={formIssueDate}
                  onChange={(e) => setFormIssueDate(e.target.value)}
                  required
                  className="rounded-xl border-border/60"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="endDate">{activeTab === 'invoices' ? 'Due Date' : 'Valid Until'}</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  required
                  className="rounded-xl border-border/60"
                />
              </div>
            </div>

            {/* BILLABLE ITEMS */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-sm font-semibold">Billable Scope Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="h-8 rounded-lg text-xs">
                  + Add Item
                </Button>
              </div>
              <ScrollArea className="max-h-[160px] pr-1">
                <div className="space-y-2">
                  {formItems.map((item, index) => (
                    <div key={index} className="flex gap-2 items-center">
                      <Input
                        placeholder="Item description"
                        value={item.description}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        required
                        className="flex-1 rounded-xl border-border/60 h-9"
                      />
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        required
                        className="w-16 rounded-xl border-border/60 h-9 text-center"
                        min="1"
                      />
                      <Input
                        type="number"
                        placeholder="Rate"
                        value={item.rate}
                        onChange={(e) => handleItemChange(index, 'rate', e.target.value)}
                        required
                        className="w-24 rounded-xl border-border/60 h-9 text-right"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveItem(index)}
                        disabled={formItems.length === 1}
                        className="text-muted-foreground hover:text-destructive h-9 w-9 shrink-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* INVOICE EXTRA METADATA */}
            {activeTab === 'invoices' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label htmlFor="tax">Tax Rate (%)</Label>
                  <Input
                    id="tax"
                    type="number"
                    value={formTaxRate}
                    onChange={(e) => setFormTaxRate(Number(e.target.value))}
                    className="rounded-xl border-border/60 h-9"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="discount">Flat Discount (฿)</Label>
                  <Input
                    id="discount"
                    type="number"
                    value={formDiscount}
                    onChange={(e) => setFormDiscount(Number(e.target.value))}
                    className="rounded-xl border-border/60 h-9"
                    min="0"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1">
              <Label htmlFor="notes">Notes / Terms</Label>
              <Textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Payment terms, detailed notes, etc..."
                className="rounded-xl border-border/60 min-h-[60px]"
              />
            </div>

            <Button type="submit" className="w-full rounded-xl bg-primary text-primary-foreground font-semibold h-10 mt-2">
              Save {activeTab === 'invoices' ? 'Invoice' : 'Proposal'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
