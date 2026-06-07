// DTO de sortie : forme du teacher exposée par l'API
export interface TeacherResponse {
  id: number;
  firstName: string;
  lastName: string;
  createdAt: Date;
  updatedAt: Date;
}
