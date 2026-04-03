'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  fastwork_link: z.string().url('Fastwork link must be a valid URL'),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .optional()
    .or(z.literal('')),
});

export type ClientFormValues = z.infer<typeof schema>;

type ClientFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => void;
  submitLabel: string;
  onCancel?: () => void;
};

export function ClientForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      fastwork_link: defaultValues?.fastwork_link ?? '',
      avatarUrl: defaultValues?.avatarUrl ?? '',
    },
  });

  const formContent = (
    <>
      <FormField
        control={form.control}
        name="name"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Name</FormLabel>
            <FormControl>
              <Input placeholder="Client or business name" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="email"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Email</FormLabel>
            <FormControl>
              <Input type="email" placeholder="contact@example.com" {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="fastwork_link"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Fastwork Link</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://fastwork.co/user/..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="avatarUrl"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Avatar URL</FormLabel>
            <FormControl>
              <Input type="url" placeholder="https://..." {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="flex gap-3 pt-2">
        <Button type="submit">{submitLabel}</Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button type="button" variant="outline" asChild>
            <Link href="/clients">Cancel</Link>
          </Button>
        )}
      </div>
    </>
  );

  // If used in a dialog, don't render the title/back button
  if (onCancel) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          {formContent}
        </form>
      </Form>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/clients" aria-label="Back">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'Add Client' : 'Edit Client'}
          </h1>
        </div>
        {formContent}
      </form>
    </Form>
  );
}
