// DTO de sortie : forme de l'utilisateur exposée par l'API (jamais le password)
export interface UserResponse {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  admin: boolean;
  createdAt: Date;
  updatedAt: Date;
}
