import { z } from 'zod'

export const createAircraftSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required'),
    droneModel: z.string().trim().min(1, 'Drone model is required'),
    manufacturer: z.string().trim().min(1, 'Manufacturer is required'),
    airframe: z.enum([
      'Fixed-Wing',
      'Rotary',
      'Hybrid',
      'Fixed-Wing, Rotary or Hybrid',
    ]),
    mtow: z.string().trim().min(1, 'MTOW is required'),
    serialNumber: z.string().trim().nullable().optional(),
    registrationNumber: z.string().trim().nullable().optional(),
    icaoAddress: z.string().trim().nullable().optional(),
  }),
}

export type CreateAircraftDTO = z.infer<typeof createAircraftSchema.body>

export const updateAircraftSchema = {
  body: z.object({
    name: z.string().trim().min(1, 'Name is required').optional(),
    droneModel: z.string().trim().min(1, 'Drone model is required').optional(),
    manufacturer: z
      .string()
      .trim()
      .min(1, 'Manufacturer is required')
      .optional(),
    airframe: z
      .enum(['Fixed-Wing', 'Rotary', 'Hybrid', 'Fixed-Wing, Rotary or Hybrid'])
      .optional(),
    mtow: z.string().trim().min(1, 'MTOW is required').optional(),
    serialNumber: z.string().trim().nullable().optional(),
    registrationNumber: z.string().trim().nullable().optional(),
    icaoAddress: z.string().trim().nullable().optional(),
  }),
}

export type UpdateAircraftDTO = z.infer<typeof updateAircraftSchema.body>
