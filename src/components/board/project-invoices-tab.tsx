'use client';

import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { Project } from '@/lib/types';

interface ProjectInvoicesTabProps {
  project: Project;
  projectInvoices: any[];
}

export const ProjectInvoicesTab: React.FC<ProjectInvoicesTabProps> = ({
  project,
  projectInvoices,
}) => {
  return (
    <Card className="border border-border/60 shadow-sm rounded-2xl">
      <CardHeader className="flex flex-row justify-between items-center">
        <div>
          <CardTitle className="text-lg">Linked Invoices</CardTitle>
          <CardDescription>Billed financial documents generated for this project container</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {projectInvoices.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            No invoices connected to this project container yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-border/40 bg-transparent text-muted-foreground font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Invoice #</th>
                  <th className="p-4">Title / Label</th>
                  <th className="p-4">Due Date</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right pr-6">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/20">
                {projectInvoices.map((inv) => (
                  <tr key={inv._id || inv.id} className="hover:bg-muted/10">
                    <td className="p-4 font-bold text-primary">{inv.invoiceNumber}</td>
                    <td className="p-4 font-semibold text-foreground/80">{inv.title || 'Invoice'}</td>
                    <td className="p-4 font-medium text-muted-foreground">
                      {inv.dueDate ? format(new Date(inv.dueDate), 'dd MMM yyyy') : 'No date'}
                    </td>
                    <td className="p-4">
                      <Badge
                        variant={
                          inv.status === 'Paid'
                            ? 'default'
                            : inv.status === 'Sent'
                            ? 'secondary'
                            : inv.status === 'Overdue'
                            ? 'destructive'
                            : 'outline'
                        }
                        className={cn(
                          "text-[9px] font-bold px-2 py-0.5 rounded-full border-0 uppercase shadow-sm",
                          inv.status === 'Paid' ? "bg-green-50 text-green-700 dark:bg-green-950/30 dark:text-green-400" :
                          inv.status === 'Sent' ? "bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400" :
                          inv.status === 'Overdue' ? "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400" :
                          "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        )}
                      >
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="p-4 text-right pr-6 font-bold text-foreground/90">
                      {project.currency === 'USD' ? '$' : '฿'}{inv.total?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
