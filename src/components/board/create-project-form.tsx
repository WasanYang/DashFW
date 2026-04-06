'use client';

import { useForm, useFieldArray, SubmitHandler } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Client, Project, SubTask } from '@/lib/types';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2, PlusCircle, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { useState, useEffect } from 'react';
import { fetchJobTypes } from '@/services/jobTypeClient';
import type { JobType } from '@/app/(protect)/job-types/page';

interface CreateProjectFormProps {
  clients: Client[];
  onSubmit: (data: Omit<Project, 'id' | 'status' | 'revisions'>) => void;
  translations: Record<string, string>;
}

export function CreateProjectForm({
  clients,
  onSubmit,
  translations,
}: CreateProjectFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const FormSchema = z.object({
    title: z.string().min(1, translations.titleRequired),
    clientId: z.string().min(1, translations.clientRequired),
    jobTypeId: z.string().min(1, 'กรุณาเลือกประเภทของงาน'),
    gross_price: z.coerce
      .number()
      .positive({ message: translations.priceRequired }),
    deadline: z.date({ required_error: translations.deadlineRequired }),
    subTasks: z
      .array(
        z.object({
          text: z.string().min(1, 'Sub-task text cannot be empty.'),
        }),
      )
      .optional(),
  });

  type FormValues = z.infer<typeof FormSchema>;

  const [jobTypes, setJobTypes] = useState<JobType[]>([]);

  useEffect(() => {
    fetchJobTypes().then(setJobTypes);
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      title: '',
      clientId: '',
      jobTypeId: '',
      gross_price: undefined,
      subTasks: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'subTasks',
  });

  const handleFormSubmit: SubmitHandler<FormValues> = (data) => {
    setIsSubmitting(true);
    const subTasks: SubTask[] | undefined = data.subTasks?.map((st, index) => ({
      id: `sub-${Date.now()}-${index}`,
      text: st.text,
      completed: false,
    }));

    onSubmit({
      title: data.title,
      clientId: data.clientId,
      jobTypeId: data.jobTypeId,
      gross_price: data.gross_price,
      deadline: data.deadline,
      subTasks: subTasks,
    });
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className='space-y-4 py-4'
      >
        <FormField
          control={form.control}
          name='title'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.titleLabel}</FormLabel>
              <FormControl>
                <Input placeholder='e.g., Website Redesign' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='clientId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>{translations.clientLabel}</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue
                      placeholder={translations.selectClientPlaceholder}
                    />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client._id} value={client._id}>
                      {client.name}
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
          name='jobTypeId'
          render={({ field }) => (
            <FormItem>
              <FormLabel>ประเภทของงาน</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder='เลือกประเภทของงาน' />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {jobTypes.map((jt) => (
                    <SelectItem key={jt._id} value={jt._id!}>
                      {jt.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className='grid grid-cols-2 gap-4'>
          <FormField
            control={form.control}
            name='gross_price'
            render={({ field }) => (
              <FormItem>
                <FormLabel>{translations.priceLabel}</FormLabel>
                <FormControl>
                  <Input type='number' placeholder='500' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='deadline'
            render={({ field }) => (
              <FormItem className='flex flex-col mt-2'>
                <FormLabel>{translations.deadlineLabel}</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={'outline'}
                        className={cn(
                          'pl-3 text-left font-normal',
                          !field.value && 'text-muted-foreground',
                        )}
                      >
                        {field.value ? (
                          format(field.value, 'PPP')
                        ) : (
                          <span>{translations.pickDatePlaceholder}</span>
                        )}
                        <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={field.value}
                      onSelect={field.onChange}
                      disabled={(date) => date < new Date()}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <div>
          <FormLabel>{translations.subtasksLabel}</FormLabel>
          <div className='space-y-2 mt-2'>
            {fields.map((field, index) => (
              <div key={field.id} className='flex items-center gap-2'>
                <FormField
                  control={form.control}
                  name={`subTasks.${index}.text`}
                  render={({ field }) => (
                    <FormItem className='flex-grow'>
                      <FormControl>
                        <Input
                          placeholder={`Sub-task ${index + 1}`}
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
              onClick={() => append({ text: '' })}
            >
              <PlusCircle className='mr-2 h-4 w-4' />
              {translations.addSubtask}
            </Button>
          </div>
        </div>

        <Button type='submit' disabled={isSubmitting} className='w-full'>
          {isSubmitting ? (
            <Loader2 className='mr-2 h-4 w-4 animate-spin' />
          ) : null}
          {isSubmitting
            ? translations.creatingProjectButton
            : translations.createProjectButton}
        </Button>
      </form>
    </Form>
  );
}
