'use client';

import { useState } from 'react';
import Image from 'next/image';
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
import { ExternalLink, Eye, EyeOff, Folder, MoreHorizontal } from 'lucide-react';
import { Client, Property } from '@/lib/types';

interface ClientListProps {
  clients: Client[];
  properties: Property[];
}

export function ClientList({ clients, properties }: ClientListProps) {
  const [selectedClient, setSelectedClient] = useState<Client | null>(clients[0] || null);
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
          <CardHeader>
            <CardTitle>Clients</CardTitle>
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
                {clients.map((client) => (
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
                      <Button variant="ghost" size="icon" asChild>
                        <a href={client.fastwork_link} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2">
        {selectedClient && (
          <Card>
            <CardHeader>
              <CardTitle>{selectedClient.name}'s Properties</CardTitle>
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
