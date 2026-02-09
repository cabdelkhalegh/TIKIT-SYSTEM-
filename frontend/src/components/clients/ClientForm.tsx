'use client';

import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import type { Client, CreateClientRequest, UpdateClientRequest } from '@/types/client.types';

const contactSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  role: z.string().optional(),
});

const communicationPreferenceSchema = z.object({
  channel: z.enum(['email', 'phone', 'slack', 'teams']),
  value: z.string().min(1, 'Value is required'),
  preferred: z.boolean().optional(),
});

const clientFormSchema = z.object({
  legalCompanyName: z.string().min(1, 'Company legal name is required'),
  brandDisplayName: z.string().min(1, 'Brand name is required'),
  industryVertical: z.string().optional(),
  websiteUrl: z.string().url('Invalid URL').optional(),
  primaryContacts: z.array(contactSchema).min(1, 'At least one primary contact is required'),
  billingContacts: z.array(contactSchema).optional(),
  communicationPreferences: z.array(communicationPreferenceSchema).optional(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormProps {
  client?: Client;
  onSubmit: (data: CreateClientRequest | UpdateClientRequest) => Promise<void>;
  isSubmitting?: boolean;
}

export default function ClientForm({ client, onSubmit, isSubmitting = false }: ClientFormProps) {
  const router = useRouter();
  
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      legalCompanyName: '',
      brandDisplayName: '',
      industryVertical: '',
      websiteUrl: '',
      primaryContacts: [{ name: '', email: '', phone: '', role: '' }],
      billingContacts: [],
      communicationPreferences: [],
    },
  });

  const {
    fields: primaryContactFields,
    append: appendPrimaryContact,
    remove: removePrimaryContact,
  } = useFieldArray({
    control,
    name: 'primaryContacts',
  });

  const {
    fields: billingContactFields,
    append: appendBillingContact,
    remove: removeBillingContact,
  } = useFieldArray({
    control,
    name: 'billingContacts',
  });

  const {
    fields: communicationPreferenceFields,
    append: appendCommunicationPreference,
    remove: removeCommunicationPreference,
  } = useFieldArray({
    control,
    name: 'communicationPreferences',
  });

  useEffect(() => {
    if (client) {
      let primaryContacts = [{ name: '', email: '', phone: '', role: '' }];
      let billingContacts: { name: string; email: string; phone?: string; role?: string }[] = [];
      let communicationPreferences: { channel: 'email' | 'phone' | 'slack' | 'teams'; value: string; preferred?: boolean }[] = [];
      try { primaryContacts = client.primaryContactEmails ? JSON.parse(client.primaryContactEmails) : primaryContacts; } catch { /* fallback to default if JSON is invalid */ }
      try { billingContacts = client.billingContactEmails ? JSON.parse(client.billingContactEmails) : []; } catch { /* fallback to empty if JSON is invalid */ }
      try { communicationPreferences = client.preferredCommChannels ? JSON.parse(client.preferredCommChannels) : []; } catch { /* fallback to empty if JSON is invalid */ }

      reset({
        legalCompanyName: client.legalCompanyName,
        brandDisplayName: client.brandDisplayName,
        industryVertical: client.industryVertical || '',
        websiteUrl: client.websiteUrl || '',
        primaryContacts: primaryContacts.length > 0 
          ? primaryContacts 
          : [{ name: '', email: '', phone: '', role: '' }],
        billingContacts,
        communicationPreferences,
      });
    }
  }, [client, reset]);

  const handleFormSubmit = async (data: ClientFormData) => {
    try {
      const payload: CreateClientRequest | UpdateClientRequest = {
        legalCompanyName: data.legalCompanyName,
        brandDisplayName: data.brandDisplayName,
        industryVertical: data.industryVertical,
        websiteUrl: data.websiteUrl,
        primaryContactEmails: JSON.stringify(data.primaryContacts),
        billingContactEmails: data.billingContacts ? JSON.stringify(data.billingContacts) : undefined,
        preferredCommChannels: data.communicationPreferences ? JSON.stringify(data.communicationPreferences) : undefined,
      };
      await onSubmit(payload);
      toast.success(client ? 'Client updated successfully' : 'Client created successfully');
      router.push('/dashboard/clients');
    } catch (error: any) {
      toast.error(error.message || 'Failed to save client');
    }
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Basic Information */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Basic Information</h2>
        <div className="space-y-4">
          <div>
            <Label htmlFor="legalCompanyName">
              Company Legal Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="legalCompanyName"
              {...register('legalCompanyName')}
              placeholder="Acme Corporation Inc."
              className="mt-1"
            />
            {errors.legalCompanyName && (
              <p className="text-sm text-red-500 mt-1">{errors.legalCompanyName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="brandDisplayName">
              Brand Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="brandDisplayName"
              {...register('brandDisplayName')}
              placeholder="Acme"
              className="mt-1"
            />
            {errors.brandDisplayName && (
              <p className="text-sm text-red-500 mt-1">{errors.brandDisplayName.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="industryVertical">Industry</Label>
            <Input
              id="industryVertical"
              {...register('industryVertical')}
              placeholder="Technology, Fashion, etc."
              className="mt-1"
            />
            {errors.industryVertical && (
              <p className="text-sm text-red-500 mt-1">{errors.industryVertical.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="websiteUrl">Website URL</Label>
            <Input
              id="websiteUrl"
              {...register('websiteUrl')}
              placeholder="https://example.com"
              className="mt-1"
            />
            {errors.websiteUrl && (
              <p className="text-sm text-red-500 mt-1">{errors.websiteUrl.message}</p>
            )}
          </div>
        </div>
      </Card>

      {/* Primary Contacts */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            Primary Contacts <span className="text-red-500">*</span>
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendPrimaryContact({ name: '', email: '', phone: '', role: '' })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        <div className="space-y-4">
          {primaryContactFields.map((field, index) => (
            <Card key={field.id} className="p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-medium">Contact {index + 1}</h3>
                {primaryContactFields.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePrimaryContact(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor={`primaryContacts.${index}.name`}>Name *</Label>
                  <Input
                    id={`primaryContacts.${index}.name`}
                    {...register(`primaryContacts.${index}.name`)}
                    placeholder="John Doe"
                    className="mt-1"
                  />
                  {errors.primaryContacts?.[index]?.name && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.primaryContacts[index]?.name?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`primaryContacts.${index}.email`}>Email *</Label>
                  <Input
                    id={`primaryContacts.${index}.email`}
                    {...register(`primaryContacts.${index}.email`)}
                    placeholder="john@example.com"
                    className="mt-1"
                  />
                  {errors.primaryContacts?.[index]?.email && (
                    <p className="text-sm text-red-500 mt-1">
                      {errors.primaryContacts[index]?.email?.message}
                    </p>
                  )}
                </div>

                <div>
                  <Label htmlFor={`primaryContacts.${index}.phone`}>Phone</Label>
                  <Input
                    id={`primaryContacts.${index}.phone`}
                    {...register(`primaryContacts.${index}.phone`)}
                    placeholder="+1 (555) 123-4567"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor={`primaryContacts.${index}.role`}>Role</Label>
                  <Input
                    id={`primaryContacts.${index}.role`}
                    {...register(`primaryContacts.${index}.role`)}
                    placeholder="Marketing Manager"
                    className="mt-1"
                  />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {errors.primaryContacts && typeof errors.primaryContacts.message === 'string' && (
          <p className="text-sm text-red-500 mt-2">{errors.primaryContacts.message}</p>
        )}
      </Card>

      {/* Billing Contacts */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Billing Contacts</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendBillingContact({ name: '', email: '', phone: '', role: '' })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>

        {billingContactFields.length === 0 ? (
          <p className="text-gray-500 text-sm">No billing contacts added yet.</p>
        ) : (
          <div className="space-y-4">
            {billingContactFields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">Contact {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeBillingContact(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor={`billingContacts.${index}.name`}>Name *</Label>
                    <Input
                      id={`billingContacts.${index}.name`}
                      {...register(`billingContacts.${index}.name`)}
                      placeholder="Jane Smith"
                      className="mt-1"
                    />
                    {errors.billingContacts?.[index]?.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.billingContacts[index]?.name?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`billingContacts.${index}.email`}>Email *</Label>
                    <Input
                      id={`billingContacts.${index}.email`}
                      {...register(`billingContacts.${index}.email`)}
                      placeholder="jane@example.com"
                      className="mt-1"
                    />
                    {errors.billingContacts?.[index]?.email && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.billingContacts[index]?.email?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`billingContacts.${index}.phone`}>Phone</Label>
                    <Input
                      id={`billingContacts.${index}.phone`}
                      {...register(`billingContacts.${index}.phone`)}
                      placeholder="+1 (555) 123-4567"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor={`billingContacts.${index}.role`}>Role</Label>
                    <Input
                      id={`billingContacts.${index}.role`}
                      {...register(`billingContacts.${index}.role`)}
                      placeholder="Finance Manager"
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Communication Preferences */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Communication Preferences</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => appendCommunicationPreference({ channel: 'email', value: '', preferred: false })}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Preference
          </Button>
        </div>

        {communicationPreferenceFields.length === 0 ? (
          <p className="text-gray-500 text-sm">No communication preferences added yet.</p>
        ) : (
          <div className="space-y-4">
            {communicationPreferenceFields.map((field, index) => (
              <Card key={field.id} className="p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium">Preference {index + 1}</h3>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCommunicationPreference(index)}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`communicationPreferences.${index}.channel`}>Channel *</Label>
                    <select
                      id={`communicationPreferences.${index}.channel`}
                      {...register(`communicationPreferences.${index}.channel`)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 mt-1"
                    >
                      <option value="email">Email</option>
                      <option value="phone">Phone</option>
                      <option value="slack">Slack</option>
                      <option value="teams">Teams</option>
                    </select>
                  </div>

                  <div>
                    <Label htmlFor={`communicationPreferences.${index}.value`}>Value *</Label>
                    <Input
                      id={`communicationPreferences.${index}.value`}
                      {...register(`communicationPreferences.${index}.value`)}
                      placeholder="contact@example.com"
                      className="mt-1"
                    />
                    {errors.communicationPreferences?.[index]?.value && (
                      <p className="text-sm text-red-500 mt-1">
                        {errors.communicationPreferences[index]?.value?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex items-end">
                    <label className="flex items-center space-x-2 h-10">
                      <input
                        type="checkbox"
                        {...register(`communicationPreferences.${index}.preferred`)}
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <span className="text-sm">Preferred</span>
                    </label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Form Actions */}
      <div className="flex justify-end gap-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          className="bg-purple-600 hover:bg-purple-700"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>{client ? 'Update Client' : 'Create Client'}</>
          )}
        </Button>
      </div>
    </form>
  );
}
