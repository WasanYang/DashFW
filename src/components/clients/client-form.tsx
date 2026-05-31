'use client';

import React from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormMessage } from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Trash2, HelpCircle } from 'lucide-react';
import { Client, Social } from '@/lib/types';

// Zod validation schema
const schema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  userRole: z.string().default('Client'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  companyName: z.string().optional(),
  role: z.string().optional(),
  manager: z.boolean().default(false),
  inviteToWorkspace: z.boolean().default(false),
  customFields: z
    .array(
      z.object({
        label: z.string().min(1, 'Field name is required'),
        value: z.string().min(1, 'Field value is required'),
      })
    )
    .optional(),
  address: z.string().optional(),
  city_state: z.string().optional(),
  country: z.string().optional(),
  zip: z.string().optional(),
  timezone: z.string().optional(),
  bio: z.string().optional(),
  date_of_birth: z.string().optional(),
});

export type ClientFormValues = z.infer<typeof schema>;

type ClientFormProps = {
  mode: 'create' | 'edit';
  defaultValues?: Partial<Client>;
  onSubmit: (values: Client & { firstName: string; lastName: string }) => void;
  submitLabel: string;
  onCancel: () => void;
  isLoading?: boolean;
};

// Plutio visual style helper classes
const stackedInputClass =
  'flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all';
const labelClass =
  'text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 uppercase tracking-wider select-none mb-0.5';
const inputClass =
  'bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground placeholder:text-muted-foreground/40 w-full h-5';

export function ClientForm({
  mode,
  defaultValues,
  onSubmit,
  submitLabel,
  onCancel,
  isLoading,
}: ClientFormProps) {
  // Parsing defaults from the unstructured client notes field for backwards compatibility
  const fullName = defaultValues?.name || '';
  const firstSpaceIdx = fullName.indexOf(' ');
  let defaultFirstName = defaultValues?.firstName || '';
  let defaultLastName = defaultValues?.lastName || '';
  if (!defaultFirstName && fullName) {
    if (firstSpaceIdx === -1) {
      defaultFirstName = fullName;
    } else {
      defaultFirstName = fullName.substring(0, firstSpaceIdx);
      defaultLastName = fullName.substring(firstSpaceIdx + 1);
    }
  }

  const defaultPhone =
    defaultValues?.phone ||
    defaultValues?.socials?.find((s) => s.platform === 'Phone')?.value ||
    '';

  let defaultCompany = defaultValues?.companyName || '';
  let defaultRole = defaultValues?.role || '';
  let defaultUserRole = defaultValues?.userRole || 'Client';
  let defaultManager = defaultValues?.manager || false;
  let defaultInvite = defaultValues?.inviteToWorkspace || false;
  const defaultCustomFields: { label: string; value: string }[] =
    defaultValues?.customFields || [];

  let defaultAddress = defaultValues?.address || '';
  let defaultCityState = defaultValues?.city_state || '';
  let defaultCountry = defaultValues?.country || '';
  let defaultZip = defaultValues?.zip || '';
  let defaultTimezone = defaultValues?.timezone || 'Asia/Bangkok';
  let defaultBio = defaultValues?.bio || '';
  let defaultDOB = defaultValues?.date_of_birth || '';

  // If missing structured properties, attempt parsing notes
  if (defaultValues?.notes) {
    const lines = defaultValues.notes.split('\n');
    lines.forEach((line) => {
      const lower = line.toLowerCase();
      if (lower.startsWith('company:') && !defaultCompany) {
        defaultCompany = line.substring(8).trim();
      } else if (lower.startsWith('role:') && !defaultRole) {
        defaultRole = line.substring(5).trim();
      } else if (lower.startsWith('user_role:') && defaultUserRole === 'Client') {
        defaultUserRole = line.substring(10).trim();
      } else if (lower.startsWith('manager:')) {
        defaultManager = line.substring(8).trim() === 'true';
      } else if (lower.startsWith('invite_to_workspace:')) {
        defaultInvite = line.substring(20).trim() === 'true';
      } else if (lower.startsWith('custom_field:')) {
        const parts = line.substring(13).split(':');
        if (parts.length >= 2 && defaultCustomFields.length === 0) {
          defaultCustomFields.push({
            label: parts[0],
            value: parts.slice(1).join(':'),
          });
        }
      } else if (lower.startsWith('address:') && !defaultAddress) {
        defaultAddress = line.substring(8).trim();
      } else if (lower.startsWith('city_state:') && !defaultCityState) {
        defaultCityState = line.substring(11).trim();
      } else if (lower.startsWith('country:') && !defaultCountry) {
        defaultCountry = line.substring(8).trim();
      } else if (lower.startsWith('zip:') && !defaultZip) {
        defaultZip = line.substring(4).trim();
      } else if (lower.startsWith('timezone:') && defaultTimezone === 'Asia/Bangkok') {
        defaultTimezone = line.substring(9).trim();
      } else if (lower.startsWith('bio:') && !defaultBio) {
        defaultBio = line.substring(4).trim();
      } else if (lower.startsWith('date_of_birth:') && !defaultDOB) {
        defaultDOB = line.substring(14).trim();
      }
    });
  }

  const form = useForm<ClientFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      firstName: defaultFirstName,
      lastName: defaultLastName,
      userRole: defaultUserRole,
      email: defaultValues?.email || '',
      phone: defaultPhone,
      companyName: defaultCompany,
      role: defaultRole,
      manager: defaultManager,
      inviteToWorkspace: defaultInvite,
      customFields: defaultCustomFields,
      address: defaultAddress,
      city_state: defaultCityState,
      country: defaultCountry,
      zip: defaultZip,
      timezone: defaultTimezone,
      bio: defaultBio,
      date_of_birth: defaultDOB,
    },
  });

  const {
    fields: customFields,
    append: appendCustomField,
    remove: removeCustomField,
  } = useFieldArray({
    control: form.control,
    name: 'customFields',
  });

  const handleFormSubmit = (formValues: ClientFormValues) => {
    // Reconstruct name and compatibility fields
    const newName = `${formValues.firstName} ${formValues.lastName || ''}`.trim();

    // Prepare socials (ensure Phone is added or updated)
    const updatedSocials: Social[] = [...(defaultValues?.socials || [])];
    const phoneIdx = updatedSocials.findIndex((s) => s.platform === 'Phone');
    if (formValues.phone) {
      if (phoneIdx > -1) {
        updatedSocials[phoneIdx] = {
          ...updatedSocials[phoneIdx],
          value: formValues.phone,
        };
      } else {
        updatedSocials.push({
          id: `soc-phone-${Date.now()}`,
          platform: 'Phone',
          value: formValues.phone,
        });
      }
    } else if (phoneIdx > -1) {
      updatedSocials.splice(phoneIdx, 1);
    }

    // Compile compatibility notes block
    const notesLines: string[] = [];
    if (formValues.companyName) {
      notesLines.push(`company: ${formValues.companyName}`);
    }
    if (formValues.role) {
      notesLines.push(`role: ${formValues.role}`);
    }
    if (formValues.userRole) {
      notesLines.push(`user_role: ${formValues.userRole}`);
    }
    if (formValues.phone) {
      notesLines.push(`phone: ${formValues.phone}`);
    }
    notesLines.push(`manager: ${formValues.manager ? 'true' : 'false'}`);
    notesLines.push(
      `invite_to_workspace: ${formValues.inviteToWorkspace ? 'true' : 'false'}`
    );

    if (formValues.customFields && formValues.customFields.length > 0) {
      formValues.customFields.forEach((cf) => {
        notesLines.push(`custom_field:${cf.label}:${cf.value}`);
      });
    }

    if (formValues.address) notesLines.push(`address: ${formValues.address}`);
    if (formValues.city_state) notesLines.push(`city_state: ${formValues.city_state}`);
    if (formValues.country) notesLines.push(`country: ${formValues.country}`);
    if (formValues.zip) notesLines.push(`zip: ${formValues.zip}`);
    if (formValues.timezone) notesLines.push(`timezone: ${formValues.timezone}`);
    if (formValues.bio) notesLines.push(`bio: ${formValues.bio}`);
    if (formValues.date_of_birth) notesLines.push(`date_of_birth: ${formValues.date_of_birth}`);

    // Append original notes (filtering auto-generated fields to prevent duplicates)
    if (defaultValues?.notes) {
      const originalNotes = defaultValues.notes
        .split('\n')
        .filter((line) => {
          const lower = line.toLowerCase();
          return (
            !lower.startsWith('company:') &&
            !lower.startsWith('role:') &&
            !lower.startsWith('user_role:') &&
            !lower.startsWith('phone:') &&
            !lower.startsWith('manager:') &&
            !lower.startsWith('invite_to_workspace:') &&
            !lower.startsWith('custom_field:') &&
            !lower.startsWith('address:') &&
            !lower.startsWith('city_state:') &&
            !lower.startsWith('country:') &&
            !lower.startsWith('zip:') &&
            !lower.startsWith('timezone:') &&
            !lower.startsWith('bio:') &&
            !lower.startsWith('date_of_birth:')
          );
        })
        .join('\n');
      if (originalNotes.trim()) {
        notesLines.push(originalNotes.trim());
      }
    }

    // Submit object
    const submitPayload: Client & { firstName: string; lastName: string } = {
      _id: defaultValues?._id || '',
      name: newName,
      fastwork_link: defaultValues?.fastwork_link || '',
      avatarUrl: defaultValues?.avatarUrl || '',
      email: formValues.email || '',
      socials: updatedSocials,
      notes: notesLines.join('\n'),
      firstName: formValues.firstName,
      lastName: formValues.lastName || '',
      userRole: formValues.userRole,
      phone: formValues.phone || '',
      companyName: formValues.companyName || '',
      role: formValues.role || '',
      manager: formValues.manager,
      inviteToWorkspace: formValues.inviteToWorkspace,
      customFields: formValues.customFields || [],
      address: formValues.address || '',
      city_state: formValues.city_state || '',
      country: formValues.country || '',
      zip: formValues.zip || '',
      timezone: formValues.timezone || '',
      bio: formValues.bio || '',
      date_of_birth: formValues.date_of_birth || '',
    };

    onSubmit(submitPayload);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleFormSubmit)}
        className="space-y-4"
      >
        {/* Name Fields (Side by Side) */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className={stackedInputClass}>
                  <span className={labelClass}>First name*</span>
                  <input
                    className={inputClass}
                    placeholder="Enter first name"
                    {...field}
                  />
                </div>
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className={stackedInputClass}>
                  <span className={labelClass}>Last name</span>
                  <input
                    className={inputClass}
                    placeholder="Enter last name"
                    {...field}
                  />
                </div>
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* User Role (Select Dropdown) */}
        <FormField
          control={form.control}
          name="userRole"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className={`${stackedInputClass} relative pr-10`}>
                <span className={labelClass}>User role</span>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value || 'Client'}
                >
                  <SelectTrigger className="border-none p-0 h-auto bg-transparent focus:ring-0 text-[13px] text-foreground shadow-none">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Client">Client</SelectItem>
                    <SelectItem value="Collaborator">Collaborator</SelectItem>
                    <SelectItem value="Manager">Manager</SelectItem>
                  </SelectContent>
                </Select>
                <HelpCircle className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/60 cursor-help" />
              </div>
              <FormMessage className="text-[11px] mt-1 text-destructive" />
            </FormItem>
          )}
        />

        {/* Email Address */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className={stackedInputClass}>
                <span className={labelClass}>Email address</span>
                <input
                  className={inputClass}
                  type="email"
                  placeholder="name@domain.com"
                  {...field}
                />
              </div>
              <FormMessage className="text-[11px] mt-1 text-destructive" />
            </FormItem>
          )}
        />

        {/* Phone Number */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className={stackedInputClass}>
                <span className={labelClass}>Phone number</span>
                <input
                  className={inputClass}
                  placeholder="Enter phone number"
                  {...field}
                />
              </div>
              <FormMessage className="text-[11px] mt-1 text-destructive" />
            </FormItem>
          )}
        />

        {/* Company & Role (Combined) */}
        <div className="grid grid-cols-[2fr_1fr] border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-[14px] divide-x divide-[#d0d0eb] dark:divide-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
          <FormField
            control={form.control}
            name="companyName"
            render={({ field }) => (
              <FormItem className="space-y-0 p-3 py-2 flex flex-col justify-center">
                <span className={labelClass}>Company name</span>
                <input
                  className={inputClass}
                  placeholder="Company name"
                  {...field}
                />
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="role"
            render={({ field }) => (
              <FormItem className="space-y-0 p-3 py-2 flex flex-col justify-center">
                <span className={labelClass}>Role</span>
                <input className={inputClass} placeholder="Role" {...field} />
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* Dynamic Custom Fields */}
        {customFields.length > 0 && (
          <div className="space-y-3">
            {customFields.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <div className="flex-grow grid grid-cols-[1fr_2fr] border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 rounded-[14px] divide-x divide-[#d0d0eb] dark:divide-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all overflow-hidden">
                  <FormField
                    control={form.control}
                    name={`customFields.${index}.label`}
                    render={({ field }) => (
                      <FormItem className="space-y-0 p-3 py-2 flex flex-col justify-center">
                        <span className={labelClass}>Field Label</span>
                        <input
                          className={inputClass}
                          placeholder="e.g. Birthday"
                          {...field}
                        />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`customFields.${index}.value`}
                    render={({ field }) => (
                      <FormItem className="space-y-0 p-3 py-2 flex flex-col justify-center">
                        <span className={labelClass}>Field Value</span>
                        <input
                          className={inputClass}
                          placeholder="e.g. 12 May"
                          {...field}
                        />
                      </FormItem>
                    )}
                  />
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-10 w-10 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-[14px] border border-dashed border-[#d0d0eb] dark:border-slate-700 shrink-0"
                  onClick={() => removeCustomField(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Custom Field Button */}
        <button
          type="button"
          onClick={() => appendCustomField({ label: '', value: '' })}
          className="w-full flex items-center justify-between border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-muted/50 rounded-[14px] p-3 text-muted-foreground transition-all"
        >
          <div className="flex items-center gap-3 font-semibold text-xs text-[#8b8ba9] dark:text-slate-300">
            <div className="h-4 w-4 rounded-md border border-current flex items-center justify-center text-[10px] font-bold">
              +
            </div>
            <span>Add custom field</span>
          </div>
          <HelpCircle className="h-4 w-4 text-muted-foreground/40" />
        </button>

        {/* Separator - More Options */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-dashed border-[#d0d0eb] dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 select-none uppercase tracking-widest">
            More options
          </span>
          <div className="flex-grow border-t border-dashed border-[#d0d0eb] dark:border-slate-700"></div>
        </div>

        {/* Toggle Controls */}
        <div className="space-y-3 px-1">
          {/* Manager Toggle */}
          <FormField
            control={form.control}
            name="manager"
            render={({ field }) => (
              <FormItem className="space-y-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-[#d0d0eb]/50 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-[13px] font-semibold text-[#2c2c54] dark:text-slate-200">
                    Manager
                  </span>
                </div>
                <HelpCircle className="h-4 w-4 text-muted-foreground/40 cursor-help" />
              </FormItem>
            )}
          />

          {/* Invite Toggle */}
          <FormField
            control={form.control}
            name="inviteToWorkspace"
            render={({ field }) => (
              <FormItem className="space-y-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={field.value || false}
                      onChange={(e) => field.onChange(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-10 h-6 bg-[#d0d0eb]/50 dark:bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                  </label>
                  <span className="text-[13px] font-semibold text-[#2c2c54] dark:text-slate-200">
                    Invite to workspace
                  </span>
                </div>
                <HelpCircle className="h-4 w-4 text-muted-foreground/40 cursor-help" />
              </FormItem>
            )}
          />
        </div>

        {/* Separator - Profile & Location */}
        <div className="relative flex py-2 items-center">
          <div className="flex-grow border-t border-dashed border-[#d0d0eb] dark:border-slate-700"></div>
          <span className="flex-shrink mx-4 text-[10px] font-bold text-[#8b8ba9] dark:text-slate-400 select-none uppercase tracking-widest">
            Profile & Location
          </span>
          <div className="flex-grow border-t border-dashed border-[#d0d0eb] dark:border-slate-700"></div>
        </div>

        {/* Address */}
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className={stackedInputClass}>
                <span className={labelClass}>Address</span>
                <input
                  className={inputClass}
                  placeholder="Street address"
                  {...field}
                />
              </div>
              <FormMessage className="text-[11px] mt-1 text-destructive" />
            </FormItem>
          )}
        />

        {/* City/State & Zip (Side by Side) */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="city_state"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className={stackedInputClass}>
                  <span className={labelClass}>City / State</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Bangkok"
                    {...field}
                  />
                </div>
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="zip"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className={stackedInputClass}>
                  <span className={labelClass}>Zip Code</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. 10110"
                    {...field}
                  />
                </div>
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* Country & Timezone (Side by Side) */}
        <div className="grid grid-cols-2 gap-3">
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className={stackedInputClass}>
                  <span className={labelClass}>Country</span>
                  <input
                    className={inputClass}
                    placeholder="e.g. Thailand"
                    {...field}
                  />
                </div>
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem className="space-y-0">
                <div className={stackedInputClass}>
                  <span className={labelClass}>Timezone</span>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value || 'Asia/Bangkok'}
                  >
                    <SelectTrigger className="border-none p-0 h-auto bg-transparent focus:ring-0 text-[13px] text-foreground shadow-none">
                      <SelectValue placeholder="Timezone" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Asia/Bangkok">Asia/Bangkok (GMT+7)</SelectItem>
                      <SelectItem value="UTC">UTC (GMT+0)</SelectItem>
                      <SelectItem value="America/New_York">America/New_York (EST/EDT)</SelectItem>
                      <SelectItem value="Europe/London">Europe/London (GMT/BST)</SelectItem>
                      <SelectItem value="Asia/Tokyo">Asia/Tokyo (GMT+9)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <FormMessage className="text-[11px] mt-1 text-destructive" />
              </FormItem>
            )}
          />
        </div>

        {/* Date of Birth */}
        <FormField
          control={form.control}
          name="date_of_birth"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className={stackedInputClass}>
                <span className={labelClass}>Date of birth</span>
                <input
                  className={inputClass}
                  type="date"
                  placeholder="YYYY-MM-DD"
                  {...field}
                />
              </div>
              <FormMessage className="text-[11px] mt-1 text-destructive" />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem className="space-y-0">
              <div className="flex flex-col border border-[#d0d0eb] dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 rounded-[14px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                <span className={labelClass}>Bio</span>
                <textarea
                  className="bg-transparent border-none p-0 focus:ring-0 focus:outline-none text-[13px] text-foreground placeholder:text-muted-foreground/40 w-full resize-none min-h-[60px]"
                  placeholder="Tell us about yourself..."
                  {...field}
                />
              </div>
              <FormMessage className="text-[11px] mt-1 text-destructive" />
            </FormItem>
          )}
        />

        {/* Submit Actions (only rendered if needed inside modal context) */}
        {mode === 'edit' && (
          <div className="flex gap-3 pt-4 border-t border-border/20">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        )}
        {mode === 'create' && (
          <div className="flex gap-3 pt-4 border-t border-border/20">
            <Button
              type="submit"
              className="flex-1 bg-[#47c947] hover:bg-[#3fb33f] text-white font-bold rounded-xl"
              disabled={isLoading}
            >
              {isLoading ? 'Creating...' : submitLabel}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1 rounded-xl"
            >
              Cancel
            </Button>
          </div>
        )}
      </form>
    </Form>
  );
}
