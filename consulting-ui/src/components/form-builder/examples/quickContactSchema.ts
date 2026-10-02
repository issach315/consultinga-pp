import type { FormSchema } from '../schema.types';

/**
 * Schema-only demo (no live submit) — shows off single-page mode, section
 * cards, showWhen conditionals, and a repeater, distinct from the deep
 * multi-step tenant example.
 */
export interface QuickContactFormValues {
  requester: { name: string; email: string };
  category: string;
  priority: string;
  hasAttachment: boolean;
  attachments?: unknown[];
  description: string;
  additionalContacts: { name: string; email: string }[];
  agreeToTerms: boolean;
}

export const quickContactSchema: FormSchema = {
  id: 'quick-contact-demo',
  title: 'Support request (schema-only demo)',
  sections: [
    {
      id: 'details',
      title: 'Your details',
      layout: 'card',
      fields: [
        {
          type: 'text',
          name: 'requester.name',
          label: 'Full name',
          grid: { xs: 12, sm: 6 },
          validation: { required: true },
        },
        {
          type: 'email',
          name: 'requester.email',
          label: 'Email',
          grid: { xs: 12, sm: 6 },
          validation: { required: true },
        },
        {
          type: 'select',
          name: 'category',
          label: 'Category',
          grid: { xs: 12, sm: 6 },
          validation: { required: true },
          options: [
            { label: 'Billing', value: 'billing' },
            { label: 'Technical issue', value: 'technical' },
            { label: 'Feature request', value: 'feature' },
            { label: 'Other', value: 'other' },
          ],
        },
        {
          type: 'radio',
          name: 'priority',
          label: 'Priority',
          grid: { xs: 12, sm: 6 },
          validation: { required: true },
          options: [
            { label: 'Low', value: 'low' },
            { label: 'Normal', value: 'normal' },
            { label: 'High', value: 'high' },
          ],
        },
      ],
    },
    {
      id: 'attachment-section',
      title: 'Attachment',
      layout: 'card',
      fields: [
        { type: 'switch', name: 'hasAttachment', label: 'I want to attach a file', grid: { xs: 12 } },
        {
          type: 'fileUpload',
          name: 'attachments',
          label: 'Attachments',
          grid: { xs: 12 },
          accept: '.png,.jpg,.pdf',
          maxSizeBytes: 2 * 1024 * 1024,
          multiple: true,
          showWhen: { field: 'hasAttachment', operator: 'truthy' },
        },
      ],
    },
    {
      id: 'description-section',
      title: 'Description',
      layout: 'card',
      fields: [
        {
          type: 'textarea',
          name: 'description',
          label: 'What do you need help with?',
          grid: { xs: 12 },
          rows: 4,
          validation: { required: true, minLength: 10 },
        },
      ],
    },
    {
      id: 'contacts-section',
      title: 'Additional contacts',
      description: 'Anyone else we should loop in on this request? (up to 5)',
      layout: 'card',
      fields: [
        {
          type: 'repeater',
          name: 'additionalContacts',
          itemLabel: 'Contact',
          maxItems: 5,
          grid: { xs: 12 },
          fields: [
            { type: 'text', name: 'name', label: 'Name', grid: { xs: 12, sm: 6 }, validation: { required: true } },
            { type: 'email', name: 'email', label: 'Email', grid: { xs: 12, sm: 6 }, validation: { required: true } },
          ],
        },
      ],
    },
    {
      id: 'confirm-section',
      layout: 'plain',
      fields: [
        {
          type: 'checkbox',
          name: 'agreeToTerms',
          label: 'I agree this request may be shared with our support team.',
          grid: { xs: 12 },
          validation: { required: true },
        },
      ],
    },
  ],
};
