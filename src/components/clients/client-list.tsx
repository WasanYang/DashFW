'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  ExternalLink,
  Folder,
  Pencil,
  Plus,
  Phone,
  Globe,
  MessageCircle,
  Instagram,
  User,
  Hash,
} from 'lucide-react';
import { Client, Property, Social, Project } from '@/lib/types';
import { useClients } from '@/contexts/clients-context';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { ClientForm, ClientFormValues } from './client-form';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Badge } from '../ui/badge';

interface ClientListProps {
  properties: Property[];
  projects: Project[];
}

const socialIcons: { [key: string]: React.ElementType } = {
  Phone: Phone,
  Website: Globe,
  Line: MessageCircle,
  Instagram: Instagram,
  Facebook: User,
  Other: Hash,
};

export function ClientList({ properties, projects }: ClientListProps) {
  const { clients, addClient, updateClient } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);

  useEffect(() => {
    setSelectedClient((prev) => {
      if (prev && clients.some((c) => c.id === prev.id)) {
        // If previous selected client still exists, keep it.
        // This is to refresh its data if it was edited.
        return clients.find(c => c.id === prev.id) || null;
      }
      if (!prev && clients.length > 0) {
        return clients[0];
      }
      return prev;
    });
  }, [clients]);

  const clientProperties = properties.filter(
    (p) => p.clientId === selectedClient?.id
  );

  const clientProjects = projects.filter(
    (p) => p.clientId === selectedClient?.id
  );

  const handleAddClient = (values: ClientFormValues) => {
    addClient({
      ...values,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    });
    setIsCreateOpen(false);
  };

  const handleEditClient = (values: ClientFormValues) => {
    if (!editingClient) return;
    updateClient(editingClient.id, {
      ...values,
      avatarUrl: values.avatarUrl?.trim() || undefined,
    });
    setEditingClient(null);
  };

  const renderSocialLink = (social: Social) => {
    const Icon = socialIcons[social.platform] || Hash;
    return (
        <div key={social.id} className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <div className="flex-1">
                <p className="text-sm font-medium">{social.platform}</p>
                <p className="text-sm text-muted-foreground truncate">{social.value}</p>
            </div>
        </div>
    );
  }

  return (
    <>
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
              <CardTitle>Clients</CardTitle>
              <Button size="sm" onClick={() => setIsCreateOpen(true)}>
                <Plus className="mr-1.5 h-4 w-4" />
                Add Client
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-center">Projects</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No clients found.
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => {
                      const completedProjectsCount = projects.filter(
                        (p) => p.clientId === client.id && (p.status === 'Completed' || p.status === 'Paid')
                      ).length;

                      return (
                        <TableRow
                          key={client.id}
                          onClick={() => setSelectedClient(client)}
                          className={`cursor-pointer ${
                            selectedClient?.id === client.id ? 'bg-muted/50' : ''
                          }`}
                        >
                          <TableCell className="flex items-center gap-3 font-medium">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={client.avatarUrl} alt={client.name} data-ai-hint="portrait person" />
                              <AvatarFallback>{client.name.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{client.name}</span>
                          </TableCell>
                          <TableCell className="text-center font-medium">{completedProjectsCount}</TableCell>
                          <TableCell>
                            <div className="flex items-center justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setEditingClient(client); }} aria-label="Edit client">
                                <Pencil className="h-4 w-4" />
                              </Button>
                              {client.fastwork_link && (
                                <Button variant="ghost" size="icon" asChild>
                                  <a
                                    href={client.fastwork_link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={(e) => e.stopPropagation()}
                                    aria-label="Fastwork profile"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                  </a>
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedClient ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-16 w-16">
                        <AvatarImage src={selectedClient.avatarUrl} alt={selectedClient.name} data-ai-hint="portrait person" />
                        <AvatarFallback className="text-2xl">{selectedClient.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                        <CardTitle className="text-2xl">{selectedClient.name}</CardTitle>
                        <p className="mt-1 text-muted-foreground">{selectedClient.email}</p>
                    </div>
                  </div>
                   <Button variant="outline" size="sm" onClick={() => setEditingClient(selectedClient)}>Edit Details</Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <Separator />
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <h4 className="mb-4 text-lg font-semibold">Contact & Socials</h4>
                        <div className="space-y-4">
                           {selectedClient.socials && selectedClient.socials.length > 0 ? (
                                selectedClient.socials.map(renderSocialLink)
                            ) : (
                                <p className="text-sm text-muted-foreground">No social links added.</p>
                            )}
                        </div>
                    </div>
                     <div>
                        <h4 className="mb-4 text-lg font-semibold">Notes</h4>
                        {selectedClient.notes ? (
                             <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedClient.notes}</p>
                        ): (
                            <p className="text-sm text-muted-foreground">No notes for this client.</p>
                        )}
                    </div>
                </div>

                <Separator />
                
                <div>
                    <h4 className="mb-4 text-lg font-semibold">Managed Properties</h4>
                     <div className="grid gap-4 sm:grid-cols-2">
                        {clientProperties.length > 0 ? (
                        clientProperties.map((prop) => (
                            <Card key={prop.id}>
                            <CardHeader>
                                <CardTitle className="text-base">{prop.name}</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <Button variant="outline" className="w-full" asChild>
                                <a href={prop.drive_link} target="_blank" rel="noopener noreferrer">
                                    <Folder className="mr-2 h-4 w-4" /> Asset Folder
                                </a>
                                </Button>
                            </CardContent>
                            </Card>
                        ))
                        ) : (
                        <p className="text-sm text-muted-foreground col-span-2">No properties found for this client.</p>
                        )}
                    </div>
                </div>

                <Separator />

                <div>
                    <h4 className="mb-4 text-lg font-semibold">Client Projects</h4>
                     <div className="grid gap-4 sm:grid-cols-2">
                        {clientProjects.length > 0 ? (
                          clientProjects.map((project) => (
                            <Card key={project.id}>
                              <CardHeader>
                                  <Link href={`/board/${project.id}`} className="hover:underline">
                                    <CardTitle className="text-base">{project.title}</CardTitle>
                                  </Link>
                              </CardHeader>
                              <CardContent className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                  <Badge variant={project.status === 'Completed' || project.status === 'Paid' ? 'default' : 'secondary'}>{project.status}</Badge>
                                  <span className='font-semibold'>${project.gross_price.toFixed(2)}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))
                        ) : (
                        <p className="text-sm text-muted-foreground col-span-2">No projects found for this client.</p>
                        )}
                    </div>
                </div>

              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-96">
                <p className="text-muted-foreground">Select a client to see details</p>
            </Card>
          )}
        </div>
      </div>
      
      {/* Create Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Add New Client</DialogTitle>
            <DialogDescription>Fill in the form below to add a new client to your CRM.</DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
            <ClientForm
              mode="create"
              onSubmit={handleAddClient}
              submitLabel="Create Client"
              onCancel={() => setIsCreateOpen(false)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
      
      {/* Edit Dialog */}
       <Dialog open={!!editingClient} onOpenChange={(open) => !open && setEditingClient(null)}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update the details for {editingClient?.name}.</DialogDescription>
          </DialogHeader>
           <ScrollArea className="max-h-[70vh] pr-6 -mr-6">
            <ClientForm
                mode="edit"
                defaultValues={editingClient || undefined}
                onSubmit={handleEditClient}
                submitLabel="Save Changes"
                onCancel={() => setEditingClient(null)}
            />
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
