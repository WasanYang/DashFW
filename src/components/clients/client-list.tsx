'use client';

import { useEffect, useState } from 'react';
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
import { ExternalLink, Eye, EyeOff, Folder, Pencil, Plus } from 'lucide-react';
import { Client, Property } from '@/lib/types';
import { useClients } from '@/contexts/clients-context';

interface ClientListProps {
  properties: Property[];
}

export function ClientList({ properties }: ClientListProps) {
  const { clients } = useClients();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  useEffect(() => {
    setSelectedClient((prev) => {
      if (prev && clients.some((c) => c.id === prev.id)) return prev;
      return clients[0] ?? null;
    });
  }, [clients]);
  const [showCredentials, setShowCredentials] = useState<Record<string, boolean>>({});

  const clientProperties = properties.filter(
    (p) => p.clientId === selectedClient?.id
  );

  const toggleCredentials = (propId: string) => {
    setShowCredentials(prev => ({ ...prev, [propId]: !prev[propId] }));
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle>Clients</CardTitle>
            <Button size="sm" asChild>
              <Link href="/clients/new">
                <Plus className="mr-1.5 h-4 w-4" />
                เพิ่มลูกค้า
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Client</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clients.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-center text-muted-foreground">
                      ยังไม่มีลูกค้า — กด &quot;เพิ่มลูกค้า&quot; เพื่อเริ่มต้น
                    </TableCell>
                  </TableRow>
                ) : (
                  clients.map((client) => (
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
                        {client.name}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="icon" asChild>
                            <Link
                              href={`/clients/${client.id}`}
                              onClick={(e) => e.stopPropagation()}
                              aria-label="แก้ไขลูกค้า"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="icon" asChild>
                            <a
                              href={client.fastwork_link}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        {selectedClient && (
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
              <div>
                <CardTitle>{selectedClient.name}&apos;s Properties</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">{selectedClient.email}</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/clients/${selectedClient.id}`}>แก้ไขข้อมูล</Link>
              </Button>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              {clientProperties.length > 0 ? (
                clientProperties.map((prop) => (
                  <Card key={prop.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{prop.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {prop.credentials && (
                        <div className="flex items-center justify-between rounded-md bg-muted p-3">
                            <div>
                                <p className="text-sm font-medium">{prop.credentials.ota}</p>
                                <p className="text-sm text-muted-foreground">
                                    {showCredentials[prop.id] ? prop.credentials.login : '••••••••'}
                                </p>
                            </div>
                          <Button variant="ghost" size="icon" onClick={() => toggleCredentials(prop.id)}>
                            {showCredentials[prop.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </Button>
                        </div>
                      )}
                      <Button variant="outline" className="w-full" asChild>
                         <a href={prop.drive_link} target="_blank" rel="noopener noreferrer">
                            <Folder className="mr-2 h-4 w-4" /> Asset Folder
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="p-4 text-center text-muted-foreground">No properties found for this client.</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
