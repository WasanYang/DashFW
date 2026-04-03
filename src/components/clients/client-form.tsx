'use client';

import { useForm, useFieldArray } from 'react-hook-form';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PlusCircle, Trash2 } from 'lucide-react';
import { Social } from '@/lib/types';

const socialSchema = z.object({
  id: z.string().optional(),
  platform: z.string().min(1, 'Platform is required'),
  value: z.string().min(1, 'Value is required'),
});

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  fastwork_link: z
    .string()
    .url('Fastwork link must be a valid URL')
    .optional()
    .or(z.literal('')),
  avatarUrl: z
    .string()
    .url('Avatar URL must be a valid URL')
    .optional()
    .or(z.literal('')),
  notes: z.string().optional(),
  socials: z.array(socialSchema).optional(),
});

export type ClientFormValues = z.infer<typeof schema>;

type ClientFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<ClientFormValues>;
  onSubmit: (values: ClientFormValues) => void;
  submitLabel: string;
  onCancel: () => void;
  isLoading?: boolean;
};

const socialPlatforms = [
  'Facebook',
  'Instagram',
  'Line',
  'Phone',
  'Website',
  'Other',
];

export function ClientForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  isLoading,
}: ClientFormProps) {
  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: defaultValues?.name ?? '',
      email: defaultValues?.email ?? '',
      fastwork_link: defaultValues?.fastwork_link ?? '',
      avatarUrl: defaultValues?.avatarUrl ?? '',
      notes: defaultValues?.notes ?? '',
      socials: defaultValues?.socials ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'socials',
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
        <FormField
          control={form.control}
          name='name'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Name</FormLabel>
              <FormControl>
                <Input placeholder='Client or business name' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input
                  type='email'
                  placeholder='contact@example.com'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='fastwork_link'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Fastwork Link</FormLabel>
              <FormControl>
                <Input
                  type='url'
                  placeholder='https://fastwork.co/user/...'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='avatarUrl'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Avatar URL</FormLabel>
              <FormControl>
                <Input type='url' placeholder='https://...' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div>
          <FormLabel>Socials</FormLabel>
          <div className='space-y-2 mt-2'>
            {fields.map((field, index) => (
              <div key={field.id} className='flex items-center gap-2'>
                <FormField
                  control={form.control}
                  name={`socials.${index}.platform`}
                  render={({ field }) => (
                    <FormItem className='w-1/3'>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Platform' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {socialPlatforms.map((platform) => (
                            <SelectItem key={platform} value={platform}>
                              {platform}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name={`socials.${index}.value`}
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormControl>
                        <Input
                          placeholder='Username, ID, or Phone'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  onClick={() => remove(index)}
                >
                  <Trash2 className='h-4 w-4' />
                </Button>
              </div>
            ))}
            <Button
              type='button'
              variant='outline'
              size='sm'
              className='mt-2'
              onClick={() => append({ platform: '', value: '' })}
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              Add Social
            </Button>
          </div>
        </div>

        <FormField
          control={form.control}
          name='notes'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <Textarea
                  placeholder='Additional details or notes about the client...'
                  rows={5}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex gap-3 pt-2'>
          <Button type='submit' disabled={isLoading}>
            {isLoading ? 'Loading...' : submitLabel}
          </Button>
          <Button type='button' variant='outline' onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </form>
    </Form>
  );
}
