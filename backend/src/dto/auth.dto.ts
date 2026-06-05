import { z } from 'zod';

const minPasswordLength = 8;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(minPasswordLength),
});

export const RegisterSchema = z.object({
  email: z.string().email(),
  firstName: z.string().min(2).max(20),
  lastName: z.string().min(2).max(20),
  password: z.string().min(minPasswordLength),
});

export type LoginDto = z.infer<typeof LoginSchema>;
export type RegisterDto = z.infer<typeof RegisterSchema>;
