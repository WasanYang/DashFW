'use client';

import React, { useState, useEffect } from 'react';
import { useAddInvoiceMutation } from '@/services/invoiceApi';
import { useAddProposalMutation } from '@/services/proposalApi';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import type { InvoiceItem } from '@/lib/types';

interface InvoiceCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: 'invoices' | 'proposals';
  clients: any[];
  projects: any[];
}

export function InvoiceCreateDialog({
  open,
  onOpenChange,
  activeTab,
  clients,
  projects,
}: InvoiceCreateDialogProps) {
  const [addInvoice] = useAddInvoiceMutation();
  const [addProposal] = useAddProposalMutation();

  const [formDocNumber, setFormDocNumber] = useState('');
  const [formClientId, setFormClientId] = useState('');
  const [formProjectId, setFormProjectId] = useState('none');
  const [formTitle, setFormTitle] = useState('');
  const [formIssueDate, setFormIssueDate] = useState('');
  const [formEndDate, setFormEndDate] = useState('');
  const [formNotes, setFormNotes] = useState('');
  const [formTaxRate, setFormTaxRate] = useState(0);
  const [formDiscount, setFormDiscount] = useState(0);
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { description: '', quantity: 1, rate: 0, amount: 0 }
  ]);
  const [formCurrency, setFormCurrency] = useState('THB');
  const [formPaymentMethod, setFormPaymentMethod] = useState('Bank Transfer');

  function addDays(date: Date, days: number): Date {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

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
    setFormCurrency('THB');
    setFormPaymentMethod('Bank Transfer');
  };

  useEffect(() => {
    if (open) {
      resetForm();
    }
  }, [open, activeTab, clients]);

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
        title: formTitle || `Invoice ${formDocNumber}`,
        issueDate: new Date(formIssueDate).toISOString(),
        dueDate: new Date(formEndDate).toISOString(),
        items: formItems,
        taxRate: formTaxRate,
        discount: formDiscount,
        total: total > 0 ? total : 0,
        subtotal: subTotal,
        currency: formCurrency,
        paymentMethod: formPaymentMethod,
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
        total: subTotal,
        status: 'Draft',
        notes: formNotes
      });
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
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
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="invoiceTitle">Invoice Title</Label>
                <Input
                  id="invoiceTitle"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="e.g. Website Development"
                  required
                  className="rounded-xl border-border/60"
                />
              </div>
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

          {activeTab === 'invoices' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formCurrency} onValueChange={setFormCurrency}>
                  <SelectTrigger id="currency" className="rounded-xl border-border/60">
                    <SelectValue placeholder="Select Currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="THB">Thai Baht (฿)</SelectItem>
                    <SelectItem value="USD">US Dollar ($)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="GBP">British Pound (£)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="paymentMethod">Payment Method</Label>
                <Select value={formPaymentMethod} onValueChange={setFormPaymentMethod}>
                  <SelectTrigger id="paymentMethod" className="rounded-xl border-border/60">
                    <SelectValue placeholder="Select Payment Method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    <SelectItem value="PromptPay">PromptPay</SelectItem>
                    <SelectItem value="Cash">Cash</SelectItem>
                    <SelectItem value="Credit Card">Credit Card</SelectItem>
                    <SelectItem value="PayPal">PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

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
  );
}
