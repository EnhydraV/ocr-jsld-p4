import { z } from 'zod';

const nameMinLength = 3;
const nameMaxLength = 50;
const descriptionMaxLength = 2500;

export const CreateSessionSchema = z.object({
  name: z.string().min(nameMinLength).max(nameMaxLength),
  date: z.string(),
  description: z.string().max(descriptionMaxLength),
  teacherId: z.number(),
});

export const UpdateSessionSchema = z.object({
  name: z.string().min(nameMinLength).max(nameMaxLength).optional(),
  date: z.string().optional(),
  description: z.string().max(descriptionMaxLength).optional(),
  teacherId: z.number().optional(),
});

export type CreateSessionDto = z.infer<typeof CreateSessionSchema>;
export type UpdateSessionDto = z.infer<typeof UpdateSessionSchema>;

// DTO de sortie : forme de la session exposée par l'API
export interface SessionResponse {
  id: number;
  name: string;
  date: Date;
  description: string;
  teacher: {
    id: number;
    firstName: string;
    lastName: string;
  };
  users: number[];
  createdAt: Date;
  updatedAt: Date;
}
