import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { BugBash } from '@/types/bug-bash';

const bugBashFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  requirements: z.string().optional(),
  scope: z.string().min(1, 'Scope is required'),
});

type BugBashFormValues = z.infer<typeof bugBashFormSchema>;

interface BugBashFormProps {
  onSubmit: (data: Omit<BugBash, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  initialData?: Partial<BugBash>;
  isSubmitting?: boolean;
}

export function BugBashForm({
  onSubmit,
  onCancel,
  initialData = {},
  isSubmitting = false,
}: BugBashFormProps) {
  // Generate a valid default name that matches the regex /^[a-z0-9-]+$/
  const defaultName = `bugbash-${Date.now().toString(36)}`;
  
  // Prepare initial data with proper types
  const sanitizedInitialData = {
    ...initialData,
    name: initialData?.name ? String(initialData.name).toLowerCase().replace(/[^a-z0-9-]/g, '-') : undefined,
    scope: initialData?.scope ? String(initialData.scope).trim() : 'general',
  };
  
  // Set default values with proper types
  const defaultValues: BugBashFormValues = {
    name: sanitizedInitialData.name || initialData?.title || '',
    requirements: initialData?.description || '',
    scope: sanitizedInitialData.scope || 'functional',
  };
  
  console.log('Form default values:', defaultValues);

  const form = useForm<BugBashFormValues>({
    resolver: zodResolver(bugBashFormSchema),
    defaultValues,
  });

  // Handle form submission
  const handleFormSubmit = async (formData: BugBashFormValues) => {
    console.log('Form submitted with data:', formData);
    
    try {
      // Validate required fields
      const fieldsToValidate: (keyof BugBashFormValues)[] = ['name', 'scope'];
      const validationResult = await form.trigger(fieldsToValidate);
      
      if (!validationResult) {
        console.error('Form validation failed');
        return;
      }
      
      // Prepare the data for submission (matching API format)
      const submissionData: Omit<BugBash, 'id' | 'createdAt' | 'updatedAt'> = {
        name: formData.name,
        title: formData.name, // Use name as title for compatibility
        scope: formData.scope,
        description: formData.requirements || '',
        // Add required fields with defaults
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'planned',
        participants: [],
        createdBy: 'system',
        functional: [],
        performance: [],
        security: [],
      };
      
      console.log('Submitting bug bash data:', submissionData);
      await onSubmit(submissionData);
      
    } catch (error) {
      console.error('Error in form submission:', error);
      throw error;
    }
  };

  // Direct form submission handler for the save button
  const handleFormSubmitClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    const formValues = form.getValues();
    await handleFormSubmit(formValues);
  };

  return (
    <form className="space-y-6">
      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-2">
          <label htmlFor="name" className="block text-sm font-medium">
            Name <span className="text-red-500">*</span>
          </label>
          <Input
            id="name"
            placeholder="e.g., November Functional Test"
            {...form.register('name')}
            className={cn(
              form.formState.errors.name && 'border-red-500 focus-visible:ring-red-500'
            )}
          />
          {form.formState.errors.name && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.name.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="scope" className="block text-sm font-medium">
            Scope <span className="text-red-500">*</span>
          </label>
          <select
            id="scope"
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            {...form.register('scope')}
          >
            <option value="functional">Functional</option>
            <option value="performance">Performance</option>
            <option value="security">Security</option>
            <option value="api">API</option>
          </select>
          {form.formState.errors.scope && (
            <p className="mt-1 text-sm text-red-500">
              {form.formState.errors.scope.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="requirements" className="block text-sm font-medium">
            Requirements
          </label>
          <Textarea
            id="requirements"
            placeholder="e.g., Functional, API, Performance, Security"
            className="min-h-[100px]"
            {...form.register('requirements')}
          />
          <p className="text-xs text-muted-foreground">
            Describe what needs to be tested or the requirements for this bug bash
          </p>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button 
          type="button"
          disabled={isSubmitting}
          onClick={handleFormSubmitClick}
        >
          {isSubmitting ? 'Saving...' : 'Save Bug Bash'}
        </Button>
      </div>
    </form>
  );
}