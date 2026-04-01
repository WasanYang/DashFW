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
import type { Client } from '@/lib/types';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

const schema = z.object({
  name: z.string().min(1, 'กรุณากรอกชื่อ'),
  email: z.string().email('อีเมลไม่ถูกต้อง'),
  fastwork_link: z.string().url('ลิงก์ Fastwork ต้องเป็น URL ที่ถูกต้อง'),
  avatarUrl: z
    .string()
    .optional()
    .refine((v) => !v || z.string().url().safeParse(v).success, {
      message: 'URL รูปไม่ถูกต้อง',
    }),
});

export type ClientFormValues = z.infer<typeof schema>;

type ClientFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => void;
  submitLabel: string;
};

export function ClientForm({ mode, defaultValues, onSubmit, submitLabel }: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      fastwork_link: defaultValues?.fastwork_link ?? '',
      avatarUrl: defaultValues?.avatarUrl ?? '',
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="mx-auto max-w-lg space-y-6">
        <div className="flex items-center gap-4">
          <Button type="button" variant="ghost" size="icon" asChild>
            <Link href="/clients" aria-label="กลับ">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">
            {mode === 'create' ? 'เพิ่มลูกค้า' : 'แก้ไขลูกค้า'}
          </h1>
        </div>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>ชื่อ</FormLabel>
              <FormControl>
                <Input placeholder="ชื่อลูกค้าหรือธุรกิจ" {...field} />
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
              <FormLabel>อีเมล</FormLabel>
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
              <FormLabel>ลิงก์ Fastwork</FormLabel>
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
              <FormLabel>รูปโปรไฟล์ (URL)</FormLabel>
              <FormControl>
                <Input
                  type="url"
                  placeholder="https://..."
                  {...field}
                  value={field.value ?? ''}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex gap-3">
          <Button type="submit">{submitLabel}</Button>
          <Button type="button" variant="outline" asChild>
            <Link href="/clients">ยกเลิก</Link>
          </Button>
        </div>
      </form>
    </Form>
  );
}
