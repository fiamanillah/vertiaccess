import * as z from 'zod'

export const notificationFormSchema = z.object({
  type: z.enum(['info', 'warning', 'success', 'error'], {
    required_error: 'Please select a notification type.',
  }),
  title: z.string().min(1, 'Title is required.').max(100, 'Title cannot exceed 100 characters.'),
  message: z.string().min(1, 'Message is required.').max(1000, 'Message cannot exceed 1000 characters.'),
  actionUrl: z
    .string()
    .url('Please enter a valid URL (e.g. https://example.com).')
    .optional()
    .or(z.literal('')),
})

export type NotificationFormValues = z.infer<typeof notificationFormSchema>
