import { z } from 'zod';

export const clientSchema = z.object({
  companyName: z.string().trim().min(2, 'Company name is required').max(255),
  companyType: z.enum([
    'PRIVATE_LIMITED',
    'PUBLIC_LIMITED',
    'LLP',
    'PARTNERSHIP',
    'SOLE_PROPRIETORSHIP',
    'GOVERNMENT',
    'NON_PROFIT',
    'OTHER',
  ]),
  industry: z.string().trim().max(120).optional(),
  contactPersonName: z.string().trim().min(2, 'Contact person is required').max(150),
  contactPersonEmail: z.string().trim().email('Enter a valid email address'),
  contactPersonPhone: z.string().trim().max(30).optional(),
  designation: z.string().trim().max(120).optional(),
  website: z
    .string()
    .trim()
    .refine((value) => !value || /^https?:\/\//i.test(value), 'Website must start with http:// or https://')
    .optional(),
  address: z.string().trim().max(1000).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  country: z.string().trim().max(100).optional(),
  postalCode: z.string().trim().max(20).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  notes: z.string().trim().max(2000).optional(),
});

export type ClientFormValues = z.infer<typeof clientSchema>;
